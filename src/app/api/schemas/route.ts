import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schemas } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const userSchemas = await db
      .select({
        id: schemas.id,
        name: schemas.name,
        description: schemas.description,
        fileName: schemas.fileName,
        createdAt: schemas.createdAt,
        updatedAt: schemas.updatedAt,
      })
      .from(schemas)
      .where(eq(schemas.userId, session.userId))
      .orderBy(desc(schemas.createdAt));

    return NextResponse.json({ data: userSchemas });
  } catch (error) {
    console.error('List schemas error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to fetch schemas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string | null;
    const description = formData.get('description') as string | null;
    const file = formData.get('file') as File | null;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'ValidationError', code: 'invalid_input', message: 'Schema name is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'ValidationError', code: 'invalid_input', message: 'SQL file is required' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.sql')) {
      return NextResponse.json(
        { error: 'ValidationError', code: 'invalid_file_type', message: 'Only .sql files are accepted' },
        { status: 400 }
      );
    }

    // 5MB limit
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ValidationError', code: 'file_too_large', message: 'File size must be under 5MB' },
        { status: 400 }
      );
    }

    // Extract SQL content from file
    const sqlContent = await file.text();

    const [newSchema] = await db
      .insert(schemas)
      .values({
        userId: session.userId,
        name: name.trim(),
        description: description?.trim() || null,
        sqlContent,
        fileName: file.name,
      })
      .returning({
        id: schemas.id,
        name: schemas.name,
        description: schemas.description,
        fileName: schemas.fileName,
        createdAt: schemas.createdAt,
        updatedAt: schemas.updatedAt,
      });

    return NextResponse.json({ data: newSchema }, { status: 201 });
  } catch (error) {
    console.error('Create schema error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to create schema' },
      { status: 500 }
    );
  }
}
