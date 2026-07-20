package com.fantaadvisor.scraper.service;

import com.fantaadvisor.shared.model.Player;
import com.fantaadvisor.shared.model.Role;
import com.fantaadvisor.shared.repository.PlayerRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class ScraperService {

    @Autowired
    private PlayerRepository playerRepository;

    @Transactional
    public int scrapeAndLoadPlayers() {
        List<Player> playersToSave = new ArrayList<>();
        try {
            // Fetch live HTML from official Fantacalcio.it quotes page
            Document doc = Jsoup.connect("https://www.fantacalcio.it/quotazioni-fantacalcio")
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .referrer("https://www.google.com")
                    .timeout(20000)
                    .get();

            Elements rows = doc.select("tr.player-row");
            if (rows.isEmpty()) {
                throw new IOException("Nessun giocatore trovato nella pagina");
            }

            for (Element row : rows) {
                try {
                    String name = row.select(".player-name span").text().trim();
                    if (name.isEmpty()) continue;

                    String roleStr = row.attr("data-filter-role-classic").toUpperCase();
                    Role role;
                    try {
                        role = Role.valueOf(roleStr);
                    } catch (Exception e) {
                        continue;
                    }

                    String teamAbbr = row.select(".player-team").text().trim().toUpperCase();
                    String team = mapTeamAbbreviation(teamAbbr);

                    String initialQuoteStr = row.select(".player-classic-initial-price").text().trim();
                    int initialQuote = initialQuoteStr.isEmpty() ? 1 : Integer.parseInt(initialQuoteStr);

                    String currentQuoteStr = row.select(".player-classic-current-price").text().trim();
                    int currentQuote = currentQuoteStr.isEmpty() ? initialQuote : Integer.parseInt(currentQuoteStr);

                    String fvmStr = row.select(".player-classic-fvm").text().trim();
                    int fvm = fvmStr.isEmpty() ? 0 : Integer.parseInt(fvmStr);

                    Player player = createOrUpdatePlayer(name, role, team, initialQuote, currentQuote, fvm);
                    playersToSave.add(player);
                } catch (Exception e) {
                    // Skip single player error to keep it robust
                }
            }

            if (!playersToSave.isEmpty()) {
                playerRepository.saveAll(playersToSave);
                return playersToSave.size();
            }

        } catch (IOException e) {
            // Fallback to offline mock database if external site is down or blocks us
            System.err.println("Errore scraping live, uso fallback offline: " + e.getMessage());
        }

        return loadFallbackPlayers();
    }

    private Player createOrUpdatePlayer(String name, Role role, String team, int initialQuote, int currentQuote, int fvm) {
        Optional<Player> existingOpt = playerRepository.findByName(name);
        Player player = existingOpt.orElseGet(() -> {
            Player p = new Player();
            p.setName(name);
            return p;
        });

        player.setTeam(team);
        player.setRole(role);
        player.setInitialQuote(initialQuote);
        player.setCurrentQuote(currentQuote);

        // Assign statistical defaults based on role and FVM
        double expectedBaseRating = 5.8;
        if (role == Role.P) expectedBaseRating = 6.0;
        else if (role == Role.C) expectedBaseRating = 5.9;
        else if (role == Role.A) expectedBaseRating = 6.1;

        // Scale base rating slightly with FVM (up to +0.8)
        expectedBaseRating += Math.min(0.8, fvm / 500.0);
        player.setExpectedBaseRating(Math.round(expectedBaseRating * 100.0) / 100.0);

        // Set pieces specialists mapping (based on real known Serie A kickers)
        double penalty = 0.0;
        double freekick = 0.0;
        double corner = 0.0;
        boolean setPieceSpecialist = false;
        double oopIndex = 0.0;
        boolean isOop = false;

        String nameLower = name.toLowerCase();
        if (nameLower.contains("calhanoglu")) {
            penalty = 0.95; freekick = 0.6; corner = 0.5; setPieceSpecialist = true;
        } else if (nameLower.contains("dybala")) {
            penalty = 0.9; freekick = 0.7; corner = 0.6; setPieceSpecialist = true;
        } else if (nameLower.contains("vlahovic")) {
            penalty = 0.85; freekick = 0.5; setPieceSpecialist = true;
        } else if (nameLower.contains("sommer")) {
            // Goalie
        } else if (nameLower.contains("dimarco")) {
            freekick = 0.4; corner = 0.7; setPieceSpecialist = true;
            isOop = true; oopIndex = 0.7;
        } else if (nameLower.contains("hernandez") && nameLower.contains("theo")) {
            penalty = 0.2; freekick = 0.3; setPieceSpecialist = true;
            isOop = true; oopIndex = 0.8;
        } else if (nameLower.contains("koopmeiners")) {
            penalty = 0.7; freekick = 0.3; corner = 0.4; setPieceSpecialist = true;
        } else if (nameLower.contains("pulisic")) {
            penalty = 0.4; corner = 0.3; setPieceSpecialist = true;
        } else if (nameLower.contains("gudmundsson")) {
            penalty = 0.8; freekick = 0.5; corner = 0.4; setPieceSpecialist = true;
        } else if (nameLower.contains("lautaro")) {
            penalty = 0.75; setPieceSpecialist = true;
        } else if (nameLower.contains("lookman")) {
            penalty = 0.6; setPieceSpecialist = true;
        } else if (nameLower.contains("retegui")) {
            penalty = 0.7; setPieceSpecialist = true;
        } else if (nameLower.contains("zapata")) {
            penalty = 0.4; setPieceSpecialist = true;
        } else if (nameLower.contains("lukaku")) {
            penalty = 0.8; setPieceSpecialist = true;
        } else if (nameLower.contains("dovbyk")) {
            penalty = 0.7; setPieceSpecialist = true;
        } else if (nameLower.contains("kvaratskhelia")) {
            penalty = 0.5; freekick = 0.3; setPieceSpecialist = true;
        } else {
            // General defaults for high FVM players
            if (fvm > 200) {
                if (role == Role.A || role == Role.C) {
                    penalty = 0.15;
                    setPieceSpecialist = true;
                }
            }
            // Some fullbacks are OOP
            if (role == Role.D && (nameLower.contains("bellanova") || nameLower.contains("carlos augusto") || nameLower.contains("cambiaso") || nameLower.contains("dodo") || nameLower.contains("dumfries"))) {
                isOop = true;
                oopIndex = 0.5;
            }
        }

        player.setPenaltyTakerPercentage(penalty);
        player.setFreeKickSpecialistPercentage(freekick);
        player.setCornerSpecialistPercentage(corner);
        player.setIsSetPieceSpecialist(setPieceSpecialist);
        player.setIsOop(isOop);
        player.setOopIndex(oopIndex);

        // Calculate EV
        double calculatedEv = expectedBaseRating;
        calculatedEv += penalty * 3.0;
        calculatedEv += freekick * 3.0;
        calculatedEv += corner * 1.0;
        if (isOop) {
            calculatedEv += oopIndex * 1.5;
        }
        player.setExpectedValue(Math.round(calculatedEv * 100.0) / 100.0);

        return player;
    }

    private String mapTeamAbbreviation(String abbr) {
        switch (abbr) {
            case "INT": return "Inter";
            case "MIL": return "Milan";
            case "JUV": return "Juventus";
            case "NAP": return "Napoli";
            case "ROM": return "Roma";
            case "LAZ": return "Lazio";
            case "ATA": return "Atalanta";
            case "FIO": return "Fiorentina";
            case "TOR": return "Torino";
            case "BOL": return "Bologna";
            case "MON": return "Monza";
            case "GEN": return "Genoa";
            case "PAR": return "Parma";
            case "EMP": return "Empoli";
            case "VER": return "Verona";
            case "UDI": return "Udinese";
            case "CAG": return "Cagliari";
            case "LEC": return "Lecce";
            case "VEN": return "Venezia";
            case "COM": return "Como";
            default:
                if (abbr.isEmpty()) return "Svincolato";
                return abbr.substring(0, 1).toUpperCase() + abbr.substring(1).toLowerCase();
        }
    }

    private int loadFallbackPlayers() {
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
            double calculatedEv = dto.expectedBaseRating;
            calculatedEv += dto.penaltyTakerPercentage * 3.0;
            calculatedEv += dto.freeKickSpecialistPercentage * 3.0;
            calculatedEv += dto.cornerSpecialistPercentage * 1.0;
            if (dto.isOop) {
                calculatedEv += dto.oopIndex * 1.5;
            }
            double roundedEv = Math.round(calculatedEv * 100.0) / 100.0;

            Optional<Player> existingOpt = playerRepository.findByName(dto.name);
            Player player = existingOpt.orElseGet(() -> {
                Player p = new Player();
                p.setName(dto.name);
                return p;
            });

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
