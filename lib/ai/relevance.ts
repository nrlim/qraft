import { SchemaFieldAnnotation } from "@/lib/db/schema";

/**
 * A lightweight, zero-LLM relevance checker.
 * Determines if the user's message likely requires the derived knowledge.
 */
export function isDerivedKnowledgeRelevant(message: string, annotations: SchemaFieldAnnotation[]): boolean {
  if (!annotations || annotations.length === 0) return false;

  const lowerMsg = message.toLowerCase();

  // 1. Generic JSON keywords
  const jsonKeywords = ['json', 'openjson', 'json_value', 'json_query', 'metadata', 'properties', 'detail', 'details', 'attribute'];
  for (const kw of jsonKeywords) {
    if (lowerMsg.includes(kw)) return true;
  }

  // 2. Check against actual table/column names and context labels in the annotations
  for (const ann of annotations) {
    if (lowerMsg.includes(ann.tableName.toLowerCase())) return true;
    if (lowerMsg.includes(ann.columnName.toLowerCase())) return true;
    if (ann.contextLabel && lowerMsg.includes(ann.contextLabel.toLowerCase())) return true;
    
    // Check against keys inside the JSON structure
    // A rudimentary check: if any word in the message matches a key in the JSON structure
    const keys = extractJsonKeys(ann.jsonStructure);
    for (const key of keys) {
      // Use regex word boundary to ensure we match whole words, not partials
      const regex = new RegExp(`\\b${key.toLowerCase()}\\b`);
      if (regex.test(lowerMsg)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extracts possible keys from a JSON structure string.
 * This is a basic regex approach since the structure might be a pseudo-JSON or comment block.
 */
function extractJsonKeys(jsonStructure: string): string[] {
  const keys: string[] = [];
  // Match things like "key": or key:
  const regex = /["']?([a-zA-Z0-9_]+)["']?\s*:/g;
  let match;
  while ((match = regex.exec(jsonStructure)) !== null) {
    if (match[1]) {
      keys.push(match[1]);
    }
  }
  return keys;
}
