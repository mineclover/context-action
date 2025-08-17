/**
 * Priority File Status Manager
 * 
 * Manages the status and lifecycle of priority.json files themselves
 */

import { readFile, writeFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import type { LLMSConfig } from '../types/index.js';

export interface PriorityFileStatus {
  created: string;
  last_modified: string;
  source_document_last_seen: string;
  schema_version: string;
  needs_schema_update: boolean;
  auto_generated: boolean;
  manual_review_required: boolean;
}

export interface PriorityUpdateInfo {
  priorityFilePath: string;
  sourceDocumentPath: string;
  lastModified: Date;
  currentSchemaVersion: string;
  needsUpdate: boolean;
  updateReasons: string[];
}

export class PriorityFileStatusManager {
  private config: LLMSConfig;
  private currentSchemaVersion = '2.0'; // Current schema version

  constructor(config: LLMSConfig) {
    this.config = config;
  }

  /**
   * Check if priority file needs update
   */
  async checkPriorityFileStatus(
    language: string,
    documentId: string,
    sourceDocumentPath: string
  ): Promise<PriorityUpdateInfo> {
    const priorityFilePath = this.getPriorityFilePath(language, documentId);
    
    const updateInfo: PriorityUpdateInfo = {
      priorityFilePath,
      sourceDocumentPath,
      lastModified: new Date(),
      currentSchemaVersion: this.currentSchemaVersion,
      needsUpdate: false,
      updateReasons: []
    };

    // Check if priority file exists
    if (!existsSync(priorityFilePath)) {
      updateInfo.needsUpdate = true;
      updateInfo.updateReasons.push('priority_file_missing');
      return updateInfo;
    }

    try {
      // Load priority file
      const priorityContent = await readFile(priorityFilePath, 'utf-8');
      const priorityData = JSON.parse(priorityContent);
      
      // Check schema version
      const currentStatus = priorityData.work_status?.priority_file_status;
      if (!currentStatus?.schema_version || currentStatus.schema_version !== this.currentSchemaVersion) {
        updateInfo.needsUpdate = true;
        updateInfo.updateReasons.push('schema_version_outdated');
      }

      // Check if source document is newer
      if (existsSync(sourceDocumentPath)) {
        const sourceStats = await stat(sourceDocumentPath);
        const sourceModified = sourceStats.mtime;
        
        if (currentStatus?.source_document_last_seen) {
          const lastSeen = new Date(currentStatus.source_document_last_seen);
          if (sourceModified > lastSeen) {
            updateInfo.needsUpdate = true;
            updateInfo.updateReasons.push('source_document_newer');
          }
        } else {
          updateInfo.needsUpdate = true;
          updateInfo.updateReasons.push('source_document_never_checked');
        }
        
        updateInfo.lastModified = sourceModified;
      }

      // Check if manual review is required
      if (currentStatus?.manual_review_required === true) {
        updateInfo.needsUpdate = true;
        updateInfo.updateReasons.push('manual_review_required');
      }

      // Check if needs schema update
      if (currentStatus?.needs_schema_update === true) {
        updateInfo.needsUpdate = true;
        updateInfo.updateReasons.push('schema_update_required');
      }

    } catch (error) {
      console.warn(`⚠️  Error checking priority file status: ${error}`);
      updateInfo.needsUpdate = true;
      updateInfo.updateReasons.push('priority_file_corrupted');
    }

    return updateInfo;
  }

  /**
   * Update priority file status
   */
  async updatePriorityFileStatus(
    priorityFilePath: string,
    updates: Partial<PriorityFileStatus>
  ): Promise<void> {
    try {
      const priorityContent = await readFile(priorityFilePath, 'utf-8');
      const priorityData = JSON.parse(priorityContent);

      // Initialize work_status if it doesn't exist
      if (!priorityData.work_status) {
        priorityData.work_status = {};
      }

      // Initialize priority_file_status if it doesn't exist
      if (!priorityData.work_status.priority_file_status) {
        priorityData.work_status.priority_file_status = {
          created: new Date().toISOString(),
          last_modified: new Date().toISOString(),
          source_document_last_seen: new Date().toISOString(),
          schema_version: this.currentSchemaVersion,
          needs_schema_update: false,
          auto_generated: true,
          manual_review_required: false
        };
      }

      // Apply updates
      Object.assign(priorityData.work_status.priority_file_status, {
        ...updates,
        last_modified: new Date().toISOString()
      });

      // Write back to file
      await writeFile(priorityFilePath, JSON.stringify(priorityData, null, 2), 'utf-8');
      
    } catch (error) {
      console.error(`❌ Failed to update priority file status: ${error}`);
      throw error;
    }
  }

  /**
   * Initialize priority file status for new files
   */
  async initializePriorityFileStatus(
    priorityFilePath: string,
    sourceDocumentPath: string
  ): Promise<void> {
    const status: PriorityFileStatus = {
      created: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      source_document_last_seen: new Date().toISOString(),
      schema_version: this.currentSchemaVersion,
      needs_schema_update: false,
      auto_generated: true,
      manual_review_required: true // New files require manual review
    };

    await this.updatePriorityFileStatus(priorityFilePath, status);
  }

  /**
   * Mark priority file as manually reviewed
   */
  async markAsManuallyReviewed(priorityFilePath: string): Promise<void> {
    await this.updatePriorityFileStatus(priorityFilePath, {
      manual_review_required: false,
      auto_generated: false
    });
  }

  /**
   * Mark priority file as needing schema update
   */
  async markAsNeedingSchemaUpdate(priorityFilePath: string): Promise<void> {
    await this.updatePriorityFileStatus(priorityFilePath, {
      needs_schema_update: true,
      manual_review_required: true
    });
  }

  /**
   * Update source document last seen timestamp
   */
  async updateSourceDocumentLastSeen(
    priorityFilePath: string,
    timestamp?: Date
  ): Promise<void> {
    await this.updatePriorityFileStatus(priorityFilePath, {
      source_document_last_seen: (timestamp || new Date()).toISOString()
    });
  }

  /**
   * Get all priority files that need updates
   */
  async getAllPriorityFilesNeedingUpdate(language: string): Promise<PriorityUpdateInfo[]> {
    const updatesNeeded: PriorityUpdateInfo[] = [];
    
    // This would scan the data directory for all priority files
    // Implementation would depend on your directory structure
    // For now, return empty array as placeholder
    
    return updatesNeeded;
  }

  /**
   * Generate priority file path
   */
  private getPriorityFilePath(language: string, documentId: string): string {
    return path.join(
      this.config.paths.llmContentDir,
      language,
      documentId,
      'priority.json'
    );
  }

  /**
   * Check if schema migration is needed
   */
  async checkSchemaMigrationNeeded(priorityFilePath: string): Promise<boolean> {
    try {
      const content = await readFile(priorityFilePath, 'utf-8');
      const data = JSON.parse(content);
      
      const currentVersion = data.work_status?.priority_file_status?.schema_version;
      return !currentVersion || currentVersion !== this.currentSchemaVersion;
      
    } catch (error) {
      return true; // If we can't read it, it probably needs migration
    }
  }

  /**
   * Migrate priority file to current schema
   */
  async migratePriorityFileSchema(priorityFilePath: string): Promise<void> {
    try {
      const content = await readFile(priorityFilePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Initialize missing work_status structure
      if (!data.work_status) {
        data.work_status = {};
      }

      if (!data.work_status.priority_file_status) {
        data.work_status.priority_file_status = {
          created: new Date().toISOString(),
          last_modified: new Date().toISOString(),
          source_document_last_seen: new Date().toISOString(),
          schema_version: this.currentSchemaVersion,
          needs_schema_update: false,
          auto_generated: false, // Existing files are assumed to be manually created
          manual_review_required: true
        };
      } else {
        // Update schema version
        data.work_status.priority_file_status.schema_version = this.currentSchemaVersion;
        data.work_status.priority_file_status.needs_schema_update = false;
        data.work_status.priority_file_status.last_modified = new Date().toISOString();
      }

      await writeFile(priorityFilePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✅ Migrated priority file schema: ${priorityFilePath}`);
      
    } catch (error) {
      console.error(`❌ Failed to migrate priority file schema: ${error}`);
      throw error;
    }
  }
}