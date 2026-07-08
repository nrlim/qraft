import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifySession } from '@/lib/auth/session';
import { desc, eq, not } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET || 'fallback-secret-key-for-development-qraft';
const encodedKey = new TextEncoder().encode(secretKey);

export async function GET(request: Request) {
  try {
    const sessionCookie = request.headers.get('cookie')?.split('session=')[1]?.split(';')[0];
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(sessionCookie, encodedKey, { algorithms: ['HS256'] });
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all users except the current admin (optional, but good practice to prevent self-demotion)
    // Actually let's fetch everyone so they can see themselves
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ data: allUsers });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
