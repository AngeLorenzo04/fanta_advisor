package com.fantaadvisor.shared.model;

import jakarta.persistence.*;

@Entity
@Table(name = "players")
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

    // Constructors
    public Player() {}

    public Player(Long id, String name, String team, Role role, Integer initialQuote, Integer currentQuote, Double expectedValue, Double expectedBaseRating, Double oopIndex, Boolean isOop, Double penaltyTakerPercentage, Double freeKickSpecialistPercentage, Double cornerSpecialistPercentage, Boolean isSetPieceSpecialist) {
        this.id = id;
        this.name = name;
        this.team = team;
        this.role = role;
        this.initialQuote = initialQuote;
        this.currentQuote = currentQuote;
        this.expectedValue = expectedValue;
        this.expectedBaseRating = expectedBaseRating;
        this.oopIndex = oopIndex;
        this.isOop = isOop;
        this.penaltyTakerPercentage = penaltyTakerPercentage;
        this.freeKickSpecialistPercentage = freeKickSpecialistPercentage;
        this.cornerSpecialistPercentage = cornerSpecialistPercentage;
        this.isSetPieceSpecialist = isSetPieceSpecialist;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTeam() { return team; }
    public void setTeam(String team) { this.team = team; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Integer getInitialQuote() { return initialQuote; }
    public void setInitialQuote(Integer initialQuote) { this.initialQuote = initialQuote; }

    public Integer getCurrentQuote() { return currentQuote; }
    public void setCurrentQuote(Integer currentQuote) { this.currentQuote = currentQuote; }

    public Double getExpectedValue() { return expectedValue; }
    public void setExpectedValue(Double expectedValue) { this.expectedValue = expectedValue; }

    public Double getExpectedBaseRating() { return expectedBaseRating; }
    public void setExpectedBaseRating(Double expectedBaseRating) { this.expectedBaseRating = expectedBaseRating; }

    public Double getOopIndex() { return oopIndex; }
    public void setOopIndex(Double oopIndex) { this.oopIndex = oopIndex; }

    public Boolean getIsOop() { return isOop; }
    public void setIsOop(Boolean isOop) { this.isOop = isOop; }

    public Double getPenaltyTakerPercentage() { return penaltyTakerPercentage; }
    public void setPenaltyTakerPercentage(Double penaltyTakerPercentage) { this.penaltyTakerPercentage = penaltyTakerPercentage; }

    public Double getFreeKickSpecialistPercentage() { return freeKickSpecialistPercentage; }
    public void setFreeKickSpecialistPercentage(Double freeKickSpecialistPercentage) { this.freeKickSpecialistPercentage = freeKickSpecialistPercentage; }

    public Double getCornerSpecialistPercentage() { return cornerSpecialistPercentage; }
    public void setCornerSpecialistPercentage(Double cornerSpecialistPercentage) { this.cornerSpecialistPercentage = cornerSpecialistPercentage; }

    public Boolean getIsSetPieceSpecialist() { return isSetPieceSpecialist; }
    public void setIsSetPieceSpecialist(Boolean isSetPieceSpecialist) { this.isSetPieceSpecialist = isSetPieceSpecialist; }
}
