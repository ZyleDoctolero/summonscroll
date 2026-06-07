// Error reporting (standalone — no Lovable dependency)
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[SummonScroll Error]", error, context);
}
