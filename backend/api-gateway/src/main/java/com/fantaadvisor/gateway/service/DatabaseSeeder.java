package com.fantaadvisor.gateway.service;

import com.fantaadvisor.shared.model.AuctionParticipant;
import com.fantaadvisor.shared.model.Player;
import com.fantaadvisor.shared.model.Role;
import com.fantaadvisor.shared.repository.AuctionParticipantRepository;
import com.fantaadvisor.shared.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private AuctionParticipantRepository participantRepository;

    @Override
    public void run(String... args) throws Exception {
        if (participantRepository.count() == 0) {
            participantRepository.saveAll(Arrays.asList(
                new AuctionParticipant(null, "Angelo & Socio", 500, 500),
                new AuctionParticipant(null, "Mister X", 500, 500),
                new AuctionParticipant(null, "FantaBoss", 500, 500),
                new AuctionParticipant(null, "Pianeta Calcio", 500, 500),
                new AuctionParticipant(null, "Gazzetta Team", 500, 500),
                new AuctionParticipant(null, "Gli Scontenti", 500, 500),
                new AuctionParticipant(null, "Bomber FC", 500, 500),
                new AuctionParticipant(null, "FantaRe", 500, 500)
            ));
        }

        if (playerRepository.count() == 0) {
            playerRepository.saveAll(Arrays.asList(
                // Goalkeepers (P)
                new Player(null, "Yann Sommer", "Inter", Role.P, 18, 18, 6.5, 6.2, 0.0, false, 0.0, 0.0, 0.0, false),
                new Player(null, "Mike Maignan", "Milan", Role.P, 16, 16, 6.4, 6.1, 0.0, false, 0.0, 0.0, 0.0, false),
                new Player(null, "Michele Di Gregorio", "Juventus", Role.P, 15, 15, 6.3, 6.0, 0.0, false, 0.0, 0.0, 0.0, false),
                new Player(null, "Ivan Provedel", "Lazio", Role.P, 12, 12, 6.1, 5.9, 0.0, false, 0.0, 0.0, 0.0, false),
                
                // Defenders (D)
                new Player(null, "Federico Dimarco", "Inter", Role.D, 20, 20, 7.2, 6.5, 0.6, true, 0.1, 0.6, 0.7, true),
                new Player(null, "Theo Hernandez", "Milan", Role.D, 19, 19, 7.0, 6.4, 0.5, true, 0.3, 0.2, 0.1, true),
                new Player(null, "Gleison Bremer", "Juventus", Role.D, 18, 18, 6.8, 6.3, 0.1, false, 0.0, 0.0, 0.0, false),
                new Player(null, "Giovanni Di Lorenzo", "Napoli", Role.D, 15, 15, 6.6, 6.2, 0.4, false, 0.0, 0.0, 0.0, false),
                new Player(null, "Carlos Augusto", "Inter", Role.D, 12, 12, 6.5, 6.1, 0.7, true, 0.0, 0.1, 0.2, false),
                new Player(null, "Stefan de Vrij", "Inter", Role.D, 8, 8, 6.0, 5.8, 0.0, false, 0.0, 0.0, 0.0, false),

                // Midfielders (C)
                new Player(null, "Teun Koopmeiners", "Juventus", Role.C, 24, 24, 7.8, 6.7, 0.5, false, 0.8, 0.4, 0.3, true),
                new Player(null, "Hakan Calhanoglu", "Inter", Role.C, 22, 22, 7.9, 6.6, 0.2, false, 0.9, 0.5, 0.4, true),
                new Player(null, "Nicolo Barella", "Inter", Role.C, 18, 18, 7.0, 6.4, 0.3, false, 0.0, 0.0, 0.0, false),
                new Player(null, "Christian Pulisic", "Milan", Role.C, 21, 21, 7.6, 6.5, 0.8, true, 0.4, 0.3, 0.4, true),
                new Player(null, "Albert Gudmundsson", "Fiorentina", Role.C, 20, 20, 7.5, 6.4, 0.8, true, 0.7, 0.5, 0.5, true),
                new Player(null, "Ederson", "Atalanta", Role.C, 14, 14, 6.9, 6.2, 0.2, false, 0.0, 0.0, 0.0, false),

                // Forwards (A)
                new Player(null, "Lautaro Martinez", "Inter", Role.A, 38, 38, 8.8, 6.8, 0.9, false, 0.8, 0.0, 0.0, false),
                new Player(null, "Dusan Vlahovic", "Juventus", Role.A, 35, 35, 8.5, 6.5, 0.9, false, 0.8, 0.2, 0.0, false),
                new Player(null, "Rafael Leao", "Milan", Role.A, 32, 32, 8.2, 6.6, 0.9, false, 0.1, 0.0, 0.0, false),
                new Player(null, "Marcus Thuram", "Inter", Role.A, 30, 30, 8.1, 6.5, 0.8, false, 0.0, 0.0, 0.0, false),
                new Player(null, "Ademola Lookman", "Atalanta", Role.A, 28, 28, 8.0, 6.4, 0.8, false, 0.4, 0.1, 0.2, false),
                new Player(null, "Mateo Retegui", "Atalanta", Role.A, 26, 26, 7.6, 6.2, 0.9, false, 0.6, 0.0, 0.0, false),
                new Player(null, "Duvan Zapata", "Torino", Role.A, 24, 24, 7.5, 6.3, 0.9, false, 0.5, 0.0, 0.0, false)
            ));
        }
    }
}
