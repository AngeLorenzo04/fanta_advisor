const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto("https://leghe.fantacalcio.it/login", { waitUntil: "networkidle2" });
  await page.waitForSelector('input');
  const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, id: i.id, placeholder: i.placeholder, name: i.name, class: i.className })));
  console.log(inputs);
  await browser.close();
})();
