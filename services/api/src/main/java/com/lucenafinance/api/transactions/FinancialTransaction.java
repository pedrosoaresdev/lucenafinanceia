package com.lucenafinance.api.transactions;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "financial_transactions")
public class FinancialTransaction {
    @Id @GeneratedValue @UuidGenerator
    private UUID id;
    @Column(name = "owner_uid", nullable = false, length = 128)
    private String ownerUid;
    @Column(nullable = false, length = 120)
    private String description;
    @Column(name = "amount_minor", nullable = false)
    private long amountMinor;
    @Column(nullable = false, length = 3)
    private String currency;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private TransactionKind kind;
    @Column(name = "category_id", nullable = false, length = 80)
    private String categoryId;
    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;
    @Column(nullable = false, length = 1000)
    private String notes;
    @Column(nullable = false, length = 32)
    private String source;
    @Column(name = "external_reference", length = 128)
    private String externalReference;
    @Column(name = "provider_item_id", length = 64)
    private String providerItemId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FinancialTransaction() {}

    public FinancialTransaction(String ownerUid, ManualTransactionRequest request, Instant createdAt) {
        this.ownerUid = ownerUid;
        this.description = request.description().trim();
        this.amountMinor = request.amountMinor();
        this.currency = request.currency().toUpperCase();
        this.kind = TransactionKind.valueOf(request.kind());
        this.categoryId = request.categoryId();
        this.occurredAt = request.occurredAt();
        this.notes = request.notes() == null ? "" : request.notes().trim();
        this.source = "MANUAL";
        this.externalReference = null;
        this.providerItemId = null;
        this.createdAt = createdAt;
    }

    public FinancialTransaction(String ownerUid, String description, long amountMinor, String currency,
                                TransactionKind kind, String categoryId, Instant occurredAt,
                                String externalReference, String providerItemId, boolean sandbox, Instant createdAt) {
        this.ownerUid = ownerUid;
        this.description = description == null || description.isBlank() ? "Movimentação bancária" : description.substring(0, Math.min(120, description.length()));
        this.amountMinor = amountMinor;
        this.currency = currency;
        this.kind = kind;
        this.categoryId = categoryId == null || categoryId.isBlank() ? "Outros" : categoryId.substring(0, Math.min(80, categoryId.length()));
        this.occurredAt = occurredAt;
        this.notes = "";
        this.source = sandbox ? "OPEN_FINANCE_SANDBOX" : "OPEN_FINANCE";
        this.externalReference = externalReference;
        this.providerItemId = providerItemId;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getOwnerUid() { return ownerUid; }
    public String getDescription() { return description; }
    public long getAmountMinor() { return amountMinor; }
    public String getCurrency() { return currency; }
    public TransactionKind getKind() { return kind; }
    public String getCategoryId() { return categoryId; }
    public Instant getOccurredAt() { return occurredAt; }
    public String getNotes() { return notes; }
    public String getSource() { return source; }
    public String getExternalReference() { return externalReference; }
    public String getProviderItemId() { return providerItemId; }
    public Instant getCreatedAt() { return createdAt; }
}
