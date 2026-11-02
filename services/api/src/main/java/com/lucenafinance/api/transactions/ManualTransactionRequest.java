package com.lucenafinance.api.transactions;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record ManualTransactionRequest(
        @NotBlank @Size(max = 120) String description,
        @NotNull @Positive Long amountMinor,
        @NotBlank @Size(max = 3) String currency,
        @NotBlank String kind,
        @NotBlank @Size(max = 80) String categoryId,
        @NotNull Instant occurredAt,
        @Size(max = 1000) String notes) {
}
