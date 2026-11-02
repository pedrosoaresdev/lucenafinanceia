package com.lucenafinance.api.banking;

import com.fasterxml.jackson.databind.JsonNode;
import com.lucenafinance.api.transactions.FinancialTransaction;
import com.lucenafinance.api.transactions.FinancialTransactionRepository;
import com.lucenafinance.api.transactions.TransactionKind;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/banking")
public class BankingController {
    private final PluggyClient pluggy;
    private final BankConnectionRepository connections;
    private final FinancialTransactionRepository transactions;
    private final String provider;
    private final String baseUrl;

    public BankingController(PluggyClient pluggy, BankConnectionRepository connections,
                             FinancialTransactionRepository transactions,
                             @Value("${app.open-finance.provider:}") String provider,
                             @Value("${app.open-finance.api-url:https://api.pluggy.ai}") String baseUrl) {
        this.pluggy = pluggy; this.connections = connections; this.transactions = transactions;
        this.provider = provider; this.baseUrl = baseUrl;
    }

    @PostMapping("/connect-token")
    public Map<String, String> connectToken(@AuthenticationPrincipal Jwt user) {
        requireConfigured();
        JsonNode token = pluggy.post("/connect_token", Map.of("options", Map.of(
                "clientUserId", user.getSubject(), "avoidDuplicates", true,
                "products", List.of("ACCOUNTS", "TRANSACTIONS", "CREDIT_CARDS", "INVESTMENTS"))));
        return Map.of("provider", "pluggy", "accessToken", token.path("accessToken").asText(), "theme", "dark");
    }

