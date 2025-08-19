/**
 * LLMS Output Path Manager
 * 
 * Manages output path generation for LLMS files with consistent language-specific directory structure
 */

import path from 'path';
import { CLIConfig } from '../cli/types/CLITypes.js';

export interface OutputPathOptions {
  language: string;
  characterLimit?: number;
  category?: string;
  pattern?: string;
  outputDir?: string;
}

export class LLMSOutputPathManager {
  constructor(private config: CLIConfig) {}

  /**
   * Generate output path with language-specific directory structure
   * Format: {outputDir}/{language}/llms/{filename}
   */
  generateOutputPath(options: OutputPathOptions): { outputPath: string; filename: string } {
    const {
      language,
      characterLimit,
      category,
      pattern,
      outputDir
    } = options;

    // Generate filename
    const filename = this.generateFilename(language, characterLimit, category, pattern);
    
    // Create language-specific output directory structure
    const baseOutputDir = outputDir || this.config.paths.outputDir;
    const languageOutputDir = path.join(baseOutputDir, language, 'llms');
    const outputPath = path.join(languageOutputDir, filename);

    return { outputPath, filename };
  }

  /**
   * Generate filename based on parameters
   */
  private generateFilename(language: string, characterLimit?: number, category?: string, pattern?: string): string {
    let filename = 'llms';
    
    if (characterLimit) {
      filename += `-${characterLimit}chars`;
    }
    
    if (category) {
      filename += `-${category}`;
    }

    if (pattern && pattern !== 'standard' && pattern !== 'clean') {
      filename += `-${pattern}`;
    }
    
    filename += '.txt';
    return filename;
  }

  /**
   * Get relative source path for document traceability
   */
  getRelativeSourcePath(documentId: string, language: string, characterLimit: number, filePath?: string): string {
    // Try to reconstruct the source path from document ID
    const parts = documentId.split('--');
    if (parts.length >= 2) {
      const category = parts[0];
      const pathParts = parts.slice(1);
      
      // Convert document ID back to likely file path
      if (category === 'api') {
        return `${language}/api/${pathParts.join('-')}.md`;
      } else if (category === 'guide') {
        return `${language}/guide/${pathParts.join('-')}.md`;
      } else if (category === 'concept') {
        return `${language}/concept/${pathParts.join('-')}.md`;
      } else if (category === 'examples') {
        return `${language}/example/${pathParts.join('-')}.md`;
      }
    }
    
    // Fallback: use template file path
    if (filePath) {
      const relativePath = filePath.replace(this.config.paths.llmContentDir, '').replace(/^\//, '');
      return `llmsData/${relativePath}`;
    }
    
    // Last resort: construct from document info
    return `llmsData/${language}/${documentId}/${documentId}-${characterLimit}.md`;
  }
}