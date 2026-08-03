import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyCode } from '@/lib/verification';
import { dmAdmins } from '@/lib/discord';

function generateTicketId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

// POST: Create a new ticket (verifies code first)
export async function POST(req: NextRequest) {
  const { username, code, subject } = await req.json();

  if (!username || !code) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (!(await verifyCode(username, code))) {
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

    // DM admins about the new ticket directly via Discord REST API
    try {
      await dmAdmins(`New support ticket ${ticketId} from ${username}\nSubject: ${subject || 'SUPPORT'}`);
    } catch (err) {
      console.log('[SCiPNET] Could not notify admins via Discord:', err);
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