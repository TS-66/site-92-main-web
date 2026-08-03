// Verification codes are stored in MongoDB rather than in-memory.
// Vercel serverless functions each run in their own isolated instance —
// an in-memory object set by one request is not guaranteed to be visible
// to a later request, so a shared persistent store is required here.
import { db } from '@/lib/db';

export async function setCode(username: string, code: string) {
  const lower = username.toLowerCase();
  await db.verificationCode.upsert({
    where: { username: lower },
    update: { code, createdAt: new Date() },
    create: { username: lower, code },
  });
}

export async function verifyCode(username: string, code: string): Promise<boolean> {
  const lower = username.toLowerCase();
  const record = await db.verificationCode.findUnique({ where: { username: lower } });

  if (!record) return false;

  // Codes expire after 10 minutes
  const isExpired = Date.now() - record.createdAt.getTime() > 10 * 60 * 1000;
  if (isExpired) {
    await db.verificationCode.delete({ where: { username: lower } }).catch(() => {});
    return false;
  }

  if (record.code === code) {
    await db.verificationCode.delete({ where: { username: lower } }).catch(() => {});
    return true;
  }

  return false;
}

export async function hasCode(username: string): Promise<boolean> {
  const lower = username.toLowerCase();
  const record = await db.verificationCode.findUnique({ where: { username: lower } });
  return !!record;
}
