#!/usr/bin/env node

/**
 * Optimized Document Structure Generator
 * 
 * Creates structure with two special types:
 * - minimum: Document links and brief description
 * - origin: Full original document copy
 * Plus character-limited versions: 100, 300, 500, 1000, 2000, 3000, 4000
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const LLM_CONTENT_DIR = path.join(__dirname, '../docs/llm-content');
const SUPPORTED_LANGUAGES = ['en', 'ko'];

// File types: minimum, origin, and character limits
const FILE_TYPES = [
  { type: 'minimum', description: 'Document links and brief description' },
  { type: 'origin', description: 'Full original document copy' },
  { type: '100', description: '100 character summary' },
  { type: '300', description: '300 character summary' },
  { type: '500', description: '500 character summary' },
  { type: '1000', description: '1000 character summary' },
  { type: '2000', description: '2000 character summary' },
  { type: '3000', description: '3000 character summary' },
  { type: '4000', description: '4000 character summary' }
];

class OptimizedDocumentStructureGenerator {
  constructor() {
    this.documentMap = {};
    this.createdFolders = [];
    this.createdFiles = [];
    
    console.log('📁 Optimized Document Structure Generator initialized');
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
        content: content,
        title: this.extractTitle(content),
        priority: this.calculateDocumentPriority(fileName, directory, content),
        lastModified: stats.mtime
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
    const titleMatch = content.match(/^#\\s+(.+)$/m);
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
    console.log('\n🏗️ Creating optimized folder structure...');
    
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
      
      console.log(`\\n  🌐 ${language.toUpperCase()}: Creating document folders`);
      
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
          
          // Create files for each type
          for (const fileType of FILE_TYPES) {
            const fileName = `${doc.id}-${fileType.type}.txt`;
            const filePath = path.join(docFolderPath, fileName);
            const fileContent = this.generateFileContent(doc, fileType, language);
            
            fs.writeFileSync(filePath, fileContent, 'utf-8');
            
            this.createdFiles.push({
              language,
              documentId: doc.id,
              fileType: fileType.type,
              fileName,
              filePath,
              priority: this.calculateFilePriority(doc.priority, fileType.type)
            });
          }
          
        } catch (error) {
          console.error(`    ❌ Failed to create ${doc.id}/: ${error.message}`);
        }
      }
    }
  }
  
  /**
   * Generate file content based on type
   */
  generateFileContent(document, fileType, language) {
    const priority = this.calculateFilePriority(document.priority, fileType.type);
    
    // Base YAML metadata
    const baseYaml = `---
source: "${document.relativePath}"
title: "${document.title}"
document_id: "${document.id}"
file_type: "${fileType.type}"
priority: ${priority}
original_size: ${document.size}
status: "placeholder"
created: "${new Date().toISOString().split('T')[0]}"
language: "${language}"
---`;
    
    if (fileType.type === 'minimum') {
      return `${baseYaml}

# ${document.title} (Minimum)

## Document Link
- **Source**: \`${document.relativePath}\`
- **Type**: ${this.getDocumentType(document.directory)}
- **Priority**: ${document.priority}/100

## Brief Description
[Brief description of what this document covers]

## Key Links
- Main documentation: \`${document.relativePath}\`
- Related documents: [To be identified]

---
Minimum version with document links and brief description
`;
    }
    
    if (fileType.type === 'origin') {
      return `${baseYaml}

# ${document.title} (Original)

${document.content}

---
Full original document copy from ${document.relativePath}
`;
    }
    
    // Character-limited versions
    const charLimit = parseInt(fileType.type);
    return `${baseYaml}
char_limit: ${charLimit}
---

# ${document.title} (${charLimit} chars)

[Content to be extracted from ${document.relativePath} - target: ${charLimit} characters ±10%]

---
${fileType.description}
`;
  }
  
  /**
   * Get document type based on directory
   */
  getDocumentType(directory) {
    if (directory.includes('guide')) return 'Guide';
    if (directory.includes('api')) return 'API Reference';
    if (directory.includes('examples')) return 'Examples';
    if (directory.includes('concept')) return 'Concepts';
    if (directory.includes('llms')) return 'LLM Documentation';
    return 'Documentation';
  }
  
  /**
   * Calculate file priority based on document priority and file type
   */
  calculateFilePriority(docPriority, fileType) {
    let priority = docPriority;
    
    // Special types get different priorities
    if (fileType === 'minimum') {
      priority += 25; // Highest priority for quick reference
    } else if (fileType === 'origin') {
      priority += 5; // Lower priority for full copies
    } else {
      // Character-limited versions
      const charLimit = parseInt(fileType);
      
      // Essential sizes get priority boost
      if ([300, 1000, 2000].includes(charLimit)) {
        priority += 15;
      }
      
      // Very short summaries are important
      if (charLimit <= 300) {
        priority += 10;
      }
    }
    
    return Math.max(10, Math.min(100, priority));
  }
  
  /**
   * Generate updated extraction guidelines
   */
  generateExtractionGuidelines() {
    console.log('\\n📋 Generating updated extraction guidelines...');
    
    const guidelinesPath = path.join(LLM_CONTENT_DIR, 'EXTRACTION_GUIDELINES.md');
    const guidelines = `# Document Extraction Guidelines

## File Types Overview

### 📄 Minimum Files (\`documentId-minimum.txt\`)
- **Purpose**: Quick reference with document links
- **Content**: Brief description + key document links
- **Priority**: Highest (for quick navigation)
- **Example**: \\\`guide-concepts-minimum.txt\\\`

### 📋 Origin Files (\`documentId-origin.txt\`)
- **Purpose**: Complete original document backup
- **Content**: Full markdown content from source
- **Priority**: Lower (for complete reference)
- **Example**: \\\`guide-concepts-origin.txt\\\`

### 📝 Character-Limited Files (\`documentId-[100|300|500|1000|2000|3000|4000].txt\`)
- **Purpose**: Summarized content within character limits
- **Content**: Extracted and summarized content
- **Priority**: Based on size (300, 1000, 2000 are highest)
- **Example**: \\\`guide-concepts-300.txt\\\`

## Extraction Process

1. **Start with Origin**: Full document is auto-copied
2. **Create Minimum**: Add links and brief description
3. **Extract Summaries**: Create character-limited versions
4. **Update Status**: Change YAML \\\`status\\\` field when complete

## Character Limit Guidelines

### 100 Characters
- Single concept or key point
- One sentence maximum
- No examples or details

### 300 Characters  
- Core concept with brief explanation
- Essential information only
- Minimal technical details

### 500-1000 Characters
- Main concepts with examples
- Key technical details
- Brief code snippets allowed

### 2000+ Characters
- Comprehensive coverage
- Multiple examples
- Full technical explanations
- Detailed code examples

## Status Values

- \\\`placeholder\\\`: Not yet written
- \\\`draft\\\`: Content added but needs review
- \\\`complete\\\`: Content finalized and within limits
- \\\`review\\\`: Needs character count or quality check

## File Structure

\\\`\\\`\\\`
docs/llm-content/
├── en/
│   ├── guide-concepts/
│   │   ├── guide-concepts-minimum.txt    # Links + brief desc
│   │   ├── guide-concepts-origin.txt     # Full original
│   │   ├── guide-concepts-100.txt        # 100 char summary
│   │   ├── guide-concepts-300.txt        # 300 char summary
│   │   ├── guide-concepts-500.txt        # 500 char summary
│   │   ├── guide-concepts-1000.txt       # 1K char summary
│   │   ├── guide-concepts-2000.txt       # 2K char summary
│   │   ├── guide-concepts-3000.txt       # 3K char summary
│   │   └── guide-concepts-4000.txt       # 4K char summary
│   └── ...
└── ko/
    └── ...
\\\`\\\`\\\`

## Quality Standards

1. **Minimum Files**: Include all relevant links and clear description
2. **Origin Files**: Exact copy of source markdown
3. **Character Limits**: Stay within ±10% of target
4. **Information Preservation**: Maintain essential meaning
5. **Consistency**: Follow established patterns

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
    console.log('\\n🔄 Updating document status checker...');
    
    const checkerPath = path.join(__dirname, 'check-document-status-v3.js');
    const checkerContent = `#!/usr/bin/env node

/**
 * Document Status Checker V3
 * 
 * Updated for optimized structure with minimum/origin + character limits
 * Checks: docs/llm-content/en/documentId/documentId-[minimum|origin|100|300|...].txt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LLM_CONTENT_DIR = path.join(__dirname, '../docs/llm-content');
const SUPPORTED_LANGUAGES = ['en', 'ko'];
const FILE_TYPES = ['minimum', 'origin', '100', '300', '500', '1000', '2000', '3000', '4000'];

class DocumentStatusCheckerV3 {
  constructor() {
    this.statistics = {
      total: 0,
      byType: {},
      byStatus: {
        placeholder: 0,
        draft: 0,
        complete: 0,
        review: 0
      },
      characterAccuracy: {
        withinTarget: 0,
        overTarget: 0,
        underTarget: 0
      }
    };
    
    // Initialize type statistics
    FILE_TYPES.forEach(type => {
      this.statistics.byType[type] = {
        total: 0,
        placeholder: 0,
        complete: 0
      };
    });
    
    console.log('📋 Document Status Checker V3 initialized');
  }
  
  /**
   * Scan all files in folder structure
   */
  scanAllFiles() {
    console.log('\\\\n🔍 Scanning optimized document folders...');
    
    const results = [];
    
    for (const language of SUPPORTED_LANGUAGES) {
      const langDir = path.join(LLM_CONTENT_DIR, language);
      
      if (!fs.existsSync(langDir)) {
        console.warn(`  ⚠️  ${language} directory not found`);
        continue;
      }
      
      console.log(`  📂 Scanning ${language.toUpperCase()} folders...`);
      
      const docFolders = fs.readdirSync(langDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      
      for (const docFolder of docFolders) {
        const docFolderPath = path.join(langDir, docFolder);
        const files = fs.readdirSync(docFolderPath).filter(f => f.endsWith('.txt'));
        
        console.log(`    📁 ${docFolder}: ${files.length} files`);
        
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
      const yamlMatch = content.match(/^---\\\\n([\\\\s\\\\S]*?)\\\\n---/);
      if (!yamlMatch) {
        console.warn(`    ⚠️  No YAML metadata in ${fileName}`);
        return null;
      }
      
      const yamlText = yamlMatch[1];
      const metadata = this.parseYAML(yamlText);
      
      // Calculate content without YAML
      const contentWithoutYaml = content.replace(/^---\\\\n[\\\\s\\\\S]*?\\\\n---\\\\n/, '');
      const actualLength = contentWithoutYaml.length;
      
      const fileType = metadata.file_type || 'unknown';
      let isWithinTarget = true;
      let isOverTarget = false;
      let isUnderTarget = false;
      let targetRatio = '100';
      
      // Only check character limits for numeric types
      if (/^\\\\d+$/.test(fileType)) {
        const charLimit = parseInt(fileType);
        const targetMin = Math.floor(charLimit * 0.9);
        const targetMax = Math.ceil(charLimit * 1.1);
        
        isWithinTarget = actualLength >= targetMin && actualLength <= targetMax;
        isOverTarget = actualLength > targetMax;
        isUnderTarget = actualLength < targetMin;
        targetRatio = (actualLength / charLimit * 100).toFixed(1);
      }
      
      return {
        language,
        docFolder,
        fileName,
        filePath,
        fileType,
        ...metadata,
        actualLength,
        isWithinTarget,
        isOverTarget,
        isUnderTarget,
        targetRatio
      };
      
    } catch (error) {
      console.warn(`    ⚠️  Could not analyze ${fileName}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Simple YAML parser for metadata
   */
  parseYAML(yamlText) {
    const metadata = {};
    const lines = yamlText.split('\\\\n');
    
    for (const line of lines) {
      const match = line.match(/^(\\\\w+):\\\\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        
        // Parse different value types
        if (value === 'true') metadata[key] = true;
        else if (value === 'false') metadata[key] = false;
        else if (/^\\\\d+$/.test(value)) metadata[key] = parseInt(value);
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
    const fileType = fileInfo.fileType || 'unknown';
    
    // Update by status
    this.statistics.byStatus[status] = (this.statistics.byStatus[status] || 0) + 1;
    
    // Update by type
    if (this.statistics.byType[fileType]) {
      this.statistics.byType[fileType].total++;
      this.statistics.byType[fileType][status] = (this.statistics.byType[fileType][status] || 0) + 1;
    }
    
    // Update character accuracy (only for completed numeric types)
    if (status !== 'placeholder' && /^\\\\d+$/.test(fileType)) {
      if (fileInfo.isWithinTarget) this.statistics.characterAccuracy.withinTarget++;
      else if (fileInfo.isOverTarget) this.statistics.characterAccuracy.overTarget++;
      else this.statistics.characterAccuracy.underTarget++;
    }
  }
  
  /**
   * Display comprehensive status report
   */
  displayReport(results) {
    console.log('\\\\n📋 Optimized Document Status Report');
    console.log('=' .repeat(60));
    
    // Overall statistics
    console.log(`\\n📊 Overall Statistics:`);
    console.log(`  Total Files: ${this.statistics.total}`);
    console.log(`  📝 Placeholder: ${this.statistics.byStatus.placeholder} (${Math.round(this.statistics.byStatus.placeholder/this.statistics.total*100)}%)`);
    console.log(`  📄 Draft: ${this.statistics.byStatus.draft || 0} (${Math.round((this.statistics.byStatus.draft || 0)/this.statistics.total*100)}%)`);
    console.log(`  ✅ Complete: ${this.statistics.byStatus.complete || 0} (${Math.round((this.statistics.byStatus.complete || 0)/this.statistics.total*100)}%)`);
    console.log(`  🔍 Review: ${this.statistics.byStatus.review || 0} (${Math.round((this.statistics.byStatus.review || 0)/this.statistics.total*100)}%)`);
    
    // By file type
    console.log(`\\n📁 File Type Breakdown:`);
    FILE_TYPES.forEach(type => {
      const typeStats = this.statistics.byType[type];
      console.log(`  ${type.padEnd(8)}: ${typeStats.total} total, ${typeStats.placeholder} placeholder, ${typeStats.complete || 0} complete`);
    });
    
    // Character accuracy for completed files
    const totalCharFiles = this.statistics.characterAccuracy.withinTarget + 
                          this.statistics.characterAccuracy.overTarget + 
                          this.statistics.characterAccuracy.underTarget;
    
    if (totalCharFiles > 0) {
      console.log(`\\n🎯 Character Count Accuracy (Completed Character-Limited Files):`);
      console.log(`  ✅ Within Target (±10%): ${this.statistics.characterAccuracy.withinTarget}`);
      console.log(`  ⚠️  Over Target: ${this.statistics.characterAccuracy.overTarget}`);
      console.log(`  🔍 Under Target: ${this.statistics.characterAccuracy.underTarget}`);
    }
    
    // High priority incomplete files
    const incomplete = results.filter(f => (f.status === 'placeholder') && (f.priority >= 80));
    if (incomplete.length > 0) {
      console.log(`\\n🔥 High Priority Incomplete (${incomplete.length}):`);
      
      // Group by type
      const byType = {};
      incomplete.forEach(f => {
        if (!byType[f.fileType]) byType[f.fileType] = [];
        byType[f.fileType].push(f);
      });
      
      Object.entries(byType).forEach(([type, files]) => {
        console.log(`  📄 ${type}: ${files.length} files`);
        files.slice(0, 5).forEach(file => {
          console.log(`    - ${file.docFolder}/${file.fileName} (priority: ${file.priority})`);
        });
        if (files.length > 5) {
          console.log(`    ... and ${files.length - 5} more`);
        }
      });
    }
  }
  
  /**
   * Run complete check
   */
  async runCheck() {
    console.log('🚀 Starting optimized document status check...\\\\n');
    
    const results = this.scanAllFiles();
    this.displayReport(results);
    
    console.log('\\\\n✅ Optimized document status check complete!');
    return results;
  }
}

// CLI execution
async function main() {
  const checker = new DocumentStatusCheckerV3();
  
  try {
    await checker.runCheck();
  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DocumentStatusCheckerV3 };
export default DocumentStatusCheckerV3;
`;
    
    fs.writeFileSync(checkerPath, checkerContent, 'utf-8');
    console.log(`  ✅ Updated status checker saved: ${checkerPath}`);
  }
  
  /**
   * Generate analysis report
   */
  generateAnalysisReport() {
    console.log('\n📋 Generating optimized analysis report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        languages: SUPPORTED_LANGUAGES.length,
        totalDocuments: Object.values(this.documentMap).reduce((sum, docs) => sum + docs.length, 0),
        totalFolders: this.createdFolders.length,
        totalFiles: this.createdFiles.length,
        fileTypes: FILE_TYPES.length
      },
      fileTypes: FILE_TYPES,
      structure: {
        folders: this.createdFolders,
        files: this.createdFiles,
        highPriority: this.createdFiles.filter(f => f.priority >= 80)
      }
    };
    
    const reportContent = this.formatAnalysisReport(report);
    const reportPath = path.join(LLM_CONTENT_DIR, 'OPTIMIZED_STRUCTURE_ANALYSIS.md');
    
    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    console.log(`  ✅ Analysis report saved: ${reportPath}`);
    
    return report;
  }
  
  /**
   * Format analysis report
   */
  formatAnalysisReport(report) {
    return `# Optimized Document Structure Analysis

Generated: ${report.timestamp}

## 📊 Summary

- **Languages**: ${report.summary.languages}
- **Total Documents**: ${report.summary.totalDocuments}
- **File Types**: ${report.summary.fileTypes}
- **Folders Created**: ${report.summary.totalFolders}
- **Files Created**: ${report.summary.totalFiles}
- **High Priority Files**: ${report.structure.highPriority.length}

## 📁 Optimized Structure

The structure includes special types plus character limits:
\\\`\\\`\\\`
docs/llm-content/
├── en/
│   ├── guide-concepts/
│   │   ├── guide-concepts-minimum.txt    # 🔗 Links + brief description
│   │   ├── guide-concepts-origin.txt     # 📋 Full original copy
│   │   ├── guide-concepts-100.txt        # 📝 100 char summary
│   │   ├── guide-concepts-300.txt        # 📝 300 char summary
│   │   ├── guide-concepts-500.txt        # 📝 500 char summary
│   │   ├── guide-concepts-1000.txt       # 📝 1K char summary
│   │   ├── guide-concepts-2000.txt       # 📝 2K char summary
│   │   ├── guide-concepts-3000.txt       # 📝 3K char summary
│   │   └── guide-concepts-4000.txt       # 📝 4K char summary
│   └── ...
└── ko/
    └── ...
\\\`\\\`\\\`

## 📄 File Types

${FILE_TYPES.map(type => {
  const typeFiles = report.structure.files.filter(f => f.fileType === type.type);
  return `### ${type.type} Files (${typeFiles.length} total)
- **Purpose**: ${type.description}
- **Priority**: ${typeFiles.length > 0 ? 'Average ' + Math.round(typeFiles.reduce((sum, f) => sum + f.priority, 0) / typeFiles.length) + '/100' : 'N/A'}
- **Example**: \`documentId-${type.type}.txt\``;
}).join('\n\n')}

## 🎯 Next Steps

1. **Start with Minimum Files**: Create document links and descriptions
2. **Verify Origin Files**: Ensure full documents are correctly copied
3. **Extract Summaries**: Create character-limited versions by priority
4. **Update Status**: Change YAML \\\`status\\\` as files are completed
5. **Monitor Progress**: Use \`pnpm docs:status-v3\` to track completion

## 🔍 Status Monitoring

Use the optimized status checker:
\`\`\`bash
node scripts/check-document-status-v3.js
\`\`\`

## 📋 Priority Recommendations

High priority files to complete first:
${report.structure.highPriority
  .sort((a, b) => b.priority - a.priority)
  .slice(0, 20)
  .map(file => `- **${file.fileName}** (priority: ${file.priority})`)
  .join('\n')}

---
Auto-generated by Optimized Document Structure Generator
`;
  }
  
  /**
   * Run complete generation
   */
  async runCompleteGeneration() {
    console.log('🚀 Starting optimized document structure generation...\\n');
    
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
    
    console.log('\\n✅ Optimized document structure generation complete!');
    console.log(`📁 Structure: docs/llm-content/[en|ko]/documentId/documentId-[minimum|origin|100|300|...].txt`);
    console.log(`📋 Guidelines: docs/llm-content/EXTRACTION_GUIDELINES.md`);
    console.log(`🔍 Status Check: node scripts/check-document-status-v2.js`);
    
    return report;
  }
}

// CLI execution
async function main() {
  const generator = new OptimizedDocumentStructureGenerator();
  
  try {
    await generator.runCompleteGeneration();
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main();
}

export { OptimizedDocumentStructureGenerator };
export default OptimizedDocumentStructureGenerator;