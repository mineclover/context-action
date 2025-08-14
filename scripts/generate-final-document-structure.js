#!/usr/bin/env node

/**
 * Final Document Structure Generator
 * 
 * Creates optimized folder structure with YAML metadata:
 * docs/llm-content/en/guide-action-handlers/guide-action-handlers-100.txt
 * Each file contains only YAML metadata + content (no verbose instructions)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const LLM_CONTENT_DIR = path.join(__dirname, '../docs/llm-content');
const SUPPORTED_LANGUAGES = ['en', 'ko'];

// Character limits for document organization
const CHARACTER_LIMITS = [100, 300, 500, 1000, 2000, 3000, 4000];

class FinalDocumentStructureGenerator {
  constructor() {
    this.documentMap = {};
    this.createdFolders = [];
    this.createdFiles = [];
    
    console.log('📁 Final Document Structure Generator initialized');
  }
  
  /**
   * Scan docs directory for actual documentation files
   */
  scanDocumentationFiles() {
    console.log('\n🔍 Scanning documentation files...');
    
    for (const language of SUPPORTED_LANGUAGES) {
      const langDocsDir = path.join(DOCS_DIR, language);
      this.documentMap[language] = [];
      
      if (!fs.existsSync(langDocsDir)) {
        console.warn(`  ⚠️  ${language} docs directory not found: ${langDocsDir}`);
        continue;
      }
      
      console.log(`  📂 Scanning ${language.toUpperCase()} documentation...`);
      this.scanDirectoryRecursively(langDocsDir, language, '');
      
      console.log(`    ✅ Found ${this.documentMap[language].length} documents`);
    }
  }
  
  /**
   * Recursively scan directory for markdown files
   */
  scanDirectoryRecursively(dirPath, language, relativePath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const currentRelativePath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.shouldSkipDirectory(entry.name)) {
            this.scanDirectoryRecursively(fullPath, language, currentRelativePath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const documentInfo = this.analyzeDocument(fullPath, currentRelativePath);
          if (documentInfo) {
            this.documentMap[language].push(documentInfo);
          }
        }
      }
    } catch (error) {
      console.warn(`    ⚠️  Could not scan ${dirPath}: ${error.message}`);
    }
  }
  
  /**
   * Check if directory should be skipped
   */
  shouldSkipDirectory(dirName) {
    const skipDirs = ['.vitepress', 'node_modules', '.git', 'dist', 'cache', 'llm-content'];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }
  
  /**
   * Analyze individual document
   */
  analyzeDocument(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const stats = fs.statSync(filePath);
      
      const fileName = path.basename(relativePath, '.md');
      const directory = path.dirname(relativePath);
      
      // Create clean document identifier
      const documentId = this.createDocumentId(fileName, directory);
      
      return {
        id: documentId,
        fileName: fileName,
        filePath: filePath,
        relativePath: relativePath,
        directory: directory,
        size: content.length,
        title: this.extractTitle(content),
        priority: this.calculateDocumentPriority(fileName, directory, content)
      };
      
    } catch (error) {
      console.warn(`    ⚠️  Could not analyze ${filePath}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Create clean document identifier for folder naming
   */
  createDocumentId(fileName, directory) {
    const parts = [];
    
    if (directory && directory !== '.') {
      const dirParts = directory.split(path.sep).filter(part => 
        part && part !== 'en' && part !== 'ko'
      );
      parts.push(...dirParts);
    }
    
    parts.push(fileName);
    
    return parts.join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  /**
   * Extract title from markdown content
   */
  extractTitle(content) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : 'Untitled';
  }
  
  /**
   * Calculate document priority
   */
  calculateDocumentPriority(fileName, directory, content) {
    let priority = 50;
    
    const highPriorityFiles = ['overview', 'quick-start', 'getting-started', 'concepts', 'index'];
    if (highPriorityFiles.some(name => fileName.includes(name))) {
      priority += 30;
    }
    
    if (directory.includes('guide')) priority += 20;
    if (directory.includes('api')) priority += 15;
    if (directory.includes('examples')) priority += 10;
    
    return Math.max(10, Math.min(100, priority));
  }
  
  /**
   * Create folder structure for documents
   */
  createFolderStructure() {
    console.log('\n🏗️ Creating folder structure...');
    
    // Clean existing structure
    if (fs.existsSync(LLM_CONTENT_DIR)) {
      for (const lang of SUPPORTED_LANGUAGES) {
        const langDir = path.join(LLM_CONTENT_DIR, lang);
        if (fs.existsSync(langDir)) {
          fs.rmSync(langDir, { recursive: true, force: true });
          console.log(`  🧹 Cleaned existing ${lang} directory`);
        }
      }
    }
    
    for (const language of SUPPORTED_LANGUAGES) {
      const langDir = path.join(LLM_CONTENT_DIR, language);
      fs.mkdirSync(langDir, { recursive: true });
      
      console.log(`\n  🌐 ${language.toUpperCase()}: Creating document folders`);
      
      const docs = this.documentMap[language] || [];
      for (const doc of docs) {
        const docFolderPath = path.join(langDir, doc.id);
        
        try {
          fs.mkdirSync(docFolderPath, { recursive: true });
          console.log(`    📁 ${doc.id}/`);
          this.createdFolders.push({
            language,
            documentId: doc.id,
            path: docFolderPath
          });
          
          // Create files for each character limit
          for (const charLimit of CHARACTER_LIMITS) {
            const fileName = `${doc.id}-${charLimit}.txt`;
            const filePath = path.join(docFolderPath, fileName);
            const fileContent = this.generateFileContent(doc, charLimit);
            
            fs.writeFileSync(filePath, fileContent, 'utf-8');
            
            this.createdFiles.push({
              language,
              documentId: doc.id,
              charLimit,
              fileName,
              filePath,
              priority: this.calculateFilePriority(doc.priority, charLimit)
            });
          }
          
        } catch (error) {
          console.error(`    ❌ Failed to create ${doc.id}/: ${error.message}`);
        }
      }
    }
  }
  
  /**
   * Generate minimal file content with YAML metadata
   */
  generateFileContent(document, charLimit) {
    const priority = this.calculateFilePriority(document.priority, charLimit);
    
    return `---
source: "${document.relativePath}"
title: "${document.title}"
document_id: "${document.id}"
char_limit: ${charLimit}
priority: ${priority}
original_size: ${document.size}
status: "placeholder"
created: "${new Date().toISOString().split('T')[0]}"
---

# ${document.title} (${charLimit} chars)

[Content to be extracted from ${document.relativePath}]
`;
  }
  
  /**
   * Calculate file priority based on document priority and character limit
   */
  calculateFilePriority(docPriority, charLimit) {
    let priority = docPriority;
    
    // Essential sizes get priority boost
    if ([300, 1000, 2000].includes(charLimit)) {
      priority += 10;
    }
    
    // Very short summaries are important
    if (charLimit <= 300) {
      priority += 15;
    }
    
    return Math.max(10, Math.min(100, priority));
  }
  
  /**
   * Generate common extraction guidelines
   */
  generateExtractionGuidelines() {
    console.log('\n📋 Generating extraction guidelines...');
    
    const guidelinesPath = path.join(LLM_CONTENT_DIR, 'EXTRACTION_GUIDELINES.md');
    const guidelines = `# Document Extraction Guidelines

## General Instructions

1. **Extract content** from the source document specified in YAML metadata
2. **Stay within character limit** (±10% tolerance)
3. **Preserve document structure** and key information
4. **Update status** in YAML front matter when complete

## Character Limit Guidelines

### 100 Characters
- Core concept only
- Single sentence explanations
- Remove all examples and code blocks
- Minimal technical detail

### 300 Characters  
- Main concepts and key points
- One simple example maximum
- Essential technical details only
- Brief explanations

### 500-1000 Characters
- Cover main concepts with explanation
- Include 2-3 key examples
- Important technical details
- Moderate explanations

### 2000+ Characters
- Comprehensive coverage of topic
- Multiple examples and use cases
- Full technical details and edge cases
- Complete explanations

## Status Values

- \`placeholder\`: Not yet written
- \`draft\`: Content added but needs review
- \`complete\`: Content finalized and within character limit
- \`review\`: Needs character count or quality review

## File Naming Convention

- Folder: \`documentId/\`
- File: \`documentId-charLimit.txt\`
- Example: \`guide-concepts/guide-concepts-300.txt\`

## Quality Standards

1. **Character Count**: Stay within ±10% of target
2. **Information Preservation**: Maintain essential meaning
3. **Readability**: Clear and well-structured content
4. **Consistency**: Follow established patterns

---
Generated: ${new Date().toISOString().split('T')[0]}
`;
    
    fs.writeFileSync(guidelinesPath, guidelines, 'utf-8');
    console.log(`  ✅ Guidelines saved: ${guidelinesPath}`);
  }
  
  /**
   * Update document status checker for new structure
   */
  updateStatusChecker() {
    console.log('\n🔄 Updating document status checker...');
    
    const checkerPath = path.join(__dirname, 'check-document-status-v2.js');
    const checkerContent = `#!/usr/bin/env node

/**
 * Document Status Checker V2
 * 
 * Updated for folder-based structure with YAML metadata
 * Checks: docs/llm-content/en/documentId/documentId-charLimit.txt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LLM_CONTENT_DIR = path.join(__dirname, '../docs/llm-content');
const SUPPORTED_LANGUAGES = ['en', 'ko'];

class DocumentStatusCheckerV2 {
  constructor() {
    this.statistics = {
      total: 0,
      placeholder: 0,
      draft: 0,
      complete: 0,
      review: 0,
      withinTarget: 0,
      overTarget: 0,
      underTarget: 0
    };
    
    console.log('📋 Document Status Checker V2 initialized');
  }
  
  /**
   * Scan all files in folder structure
   */
  scanAllFiles() {
    console.log('\\n🔍 Scanning document folders...');
    
    const results = [];
    
    for (const language of SUPPORTED_LANGUAGES) {
      const langDir = path.join(LLM_CONTENT_DIR, language);
      
      if (!fs.existsSync(langDir)) {
        console.warn(\`  ⚠️  \${language} directory not found\`);
        continue;
      }
      
      console.log(\`  📂 Scanning \${language.toUpperCase()} folders...\`);
      
      const docFolders = fs.readdirSync(langDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      
      for (const docFolder of docFolders) {
        const docFolderPath = path.join(langDir, docFolder);
        const files = fs.readdirSync(docFolderPath).filter(f => f.endsWith('.txt'));
        
        console.log(\`    📁 \${docFolder}: \${files.length} files\`);
        
        for (const fileName of files) {
          const filePath = path.join(docFolderPath, fileName);
          const fileInfo = this.analyzeFile(filePath, fileName, language, docFolder);
          
          if (fileInfo) {
            results.push(fileInfo);
            this.updateStatistics(fileInfo);
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Analyze individual file with YAML metadata
   */
  analyzeFile(filePath, fileName, language, docFolder) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract YAML front matter
      const yamlMatch = content.match(/^---\\n([\\s\\S]*?)\\n---/);
      if (!yamlMatch) {
        console.warn(\`    ⚠️  No YAML metadata in \${fileName}\`);
        return null;
      }
      
      const yamlText = yamlMatch[1];
      const metadata = this.parseYAML(yamlText);
      
      // Calculate content without YAML
      const contentWithoutYaml = content.replace(/^---\\n[\\s\\S]*?\\n---\\n/, '');
      const actualLength = contentWithoutYaml.length;
      
      const charLimit = metadata.char_limit || 0;
      const targetMin = Math.floor(charLimit * 0.9);
      const targetMax = Math.ceil(charLimit * 1.1);
      
      return {
        language,
        docFolder,
        fileName,
        filePath,
        ...metadata,
        actualLength,
        targetMin,
        targetMax,
        isWithinTarget: actualLength >= targetMin && actualLength <= targetMax,
        isOverTarget: actualLength > targetMax,
        isUnderTarget: actualLength < targetMin,
        targetRatio: charLimit > 0 ? (actualLength / charLimit * 100).toFixed(1) : '0'
      };
      
    } catch (error) {
      console.warn(\`    ⚠️  Could not analyze \${fileName}: \${error.message}\`);
      return null;
    }
  }
  
  /**
   * Simple YAML parser for metadata
   */
  parseYAML(yamlText) {
    const metadata = {};
    const lines = yamlText.split('\\n');
    
    for (const line of lines) {
      const match = line.match(/^(\\w+):\\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        
        // Parse different value types
        if (value === 'true') metadata[key] = true;
        else if (value === 'false') metadata[key] = false;
        else if (/^\\d+$/.test(value)) metadata[key] = parseInt(value);
        else if (/^".*"$/.test(value)) metadata[key] = value.slice(1, -1);
        else metadata[key] = value;
      }
    }
    
    return metadata;
  }
  
  /**
   * Update statistics based on file info
   */
  updateStatistics(fileInfo) {
    this.statistics.total++;
    
    const status = fileInfo.status || 'placeholder';
    this.statistics[status] = (this.statistics[status] || 0) + 1;
    
    if (status !== 'placeholder') {
      if (fileInfo.isWithinTarget) this.statistics.withinTarget++;
      else if (fileInfo.isOverTarget) this.statistics.overTarget++;
      else this.statistics.underTarget++;
    }
  }
  
  /**
   * Display status report
   */
  displayReport(results) {
    console.log('\\n📋 Document Status Report');
    console.log('=' .repeat(50));
    
    console.log(\`\\n📊 Overall Statistics:\`);
    console.log(\`  Total Files: \${this.statistics.total}\`);
    console.log(\`  📝 Placeholder: \${this.statistics.placeholder} (\${Math.round(this.statistics.placeholder/this.statistics.total*100)}%)\`);
    console.log(\`  📄 Draft: \${this.statistics.draft || 0} (\${Math.round((this.statistics.draft || 0)/this.statistics.total*100)}%)\`);
    console.log(\`  ✅ Complete: \${this.statistics.complete || 0} (\${Math.round((this.statistics.complete || 0)/this.statistics.total*100)}%)\`);
    console.log(\`  🔍 Review: \${this.statistics.review || 0} (\${Math.round((this.statistics.review || 0)/this.statistics.total*100)}%)\`);
    
    const written = this.statistics.total - this.statistics.placeholder;
    if (written > 0) {
      console.log(\`\\n🎯 Character Count Accuracy (Written Files):\`);
      console.log(\`  ✅ Within Target: \${this.statistics.withinTarget}\`);
      console.log(\`  ⚠️  Over Target: \${this.statistics.overTarget}\`);
      console.log(\`  🔍 Under Target: \${this.statistics.underTarget}\`);
    }
    
    // Show high priority incomplete files
    const incomplete = results.filter(f => (f.status === 'placeholder') && (f.priority >= 80));
    if (incomplete.length > 0) {
      console.log(\`\\n🔥 High Priority Incomplete (\${incomplete.length}):\`);
      incomplete.slice(0, 10).forEach(file => {
        console.log(\`  - \${file.docFolder}/\${file.fileName} (priority: \${file.priority})\`);
      });
    }
  }
  
  /**
   * Run complete check
   */
  async runCheck() {
    console.log('🚀 Starting document status check...\\n');
    
    const results = this.scanAllFiles();
    this.displayReport(results);
    
    console.log('\\n✅ Document status check complete!');
    return results;
  }
}

// CLI execution
async function main() {
  const checker = new DocumentStatusCheckerV2();
  
  try {
    await checker.runCheck();
  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main();
}

export { DocumentStatusCheckerV2 };
export default DocumentStatusCheckerV2;
`;
    
    fs.writeFileSync(checkerPath, checkerContent, 'utf-8');
    console.log(`  ✅ Updated status checker saved: ${checkerPath}`);
  }
  
  /**
   * Generate analysis report
   */
  generateAnalysisReport() {
    console.log('\n📋 Generating analysis report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        languages: SUPPORTED_LANGUAGES.length,
        totalDocuments: Object.values(this.documentMap).reduce((sum, docs) => sum + docs.length, 0),
        totalFolders: this.createdFolders.length,
        totalFiles: this.createdFiles.length,
        characterLimits: CHARACTER_LIMITS.length
      },
      structure: {
        folders: this.createdFolders,
        files: this.createdFiles,
        highPriority: this.createdFiles.filter(f => f.priority >= 80)
      }
    };
    
    const reportContent = this.formatAnalysisReport(report);
    const reportPath = path.join(LLM_CONTENT_DIR, 'FINAL_STRUCTURE_ANALYSIS.md');
    
    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    console.log(`  ✅ Analysis report saved: ${reportPath}`);
    
    return report;
  }
  
  /**
   * Format analysis report
   */
  formatAnalysisReport(report) {
    return `# Final Document Structure Analysis

Generated: ${report.timestamp}

## 📊 Summary

- **Languages**: ${report.summary.languages}
- **Total Documents**: ${report.summary.totalDocuments}
- **Character Limits**: ${report.summary.characterLimits}
- **Folders Created**: ${report.summary.totalFolders}
- **Files Created**: ${report.summary.totalFiles}
- **High Priority Files**: ${report.structure.highPriority.length}

## 📁 Folder Structure

The new structure uses document-based folders:
\`\`\`
docs/llm-content/
├── en/
│   ├── guide-concepts/
│   │   ├── guide-concepts-100.txt
│   │   ├── guide-concepts-300.txt
│   │   ├── ...
│   └── api-store-manager/
│       ├── api-store-manager-100.txt
│       ├── ...
└── ko/
    └── ...
\`\`\`

## 📄 File Format

Each file contains YAML metadata:
\`\`\`yaml
---
source: "guide/concepts.md"
title: "Core Concepts"
document_id: "guide-concepts"
char_limit: 300
priority: 85
original_size: 10496
status: "placeholder"
created: "${new Date().toISOString().split('T')[0]}"
---

# Core Concepts (300 chars)

[Content to be extracted from guide/concepts.md]
\`\`\`

## 🎯 Next Steps

1. **Extract Content**: Follow guidelines in EXTRACTION_GUIDELINES.md
2. **Update Status**: Change YAML \`status\` from "placeholder" to "draft"/"complete"
3. **Check Progress**: Use \`pnpm docs:status-v2\` to monitor completion
4. **Character Validation**: Ensure content stays within ±10% of target

## 🔍 Status Monitoring

Use the updated status checker:
\`\`\`bash
node scripts/check-document-status-v2.js
\`\`\`

---
Auto-generated by Final Document Structure Generator
`;
  }
  
  /**
   * Run complete generation
   */
  async runCompleteGeneration() {
    console.log('🚀 Starting final document structure generation...\n');
    
    // Step 1: Scan documentation files
    this.scanDocumentationFiles();
    
    // Step 2: Create folder structure with files
    this.createFolderStructure();
    
    // Step 3: Generate extraction guidelines
    this.generateExtractionGuidelines();
    
    // Step 4: Update status checker
    this.updateStatusChecker();
    
    // Step 5: Generate analysis report
    const report = this.generateAnalysisReport();
    
    console.log('\n✅ Final document structure generation complete!');
    console.log(`📁 Structure: docs/llm-content/[en|ko]/documentId/documentId-charLimit.txt`);
    console.log(`📋 Guidelines: docs/llm-content/EXTRACTION_GUIDELINES.md`);
    console.log(`🔍 Status Check: node scripts/check-document-status-v2.js`);
    
    return report;
  }
}

// CLI execution
async function main() {
  const generator = new FinalDocumentStructureGenerator();
  
  try {
    await generator.runCompleteGeneration();
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { FinalDocumentStructureGenerator };
export default FinalDocumentStructureGenerator;