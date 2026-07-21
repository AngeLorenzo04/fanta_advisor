import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, x-cron-secret',
    },
  });
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 });
    }

    await (prisma as any).customCommand.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Comando eliminato' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Errore durante l'eliminazione del comando" }, { status: 500 });
  }
}
