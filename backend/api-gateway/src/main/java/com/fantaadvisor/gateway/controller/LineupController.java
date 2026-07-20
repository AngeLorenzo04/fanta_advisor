package com.fantaadvisor.gateway.controller;

import com.fantaadvisor.gateway.dto.LineupRequestDto;
import com.fantaadvisor.gateway.dto.LineupResponseDto;
import com.fantaadvisor.gateway.service.LineupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/lineups")
@CrossOrigin(origins = "*")
public class LineupController {

    @Autowired
    private LineupService lineupService;

    @GetMapping("/{participantId}/optimal")
    public ResponseEntity<LineupResponseDto> getOptimalLineup(@PathVariable Long participantId) {
        LineupResponseDto response = lineupService.getOptimalLineup(participantId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{participantId}/evaluate")
    public ResponseEntity<LineupResponseDto> evaluateLineup(
            @PathVariable Long participantId,
            @RequestBody LineupRequestDto request) {
        LineupResponseDto response = lineupService.evaluateSpecificLineup(participantId, request.getStartingPlayerIds());
        return ResponseEntity.ok(response);
    }
}
