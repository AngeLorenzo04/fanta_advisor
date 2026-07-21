import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';

function normalizeName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export async function GET() {
  return handleLineupsScrape();
}

export async function POST() {
  return handleLineupsScrape();
}

async function handleLineupsScrape() {
  try {
    const res = await fetch("https://www.fantacalcio.it/probabili-formazioni-serie-a", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 3600 } // Cache 1 hour
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Fantacalcio probable lineups: ${res.statusText}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const starterSet = new Set<string>();
    const ballotSet = new Set<string>();
    const injuredSet = new Set<string>();

    // Parse probable lineups cards
    $('.card-match, .match-card, .match').each((_, match) => {
      // Starter players
      $(match).find('.starter, .player-starter, .team-lineup .player-name').each((_, el) => {
        const name = $(el).text().trim();
        if (name) starterSet.add(normalizeName(name));
      });

      // Ballots
      $(match).find('.ballot, .ballottaggio, .player-ballot').each((_, el) => {
        const name = $(el).text().trim();
        if (name) ballotSet.add(normalizeName(name));
      });

      // Injured / Suspended
      $(match).find('.infortunati, .squalificati, .player-unavailable, .absent').each((_, el) => {
        const name = $(el).text().trim();
        if (name) injuredSet.add(normalizeName(name));
      });
    });

    // If html structure is standard table/lists
    if (starterSet.size === 0) {
      $('a.player-name, span.player-name').each((_, el) => {
        const name = $(el).text().trim();
        if (name) starterSet.add(normalizeName(name));
      });
    }

    const allPlayers = await prisma.player.findMany();
    let updatedCount = 0;

    for (const player of allPlayers) {
      const norm = normalizeName(player.name);
      let starterPercentage = 0.85; // Default assumption for roster players

      if (injuredSet.has(norm)) {
        starterPercentage = 0.0; // Infortunato/Squalificato
      } else if (ballotSet.has(norm)) {
        starterPercentage = 0.5; // In ballottaggio
      } else if (starterSet.has(norm)) {
        starterPercentage = 1.0; // Titolare sicuro
      }

      await prisma.player.update({
        where: { id: player.id },
        data: {
          penaltyTakerPercentage: starterPercentage // Store current matchday starter status
        }
      });
      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      scraped_starters: starterSet.size,
      scraped_ballots: ballotSet.size,
      scraped_injured: injuredSet.size,
      players_updated: updatedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Probable Lineups Scraper Error:", error);
    return NextResponse.json({ error: error.message || "Errore nello scraping delle formazioni" }, { status: 500 });
  }
}
