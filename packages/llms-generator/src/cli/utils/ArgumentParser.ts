/**
 * Argument Parser - Utility for parsing CLI arguments
 */

export class ArgumentParser {
  extractFlag(args: string[], shortFlag: string, longFlag?: string): string | undefined {
    const flags = [shortFlag];
    if (longFlag) flags.push(longFlag);
    
    for (const flag of flags) {
      const index = args.indexOf(flag);
      if (index !== -1 && index + 1 < args.length) {
        return args[index + 1];
      }
    }
    return undefined;
  }

  extractNumberFlag(args: string[], shortFlag: string, longFlag?: string): number | undefined {
    const value = this.extractFlag(args, shortFlag, longFlag);
    return value ? parseInt(value) : undefined;
  }

  hasFlag(args: string[], ...flags: string[]): boolean {
    return flags.some(flag => args.includes(flag));
  }

  extractMultipleFlags(args: string[], shortFlag: string, longFlag?: string): string[] {
    const flags = [shortFlag];
    if (longFlag) flags.push(longFlag);
    
    const results: string[] = [];
    for (const flag of flags) {
      let index = args.indexOf(flag);
      while (index !== -1 && index + 1 < args.length) {
        results.push(args[index + 1]);
        index = args.indexOf(flag, index + 2);
      }
    }
    return results;
  }
}