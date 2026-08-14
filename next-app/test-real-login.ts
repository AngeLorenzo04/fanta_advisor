import { BrowserService } from './src/scripts/fanta-sync/browser';

(async () => {
  const browserService = new BrowserService();
  const page = await browserService.init();
  
  const success = await browserService.login('fantahospital15');
  if (!success) {
    console.log("Login failed");
    await browserService.close();
    return;
  }

  console.log("Navigating to dashboard to dump links...");
  await page.goto('https://leghe.fantacalcio.it/fantahospital15', { waitUntil: "networkidle2" });
  
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent?.trim() || '',
        href: a.href
    })).filter(a => a.href.includes('fantahospital15'));
  });
  
  console.log(JSON.stringify(links, null, 2));

  await page.screenshot({ path: 'dashboard-success.png', fullPage: true });

  await browserService.close();
})();
