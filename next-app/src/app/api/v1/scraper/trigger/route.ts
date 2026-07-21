import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';

const TEAM_STRENGTH: Record<string, number> = {
    "Inter": 5, "Juventus": 5, "Milan": 5, "Napoli": 5, "Atalanta": 5,
    "Roma": 4, "Lazio": 4, "Bologna": 3, "Fiorentina": 4, "Torino": 3,
    "Genoa": 3, "Monza": 3, "Lecce": 2, "Verona": 2, "Empoli": 2,
    "Udinese": 2, "Cagliari": 2, "Parma": 2, "Como": 2, "Venezia": 1,
    "Pisa": 2, "Sassuolo": 3, "Cremonese": 2, "Spezia": 2
};

function getTeamStrength(teamName: string) {
    return TEAM_STRENGTH[teamName] || 2;
}

function mapTeamAbbreviation(abbr: string) {
    const map: Record<string, string> = {
        "INT": "Inter", "MIL": "Milan", "JUV": "Juventus", "NAP": "Napoli",
        "ROM": "Roma", "LAZ": "Lazio", "ATA": "Atalanta", "FIO": "Fiorentina",
        "TOR": "Torino", "BOL": "Bologna", "MON": "Monza", "GEN": "Genoa",
        "PAR": "Parma", "EMP": "Empoli", "VER": "Verona", "UDI": "Udinese",
        "CAG": "Cagliari", "LEC": "Lecce", "VEN": "Venezia", "COM": "Como",
        "PIS": "Pisa", "PISA": "Pisa", "SAS": "Sassuolo", "CRE": "Cremonese",
        "SPE": "Spezia"
    };
    return map[abbr] || (abbr ? abbr.charAt(0).toUpperCase() + abbr.slice(1).toLowerCase() : "Svincolato");
}

function calculatePlayerStats(name: string, role: string, fvm: number) {
    let expectedBaseRating = role === 'P' ? 6.0 : role === 'C' ? 5.9 : role === 'A' ? 6.1 : 5.8;
    expectedBaseRating += Math.min(0.8, fvm / 500.0);
    expectedBaseRating = Math.round(expectedBaseRating * 100.0) / 100.0;

    let penalty = 0.0, freekick = 0.0, corner = 0.0;
    let setPieceSpecialist = false;
    let oopIndex = 0.0;
    let isOop = false;

    const nameLower = name.toLowerCase();
    if (nameLower.includes("calhanoglu")) {
        penalty = 0.95; freekick = 0.6; corner = 0.5; setPieceSpecialist = true;
    } else if (nameLower.includes("dybala")) {
        penalty = 0.9; freekick = 0.7; corner = 0.6; setPieceSpecialist = true;
    } else if (nameLower.includes("vlahovic")) {
        penalty = 0.85; freekick = 0.5; setPieceSpecialist = true;
    } else if (nameLower.includes("dimarco")) {
        freekick = 0.4; corner = 0.7; setPieceSpecialist = true; isOop = true; oopIndex = 0.7;
    } else if (nameLower.includes("hernandez") && nameLower.includes("theo")) {
        penalty = 0.2; freekick = 0.3; setPieceSpecialist = true; isOop = true; oopIndex = 0.8;
    } else if (nameLower.includes("koopmeiners")) {
        penalty = 0.7; freekick = 0.3; corner = 0.4; setPieceSpecialist = true;
    } else if (nameLower.includes("pulisic")) {
        penalty = 0.4; corner = 0.3; setPieceSpecialist = true;
    } else if (nameLower.includes("gudmundsson")) {
        penalty = 0.8; freekick = 0.5; corner = 0.4; setPieceSpecialist = true;
    } else if (nameLower.includes("lautaro")) {
        penalty = 0.75; setPieceSpecialist = true;
    } else if (nameLower.includes("lookman")) {
        penalty = 0.6; setPieceSpecialist = true;
    } else if (nameLower.includes("retegui")) {
        penalty = 0.7; setPieceSpecialist = true;
    } else if (nameLower.includes("zapata")) {
        penalty = 0.4; setPieceSpecialist = true;
    } else if (nameLower.includes("lukaku")) {
        penalty = 0.8; setPieceSpecialist = true;
    } else if (nameLower.includes("dovbyk")) {
        penalty = 0.7; setPieceSpecialist = true;
    } else if (nameLower.includes("kvaratskhelia")) {
        penalty = 0.5; freekick = 0.3; setPieceSpecialist = true;
    } else {
        if (fvm > 200 && (role === 'A' || role === 'C')) {
            penalty = 0.15; setPieceSpecialist = true;
        }
        if (role === 'D' && (nameLower.includes("bellanova") || nameLower.includes("carlos augusto") || nameLower.includes("cambiaso") || nameLower.includes("dodo") || nameLower.includes("dumfries"))) {
            isOop = true; oopIndex = 0.5;
        }
    }

    let expectedValue = expectedBaseRating + (penalty * 3.0) + (freekick * 3.0) + (corner * 1.0);
    if (isOop) expectedValue += (oopIndex * 1.5);
    expectedValue = Math.round(expectedValue * 100.0) / 100.0;

    return {
        expectedBaseRating, penalty, freekick, corner, setPieceSpecialist, isOop, oopIndex, expectedValue
    };
}

