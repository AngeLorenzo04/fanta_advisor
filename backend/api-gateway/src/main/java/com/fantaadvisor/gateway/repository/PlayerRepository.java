package com.fantaadvisor.gateway.repository;

import com.fantaadvisor.gateway.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Integer> {
    
    List<Player> findByRoleAndIsAvailable(String role, Boolean isAvailable);

    @Modifying
    @Query("UPDATE Player p SET p.oopIndex = :oop, p.spIndex = :sp WHERE p.id = :id")
    void updateIndices(@Param("id") int id, @Param("oop") double oop, @Param("sp") double sp);
}
