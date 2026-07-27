import { NextResponse } from 'next/server';
import { getAllGuildMembers, getGuildRoles } from '@/lib/discord';

function intToHex(color: number): string {
  if (color === 0) return '#99aab5';
  return '#' + color.toString(16).padStart(6, '0');
}

export async function GET() {
  try {
    const [members, guildRoles] = await Promise.all([getAllGuildMembers(), getGuildRoles()]);

    if (members.length === 0) {
      return NextResponse.json([]);
    }

    const roleMap: Record<string, { name: string; color: string; position: number }> = {};
    for (const r of guildRoles) {
      roleMap[r.id] = { name: r.name, color: intToHex(r.color), position: r.position };
    }

    const enrichedMembers = members.map((m) => {
      const memberRoles = (m.roles || [])
        .map(rid => roleMap[rid])
        .filter(Boolean)
        .sort((a, b) => b.position - a.position);

      return {
        name: m.name,
        displayName: m.displayName,
        avatar: m.avatar,
        userId: m.userId,
        // Discord roles (for display in the modal)
        discordRoles: memberRoles.map(r => ({ name: r.name, color: r.color })),
      };
    });

    return NextResponse.json([{ members: enrichedMembers }]);
  } catch (error) {
    console.error('Personnel API error:', error);
    return NextResponse.json([]);
  }
}
