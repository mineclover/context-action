/**
 * CLI 명령어 타입 정의
 */

export interface CLICommand {
  name: string;
  description: string;
  aliases?: string[];
  subcommands?: Record<string, CLISubcommand>;
  options?: CLIOption[];
  examples?: string[];
  execute: (args: CLIArgs) => Promise<void>;
}

export interface CLISubcommand {
  name: string;
  description: string;
  options?: CLIOption[];
  examples?: string[];
  execute: (args: CLIArgs) => Promise<void>;
}

export interface CLIOption {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  default?: any;
  choices?: string[];
}

export interface CLIArgs {
  command: string;
  subcommand?: string;
  positional: string[];
  options: Record<string, any>;
  flags: Record<string, boolean>;
}

export interface CLIContext {
  workingDir: string;
  configPath?: string;
  config?: any;
  verbose?: boolean;
  dryRun?: boolean;
}

// 통합될 명령어 그룹 정의
export type CommandGroup = 
  | 'config'     // init, show, validate, limits
  | 'generate'   // minimum, origin, chars, batch, md, all
  | 'priority'   // generate, stats, discover, check, analyze  
  | 'work'       // status, context, list, check, instruction
  | 'extract'    // single, all, batch
  | 'compose'    // single, batch, stats, markdown
  | 'summary'    // generate, improve, validate
  | 'schema'     // generate, info, validate
  | 'sync'       // docs, simple, files, all
  | 'validate';  // config, priority, frontmatter, all

// 서브 명령어 액션 정의
export interface CommandActions {
  config: 'init' | 'show' | 'validate' | 'limits';
  generate: 'minimum' | 'origin' | 'chars' | 'batch' | 'md' | 'all';
  priority: 'generate' | 'stats' | 'discover' | 'check' | 'analyze';
  work: 'status' | 'context' | 'list' | 'check' | 'instruction';
  extract: 'single' | 'all' | 'batch';
  compose: 'single' | 'batch' | 'stats' | 'markdown';
  summary: 'generate' | 'improve' | 'validate';
  schema: 'generate' | 'info' | 'validate';
  sync: 'docs' | 'simple' | 'files' | 'all';
  validate: 'config' | 'priority' | 'frontmatter' | 'all';
}

// 기존 명령어 매핑 (마이그레이션용)
export const LEGACY_COMMAND_MAPPING: Record<string, { group: CommandGroup; action: string }> = {
  // Config 관련
  'config-init': { group: 'config', action: 'init' },
  'config-show': { group: 'config', action: 'show' },
  'config-validate': { group: 'config', action: 'validate' },
  'config-limits': { group: 'config', action: 'limits' },
  
  // Generate 관련
  'minimum': { group: 'generate', action: 'minimum' },
  'origin': { group: 'generate', action: 'origin' },
  'chars': { group: 'generate', action: 'chars' },
  'batch': { group: 'generate', action: 'batch' },
  'generate-md': { group: 'generate', action: 'md' },
  'generate-all': { group: 'generate', action: 'all' },
  
  // Priority 관련
  'priority-generate': { group: 'priority', action: 'generate' },
  'priority-stats': { group: 'priority', action: 'stats' },
  'discover': { group: 'priority', action: 'discover' },
  'analyze-priority': { group: 'priority', action: 'analyze' },
  'check-priority-status': { group: 'priority', action: 'check' },
  
  // Work 관련  
  'work-status': { group: 'work', action: 'status' },
  'work-context': { group: 'work', action: 'context' },
  'work-list': { group: 'work', action: 'list' },
  'work-check': { group: 'work', action: 'check' },
  'instruction-generate': { group: 'work', action: 'instruction' },
  'instruction-batch': { group: 'work', action: 'instruction' },
  
  // Extract/Compose 관련
  // Note: 'extract' and 'compose' are now new unified commands, not legacy
  'extract-all': { group: 'extract', action: 'all' },
  'compose-batch': { group: 'compose', action: 'batch' },
  'compose-stats': { group: 'compose', action: 'stats' },
  'markdown-generate': { group: 'compose', action: 'markdown' },
  'markdown-all': { group: 'compose', action: 'markdown-all' },
  
  // Summary 관련
  'generate-summaries': { group: 'summary', action: 'generate' },
  'improve-summaries': { group: 'summary', action: 'improve' },
  
  // Schema 관련
  'schema-generate': { group: 'schema', action: 'generate' },
  'schema-info': { group: 'schema', action: 'info' },
  
  // Sync 관련
  'sync-docs': { group: 'sync', action: 'docs' },
  'migrate-to-simple': { group: 'sync', action: 'simple' },
  'generate-files': { group: 'sync', action: 'files' },
  'sync-all': { group: 'sync', action: 'all' },
  
  // Validate 관련
  'pre-commit-check': { group: 'validate', action: 'pre-commit' },
};