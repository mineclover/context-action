/**
 * User configuration types for LLMS Generator
 */

export interface PathConfig {
  /** Path to documentation source */
  docsDir?: string;
  /** Path to generated data directory */
  dataDir?: string;
  /** Path to output directory for generated files */
  outputDir?: string;
  /** Path to instruction templates directory */
  templatesDir?: string;
  /** Path to generated instructions directory */
  instructionsDir?: string;
}

export interface InstructionConfig {
  /** Enable instruction generation */
  enabled?: boolean;
  /** Template to use for instruction generation */
  template?: string;
  /** Include source content in instructions */
  includeSourceContent?: boolean;
  /** Include current summaries in instructions */
  includeCurrentSummaries?: boolean;
  /** Max instruction length in characters */
  maxInstructionLength?: number;
}

export interface UserConfig {
  /** Character limits to use for extraction */
  characterLimits: number[];
  /** Supported languages */
  languages: string[];
  /** Path configuration */
  paths?: PathConfig;
  /** Instruction generation configuration */
  instructions?: InstructionConfig;
}

export interface ResolvedConfig extends UserConfig {
  /** Resolved paths (absolute) */
  resolvedPaths: {
    docsDir: string;
    dataDir: string;
    outputDir: string;
    templatesDir: string;
    instructionsDir: string;
    projectRoot: string;
    configFile: string;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_USER_CONFIG: UserConfig = {
  characterLimits: [100, 300, 1000, 2000],
  languages: ['en', 'ko'],
  paths: {
    docsDir: './docs',
    dataDir: './packages/llms-generator/data',
    outputDir: './docs/llms',
    templatesDir: './templates',
    instructionsDir: './instructions'
  },
  instructions: {
    enabled: true,
    template: 'default',
    includeSourceContent: true,
    includeCurrentSummaries: true,
    maxInstructionLength: 8000
  }
};

/**
 * Predefined presets for common character limit configurations
 */
export const CHARACTER_LIMIT_PRESETS = {
  minimal: [100, 500],
  standard: [100, 300, 1000, 2000],
  extended: [50, 100, 300, 500, 1000, 2000, 4000],
  blog: [200, 500, 1500],
  documentation: [150, 400, 1000]
};