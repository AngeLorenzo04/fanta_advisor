package com.fantaadvisor.gateway.dto;

public class TeamEvaluationDto {
    private Long participantId;
    private String participantName;
    private int ratingGk;
    private int ratingDf;
    private int ratingMf;
    private int ratingFw;
    private int ratingGlobal;
    private double avgPosition;
    private double avgPoints;
    private double winProbability;
    private double podiumProbability;

    // Getters and Setters
    public Long getParticipantId() { return participantId; }
    public void setParticipantId(Long participantId) { this.participantId = participantId; }

    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }

    public int getRatingGk() { return ratingGk; }
    public void setRatingGk(int ratingGk) { this.ratingGk = ratingGk; }

    public int getRatingDf() { return ratingDf; }
    public void setRatingDf(int ratingDf) { this.ratingDf = ratingDf; }

    public int getRatingMf() { return ratingMf; }
    public void setRatingMf(int ratingMf) { this.ratingMf = ratingMf; }

    public int getRatingFw() { return ratingFw; }
    public void setRatingFw(int ratingFw) { this.ratingFw = ratingFw; }

    public int getRatingGlobal() { return ratingGlobal; }
    public void setRatingGlobal(int ratingGlobal) { this.ratingGlobal = ratingGlobal; }

    public double getAvgPosition() { return avgPosition; }
    public void setAvgPosition(double avgPosition) { this.avgPosition = avgPosition; }

    public double getAvgPoints() { return avgPoints; }
    public void setAvgPoints(double avgPoints) { this.avgPoints = avgPoints; }

    public double getWinProbability() { return winProbability; }
    public void setWinProbability(double winProbability) { this.winProbability = winProbability; }

    public double getPodiumProbability() { return podiumProbability; }
    public void setPodiumProbability(double podiumProbability) { this.podiumProbability = podiumProbability; }
}
