import { NextResponse } from 'next/server';

export async function GET() {
  // Personnel data is synced from Discord bot via mini-service
  // Return empty array when no Discord bot is connected
  // The mini-service on port 3003 would provide this data
  try {
    const res = await fetch('http://localhost:3003/api/personnel', {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Mini-service not running, return empty
  }
  return NextResponse.json([]);
}