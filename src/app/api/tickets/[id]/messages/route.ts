import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { sender, text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
  }

  try {
    const ticket = await db.ticket.findUnique({ where: { ticketId: id } });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const message = await db.ticketMessage.create({
      data: {
        ticketId: id,
        sender: sender || 'user',
        text,
      },
    });

    // Update ticket timestamp
    await db.ticket.update({
      where: { ticketId: id },
      data: { updatedAt: new Date() },
    });

    // Notify mini-service to forward to Discord
    try {
      await fetch('http://localhost:3003/api/forward-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: id,
          username: ticket.username,
          sender: sender || 'user',
          text,
        }),
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      // Mini-service offline, message still stored in DB
    }

    return NextResponse.json(message);
  } catch (err) {
    console.error('[SCiPNET] Failed to add message:', err);
    return NextResponse.json({ error: 'Failed to add message.' }, { status: 500 });
  }
}