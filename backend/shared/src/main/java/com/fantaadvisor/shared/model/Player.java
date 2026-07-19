package com.fantaadvisor.shared.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "players")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String team;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "initial_quote")
    private Integer initialQuote;

    @Column(name = "current_quote")
    private Integer currentQuote;

    @Column(name = "expected_value")
    private Double expectedValue;

    @Column(name = "expected_base_rating")
    private Double expectedBaseRating;

    @Column(name = "oop_index")
    private Double oopIndex;

    @Column(name = "is_oop")
    private Boolean isOop;

    @Column(name = "penalty_taker_percentage")
    private Double penaltyTakerPercentage;

    @Column(name = "free_kick_specialist_percentage")
    private Double freeKickSpecialistPercentage;

    @Column(name = "corner_specialist_percentage")
    private Double cornerSpecialistPercentage;

    @Column(name = "is_set_piece_specialist")
    private Boolean isSetPieceSpecialist;
}
