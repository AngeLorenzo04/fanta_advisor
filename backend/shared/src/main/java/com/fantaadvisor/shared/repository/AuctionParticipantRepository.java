package com.fantaadvisor.shared.repository;

import com.fantaadvisor.shared.model.AuctionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuctionParticipantRepository extends JpaRepository<AuctionParticipant, Long> {
    Optional<AuctionParticipant> findByName(String name);
}
