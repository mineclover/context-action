#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// 더블 대시 ID 생성 함수 (work-queue-cli.cjs와 동일한 로직)
function generateDocumentId(sourcePath, language) {
  // 확장자 제거
  const withoutExt = sourcePath.replace(/\.md$/, '');
  
  // 경로 분할
  const pathParts = withoutExt.split('/');
  
  // 간단한 더블 대시 방식: 경로는 --, 단어 내부는 -
  return pathParts.join('--').toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{3,}/g, '--')  // 3개 이상 연속 대시를 --로 변환
    .replace(/^-+|-+$/g, ''); // 앞뒤 대시 제거
}

// Enhanced schema를 만족하는 기본 템플릿
function createPriorityTemplate(documentId, title, sourcePath, category) {
  return {
    "$schema": "../../priority-schema-enhanced.json",
    "document": {
      "id": documentId,
      "title": title,
      "source_path": sourcePath,
      "category": category,
      "lastModified": new Date().toISOString(),
      "wordCount": 0,
      "subcategory": ""
    },
    "priority": {
      "score": null,
      "tier": "",
      "rationale": "",
      "reviewDate": new Date().toISOString().split('T')[0],
      "autoCalculated": false
    },
    "purpose": {
      "primary_goal": "",
      "target_audience": [],
      "use_cases": [],
      "learning_objectives": []
    },
    "keywords": {
      "primary": [],
      "technical": [],
      "patterns": [],
      "avoid": []
    },
    "tags": {
      "primary": [],
      "secondary": [],
      "audience": [],
      "complexity": "",
      "estimatedReadingTime": "",
      "lastUpdated": new Date().toISOString().split('T')[0]
    },
    "dependencies": {
      "prerequisites": [],
      "references": [],
      "followups": [],
      "conflicts": [],
      "complements": []
    },
    "extraction": {
      "strategy": "",
      "character_limits": {},
      "emphasis": {
        "must_include": [],
        "nice_to_have": [],
        "contextual_keywords": []
      }
    },
    "quality": {
      "completeness_threshold": null,
      "code_examples_required": null,
      "consistency_checks": [],
      "lastQualityCheck": "",
      "qualityScore": null
    },
    "metadata": {
      "created": new Date().toISOString().split('T')[0],
      "updated": new Date().toISOString().split('T')[0],
      "version": "1.0",
      "original_size": 0,
      "estimated_extraction_time": {},
      "maintainer": "",
      "reviewCycle": ""
    },
    "work_status": {
      "generated_files": {},
      "last_checked": new Date().toISOString(),
      "automation_status": {
        "auto_tag_extraction": false,
        "auto_dependency_detection": false,
        "last_auto_update": new Date().toISOString()
      }
    }
  };
}

async function scanDocsDirectory(docsDir, language) {
  const documents = [];
  
  async function scanDir(dirPath, relativePath = '') {
    try {
      const entries = await fs.readdir(dirPath);
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stats = await fs.stat(fullPath);
        const currentRelativePath = relativePath ? `${relativePath}/${entry}` : entry;
        
        if (stats.isDirectory()) {
          // Skip certain directories
          if (['llms', 'assets', '.vitepress', 'node_modules'].includes(entry)) {
            continue;
          }
          await scanDir(fullPath, currentRelativePath);
        } else if (stats.isFile() && entry.endsWith('.md') && entry !== 'index.md') {
          const sourcePath = `${language}/${currentRelativePath}`;
          const documentId = generateDocumentId(currentRelativePath, language);
          const category = currentRelativePath.split('/')[0] || 'guide';
          const title = generateTitle(documentId);
          
          documents.push({
            documentId,
            title,
            sourcePath,
            category,
            fullPath,
            stats
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error.message);
    }
  }
  
  const langDocsDir = path.join(docsDir, language);
  await scanDir(langDocsDir);
  return documents;
}

function generateTitle(documentId) {
  return documentId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

async function generateAllPriorities(language = 'en') {
  console.log(`🚀 Bulk generating priority.json files for language: ${language}`);
  console.log('🔍 Scanning documents...');
  
  // Set up paths
  const docsDir = path.resolve(__dirname, '../../docs');
  const dataDir = path.resolve(__dirname, 'data');
  
  const documents = await scanDocsDirectory(docsDir, language);
  console.log(`📄 Found ${documents.length} documents`);
  
  let generated = 0;
  let skipped = 0;
  
  for (const doc of documents) {
    const outputDir = path.join(dataDir, language, doc.documentId);
    const outputFile = path.join(outputDir, 'priority.json');
    
    try {
      // Check if already exists
      try {
        await fs.access(outputFile);
        console.log(`⏭️  Skipping ${doc.documentId} (already exists)`);
        skipped++;
        continue;
      } catch {
        // File doesn't exist, proceed
      }
      
      // Create directory
      await fs.mkdir(outputDir, { recursive: true });
      
      // Generate template
      const template = createPriorityTemplate(
        doc.documentId,
        doc.title,
        doc.sourcePath,
        doc.category
      );
      
      // Write file
      await fs.writeFile(outputFile, JSON.stringify(template, null, 2));
      console.log(`✅ Generated: ${doc.documentId}`);
      generated++;
      
    } catch (error) {
      console.error(`❌ Failed to generate ${doc.documentId}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${documents.length}`);
}

// Run if called directly
if (require.main === module) {
  const language = process.argv[2] || 'en';
  generateAllPriorities(language).catch(console.error);
}

module.exports = { generateAllPriorities };