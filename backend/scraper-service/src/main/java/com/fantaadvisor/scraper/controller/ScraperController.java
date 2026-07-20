package com.fantaadvisor.scraper.controller;

import com.fantaadvisor.scraper.service.ScraperService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/scraper")
@CrossOrigin(origins = "*")
public class ScraperController {

    @Autowired
    private ScraperService scraperService;

    @PostMapping("/trigger")
    public ResponseEntity<?> triggerScrape() {
        try {
            int count = scraperService.scrapeAndLoadPlayers();
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Scraping completato con successo",
                    "players_loaded", count
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "ERROR",
                    "message", "Errore durante lo scraping: " + e.getMessage()
            ));
        }
    }
}