    @PostMapping("/connections")
    public ConnectionResponse addConnection(@Valid @RequestBody AddConnectionRequest request,
                                            @AuthenticationPrincipal Jwt user) {
        requireConfigured();
        JsonNode item = pluggy.get("/items/" + request.itemId());
        if (!user.getSubject().equals(item.path("clientUserId").asText())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "item_not_owned_by_user");
        }
        String institution = item.path("connector").path("name").asText("Instituição financeira");
        String status = item.path("executionStatus").asText(item.path("status").asText("CONNECTED"));
        BankConnection saved = connections.save(new BankConnection(request.itemId(), user.getSubject(), institution,
                status, item.path("isSandbox").asBoolean(false), null));
        int imported = synchronize(saved);
        return new ConnectionResponse(saved.getItemId(), saved.getInstitution(), saved.getStatus(), saved.isSandbox(), saved.getLastSyncedAt(), imported);
    }

    @GetMapping("/connections")
    public List<ConnectionResponse> listConnections(@AuthenticationPrincipal Jwt user) {
        return connections.findByOwnerUidOrderByInstitutionAsc(user.getSubject()).stream()
                .map(connection -> new ConnectionResponse(connection.getItemId(), connection.getInstitution(),
                        connection.getStatus(), connection.isSandbox(), connection.getLastSyncedAt(), 0)).toList();
    }

    @PostMapping("/connections/{itemId}/sync")
    public ConnectionResponse sync(@PathVariable @Pattern(regexp = "[a-fA-F0-9-]{36}") String itemId,
                                   @AuthenticationPrincipal Jwt user) {
        BankConnection connection = connections.findByItemIdAndOwnerUid(itemId, user.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "connection_not_found"));
        int imported = synchronize(connection);
        return new ConnectionResponse(connection.getItemId(), connection.getInstitution(), connection.getStatus(), connection.isSandbox(), connection.getLastSyncedAt(), imported);
    }

    @DeleteMapping("/connections/{itemId}")
    public void disconnect(@PathVariable @Pattern(regexp = "[a-fA-F0-9-]{36}") String itemId,
                           @AuthenticationPrincipal Jwt user) {
        requireConfigured();
        BankConnection connection = connections.findByItemIdAndOwnerUid(itemId, user.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "connection_not_found"));
        pluggy.delete("/items/" + itemId);
        transactions.deleteByOwnerUidAndSourceAndProviderItemId(user.getSubject(), "OPEN_FINANCE", itemId);
        transactions.deleteByOwnerUidAndSourceAndProviderItemId(user.getSubject(), "OPEN_FINANCE_SANDBOX", itemId);
        connections.delete(connection);
    }

    private int synchronize(BankConnection connection) {
        JsonNode accountPage = pluggy.get("/accounts?itemId=" + connection.getItemId());
        JsonNode accounts = accountPage.path("results");
        int imported = 0;
        int total = 0;
        for (JsonNode account : accounts) {
            String accountId = account.path("id").asText();
            if (accountId.isBlank()) continue;
            URI next = URI.create(baseUrl + "/v2/transactions?accountId=" + accountId);
            for (int page = 0; page < 20 && next != null && total < 5000; page++) {
                JsonNode transactionPage = pluggy.get(next);
                JsonNode results = transactionPage.path("results");
                for (JsonNode item : results) {
                    total++;
                    if (importTransaction(item, connection)) imported++;
                    if (total >= 5000) break;
                }
                String cursor = transactionPage.path("next").asText("");
                next = cursor.isBlank() || !cursor.startsWith("?") ? null : URI.create(baseUrl + "/v2/transactions" + cursor);
            }
        }
        JsonNode item = pluggy.get("/items/" + connection.getItemId());
        connection.setStatus(item.path("executionStatus").asText(item.path("status").asText("CONNECTED")));
        connection.setLastSyncedAt(Instant.now());
        connections.save(connection);
        return imported;
    }

    private boolean importTransaction(JsonNode providerTransaction, BankConnection connection) {
        String ownerUid = connection.getOwnerUid();
        String source = connection.isSandbox() ? "OPEN_FINANCE_SANDBOX" : "OPEN_FINANCE";
        String externalId = providerTransaction.path("id").asText("");
        if (externalId.isBlank() || transactions.existsByOwnerUidAndSourceAndExternalReference(ownerUid, source, externalId)) return false;
        double amount = providerTransaction.path("amount").asDouble(0);
        String currency = providerTransaction.path("currencyCode").asText("BRL").toUpperCase();
        if (amount == 0 || !List.of("BRL", "USD", "EUR").contains(currency)) return false;
        Instant occurredAt;
        try { occurredAt = Instant.parse(providerTransaction.path("date").asText()); }
        catch (Exception e) { return false; }
        String description = providerTransaction.path("description").asText(providerTransaction.path("descriptionRaw").asText("Movimentação bancária"));
        String category = normalizeCategory(providerTransaction.path("category").asText("Outros"));
        var record = new FinancialTransaction(ownerUid, description, Math.round(Math.abs(amount) * 100), currency,
                amount < 0 ? TransactionKind.EXPENSE : TransactionKind.INCOME, category, occurredAt,
                externalId, connection.getItemId(), connection.isSandbox(), Instant.now());
        transactions.save(record);
        return true;
    }

    private String normalizeCategory(String providerCategory) {
        String value = providerCategory.toLowerCase(java.util.Locale.ROOT);
        if (value.contains("supermarket") || value.contains("grocer") || value.contains("market")) return "Supermercado";
        if (value.contains("restaurant") || value.contains("food") || value.contains("meal")) return "Alimentação";
        if (value.contains("transport") || value.contains("fuel") || value.contains("gas station")) return "Transporte";
        if (value.contains("health") || value.contains("pharmacy")) return "Saúde";
        if (value.contains("rent") || value.contains("home") || value.contains("utility")) return "Moradia";
        if (value.contains("education")) return "Educação";
        if (value.contains("leisure") || value.contains("entertainment")) return "Lazer";
        return providerCategory.length() > 80 ? providerCategory.substring(0, 80) : providerCategory;
    }

    private void requireConfigured() {
        if (!"pluggy".equalsIgnoreCase(provider) || !pluggy.configured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "open_finance_not_configured");
        }
    }

    public record AddConnectionRequest(@NotBlank @Pattern(regexp = "[a-fA-F0-9-]{36}") String itemId) {}
    public record ConnectionResponse(String itemId, String institution, String status, boolean sandbox, Instant lastSyncedAt, int newTransactionsImported) {}
}
