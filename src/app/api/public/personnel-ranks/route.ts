import { NextResponse } from 'next/server';

const personnelRanks = {
  doudoustar01: { role: 'The Administrator', tier: 0, color: '#ff2e5e' },
  Duck: { role: 'Developer', tier: 1, color: '#00ffcc' },
  Bilow: { role: 'Server Management', tier: 2, color: '#00aaff' },
  Kevin: { role: 'Developer', tier: 1, color: '#00ffcc' },
  Adam: { role: 'Faction Leader', tier: 3, color: '#ffd60a' },
  Netox66: { role: 'Partnership Affiliate', tier: 4, color: '#ff8c42' },
  Liam: { role: 'UCSO Representative', tier: 5, color: '#8aa39d' },
  'MR CELL': { role: 'UCSO Representative', tier: 5, color: '#8aa39d' },
  feuerninja: { role: 'VIP', tier: 6, color: '#a855f7' },
  fisch900: { role: 'VIP', tier: 6, color: '#a855f7' },
  defaultRole: 'Foundation Personnel',
  defaultTier: 7,
  defaultColor: '#5a706b',
};

export async function GET() {
  try {
    return NextResponse.json(personnelRanks);
  } catch (error) {
    console.error('Public GET personnel ranks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personnel ranks' },
      { status: 500 }
    );
  }
}
