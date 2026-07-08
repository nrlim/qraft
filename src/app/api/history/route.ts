import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generations, schemas } from '@/lib/db/schema';
import { eq, and, desc, lt, count } from 'drizzle-orm';
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Fetch assistant generations with pagination
    const assistantRecords = await db
      .select({
        id: generations.id,
        content: generations.content,
        createdAt: generations.createdAt,
        schemaId: generations.schemaId,
        schemaName: schemas.name,
      })
      .from(generations)
      .leftJoin(schemas, eq(generations.schemaId, schemas.id))
      .where(
        and(
          eq(generations.userId, session.userId),
          eq(generations.role, 'assistant')
        )
      )
      .orderBy(desc(generations.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total records for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(generations)
      .where(
        and(
          eq(generations.userId, session.userId),
          eq(generations.role, 'assistant')
        )
      );
    
    const total = Number(totalCount) || 0;
    const totalPages = Math.ceil(total / limit);

    // For each assistant record, find the user prompt that preceded it
    const historyData = await Promise.all(
      assistantRecords.map(async (record) => {
        // Find the latest 'user' message created before this assistant message for the same schema
        const [userPrompt] = await db
          .select({ content: generations.content })
          .from(generations)
          .where(
            and(
              eq(generations.userId, session.userId),
              eq(generations.schemaId, record.schemaId),
              eq(generations.role, 'user'),
              lt(generations.createdAt, record.createdAt)
            )
          )
          .orderBy(desc(generations.createdAt))
          .limit(1);

        return {
          id: record.id,
          prompt: userPrompt ? userPrompt.content : 'Unknown prompt',
          sql: record.content,
          projectName: record.schemaName || 'Unknown schema',
          createdAt: record.createdAt,
        };
      })
    );

    return NextResponse.json({
      data: historyData,
      meta: {
        page,
        limit,
        total,
        totalPages,
      }
    });
  } catch (error) {
    console.error('Fetch history error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
