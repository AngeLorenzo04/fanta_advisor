# Fanta-Advisor 26/27

Fanta-Advisor è un ecosistema completo (Frontend + Backend + Telegram Bot) progettato per fornire un vantaggio analitico strategico nella stagione di Fantacalcio 2026/2027.

L'architettura originaria a microservizi Java è stata migrata e consolidata in un monolite moderno basato su **Next.js, TypeScript e Prisma ORM** per garantire maggiore rapidità di sviluppo e una singola codebase integrata.

---

## Struttura del Progetto

Il sistema è diviso in due repository principali:

1. **`next-app` (Backend & API Gateway)**
   - *Framework*: Next.js (App Router), Prisma, PostgreSQL.
   - Fornisce le API RESTful per gestire giocatori, squadre e acquisti (`/api/v1/...`).
   - Contiene la logica per il **Bot Telegram** (Webhook ed elaborazione messaggi).
   - Espone algoritmi per il calcolo della **miglior formazione ottimale**.
   - Avvio: `npm run dev` (Porta di default: `3000`)

2. **`frontend-fantaAdvisor` (Dashboard Frontend)**
   - *Framework*: Next.js, React, TailwindCSS.
   - Fornisce l'interfaccia utente (Dashboard, Asta Live, Rose, Valutazioni).
   - Proxy configurato per instradare automaticamente le richieste API verso il backend.
   - Avvio: `npm run dev -- -p 3001` (Porta: `3001`)

---

## Prerequisiti per lo Sviluppo

Per sviluppare ed eseguire l'applicazione localmente, assicurati di avere installato:
*   **Node.js** (v18 o superiore)
*   **npm** o **pnpm**
*   **PostgreSQL** (locale o tramite Docker)

---

## Come Avviare l'Ambiente Locale

### 1. Avvio del Database
Assicurati che PostgreSQL sia in esecuzione e configura le variabili d'ambiente nel file `.env` all'interno della cartella `next-app`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fanta_db?schema=public"
TELEGRAM_BOT_TOKEN="il_tuo_token_telegram"
TELEGRAM_GROUP_CHAT_ID="id_del_gruppo"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

Applica le migrazioni al database (se non già fatto):
```bash
cd next-app
npx prisma db push
```

### 2. Avvio del Backend (API & Telegram Bot)
```bash
cd next-app
npm install
npm run dev
```
Il backend sarà raggiungibile su `http://localhost:3000`.

### 3. Avvio del Frontend (Dashboard)
In un nuovo terminale, avvia il frontend:
```bash
cd ../frontend-fantaAdvisor
npm install
npm run dev -- -p 3001
```
Il frontend sarà raggiungibile su `http://localhost:3001`.

### 4. Collegamento del Bot Telegram (Webhook)
Essendo il server in locale, Telegram richiede un URL pubblico per contattare il tuo webhook.
1. Avvia localtunnel per esporre il backend:
   ```bash
   npx localtunnel --port 3000
   ```
2. Accedi alla Dashboard del frontend (`http://localhost:3001`), clicca sul pulsante **Bot Telegram** in alto a destra, e inserisci l'URL pubblico generato da localtunnel.
3. Clicca su **Attiva** per collegare il bot al tuo server locale in un solo click.
