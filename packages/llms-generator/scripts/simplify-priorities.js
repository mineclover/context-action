#!/usr/bin/env node

/**
 * Simplify all priority.json files to remove excessive complexity
 */

import { readFile, writeFile } from 'fs/promises';
import pkg from 'glob';
const { glob } = pkg;
import path from 'path';

async function simplifyPriorityFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Extract only essential fields
    const simplified = {
      document: {
        id: data.document?.id,
        title: data.document?.title,
        source_path: data.document?.source_path,
        category: data.document?.category
      },
      priority: {
        score: data.priority?.score || 50,
        tier: data.priority?.tier || 'useful'
      },
      extraction: {
        strategy: data.extraction?.strategy || 'general',
        character_limits: {}
      }
    };
    
    // Simplify character limits
    const charLimits = data.extraction?.character_limits || {};
    for (const [limit, config] of Object.entries(charLimits)) {
      if (config && typeof config === 'object') {
        simplified.extraction.character_limits[limit] = {
          focus: config.focus || `${limit}자 요약`
        };
      }
    }
    
    // Add default character limits if none exist
    if (Object.keys(simplified.extraction.character_limits).length === 0) {
      simplified.extraction.character_limits = {
        "100": { focus: "핵심 개념" },
        "300": { focus: "주요 내용과 예제" },
        "1000": { focus: "완전한 구현과 예제" }
      };
    }
    
    await writeFile(filePath, JSON.stringify(simplified, null, 2) + '\n', 'utf-8');
    console.log(`✅ Simplified: ${path.relative(process.cwd(), filePath)}`);
    
  } catch (error) {
    console.error(`❌ Failed to simplify ${filePath}: ${error.message}`);
  }
}

async function main() {
  const priorityFiles = glob.sync('packages/llms-generator/data/**/priority.json', {
    ignore: ['**/node_modules/**']
  });
  
  console.log(`🔄 Simplifying ${priorityFiles.length} priority.json files...\n`);
  
  for (const file of priorityFiles) {
    await simplifyPriorityFile(file);
  }
  
  console.log(`\n✅ Completed simplification of ${priorityFiles.length} files`);
}

main().catch(console.error);