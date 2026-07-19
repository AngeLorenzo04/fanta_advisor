package com.fantaadvisor.shared.repository;

import com.fantaadvisor.shared.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByParticipantId(Long participantId);
    Optional<Purchase> findByPlayerId(Long playerId);
}
