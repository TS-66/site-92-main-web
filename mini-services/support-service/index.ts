import { createServer } from 'http';
import { Client, GatewayIntentBits } from 'discord.js';

const PORT = 3003;
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'doudou66_,ducks_are_cool_1')
  .split(',')
  .map((u) => u.trim().toLowerCase())
  .filter(Boolean);

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!DISCORD_BOT_TOKEN) {
  console.error('[SUPPORT-SVC] Missing DISCORD_BOT_TOKEN env var. Discord DMs will not work.');
}
if (!GUILD_ID) {
  console.error('[SUPPORT-SVC] Missing DISCORD_GUILD_ID env var. Cannot resolve admin usernames without it.');
}

const discord = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

let discordReady = false;

discord.once('clientReady', () => {
  discordReady = true;
  console.log(`[SUPPORT-SVC] Discord bot logged in as ${discord.user?.tag}`);
});

discord.on('error', (err) => {
  console.error('[SUPPORT-SVC] Discord client error:', err);
});

if (DISCORD_BOT_TOKEN) {
  discord.login(DISCORD_BOT_TOKEN).catch((err) => {
    console.error('[SUPPORT-SVC] Discord login failed — check DISCORD_BOT_TOKEN is valid:', err.message);
  });
}

/**
 * Resolves configured admin usernames to guild members and DMs them all.
 * Matches against both the unique Discord username and the server display name,
 * case-insensitively, since people often confuse the two.
 */
async function dmAdmins(text: string): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = [];
  const failed: string[] = [];

  if (!discordReady || !GUILD_ID) {
    console.warn('[SUPPORT-SVC] Discord not ready or GUILD_ID missing — skipping DM, logging instead:', text);
    return { sent, failed: ADMIN_USERNAMES };
  }

  try {
    const guild = await discord.guilds.fetch(GUILD_ID);
    const members = await guild.members.fetch();

    for (const adminUsername of ADMIN_USERNAMES) {
      const member = members.find(
        (m) =>
          m.user.username.toLowerCase() === adminUsername ||
          m.displayName.toLowerCase() === adminUsername
      );

      if (!member) {
        console.warn(`[SUPPORT-SVC] Could not find admin "${adminUsername}" in guild`);
        failed.push(adminUsername);
        continue;
      }

      try {
        await member.send(text);
        sent.push(adminUsername);
      } catch (err) {
        console.error(`[SUPPORT-SVC] Failed to DM ${adminUsername} (DMs may be closed):`, (err as Error).message);
        failed.push(adminUsername);
      }
    }
  } catch (err) {
    console.error('[SUPPORT-SVC] Failed to fetch guild/members:', (err as Error).message);
    return { sent, failed: ADMIN_USERNAMES };
  }

  return { sent, failed };
}

const httpServer = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: PORT, discordReady }));
    return;
  }

  if (req.url === '/api/personnel' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  if (req.url === '/api/forward-message' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { ticketId, username, sender, text } = JSON.parse(body);
        console.log(`[SUPPORT-SVC] [${ticketId}] ${sender} (${username}): ${text}`);
        const result = await dmAdmins(`**Ticket ${ticketId}** — ${sender} (${username}):\n${text}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...result }));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed' }));
      }
    });
    return;
  }

  if (req.url === '/api/notify-admins' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { ticketId, username, subject } = JSON.parse(body);
        console.log(`[SUPPORT-SVC] New ticket ${ticketId} from ${username} [${subject}]`);
        const result = await dmAdmins(`New support ticket ${ticketId} from ${username}\nSubject: ${subject}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...result }));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed' }));
      }
    });
    return;
  }

  if (req.url === '/api/send-code' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { username, code } = JSON.parse(body);
        console.log(`[SUPPORT-SVC] Verification code for ${username}: ${code}`);
        const result = await dmAdmins(`Verification code for ${username}: ${code}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...result }));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

httpServer.listen(PORT, () => {
  console.log(`[SUPPORT-SVC] Support service running on port ${PORT}`);
});

process.on('SIGTERM', () => { httpServer.close(() => process.exit(0)); });
process.on('SIGINT', () => { httpServer.close(() => process.exit(0)); });
