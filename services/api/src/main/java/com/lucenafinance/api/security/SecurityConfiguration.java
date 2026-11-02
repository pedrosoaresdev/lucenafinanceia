package com.lucenafinance.api.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.web.SecurityFilterChain;
import java.time.Instant;

@Configuration
public class SecurityConfiguration {
    private static final String FIREBASE_KEYS = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

    @Bean
    JwtDecoder firebaseJwtDecoder(@Value("${app.firebase.project-id}") String projectId) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(FIREBASE_KEYS).build();
        OAuth2TokenValidator<Jwt> issuer = JwtValidators.createDefaultWithIssuer("https://securetoken.google.com/" + projectId);
        OAuth2TokenValidator<Jwt> audience = jwt -> jwt.getAudience().contains(projectId)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Invalid Firebase audience", null));
        OAuth2TokenValidator<Jwt> subject = jwt -> jwt.getSubject() != null && !jwt.getSubject().isBlank()
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Token subject is required", null));
        OAuth2TokenValidator<Jwt> authTime = jwt -> {
            Object claim = jwt.getClaims().get("auth_time");
            return claim instanceof Number value && value.longValue() <= Instant.now().getEpochSecond()
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Invalid auth_time", null));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(issuer, audience, subject, authTime));
        return decoder;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder firebaseJwtDecoder) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/api/v1/banking/status", "/api/v1/billing/plans", "/api/v1/billing/webhooks/asaas").permitAll()
                        .requestMatchers("/api/v1/profiles/me").authenticated()
                        .requestMatchers("/api/v1/**").access((authentication, context) -> {
                            Object principal = authentication.get().getPrincipal();
                            return new AuthorizationDecision(principal instanceof Jwt jwt
                                    && Boolean.TRUE.equals(jwt.getClaim("email_verified")));
                        })
                        .anyRequest().permitAll())
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.decoder(firebaseJwtDecoder)));
        return http.build();
    }
}
