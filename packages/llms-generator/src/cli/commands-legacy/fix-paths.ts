/**
 * Fix source_path in all priority.json files for specified language
 * TypeScript migration of fix-source-paths.cjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

export interface FixPathsOptions {
  language?: string;
  dataDir?: string;
  dryRun?: boolean;
}

export async function fixSourcePaths(options: FixPathsOptions = {}): Promise<void> {
  const language = options.language || 'en';
  const dataDir = options.dataDir || resolve(process.cwd(), 'data', language);
  const dryRun = options.dryRun || false;
  
  console.log(`🔧 Fixing source_path in ${language.toUpperCase()} priority.json files...`);
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('');
  }
  
  try {
    const directories = await readdir(dataDir, { withFileTypes: true });
    let fixedCount = 0;
    let checkedCount = 0;
    
    for (const entry of directories) {
      if (entry.isDirectory()) {
        const priorityFile = join(dataDir, entry.name, 'priority.json');
        
        try {
          const content = await readFile(priorityFile, 'utf-8');
          const data = JSON.parse(content);
          checkedCount++;
          
          // Check if source_path needs fixing
          const currentPath = data.document?.source_path;
          if (currentPath && !currentPath.startsWith(`${language}/`)) {
            // Add language prefix
            const newPath = `${language}/${currentPath}`;
            
            if (!dryRun) {
              data.document.source_path = newPath;
              await writeFile(priorityFile, JSON.stringify(data, null, 2), 'utf-8');
            }
            
            console.log(`${dryRun ? '🔍' : '✅'} ${dryRun ? 'Would fix' : 'Fixed'}: ${entry.name}`);
            console.log(`   ${currentPath} → ${newPath}`);
            fixedCount++;
          }
        } catch (error) {
          console.warn(`⚠️  Could not process ${priorityFile}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`📁 Directories checked: ${checkedCount}`);
    console.log(`${dryRun ? '🔍' : '🎉'} ${dryRun ? 'Would fix' : 'Fixed'} ${fixedCount} source_path entries!`);
    
    if (dryRun && fixedCount > 0) {
      console.log(`\n💡 Run without --dry-run to apply changes`);
    }
  } catch (error) {
    console.error('❌ Error accessing data directory:', error instanceof Error ? error.message : String(error));
    console.log(`💡 Make sure the data directory exists: ${dataDir}`);
    process.exit(1);
  }
}

// CLI integration
export default {
  command: 'fix-paths [options]',
  description: 'Fix source_path in priority.json files to include language prefix',
  handler: fixSourcePaths
};