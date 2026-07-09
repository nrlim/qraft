import { streamText } from 'ai';
import { db } from '@/lib/db';
import { schemas, generations, schemaFieldAnnotations } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session';
import { getAiModel } from '@/lib/ai/provider';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { validateSqlOutput } from '@/lib/ai/guardrails';

// Maximum number of prior messages to include as context for the AI.
// Keeping this bounded prevents token inflation while still giving
// the model enough conversation memory.
const MAX_HISTORY_MESSAGES = 20;

export async function POST(req: Request) {
  try {
    const session = await verifySession();

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { message, schemaId, guardrailsEnabled = true } = await req.json();

    if (!schemaId) {
      return new Response('Schema ID is required', { status: 400 });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response('Message is required', { status: 400 });
    }

    // Fetch the schema context
    const [schema] = await db
      .select()
      .from(schemas)
      .where(eq(schemas.id, schemaId));

    if (!schema) {
      return new Response('Schema not found', { status: 404 });
    }

    // 1. Persist the new user message FIRST so ordering is correct
    await db.insert(generations).values({
      schemaId,
      userId: session.userId,
      role: 'user',
      content: message.trim(),
    });

    // 2. Fetch recent history from DB (bounded window, excludes the message we just saved above
    //    since we append it explicitly below)
    const recentHistory = await db
      .select({
        role: generations.role,
        content: generations.content,
      })
      .from(generations)
      .where(and(
        eq(generations.schemaId, schemaId),
        eq(generations.userId, session.userId),
      ))
      .orderBy(desc(generations.createdAt))
      // +1 to include the message we just inserted
      .limit(MAX_HISTORY_MESSAGES + 1);

    // DB returns newest-first; reverse to chronological order
    const chronologicalHistory = recentHistory.reverse();

    // Build the messages array for the AI (role + content only)
    const aiMessages = chronologicalHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 3. Fetch JSON field annotations for this schema
    const annotations = await db.query.schemaFieldAnnotations.findMany({
      where: eq(schemaFieldAnnotations.schemaId, schemaId),
    });

    const model = getAiModel() as any;
    const systemPrompt = buildSystemPrompt(schema.sqlContent, annotations, guardrailsEnabled);

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: aiMessages,
      temperature: 0.1,
      onFinish: async ({ text }) => {
        // Run server-side guardrail validation
        const validation = validateSqlOutput(text, { restrictDestructive: guardrailsEnabled });
        const finalContent = validation.passed ? text : (validation.replacementText || text);

        // 4. Persist the AI response
        await db.insert(generations).values({
          schemaId,
          userId: session.userId,
          role: 'assistant',
          content: finalContent,
        });
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat streaming error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
