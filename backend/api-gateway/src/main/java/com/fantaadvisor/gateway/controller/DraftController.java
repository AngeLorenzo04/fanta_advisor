package com.fantaadvisor.gateway.controller;

import com.fantaadvisor.shared.model.Purchase;
import com.fantaadvisor.gateway.service.DraftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/draft")
@CrossOrigin(origins = "*")
public class DraftController {

    @Autowired
    private DraftService draftService;

    @PostMapping("/purchase")
    public ResponseEntity<?> registerPurchase(@Valid @RequestBody PurchaseRequest request) {
        try {
            Purchase purchase = draftService.registerPurchase(
                    request.getPlayerId(),
                    request.getBuyerParticipantId(),
                    request.getPrice()
            );
            return ResponseEntity.ok(purchase);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/state")
    public ResponseEntity<?> getDraftState() {
        try {
            Map<String, Object> state = draftService.getDraftState();
            return ResponseEntity.ok(state);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/purchases/{id}")
    public ResponseEntity<?> updatePurchase(@PathVariable Long id, @Valid @RequestBody PurchaseUpdateRequest request) {
        try {
            Purchase purchase = draftService.updatePurchase(id, request.getBuyerParticipantId(), request.getPrice());
            return ResponseEntity.ok(purchase);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/purchases/{id}")
    public ResponseEntity<?> deletePurchase(@PathVariable Long id) {
        try {
            draftService.deletePurchase(id);
            return ResponseEntity.ok(Map.of("message", "Acquisto eliminato con successo"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class PurchaseRequest {
        @NotNull(message = "Player ID è richiesto")
        private Long playerId;

        @NotNull(message = "Buyer Participant ID è richiesto")
        private Long buyerParticipantId;

        @NotNull(message = "Price è richiesto")
        @Min(value = 1, message = "Il prezzo minimo deve essere di 1 credito")
        private Integer price;

        public Long getPlayerId() { return playerId; }
        public void setPlayerId(Long playerId) { this.playerId = playerId; }

        public Long getBuyerParticipantId() { return buyerParticipantId; }
        public void setBuyerParticipantId(Long buyerParticipantId) { this.buyerParticipantId = buyerParticipantId; }

        public Integer getPrice() { return price; }
        public void setPrice(Integer price) { this.price = price; }
    }

    public static class PurchaseUpdateRequest {
        @NotNull(message = "Buyer Participant ID è richiesto")
        private Long buyerParticipantId;

        @NotNull(message = "Price è richiesto")
        @Min(value = 1, message = "Il prezzo minimo deve essere di 1 credito")
        private Integer price;

        public Long getBuyerParticipantId() { return buyerParticipantId; }
        public void setBuyerParticipantId(Long buyerParticipantId) { this.buyerParticipantId = buyerParticipantId; }

        public Integer getPrice() { return price; }
        public void setPrice(Integer price) { this.price = price; }
    }
}
