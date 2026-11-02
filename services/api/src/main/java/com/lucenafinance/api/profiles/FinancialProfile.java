package com.lucenafinance.api.profiles;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "financial_profiles")
public class FinancialProfile {
    @Id
    @Column(name = "owner_uid", nullable = false, length = 128)
    private String ownerUid;
    @Column(name = "full_name_ciphertext", nullable = false, length = 256)
    private String fullNameCiphertext;
    @Column(name = "cpf_ciphertext", nullable = false, length = 256)
    private String cpfCiphertext;
    @Column(name = "birth_date_ciphertext", nullable = false, length = 256)
    private String birthDateCiphertext;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FinancialProfile() {}

    public FinancialProfile(String ownerUid, String fullNameCiphertext, String cpfCiphertext, String birthDateCiphertext, Instant updatedAt) {
        this.ownerUid = ownerUid;
        this.fullNameCiphertext = fullNameCiphertext;
        this.cpfCiphertext = cpfCiphertext;
        this.birthDateCiphertext = birthDateCiphertext;
        this.updatedAt = updatedAt;
    }

    public String getOwnerUid() { return ownerUid; }
    public String getFullNameCiphertext() { return fullNameCiphertext; }
    public String getCpfCiphertext() { return cpfCiphertext; }
    public String getBirthDateCiphertext() { return birthDateCiphertext; }
    public Instant getUpdatedAt() { return updatedAt; }
}
