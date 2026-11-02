package com.lucenafinance.api.banking;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "bank_connections")
public class BankConnection {
    @Id @Column(name = "item_id", length = 64)
    private String itemId;
    @Column(name = "owner_uid", nullable = false, length = 128)
    private String ownerUid;
    @Column(nullable = false, length = 120)
    private String institution;
    @Column(nullable = false, length = 32)
    private String status;
    @Column(name = "is_sandbox", nullable = false)
    private boolean sandbox;
    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    protected BankConnection() {}
    public BankConnection(String itemId, String ownerUid, String institution, String status, boolean sandbox, Instant lastSyncedAt) {
        this.itemId = itemId; this.ownerUid = ownerUid; this.institution = institution;
        this.status = status; this.sandbox = sandbox; this.lastSyncedAt = lastSyncedAt;
    }
    public String getItemId() { return itemId; }
    public String getOwnerUid() { return ownerUid; }
    public String getInstitution() { return institution; }
    public String getStatus() { return status; }
    public boolean isSandbox() { return sandbox; }
    public Instant getLastSyncedAt() { return lastSyncedAt; }
    public void setStatus(String status) { this.status = status; }
    public void setLastSyncedAt(Instant lastSyncedAt) { this.lastSyncedAt = lastSyncedAt; }
}
