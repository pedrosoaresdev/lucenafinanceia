package com.lucenafinance.api.billing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {
    private final BillingService billing;

    public BillingController(BillingService billing) { this.billing = billing; }

    @GetMapping("/plans")
    public Map<String, Object> plans() { return billing.plans(); }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt user) { return billing.currentPlan(user.getSubject()); }

    @PostMapping("/checkout")
    public Map<String, String> checkout(@Valid @RequestBody CheckoutRequest request,
                                        @AuthenticationPrincipal Jwt user) {
        return billing.createCheckout(user, request.plan(), request.cycle());
    }

    @PostMapping("/webhooks/asaas")
    public void webhook(@org.springframework.web.bind.annotation.RequestHeader(value = "asaas-access-token", required = false) String token,
                        @RequestBody String body) {
        billing.processWebhook(token, body);
    }

    public record CheckoutRequest(@NotBlank String plan, @NotBlank String cycle) {}
}
