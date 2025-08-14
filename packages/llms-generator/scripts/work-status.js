#!/usr/bin/env node

/**
 * Standalone script for work status management
 * Usage: node work-status.js <command> [options]
 */

import { readFile, writeFile, stat, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project paths
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const DATA_DIR = path.join(__dirname, '../data');

async function getDocumentWorkStatus(language, documentId) {
  const priorityFile = path.join(DATA_DIR, language, documentId, 'priority.json');
  
  if (!existsSync(priorityFile)) {
    return null;
  }

  const priorityContent = await readFile(priorityFile, 'utf-8');
  const priority = JSON.parse(priorityContent);
  
  const sourceFile = path.join(DOCS_DIR, language, priority.document.source_path);
  let sourceModified;
  
  if (existsSync(sourceFile)) {
    const sourceStat = await stat(sourceFile);
    sourceModified = sourceStat.mtime;
  }

  // Get character limits from extraction config
  const characterLimits = Object.keys(priority.extraction.character_limits || {}).map(Number);
  const generatedFiles = [];

  for (const charLimit of characterLimits) {
    const filePath = path.join(DATA_DIR, language, documentId, `${documentId}-${charLimit}.txt`);
    
    let exists = existsSync(filePath);
    let fileSize;
    let modified;

    if (exists) {
      const fileStat = await stat(filePath);
      fileSize = fileStat.size;
      modified = fileStat.mtime;
    }

    const needsUpdate = !exists || (sourceModified && modified && modified < sourceModified);

    generatedFiles.push({
      charLimit,
      path: filePath,
      exists,
      modified,
      needsUpdate,
      size: fileSize
    });
  }

  return {
    documentId,
    sourceFile,
    sourceModified,
    characterLimits,
    generatedFiles,
    needsWork: generatedFiles.some(f => f.needsUpdate)
  };
}

async function getWorkContext(language, documentId, characterLimit = 100) {
  const workStatus = await getDocumentWorkStatus(language, documentId);
  if (!workStatus) {
    return null;
  }

  // Load priority info
  const priorityFile = path.join(DATA_DIR, language, documentId, 'priority.json');
  const priorityContent = await readFile(priorityFile, 'utf-8');
  const priorityInfo = JSON.parse(priorityContent);

  // Load source content
  let sourceContent = '';
  if (existsSync(workStatus.sourceFile)) {
    sourceContent = await readFile(workStatus.sourceFile, 'utf-8');
    // Remove YAML frontmatter if present
    sourceContent = sourceContent.replace(/^---\n[\s\S]*?\n---\n/, '');
  }

  // Load current summary
  const summaryFile = workStatus.generatedFiles.find(f => f.charLimit === characterLimit);
  let currentSummary = '';
  if (summaryFile?.exists) {
    currentSummary = await readFile(summaryFile.path, 'utf-8');
  }

  return {
    documentId,
    title: priorityInfo.document.title,
    sourceContent,
    currentSummary,
    priorityInfo,
    workStatus
  };
}

async function getAllDocuments(language) {
  const langDir = path.join(DATA_DIR, language);
  if (!existsSync(langDir)) {
    return [];
  }

  const documents = [];
  const entries = await readdir(langDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const priorityFile = path.join(langDir, entry.name, 'priority.json');
      if (existsSync(priorityFile)) {
        documents.push(entry.name);
      }
    }
  }

  return documents;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    console.log('🔧 Work Status Script\n');
    console.log('USAGE:');
    console.log('  node work-status.js <command> [options]\n');
    console.log('COMMANDS:');
    console.log('  status <lang> [document-id] [chars]  Show work status');
    console.log('  context <lang> <document-id> [chars] Show work context');
    console.log('  list <lang> [chars]                  List documents needing work');
    console.log('  help                                 Show this help\n');
    console.log('EXAMPLES:');
    console.log('  node work-status.js status ko');
    console.log('  node work-status.js status ko guide-action-handlers 100');
    console.log('  node work-status.js context ko guide-action-handlers 100');
    console.log('  node work-status.js list ko 100');
    return;
  }

  const command = args[0];
  const language = args[1] || 'ko';
  const documentId = args[2];
  const characterLimit = parseInt(args[3]) || 100;

  try {
    switch (command) {
      case 'status':
        if (documentId) {
          const workStatus = await getDocumentWorkStatus(language, documentId);
          if (!workStatus) {
            console.error(`❌ Document not found: ${documentId}`);
            process.exit(1);
          }

          console.log(`📊 Work Status: ${documentId} (${language})\n`);
          console.log(`Source: ${workStatus.sourceFile}`);
          console.log(`Source modified: ${workStatus.sourceModified?.toISOString() || 'Unknown'}`);
          console.log(`Needs work: ${workStatus.needsWork ? '❌ Yes' : '✅ No'}\n`);

          console.log('Generated files:');
          for (const file of workStatus.generatedFiles) {
            const status = file.exists ? '✅' : '❌';
            const updateStatus = file.needsUpdate ? '⚠️ needs update' : '✅ up to date';
            const size = file.size ? `${Math.round(file.size / 1024 * 100) / 100}KB` : 'N/A';
            
            console.log(`  ${file.charLimit} chars: ${status} ${updateStatus} (${size})`);
          }
        } else {
          console.log(`📊 Work Status Summary: ${language}\n`);
          // List all documents and their status would go here
          console.log('Use: node work-status.js list <lang> [chars] to see all documents');
        }
        break;

      case 'context':
        if (!documentId) {
          console.error('❌ Document ID required for context command');
          process.exit(1);
        }

        const workContext = await getWorkContext(language, documentId, characterLimit);
        if (!workContext) {
          console.error(`❌ Document not found: ${documentId}`);
          process.exit(1);
        }

        console.log(`📖 Work Context: ${documentId} (${characterLimit} chars)\n`);
        console.log(`Title: ${workContext.title}`);
        console.log(`Priority: ${workContext.priorityInfo.priority.score} (${workContext.priorityInfo.priority.tier})`);
        console.log(`Strategy: ${workContext.priorityInfo.extraction.strategy}`);
        
        const focusInfo = workContext.priorityInfo.extraction.character_limits[characterLimit.toString()];
        if (focusInfo) {
          console.log(`Focus: ${focusInfo.focus}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('SOURCE CONTENT:');
        console.log('='.repeat(60));
        console.log(workContext.sourceContent.slice(0, 1500) + (workContext.sourceContent.length > 1500 ? '\n...(truncated)' : ''));

        console.log('\n' + '='.repeat(60));
        console.log(`CURRENT SUMMARY (${characterLimit} chars):`);
        console.log('='.repeat(60));
        if (workContext.currentSummary) {
          console.log(workContext.currentSummary);
          console.log(`\nActual length: ${workContext.currentSummary.length} characters`);
        } else {
          console.log('❌ No summary exists yet');
        }
        break;

      case 'list':
        console.log(`📋 Documents needing work: ${language} (${characterLimit} chars)\n`);
        
        // This would need to be implemented with a proper directory scan
        console.log('ℹ️  Use the full CLI for complete listing functionality');
        console.log('Example: npx @context-action/llms-generator work-list ko --chars=100');
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Use "node work-status.js help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();