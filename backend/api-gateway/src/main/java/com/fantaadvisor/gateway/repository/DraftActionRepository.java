package com.fantaadvisor.gateway.repository;

import com.fantaadvisor.gateway.model.DraftAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DraftActionRepository extends JpaRepository<DraftAction, UUID> {
    List<DraftAction> findByLeagueId(UUID leagueId);
}
