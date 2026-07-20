package com.fantaadvisor.gateway.dto;

import java.util.List;

public class LineupResponseDto {
    private List<LineupPlayerDto> starting11;
    private List<LineupPlayerDto> bench;
    private double totalProjectedScore;
    private String formation; // e.g. "3-4-3"

    public LineupResponseDto() {}

    public LineupResponseDto(List<LineupPlayerDto> starting11, List<LineupPlayerDto> bench, double totalProjectedScore, String formation) {
        this.starting11 = starting11;
        this.bench = bench;
        this.totalProjectedScore = totalProjectedScore;
        this.formation = formation;
    }

    public List<LineupPlayerDto> getStarting11() {
        return starting11;
    }

    public void setStarting11(List<LineupPlayerDto> starting11) {
        this.starting11 = starting11;
    }

    public List<LineupPlayerDto> getBench() {
        return bench;
    }

    public void setBench(List<LineupPlayerDto> bench) {
        this.bench = bench;
    }

    public double getTotalProjectedScore() {
        return totalProjectedScore;
    }

    public void setTotalProjectedScore(double totalProjectedScore) {
        this.totalProjectedScore = totalProjectedScore;
    }

    public String getFormation() {
        return formation;
    }

    public void setFormation(String formation) {
        this.formation = formation;
    }
}
