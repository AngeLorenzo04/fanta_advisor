package com.fantaadvisor.shared.repository;

import com.fantaadvisor.shared.model.Player;
import com.fantaadvisor.shared.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByRole(Role role);
    List<Player> findByTeam(String team);
    Optional<Player> findByName(String name);
}
