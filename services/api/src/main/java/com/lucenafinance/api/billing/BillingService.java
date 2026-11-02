package com.lucenafinance.api.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BillingService {
    private static final ZoneId BRAZIL = ZoneId.of("America/Fortaleza");
    private static final Map<String, Plan> PLANS = Map.of(
            "BRONZE", new Plan("Bronze", 1999, 19670, 7),
            "OURO", new Plan("Ouro", 15900, 156456, 15));

    private final JdbcTemplate db;
    private final ObjectMapper mapper;
    private final RestClient asaas;
    private final String apiKey;
    private final String webhookToken;
    private final String publicUrl;
    private final String baseUrl;

    public BillingService(JdbcTemplate db, ObjectMapper mapper, RestClient.Builder builder,
                          @Value("${app.billing.asaas.api-key:}") String apiKey,
                          @Value("${app.billing.asaas.webhook-token:}") String webhookToken,
                          @Value("${app.billing.asaas.base-url:https://api.asaas.com/v3}") String baseUrl,
                          @Value("${app.billing.asaas.public-url:http://localhost:4200}") String publicUrl) {
        this.db = db;
        this.mapper = mapper;
        this.apiKey = apiKey;
        this.webhookToken = webhookToken;
        this.publicUrl = publicUrl.replaceAll("/$", "");
        this.baseUrl = baseUrl.replaceAll("/$", "");
        this.asaas = builder.baseUrl(baseUrl).defaultHeader("access_token", apiKey)
                .defaultHeader("User-Agent", "LucenaFinance/1.0").build();
    }

    public Map<String, Object> plans() {
        return Map.of("provider", "Asaas", "configured", configured(), "currency", "BRL", "plans", List.of(
                Map.of("code", "GRATUITO", "name", "Gratuito", "agents", 2, "monthlyMinor", 0),
                planPayload("BRONZE"), planPayload("OURO")));
    }

    private Map<String, Object> planPayload(String code) {
        Plan plan = PLANS.get(code);
        return Map.of("code", code, "name", plan.name, "agents", plan.agents,
                "monthlyMinor", plan.monthlyMinor, "annualMinor", plan.annualMinor,
                "annualSavingsMinor", plan.monthlyMinor * 12L - plan.annualMinor);
    }

    public Map<String, Object> currentPlan(String uid) {
        var rows = db.query("SELECT plan_code, billing_cycle, state, access_until FROM billing_checkout_intents " +
                        "WHERE owner_uid = ? AND state = 'ACTIVE' ORDER BY access_until DESC LIMIT 1",
                (rs, row) -> new CurrentPlan(rs.getString("plan_code"), rs.getString("billing_cycle"),
                        rs.getString("state"), rs.getTimestamp("access_until").toInstant()), uid);
        if (rows.isEmpty() || !rows.getFirst().accessUntil.isAfter(Instant.now())) {
            return Map.of("code", "GRATUITO", "name", "Gratuito", "agents", 2, "active", true,
                    "provider", "Asaas", "configured", configured());
        }
        CurrentPlan plan = rows.getFirst();
        return Map.of("code", plan.planCode, "name", PLANS.get(plan.planCode).name,
                "cycle", plan.cycle, "agents", PLANS.get(plan.planCode).agents, "active", true,
                "provider", "Asaas", "accessUntil", plan.accessUntil.toString());
    }

    public Map<String, String> createCheckout(Jwt user, String requestedPlan, String requestedCycle) {
        if (!configured()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "asaas_not_configured");
        String planCode = requestedPlan.toUpperCase(java.util.Locale.ROOT);
        String cycle = requestedCycle.toUpperCase(java.util.Locale.ROOT);
        Plan plan = PLANS.get(planCode);
        if (plan == null || !List.of("MONTHLY", "YEARLY").contains(cycle)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_plan_or_cycle");
        }
        String email = user.getClaimAsString("email");
        if (email == null || email.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "verified_email_required");

        UUID id = UUID.randomUUID();
        String externalReference = "lf-" + id;
        long amountMinor = cycle.equals("YEARLY") ? plan.annualMinor : plan.monthlyMinor;
        db.update("INSERT INTO billing_checkout_intents (id, owner_uid, plan_code, billing_cycle, amount_minor, " +
                        "external_reference, state, created_at) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)",
                id, user.getSubject(), planCode, cycle, amountMinor, externalReference, Instant.now());

        LocalDate firstPayment = LocalDate.now(BRAZIL).plusDays(1);
        Map<String, Object> body = Map.of(
                "billingTypes", List.of("CREDIT_CARD"),
                "chargeTypes", List.of("RECURRENT"),
                "minutesToExpire", 1440,
                "externalReference", externalReference,
                "callback", Map.of("successUrl", publicUrl + "/?billing=return",
                        "cancelUrl", publicUrl + "/?billing=cancelled", "expiredUrl", publicUrl + "/?billing=expired"),
                "items", List.of(Map.of("name", "Lucena Finance " + plan.name,
                        "description", "Assinatura " + plan.name + " · " + (cycle.equals("YEARLY") ? "anual" : "mensal"),
                        "quantity", 1, "value", amountMinor / 100.0)),
                "customerData", Map.of("name", user.getClaimAsString("name") == null ? email : user.getClaimAsString("name"),
                        "email", email),
                "subscription", Map.of("cycle", cycle, "nextDueDate", firstPayment.toString()));
        try {
            JsonNode response = asaas.post().uri("/checkouts").body(body).retrieve().body(JsonNode.class);
            String checkoutId = response == null ? "" : response.path("id").asText("");
            if (checkoutId.isBlank()) throw new IllegalStateException("Asaas não retornou o identificador do checkout.");
            db.update("UPDATE billing_checkout_intents SET checkout_id = ? WHERE id = ?", checkoutId, id);
            return Map.of("checkoutUrl", "https://asaas.com/checkoutSession/show?id=" + checkoutId,
                    "checkoutId", checkoutId, "state", "PENDING");
        } catch (Exception error) {
            db.update("UPDATE billing_checkout_intents SET state = 'CANCELED' WHERE id = ?", id);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "asaas_checkout_creation_failed");
        }
    }

    @Transactional
    public void processWebhook(String token, String body) {
        if (webhookToken == null || webhookToken.isBlank() || token == null || !constantTimeEquals(webhookToken, token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_asaas_webhook_token");
        }
        try {
            JsonNode event = mapper.readTree(body);
            String eventId = event.path("id").asText("");
            String type = event.path("event").asText("");
            if (eventId.isBlank() || type.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_asaas_event");
            int inserted = db.update("INSERT INTO billing_webhook_events(event_id, event_type, received_at) VALUES (?, ?, ?) " +
                    "ON CONFLICT (event_id) DO NOTHING", eventId, type, Instant.now());
            if (inserted == 0) return;

            if (type.equals("CHECKOUT_PAID")) {
                String checkoutId = event.path("checkout").path("id").asText("");
                activateFirstPayment(checkoutId);
            } else if (type.equals("CHECKOUT_CANCELED") || type.equals("CHECKOUT_EXPIRED")) {
                String checkoutId = event.path("checkout").path("id").asText("");
                db.update("UPDATE billing_checkout_intents SET state = ? WHERE checkout_id = ? AND state = 'PENDING'",
                        type.endsWith("CANCELED") ? "CANCELED" : "EXPIRED", checkoutId);
            } else if (type.equals("SUBSCRIPTION_CREATED")) {
                JsonNode sub = event.path("subscription");
                db.update("UPDATE billing_checkout_intents SET provider_subscription_id = ? WHERE external_reference = ?",
                        sub.path("id").asText(), sub.path("externalReference").asText());
            } else if (type.equals("PAYMENT_CONFIRMED") || type.equals("PAYMENT_RECEIVED")) {
                applyRenewal(event.path("payment"));
            }
        } catch (ResponseStatusException error) {
            throw error;
        } catch (Exception error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_asaas_event");
        }
    }

    private void activateFirstPayment(String checkoutId) {
        var rows = db.query("SELECT id, billing_cycle FROM billing_checkout_intents WHERE checkout_id = ? AND state = 'PENDING' FOR UPDATE",
                (rs, row) -> new Pending(rs.getObject("id", UUID.class), rs.getString("billing_cycle")), checkoutId);
        if (rows.isEmpty()) return;
        Pending pending = rows.getFirst();
        Instant now = Instant.now();
        db.update("UPDATE billing_checkout_intents SET state = 'ACTIVE', paid_at = ?, access_until = ? WHERE id = ?",
                now, addCycle(now, pending.cycle), pending.id);
    }

    private void applyRenewal(JsonNode payment) {
        String subscriptionId = payment.path("subscription").asText("");
        String externalReference = payment.path("externalReference").asText("");
        var rows = db.query("SELECT id, billing_cycle, amount_minor, access_until FROM billing_checkout_intents " +
                        "WHERE provider_subscription_id = ? OR external_reference = ? ORDER BY created_at DESC LIMIT 1 FOR UPDATE",
                (rs, row) -> new Renewal(rs.getObject("id", UUID.class), rs.getString("billing_cycle"),
                        rs.getLong("amount_minor"), rs.getTimestamp("access_until") == null ? null : rs.getTimestamp("access_until").toInstant()),
                subscriptionId, externalReference);
        if (rows.isEmpty()) return;
        Renewal renewal = rows.getFirst();
        long receivedMinor = Math.round(payment.path("value").asDouble(-1) * 100);
        if (receivedMinor != renewal.amountMinor) return;
        Instant paidAt = Instant.now();
        try { paidAt = LocalDate.parse(payment.path("paymentDate").asText()).atStartOfDay(BRAZIL).toInstant(); }
        catch (Exception ignored) { }
        Instant candidate = addCycle(paidAt, renewal.cycle);
        if (renewal.accessUntil == null || candidate.isAfter(renewal.accessUntil)) {
            db.update("UPDATE billing_checkout_intents SET state = 'ACTIVE', paid_at = ?, access_until = ? WHERE id = ?",
                    paidAt, candidate, renewal.id);
        }
    }

    private Instant addCycle(Instant from, String cycle) {
        LocalDate dueDate = from.atZone(BRAZIL).toLocalDate();
        LocalDate periodEnd = cycle.equals("YEARLY") ? dueDate.plusYears(1) : dueDate.plusMonths(1);
        return periodEnd.plusDays(1).atStartOfDay(BRAZIL).toInstant();
    }

    private boolean configured() {
        return apiKey != null && !apiKey.isBlank()
                && webhookToken != null && webhookToken.length() >= 32
                && "https://api.asaas.com/v3".equalsIgnoreCase(baseUrl)
                && isPublicHttpsUrl();
    }

    private boolean isPublicHttpsUrl() {
        try {
            java.net.URI uri = java.net.URI.create(publicUrl);
            String host = uri.getHost();
            return "https".equalsIgnoreCase(uri.getScheme()) && host != null
                    && !host.equalsIgnoreCase("localhost") && !host.equals("127.0.0.1")
                    && !host.equals("0.0.0.0") && !host.endsWith(".local");
        } catch (Exception ignored) { return false; }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        return java.security.MessageDigest.isEqual(expected.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                actual.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    private record Plan(String name, long monthlyMinor, long annualMinor, int agents) {}
    private record CurrentPlan(String planCode, String cycle, String state, Instant accessUntil) {}
    private record Pending(UUID id, String cycle) {}
    private record Renewal(UUID id, String cycle, long amountMinor, Instant accessUntil) {}
}
