package com.fantaadvisor.gateway.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fantaadvisor.shared.model.AuctionParticipant;
import com.fantaadvisor.shared.repository.AuctionParticipantRepository;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class TeamControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuctionParticipantRepository participantRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private AuctionParticipant testTeam;

    @BeforeEach
    void setUp() {
        purchaseRepository.deleteAll();
        participantRepository.deleteAll();

        testTeam = new AuctionParticipant();
        testTeam.setName("Test Team 1");
        testTeam.setInitialBudget(500);
        testTeam.setRemainingBudget(500);
        testTeam = participantRepository.save(testTeam);
    }

    @Test
    void testGetAllTeams() throws Exception {
        mockMvc.perform(get("/api/v1/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Test Team 1")));
    }

    @Test
    void testGetTeamById() throws Exception {
        mockMvc.perform(get("/api/v1/teams/" + testTeam.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Test Team 1")))
                .andExpect(jsonPath("$.initialBudget", is(500)));
    }

    @Test
    void testGetTeamByIdNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/teams/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", containsString("non trovata")));
    }

    @Test
    void testCreateTeam() throws Exception {
        TeamController.TeamRequest request = new TeamController.TeamRequest();
        request.setName("New Brand Team");
        request.setInitialBudget(400);

        mockMvc.perform(post("/api/v1/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("New Brand Team")))
                .andExpect(jsonPath("$.initialBudget", is(400)))
                .andExpect(jsonPath("$.remainingBudget", is(400)));

        Optional<AuctionParticipant> created = participantRepository.findByName("New Brand Team");
        assertTrue(created.isPresent());
    }

    @Test
    void testCreateTeamDuplicateName() throws Exception {
        TeamController.TeamRequest request = new TeamController.TeamRequest();
        request.setName("Test Team 1");
        request.setInitialBudget(400);

        mockMvc.perform(post("/api/v1/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("esiste già")));
    }

    @Test
    void testUpdateTeam() throws Exception {
        TeamController.UpdateTeamRequest request = new TeamController.UpdateTeamRequest();
        request.setName("Updated Team Name");
        request.setInitialBudget(600);
        request.setRemainingBudget(450);

        mockMvc.perform(put("/api/v1/teams/" + testTeam.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Team Name")))
                .andExpect(jsonPath("$.initialBudget", is(600)))
                .andExpect(jsonPath("$.remainingBudget", is(450)));

        Optional<AuctionParticipant> updated = participantRepository.findById(testTeam.getId());
        assertTrue(updated.isPresent());
        assertTrue(updated.get().getName().equals("Updated Team Name"));
    }

    @Test
    void testDeleteTeam() throws Exception {
        mockMvc.perform(delete("/api/v1/teams/" + testTeam.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("eliminata con successo")));

        Optional<AuctionParticipant> deleted = participantRepository.findById(testTeam.getId());
        assertFalse(deleted.isPresent());
    }
}
