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

    @Transactional
    public void deletePurchase(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Acquisto non trovato"));

        Player player = purchase.getPlayer();
        AuctionParticipant participant = purchase.getParticipant();

        // Restituisci crediti
        participant.setRemainingBudget(participant.getRemainingBudget() + purchase.getPrice());
        participantRepository.save(participant);

        // Ripristina quotazione
        player.setCurrentQuote(player.getInitialQuote());
        playerRepository.save(player);

        // Elimina transazione
        purchaseRepository.delete(purchase);

        // Invia notifica su Redis
        try {
            redisTemplate.convertAndSend("draft-events", "recalculate");
        } catch (Exception e) {
            System.err.println("Invio evento su Redis fallito: " + e.getMessage());
        }
    }

    @Transactional
    public Purchase updatePurchase(Long id, Long newBuyerId, Integer newPrice) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Acquisto non trovato"));

        Player player = purchase.getPlayer();
        AuctionParticipant oldParticipant = purchase.getParticipant();
        AuctionParticipant newParticipant = participantRepository.findById(newBuyerId)
                .orElseThrow(() -> new IllegalArgumentException("Nuovo partecipante non trovato"));

        // Temporaneamente restituisci il vecchio prezzo al vecchio partecipante
        oldParticipant.setRemainingBudget(oldParticipant.getRemainingBudget() + purchase.getPrice());

        if (!oldParticipant.getId().equals(newParticipant.getId())) {
            participantRepository.save(oldParticipant);
            newParticipant = participantRepository.findById(newBuyerId).get();
        } else {
            newParticipant = oldParticipant;
        }

        // Verifica se il nuovo partecipante ha budget sufficiente
        if (newParticipant.getRemainingBudget() < newPrice) {
            throw new IllegalArgumentException("Crediti insufficienti per il nuovo acquirente");
        }

        // Applica il nuovo prezzo
        newParticipant.setRemainingBudget(newParticipant.getRemainingBudget() - newPrice);
        participantRepository.save(newParticipant);

        // Aggiorna quotazione calciatore
        player.setCurrentQuote(newPrice);
        playerRepository.save(player);

        // Aggiorna acquisto
        purchase.setParticipant(newParticipant);
        purchase.setPrice(newPrice);
        purchaseRepository.save(purchase);

        // Invia notifica su Redis
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
