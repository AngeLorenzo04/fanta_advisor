package com.fantaadvisor.gateway.service;

import com.fantaadvisor.shared.model.Player;
import com.fantaadvisor.shared.model.AuctionParticipant;
import com.fantaadvisor.shared.model.Purchase;
import com.fantaadvisor.shared.repository.PlayerRepository;
import com.fantaadvisor.shared.repository.AuctionParticipantRepository;
import com.fantaadvisor.shared.repository.PurchaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DraftService {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private AuctionParticipantRepository participantRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Transactional
    public Purchase registerPurchase(Long playerId, Long buyerParticipantId, Integer price) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Giocatore non trovato"));

        if (purchaseRepository.findByPlayerId(playerId).isPresent()) {
            throw new IllegalStateException("Giocatore già assegnato");
        }

        AuctionParticipant participant = participantRepository.findById(buyerParticipantId)
                .orElseThrow(() -> new IllegalArgumentException("Partecipante non trovato"));

        if (participant.getRemainingBudget() < price) {
            throw new IllegalArgumentException("Crediti insufficienti");
        }

        // Deduci crediti
        participant.setRemainingBudget(participant.getRemainingBudget() - price);
        participantRepository.save(participant);

        // Aggiorna quotazione corrente
        player.setCurrentQuote(price);
        playerRepository.save(player);

        // Registra transazione d'asta
        Purchase purchase = new Purchase();
        purchase.setPlayer(player);
        purchase.setParticipant(participant);
        purchase.setPrice(price);
        purchaseRepository.save(purchase);

        // Invia notifica su Redis per avviare il solutore distribuito
        try {
            redisTemplate.convertAndSend("draft-events", "recalculate");
        } catch (Exception e) {
            System.err.println("Invio evento su Redis fallito: " + e.getMessage());
        }

        return purchase;
    }

    public Map<String, Object> getDraftState() {
        List<AuctionParticipant> participants = participantRepository.findAll();
        List<Purchase> purchases = purchaseRepository.findAll();

        Map<String, Object> state = new HashMap<>();
        state.put("participants", participants);
        state.put("recent_purchases", purchases);

        return state;
    }
}
