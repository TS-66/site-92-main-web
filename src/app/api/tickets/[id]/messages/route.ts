import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dmAdmins } from '@/lib/discord';

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

    // DM admins about the new message directly via Discord REST API
    try {
      await dmAdmins(`Ticket ${id} — ${sender || 'user'} (${ticket.username}):\n${text}`);
    } catch {
      // Discord DM failed, message still stored in DB
    }

    return NextResponse.json(message);
  } catch (err) {
    console.error('[SCiPNET] Failed to add message:', err);
    return NextResponse.json({ error: 'Failed to add message.' }, { status: 500 });
  }
}