# Fanta-Advisor 26/27 - Backend & Infrastructure

Fanta-Advisor è un sistema distribuito progettato in Java (Spring Boot) per fornire un vantaggio analitico strategico nella stagione di Fantacalcio 2026/2027.

---

## Struttura del Progetto

Il progetto è strutturato come un monolite multi-modulo Maven orchestrato tramite container Docker:

*   **`shared`**: Modulo comune contenente le entità JPA (`Player`, `AuctionParticipant`, `Purchase`) e i relativi repository di persistenza condivisi tra tutti i servizi.
*   **`api-gateway`**: Espone le API RESTful `/api/v1` ed i WebSocket per la sincronizzazione real-time.
*   **`solver-worker`**: Consuma i task asincroni da Redis per eseguire i calcoli analitici pesanti (solutore ILP e simulatore Monte Carlo) memorizzandoli nel DB.
*   **`scraper-service`**: Esegue lo scraping periodico e manuale (Jsoup, Playwright Java) per caricare dati storici, quotazioni, notizie e heatmaps.

---

## Prerequisiti per lo Sviluppo

Per sviluppare ed eseguire l'applicazione localmente, assicurati di avere installato:
*   **Java JDK 17** (o superiore)
*   **Maven 3.8+**
*   **Docker & Docker Compose**
*   Un IDE compatibile con Java (consigliato **IntelliJ IDEA** o **VS Code** con l'estensione Extension Pack for Java).

---

## Come Avviare l'Ambiente Locale

### 1. Avvio Rapido con Docker Compose
Dalla cartella principale del progetto, esegui il comando:

```bash
docker-compose up --build
```

Questo comando compilerà i sorgenti Java all'interno del container tramite un builder multi-stage Maven, avvierà un'istanza Redis ed un'istanza PostgreSQL locale configurando automaticamente le connessioni tra i moduli.

*   **Swagger UI (API Gateway)**: http://localhost:8080/swagger-ui.html
*   **Porta Database Postgres locale**: `5432` (Credenziali: `postgres` / `postgres`)
*   **Porta Redis Broker**: `6379`
*   **Servizio Scraper (Porta locale)**: `8082`
*   **Servizio Solver (Porta locale)**: `8081`

### 2. Come Testare il Sistema

#### Test Automatici (JUnit)
Per eseguire tutti i test unitari e di integrazione (inclusa la verifica del caricamento dei contesti Spring Boot e dello schema JPA):
1. Spostati nella cartella `backend`:
   ```bash
   cd backend
   ```
2. Esegui il comando Maven:
   ```bash
   mvn test
   ```

#### Test Manuali ed Endpoint
Una volta che l'ambiente Docker Compose è avviato, puoi testare il sistema nei seguenti modi:
*   **Swagger UI**: Visita http://localhost:8080/swagger-ui.html nel browser per invocare gli endpoint REST disponibili (ad es. `/api/v1/health`).
*   **Curl**:
    ```bash
    curl -i http://localhost:8080/api/v1/health
    ```

### 3. Sviluppo in Locale (IDE)
Se preferisci lanciare l'applicazione direttamente dal tuo IDE (es. IntelliJ) per fare debugging:
1.  Avvia solo i servizi di broker e database di supporto tramite Docker:
    ```bash
    docker-compose up -d redis db
    ```
2.  Importa il progetto Maven principale `backend/pom.xml` sul tuo IDE.
3.  Esegui la classe principale `FantaGatewayApplication` nel modulo `api-gateway` o `FantaSolverApplication` nel modulo `solver-worker`. Le configurazioni locali di default cercheranno `localhost:6379` e `localhost:5432` connettendosi automaticamente.

---

## Integrazione Cloud (Supabase)
Per connettere l'applicazione al DB Cloud di Supabase anziché al Postgres locale, sovrascrivi le variabili d'ambiente nel file `.env` locale (non tracciato da git) o nel tuo ambiente operativo:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://<supabase-host>:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<your-supabase-password>
```
