/** Minimal AI SDK runtime seam for adapter contract tests. */

export type ToolSet = Record<string, unknown>;

export function jsonSchema(schema: unknown): unknown {
  return schema;
}

export function dynamicTool<T extends object>(definition: T): T {
  return definition;
}
