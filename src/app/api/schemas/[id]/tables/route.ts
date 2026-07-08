import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schemas } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session';
import { parseSqlSchema } from '@/lib/utils/sql-parser';

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

    const tables = parseSqlSchema(schema.sqlContent);

    return NextResponse.json({ data: tables });
  } catch (error) {
    console.error('Get schema tables error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Failed to fetch schema tables' },
      { status: 500 }
    );
  }
}
