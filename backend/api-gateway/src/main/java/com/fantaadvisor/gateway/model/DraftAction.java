package com.fantaadvisor.gateway.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "draft_actions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DraftAction {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "league_id", nullable = false)
    private League league;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_roster_id", nullable = false)
    private Roster buyerRoster;

    @Column(nullable = false)
    private Integer price;

    @Column(name = "timestamp", insertable = false, updatable = false)
    private OffsetDateTime timestamp;
}
