import { NextResponse } from 'next/server';

const personnelRanks = {
  ranks: {
    doudoustar01: { role: 'The Administrator', tier: 0, color: '#ff2e5e' },
    Adam: { role: 'UIU Leader', tier: 1, color: '#ffd60a' },
    Duck: { role: 'Server Manager', tier: 2, color: '#00ffcc' },
    Bilow: { role: 'Server Manager', tier: 2, color: '#00ffcc' },
    Kevin: { role: 'Developer', tier: 2, color: '#00ffcc' },
    Netox66: { role: 'VIP', tier: 3, color: '#ff8c42' },
    Liam: { role: 'Server Affiliate', tier: 4, color: '#8aa39d' },
    'MR CELL': { role: 'Server Affiliate', tier: 4, color: '#8aa39d' },
    feuerninja: { role: 'Server Affiliate', tier: 4, color: '#8aa39d' },
    fisch900: { role: 'Server Affiliate', tier: 4, color: '#8aa39d' },
  },
  defaultRole: 'Foundation Personnel',
  defaultTier: 5,
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