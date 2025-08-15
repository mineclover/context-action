/**
 * Instruction generation types
 */

export interface InstructionTemplate {
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template content with placeholders */
  content: string;
  /** Supported languages */
  languages: string[];
  /** Template variables */
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  /** Variable name (without brackets) */
  name: string;
  /** Variable description */
  description: string;
  /** Whether the variable is required */
  required: boolean;
  /** Default value if any */
  defaultValue?: string;
}

export interface InstructionContext {
  /** Document information */
  document: {
    id: string;
    title: string;
    language: string;
    category: string;
    sourcePath: string;
  };
  /** Priority information */
  priority: {
    score: number;
    tier: string;
    strategy: string;
  };
  /** Key points for specific character limit */
  keyPoints: {
    characterLimit: number;
    focus: string;
    points: Array<{
      text: string;
      priority?: 'critical' | 'important' | 'optional';
      category?: 'concept' | 'implementation' | 'example' | 'usage';
    }>;
  };
  /** Source content */
  sourceContent?: string;
  /** Current summaries */
  currentSummaries?: Array<{
    characterLimit: number;
    content: string;
    isEdited: boolean;
    needsUpdate: boolean;
  }>;
  /** Work status */
  workStatus: {
    needsWork: boolean;
    lastChecked?: Date;
    filesToUpdate: number[];
  };
}

export interface GeneratedInstruction {
  /** Instruction ID */
  id: string;
  /** Target document ID */
  documentId: string;
  /** Target language */
  language: string;
  /** Character limit this instruction targets */
  characterLimit: number;
  /** Generated instruction content */
  content: string;
  /** Template used */
  template: string;
  /** Generation timestamp */
  createdAt: Date;
  /** Context used for generation */
  context: InstructionContext;
  /** File path where instruction is saved */
  filePath: string;
}

export interface InstructionGenerationOptions {
  /** Template to use */
  template?: string;
  /** Character limits to generate instructions for */
  characterLimits?: number[];
  /** Include source content */
  includeSourceContent?: boolean;
  /** Include current summaries */
  includeCurrentSummaries?: boolean;
  /** Override max instruction length */
  maxLength?: number;
  /** Dry run mode */
  dryRun?: boolean;
  /** Overwrite existing instructions */
  overwrite?: boolean;
}

export interface InstructionGenerationResult {
  /** Generated instructions */
  instructions: GeneratedInstruction[];
  /** Generation summary */
  summary: {
    totalGenerated: number;
    totalSkipped: number;
    totalErrors: number;
    byCharacterLimit: Record<string, number>;
  };
  /** Any errors that occurred */
  errors: string[];
}