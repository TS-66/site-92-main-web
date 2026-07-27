import { NextResponse } from 'next/server';
import { getAllGuildMembers } from '@/lib/discord';

export async function GET() {
  try {
    const members = await getAllGuildMembers();

    if (members.length === 0) {
      return NextResponse.json([]);
    }

    // Return members WITHOUT Discord roles — the frontend assigns roles
    // entirely from the /api/public/personnel-ranks list (the Site-92 hierarchy).
    const enrichedMembers = members.map((m) => ({
      name: m.name,
      displayName: m.displayName,
      avatar: m.avatar,
      userId: m.userId,
    }));

    return NextResponse.json([{ members: enrichedMembers }]);
  } catch (error) {
    console.error('Personnel API error:', error);
    return NextResponse.json([]);
  }
}
