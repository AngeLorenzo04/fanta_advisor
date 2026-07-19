package com.fantaadvisor.gateway.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.OffsetDateTime;

@Entity
@Table(name = "players")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Player {
    @Id
    private Integer id; // ID ufficiale Fantacalcio.it

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 1)
    private String role;

    @Column(name = "real_team", nullable = false, length = 50)
    private String realTeam;

    @Column(name = "price_initial")
    private Integer priceInitial;

    @Column(name = "price_current")
    private Integer priceCurrent;

    @Column(name = "expected_value")
    private Double expectedValue = 0.00;

    @Column(name = "oop_index")
    private Double oopIndex = 0.00;

    @Column(name = "sp_index")
    private Double spIndex = 0.00;

    @Column(name = "is_available")
    private Boolean isAvailable = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}
