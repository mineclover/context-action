#!/usr/bin/env node

/**
 * Mark LLM generated files as manually edited to protect them from overwrite
 * 
 * Usage:
 *   node scripts/mark-llms-edited.js ko guide-getting-started 100
 *   node scripts/mark-llms-edited.js ko guide-getting-started 100,200,300
 *   node scripts/mark-llms-edited.js ko guide-getting-started --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../packages/llms-generator/data');

/**
 * Mark specific files as edited
 */
function markAsEdited(lang, docId, charLimits, isEdited = true) {
  const priorityPath = path.join(DATA_DIR, lang, docId, 'priority.json');
  
  if (!fs.existsSync(priorityPath)) {
    console.error(`❌ Priority file not found: ${lang}/${docId}`);
    return false;
  }
  
  try {
    const priority = JSON.parse(fs.readFileSync(priorityPath, 'utf-8'));
    
    if (!priority.work_status || !priority.work_status.generated_files) {
      console.error(`❌ No generated files found for: ${lang}/${docId}`);
      return false;
    }
    
    let markedCount = 0;
    const now = new Date().toISOString();
    
    for (const charLimit of charLimits) {
      const limitStr = charLimit.toString();
      
      if (priority.work_status.generated_files[limitStr]) {
        const file = priority.work_status.generated_files[limitStr];
        const wasEdited = file.edited;
        
        file.edited = isEdited;
        file.modified = now;
        
        // If marking as not edited, also mark as needing update
        if (!isEdited) {
          file.needs_update = true;
        } else {
          // If marking as edited, remove needs_update flag
          file.needs_update = false;
        }
        
        const status = isEdited ? '🔒 Protected' : '🔓 Unprotected';
        const action = wasEdited === isEdited ? '(no change)' : 
                      isEdited ? '(newly protected)' : '(protection removed)';
        
        console.log(`${status}: ${lang}/${docId} (${charLimit} chars) ${action}`);
        markedCount++;
      } else {
        console.warn(`⚠️  File not found: ${lang}/${docId} (${charLimit} chars)`);
      }
    }
    
    if (markedCount > 0) {
      // Update last_checked timestamp
      priority.work_status.last_checked = now;
      
      // Write updated priority file
      fs.writeFileSync(priorityPath, JSON.stringify(priority, null, 2) + '\n');
      console.log(`✅ Updated ${markedCount} file(s) for ${lang}/${docId}`);
    }
    
    return markedCount > 0;
  } catch (error) {
    console.error(`❌ Error updating ${lang}/${docId}:`, error.message);
    return false;
  }
}

/**
 * List current edit status
 */
function listEditStatus(lang, docId) {
  const priorityPath = path.join(DATA_DIR, lang, docId, 'priority.json');
  
  if (!fs.existsSync(priorityPath)) {
    console.error(`❌ Priority file not found: ${lang}/${docId}`);
    return;
  }
  
  try {
    const priority = JSON.parse(fs.readFileSync(priorityPath, 'utf-8'));
    
    if (!priority.work_status || !priority.work_status.generated_files) {
      console.log(`📄 No generated files found for: ${lang}/${docId}`);
      return;
    }
    
    console.log(`📋 Edit status for ${lang}/${docId}:`);
    console.log('─'.repeat(50));
    
    const files = priority.work_status.generated_files;
    const charLimits = Object.keys(files).map(Number).sort((a, b) => a - b);
    
    for (const charLimit of charLimits) {
      const file = files[charLimit.toString()];
      const editIcon = file.edited ? '🔒' : '🔓';
      const updateIcon = file.needs_update ? '⚠️' : '✅';
      const editStatus = file.edited ? 'Protected' : 'Unprotected';
      const updateStatus = file.needs_update ? 'Needs Update' : 'Up to Date';
      
      console.log(`  ${editIcon} ${charLimit} chars: ${editStatus} ${updateIcon} ${updateStatus}`);
      
      if (file.modified) {
        const modDate = new Date(file.modified).toLocaleString();
        console.log(`    Last modified: ${modDate}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error reading ${lang}/${docId}:`, error.message);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage:');
    console.log('  # Mark as edited (protect from overwrite)');
    console.log('  node scripts/mark-llms-edited.js <lang> <doc-id> <char-limits|--all>');
    console.log('  ');
    console.log('  # Unmark as edited (allow overwrite)');
    console.log('  node scripts/mark-llms-edited.js <lang> <doc-id> <char-limits|--all> --unmark');
    console.log('  ');
    console.log('  # List current status');
    console.log('  node scripts/mark-llms-edited.js <lang> <doc-id> --status');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/mark-llms-edited.js ko guide-getting-started 100');
    console.log('  node scripts/mark-llms-edited.js ko guide-getting-started 100,200,300');
    console.log('  node scripts/mark-llms-edited.js ko guide-getting-started --all');
    console.log('  node scripts/mark-llms-edited.js ko guide-getting-started --status');
    console.log('  node scripts/mark-llms-edited.js ko guide-getting-started --all --unmark');
    process.exit(1);
  }
  
  const [lang, docId] = args;
  const thirdArg = args[2];
  const isUnmark = args.includes('--unmark');
  const isStatus = args.includes('--status') || thirdArg === '--status';
  
  // Show status
  if (isStatus) {
    listEditStatus(lang, docId);
    return;
  }
  
  if (!thirdArg) {
    console.error('❌ Please specify character limits or --all');
    process.exit(1);
  }
  
  let charLimits = [];
  
  if (thirdArg === '--all') {
    // Get all available character limits from priority file
    const priorityPath = path.join(DATA_DIR, lang, docId, 'priority.json');
    if (fs.existsSync(priorityPath)) {
      try {
        const priority = JSON.parse(fs.readFileSync(priorityPath, 'utf-8'));
        if (priority.work_status && priority.work_status.generated_files) {
          charLimits = Object.keys(priority.work_status.generated_files).map(Number);
        }
      } catch (error) {
        console.error('❌ Error reading priority file:', error.message);
        process.exit(1);
      }
    }
  } else {
    // Parse comma-separated character limits
    charLimits = thirdArg.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }
  
  if (charLimits.length === 0) {
    console.error('❌ No valid character limits found');
    process.exit(1);
  }
  
  const action = isUnmark ? 'Unmarking' : 'Marking';
  console.log(`${action} as edited: ${lang}/${docId} [${charLimits.join(', ')}]`);
  
  if (markAsEdited(lang, docId, charLimits, !isUnmark)) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Run the script
main();