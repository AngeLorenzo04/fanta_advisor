# System Design Document - Fanta-Advisor

Questo documento descrive il design tecnico di dettaglio del sistema Fanta-Advisor.

---

## 1. Specifiche delle API RESTful (Spring Boot)

Tutte le richieste e risposte utilizzano il formato JSON. Gli endpoint sono esposti sotto il prefisso `/api/v1`.

### 1.1 Modulo Giocatori (Players)

#### `GET /api/v1/players`
Recupera l'elenco dei calciatori con filtri avanzati.
*   **Query Parameters**:
    *   `role` (string, opzionale): `P`, `D`, `C`, `A`
    *   `is_available` (bool, opzionale): filtra i giocatori non ancora acquistati all'asta.
    *   `is_oop` (bool, opzionale): filtra solo i giocatori Out-Of-Position.
    *   `is_set_piece_specialist` (bool, opzionale): filtra solo gli specialisti dei piazzati.
    *   `sort_by` (string, opzionale): `expected_value`, `price`, `oop_index`, `sp_index`
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": 101,
        "name": "Carlos Augusto",
        "role": "D",
        "real_team": "Inter",
        "price_initial": 12,
        "expected_value": 6.85,
        "oop_index": 0.85,
        "sp_index": 0.15,
        "is_available": true
      }
    ]
    ```

#### `GET /api/v1/players/{id}`
Dettaglio statistico e posizionale del singolo calciatore.
*   **Response (200 OK)**:
    ```json
    {
      "id": 101,
      "name": "Carlos Augusto",
      "role": "D",
      "real_team": "Inter",
      "expected_value": 6.85,
      "stats_summary": {
        "games_played": 32,
        "goals": 4,
        "assists": 6,
        "yellow_cards": 2,
        "fanta_average": 6.91
      },
      "positional_data": {
        "avg_x": 35.2,
        "avg_y": 72.4,
        "heatmap_url": "https://cdn.fanta-advisor/heatmaps/101.png"
      },
      "set_piece_shares": {
        "penalties_pct": 0.0,
        "free_kicks_pct": 0.10,
        "corners_pct": 0.40
      }
    }
    ```

---

### 1.2 Modulo Asta Live (Draft)

#### `GET /api/v1/draft/state`
Stato corrente dell'asta per tutti i partecipanti.
*   **Response (200 OK)**:
    ```json
    {
      "league_id": "uuid-1234",
      "participants": [
        {
          "roster_id": "roster-001",
          "manager_name": "Angelo & Socio",
          "credits_remaining": 820,
          "slots_filled": {
            "P": 1,
            "D": 3,
            "C": 4,
            "A": 2
          },
          "max_bid_possible": 806
        }
      ],
      "recent_purchases": [
        {
          "player_id": 205,
          "player_name": "Lautaro Martinez",
          "buyer_roster_id": "roster-002",
          "price": 140
        }
      ]
    }
    ```

#### `POST /api/v1/draft/purchase`
Registra l'acquisto di un giocatore. Scatena in background (Spring Solver Worker) il ricalcolo degli indici d'asta.
*   **Request Body**:
    ```json
    {
      "player_id": 101,
      "buyer_roster_id": "roster-001",
      "price": 18
    }
    ```
*   **Response (202 Accepted)**:
    ```json
    {
      "status": "queued",
      "task_id": "task-uuid-abcde",
      "message": "Registrazione e ricalcolo ottimizzazione presi in carico."
    }
    ```

---

### 1.3 Modulo Campionato & Ottimizzazione (Lineup & Trades)

#### `GET /api/v1/lineup/suggest`
Calcola la formazione ottimale per una determinata giornata di campionato.
*   **Query Parameters**:
    *   `roster_id` (string, richiesto)
    *   `matchday` (int, richiesto)
*   **Response (200 OK)**:
    ```json
    {
      "suggested_module": "3-4-3",
      "expected_points_total": 75.4,
      "titolari": [
        { "id": 101, "name": "Carlos Augusto", "role": "D", "expected_points": 6.8 },
        { "id": 302, "name": "Lautaro Martinez", "role": "A", "expected_points": 8.5 }
      ],
      "panchina": [
        { "id": 102, "name": "Acerbi", "role": "D", "order": 1 }
      ]
    }
    ```

#### `POST /api/v1/trades/evaluate`
Valuta l'impatto di una proposta di scambio.
*   **Request Body**:
    ```json
    {
      "my_roster_id": "roster-001",
      "players_to_give": [101, 102],
      "players_to_receive": [201, 202]
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "is_recommended": true,
      "my_squad_rating_before": 82.5,
      "my_squad_rating_after": 84.1,
      "ev_delta_seasonal": 15.6,
      "analysis": "Lo scambio è consigliato. Il reparto di centrocampo guadagna il +5% di EV a fronte di una perdita minima in difesa."
    }
    ```

---

### 1.4 Modulo Ingestion (Scraping)

#### `POST /api/v1/ingestion/trigger`
Trigger manuale per forzare lo scraping delle fonti dati.
*   **Request Body**:
    ```json
    {
      "source": "probabili_formazioni"
    }
    ```
*   **Response (202 Accepted)**:
    ```json
    {
      "status": "started",
      "task_id": "task-uuid-scrape-123"
    }
    ```

---

## 2. Schema del Database (PostgreSQL / Supabase DDL)

Lo schema è progettato su base relazionale in PostgreSQL, sfruttando le relazioni per l'integrità dei dati e indici mirati per massimizzare la velocità di query durante l'asta live.

```sql
-- Abilitazione estensione per UUID se non attiva
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabella delle Leghe
CREATE TABLE leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    num_participants INT DEFAULT 10,
    initial_budget INT DEFAULT 500,
    clean_sheet_bonus NUMERIC DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabella delle Rose (Rosters)
