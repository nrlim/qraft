import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { count, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'ValidationError', code: 'invalid_input', message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Conflict', code: 'user_exists', message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Determine if this is the first user
    const [{ value: userCount }] = await db.select({ value: count() }).from(users);
    const role = userCount === 0 ? 'admin' : 'user';

    // Create user
    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      role,
    }).returning();

    // Create session
    await createSession(newUser.id, newUser.role);

    return NextResponse.json(
      { data: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'InternalError', code: 'internal_error', message: 'Something went wrong during registration' },
      { status: 500 }
    );
  }
}
