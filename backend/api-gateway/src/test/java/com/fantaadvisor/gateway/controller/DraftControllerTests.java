package com.fantaadvisor.gateway.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fantaadvisor.shared.model.AuctionParticipant;
import com.fantaadvisor.shared.model.Player;
import com.fantaadvisor.shared.model.Purchase;
import com.fantaadvisor.shared.model.Role;
import com.fantaadvisor.shared.repository.AuctionParticipantRepository;
import com.fantaadvisor.shared.repository.PlayerRepository;
import com.fantaadvisor.shared.repository.PurchaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class DraftControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuctionParticipantRepository participantRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private AuctionParticipant team1;
    private AuctionParticipant team2;
    private Player testPlayer;
    private Purchase testPurchase;

    @BeforeEach
    void setUp() {
        purchaseRepository.deleteAll();
        participantRepository.deleteAll();
        playerRepository.deleteAll();

        team1 = new AuctionParticipant();
        team1.setName("Team One");
        team1.setInitialBudget(500);
        team1.setRemainingBudget(480);
        team1 = participantRepository.save(team1);

        team2 = new AuctionParticipant();
        team2.setName("Team Two");
        team2.setInitialBudget(500);
        team2.setRemainingBudget(500);
        team2 = participantRepository.save(team2);

        testPlayer = new Player();
        testPlayer.setName("Dybala");
        testPlayer.setTeam("Roma");
        testPlayer.setRole(Role.A);
        testPlayer.setInitialQuote(26);
        testPlayer.setCurrentQuote(20);
        testPlayer.setExpectedValue(11.6);
        testPlayer.setExpectedBaseRating(6.2);
        testPlayer = playerRepository.save(testPlayer);

        testPurchase = new Purchase();
        testPurchase.setPlayer(testPlayer);
        testPurchase.setParticipant(team1);
        testPurchase.setPrice(20);
        testPurchase = purchaseRepository.save(testPurchase);
    }

    @Test
    void testDeletePurchase() throws Exception {
        mockMvc.perform(delete("/api/v1/draft/purchases/" + testPurchase.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Acquisto eliminato con successo")));

        // Verify purchase is deleted
        assertFalse(purchaseRepository.findById(testPurchase.getId()).isPresent());

        // Verify budget is restored (480 + 20 = 500)
        AuctionParticipant updatedTeam = participantRepository.findById(team1.getId()).orElseThrow();
        assertEquals(500, updatedTeam.getRemainingBudget());

        // Verify player currentQuote is reset to initialQuote (26)
        Player updatedPlayer = playerRepository.findById(testPlayer.getId()).orElseThrow();
        assertEquals(26, updatedPlayer.getCurrentQuote());
    }

    @Test
    void testUpdatePurchaseSameBuyer() throws Exception {
        DraftController.PurchaseUpdateRequest updateRequest = new DraftController.PurchaseUpdateRequest();
        updateRequest.setBuyerParticipantId(team1.getId());
        updateRequest.setPrice(30); // change price from 20 to 30

        mockMvc.perform(put("/api/v1/draft/purchases/" + testPurchase.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price", is(30)));

        // Verify budget calculation (480 + 20 - 30 = 470)
        AuctionParticipant updatedTeam = participantRepository.findById(team1.getId()).orElseThrow();
        assertEquals(470, updatedTeam.getRemainingBudget());

        // Verify player quote update
        Player updatedPlayer = playerRepository.findById(testPlayer.getId()).orElseThrow();
        assertEquals(30, updatedPlayer.getCurrentQuote());
    }

    @Test
    void testUpdatePurchaseDifferentBuyer() throws Exception {
        DraftController.PurchaseUpdateRequest updateRequest = new DraftController.PurchaseUpdateRequest();
        updateRequest.setBuyerParticipantId(team2.getId()); // change buyer from team1 to team2
        updateRequest.setPrice(15); // change price from 20 to 15

        mockMvc.perform(put("/api/v1/draft/purchases/" + testPurchase.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price", is(15)))
                .andExpect(jsonPath("$.participant.id", is(team2.getId().intValue())));

        // Verify old buyer budget restored (480 + 20 = 500)
        AuctionParticipant updatedTeam1 = participantRepository.findById(team1.getId()).orElseThrow();
        assertEquals(500, updatedTeam1.getRemainingBudget());

        // Verify new buyer budget deducted (500 - 15 = 485)
        AuctionParticipant updatedTeam2 = participantRepository.findById(team2.getId()).orElseThrow();
        assertEquals(485, updatedTeam2.getRemainingBudget());

        // Verify player quote update
        Player updatedPlayer = playerRepository.findById(testPlayer.getId()).orElseThrow();
        assertEquals(15, updatedPlayer.getCurrentQuote());
    }

    @Test
    void testUpdatePurchaseInsufficientBudget() throws Exception {
        DraftController.PurchaseUpdateRequest updateRequest = new DraftController.PurchaseUpdateRequest();
        updateRequest.setBuyerParticipantId(team2.getId());
        updateRequest.setPrice(600); // 600 > 500 budget of team2

        mockMvc.perform(put("/api/v1/draft/purchases/" + testPurchase.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Crediti insufficienti")));
    }
}
