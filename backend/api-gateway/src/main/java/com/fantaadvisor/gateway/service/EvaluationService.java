package com.fantaadvisor.gateway.service;

import com.fantaadvisor.gateway.dto.TeamEvaluationDto;
import com.fantaadvisor.shared.model.AuctionParticipant;
import com.fantaadvisor.shared.model.Player;
import com.fantaadvisor.shared.model.Purchase;
import com.fantaadvisor.shared.model.Role;
import com.fantaadvisor.shared.repository.AuctionParticipantRepository;
import com.fantaadvisor.shared.repository.PurchaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class EvaluationService {

    @Autowired
    private AuctionParticipantRepository participantRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    public List<TeamEvaluationDto> getEvaluations() {
        List<AuctionParticipant> participants = participantRepository.findAll();
        List<Purchase> allPurchases = purchaseRepository.findAll();

        // Group purchases by participant ID
        Map<Long, List<Purchase>> purchasesByParticipant = allPurchases.stream()
                .collect(Collectors.groupingBy(p -> p.getParticipant().getId()));

        List<TeamEvaluationDto> evaluations = new ArrayList<>();
        Random random = new Random();

        // Calculate ratings for each team
        for (AuctionParticipant m : participants) {
            List<Purchase> purchases = purchasesByParticipant.getOrDefault(m.getId(), new ArrayList<>());
            List<Player> players = purchases.stream().map(Purchase::getPlayer).collect(Collectors.toList());

            int gk = calculateGkRating(players);
            int df = calculateDfRating(players);
            int mf = calculateMfRating(players);
            int fw = calculateFwRating(players);
            int global = calculateGlobalRating(gk, df, mf, fw, players.size());

            TeamEvaluationDto dto = new TeamEvaluationDto();
            dto.setParticipantId(m.getId());
            dto.setParticipantName(m.getName());
            dto.setRatingGk(gk);
            dto.setRatingDf(df);
            dto.setRatingMf(mf);
            dto.setRatingFw(fw);
            dto.setRatingGlobal(global);
            evaluations.add(dto);
        }

        // Run Monte Carlo simulation (10,000 iterations)
        int iterations = 10000;
        int numTeams = evaluations.size();

        if (numTeams > 0) {
            double[] totalPositions = new double[numTeams];
            double[] totalPoints = new double[numTeams];
            int[] winCounts = new int[numTeams];
            int[] podiumCounts = new int[numTeams];

            for (int i = 0; i < iterations; i++) {
                // Simulate points for 38 matchdays for each team
                double[] seasonPoints = new double[numTeams];
                for (int t = 0; t < numTeams; t++) {
                    TeamEvaluationDto team = evaluations.get(t);
                    double mean = 64.0 + (team.getRatingGlobal() / 100.0) * 12.0;
                    
                    // Penalty for incomplete squad (less than 15 players)
                    int squadSize = getSquadSizeForTeam(team.getParticipantId(), purchasesByParticipant);
                    if (squadSize < 15) {
                        mean -= (15 - squadSize);
                    }

                    double points = 0;
                    for (int m = 0; m < 38; m++) {
                        points += mean + random.nextGaussian() * 3.5;
                    }
                    seasonPoints[t] = points;
                    totalPoints[t] += points;
                }

                // Rank teams for this simulated season
                List<Integer> rankedIndices = new ArrayList<>();
                for (int t = 0; t < numTeams; t++) rankedIndices.add(t);

                final double[] finalSeasonPoints = seasonPoints;
                rankedIndices.sort((idx1, idx2) -> Double.compare(finalSeasonPoints[idx2], finalSeasonPoints[idx1]));

                for (int rank = 0; rank < numTeams; rank++) {
                    int teamIdx = rankedIndices.get(rank);
                    int pos = rank + 1;
                    totalPositions[teamIdx] += pos;

                    if (pos == 1) {
                        winCounts[teamIdx]++;
                    }
                    if (pos <= 3) {
                        podiumCounts[teamIdx]++;
                    }
                }
            }

            // Populate DTO with average results and probabilities
            for (int t = 0; t < numTeams; t++) {
                TeamEvaluationDto dto = evaluations.get(t);
                dto.setAvgPosition(Math.round((totalPositions[t] / iterations) * 100.0) / 100.0);
                dto.setAvgPoints(Math.round((totalPoints[t] / iterations) * 10.0) / 10.0);
                dto.setWinProbability(Math.round(((double) winCounts[t] / iterations) * 1000.0) / 10.0);
                dto.setPodiumProbability(Math.round(((double) podiumCounts[t] / iterations) * 1000.0) / 10.0);
            }
        }

        // Sort by average position ascending
        evaluations.sort(Comparator.comparingDouble(TeamEvaluationDto::getAvgPosition));
        return evaluations;
    }

    private int getSquadSizeForTeam(Long participantId, Map<Long, List<Purchase>> purchasesByParticipant) {
        return purchasesByParticipant.getOrDefault(participantId, new ArrayList<>()).size();
    }

    private int calculateGkRating(List<Player> players) {
        List<Player> gks = players.stream().filter(p -> p.getRole() == Role.P).collect(Collectors.toList());
        if (gks.isEmpty()) return 0;
        double maxEv = gks.stream().mapToDouble(Player::getExpectedValue).max().orElse(0.0);
        return (int) Math.min(100, Math.max(0, Math.round((maxEv / 6.5) * 100)));
    }

    private int calculateDfRating(List<Player> players) {
        List<Player> dfs = players.stream().filter(p -> p.getRole() == Role.D)
                .sorted(Comparator.comparingDouble(Player::getExpectedValue).reversed())
                .collect(Collectors.toList());
        if (dfs.isEmpty()) return 0;
        int count = Math.min(4, dfs.size());
        double sum = 0;
        for (int i = 0; i < count; i++) {
            sum += dfs.get(i).getExpectedValue();
        }
        double avg = sum / 4.0;
        return (int) Math.min(100, Math.max(0, Math.round((avg / 7.0) * 100)));
    }

    private int calculateMfRating(List<Player> players) {
        List<Player> mfs = players.stream().filter(p -> p.getRole() == Role.C)
                .sorted(Comparator.comparingDouble(Player::getExpectedValue).reversed())
                .collect(Collectors.toList());
        if (mfs.isEmpty()) return 0;
        int count = Math.min(4, mfs.size());
        double sum = 0;
        for (int i = 0; i < count; i++) {
            sum += mfs.get(i).getExpectedValue();
        }
        double avg = sum / 4.0;
        return (int) Math.min(100, Math.max(0, Math.round((avg / 7.5) * 100)));
    }

    private int calculateFwRating(List<Player> players) {
        List<Player> fws = players.stream().filter(p -> p.getRole() == Role.A)
                .sorted(Comparator.comparingDouble(Player::getExpectedValue).reversed())
                .collect(Collectors.toList());
        if (fws.isEmpty()) return 0;
        int count = Math.min(3, fws.size());
        double sum = 0;
        for (int i = 0; i < count; i++) {
            sum += fws.get(i).getExpectedValue();
        }
        double avg = sum / 3.0;
        return (int) Math.min(100, Math.max(0, Math.round((avg / 8.5) * 100)));
    }

    private int calculateGlobalRating(int gk, int df, int mf, int fw, int squadSize) {
        if (squadSize == 0) return 0;
        double weighted = 0.1 * gk + 0.25 * df + 0.3 * mf + 0.35 * fw;
        
        // Imbalance penalty
        int max = Math.max(Math.max(gk, df), Math.max(mf, fw));
        int min = Math.min(Math.min(gk, df), Math.min(mf, fw));
        double penalty = 0.4 * (max - min);
        
        return (int) Math.min(100, Math.max(0, Math.round(weighted - penalty)));
    }
}
