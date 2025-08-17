/**
 * Check which documents need regeneration based on work status
 * Enhanced with config-based character limit tracking
 */

import { existsSync, readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';
import ansis from 'ansis';

interface WorkCheckOptions {
  language?: string;
  showAll?: boolean;
  showOutdated?: boolean;
  showEdited?: boolean;
  showMissingConfig?: boolean;
}

interface DocumentStatus {
  docId: string;
  needsUpdate: string[];
  manuallyEdited: string[];
  upToDate: string[];
  missingInConfig: string[];
  configLimits: number[];
}

/**
 * Load config for character limits
 */
function loadConfig() {
  // Handle both project root and llms-generator directory execution
  const cwd = process.cwd();
  let configPath: string;
  if (cwd.includes('packages/llms-generator')) {
    configPath = path.join(cwd, '../../llms-generator.config.json');
  } else {
    configPath = path.join(cwd, 'llms-generator.config.json');
  }
  
  try {
    if (!existsSync(configPath)) {
      return { characterLimits: [100, 200, 300, 400], languages: ['en', 'ko'] };
    }
    
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return {
      characterLimits: config.characterLimits || [100, 200, 300, 400],
      languages: config.languages || ['en', 'ko']
    };
  } catch (error) {
    console.warn(ansis.yellow('⚠️  Error loading config, using defaults'));
    return { characterLimits: [100, 200, 300, 400], languages: ['en', 'ko'] };
  }
}

export async function checkWorkStatus(options: WorkCheckOptions = {}) {
  // Handle both project root and llms-generator directory execution
  const cwd = process.cwd();
  let dataDir: string;
  if (cwd.includes('packages/llms-generator')) {
    dataDir = path.join(cwd, 'data');
  } else {
    dataDir = path.join(cwd, 'packages/llms-generator/data');
  }
  
  const config = loadConfig();
  const languages = options.language ? [options.language] : config.languages;
  
  console.log(ansis.cyan('🔍 Checking work status...\n'));
  console.log(ansis.dim(`Config character limits: [${config.characterLimits.join(', ')}]\n`));
  
  for (const lang of languages) {
    const langDir = path.join(dataDir, lang);
    if (!existsSync(langDir)) continue;
    
    console.log(ansis.bold(`Language: ${lang}`));
    console.log('─'.repeat(50));
    
    const docs = await readdir(langDir, { withFileTypes: true });
    const documentStatuses: DocumentStatus[] = [];
    
    for (const doc of docs) {
      if (!doc.isDirectory()) continue;
      
      const priorityPath = path.join(langDir, doc.name, 'priority.json');
      if (!existsSync(priorityPath)) continue;
      
      try {
        const priority = JSON.parse(readFileSync(priorityPath, 'utf-8'));
        const status = priority.work_status;
        
        const docStatus: DocumentStatus = {
          docId: doc.name,
          needsUpdate: [],
          manuallyEdited: [],
          upToDate: [],
          missingInConfig: [],
          configLimits: config.characterLimits
        };
        
        if (!status || !status.generated_files) {
          // No generated files, all config limits need update
          docStatus.needsUpdate = config.characterLimits.map((l: number) => l.toString());
        } else {
          const configLimitSet = new Set(config.characterLimits.map((l: number) => l.toString()));
          const existingLimits = new Set(Object.keys(status.generated_files));
          
          // Check each config limit
          for (const charLimit of config.characterLimits) {
            const limitStr = charLimit.toString();
            
            if (status.generated_files[limitStr]) {
              const file = status.generated_files[limitStr];
              
              if (file.needs_update) {
                docStatus.needsUpdate.push(limitStr);
              } else if (file.edited) {
                docStatus.manuallyEdited.push(limitStr);
              } else {
                docStatus.upToDate.push(limitStr);
              }
            } else {
              // Missing from generated files - needs creation
              docStatus.needsUpdate.push(limitStr);
            }
          }
          
          // Check for obsolete limits (not in current config)
          for (const limitStr of existingLimits) {
            if (!configLimitSet.has(limitStr)) {
              docStatus.missingInConfig.push(limitStr);
            }
          }
        }
        
        documentStatuses.push(docStatus);
      } catch (error) {
        console.error(`Error reading ${doc.name}:`, error);
      }
    }
    
    // Group documents by status
    const docsNeedingUpdate = documentStatuses.filter(doc => doc.needsUpdate.length > 0);
    const docsWithEdited = documentStatuses.filter(doc => doc.manuallyEdited.length > 0);
    const docsUpToDate = documentStatuses.filter(doc => 
      doc.needsUpdate.length === 0 && 
      doc.manuallyEdited.length === 0 && 
      doc.upToDate.length > 0
    );
    const docsWithObsolete = documentStatuses.filter(doc => doc.missingInConfig.length > 0);
    
    // Display detailed results
    if (docsNeedingUpdate.length > 0) {
      console.log(ansis.red(`\n⚠️  Needs Update (${docsNeedingUpdate.length} documents):`));
      docsNeedingUpdate.forEach(doc => {
        const limits = doc.needsUpdate.join(', ');
        console.log(`  - ${doc.docId} [${limits} chars]`);
      });
    }
    
    if (options.showEdited && docsWithEdited.length > 0) {
      console.log(ansis.yellow(`\n🔒 Manually Edited (${docsWithEdited.length} documents):`));
      docsWithEdited.forEach(doc => {
        const limits = doc.manuallyEdited.join(', ');
        console.log(`  - ${doc.docId} [${limits} chars]`);
      });
    }
    
    if (options.showAll && docsUpToDate.length > 0) {
      console.log(ansis.green(`\n✅ Up to Date (${docsUpToDate.length} documents):`));
      docsUpToDate.forEach(doc => {
        const limits = doc.upToDate.join(', ');
        console.log(`  - ${doc.docId} [${limits} chars]`);
      });
    }
    
    if (options.showMissingConfig && docsWithObsolete.length > 0) {
      console.log(ansis.magenta(`\n🗑️  Obsolete Limits (${docsWithObsolete.length} documents):`));
      docsWithObsolete.forEach(doc => {
        const limits = doc.missingInConfig.join(', ');
        console.log(`  - ${doc.docId} [${limits} chars] (not in config)`);
      });
    }
    
    // Enhanced summary
    const totalDocs = documentStatuses.length;
    const totalNeedsUpdate = docsNeedingUpdate.reduce((sum, doc) => sum + doc.needsUpdate.length, 0);
    const totalEdited = docsWithEdited.reduce((sum, doc) => sum + doc.manuallyEdited.length, 0);
    const totalUpToDate = docsUpToDate.reduce((sum, doc) => sum + doc.upToDate.length, 0);
    const totalObsolete = docsWithObsolete.reduce((sum, doc) => sum + doc.missingInConfig.length, 0);
    
    console.log(ansis.cyan('\n📊 Summary:'));
    console.log(`  Documents: ${totalDocs}`);
    console.log(`  Files needing update: ${totalNeedsUpdate}`);
    console.log(`  Files manually edited: ${totalEdited}`);
    console.log(`  Files up to date: ${totalUpToDate}`);
    if (totalObsolete > 0) {
      console.log(`  Obsolete files: ${totalObsolete}`);
    }
    console.log();
  }
  
  // Global suggestions based on findings across all languages
  const hasOutdatedContent = languages.some((lang: string) => {
    const langDir = path.join(dataDir, lang);
    return existsSync(langDir);
  });
  
  if (hasOutdatedContent) {
    console.log(ansis.bgYellow.black('\n💡 Available Actions:'));
    console.log('  # Regenerate all outdated content:');
    console.log('    pnpm llms extract-all --overwrite');
    console.log('    pnpm llms:minimum');
    console.log('');
    console.log('  # Protect manually edited files:');
    console.log('    pnpm llms:mark-edited <lang> <doc-id> <char-limits>');
    console.log('    pnpm llms:mark-edited ko guide-getting-started 100,200');
    console.log('');
    console.log('  # Check specific document status:');
    console.log('    pnpm llms:status <lang> <doc-id> --status');
    console.log('');
    console.log('  # Show detailed status:');
    console.log('    pnpm llms:check --show-all --show-edited --show-missing-config');
  }
}