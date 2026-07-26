import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const reports = await db.anomalyReport.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Public GET AnomalyReports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anomaly reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reporterName, scpRef, location, description, contact } = body;

    if (!reporterName || !scpRef || !location || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: reporterName, scpRef, location, description' },
        { status: 400 }
      );
    }

    const report = await db.anomalyReport.create({
      data: {
        reporterName,
        scpRef,
        location,
        description,
        contact: contact || '',
        status: 'PENDING',
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Public POST AnomalyReport error:', error);
    return NextResponse.json(
      { error: 'Failed to submit anomaly report' },
      { status: 500 }
    );
  }
}
