import { NextRequest, NextResponse } from 'next/server';

const DISCORD_API = 'https://discord.com/api/v10';

// Visit this route once (with the right ?secret=) to post the button message
// into your channel. You don't need to hit it again unless you want another
// copy of the button posted somewhere.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const channelId = req.nextUrl.searchParams.get('channel');

  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Invalid or missing secret.' }, { status: 401 });
  }

  if (!channelId) {
    return NextResponse.json({ error: 'Missing ?channel=<channel_id> query param.' }, { status: 400 });
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'DISCORD_BOT_TOKEN not set.' }, { status: 500 });
  }

  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: 'Click below to generate a new terminal login credential.',
      components: [
        {
          type: 1, // action row
          components: [
            {
              type: 2, // button
              style: 1, // primary (blue)
              label: 'Generate Key',
              custom_id: 'generate_key',
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json({ error: `Discord API error: ${res.status}`, detail: text }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Button posted to channel.' });
}
