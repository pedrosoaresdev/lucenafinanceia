package com.lucenafinance.api.banking;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BankConnectionRepository extends JpaRepository<BankConnection, String> {
    List<BankConnection> findByOwnerUidOrderByInstitutionAsc(String ownerUid);
    Optional<BankConnection> findByItemIdAndOwnerUid(String itemId, String ownerUid);
}
