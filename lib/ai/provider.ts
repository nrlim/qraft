import { createOpenAI } from "@ai-sdk/openai";

type AiProvider = "vercel" | "sumopod";

export function getAiModel() {
  const provider = (process.env.AI_PROVIDER || "sumopod") as AiProvider;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("AI_API_KEY environment variable is not set");
  }

  if (provider === "sumopod") {
    const baseURL = process.env.AI_BASE_URL || "https://ai.sumopod.com/v1";
    // Create OpenAI provider instance with SumoPod baseURL
    const openai = createOpenAI({
      apiKey,
      baseURL,
    });
    // Use .chat() to enforce Chat Completions API compatibility
    return openai.chat(model);
  }

  // Default: Native OpenAI via Vercel AI SDK
  const openai = createOpenAI({
    apiKey,
  });
  return openai.chat(model);
}
