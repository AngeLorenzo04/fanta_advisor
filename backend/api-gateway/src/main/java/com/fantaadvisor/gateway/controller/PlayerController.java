package com.fantaadvisor.gateway.controller;

import com.fantaadvisor.shared.model.Player;
import com.fantaadvisor.shared.model.Role;
import com.fantaadvisor.shared.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/players")
@CrossOrigin(origins = "*")
public class PlayerController {

    @Autowired
    private PlayerRepository playerRepository;

    @GetMapping
    public ResponseEntity<List<Player>> getAllPlayers(@RequestParam(required = false) Role role) {
        if (role != null) {
            return ResponseEntity.ok(playerRepository.findByRole(role));
        }
        return ResponseEntity.ok(playerRepository.findAll());
    }
}
