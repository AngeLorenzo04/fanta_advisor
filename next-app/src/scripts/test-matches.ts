import * as cheerio from 'cheerio';

async function run() {
  const response = await fetch("https://www.fantacalcio.it/probabili-formazioni-serie-a", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const matches: any[] = [];
  $('.team-name').each((i, el) => {
    console.log($(el).text().trim());
  });
}
run();
