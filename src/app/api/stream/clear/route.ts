import { NextRequest, NextResponse } from 'next/server';
import { clearConversation } from '@/lib/ai-memory';

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  if (sessionId) {
    clearConversation(sessionId);
  }

  return NextResponse.json({ cleared: true });
}