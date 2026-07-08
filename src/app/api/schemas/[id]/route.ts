import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schemas } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const schema = await db.query.schemas.findFirst({
      where: and(eq(schemas.id, id), eq(schemas.userId, session.userId)),
    });

    if (!schema) {
      return NextResponse.json(
        { error: 'NotFound', code: 'not_found', message: 'Schema not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: schema });
  } catch (error) {
    console.error('Get schema error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to fetch schema' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existing = await db.query.schemas.findFirst({
      where: and(eq(schemas.id, id), eq(schemas.userId, session.userId)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NotFound', code: 'not_found', message: 'Schema not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string | null;
    const description = formData.get('description') as string | null;
    const file = formData.get('file') as File | null;

    const updates: Partial<{
      name: string;
      description: string | null;
      sqlContent: string;
      fileName: string;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (name && name.trim()) {
      updates.name = name.trim();
    }

    if (description !== null) {
      updates.description = description.trim() || null;
    }

    if (file) {
      if (!file.name.endsWith('.sql')) {
        return NextResponse.json(
          { error: 'ValidationError', code: 'invalid_file_type', message: 'Only .sql files are accepted' },
          { status: 400 }
        );
      }

      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'ValidationError', code: 'file_too_large', message: 'File size must be under 5MB' },
          { status: 400 }
        );
      }

      updates.sqlContent = await file.text();
      updates.fileName = file.name;
    }

    const [updated] = await db
      .update(schemas)
      .set(updates)
      .where(and(eq(schemas.id, id), eq(schemas.userId, session.userId)))
      .returning({
        id: schemas.id,
        name: schemas.name,
        description: schemas.description,
        fileName: schemas.fileName,
        createdAt: schemas.createdAt,
        updatedAt: schemas.updatedAt,
      });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Update schema error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to update schema' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await db.query.schemas.findFirst({
      where: and(eq(schemas.id, id), eq(schemas.userId, session.userId)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NotFound', code: 'not_found', message: 'Schema not found' },
        { status: 404 }
      );
    }

    await db
      .delete(schemas)
      .where(and(eq(schemas.id, id), eq(schemas.userId, session.userId)));

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error('Delete schema error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to delete schema' },
      { status: 500 }
    );
  }
}
