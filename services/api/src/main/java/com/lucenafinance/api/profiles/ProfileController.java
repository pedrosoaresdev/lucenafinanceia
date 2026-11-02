package com.lucenafinance.api.profiles;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/profiles/me")
public class ProfileController {
    private final FinancialProfileRepository profiles;
    private final ProfileCryptoService crypto;

    public ProfileController(FinancialProfileRepository profiles, ProfileCryptoService crypto) {
        this.profiles = profiles;
        this.crypto = crypto;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@Valid @RequestBody ProfileRequest request, @AuthenticationPrincipal Jwt user) {
        String cpf = new ObjetoCpf(request.cpf()).valor();
        new ObjetoDataDeNascimento(request.dateOfBirth());
        profiles.save(new FinancialProfile(user.getSubject(), crypto.encrypt(request.fullName().trim()), crypto.encrypt(cpf),
                crypto.encrypt(request.dateOfBirth().toString()), Instant.now()));
    }
}
