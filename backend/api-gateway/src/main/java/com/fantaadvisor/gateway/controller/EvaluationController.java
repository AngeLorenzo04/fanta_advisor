package com.fantaadvisor.gateway.controller;

import com.fantaadvisor.gateway.dto.TeamEvaluationDto;
import com.fantaadvisor.gateway.service.EvaluationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/evaluation")
@CrossOrigin(origins = "*")
public class EvaluationController {

    @Autowired
    private EvaluationService evaluationService;

    @GetMapping
    public ResponseEntity<?> getTeamEvaluations() {
        try {
            List<TeamEvaluationDto> evaluations = evaluationService.getEvaluations();
            return ResponseEntity.ok(evaluations);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
