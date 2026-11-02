package com.lucenafinance.api.banking;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/banking")
public class BankingProviderStatus {
    private final String provider;
    private final boolean configured;
    private final boolean sandbox;

    public BankingProviderStatus(@Value("${app.open-finance.provider:}") String provider,
                                 @Value("${app.open-finance.client-id:}") String clientId,
                                 @Value("${app.open-finance.client-secret:}") String clientSecret,
                                 @Value("${app.open-finance.include-sandbox:false}") boolean sandbox) {
        this.provider = provider.isBlank() ? "not-configured" : provider;
        this.configured = "pluggy".equalsIgnoreCase(provider) && !clientId.isBlank() && !clientSecret.isBlank();
        this.sandbox = sandbox;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("provider", provider, "configured", configured,
                "connectionCreationAvailable", configured, "includeSandbox", sandbox,
                "message", configured ? (sandbox ? "Pluggy sandbox is enabled." : "Pluggy is ready for bank connections.") : "Configure Pluggy credentials on the server to enable Open Finance.");
    }
}
