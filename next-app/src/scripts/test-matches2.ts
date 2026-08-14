import * as cheerio from 'cheerio';

async function run() {
  const response = await fetch("https://www.fantacalcio.it/probabili-formazioni-serie-a", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const matches: {home: string, away: string}[] = [];
  
  // Trova i blocchi delle partite (spesso sono in div o card)
  $('.match-block, .match-info, article.match').each((i, el) => {
     // o proviamo a estrarre dalle abbreviation iniziali
  });
  
  // Alternativa: i primi 20 .team-name abbr
  const teamAbbrs = $('.team-name').slice(0, 20).map((i, el) => $(el).text().trim()).get();
  for(let i=0; i<teamAbbrs.length; i+=2) {
      if (teamAbbrs[i] && teamAbbrs[i+1]) {
         matches.push({ home: teamAbbrs[i], away: teamAbbrs[i+1] });
      }
  }
  console.log(matches);
}
run();
