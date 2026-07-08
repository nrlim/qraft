import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schemaFieldAnnotations, schemas } from '@/lib/db/schema';
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

    // Verify ownership
    const schema = await db.query.schemas.findFirst({
      where: and(eq(schemas.id, id), eq(schemas.userId, session.userId)),
    });

    if (!schema) {
      return NextResponse.json(
        { error: 'NotFound', code: 'not_found', message: 'Schema not found' },
        { status: 404 }
      );
    }

    const annotations = await db.query.schemaFieldAnnotations.findMany({
      where: eq(schemaFieldAnnotations.schemaId, id),
      orderBy: (annotations, { desc }) => [desc(annotations.createdAt)],
    });

    return NextResponse.json({ data: annotations });
  } catch (error) {
    console.error('Get schema annotations error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to fetch schema annotations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
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
    const { tableName, columnName, jsonStructure, description } = body;

    if (!tableName || !columnName || !jsonStructure) {
      return NextResponse.json(
        { error: 'ValidationError', code: 'validation_error', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [annotation] = await db.insert(schemaFieldAnnotations).values({
      schemaId: id,
      tableName,
      columnName,
      jsonStructure,
      description: description || null,
    }).returning();

    return NextResponse.json({ data: annotation }, { status: 201 });
  } catch (error) {
    console.error('Create schema annotation error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to create schema annotation' },
      { status: 500 }
    );
  }
}
