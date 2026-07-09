import { streamText } from 'ai';
import { db } from '@/lib/db';
import { schemas, generations, schemaFieldAnnotations } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session';
import { getAiModel } from '@/lib/ai/provider';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { validateSqlOutput } from '@/lib/ai/guardrails';
import { isDerivedKnowledgeRelevant } from '@/lib/ai/relevance';

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

    const startTime = Date.now();

    // Parallelize all DB fetches
    const [
      [schema],
      recentHistory,
      annotations
    ] = await Promise.all([
      // Fetch schema
      db.select().from(schemas).where(eq(schemas.id, schemaId)),
      
      // Fetch history (bounded window, excluding the message we just saved above)
      db.select({
        role: generations.role,
        content: generations.content,
      })
      .from(generations)
      .where(and(
        eq(generations.schemaId, schemaId),
        eq(generations.userId, session.userId),
      ))
      .orderBy(desc(generations.createdAt))
      .limit(MAX_HISTORY_MESSAGES + 1),

      // Fetch JSON field annotations for this schema
      db.query.schemaFieldAnnotations.findMany({
        where: eq(schemaFieldAnnotations.schemaId, schemaId),
      })
    ]);

    if (!schema) {
      return new Response('Schema not found', { status: 404 });
    }

    // DB returns newest-first; reverse to chronological order
    const chronologicalHistory = recentHistory.reverse();

    // Build the messages array for the AI (role + content only)
    const aiMessages = chronologicalHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Determine if derived knowledge is relevant to the user's message
    const isRelevant = isDerivedKnowledgeRelevant(message, annotations);
    const relevantAnnotations = isRelevant ? annotations : [];

    const model = getAiModel() as any;
    const systemPrompt = buildSystemPrompt(schema.sqlContent, relevantAnnotations, guardrailsEnabled);

    // 1. Persist the new user message FIRST so ordering is correct
    // Doing this concurrently with stream initiation to reduce latency further
    const userMessagePromise = db.insert(generations).values({
      schemaId,
      userId: session.userId,
      role: 'user',
      content: message.trim(),
    });

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: aiMessages,
      temperature: 0.1,
      onFinish: async ({ text }) => {
        const endTime = Date.now();
        const latencyMs = endTime - startTime;

        // Ensure user message is fully saved before saving assistant response
        await userMessagePromise;

        // Run server-side guardrail validation
        const validation = validateSqlOutput(text, { restrictDestructive: guardrailsEnabled });
        const finalContent = validation.passed ? text : (validation.replacementText || text);

        // 4. Persist the AI response
        await db.insert(generations).values({
          schemaId,
          userId: session.userId,
          role: 'assistant',
          content: finalContent,
          latencyMs,
        });
      },
    });

    const response = result.toDataStreamResponse();
    response.headers.set('X-Derived-Knowledge-Used', isRelevant.toString());
    return response;
  } catch (error) {
    console.error('Chat streaming error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
