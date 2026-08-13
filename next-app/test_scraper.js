const cheerio = require('cheerio');
fetch('https://www.fantacalcio.it/quotazioni-fantacalcio', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}).then(res => res.text()).then(html => {
  const $ = cheerio.load(html);
  let count = 0;
  $('tr.player-row, .player-item, tr[data-id]').each((_, row) => {
    const rawName = $(row).find('a.player-name span, a.player-name').first().text().trim() || $(row).find('.player-name').text().trim();
    if (count < 5) console.log("Parsed Name:", rawName);
    count++;
  });
}).catch(console.error);
