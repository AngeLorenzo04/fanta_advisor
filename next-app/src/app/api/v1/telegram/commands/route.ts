import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const commands = await (prisma as any).customCommand.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(commands);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Errore nel recupero dei comandi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { name, description, response } = body;

    if (!name || !response) {
      return NextResponse.json({ error: 'Nome del comando e Risposta sono obbligatori' }, { status: 400 });
    }

    // Clean command name (strip leading /, lowercase, remove spaces)
    name = name.replace(/^\//, '').trim().toLowerCase().replace(/\s+/g, '_');

    const existing = await (prisma as any).customCommand.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: `Il comando /${name} esiste già!` }, { status: 400 });
    }

    const newCommand = await (prisma as any).customCommand.create({
      data: {
        name,
        description: description?.trim() || null,
        response: response.trim(),
      }
    });

    return NextResponse.json(newCommand, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Errore nella creazione del comando' }, { status: 500 });
  }
}
