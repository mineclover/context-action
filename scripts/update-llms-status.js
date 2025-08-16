#!/usr/bin/env node

/**
 * Update LLMs work status for modified documentation files
 * 
 * This script is called by the pre-commit hook to mark documents
 * as needing update when their source files are modified.
 * Uses config-based character limits for accurate status tracking.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../packages/llms-generator/data');
const CONFIG_PATH = path.join(__dirname, '../llms-generator.config.json');

/**
 * Load and validate config
 */
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.warn('⚠️  Config file not found, using defaults');
      return {
        characterLimits: [100, 200, 300, 400],
        languages: ['ko', 'en']
      };
    }
    
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    
    if (!config.characterLimits || !Array.isArray(config.characterLimits)) {
      throw new Error('Invalid characterLimits in config');
    }
    
    return config;
  } catch (error) {
    console.error('❌ Error loading config:', error.message);
    process.exit(1);
  }
}

/**
 * Parse file path to extract language and document ID
 */
function parseDocPath(filePath) {
  const match = filePath.match(/^docs\/(en|ko)\/(.+)\.md$/);
  if (!match) return null;
  
  const [, lang, docPath] = match;
  // Convert path to document ID (e.g., guide/getting-started -> guide-getting-started)
  const docId = docPath.replace(/\//g, '-');
  
  return { lang, docId, docPath };
}

/**
 * Update priority.json for a specific document with config-based character limits
 */
function updatePriorityStatus(lang, docId, config) {
  const priorityPath = path.join(DATA_DIR, lang, docId, 'priority.json');
  
  if (!fs.existsSync(priorityPath)) {
    console.log(`⚠️  Priority file not found: ${lang}/${docId}`);
    return false;
  }
  
  try {
    const priority = JSON.parse(fs.readFileSync(priorityPath, 'utf-8'));
    
    // Initialize work status if not exists
    if (!priority.work_status) {
      priority.work_status = {};
    }
    
    // Mark source as modified
    const now = new Date().toISOString();
    priority.work_status.source_modified = now;
    priority.work_status.last_checked = now;
    
    // Initialize generated_files if not exists
    if (!priority.work_status.generated_files) {
      priority.work_status.generated_files = {};
    }
    
    // Update status for each configured character limit
    const configLimits = config.characterLimits || [100, 200, 300, 400];
    let updatedCount = 0;
    let protectedCount = 0;
    
    for (const charLimit of configLimits) {
      const limitStr = charLimit.toString();
      const filePath = path.join(DATA_DIR, lang, docId, `${docId}-${charLimit}.txt`);
      
      // Initialize file status if not exists
      if (!priority.work_status.generated_files[limitStr]) {
        priority.work_status.generated_files[limitStr] = {
          path: filePath,
          created: now,
          modified: now,
          edited: false,
          needs_update: true
        };
        updatedCount++;
      } else {
        const file = priority.work_status.generated_files[limitStr];
        
        // Only mark as needing update if not manually edited
        if (file.edited) {
          console.log(`🔒 Protected (manually edited): ${lang}/${docId} (${charLimit} chars)`);
          protectedCount++;
        } else {
          file.needs_update = true;
          file.modified = now;
          updatedCount++;
        }
      }
    }
    
    // Remove entries for character limits not in current config
    const currentLimits = new Set(configLimits.map(l => l.toString()));
    for (const limitStr in priority.work_status.generated_files) {
      if (!currentLimits.has(limitStr)) {
        console.log(`🗑️  Removing obsolete entry: ${lang}/${docId} (${limitStr} chars)`);
        delete priority.work_status.generated_files[limitStr];
      }
    }
    
    // Update extraction character limits in priority metadata
    if (!priority.extraction) {
      priority.extraction = { strategy: 'concept-first', character_limits: {} };
    }
    
    if (!priority.extraction.character_limits) {
      priority.extraction.character_limits = {};
    }
    
    // Ensure all config limits are represented in extraction metadata
    for (const charLimit of configLimits) {
      const limitStr = charLimit.toString();
      if (!priority.extraction.character_limits[limitStr]) {
        priority.extraction.character_limits[limitStr] = {
          focus: `Content for ${charLimit} character limit`
        };
      }
    }
    
    // Write updated priority file
    fs.writeFileSync(priorityPath, JSON.stringify(priority, null, 2) + '\n');
    
    console.log(`✅ Updated: ${lang}/${docId} (${updatedCount} updated, ${protectedCount} protected)`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${lang}/${docId}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('No files to process');
    process.exit(0);
  }
  
  // Load config first
  const config = loadConfig();
  console.log(`📋 Loaded config: ${config.characterLimits.join(', ')} character limits`);
  
  console.log(`Processing ${args.length} file(s)...`);
  
  let updated = 0;
  let skipped = 0;
  let protectedFiles = 0;
  
  for (const filePath of args) {
    const parsed = parseDocPath(filePath);
    
    if (!parsed) {
      console.log(`⚠️  Skipping non-doc file: ${filePath}`);
      skipped++;
      continue;
    }
    
    const { lang, docId } = parsed;
    
    // Check if language is supported in config
    if (config.languages && !config.languages.includes(lang)) {
      console.log(`⚠️  Language ${lang} not in config, skipping: ${docId}`);
      skipped++;
      continue;
    }
    
    if (updatePriorityStatus(lang, docId, config)) {
      updated++;
    } else {
      skipped++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Character limits: [${config.characterLimits.join(', ')}]`);
  
  if (updated > 0) {
    console.log('\n💡 To regenerate outdated content:');
    console.log('  pnpm llms extract-all --overwrite');
    console.log('  pnpm llms:minimum');
  }
  
  // Always exit successfully to not block the commit
  process.exit(0);
}

// Run the script
main();