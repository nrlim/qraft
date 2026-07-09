import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generations } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const schemaId = searchParams.get('schemaId');

    if (!schemaId) {
      return NextResponse.json(
        { error: 'ValidationError', code: 'invalid_input', message: 'Schema ID is required' },
        { status: 400 }
      );
    }

    const messages = await db
      .select({
        id: generations.id,
        role: generations.role,
        content: generations.content,
        latencyMs: generations.latencyMs,
        createdAt: generations.createdAt,
      })
      .from(generations)
      .where(and(
        eq(generations.schemaId, schemaId),
        eq(generations.userId, session.userId)
      ))
      .orderBy(asc(generations.createdAt));

    return NextResponse.json({ data: messages });
  } catch (error) {
    console.error('Fetch generations error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
