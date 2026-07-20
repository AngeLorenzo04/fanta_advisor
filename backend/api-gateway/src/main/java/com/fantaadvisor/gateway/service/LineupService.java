package com.fantaadvisor.gateway.service;

import com.fantaadvisor.gateway.dto.LineupPlayerDto;
import com.fantaadvisor.gateway.dto.LineupResponseDto;
import com.fantaadvisor.shared.model.MatchFixture;
import com.fantaadvisor.shared.model.Player;
import com.fantaadvisor.shared.model.Purchase;
import com.fantaadvisor.shared.model.Role;
import com.fantaadvisor.shared.repository.PurchaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LineupService {

    @Autowired
    private PurchaseRepository purchaseRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    private List<MatchFixture> getFixtures() {
        try {
            String scraperUrl = "http://scraper-service:8082/api/v1/scraper/fixtures";
            ResponseEntity<List<MatchFixture>> response = restTemplate.exchange(
                    scraperUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<MatchFixture>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Impossibile caricare le fixtures: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    private LineupPlayerDto evaluatePlayerForMatchday(Player player, List<MatchFixture> fixtures) {
        String team = player.getTeam();
        int opponentStrength = 3; // Default
        String opponentTeam = "Sconosciuto";

        for (MatchFixture f : fixtures) {
            if (f.getHomeTeam().equalsIgnoreCase(team)) {
                opponentStrength = f.getAwayTeamStrength();
                opponentTeam = f.getAwayTeam();
                break;
            } else if (f.getAwayTeam().equalsIgnoreCase(team)) {
                opponentStrength = f.getHomeTeamStrength();
                opponentTeam = f.getHomeTeam();
                break;
            }
        }

        double modifier = 0.0;
        // Logic for Match Difficulty modifier
        switch (opponentStrength) {
            case 5: modifier = -0.5; break;
            case 4: modifier = -0.2; break;
            case 3: modifier = 0.0; break;
            case 2: modifier = +0.2; break;
            case 1: modifier = +0.5; break;
        }

        // Adjust modifier based on Role (Defenders/Goalkeepers suffer more against strong teams)
        if (player.getRole() == Role.P) {
            modifier *= 1.5;
        } else if (player.getRole() == Role.A) {
            modifier *= 0.8; 
        }

        double expectedMatchScore = player.getExpectedValue() + modifier;
        expectedMatchScore = Math.round(expectedMatchScore * 100.0) / 100.0;

        return new LineupPlayerDto(player, modifier, expectedMatchScore, opponentTeam);
    }

    public LineupResponseDto getOptimalLineup(Long participantId) {
        List<Purchase> purchases = purchaseRepository.findByParticipantId(participantId);
        List<MatchFixture> fixtures = getFixtures();

        List<LineupPlayerDto> evaluatedPlayers = purchases.stream()
                .map(p -> evaluatePlayerForMatchday(p.getPlayer(), fixtures))
                .sorted((p1, p2) -> Double.compare(p2.getExpectedMatchScore(), p1.getExpectedMatchScore()))
                .collect(Collectors.toList());

        // Test standard formations
        String[] formations = {"3-4-3", "4-3-3", "3-5-2", "4-4-2", "5-3-2", "4-5-1", "5-4-1"};
        
        LineupResponseDto bestLineup = null;
        double maxScore = -1000.0;

        for (String formationStr : formations) {
            String[] parts = formationStr.split("-");
            int reqD = Integer.parseInt(parts[0]);
            int reqC = Integer.parseInt(parts[1]);
            int reqA = Integer.parseInt(parts[2]);

            List<LineupPlayerDto> pList = getGoalkeepers(evaluatedPlayers);
            List<LineupPlayerDto> dList = getDefenders(evaluatedPlayers);
            List<LineupPlayerDto> cList = getMidfielders(evaluatedPlayers);
            List<LineupPlayerDto> aList = getAttackers(evaluatedPlayers);

            if (pList.size() >= 1 && dList.size() >= reqD && cList.size() >= reqC && aList.size() >= reqA) {
                List<LineupPlayerDto> starters = new ArrayList<>();
                starters.add(pList.get(0));
                starters.addAll(dList.subList(0, reqD));
                starters.addAll(cList.subList(0, reqC));
                starters.addAll(aList.subList(0, reqA));

                double currentScore = starters.stream().mapToDouble(LineupPlayerDto::getExpectedMatchScore).sum();
                currentScore = Math.round(currentScore * 100.0) / 100.0;

                if (currentScore > maxScore) {
                    maxScore = currentScore;
                    
                    List<LineupPlayerDto> bench = new ArrayList<>(evaluatedPlayers);
                    bench.removeAll(starters);
                    
                    bestLineup = new LineupResponseDto(starters, bench, currentScore, formationStr);
                }
            }
        }

        if (bestLineup == null) {
            // Fallback se non ci sono abbastanza giocatori
            bestLineup = new LineupResponseDto(evaluatedPlayers, new ArrayList<>(), 0.0, "N/A");
        }

        return bestLineup;
    }

    public LineupResponseDto evaluateSpecificLineup(Long participantId, List<Long> starterIds) {
        List<Purchase> purchases = purchaseRepository.findByParticipantId(participantId);
        List<MatchFixture> fixtures = getFixtures();

        List<LineupPlayerDto> evaluatedPlayers = purchases.stream()
                .map(p -> evaluatePlayerForMatchday(p.getPlayer(), fixtures))
                .collect(Collectors.toList());

        List<LineupPlayerDto> starters = new ArrayList<>();
        List<LineupPlayerDto> bench = new ArrayList<>();
        
        int countD = 0, countC = 0, countA = 0;

        for (LineupPlayerDto dto : evaluatedPlayers) {
            if (starterIds.contains(dto.getPlayer().getId())) {
                starters.add(dto);
                Role r = dto.getPlayer().getRole();
                if (r == Role.D) countD++;
                if (r == Role.C) countC++;
                if (r == Role.A) countA++;
            } else {
                bench.add(dto);
            }
        }

        // Sort bench by role and score
        bench.sort(Comparator.comparing((LineupPlayerDto p) -> p.getPlayer().getRole())
                .thenComparing(LineupPlayerDto::getExpectedMatchScore).reversed());

        // Sort starters by role (P, D, C, A)
        starters.sort(Comparator.comparing((LineupPlayerDto p) -> p.getPlayer().getRole()));

        String formation = countD + "-" + countC + "-" + countA;
        double currentScore = starters.stream().mapToDouble(LineupPlayerDto::getExpectedMatchScore).sum();
        currentScore = Math.round(currentScore * 100.0) / 100.0;

        return new LineupResponseDto(starters, bench, currentScore, formation);
    }

    private List<LineupPlayerDto> getGoalkeepers(List<LineupPlayerDto> players) {
        return players.stream().filter(p -> p.getPlayer().getRole() == Role.P).collect(Collectors.toList());
    }

    private List<LineupPlayerDto> getDefenders(List<LineupPlayerDto> players) {
        return players.stream().filter(p -> p.getPlayer().getRole() == Role.D).collect(Collectors.toList());
    }

    private List<LineupPlayerDto> getMidfielders(List<LineupPlayerDto> players) {
        return players.stream().filter(p -> p.getPlayer().getRole() == Role.C).collect(Collectors.toList());
    }

    private List<LineupPlayerDto> getAttackers(List<LineupPlayerDto> players) {
        return players.stream().filter(p -> p.getPlayer().getRole() == Role.A).collect(Collectors.toList());
    }
}
