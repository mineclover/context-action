/**
 * User configuration types for LLMS Generator
 */

export interface CharacterLimitConfig {
  /** Character limit value */
  limit: number;
  /** Description for this limit */
  description?: string;
  /** Focus area for extraction at this limit */
  focus?: string;
  /** Whether this limit is enabled */
  enabled?: boolean;
}

export interface ExtractionConfig {
  /** Default character limits to use */
  characterLimits: CharacterLimitConfig[];
  /** Default extraction strategy */
  defaultStrategy?: 'concept-first' | 'api-first' | 'example-first' | 'general';
  /** Supported languages */
  languages: string[];
}

export interface CompositionConfig {
  /** Default character limit for compose commands */
  defaultCharacterLimit: number;
  /** Default priority threshold */
  defaultPriorityThreshold: number;
  /** Whether to include table of contents by default */
  includeTableOfContents: boolean;
  /** Target utilization percentage (0.95 = 95%) */
  targetUtilization: number;
}

export interface PathConfig {
  /** Path to documentation source */
  docsDir?: string;
  /** Path to generated data directory */
  dataDir?: string;
  /** Path to output directory for generated files */
  outputDir?: string;
}

export interface WorkflowConfig {
  /** Preset workflows for common tasks */
  presets?: Record<string, WorkflowPreset>;
}

export interface WorkflowPreset {
  /** Name of the preset */
  name: string;
  /** Description of what this preset does */
  description: string;
  /** Commands to execute */
  commands: WorkflowCommand[];
}

export interface WorkflowCommand {
  /** Command name */
  command: string;
  /** Command arguments */
  args?: Record<string, any>;
  /** Description of what this command does */
  description?: string;
}

export interface UserConfig {
  /** Project name */
  name?: string;
  /** Project version */
  version?: string;
  /** Extraction configuration */
  extraction: ExtractionConfig;
  /** Composition configuration */
  composition: CompositionConfig;
  /** Path configuration */
  paths?: PathConfig;
  /** Workflow presets */
  workflows?: WorkflowConfig;
}

export interface ResolvedConfig extends UserConfig {
  /** Resolved paths (absolute) */
  resolvedPaths: {
    docsDir: string;
    dataDir: string;
    outputDir: string;
    projectRoot: string;
    configFile: string;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_USER_CONFIG: UserConfig = {
  name: 'LLMS Generator Project',
  version: '1.0.0',
  extraction: {
    characterLimits: [
      { limit: 100, description: 'Ultra-short summary', focus: 'Core concept only', enabled: true },
      { limit: 300, description: 'Short summary', focus: 'Main points with context', enabled: true },
      { limit: 1000, description: 'Detailed summary', focus: 'Complete overview with examples', enabled: true },
      { limit: 2000, description: 'Comprehensive summary', focus: 'Full content with detailed examples', enabled: true },
    ],
    defaultStrategy: 'concept-first',
    languages: ['en', 'ko']
  },
  composition: {
    defaultCharacterLimit: 5000,
    defaultPriorityThreshold: 0,
    includeTableOfContents: true,
    targetUtilization: 0.95
  },
  paths: {
    docsDir: './docs',
    dataDir: './packages/llms-generator/data',
    outputDir: './docs/llms'
  }
};

/**
 * Predefined presets for common character limit configurations
 */
export const CHARACTER_LIMIT_PRESETS = {
  minimal: [
    { limit: 100, description: 'Tweet-length', focus: 'Core concept only' },
    { limit: 500, description: 'Brief summary', focus: 'Key points with minimal context' }
  ],
  standard: [
    { limit: 100, description: 'Ultra-short', focus: 'Core concept only' },
    { limit: 300, description: 'Short', focus: 'Main points with context' },
    { limit: 1000, description: 'Detailed', focus: 'Complete overview' },
    { limit: 2000, description: 'Comprehensive', focus: 'Full content with examples' }
  ],
  extended: [
    { limit: 50, description: 'Micro-summary', focus: 'Single sentence essence' },
    { limit: 100, description: 'Ultra-short', focus: 'Core concept only' },
    { limit: 300, description: 'Short', focus: 'Main points' },
    { limit: 500, description: 'Medium-short', focus: 'Key details' },
    { limit: 1000, description: 'Detailed', focus: 'Complete overview' },
    { limit: 2000, description: 'Comprehensive', focus: 'Full content' },
    { limit: 4000, description: 'Extensive', focus: 'Complete with all examples' }
  ],
  blog: [
    { limit: 200, description: 'Meta description', focus: 'SEO-friendly summary' },
    { limit: 500, description: 'Article teaser', focus: 'Hook and main points' },
    { limit: 1500, description: 'Article summary', focus: 'Complete article overview' }
  ],
  documentation: [
    { limit: 150, description: 'Quick reference', focus: 'API signature and purpose' },
    { limit: 400, description: 'Usage summary', focus: 'How to use with example' },
    { limit: 1000, description: 'Complete guide', focus: 'Full documentation content' }
  ]
};