package com.fantaadvisor.gateway.dto;

import java.util.List;

public class LineupRequestDto {
    private List<Long> startingPlayerIds;

    public LineupRequestDto() {}

    public LineupRequestDto(List<Long> startingPlayerIds) {
        this.startingPlayerIds = startingPlayerIds;
    }

    public List<Long> getStartingPlayerIds() {
        return startingPlayerIds;
    }

    public void setStartingPlayerIds(List<Long> startingPlayerIds) {
        this.startingPlayerIds = startingPlayerIds;
    }
}
