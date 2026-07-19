package com.fantaadvisor.gateway.controller;

import com.fantaadvisor.gateway.model.DraftAction;
import com.fantaadvisor.gateway.service.DraftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/draft")
public class DraftController {

    @Autowired
    private DraftService draftService;

    @PostMapping("/purchase")
    public ResponseEntity<?> registerPurchase(@Valid @RequestBody PurchaseRequest request) {
        try {
            DraftAction action = draftService.registerPurchase(
                    request.getPlayerId(),
                    request.getBuyerRosterId(),
                    request.getPrice()
            );
            return ResponseEntity.ok(action);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/state")
    public ResponseEntity<?> getDraftState(@RequestParam UUID leagueId) {
        try {
            Map<String, Object> state = draftService.getDraftState(leagueId);
            return ResponseEntity.ok(state);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class PurchaseRequest {
        @NotNull(message = "Player ID è richiesto")
        private Integer playerId;

        @NotNull(message = "Buyer Roster ID è richiesto")
        private UUID buyerRosterId;

        @NotNull(message = "Price è richiesto")
        @Min(value = 1, message = "Il prezzo minimo deve essere di 1 credito")
        private Integer price;

        public Integer getPlayerId() { return playerId; }
        public void setPlayerId(Integer playerId) { this.playerId = playerId; }

        public UUID getBuyerRosterId() { return buyerRosterId; }
        public void setBuyerRosterId(UUID buyerRosterId) { this.buyerRosterId = buyerRosterId; }

        public Integer getPrice() { return price; }
        public void setPrice(Integer price) { this.price = price; }
    }
}
