package com.lucenafinance.api.transactions;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, UUID> {
    List<FinancialTransaction> findTop200ByOwnerUidOrderByOccurredAtDesc(String ownerUid);
    List<FinancialTransaction> findTop2000ByOwnerUidOrderByOccurredAtDesc(String ownerUid);
    boolean existsByOwnerUidAndSourceAndExternalReference(String ownerUid, String source, String externalReference);
    void deleteByOwnerUidAndSourceAndProviderItemId(String ownerUid, String source, String providerItemId);
}
