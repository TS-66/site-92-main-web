import { NextRequest, NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';
import { waitUntil } from '@vercel/functions';

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const DISCORD_API = 'https://discord.com/api/v10';

// The custom_id our "Generate Key" button uses. Must match the button
// created in /api/discord/post-panel.
const GENERATE_KEY_CUSTOM_ID = 'generate_key';

function randomUsername(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `AGENT-${num}`;
}

function randomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function editOriginalResponse(applicationId: string, token: string, content: string) {
  await fetch(`${DISCORD_API}/webhooks/${applicationId}/${token}/messages/@original`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).catch((err) => console.error('[discord-interactions] Failed to edit followup message:', err));
}

async function generateAndRespond(applicationId: string, token: string, discordUserId: string | null) {
  try {
    // Loaded here (not at module top) so Prisma's initialization never
    // delays the instant "thinking..." response Discord requires within 3s.
    const { db } = await import('@/lib/db');

    if (discordUserId) {
      const existing = await db.credential.findUnique({ where: { discordUserId } });
      if (existing) {
        await editOriginalResponse(
          applicationId,
          token,
          `You already have a terminal login:\n\`\`\`\nUsername: ${existing.username}\nPassword: ${existing.password}\n\`\`\``
        );
        return;
      }
    }

    const username = randomUsername();
    const password = randomPassword();

    await db.credential.create({
      data: { username, password, discordUserId: discordUserId || undefined },
    });

    await editOriginalResponse(
      applicationId,
      token,
      `New terminal login generated:\n\`\`\`\nUsername: ${username}\nPassword: ${password}\n\`\`\``
    );
  } catch (err) {
    console.error('[discord-interactions] Failed to create credential:', err);
    await editOriginalResponse(applicationId, token, 'Failed to generate a new key — database error. Check server logs.');
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const rawBody = await req.text();

  if (!PUBLIC_KEY || !signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature headers or DISCORD_PUBLIC_KEY not set' }, { status: 401 });
  }

  const isValid = await verifyKey(rawBody, signature, timestamp, PUBLIC_KEY);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // Discord's PING to verify the endpoint (type 1) — must ACK with type 1.
  if (body.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Button click (type 3 = MESSAGE_COMPONENT)
  if (body.type === 3 && body.data?.custom_id === GENERATE_KEY_CUSTOM_ID) {
    // In a guild, the clicking user is under `member.user`; in a DM, it's `user` directly.
    const discordUserId: string | null = body.member?.user?.id || body.user?.id || null;

    // Respond instantly with a deferred/"thinking" ack (type 5) so Discord
    // doesn't time out at its strict 3-second window, then do the actual
    // database work in the background and edit the message once it's done.
    waitUntil(generateAndRespond(body.application_id, body.token, discordUserId));

    return NextResponse.json({
      type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      data: { flags: 64 }, // ephemeral
    });
  }

  return NextResponse.json({ type: 4, data: { content: 'Unknown interaction.', flags: 64 } });
}
