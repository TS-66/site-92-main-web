/**
 * Sends Discord DMs using the plain REST API instead of discord.js's gateway Client.
 * This works in serverless functions (Vercel) because it's just stateless HTTP calls —
 * no persistent WebSocket connection required, unlike a normal bot login.
 */

const DISCORD_API = 'https://discord.com/api/v10';

function getBotToken(): string | undefined {
  return process.env.DISCORD_BOT_TOKEN;
}

function getGuildId(): string | undefined {
  return process.env.DISCORD_GUILD_ID;
}

function getAdminUsernames(): string[] {
  return ['doudou66_', 'ducks_are_cool_1'];
}

/**
 * Looks up a guild member's Discord user ID by username or display name.
 * Requires the "Server Members Intent" enabled in the Discord Developer Portal
 * for the search endpoint to return results.
 */
async function findMemberIdByUsername(username: string): Promise<string | null> {
  const token = getBotToken();
  const guildId = getGuildId();
  if (!token || !guildId) return null;

  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/search?query=${encodeURIComponent(username)}&limit=10`,
    { headers: { Authorization: `Bot ${token}` } }
  );

  if (!res.ok) {
    console.error(`[discord] member search failed for "${username}": ${res.status} ${await res.text().catch(() => '')}`);
    return null;
  }

  const members: Array<{ user: { id: string; username: string }; nick?: string | null }> = await res.json();
  const match = members.find(
    (m) =>
      m.user.username.toLowerCase() === username.toLowerCase() ||
      (m.nick && m.nick.toLowerCase() === username.toLowerCase())
  );

  return match?.user.id ?? null;
}

/** Opens (or reuses) a DM channel with a user and sends them a message. */
async function sendDirectMessage(userId: string, content: string): Promise<boolean> {
  const token = getBotToken();
  if (!token) return false;

  const channelRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipient_id: userId }),
  });

  if (!channelRes.ok) {
    console.error(`[discord] failed to open DM channel: ${channelRes.status} ${await channelRes.text().catch(() => '')}`);
    return false;
  }

  const channel = await channelRes.json();

  const msgRes = await fetch(`${DISCORD_API}/channels/${channel.id}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!msgRes.ok) {
    console.error(`[discord] failed to send message: ${msgRes.status} ${await msgRes.text().catch(() => '')}`);
    return false;
  }

  return true;
}

/**
 * Fetches every member of the configured guild via REST (paginated, 1000 per page).
 * Filters out bot accounts. Note: Discord's REST API does not expose real-time
 * online/offline presence — that data only comes through a persistent Gateway
 * connection, which isn't available in a serverless environment like Vercel.
 */
export async function getAllGuildMembers(): Promise<
  Array<{ name: string; displayName: string; avatar: string }>
> {
  const token = getBotToken();
  const guildId = getGuildId();
  if (!token || !guildId) return [];

  const results: Array<{ name: string; displayName: string; avatar: string }> = [];
  let after = '0';

  while (true) {
    const res = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members?limit=1000&after=${after}`,
      { headers: { Authorization: `Bot ${token}` } }
    );

    if (!res.ok) {
      console.error(`[discord] failed to fetch members: ${res.status} ${await res.text().catch(() => '')}`);
      break;
    }

    const page: Array<{
      nick?: string | null;
      user: { id: string; username: string; global_name?: string | null; avatar?: string | null; bot?: boolean };
    }> = await res.json();

    if (page.length === 0) break;

    for (const m of page) {
      if (m.user.bot) continue;
      const avatar = m.user.avatar
        ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(m.user.id) >> 22n) % 6n)}.png`;

      results.push({
        name: m.user.username,
        displayName: m.nick || m.user.global_name || m.user.username,
        avatar,
      });
    }

    if (page.length < 1000) break;
    after = page[page.length - 1].user.id;
  }

  return results;
}

/** Sends a message to every configured admin username. Returns which succeeded/failed. */
export async function dmAdmins(text: string): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = [];
  const failed: string[] = [];
  const admins = getAdminUsernames();

  if (!getBotToken() || !getGuildId()) {
    console.warn('[discord] DISCORD_BOT_TOKEN or DISCORD_GUILD_ID not set — skipping DM:', text);
    return { sent, failed: admins };
  }

  for (const username of admins) {
    const userId = await findMemberIdByUsername(username);
    if (!userId) {
      failed.push(username);
      continue;
    }
    const ok = await sendDirectMessage(userId, text);
    if (ok) sent.push(username);
    else failed.push(username);
  }

  return { sent, failed };
}
