const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
require('dotenv').config();

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const page = await browser.newPage();
  
  let apiData = null;
  
  page.on('response', async res => {
    if (res.request().method() === 'POST' && res.url().includes('login')) {
      try {
        const json = await res.json();
        if (json.success && json.data) {
          apiData = json.data;
        }
      } catch(e) {}
    }
  });

  await page.goto("https://leghe.fantacalcio.it/login", { waitUntil: "networkidle2" });
  
  await page.waitForSelector('input[placeholder="Username"]', { visible: true });
  await page.type('input[placeholder="Username"]', process.env.FANTA_EMAIL, { delay: 50 });
  await page.type('input[placeholder="Password"]', process.env.FANTA_PASSWORD, { delay: 50 });
  
  await page.evaluate(() => {
    const btn = document.querySelector('button.ant-btn-primary');
    if (btn) btn.click();
  });
  
  await page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 15000 }).catch(()=>{});
  
  if (apiData) {
    const lega = apiData.leghe.find(l => l.alias === process.env.FANTA_LEAGUE);
    if (lega) {
       console.log("Found Lega ID:", lega.id);
       // Now try to fetch the rose API using the lega token
       try {
         const roseRes = await page.evaluate(async (legaId, jwt) => {
            const res = await fetch(`https://leghe.fantacalcio.it/servizi/v1/leghe/${legaId}/rose`, {
               headers: {
                 'app_key': '4aa6e1de1c960b73c8868f0706240217eb74a62e',
                 'Authorization': `Bearer ${jwt}`
               }
            });
            return res.status === 200 ? await res.json() : res.status;
         }, lega.id, lega.jwt);
         console.log("ROSE API STATUS/RES:", typeof roseRes === 'object' ? 'Success JSON' : roseRes);
       } catch (e) {
         console.log("API Fetch failed:", e.message);
       }
    }
  }
  
  await browser.close();
})();
