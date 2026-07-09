export interface GuardrailOptions {
  restrictDestructive: boolean;
}

export interface GuardrailResult {
  passed: boolean;
  violation?: string;
  replacementText?: string;
}

/**
 * Validates AI generated SQL to prevent destructive operations
 * if restricted by guardrails.
 */
export function validateSqlOutput(sql: string, options: GuardrailOptions): GuardrailResult {
  if (!options.restrictDestructive) {
    return { passed: true };
  }

  // Regex patterns to detect dangerous SQL commands
  // Case-insensitive, matches DELETE, UPDATE, DROP, TRUNCATE with reasonable word boundaries
  const dangerousPatterns = [
    /\bDELETE\s+FROM\b/i,
    /\bUPDATE\s+(.+)\s+SET\b/i,
    /\bDROP\s+(TABLE|DATABASE|INDEX|VIEW|PROCEDURE|FUNCTION)\b/i,
    /\bTRUNCATE\s+TABLE\b/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      return {
        passed: false,
        violation: "Detected destructive query pattern (DELETE/UPDATE/DROP/TRUNCATE).",
        replacementText: 
          "-- [GUARDRAIL VIOLATION DETECTED]\n" +
          "-- The query you requested contains destructive operations (DELETE, UPDATE, DROP, or TRUNCATE).\n" +
          "-- System guardrails are currently ENABLED, which strictly prevents the generation of these queries.\n" +
          "-- If you genuinely need to perform this action, please disable the Guardrails in the dashboard header.\n"
      };
    }
  }

  return { passed: true };
}
