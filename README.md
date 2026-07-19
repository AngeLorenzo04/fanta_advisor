# Fanta-Advisor 26/27 - Backend & Infrastructure

Fanta-Advisor è un sistema distribuito progettato in Java (Spring Boot) per fornire un vantaggio analitico strategico nella stagione di Fantacalcio 2026/2027.

---

## Struttura del Progetto

Il progetto è strutturato come un monolite multi-modulo Maven orchestrato tramite container Docker:

*   **`api-gateway`**: Espone le API RESTful `/api/v1` ed i WebSocket per la sincronizzazione real-time.
*   **`solver-worker`**: Consuma i task asincroni da Redis/RabbitMQ per eseguire i calcoli analitici pesanti (solutore ILP e simulatore Monte Carlo) memorizzandoli nel DB.
*   **`scraper-service`**: Esegue lo scraping periodico e manuale (Jsoup, Playwright Java) per caricare dati storici, piazzati, notizie e heatmaps.

---

## Prerequisiti per lo Sviluppo

Per sviluppare ed eseguire l'applicazione localmente, assicurati di avere installato:
*   **Java JDK 17**
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

*   **Swagger API Gateway UI**: http://localhost:8080/swagger-ui.html
*   **Porta Database Postgres locale**: `5432` (Credenziali: `postgres` / `postgres`)
*   **Porta Redis Broker**: `6379`

### 2. Sviluppo in Locale (IDE)
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
