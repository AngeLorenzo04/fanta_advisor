package com.fantaadvisor.gateway.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "leagues")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class League {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "num_participants")
    private Integer numParticipants = 10;

    @Column(name = "initial_budget")
    private Integer initialBudget = 500;

    @Column(name = "clean_sheet_bonus")
    private Double cleanSheetBonus = 1.0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
