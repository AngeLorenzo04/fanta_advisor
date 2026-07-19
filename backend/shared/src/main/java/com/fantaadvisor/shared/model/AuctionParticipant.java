package com.fantaadvisor.shared.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "auction_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "initial_budget", nullable = false)
    private Integer initialBudget;

    @Column(name = "remaining_budget", nullable = false)
    private Integer remainingBudget;
}
