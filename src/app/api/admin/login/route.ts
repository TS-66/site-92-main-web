import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin credentials should be set via environment variables in production.
// Hardcoded fallback is for development/testing only.
const HARDCODED_ADMIN = {
  username: process.env.ADMIN_USERNAME || 'admin-0157',
  password: process.env.ADMIN_PASSWORD || '',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Only use hardcoded admin if ADMIN_PASSWORD is set (explicit opt-in)
    if (HARDCODED_ADMIN.password && username === HARDCODED_ADMIN.username && password === HARDCODED_ADMIN.password) {
      return NextResponse.json({
        success: true,
        token: 'site92-admin-authenticated',
      });
    }

    const account = await db.adminAccount.findUnique({
      where: { username },
    }).catch(() => null);

    if (!account || account.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token: 'site92-admin-authenticated',
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}