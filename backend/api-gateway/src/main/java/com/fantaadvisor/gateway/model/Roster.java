package com.fantaadvisor.gateway.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "rosters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Roster {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "league_id", nullable = false)
    private League league;

    @Column(name = "manager_name", nullable = false, length = 100)
    private String managerName;

    @Column(name = "credits_remaining", nullable = false)
    private Integer creditsRemaining;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
