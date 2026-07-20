package com.fantaadvisor.scraper.service;

import com.fantaadvisor.shared.model.Player;
import com.fantaadvisor.shared.model.Role;
import com.fantaadvisor.shared.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class ScraperService {

    @Autowired
    private PlayerRepository playerRepository;

    @Transactional
    public int scrapeAndLoadPlayers() {
        // List of 45 Serie A players with base stats, set pieces and OOP configurations
        List<ScrapedPlayerDto> scrapedPlayers = Arrays.asList(
            // Portieri (P)
            new ScrapedPlayerDto("Yann Sommer", "Inter", Role.P, 18, 6.2, 0.0, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Mike Maignan", "Milan", Role.P, 16, 6.1, 0.0, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Michele Di Gregorio", "Juventus", Role.P, 15, 6.0, 0.0, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Ivan Provedel", "Lazio", Role.P, 12, 5.9, 0.0, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Alex Meret", "Napoli", Role.P, 13, 6.0, 0.0, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Wladimiro Falcone", "Lecce", Role.P, 10, 6.1, 0.0, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Vanja Milinkovic-Savic", "Torino", Role.P, 11, 6.0, 0.0, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Simone Scuffet", "Cagliari", Role.P, 8, 5.8, 0.0, false, 0.0, 0.0, 0.0, false),

            // Difensori (D)
            new ScrapedPlayerDto("Federico Dimarco", "Inter", Role.D, 20, 6.5, 0.6, true, 0.1, 0.6, 0.7, true),
            new ScrapedPlayerDto("Theo Hernandez", "Milan", Role.D, 19, 6.4, 0.5, true, 0.3, 0.2, 0.1, true),
            new ScrapedPlayerDto("Gleison Bremer", "Juventus", Role.D, 18, 6.3, 0.1, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Giovanni Di Lorenzo", "Napoli", Role.D, 15, 6.2, 0.4, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Carlos Augusto", "Inter", Role.D, 12, 6.1, 0.7, true, 0.0, 0.1, 0.2, false),
            new ScrapedPlayerDto("Stefan de Vrij", "Inter", Role.D, 8, 5.8, 0.0, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Alessandro Bastoni", "Inter", Role.D, 16, 6.3, 0.3, false, 0.0, 0.1, 0.1, false),
            new ScrapedPlayerDto("Benjamin Pavard", "Inter", Role.D, 14, 6.2, 0.2, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Fikayo Tomori", "Milan", Role.D, 14, 6.1, 0.1, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Gianluca Mancini", "Roma", Role.D, 13, 6.0, 0.1, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Raoul Bellanova", "Atalanta", Role.D, 14, 6.2, 0.6, true, 0.0, 0.0, 0.2, false),
            new ScrapedPlayerDto("Francesco Acerbi", "Inter", Role.D, 10, 6.0, 0.0, false, 0.0, 0.0, 0.0, false),

            // Centrocampisti (C)
            new ScrapedPlayerDto("Teun Koopmeiners", "Juventus", Role.C, 24, 6.7, 0.5, false, 0.8, 0.4, 0.3, true),
            new ScrapedPlayerDto("Hakan Calhanoglu", "Inter", Role.C, 22, 6.6, 0.2, false, 0.9, 0.5, 0.4, true),
            new ScrapedPlayerDto("Nicolo Barella", "Inter", Role.C, 18, 6.4, 0.3, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Christian Pulisic", "Milan", Role.C, 21, 6.5, 0.8, true, 0.4, 0.3, 0.4, true),
            new ScrapedPlayerDto("Albert Gudmundsson", "Fiorentina", Role.C, 20, 6.4, 0.8, true, 0.7, 0.5, 0.5, true),
            new ScrapedPlayerDto("Ederson", "Atalanta", Role.C, 14, 6.2, 0.2, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Ruben Loftus-Cheek", "Milan", Role.C, 16, 6.3, 0.6, true, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Davide Frattesi", "Inter", Role.C, 15, 6.3, 0.7, true, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Henrikh Mkhitaryan", "Inter", Role.C, 14, 6.2, 0.3, false, 0.0, 0.1, 0.1, false),
            new ScrapedPlayerDto("Mario Pasalic", "Atalanta", Role.C, 15, 6.2, 0.6, true, 0.3, 0.1, 0.0, true),
            new ScrapedPlayerDto("Lorenzo Pellegrini", "Roma", Role.C, 16, 6.2, 0.4, false, 0.4, 0.4, 0.5, true),
            new ScrapedPlayerDto("Lazar Samardzic", "Atalanta", Role.C, 14, 6.3, 0.5, true, 0.1, 0.3, 0.3, true),
            new ScrapedPlayerDto("Bryan Cristante", "Roma", Role.C, 11, 5.9, 0.1, false, 0.0, 0.0, 0.0, false),

            // Attaccanti (A)
            new ScrapedPlayerDto("Lautaro Martinez", "Inter", Role.A, 38, 6.8, 0.9, false, 0.8, 0.0, 0.0, false),
            new ScrapedPlayerDto("Dusan Vlahovic", "Juventus", Role.A, 35, 6.5, 0.9, false, 0.8, 0.2, 0.0, false),
            new ScrapedPlayerDto("Rafael Leao", "Milan", Role.A, 32, 6.6, 0.9, false, 0.1, 0.0, 0.0, false),
            new ScrapedPlayerDto("Marcus Thuram", "Inter", Role.A, 30, 6.5, 0.8, false, 0.0, 0.0, 0.0, false),
            new ScrapedPlayerDto("Ademola Lookman", "Atalanta", Role.A, 28, 6.4, 0.8, false, 0.4, 0.1, 0.2, false),
            new ScrapedPlayerDto("Mateo Retegui", "Atalanta", Role.A, 26, 6.2, 0.9, false, 0.6, 0.0, 0.0, false),
            new ScrapedPlayerDto("Duvan Zapata", "Torino", Role.A, 24, 6.3, 0.9, false, 0.5, 0.0, 0.0, false),
            new ScrapedPlayerDto("Paulo Dybala", "Roma", Role.A, 28, 6.7, 0.9, false, 0.9, 0.6, 0.5, true),
            new ScrapedPlayerDto("Romelu Lukaku", "Napoli", Role.A, 33, 6.5, 0.9, false, 0.8, 0.0, 0.0, false),
            new ScrapedPlayerDto("Alvaro Morata", "Milan", Role.A, 26, 6.3, 0.8, false, 0.2, 0.0, 0.0, false),
            new ScrapedPlayerDto("Khvicha Kvaratskhelia", "Napoli", Role.A, 31, 6.6, 0.9, false, 0.5, 0.3, 0.4, true),
            new ScrapedPlayerDto("Artem Dovbyk", "Roma", Role.A, 27, 6.3, 0.8, false, 0.7, 0.0, 0.0, false)
        );

        int updatedCount = 0;
        for (ScrapedPlayerDto dto : scrapedPlayers) {
            // Process the information and calculate EV (Expected Value)
            // EV = BaseRating + (Rigori * 3.0) + (Punizioni * 3.0) + (Corner * 1.0)
            double calculatedEv = dto.expectedBaseRating;
            calculatedEv += dto.penaltyTakerPercentage * 3.0;
            calculatedEv += dto.freeKickSpecialistPercentage * 3.0;
            calculatedEv += dto.cornerSpecialistPercentage * 1.0;
            
            // Add OOP index bonus: oopIndex * 1.5
            if (dto.isOop) {
                calculatedEv += dto.oopIndex * 1.5;
            }

            // Round to 2 decimal places
            double roundedEv = Math.round(calculatedEv * 100.0) / 100.0;

            Optional<Player> existingOpt = playerRepository.findByName(dto.name);
            Player player;
            if (existingOpt.isPresent()) {
                player = existingOpt.get();
            } else {
                player = new Player();
                player.setName(dto.name);
            }

            player.setTeam(dto.team);
            player.setRole(dto.role);
            player.setInitialQuote(dto.initialQuote);
            player.setCurrentQuote(dto.initialQuote);
            player.setExpectedBaseRating(dto.expectedBaseRating);
            player.setOopIndex(dto.oopIndex);
            player.setIsOop(dto.isOop);
            player.setPenaltyTakerPercentage(dto.penaltyTakerPercentage);
            player.setFreeKickSpecialistPercentage(dto.freeKickSpecialistPercentage);
            player.setCornerSpecialistPercentage(dto.cornerSpecialistPercentage);
            player.setIsSetPieceSpecialist(dto.isSetPieceSpecialist);
            player.setExpectedValue(roundedEv);

            playerRepository.save(player);
            updatedCount++;
        }

        return updatedCount;
    }

    private static class ScrapedPlayerDto {
        String name;
        String team;
        Role role;
        Integer initialQuote;
        Double expectedBaseRating;
        Double oopIndex;
        Boolean isOop;
        Double penaltyTakerPercentage;
        Double freeKickSpecialistPercentage;
        Double cornerSpecialistPercentage;
        Boolean isSetPieceSpecialist;

        public ScrapedPlayerDto(String name, String team, Role role, Integer initialQuote, Double expectedBaseRating, Double oopIndex, Boolean isOop, Double penaltyTakerPercentage, Double freeKickSpecialistPercentage, Double cornerSpecialistPercentage, Boolean isSetPieceSpecialist) {
            this.name = name;
            this.team = team;
            this.role = role;
            this.initialQuote = initialQuote;
            this.expectedBaseRating = expectedBaseRating;
            this.oopIndex = oopIndex;
            this.isOop = isOop;
            this.penaltyTakerPercentage = penaltyTakerPercentage;
            this.freeKickSpecialistPercentage = freeKickSpecialistPercentage;
            this.cornerSpecialistPercentage = cornerSpecialistPercentage;
            this.isSetPieceSpecialist = isSetPieceSpecialist;
        }
    }
}
