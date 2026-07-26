import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function requireAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  return token === 'site92-admin-authenticated';
}

export async function GET(request: NextRequest) {
  try {
    const incidents = await db.incident.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Admin GET Incidents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, title, severity, sector, description, status, reportedBy } = body;

    if (!code || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: code, title, description' },
        { status: 400 }
      );
    }

    const incident = await db.incident.create({
      data: {
        code,
        title,
        severity: severity || 'MODERATE',
        sector: sector || 'UNKNOWN',
        description,
        status: status || 'ACTIVE',
        reportedBy: reportedBy || 'SYSTEM',
      },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Admin POST Incident error:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/incidents  body: { id, code?, title?, severity?, sector?, description?, status?, reportedBy? }
export async function PUT(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    }

    const data: Record<string, string> = {};
    if (body.code !== undefined) data.code = body.code;
    if (body.title !== undefined) data.title = body.title;
    if (body.severity !== undefined) data.severity = body.severity;
    if (body.sector !== undefined) data.sector = body.sector;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) data.status = body.status;
    if (body.reportedBy !== undefined) data.reportedBy = body.reportedBy;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const incident = await db.incident.update({ where: { id }, data });
    return NextResponse.json(incident);
  } catch (error) {
    console.error('Admin PUT Incident error:', error);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }
    await db.incident.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE Incident error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
