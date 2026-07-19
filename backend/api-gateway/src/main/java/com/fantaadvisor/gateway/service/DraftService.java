package com.fantaadvisor.gateway.service;

import com.fantaadvisor.gateway.model.DraftAction;
import com.fantaadvisor.gateway.model.League;
import com.fantaadvisor.gateway.model.Player;
import com.fantaadvisor.gateway.model.Roster;
import com.fantaadvisor.gateway.repository.DraftActionRepository;
import com.fantaadvisor.gateway.repository.LeagueRepository;
import com.fantaadvisor.gateway.repository.PlayerRepository;
import com.fantaadvisor.gateway.repository.RosterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DraftService {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private RosterRepository rosterRepository;

    @Autowired
    private DraftActionRepository draftActionRepository;

    @Autowired
    private LeagueRepository leagueRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Transactional
    public DraftAction registerPurchase(Integer playerId, UUID buyerRosterId, Integer price) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Giocatore non trovato"));

        if (!player.getIsAvailable()) {
            throw new IllegalStateException("Giocatore già assegnato");
        }

        Roster roster = rosterRepository.findById(buyerRosterId)
                .orElseThrow(() -> new IllegalArgumentException("Rosa non trovata"));

        if (roster.getCreditsRemaining() < price) {
            throw new IllegalArgumentException("Crediti insufficienti");
        }

        // Deduci crediti
        roster.setCreditsRemaining(roster.getCreditsRemaining() - price);
        rosterRepository.save(roster);

        // Segna giocatore come non disponibile
        player.setIsAvailable(false);
        player.setPriceCurrent(price);
        playerRepository.save(player);

        // Registra transazione d'asta
        DraftAction action = new DraftAction();
        action.setLeague(roster.getLeague());
        action.setPlayer(player);
        action.setBuyerRoster(roster);
        action.setPrice(price);
        draftActionRepository.save(action);

        // Invia notifica su Redis per avviare il solutore distribuito
        try {
            redisTemplate.convertAndSend("draft-events", roster.getLeague().getId().toString());
        } catch (Exception e) {
            System.err.println("Invio evento su Redis fallito: " + e.getMessage());
        }

        return action;
    }

    public Map<String, Object> getDraftState(UUID leagueId) {
        League league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("Lega non trovata"));

        List<Roster> rosters = rosterRepository.findByLeagueId(leagueId);
        List<DraftAction> actions = draftActionRepository.findByLeagueId(leagueId);

        Map<String, Object> state = new HashMap<>();
        state.put("league", league);
        state.put("rosters", rosters);
        state.put("recent_purchases", actions);

        return state;
    }
}
