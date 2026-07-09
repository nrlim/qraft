import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schemaFieldAnnotations, schemas } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session';

type RouteParams = { params: Promise<{ id: string; annotationId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id, annotationId } = await params;

    // Verify ownership of the schema
    const schema = await db.query.schemas.findFirst({
      where: and(eq(schemas.id, id), eq(schemas.userId, session.userId)),
    });

    if (!schema) {
      return NextResponse.json(
        { error: 'NotFound', code: 'not_found', message: 'Schema not found' },
        { status: 404 }
      );
    }

    // Delete annotation
    const [deleted] = await db
      .delete(schemaFieldAnnotations)
      .where(and(
        eq(schemaFieldAnnotations.id, annotationId),
        eq(schemaFieldAnnotations.schemaId, id)
      ))
      .returning({ id: schemaFieldAnnotations.id });

    if (!deleted) {
      return NextResponse.json(
        { error: 'NotFound', code: 'not_found', message: 'Annotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id: annotationId } });
  } catch (error) {
    console.error('Delete schema annotation error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to delete schema annotation' },
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

    const { id, annotationId } = await params;

    // Verify ownership of the schema
    const schema = await db.query.schemas.findFirst({
      where: and(eq(schemas.id, id), eq(schemas.userId, session.userId)),
    });

    if (!schema) {
      return NextResponse.json(
        { error: 'NotFound', code: 'not_found', message: 'Schema not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { tableName, columnName, contextLabel, jsonStructure, description } = body;

    if (!tableName || !columnName || !jsonStructure) {
      return NextResponse.json(
        { error: 'ValidationError', code: 'validation_error', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(schemaFieldAnnotations)
      .set({
        tableName,
        columnName,
        contextLabel: contextLabel || null,
        jsonStructure,
        description: description || null,
      })
      .where(and(
        eq(schemaFieldAnnotations.id, annotationId),
        eq(schemaFieldAnnotations.schemaId, id)
      ))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'NotFound', code: 'not_found', message: 'Annotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Update schema annotation error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to update schema annotation' },
      { status: 500 }
    );
  }
}
