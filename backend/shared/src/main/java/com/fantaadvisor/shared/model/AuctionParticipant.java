package com.fantaadvisor.shared.model;

import jakarta.persistence.*;

@Entity
@Table(name = "auction_participants")
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

    // Constructors
    public AuctionParticipant() {}

    public AuctionParticipant(Long id, String name, Integer initialBudget, Integer remainingBudget) {
        this.id = id;
        this.name = name;
        this.initialBudget = initialBudget;
        this.remainingBudget = remainingBudget;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getInitialBudget() { return initialBudget; }
    public void setInitialBudget(Integer initialBudget) { this.initialBudget = initialBudget; }

    public Integer getRemainingBudget() { return remainingBudget; }
    public void setRemainingBudget(Integer remainingBudget) { this.remainingBudget = remainingBudget; }
}
