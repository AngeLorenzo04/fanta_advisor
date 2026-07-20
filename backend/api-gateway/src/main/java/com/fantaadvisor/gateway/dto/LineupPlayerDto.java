package com.fantaadvisor.gateway.dto;

import com.fantaadvisor.shared.model.Player;

public class LineupPlayerDto {
    private Player player;
    private double matchModifier;
    private double expectedMatchScore;
    private String opponentTeam;

    public LineupPlayerDto() {}

    public LineupPlayerDto(Player player, double matchModifier, double expectedMatchScore, String opponentTeam) {
        this.player = player;
        this.matchModifier = matchModifier;
        this.expectedMatchScore = expectedMatchScore;
        this.opponentTeam = opponentTeam;
    }

    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }

    public double getMatchModifier() {
        return matchModifier;
    }

    public void setMatchModifier(double matchModifier) {
        this.matchModifier = matchModifier;
    }

    public double getExpectedMatchScore() {
        return expectedMatchScore;
    }

    public void setExpectedMatchScore(double expectedMatchScore) {
        this.expectedMatchScore = expectedMatchScore;
    }

    public String getOpponentTeam() {
        return opponentTeam;
    }

    public void setOpponentTeam(String opponentTeam) {
        this.opponentTeam = opponentTeam;
    }
}
