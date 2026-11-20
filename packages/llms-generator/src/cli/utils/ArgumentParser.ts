/**
 * Argument Parser - Utility for parsing CLI arguments
 */

function stripMatchingQuotes(value: string): string {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export class ArgumentParser {
  extractFlag(args: string[], shortFlag: string, longFlag?: string): string | undefined {
    const flags = longFlag ? [shortFlag, longFlag] : [shortFlag];

    for (let i = 0; i < args.length; i++) {
      const token = args[i];
      if (!token) continue;

      for (const flag of flags) {
        if (token === flag) {
          const nextArg = args[i + 1];
          if (nextArg !== undefined && !nextArg.startsWith('-')) {
            return stripMatchingQuotes(nextArg);
          }
          return undefined;
        }

        const prefix = `${flag}=`;
        if (token.startsWith(prefix)) {
          return stripMatchingQuotes(token.slice(prefix.length));
        }
      }
    }
    return undefined;
  }

  extractListFlag(args: string[], ...flags: string[]): string[] {
    const targetFlags = flags.filter(Boolean);
    if (targetFlags.length === 0) {
      return [];
    }

    const results: string[] = [];
    const seen = new Set<string>();

    const pushParsedValues = (rawValue: string): void => {
      const cleaned = stripMatchingQuotes(rawValue.trim());
      if (!cleaned) return;
      for (const part of cleaned.split(/[\s,]+/)) {
        const trimmed = stripMatchingQuotes(part.trim());
        if (trimmed && !seen.has(trimmed)) {
          seen.add(trimmed);
          results.push(trimmed);
        }
      }
    };

    for (let i = 0; i < args.length; i++) {
      const token = args[i];
      if (!token) continue;

      for (const flag of targetFlags) {
        if (token === flag) {
          let j = i + 1;
          while (j < args.length) {
            const candidate = args[j];
            if (candidate === undefined || candidate.startsWith('-')) {
              break;
            }
            pushParsedValues(candidate);
            j += 1;
          }
          i = j - 1;
          break;
        }

        const prefix = `${flag}=`;
        if (token.startsWith(prefix)) {
          pushParsedValues(token.slice(prefix.length));
          break;
        }
      }
    }

    return results;
  }

  extractNumberFlag(args: string[], shortFlag: string, longFlag?: string): number | undefined {
    const value = this.extractFlag(args, shortFlag, longFlag);
    if (value === undefined) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  hasFlag(args: string[], ...flags: string[]): boolean {
    return flags.some(flag => args.includes(flag));
  }

  extractPositionalArgs(args: string[], valueFlags: string[] = []): string[] {
    const valueFlagSet = new Set(valueFlags);
    const positional: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const token = args[i];
      if (!token) continue;

      if (token.startsWith('-')) {
        if (!token.includes('=') && valueFlagSet.has(token) && i + 1 < args.length && !args[i + 1]?.startsWith('-')) {
          i += 1;
        }
        continue;
      }

      positional.push(stripMatchingQuotes(token));
    }

    return positional;
  }
}