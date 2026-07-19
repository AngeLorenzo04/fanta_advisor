# Scelte Architetturali - Fanta-Advisor

Questo documento traccia le decisioni architetturali concordate con il Software Engineer (Angelo) durante la fase di analisi e definizione dell'architettura del software.

---

## 1. Topologia di Rete e Stile Architetturale
*   **Stile**: Architettura Distribuita (Decoupled Services).
*   **Decoupling del Calcolo**: Le operazioni CPU-bound (Solutore ILP per asta/formazione, simulatore Monte Carlo per il rating) saranno scorporate dall'applicazione principale.
*   **Gestione Task Pesanti**: Utilizzo di un Message Broker (es. Redis o RabbitMQ) e Background Workers in Java (applicazioni Spring Boot separate o thread-pool isolati) per processare i calcoli analitici in modalità asincrona distribuita.

## 2. Modello di Comunicazione e Sincronizzazione
*   **Paradigma**: Event-Driven Push.
*   **Sincronizzazione Client**: Al termine dei calcoli distribuiti, i background workers scrivono i risultati direttamente nel DB Cloud / inviano un messaggio Pub/Sub. I client aggiornano la UI in tempo reale tramite sottoscrizioni attive (WebSocket / Supabase Realtime). Viene evitato il polling attivo da parte dei client.

## 3. Architettura della Pipeline di Ingestion (Scraping)
*   **Orchestrazione**: Approccio Ibrido.
*   **Pianificazione Periodica**: Task pianificati automatizzati (es. Spring `@Scheduled` o Spring Batch) per estrarre statistiche storiche, voti post-giornata e quotazioni a intervalli fissi (giornalieri/settimanali).
*   **Trigger Manuale**: API dedicate per consentire il trigger on-demand immediato dello scraping tramite interfaccia utente (es. per caricare probabili formazioni dell'ultimo secondo).

## 4. Gestione della Concorrenza (Concurrency Control)
*   **Approccio**: Concorrenza Ottimistica con politica Last-Write-Wins (LWW).
*   **Implementazione**: Le modifiche concorrenti effettuate dai co-gestori vengono risolte a livello di transazione del Cloud Database (PostgreSQL). La sincronizzazione real-time (Supabase) aggiorna istantaneamente la UI dell'altro client per visualizzare lo stato finale consolidato.

## 5. Infrastruttura e Deployment (Containerizzazione)
*   **Tecnologia**: Docker & Docker Compose.
*   **Topologia dei Container**:
    - `api-gateway`: Container Spring Boot (Java) per l'interfaccia REST/WebSocket e routing.
    - `solver-worker`: Background worker Spring Boot (Java) per i calcoli pesanti (ILP, Monte Carlo).
    - `broker`: Redis o RabbitMQ come message broker per la coda dei task.
    - `telegram-bot`: Processo asincrono per il Telegram Bot (scritto in Java).
*   **Data Tier**: Esterno e Cloud-based (Supabase PostgreSQL), acceduto tramite JDBC e JPA (Spring Data JPA).

## 6. Progettazione delle API e Protocolli
*   **Paradigma API**: RESTful (JSON).
*   **Validazione e Schemi**: Spring Validation (`javax.validation` / `jakarta.validation`) con Jackson per la serializzazione/deserializzazione JSON.
*   **Documentazione**: Specifica OpenAPI 3.0 generata automaticamente tramite Springdoc-openapi (Swagger UI accessibile a `/swagger-ui.html`).
