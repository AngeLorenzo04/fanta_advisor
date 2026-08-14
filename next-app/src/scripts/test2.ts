import * as cheerio from 'cheerio';

async function run() {
  const response = await fetch("https://www.fantacalcio.it/quotazioni-fantacalcio", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const firstRow = $('tr.player-row, .player-item, tr[data-id]').first();
  const rawName = firstRow.find('a.player-name span, a.player-name').first().text().trim() || firstRow.find('.player-name').text().trim();
  const teamAbbr = firstRow.find('.player-team, .team').text().trim().toUpperCase();
  console.log("Name:", rawName, "Team:", teamAbbr);
}
run();
