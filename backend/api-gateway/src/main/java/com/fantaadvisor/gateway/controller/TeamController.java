package com.fantaadvisor.gateway.controller;

import com.fantaadvisor.shared.model.AuctionParticipant;
import com.fantaadvisor.shared.repository.AuctionParticipantRepository;
import com.fantaadvisor.shared.repository.PurchaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/teams")
@CrossOrigin(origins = "*")
public class TeamController {

    @Autowired
    private AuctionParticipantRepository participantRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @GetMapping
    public List<AuctionParticipant> getAllTeams() {
        return participantRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTeamById(@PathVariable Long id) {
        return participantRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Squadra non trovata con ID: " + id)));
    }

    @PostMapping
    public ResponseEntity<?> createTeam(@Valid @RequestBody TeamRequest request) {
        if (participantRepository.findByName(request.getName()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Una squadra con questo nome esiste già"));
        }

        AuctionParticipant team = new AuctionParticipant();
        team.setName(request.getName());
        team.setInitialBudget(request.getInitialBudget());
        team.setRemainingBudget(request.getInitialBudget());

        AuctionParticipant saved = participantRepository.save(team);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTeam(@PathVariable Long id, @Valid @RequestBody UpdateTeamRequest request) {
        return participantRepository.findById(id).map(team -> {
            if (!team.getName().equals(request.getName()) && 
                    participantRepository.findByName(request.getName()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Una squadra con questo nome esiste già"));
            }

            team.setName(request.getName());
            team.setInitialBudget(request.getInitialBudget());
            team.setRemainingBudget(request.getRemainingBudget());

            AuctionParticipant updated = participantRepository.save(team);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Squadra non trovata con ID: " + id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long id) {
        return participantRepository.findById(id).map(team -> {
            if (!purchaseRepository.findByParticipantId(id).isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Impossibile eliminare una squadra con acquisti attivi"));
            }
            participantRepository.delete(team);
            return ResponseEntity.ok(Map.of("message", "Squadra eliminata con successo"));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Squadra non trovata con ID: " + id)));
    }

    public static class TeamRequest {
        @NotBlank(message = "Il nome della squadra è obbligatorio")
        private String name;

        @NotNull(message = "Il budget iniziale è obbligatorio")
        @Min(value = 1, message = "Il budget iniziale deve essere almeno di 1 credito")
        private Integer initialBudget;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Integer getInitialBudget() { return initialBudget; }
        public void setInitialBudget(Integer initialBudget) { this.initialBudget = initialBudget; }
    }

    public static class UpdateTeamRequest {
        @NotBlank(message = "Il nome della squadra è obbligatorio")
        private String name;

        @NotNull(message = "Il budget iniziale è obbligatorio")
        @Min(value = 1, message = "Il budget iniziale deve essere almeno di 1 credito")
        private Integer initialBudget;

        @NotNull(message = "Il budget rimanente è obbligatorio")
        @Min(value = 0, message = "Il budget rimanente non può essere negativo")
        private Integer remainingBudget;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Integer getInitialBudget() { return initialBudget; }
        public void setInitialBudget(Integer initialBudget) { this.initialBudget = initialBudget; }

        public Integer getRemainingBudget() { return remainingBudget; }
        public void setRemainingBudget(Integer remainingBudget) { this.remainingBudget = remainingBudget; }
    }
}
