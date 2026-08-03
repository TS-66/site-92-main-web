/**
 * Shared credential generation logic.
 *
 * Uses Prisma `upsert` — a single atomic database operation — so that even if a
 * user double-clicks the "Generate Key" button or two Vercel serverless
 * instances handle concurrent requests, exactly ONE credential is ever created
 * per identity. If the user already has one, the SAME key is returned.
 *
 * The `identity` is a stable unique key:
 *   - Discord flow: the Discord user ID (e.g. "123456789012345678")
 *   - Web flow:     "web:<callsign>" (e.g. "web:smith")
 *
 * Both are stored in the existing `discordUserId` column (which is `@unique`),
 * so no schema change is needed and the same dedup guarantee applies.
 */

import { db } from '@/lib/db';

export interface Credential {
  id: string;
  username: string;
  password: string;
  discordUserId: string | null;
  createdAt: Date;
}

export interface GenerateResult {
  credential: Credential;
  isNew: boolean;
}

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

/**
 * Get an existing credential for `identity`, or create a new one.
 *
 * Atomic + race-condition-proof via `upsert`. Retries up to 5 times on
 * username collision (the random AGENT-XXXX could collide with an existing
 * username, which is a separate `@unique` constraint).
 */
export async function getOrCreateCredential(identity: string): Promise<GenerateResult> {
  // Quick check first — lets us report `isNew` accurately and avoids generating
  // a password we won't use. The upsert below is the real atomic guard.
  const existing = await db.credential.findUnique({ where: { discordUserId: identity } });
  if (existing) {
    return { credential: existing, isNew: false };
  }

  // No existing credential — create one atomically. If a concurrent request
  // creates it in the narrow window between our findUnique and this upsert,
  // the upsert's `where` matches it and returns that record (update: {} = no
  // changes) instead of creating a duplicate or throwing.
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const credential = await db.credential.upsert({
        where: { discordUserId: identity },
        update: {},
        create: {
          username: randomUsername(),
          password: randomPassword(),
          discordUserId: identity,
        },
      });
      // If the upsert found an existing record (race created it), `isNew` is
      // false. We can tell by comparing createdAt — a just-created record has
      // a timestamp within the last few seconds.
      const ageMs = Date.now() - credential.createdAt.getTime();
      return { credential, isNew: ageMs < 10000 };
    } catch (err) {
      lastErr = err;
      // Prisma P2002 = unique constraint violation (likely username collision).
      // Retry with a fresh random username. Any other error also retries —
      // transient serverless/DB hiccups resolve on retry.
      if (attempt < 4) continue;
    }
  }

  throw lastErr ?? new Error('Failed to generate credential after 5 attempts');
}
