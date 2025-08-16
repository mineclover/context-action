#!/usr/bin/env node

/**
 * Fix source_path in all priority.json files for English documents
 * Convert "api/action-only.md" to "en/api/action-only.md"
 */

const fs = require('fs').promises;
const path = require('path');

async function fixSourcePaths() {
  console.log('🔧 Fixing source_path in English priority.json files...\n');
  
  const dataDir = path.join(__dirname, 'data', 'en');
  const directories = await fs.readdir(dataDir, { withFileTypes: true });
  
  let fixedCount = 0;
  
  for (const entry of directories) {
    if (entry.isDirectory()) {
      const priorityFile = path.join(dataDir, entry.name, 'priority.json');
      
      try {
        const content = await fs.readFile(priorityFile, 'utf-8');
        const data = JSON.parse(content);
        
        // Check if source_path needs fixing
        const currentPath = data.document.source_path;
        if (currentPath && !currentPath.startsWith('en/')) {
          // Add 'en/' prefix
          data.document.source_path = `en/${currentPath}`;
          
          // Write back
          await fs.writeFile(priorityFile, JSON.stringify(data, null, 2), 'utf-8');
          
          console.log(`✅ Fixed: ${entry.name}`);
          console.log(`   ${currentPath} → ${data.document.source_path}`);
          fixedCount++;
        }
      } catch (error) {
        console.warn(`⚠️  Could not process ${priorityFile}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} source_path entries!`);
}

// Run if called directly
if (require.main === module) {
  fixSourcePaths().catch(console.error);
}

module.exports = { fixSourcePaths };