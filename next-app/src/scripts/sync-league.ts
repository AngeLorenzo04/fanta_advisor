import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function run() {
  const { FANTA_EMAIL, FANTA_PASSWORD, FANTA_LEAGUE } = process.env;
  if (!FANTA_EMAIL || !FANTA_PASSWORD || !FANTA_LEAGUE) {
    console.error("❌ ERRORE: Mancano FANTA_EMAIL, FANTA_PASSWORD o FANTA_LEAGUE nel file .env");
    process.exit(1);
  }

  console.log(`🕵️‍♂️ Avvio Operazione Infiltrazione per la lega: ${FANTA_LEAGUE}...`);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // 1. Login
  console.log("🔑 Inserimento credenziali...");
  
  page.on('response', async res => {
    if (res.request().method() === 'POST' && res.url().includes('login')) {
      const text = await res.text().catch(() => '');
      console.log('RISPOSTA LOGIN API:', res.status(), text);
    }
  });

  await page.goto("https://leghe.fantacalcio.it/login", { waitUntil: "networkidle2" });
  
  try {
    console.log("Accettazione cookie in corso...");
    await page.waitForSelector('button', { timeout: 5000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const acceptBtn = btns.find(b => b.textContent?.toLowerCase().includes('accetta tutti'));
      const rejectBtn = btns.find(b => b.textContent?.toLowerCase().includes('continua senza accettare'));
      if (acceptBtn) acceptBtn.click();
      else if (rejectBtn) rejectBtn.click();
      
      const iubenda = document.querySelector('.iubenda-cs-accept-btn') as HTMLElement;
      if (iubenda) iubenda.click();
    });
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {}

  try {
    console.log("Attendendo il caricamento del form di login...");
    await page.waitForSelector("input", { timeout: 10000 });
  } catch (e) {
    console.log("Form non caricato in tempo. Provo comunque...");
  }

  // Usa type per simulare veri tasti, e click per il bottone
  const emailSelector = "input[placeholder='Username']";
  const passSelector = "input[placeholder='Password']";
  const loginBtnSelector = "button.ant-btn-primary";
  
  await page.waitForSelector(emailSelector, { timeout: 15000, visible: true });
  await page.type(emailSelector, FANTA_EMAIL, { delay: 50 });
  
  await page.waitForSelector(passSelector, { timeout: 15000, visible: true });
  await page.type(passSelector, FANTA_PASSWORD, { delay: 50 });
  
  console.log("Clicco su Accedi...");
  await page.evaluate(() => {
    const btn = document.querySelector('button.ant-btn-primary') as HTMLButtonElement;
    if (btn) btn.click();
  });

  console.log("⏳ Attesa autenticazione (salvataggio sessione)...");
  try {
    // Aspettiamo che Angular navighi via dalla pagina di login
    await page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 15000 });
    // Diamo ancora un paio di secondi ad Angular per impostare i cookie
    await new Promise(r => setTimeout(r, 2000));
    console.log("✅ Autenticazione completata con successo!");
  } catch (e) {
    console.log("⚠️ Timeout attesa cambio URL, il login potrebbe essere fallito.");
  }

  const roseUrl = `https://leghe.fantacalcio.it/${FANTA_LEAGUE}/rose`;
  console.log(`📄 Navigazione verso le rose: ${roseUrl}`);
  
  await page.goto(roseUrl, { waitUntil: "networkidle2" });
  
  console.log("📡 Scansione delle tabelle delle Rose nel DOM...");
  const scrapedTeams = await page.evaluate(() => {
    const teams: any[] = [];
    const tables = Array.from(document.querySelectorAll('table'));
    
    tables.forEach(table => {
       let teamName = "Sconosciuta";
       const prev = table.previousElementSibling;
       if (prev && prev.textContent) teamName = prev.textContent.trim();
       else {
         const header = table.parentElement?.querySelector('h1, h2, h3, h4, .title, .team-name');
         if (header && header.textContent) teamName = header.textContent.trim();
       }
       
       const players: any[] = [];
       const rows = table.querySelectorAll('tbody tr');
       rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
             let name = "";
             let cost = 1;
             cells.forEach(cell => {
                const link = cell.querySelector('a');
                if (link && link.textContent) name = link.textContent.trim().toUpperCase();
                else if (!name && cell.textContent && !cell.textContent.includes('€') && isNaN(Number(cell.textContent))) {
                    name = cell.textContent.trim().toUpperCase();
                }
             });
             
             // Extract cost from the second-to-last cell (Q.acq.)
             if (cells.length >= 5) {
                const costCell = cells[cells.length - 2];
                if (costCell && costCell.textContent) {
                   const parsed = parseInt(costCell.textContent.replace(/[^0-9]/g, ''));
                   if (!isNaN(parsed)) cost = parsed;
                }
             }

             if (name && !name.includes('CALCIATORE NON')) {
                players.push({ name, cost });
             }
          }
       });
       
       let initialBudget = 500;
       // Find crediti residui
       const parentCard = table.closest('.card') || table.parentElement?.parentElement;
       if (parentCard) {
          const budgetEl = parentCard.querySelector('.text-xl.font-bold, .value, [class*="crediti"]');
          if (budgetEl && budgetEl.textContent) {
             const parsed = parseInt(budgetEl.textContent.replace(/[^0-9]/g, ''));
             if (!isNaN(parsed)) initialBudget = parsed;
          } else {
             // Try searching text
             const allText = parentCard.textContent || "";
             const match = allText.match(/CREDITI RESIDUI\s*(\d+)/i);
             if (match) initialBudget = parseInt(match[1]);
          }
       }

       if (teamName !== "Sconosciuta") {
          teams.push({ name: teamName, players, initialBudget });
       }
    });
    return teams;
  });

  if (scrapedTeams.length === 0) {
    console.error("❌ Nessuna rosa trovata. Salvataggio screenshot in debug-error.png...");
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
    
    // Proviamo a estrarre il testo della pagina per capire dove siamo
    const pageText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
    console.error("TESTO PAGINA:", pageText);
    
    await browser.close();
    process.exit(1);
  }

  console.log(`✅ Trovate ${scrapedTeams.length} rose! Procedo con l'inserimento nel DB di Stato...`);

  // 3. Sincronizzazione Database
  let totalPurchases = 0;
  for (const team of scrapedTeams) {
    console.log(`- ${team.name}: ${team.players.length} giocatori, Budget: ${team.initialBudget || 500}`);
      
    const dbTeam = await prisma.auctionParticipant.upsert({
      where: { name: team.name },
      update: { 
         initialBudget: 500,
         remainingBudget: team.initialBudget || 500
      },
      create: {
        name: team.name,
        initialBudget: 500,
        remainingBudget: team.initialBudget || 500
      }
    });

    let participant = await prisma.auctionParticipant.findFirst({
      where: { name: { contains: team.name, mode: 'insensitive' } }
    });
    
    if (!participant) {
      participant = await prisma.auctionParticipant.create({
        data: { name: team.name, initialBudget: 500 }
      });
      console.log(`🆕 Creato nuovo Mister: ${team.name}`);
    }

    let teamPurchases = 0;
    for (const p of team.players) {
      const cleanedName = p.name.split(' ')[0].toLowerCase();
      
      const dbPlayer = await prisma.player.findFirst({
        where: { name: { startsWith: cleanedName, mode: 'insensitive' } }
      });
      
      if (dbPlayer) {
        const existingPurchase = await prisma.purchase.findUnique({
          where: { playerId: dbPlayer.id }
        });
        
        if (!existingPurchase) {
          await prisma.purchase.create({
            data: {
              playerId: dbPlayer.id,
              participantId: participant.id,
              cost: p.cost
            }
          });
          teamPurchases++;
          totalPurchases++;
        }
      }
    }
    console.log(`📥 Inseriti ${teamPurchases} nuovi acquisti per ${team.name}`);
  }

  console.log(`🎉 Sincronizzazione completata! Totale giocatori aggiornati: ${totalPurchases}`);
  await browser.close();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
