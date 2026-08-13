import puppeteer from 'puppeteer-extra';
import { Browser, Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as dotenv from 'dotenv';

puppeteer.use(StealthPlugin());
dotenv.config();

export class BrowserService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<Page> {
    this.browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] 
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    return this.page;
  }

  async login(leagueName: string): Promise<boolean> {
    if (!this.page) throw new Error("Browser not initialized");

    const { FANTA_EMAIL, FANTA_PASSWORD } = process.env;
    if (!FANTA_EMAIL || !FANTA_PASSWORD) {
      throw new Error("❌ ERRORE: Mancano FANTA_EMAIL o FANTA_PASSWORD nel file .env");
    }

    console.log(`🕵️‍♂️ Avvio Operazione Infiltrazione per la lega: ${leagueName}...`);
    console.log("🔑 Inserimento credenziali...");
    
    await this.page.goto("https://leghe.fantacalcio.it/login", { waitUntil: "networkidle2" });
    
    // Cookie acceptance
    try {
      console.log("Accettazione cookie in corso...");
      await this.page.waitForSelector('button', { timeout: 5000 });
      await this.page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const acceptBtn = btns.find(b => b.textContent?.toLowerCase().includes('accetta tutti'));
        if (acceptBtn) acceptBtn.click();
        
        const iubenda = document.querySelector('.iubenda-cs-accept-btn') as HTMLElement;
        if (iubenda) iubenda.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      // Ignora errori banner cookie
    }

    try {
      await this.page.waitForSelector("input[placeholder='Username']", { timeout: 10000 });
    } catch (e) {
      console.log("Form non caricato in tempo. Provo comunque...");
    }

    const emailSelector = "input[placeholder='Username']";
    const passSelector = "input[placeholder='Password']";
    
    await this.page.waitForSelector(emailSelector, { timeout: 15000, visible: true });
    await this.page.type(emailSelector, FANTA_EMAIL, { delay: 50 });
    
    await this.page.waitForSelector(passSelector, { timeout: 15000, visible: true });
    await this.page.type(passSelector, FANTA_PASSWORD, { delay: 50 });
    
    console.log("Clicco su Accedi...");
    await this.page.evaluate(() => {
      const btn = document.querySelector('button.ant-btn-primary') as HTMLButtonElement;
      if (btn) btn.click();
    });

    console.log("⏳ Attesa autenticazione (salvataggio sessione)...");
    try {
      await this.page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));
      console.log("✅ Autenticazione completata con successo!");
      return true;
    } catch (e) {
      console.log("⚠️ Timeout attesa cambio URL, il login potrebbe essere fallito.");
      return false;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
