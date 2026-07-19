package com.fantaadvisor.gateway.repository;

import com.fantaadvisor.gateway.model.Roster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface RosterRepository extends JpaRepository<Roster, UUID> {
    List<Roster> findByLeagueId(UUID leagueId);
}
