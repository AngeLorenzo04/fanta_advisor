import * as cheerio from 'cheerio';

async function run() {
  try {
    const response = await fetch("https://www.fantacalcio.it/quotazioni-fantacalcio", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });

    console.log("Fetch OK?", response.ok, response.status);
    const html = await response.text();
    console.log("HTML length:", html.length);
    const $ = cheerio.load(html);
    
    let count = 0;
    $('tr.player-row, .player-item, tr[data-id]').each((_, row) => { count++; });
    console.log("Players found:", count);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

run();
