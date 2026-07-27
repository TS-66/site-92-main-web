import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function requireAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  return token === 'site92-admin-authenticated';
}

export async function GET() {
  try {
    const items = await db.newsItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Admin GET news error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch news',
      detail: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { tag, title, body: text, author } = body;

    if (!title || !text) {
      return NextResponse.json({ error: 'Missing required fields: title, body' }, { status: 400 });
    }

    const item = await db.newsItem.create({
      data: {
        tag: tag || 'info',
        title,
        body: text,
        author: author || 'ADMIN',
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Admin POST news error:', error);
    return NextResponse.json({ 
      error: 'Failed to create news item',
      detail: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

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
    if (body.tag !== undefined) data.tag = body.tag;
    if (body.title !== undefined) data.title = body.title;
    if (body.body !== undefined) data.body = body.body;
    if (body.author !== undefined) data.author = body.author;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const item = await db.newsItem.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Admin PUT news error:', error);
    return NextResponse.json({ 
      error: 'Failed to update news item',
      detail: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
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
    await db.newsItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE news error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete',
      detail: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
