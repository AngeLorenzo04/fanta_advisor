import { Page } from 'puppeteer';

export interface ScrapedPurchase {
  name: string;
  cost: number;
}

export interface ScrapedTeam {
  name: string;
  mister?: string;
  initialBudget: number;
  players: ScrapedPurchase[];
}

export interface ScrapedPlayer {
  name: string;
  team: string;
  role: string;
  initialQuote?: number;
  currentQuote?: number;
  fvm?: number;
}

export class ScraperService {
  constructor(private page: Page, private leagueName: string) {}

  async scrapeRose(): Promise<ScrapedTeam[]> {
    const roseUrl = `https://leghe.fantacalcio.it/${this.leagueName}/view/rosters`;
    console.log(`📄 Navigazione verso le rose: ${roseUrl}`);
    
    await this.page.goto(roseUrl, { waitUntil: "networkidle2" });
    console.log("📡 Scansione delle tabelle delle Rose nel DOM...");
    
    const scrapedTeams = await this.page.evaluate(() => {
      const teams: { name: string; mister: string; initialBudget: number; players: any[] }[] = [];
      
      const teamItems = Array.from(document.querySelectorAll('ul.team-list li'));
      
      for (const item of teamItems) {
        const titleEl = item.querySelector('.ant-card-meta-title');
        const misterEl = item.querySelector('.ant-card-meta-description');
        
        if (titleEl && titleEl.textContent) {
           const teamName = titleEl.textContent.trim();
           const misterName = misterEl ? misterEl.textContent.trim() : "Mister Sconosciuto";
           
           teams.push({
             name: teamName,
             mister: misterName,
             initialBudget: 500,
             players: []
           });
        }
      }
      
      return teams;
    });

    if (scrapedTeams.length === 0) {
      console.error("❌ Nessuna rosa trovata. Salvataggio screenshot in debug-error.png...");
      await this.page.screenshot({ path: 'debug-error.png', fullPage: true });
      throw new Error("Nessuna rosa trovata nel DOM.");
    }

    return scrapedTeams;
  }

  async scrapeListone(): Promise<ScrapedPlayer[]> {
    const dashboardUrl = `https://leghe.fantacalcio.it/${this.leagueName}`;
    console.log(`📄 Navigazione verso la Dashboard per accedere al Listone: ${dashboardUrl}`);
    
    await this.page.goto(dashboardUrl, { waitUntil: "networkidle2" });
    
    console.log("🖱️ Clicco su 'Lista Calciatori'...");
    await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const link = links.find(l => l.textContent && l.textContent.toLowerCase().includes('lista calciatori'));
      if (link) link.click();
    });

    console.log("📡 Estrazione dati dei calciatori in corso...");
    
    // Attendiamo che l'URL cambi o che compaia la tabella
    try {
      await this.page.waitForSelector('table tbody tr', { timeout: 15000 });
    } catch (e) {
      console.log("⚠️ Nessuna tabella trovata o caricamento lento. Provo a estrarre comunque...");
    }

    // Scroll per lazy loading se presente
    await this.autoScroll();

    const scrapedPlayers = await this.page.evaluate(() => {
      const playersList: ScrapedPlayer[] = [];
      const rows = document.querySelectorAll('table tbody tr');

      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length >= 5) {
          // Ipotizziamo un ordine standard: [Ruolo, Nome, Squadra, Quotazione Attuale, Quotazione Iniziale, FVM]
          // Cerchiamo le celle basandoci sulle classi o sul contenuto se possibile.
          let role = "Sconosciuto";
          let name = "";
          let team = "Sconosciuta";
          let initialQuote = 1;
          let currentQuote = 1;
          let fvm = 1;

          // Tentativo euristico di estrazione
          cells.forEach((cell, index) => {
             const text = cell.textContent?.trim() || "";
             
             // Ruolo spesso ha una classe (role, r) o testo breve (P, D, C, A)
             if (text === 'P' || text === 'D' || text === 'C' || text === 'A' || text.match(/^[PDCWTA]$/)) {
                 role = text;
             }
             
             // Il nome spesso è un link <a> o un tag <b> o uno span con classe name
             const nameEl = cell.querySelector('.player-name, a, b, strong');
             if (nameEl && nameEl.textContent) {
                 name = nameEl.textContent.trim().toUpperCase();
             } else if (text.length > 3 && isNaN(Number(text)) && !text.includes('€') && index === 1) {
                 // Spesso il nome è la seconda colonna
                 name = text.toUpperCase();
             }

             // Squadra è spesso in lettere maiuscole o ha un'icona
             if (text.length >= 3 && text.length <= 15 && isNaN(Number(text)) && index === 2) {
                 team = text.toUpperCase();
             }

             // Numeri: Q. Attuale, Q. Iniziale, FVM
             const num = parseInt(text, 10);
             if (!isNaN(num)) {
                 if (index === 3 || cell.classList.contains('current-quote') || cell.getAttribute('data-header') === 'Qt.A') {
                     currentQuote = num;
                 } else if (index === 4 || cell.classList.contains('initial-quote') || cell.getAttribute('data-header') === 'Qt.I') {
                     initialQuote = num;
                 } else if (index === 5 || cell.classList.contains('fvm') || cell.getAttribute('data-header') === 'FVM') {
                     fvm = num;
                 }
             }
          });

          if (name && name !== "") {
            playersList.push({ name, team, role, initialQuote, currentQuote, fvm });
          }
        }
      });
      return playersList;
    });

    console.log(`✅ Estratti ${scrapedPlayers.length} calciatori dal Listone.`);
    return scrapedPlayers;
  }

  private async autoScroll() {
    await this.page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight || totalHeight > 10000) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}
