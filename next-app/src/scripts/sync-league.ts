import { BrowserService } from './fanta-sync/browser';
import { ScraperService } from './fanta-sync/scraper';
import { DatabaseService } from './fanta-sync/db';

async function run() {
  const { FANTA_LEAGUE } = process.env;
  if (!FANTA_LEAGUE) {
    console.error("❌ ERRORE: Manca FANTA_LEAGUE nel file .env");
    process.exit(1);
  }

  const browserService = new BrowserService();
  const dbService = new DatabaseService();

  try {
    const page = await browserService.init();
    
    // 1. Login
    const loggedIn = await browserService.login(FANTA_LEAGUE);
    if (!loggedIn) {
      console.error("❌ Autenticazione fallita o interrotta.");
      process.exit(1);
    }

    const scraper = new ScraperService(page, FANTA_LEAGUE);

    // 2. Scrape Listone (Giocatori)
    // DISABILITATO: Il Listone ora si scarica perfettamente e molto più velocemente 
    // dal bottone 'Seed DB' sul sito (che non richiede login).
    /*
    try {
      const scrapedPlayers = await scraper.scrapeListone();
      if (scrapedPlayers.length > 0) {
        await dbService.syncPlayers(scrapedPlayers);
      }
    } catch (e: any) {
      console.error("❌ Errore durante lo scraping del Listone:", e.message);
    }
    */

    // 3. Scrape Rose (Squadre e acquisti)
    try {
      const scrapedTeams = await scraper.scrapeRose();
      if (scrapedTeams.length > 0) {
        await dbService.syncTeams(scrapedTeams);
      }
    } catch (e: any) {
      console.error("❌ Errore durante lo scraping delle Rose:", e.message);
    }

    console.log("\n✅ Operazione Infiltrazione conclusa con successo!");
  } catch (error: any) {
    console.error("\n❌ Errore critico:", error.message);
  } finally {
    await browserService.close();
    await dbService.disconnect();
    process.exit(0);
  }
}

run();
