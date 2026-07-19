import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyCode } from '@/lib/verification';

function generateTicketId(): string {
  return 'TKT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// POST: Create a new ticket (verifies code first)
export async function POST(req: NextRequest) {
  const { username, code, subject } = await req.json();

  if (!username || !code) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (!verifyCode(username, code)) {
    return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 403 });
  }

  const ticketId = generateTicketId();

  try {
    const ticket = await db.ticket.create({
      data: {
        ticketId,
        username,
        status: 'OPEN',
        subject: subject || 'SUPPORT',
      },
    });

    // Notify mini-service to DM admins about new ticket
    try {
      await fetch('http://localhost:3003/api/notify-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, username, subject: subject || 'SUPPORT' }),
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      console.log('[SCiPNET] Could not notify mini-service (offline)');
    }

    return NextResponse.json({ success: true, ticketId, subject: subject || 'SUPPORT', ticket });
  } catch (err) {
    console.error('[SCiPNET] Failed to create ticket:', err);
    return NextResponse.json({ error: 'Failed to create ticket.' }, { status: 500 });
  }
}

// GET: List open tickets (admin)
export async function GET() {
  try {
    const tickets = await db.ticket.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return NextResponse.json(tickets);
  } catch {
    return NextResponse.json([]);
  }
}