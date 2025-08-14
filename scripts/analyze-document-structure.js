#!/usr/bin/env node

/**
 * Document Structure Analyzer
 * 
 * Analyzes folder structure to determine document creation needs and automatically 
 * generates folder structure based on docs content with internal -1000, -2000 naming
 * for easy management.
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

class DocumentStructureAnalyzer {
  constructor() {
    this.docsStructure = {};
    this.existingDocuments = {};
    this.missingDocuments = [];
    this.languageStats = {};
    
    console.log('📁 Document Structure Analyzer initialized');
  }
  
  /**
   * Scan docs directory to understand available content
   */
  scanDocsDirectory() {
    console.log('\n🔍 Scanning docs directory structure...');
    
    try {
      const docsPath = DOCS_DIR;
      const entries = fs.readdirSync(docsPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'llm-content') {
          const dirPath = path.join(docsPath, entry.name);
          this.analyzeDocsSubdirectory(entry.name, dirPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          this.analyzeDocsFile(entry.name, path.join(docsPath, entry.name));
        }
      }
      
      console.log(`  ✅ Scanned docs directory`);
      console.log(`  📊 Found ${Object.keys(this.docsStructure).length} content areas`);
      
    } catch (error) {
      console.error('❌ Error scanning docs directory:', error.message);
    }
  }
  
  /**
   * Analyze docs subdirectory
   */
  analyzeDocsSubdirectory(dirName, dirPath) {
    console.log(`  📂 Analyzing ${dirName}/`);
    
    if (!this.docsStructure[dirName]) {
      this.docsStructure[dirName] = {
        type: 'directory',
        files: [],
        subdirectories: {},
        totalSize: 0,
        complexity: 'unknown'
      };
    }
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          this.docsStructure[dirName].subdirectories[entry.name] = {};
          this.analyzeDocsSubdirectory(`${dirName}/${entry.name}`, entryPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const fileInfo = this.analyzeDocsFile(entry.name, entryPath);
          this.docsStructure[dirName].files.push(fileInfo);
          this.docsStructure[dirName].totalSize += fileInfo.size;
        }
      }
      
      // Determine complexity based on size and file count
      this.docsStructure[dirName].complexity = this.calculateComplexity(
        this.docsStructure[dirName].totalSize,
        this.docsStructure[dirName].files.length
      );
      
    } catch (error) {
      console.warn(`  ⚠️  Could not analyze ${dirName}:`, error.message);
    }
  }
  
  /**
   * Analyze individual docs file
   */
  analyzeDocsFile(fileName, filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const stats = fs.statSync(filePath);
      
      const fileInfo = {
        name: fileName,
        path: filePath,
        size: content.length,
        lines: content.split('\n').length,
        modified: stats.mtime,
        hasCodeBlocks: /```/.test(content),
        hasImages: /!\[.*\]\(/.test(content),
        complexity: this.calculateFileComplexity(content)
      };
      
      return fileInfo;
      
    } catch (error) {
      console.warn(`  ⚠️  Could not analyze file ${fileName}:`, error.message);
      return {
        name: fileName,
        path: filePath,
        size: 0,
        lines: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate complexity score for content
   */
  calculateComplexity(totalSize, fileCount) {
    if (totalSize < 1000 && fileCount <= 2) return 'simple';
    if (totalSize < 5000 && fileCount <= 5) return 'moderate';
    if (totalSize < 15000 && fileCount <= 10) return 'complex';
    return 'very_complex';
  }
  
  /**
   * Calculate file complexity
   */
  calculateFileComplexity(content) {
    let score = 0;
    
    // Size factor
    score += Math.min(content.length / 1000, 10);
    
    // Structure complexity
    score += (content.match(/^#+\s/gm) || []).length * 0.5;
    score += (content.match(/```/g) || []).length * 2;
    score += (content.match(/\*\*.*?\*\*/g) || []).length * 0.1;
    score += (content.match(/- /g) || []).length * 0.1;
    
    if (score < 3) return 'simple';
    if (score < 8) return 'moderate';
    if (score < 15) return 'complex';
    return 'very_complex';
  }
  
  /**
   * Scan existing LLM content structure
   */
  scanExistingLLMContent() {
    console.log('\n🔍 Scanning existing LLM content structure...');
    
    for (const lang of SUPPORTED_LANGUAGES) {
      const langDir = path.join(LLM_CONTENT_DIR, lang);
      this.existingDocuments[lang] = {};
      
      if (!fs.existsSync(langDir)) {
        console.log(`  📁 Creating ${lang} directory...`);
        fs.mkdirSync(langDir, { recursive: true });
      }
      
      console.log(`  🔍 Scanning ${lang} documents...`);
      
      // Scan for existing character limit folders
      for (const charLimit of CHARACTER_LIMITS) {
        const charDir = path.join(langDir, charLimit.toString());
        this.existingDocuments[lang][charLimit] = {
          folderExists: fs.existsSync(charDir),
          documents: []
        };
        
        if (fs.existsSync(charDir)) {
          const files = fs.readdirSync(charDir).filter(f => f.endsWith('.txt'));
          this.existingDocuments[lang][charLimit].documents = files.map(fileName => {
            const filePath = path.join(charDir, fileName);
            const content = fs.readFileSync(filePath, 'utf-8');
            
            return {
              name: fileName,
              path: filePath,
              size: content.length,
              efficiency: (content.length / charLimit * 100).toFixed(1) + '%',
              created: fs.statSync(filePath).mtime
            };
          });
        }
      }
      
      console.log(`    ✅ Found ${Object.values(this.existingDocuments[lang]).filter(d => d.folderExists).length} existing folders`);
    }
  }
  
  /**
   * Generate recommended folder structure
   */
  generateRecommendedStructure() {
    console.log('\n📊 Generating recommended folder structure...');
    
    for (const lang of SUPPORTED_LANGUAGES) {
      console.log(`\n  🌐 Language: ${lang.toUpperCase()}`);
      
      for (const charLimit of CHARACTER_LIMITS) {
        const existing = this.existingDocuments[lang][charLimit];
        const recommendation = this.analyzeCharacterLimitNeeds(charLimit, lang);
        
        console.log(`    📏 ${charLimit} characters:`);
        console.log(`      📁 Folder: ${existing.folderExists ? '✅ Exists' : '❌ Missing'}`);
        console.log(`      📄 Documents: ${existing.documents.length} found`);
        console.log(`      🎯 Recommendation: ${recommendation.action}`);
        console.log(`      💡 Priority: ${recommendation.priority}`);
        
        if (existing.documents.length > 0) {
          console.log(`      📋 Existing files:`);
          for (const doc of existing.documents) {
            console.log(`        - ${doc.name} (${doc.size} chars, ${doc.efficiency})`);
          }
        }
        
        if (!existing.folderExists) {
          this.missingDocuments.push({
            language: lang,
            charLimit,
            recommendation
          });
        }
      }
    }
  }
  
  /**
   * Analyze character limit needs
   */
  analyzeCharacterLimitNeeds(charLimit, language) {
    const docsComplexity = this.calculateDocsComplexity();
    
    let action, priority, reasoning;
    
    switch (charLimit) {
      case 100:
        action = 'Create minimal concept definition';
        priority = 'High';
        reasoning = 'Essential for quick reference';
        break;
      case 300:
        action = 'Create core summary';
        priority = 'High';
        reasoning = 'Optimal for LLM context efficiency';
        break;
      case 500:
        action = 'Create basic guide';
        priority = 'Medium';
        reasoning = 'Balance between brevity and completeness';
        break;
      case 1000:
        action = 'Create detailed guide';
        priority = 'Medium';
        reasoning = 'Comprehensive yet concise';
        break;
      case 2000:
        action = 'Create complete guide';
        priority = 'Low';
        reasoning = 'Full feature coverage';
        break;
      case 3000:
        action = 'Create comprehensive guide';
        priority = 'Low';
        reasoning = 'Advanced use cases included';
        break;
      case 4000:
        action = 'Create exhaustive guide';
        priority = 'Very Low';
        reasoning = 'Maximum detail for complex scenarios';
        break;
    }
    
    // Adjust priority based on docs complexity
    if (docsComplexity === 'very_complex' && charLimit <= 500) {
      priority = 'Very High';
    } else if (docsComplexity === 'simple' && charLimit >= 2000) {
      priority = 'Very Low';
    }
    
    return { action, priority, reasoning };
  }
  
  /**
   * Calculate overall docs complexity
   */
  calculateDocsComplexity() {
    const complexityScores = Object.values(this.docsStructure).map(item => {
      switch (item.complexity) {
        case 'simple': return 1;
        case 'moderate': return 2;
        case 'complex': return 3;
        case 'very_complex': return 4;
        default: return 2;
      }
    });
    
    const avgScore = complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length;
    
    if (avgScore < 1.5) return 'simple';
    if (avgScore < 2.5) return 'moderate';
    if (avgScore < 3.5) return 'complex';
    return 'very_complex';
  }
  
  /**
   * Create missing folder structure
   */
  createMissingFolders() {
    console.log('\n🏗️ Creating missing folder structure...');
    
    let foldersCreated = 0;
    
    for (const missing of this.missingDocuments) {
      const folderPath = path.join(LLM_CONTENT_DIR, missing.language, missing.charLimit.toString());
      
      try {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`  ✅ Created: ${missing.language}/${missing.charLimit}/`);
        foldersCreated++;
        
        // Create a placeholder README
        const readmePath = path.join(folderPath, 'README.md');
        const readmeContent = this.generateFolderReadme(missing);
        fs.writeFileSync(readmePath, readmeContent, 'utf-8');
        
      } catch (error) {
        console.error(`  ❌ Failed to create ${missing.language}/${missing.charLimit}/: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Summary: Created ${foldersCreated} folders`);
  }
  
  /**
   * Generate README content for folder
   */
  generateFolderReadme(missing) {
    return `# ${missing.charLimit} Character Documents (${missing.language.toUpperCase()})

## Purpose
${missing.recommendation.action}

## Priority
**${missing.recommendation.priority}**

## Reasoning
${missing.recommendation.reasoning}

## Target File Naming
- Primary: \`context-action-${missing.charLimit}.txt\`
- Alternative naming: \`framework-guide-${missing.charLimit}.txt\`

## Guidelines
- Target character count: ${missing.charLimit} ± 10%
- Maintain file naming consistency with -${missing.charLimit} suffix
- Focus on ${missing.recommendation.priority.toLowerCase()} priority content
- Preserve document structure and readability

## Status
- [ ] Document created
- [ ] Content reviewed
- [ ] Character count verified
- [ ] Quality approved

---
Auto-generated on ${new Date().toISOString().split('T')[0]}
`;
  }
  
  /**
   * Generate comprehensive analysis report
   */
  generateAnalysisReport() {
    console.log('\n📋 Generating comprehensive analysis report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      docsStructure: this.docsStructure,
      existingDocuments: this.existingDocuments,
      missingDocuments: this.missingDocuments,
      recommendations: this.generateRecommendations(),
      statistics: this.generateStatistics()
    };
    
    const reportPath = path.join(LLM_CONTENT_DIR, 'STRUCTURE_ANALYSIS.md');
    const reportContent = this.formatAnalysisReport(report);
    
    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    console.log(`  ✅ Analysis report saved: ${reportPath}`);
    
    return report;
  }
  
  /**
   * Generate actionable recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Priority-based document creation recommendations
    const highPriorityMissing = this.missingDocuments.filter(d => 
      ['Very High', 'High'].includes(d.recommendation.priority)
    );
    
    if (highPriorityMissing.length > 0) {
      recommendations.push({
        type: 'urgent',
        title: 'Create High Priority Documents',
        description: `${highPriorityMissing.length} high-priority document folders need content creation`,
        items: highPriorityMissing.map(d => `${d.language}/${d.charLimit} - ${d.recommendation.action}`)
      });
    }
    
    // Document efficiency recommendations
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const charLimit of CHARACTER_LIMITS) {
        const existing = this.existingDocuments[lang][charLimit];
        if (existing.documents.length > 0) {
          const inefficientDocs = existing.documents.filter(d => 
            parseFloat(d.efficiency) < 80
          );
          
          if (inefficientDocs.length > 0) {
            recommendations.push({
              type: 'optimization',
              title: `Optimize ${lang}/${charLimit} Documents`,
              description: 'Documents are underutilizing character limits',
              items: inefficientDocs.map(d => `${d.name} (${d.efficiency})`)
            });
          }
        }
      }
    }
    
    return recommendations;
  }
  
  /**
   * Generate statistics
   */
  generateStatistics() {
    const stats = {
      totalDocsAreas: Object.keys(this.docsStructure).length,
      totalDocsFiles: Object.values(this.docsStructure).reduce((sum, area) => sum + area.files.length, 0),
      totalDocsSize: Object.values(this.docsStructure).reduce((sum, area) => sum + area.totalSize, 0),
      
      existingFolders: 0,
      existingDocuments: 0,
      missingFolders: this.missingDocuments.length,
      
      characterLimitCoverage: {}
    };
    
    for (const lang of SUPPORTED_LANGUAGES) {
      stats.characterLimitCoverage[lang] = {};
      
      for (const charLimit of CHARACTER_LIMITS) {
        const existing = this.existingDocuments[lang][charLimit];
        if (existing.folderExists) stats.existingFolders++;
        stats.existingDocuments += existing.documents.length;
        
        stats.characterLimitCoverage[lang][charLimit] = {
          folderExists: existing.folderExists,
          documentCount: existing.documents.length,
          avgEfficiency: existing.documents.length > 0 
            ? (existing.documents.reduce((sum, d) => sum + parseFloat(d.efficiency), 0) / existing.documents.length).toFixed(1) + '%'
            : '0%'
        };
      }
    }
    
    return stats;
  }
  
  /**
   * Format analysis report as markdown
   */
  formatAnalysisReport(report) {
    return `# Document Structure Analysis Report

Generated: ${report.timestamp}

## 📊 Overview Statistics

- **Docs Areas**: ${report.statistics.totalDocsAreas}
- **Docs Files**: ${report.statistics.totalDocsFiles}  
- **Total Docs Size**: ${(report.statistics.totalDocsSize / 1000).toFixed(1)}KB
- **Existing Folders**: ${report.statistics.existingFolders}
- **Existing Documents**: ${report.statistics.existingDocuments}
- **Missing Folders**: ${report.statistics.missingFolders}

## 🎯 Recommendations

${report.recommendations.map(rec => `
### ${rec.title} (${rec.type.toUpperCase()})

${rec.description}

${rec.items.map(item => `- ${item}`).join('\n')}
`).join('\n')}

## 📁 Character Limit Coverage

${SUPPORTED_LANGUAGES.map(lang => `
### ${lang.toUpperCase()}

| Limit | Folder | Documents | Avg Efficiency |
|-------|--------|-----------|----------------|
${CHARACTER_LIMITS.map(limit => {
  const coverage = report.statistics.characterLimitCoverage[lang][limit];
  return `| ${limit} | ${coverage.folderExists ? '✅' : '❌'} | ${coverage.documentCount} | ${coverage.avgEfficiency} |`;
}).join('\n')}
`).join('\n')}

## 📋 Missing Documents

${report.missingDocuments.map(missing => `
### ${missing.language.toUpperCase()}/${missing.charLimit}

- **Action**: ${missing.recommendation.action}
- **Priority**: ${missing.recommendation.priority}  
- **Reasoning**: ${missing.recommendation.reasoning}
`).join('\n')}

## 📚 Docs Structure Analysis

${Object.entries(report.docsStructure).map(([name, info]) => `
### ${name}

- **Type**: ${info.type}
- **Files**: ${info.files.length}
- **Size**: ${(info.totalSize / 1000).toFixed(1)}KB
- **Complexity**: ${info.complexity}
`).join('\n')}

---

**Next Steps:**
1. Review high-priority missing documents
2. Create content for essential character limits (100, 300, 500)
3. Optimize existing documents with low efficiency
4. Establish document creation workflow

Auto-generated by Document Structure Analyzer
`;
  }
  
  /**
   * Run complete analysis
   */
  async runCompleteAnalysis(options = {}) {
    console.log('🚀 Starting complete document structure analysis...\n');
    
    // Step 1: Scan docs directory
    this.scanDocsDirectory();
    
    // Step 2: Scan existing LLM content
    this.scanExistingLLMContent();
    
    // Step 3: Generate recommendations
    this.generateRecommendedStructure();
    
    // Step 4: Create missing folders if requested
    if (options.createFolders !== false) {
      this.createMissingFolders();
    }
    
    // Step 5: Generate analysis report
    const report = this.generateAnalysisReport();
    
    console.log('\n✅ Complete analysis finished!');
    console.log(`📋 Report saved: docs/llm-content/STRUCTURE_ANALYSIS.md`);
    
    return report;
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    createFolders: !args.includes('--no-create-folders'),
    verbose: args.includes('--verbose')
  };
  
  const analyzer = new DocumentStructureAnalyzer();
  
  try {
    await analyzer.runCompleteAnalysis(options);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DocumentStructureAnalyzer };
export default DocumentStructureAnalyzer;