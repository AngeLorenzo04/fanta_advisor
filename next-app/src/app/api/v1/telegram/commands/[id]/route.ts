import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
