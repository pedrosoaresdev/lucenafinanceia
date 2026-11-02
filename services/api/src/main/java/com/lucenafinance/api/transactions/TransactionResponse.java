package com.lucenafinance.api.transactions;

import java.time.Instant;
import java.util.UUID;

public record TransactionResponse(UUID id, String description, long amountMinor, String currency,
                                  TransactionKind kind, String categoryId, Instant occurredAt,
                                  String notes, String source, Instant createdAt) {
    static TransactionResponse from(FinancialTransaction entity) {
        return new TransactionResponse(entity.getId(), entity.getDescription(), entity.getAmountMinor(),
                entity.getCurrency(), entity.getKind(), entity.getCategoryId(), entity.getOccurredAt(),
                entity.getNotes(), entity.getSource(), entity.getCreatedAt());
    }
}
