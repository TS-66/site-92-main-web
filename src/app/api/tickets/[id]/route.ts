import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const ticket = await db.ticket.findUnique({
      where: { ticketId: id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}