export async function POST() {
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // Scrape players
        console.log("Navigating to quotazioni-fantacalcio...");
        await page.goto("https://www.fantacalcio.it/quotazioni-fantacalcio", { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        const content = await page.content();
        const $ = cheerio.load(content);

        const playersToSave: any[] = [];
        $('tr.player-row').each((_, row) => {
            const name = $(row).find('.player-name span').text().trim();
            if (!name) return;

            const role = $(row).attr('data-filter-role-classic')?.toUpperCase() || 'C';
            const teamAbbr = $(row).find('.player-team').text().trim().toUpperCase();
            const team = mapTeamAbbreviation(teamAbbr);

            const initialQuoteStr = $(row).find('.player-classic-initial-price').text().trim();
            const currentQuoteStr = $(row).find('.player-classic-current-price').text().trim();
            const fvmStr = $(row).find('.player-classic-fvm').text().trim();

            const initialQuote = initialQuoteStr ? parseInt(initialQuoteStr) : 1;
            const currentQuote = currentQuoteStr ? parseInt(currentQuoteStr) : initialQuote;
            const fvm = fvmStr ? parseInt(fvmStr) : 0;

            const stats = calculatePlayerStats(name, role, fvm);

            playersToSave.push({
                name, team, role, initialQuote, currentQuote, fvm,
                ...stats
            });
        });

        let playersLoaded = 0;
        if (playersToSave.length > 0) {
            // Deduplicate players by name
            const uniquePlayersMap = new Map();
            for (const p of playersToSave) {
                uniquePlayersMap.set(p.name.toLowerCase().trim(), p);
            }
            const uniquePlayersToSave = Array.from(uniquePlayersMap.values());

            console.log(`Found ${uniquePlayersToSave.length} unique players. Upserting into DB...`);
            const existingPlayers = await prisma.player.findMany();
            const existingMap = new Map();
            for (const p of existingPlayers) {
                existingMap.set(p.name.toLowerCase().trim(), p.id);
            }

            for (const p of uniquePlayersToSave) {
                const lowerName = p.name.toLowerCase().trim();
                const id = existingMap.get(lowerName);
                if (id) {
                    await prisma.player.update({
                        where: { id },
                        data: {
                            team: p.team,
                            role: p.role,
                            initialQuote: p.initialQuote,
                            currentQuote: p.currentQuote,
                            expectedValue: p.expectedValue,
                            expectedBaseRating: p.expectedBaseRating,
                            oopIndex: p.oopIndex,
                            isOop: p.isOop,
                            penaltyTakerPercentage: p.penalty,
                            freeKickSpecialistPercentage: p.freekick,
                            cornerSpecialistPercentage: p.corner,
                            isSetPieceSpecialist: p.setPieceSpecialist
                        }
                    });
                } else {
                    const newPlayer = await prisma.player.create({
                        data: {
                            name: p.name,
                            team: p.team,
                            role: p.role,
                            initialQuote: p.initialQuote,
                            currentQuote: p.currentQuote,
                            expectedValue: p.expectedValue,
                            expectedBaseRating: p.expectedBaseRating,
                            oopIndex: p.oopIndex,
                            isOop: p.isOop,
                            penaltyTakerPercentage: p.penalty,
                            freeKickSpecialistPercentage: p.freekick,
                            cornerSpecialistPercentage: p.corner,
                            isSetPieceSpecialist: p.setPieceSpecialist
                        }
                    });
                    // Add the newly created player to existingMap so subsequent identical names are ignored or updated
                    existingMap.set(lowerName, newPlayer.id);
                }
            }
            playersLoaded = uniquePlayersToSave.length;
        }

        // Scrape fixtures
        console.log("Navigating to serie-a/calendario per prendere le partite della 1° giornata...");
        await page.goto("https://www.fantacalcio.it/serie-a/calendario", { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        const contentFix = await page.content();
        const $fix = cheerio.load(contentFix);

        const fixtures: any[] = [];
        $fix('li.match').each((_, block) => {
            let home = $fix(block).find('.team-home meta[itemprop=name]').attr('content')?.trim() || '';
            let away = $fix(block).find('.team-away meta[itemprop=name]').attr('content')?.trim() || '';
            if (home && away) {
                home = mapTeamAbbreviation(home);
                away = mapTeamAbbreviation(away);
                fixtures.push({
                    homeTeam: home,
                    awayTeam: away,
                    homeTeamStrength: getTeamStrength(home),
                    awayTeamStrength: getTeamStrength(away)
                });
            }
        });

        // Take only the first 10 fixtures (Matchday 1)
        const currentFixtures = fixtures.slice(0, 10);

        if (currentFixtures.length > 0) {
            console.log(`Found ${currentFixtures.length} fixtures for matchday 1. Clearing old and inserting new...`);
            await prisma.matchFixture.deleteMany({});
            await prisma.matchFixture.createMany({
                data: currentFixtures
            });
        }

        await browser.close();

        return NextResponse.json({
            status: 'success',
            players_loaded: playersLoaded,
            fixtures_loaded: currentFixtures.length,
            source: 'playwright'
        });
    } catch (error: any) {
        console.error("Scraper Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
