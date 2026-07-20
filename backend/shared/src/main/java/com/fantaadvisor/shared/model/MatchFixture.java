package com.fantaadvisor.shared.model;

public class MatchFixture {
    private String homeTeam;
    private String awayTeam;
    private int homeTeamStrength;
    private int awayTeamStrength;

    public MatchFixture() {}

    public MatchFixture(String homeTeam, String awayTeam, int homeTeamStrength, int awayTeamStrength) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeTeamStrength = homeTeamStrength;
        this.awayTeamStrength = awayTeamStrength;
    }

    public String getHomeTeam() {
        return homeTeam;
    }

    public void setHomeTeam(String homeTeam) {
        this.homeTeam = homeTeam;
    }

    public String getAwayTeam() {
        return awayTeam;
    }

    public void setAwayTeam(String awayTeam) {
        this.awayTeam = awayTeam;
    }

    public int getHomeTeamStrength() {
        return homeTeamStrength;
    }

    public void setHomeTeamStrength(int homeTeamStrength) {
        this.homeTeamStrength = homeTeamStrength;
    }

    public int getAwayTeamStrength() {
        return awayTeamStrength;
    }

    public void setAwayTeamStrength(int awayTeamStrength) {
        this.awayTeamStrength = awayTeamStrength;
    }
}