CREATE TABLE rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    manager_name VARCHAR(100) NOT NULL,
    credits_remaining INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabella dei Calciatori (Listone Ufficiale)
CREATE TABLE players (
    id INT PRIMARY KEY, -- ID ufficiale del listone Fantacalcio.it
    name VARCHAR(100) NOT NULL,
    role CHAR(1) NOT NULL CHECK (role IN ('P', 'D', 'C', 'A')),
    real_team VARCHAR(50) NOT NULL,
    price_initial INT,
    price_current INT,
    expected_value NUMERIC(4, 2) DEFAULT 0.00,
    oop_index NUMERIC(3, 2) DEFAULT 0.00,
    sp_index NUMERIC(3, 2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabella Dati Posizionali (OOP Detection)
CREATE TABLE player_positions (
    player_id INT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    avg_x NUMERIC(4, 1) DEFAULT 50.0, -- Coordinate medie sul campo (asse orizzontale)
    avg_y NUMERIC(4, 1) DEFAULT 50.0, -- Coordinate medie sul campo (asse verticale, 100 = porta avversaria)
    heatmap_url VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabella Specialisti Calci Piazzati
CREATE TABLE set_piece_takers (
    player_id INT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    penalties_pct NUMERIC(3, 2) DEFAULT 0.00, -- Quota dei rigori battuti (0.00 - 1.00)
    free_kicks_pct NUMERIC(3, 2) DEFAULT 0.00, -- Quota delle punizioni battute
    corners_pct NUMERIC(3, 2) DEFAULT 0.00, -- Quota dei corner battuti
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Storico Statistiche Giornaliere (per calcoli predittivi e ML)
CREATE TABLE player_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    matchday INT NOT NULL,
    opponent VARCHAR(50) NOT NULL,
    rating NUMERIC(4, 2) NOT NULL, -- Fanta-voto base
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    clean_sheet BOOLEAN DEFAULT FALSE,
    yellow_cards INT DEFAULT 0,
    red_cards INT DEFAULT 0,
    minutes_played INT DEFAULT 0,
    expected_goals NUMERIC(4, 2) DEFAULT 0.00,
    expected_assists NUMERIC(4, 2) DEFAULT 0.00
);

-- 7. Log delle Transazioni Asta (Real-Time Sync)
CREATE TABLE draft_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    buyer_roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE,
    price INT NOT NULL CHECK (price >= 1),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDICI DI PERFORMANCE & RICERCA RAPIDA
CREATE INDEX idx_players_role_available ON players(role, is_available);
CREATE INDEX idx_players_expected_value ON players(expected_value DESC);
CREATE INDEX idx_player_stats_player_matchday ON player_stats(player_id, matchday);
CREATE INDEX idx_draft_actions_league ON draft_actions(league_id);
```

--## 3. Struttura del Progetto e Componenti (Java Spring Boot Backend)

La struttura delle directory del backend rispetta le convenzioni standard di un'applicazione Java multi-modulo gestita con Maven o Gradle:

```text
fanta_advisor_srs/
├── backend/
│   ├── api-gateway/            -- Modulo principale per REST API e WebSocket
│   │   ├── src/main/java/com/fantaadvisor/gateway/
│   │   │   ├── config/         -- Configurazione Security, WebSocket, Supabase
│   │   │   ├── controller/     -- Spring REST Controllers (v1)
│   │   │   │   ├── PlayerController.java
│   │   │   │   ├── DraftController.java
│   │   │   │   ├── LineupController.java
│   │   │   │   └── IngestionController.java
│   │   │   ├── model/          -- JPA Entities (mapped to Postgres tables)
│   │   │   ├── repository/     -- Spring Data JPA Repositories
│   │   │   └── FantaGatewayApplication.java
│   │   └── pom.xml
│   ├── solver-worker/          -- Modulo per background workers (calcoli pesanti)
│   │   ├── src/main/java/com/fantaadvisor/solver/
│   │   │   ├── task/           -- Message listeners (Redis/RabbitMQ)
│   │   │   ├── service/        -- Solutori ILP e simulazioni Monte Carlo
│   │   │   └── FantaSolverApplication.java
│   │   └── pom.xml
│   ├── scraper-service/        -- Modulo dedicato allo scraping dati
│   │   ├── src/main/java/com/fantaadvisor/scraper/
│   │   │   ├── parser/         -- Parser HTML/JSON (Jsoup, Playwright Java)
│   │   │   └── FantaScraperApplication.java
│   │   └── pom.xml
│   ├── pom.xml                 -- Maven Parent POM
│   └── Dockerfile
├── docker-compose.yml          -- Sincronizzazione (Gateway, Workers, Redis)
└── README.md
```

### 3.1 Flusso Dati tra Gateway e Workers
1.  **`api-gateway`** riceve una richiesta di acquisto a `/api/v1/draft/purchase`.
2.  Il controller valida la richiesta con `@Valid` ed esegue il salvataggio immediato sul DB cloud (Supabase/PostgreSQL) tramite JPA.
3.  Il gateway pubblica un messaggio di ricalcolo sulla coda Redis/RabbitMQ:
    `template.convertAndSend("draft-queue", leagueId);`
4.  Il **`solver-worker`** è in ascolto sulla coda tramite `@RabbitListener` o `@RedisListener`. Riceve il `leagueId`, carica i dati aggiornati tramite JPA, esegue l'ottimizzazione e scrive i risultati sul database.
5.  Supabase Realtime notifica automaticamente i client web.

---

## 4. Design Patterns di Dettaglio (Java Implementation)

Essendo Java un linguaggio puramente orientato agli oggetti, applicheremo i design pattern sfruttando l'ereditarietà, le interfacce, i generics e l'Iniezione delle Dipendenze (Dependency Injection) di Spring.

### 4.1 Strategy Pattern (Calcolo EV e Punteggi Attesi)
*   **Implementazione**: Interfaccia Java `EVStrategy` implementata dai vari Bean di Spring, selezionati dinamicamente tramite un contesto o un gestore.

```java
public interface EVStrategy {
    double calculateEV(int playerId);
}

@Component("historicalAverageStrategy")
public class HistoricalAverageStrategy implements EVStrategy {
    @Override
    public double calculateEV(int playerId) {
        // Logica basata sulle medie storiche
        return 6.0;
    }
}

@Component("tacticalHackStrategy")
public class TacticalHackStrategy implements EVStrategy {
    @Override
    public double calculateEV(int playerId) {
        // Logica incrementata con OOP index e piazzati
        return 7.5;
    }
}

@Service
public class EVContext {
    private final Map<String, EVStrategy> strategies;

    @Autowired
    public EVContext(Map<String, EVStrategy> strategies) {
        this.strategies = strategies;
    }

    public double getPlayerEV(int playerId, String strategyName) {
        EVStrategy strategy = strategies.get(strategyName);
        if (strategy == null) {
            throw new IllegalArgumentException("Strategy non trovata");
        }
        return strategy.calculateEV(playerId);
    }
}
```

### 4.2 Factory Pattern (Scrapers Engine)
*   **Implementazione**: Factory che restituisce la classe scraper corretta implementando l'interfaccia `BaseScraper`.

```java
public interface BaseScraper {
    List<Map<String, Object>> scrape();
}

public class FantacalcioScraper implements BaseScraper {
    @Override
    public List<Map<String, Object>> scrape() {
        // Parsing Jsoup di Fantacalcio.it
        return new ArrayList<>();
    }
}

public class SofaScoreScraper implements BaseScraper {
    @Override
    public List<Map<String, Object>> scrape() {
        // Scraping posizionale con Playwright Java
        return new ArrayList<>();
    }
}

@Component
public class ScraperFactory {
    public BaseScraper getScraper(String sourceType) {
        switch (sourceType.toLowerCase()) {
            case "quotes": return new FantacalcioScraper();
            case "tactics": return new SofaScoreScraper();
            default: throw new IllegalArgumentException("Sorgente non supportata");
        }
    }
}
```

### 4.3 Repository Pattern (Spring Data JPA)
*   **Implementazione**: Estensione di `JpaRepository` per delegare a Spring la generazione automatica delle query SQL per PostgreSQL.

```java
@Repository
public interface PlayerRepository extends JpaRepository<PlayerEntity, Integer> {
    
    @Query("SELECT p FROM PlayerEntity p WHERE p.role = :role AND p.isAvailable = true")
    List<PlayerEntity> findAvailableByRole(@Param("role") String role);
    
    @Modifying
    @Query("UPDATE PlayerEntity p SET p.oopIndex = :oop, p.spIndex = :sp WHERE p.id = :id")
    void updateIndices(@Param("id") int id, @Param("oop") double oop, @Param("sp") double sp);
}
```

### 4.4 Facade Pattern (Optimization Engine Facade)
*   **Implementazione**: Facciata che nasconde la complessità della formulazione dei vincoli e dell'interazione con i solutori C++ o wrappers Java (es. Google OR-Tools Java wrapper).

```java
@Service
public class OptimizationFacade {
    private final PlayerRepository playerRepository;
    private final RosterRepository rosterRepository;

    @Autowired
    public OptimizationFacade(PlayerRepository playerRepository, RosterRepository rosterRepository) {
        this.playerRepository = playerRepository;
        this.rosterRepository = rosterRepository;
    }

    public SuggestedLineupDTO suggestLineup(UUID rosterId, int matchday) {
        // 1. Recupera la rosa
        // 2. Recupera l'EV dei giocatori per giornata
        // 3. Imposta vincoli di modulo e budget del solutore Java
        // 4. Risolve e mappa in un DTO ad alto livello
        return new SuggestedLineupDTO();
    }
}
```


