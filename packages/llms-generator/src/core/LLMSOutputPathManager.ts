/**
 * LLMS Output Path Manager
 * 
 * Centralized path generation for all LLMS operations with consistent directory structure
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
    
    // Use language-specific directory structure
    const baseOutputDir = outputDir || this.config.paths.outputDir;
    const outputPath = path.join(baseOutputDir, language, 'llms', filename);

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
   * Generate LLMS data directory path for templates
   * Format: {llmContentDir}/{language}
   */
  getLLMSDataDir(language: string): string {
    return path.join(this.config.paths.llmContentDir, language);
  }

  /**
   * Generate document directory path in LLMS data
   * Format: {llmContentDir}/{language}/{documentId}
   */
  getDocumentDir(language: string, documentId: string): string {
    return path.join(this.config.paths.llmContentDir, language, documentId);
  }

  /**
   * Generate template file path
   * Format: {llmContentDir}/{language}/{documentId}/{documentId}-{characterLimit}.md
   */
  getTemplateFilePath(language: string, documentId: string, characterLimit: number): string {
    const docDir = this.getDocumentDir(language, documentId);
    return path.join(docDir, `${documentId}-${characterLimit}.md`);
  }

  /**
   * Generate priority.json file path
   * Format: {llmContentDir}/{language}/{documentId}/priority.json
   */
  getPriorityFilePath(language: string, documentId: string): string {
    const docDir = this.getDocumentDir(language, documentId);
    return path.join(docDir, 'priority.json');
  }

  /**
   * Generate source docs directory path
   * Format: {docsDir}/{language}
   */
  getSourceDocsDir(language: string): string {
    return path.join(this.config.paths.docsDir, language);
  }

  /**
   * Generate source document path from document info
   * Format: {docsDir}/{language}/{category}/{fileName}.md
   */
  getSourceDocPath(language: string, category: string, fileName: string): string {
    return path.join(this.config.paths.docsDir, language, category, `${fileName}.md`);
  }

  /**
   * Convert document ID back to source file path
   */
  documentIdToSourcePath(documentId: string, language: string): string {
    const parts = documentId.split('--');
    if (parts.length >= 2) {
      const category = parts[0];
      const fileName = parts.slice(1).join('-');
      return this.getSourceDocPath(language, category, fileName);
    }
    // Fallback for simple document IDs
    return path.join(this.config.paths.docsDir, language, `${documentId}.md`);
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
    
    // Fallback: try to convert template file path back to source path
    if (filePath) {
      // Remove llmsData prefix and get relative path
      const relativePath = filePath.replace(this.config.paths.llmContentDir, '').replace(/^\//, '');
      
      // Extract the original document info from the template path
      // Example: en/guide--getting-started/guide--getting-started-500.md -> en/guide/getting-started.md
      const pathParts = relativePath.split('/');
      if (pathParts.length >= 2) {
        const lang = pathParts[0];
        const docDirName = pathParts[1];
        
        // Parse document directory name (e.g., "guide--getting-started")
        const docParts = docDirName.split('--');
        if (docParts.length >= 2) {
          const category = docParts[0];
          const pathName = docParts.slice(1).join('-');
          return `${lang}/${category}/${pathName}.md`;
        }
      }
    }
    
    // Last resort: construct from document info
    const docParts = documentId.split('--');
    if (docParts.length >= 2) {
      const category = docParts[0];
      const pathParts = docParts.slice(1).join('-');
      return `${language}/${category}/${pathParts}.md`;
    }
    
    return `${language}/${documentId}.md`;
  }
}