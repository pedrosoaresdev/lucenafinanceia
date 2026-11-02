package com.lucenafinance.api.banking;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.Map;

@Service
public class PluggyClient {
    private final RestClient client;
    private final String clientId;
    private final String clientSecret;
    private volatile String apiKey;
    private volatile long apiKeyExpiresAt;

    public PluggyClient(RestClient.Builder builder,
                        @Value("${app.open-finance.api-url:https://api.pluggy.ai}") String apiUrl,
                        @Value("${app.open-finance.client-id:}") String clientId,
                        @Value("${app.open-finance.client-secret:}") String clientSecret) {
        this.client = builder.baseUrl(apiUrl).build();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public boolean configured() { return !clientId.isBlank() && !clientSecret.isBlank(); }

    public JsonNode get(String path) {
        return client.get().uri(path).header("X-API-KEY", apiKey()).retrieve().body(JsonNode.class);
    }

    public JsonNode get(URI uri) {
        return client.get().uri(uri).header("X-API-KEY", apiKey()).retrieve().body(JsonNode.class);
    }

    public JsonNode post(String path, Object body) {
        return client.post().uri(path).header("X-API-KEY", apiKey()).body(body).retrieve().body(JsonNode.class);
    }

    public void delete(String path) {
        client.delete().uri(path).header("X-API-KEY", apiKey()).retrieve().toBodilessEntity();
    }

    private String apiKey() {
        if (apiKey != null && System.currentTimeMillis() < apiKeyExpiresAt) return apiKey;
        synchronized (this) {
            if (apiKey != null && System.currentTimeMillis() < apiKeyExpiresAt) return apiKey;
            if (!configured()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "open_finance_not_configured");
            try {
                JsonNode response = client.post().uri("/auth").body(Map.of("clientId", clientId, "clientSecret", clientSecret))
                        .retrieve().body(JsonNode.class);
                String freshKey = response == null ? "" : response.path("apiKey").asText("");
                if (freshKey.isBlank()) throw new IllegalStateException("Pluggy did not return an API key");
                apiKey = freshKey;
                apiKeyExpiresAt = System.currentTimeMillis() + 110 * 60 * 1000L;
                return apiKey;
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "open_finance_provider_unavailable");
            }
        }
    }
}
