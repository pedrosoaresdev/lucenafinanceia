package com.lucenafinance.api.transactions;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {
    private final FinancialTransactionRepository transactions;

    public TransactionController(FinancialTransactionRepository transactions) { this.transactions = transactions; }

    @GetMapping
    public List<TransactionResponse> list(@AuthenticationPrincipal Jwt user) {
        return transactions.findTop200ByOwnerUidOrderByOccurredAtDesc(user.getSubject())
                .stream().map(TransactionResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(@Valid @RequestBody ManualTransactionRequest body,
                                                       @AuthenticationPrincipal Jwt user) {
        if (!List.of("INCOME", "EXPENSE").contains(body.kind())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "kind must be INCOME or EXPENSE");
        }
        String currency = body.currency().toUpperCase(Locale.ROOT);
        if (!List.of("BRL", "USD", "EUR").contains(currency)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported currency");
        }
        ManualTransactionRequest normalized = new ManualTransactionRequest(body.description(), body.amountMinor(),
                currency, body.kind(), body.categoryId(), body.occurredAt(), body.notes());
        FinancialTransaction saved = transactions.save(new FinancialTransaction(user.getSubject(), normalized, Instant.now()));
        TransactionResponse response = TransactionResponse.from(saved);
        return ResponseEntity.created(URI.create("/api/v1/transactions/" + saved.getId())).body(response);
    }
}
