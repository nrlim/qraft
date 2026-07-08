import { generateText } from "ai";
import { getAiModel } from "./provider";
import { buildSystemPrompt } from "./system-prompt";

export async function generateSqlFromPrompt(
  userPrompt: string,
  schemaContent: string
) {
  const model = getAiModel();
  const systemPrompt = buildSystemPrompt(schemaContent);

  const { text } = await generateText({
    model: model as any,
    system: systemPrompt,
    prompt: userPrompt,
    // Add optional configuration here like temperature, maxTokens if needed
    temperature: 0.1, // Low temperature for code generation predictability
  });

  return text;
}
