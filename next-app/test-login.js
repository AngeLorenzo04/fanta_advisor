const puppeteer = require('puppeteer');
require('dotenv').config();

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto("https://leghe.fantacalcio.it/login", { waitUntil: "networkidle2" });
  
  await page.waitForSelector('input[placeholder="Username"]', { visible: true });
  await page.type('input[placeholder="Username"]', process.env.FANTA_EMAIL, { delay: 50 });
  await page.type('input[placeholder="Password"]', process.env.FANTA_PASSWORD, { delay: 50 });
  
  await page.screenshot({ path: 'test-typed.png' });
  await browser.close();
  console.log("Screenshot taken");
})();
