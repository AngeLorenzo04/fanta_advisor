package com.fantaadvisor.shared.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "purchases")
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private AuctionParticipant participant;

    @Column(nullable = false)
    private Integer price;

    // Constructors
    public Purchase() {}

    public Purchase(Long id, Player player, AuctionParticipant participant, Integer price) {
        this.id = id;
        this.player = player;
        this.participant = participant;
        this.price = price;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Player getPlayer() { return player; }
    public void setPlayer(Player player) { this.player = player; }

    public AuctionParticipant getParticipant() { return participant; }
    public void setParticipant(AuctionParticipant participant) { this.participant = participant; }

    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }
}
