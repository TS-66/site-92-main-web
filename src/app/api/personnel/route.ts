import { NextResponse } from 'next/server';
import { getAllGuildMembers } from '@/lib/discord';

export async function GET() {
  const members = await getAllGuildMembers();

  if (members.length === 0) {
    return NextResponse.json([]);
  }

  // Frontend expects an array of groups, each with a members array.
  // We return everything in one group — the frontend re-groups by role anyway
  // using /api/public/personnel-ranks.
  return NextResponse.json([
    {
      members: members.map((m) => ({
        name: m.name,
        displayName: m.displayName,
        avatar: m.avatar,
        stClass: 'unknown',
        st: 'Status unavailable (requires persistent bot connection)',
      })),
    },
  ]);
}
