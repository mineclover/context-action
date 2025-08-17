/**
 * Priority data management and processing
 */

import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type {
  PriorityMetadata,
  PriorityCollection,
  SortedPriorityCollection
} from '../types/index.js';

export class PriorityManager {
  private llmContentPath: string;
  private validator: any | null = null;

  constructor(llmContentPath: string) {
    this.llmContentPath = llmContentPath;
  }

  /**
   * Initialize JSON schema validator
   */
  async initializeValidator(schemaPath?: string): Promise<void> {
    if (!schemaPath) return;
    
    try {
      const schemaContent = await readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);
      
      const ajv = new Ajv({ allErrors: true, strict: false });
      addFormats(ajv);
      
      this.validator = ajv.compile(schema);
    } catch (error) {
      console.warn('Failed to initialize schema validator:', error);
    }
  }

  /**
   * Load all priority.json files from llm-content directory
   */
  async loadAllPriorities(): Promise<PriorityCollection> {
    const collection: PriorityCollection = {};
    
    if (!existsSync(this.llmContentPath)) {
      throw new Error(`LLM content directory not found: ${this.llmContentPath}`);
    }

    const languages = await readdir(this.llmContentPath, { withFileTypes: true });
    
    for (const langEntry of languages) {
      if (!langEntry.isDirectory()) continue;
      
      const language = langEntry.name;
      const langDir = path.join(this.llmContentPath, language);
      
      collection[language] = await this.loadLanguagePriorities(langDir);
    }

    return collection;
  }

  /**
   * Load priorities for a specific language
   */
  private async loadLanguagePriorities(langDir: string): Promise<Record<string, PriorityMetadata>> {
    const priorities: Record<string, PriorityMetadata> = {};
    
    const documentFolders = await readdir(langDir, { withFileTypes: true });
    
    for (const folderEntry of documentFolders) {
      if (!folderEntry.isDirectory()) continue;
      
      const documentId = folderEntry.name;
      const priorityPath = path.join(langDir, documentId, 'priority.json');
      
      if (existsSync(priorityPath)) {
        try {
          const priority = await this.loadPriorityFile(priorityPath);
          priorities[documentId] = priority;
        } catch (error) {
          console.warn(`Failed to load priority for ${documentId}:`, error);
        }
      }
    }

    return priorities;
  }

  /**
   * Load and validate a single priority.json file
   */
  private async loadPriorityFile(priorityPath: string): Promise<PriorityMetadata> {
    const content = await readFile(priorityPath, 'utf-8');
    const priority: PriorityMetadata = JSON.parse(content);
    
    // Validate against schema if validator is available
    if (this.validator) {
      const isValid = this.validator(priority);
      if (!isValid) {
        throw new Error(`Invalid priority file: ${priorityPath}\n${JSON.stringify(this.validator.errors, null, 2)}`);
      }
    }

    return priority;
  }

  /**
   * Filter priorities by language
   */
  filterByLanguage(collection: PriorityCollection, language: string): Record<string, PriorityMetadata> {
    return collection[language] || {};
  }

  /**
   * Sort documents by priority score (descending)
   */
  sortByPriority(priorities: Record<string, PriorityMetadata>): SortedPriorityCollection {
    const documents = Object.entries(priorities)
      .map(([id, priority]) => ({ id, priority }))
      .sort((a, b) => b.priority.priority.score - a.priority.priority.score);

    return {
      language: 'unknown', // Will be set by caller
      documents
    };
  }

  /**
   * Get documents by tier
   */
  getDocumentsByTier(
    priorities: Record<string, PriorityMetadata>,
    tier: string
  ): Array<{ id: string; priority: PriorityMetadata }> {
    return Object.entries(priorities)
      .filter(([, priority]) => priority.priority.tier === tier)
      .map(([id, priority]) => ({ id, priority }))
      .sort((a, b) => b.priority.priority.score - a.priority.priority.score);
  }

  /**
   * Get statistics about the priority collection
   */
  getStatistics(collection: PriorityCollection): {
    totalDocuments: number;
    byLanguage: Record<string, number>;
    byTier: Record<string, number>;
    byCategory: Record<string, number>;
    averageScore: number;
  } {
    let totalDocuments = 0;
    let totalScore = 0;
    const byLanguage: Record<string, number> = {};
    const byTier: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const [language, priorities] of Object.entries(collection)) {
      const langCount = Object.keys(priorities).length;
      byLanguage[language] = langCount;
      totalDocuments += langCount;

      for (const priority of Object.values(priorities)) {
        totalScore += priority.priority.score;
        
        const tier = priority.priority.tier;
        byTier[tier] = (byTier[tier] || 0) + 1;
        
        const category = priority.document.category;
        byCategory[category] = (byCategory[category] || 0) + 1;
      }
    }

    return {
      totalDocuments,
      byLanguage,
      byTier,
      byCategory,
      averageScore: totalDocuments > 0 ? Math.round(totalScore / totalDocuments) : 0
    };
  }
}