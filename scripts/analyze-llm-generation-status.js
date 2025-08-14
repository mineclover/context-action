#!/usr/bin/env node

/**
 * LLM Document Generation Status Analyzer
 * 
 * Analyzes the current status of generated LLM documents:
 * - Shows character counts by type and language
 * - Displays completion status in table format
 * - Compares EN/KO document coverage
 * 
 * Usage:
 * node scripts/analyze-llm-generation-status.js
 * pnpm docs:llms:status
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const SUPPORTED_LANGUAGES = ['en', 'ko'];
const DOCUMENT_TYPES = ['minimum', 'origin', '100', '300', '500', '1000', '2000', '3000', '4000'];

class LLMGenerationAnalyzer {
  constructor() {
    this.results = new Map(); // document_name -> { type -> { lang -> stats } }
    this.totals = new Map(); // type -> { lang -> total_chars }
    
    console.log('📊 LLM Document Generation Status Analyzer\n');
  }

  /**
   * Scan all generated LLM documents
   */
  scanGeneratedDocuments() {
    console.log('🔍 Scanning generated documents...\n');

    for (const lang of SUPPORTED_LANGUAGES) {
      const llmsDir = path.join(DOCS_DIR, lang, 'llms');
      
      if (!fs.existsSync(llmsDir)) {
        console.log(`⚠️  Directory not found: ${llmsDir}`);
        continue;
      }

      const files = fs.readdirSync(llmsDir)
        .filter(file => file.endsWith('.txt') && file.startsWith('llms-'))
        .sort();

      console.log(`📁 ${lang.toUpperCase()} directory: ${files.length} files`);
      
      for (const file of files) {
        this.analyzeFile(path.join(llmsDir, file), file, lang);
      }
    }
  }

  /**
   * Analyze individual file
   */
  analyzeFile(filePath, fileName, language) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const stats = this.extractFileStats(content, fileName);
      
      // Parse filename: llms-{type}-{lang}.txt or llms-{chars}chars-{lang}.txt
      const parsed = this.parseFileName(fileName);
      if (!parsed) {
        console.warn(`  ⚠️  Could not parse filename: ${fileName}`);
        return;
      }

      const { documentName, type } = parsed;

      // Initialize nested structure
      if (!this.results.has(documentName)) {
        this.results.set(documentName, new Map());
      }
      if (!this.results.get(documentName).has(type)) {
        this.results.get(documentName).set(type, new Map());
      }

      // Store stats
      this.results.get(documentName).get(type).set(language, stats);

      // Update totals
      if (!this.totals.has(type)) {
        this.totals.set(type, new Map());
      }
      if (!this.totals.get(type).has(language)) {
        this.totals.get(type).set(language, 0);
      }
      this.totals.get(type).set(language, 
        this.totals.get(type).get(language) + stats.contentChars
      );

      console.log(`  ✅ ${fileName}: ${stats.contentChars.toLocaleString()} chars`);
      
    } catch (error) {
      console.error(`  ❌ Error analyzing ${fileName}:`, error.message);
    }
  }

  /**
   * Parse filename to extract document name and type
   */
  parseFileName(fileName) {
    // Remove .txt extension
    const baseName = fileName.replace(/\.txt$/, '');
    
    // Pattern: llms-{type}-{lang} or llms-{chars}chars-{lang}
    const patterns = [
      /^llms-(minimum|origin)-(\w+)$/,           // llms-minimum-en, llms-origin-ko
      /^llms-(\d+)chars-(\w+)$/,                // llms-1000chars-en, llms-5000chars-ko
      /^llms-(\d+)-(\w+)$/                      // llms-300-en (alternative format)
    ];

    for (const pattern of patterns) {
      const match = baseName.match(pattern);
      if (match) {
        const [, typeOrChars, lang] = match;
        
        // Determine document name and type
        let documentName, type;
        
        if (typeOrChars === 'minimum' || typeOrChars === 'origin') {
          documentName = 'llms';
          type = typeOrChars;
        } else if (typeOrChars.match(/^\d+$/)) {
          documentName = 'llms';
          type = `${typeOrChars}chars`;
        } else {
          continue;
        }

        return { documentName, type, language: lang };
      }
    }

    return null;
  }

  /**
   * Extract file statistics
   */
  extractFileStats(content, fileName) {
    const totalChars = content.length;
    
    // Try to separate YAML from content (if present)
    const yamlMatch = content.match(/^---\n[\s\S]*?\n---\n/);
    const yamlChars = yamlMatch ? yamlMatch[0].length : 0;
    const contentChars = totalChars - yamlChars;
    
    // Get file size
    const fileSizeKB = (totalChars / 1024).toFixed(1);
    
    return {
      totalChars,
      yamlChars,
      contentChars,
      fileSizeKB: parseFloat(fileSizeKB)
    };
  }

  /**
   * Generate detailed report table
   */
  generateReport() {
    console.log('\n📋 Document Generation Status Report\n');

    // Sort document types for consistent display
    const sortedTypes = Array.from(new Set([
      ...DOCUMENT_TYPES,
      ...Array.from(this.totals.keys())
    ])).sort((a, b) => {
      // Custom sort: minimum, origin, then numeric
      const order = ['minimum', 'origin'];
      const aIdx = order.indexOf(a);
      const bIdx = order.indexOf(b);
      
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      
      // For numeric types, sort by number
      const aNum = parseInt(a.replace('chars', ''));
      const bNum = parseInt(b.replace('chars', ''));
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      
      return a.localeCompare(b);
    });

    // Print header
    console.log('┌─────────────────┬────────────────────────────┬────────────────────────────┐');
    console.log('│      Type       │             EN             │             KO             │');
    console.log('├─────────────────┼────────────────────────────┼────────────────────────────┤');

    for (const type of sortedTypes) {
      const enTotal = this.totals.get(type)?.get('en') || 0;
      const koTotal = this.totals.get(type)?.get('ko') || 0;
      
      const enDisplay = enTotal > 0 
        ? `${enTotal.toLocaleString()} chars (${(enTotal/1024).toFixed(1)}KB)`
        : '─';
      const koDisplay = koTotal > 0 
        ? `${koTotal.toLocaleString()} chars (${(koTotal/1024).toFixed(1)}KB)`
        : '─';

      console.log(`│ ${type.padEnd(15)} │ ${enDisplay.padEnd(26)} │ ${koDisplay.padEnd(26)} │`);
    }

    console.log('└─────────────────┴────────────────────────────┴────────────────────────────┘');
  }

  /**
   * Generate document-level breakdown
   */
  generateDocumentBreakdown() {
    console.log('\n📄 Document-Level Breakdown\n');

    const sortedDocs = Array.from(this.results.keys()).sort();
    
    for (const docName of sortedDocs) {
      console.log(`\n📖 ${docName}:`);
      console.log('┌─────────────────┬─────────────┬─────────────┐');
      console.log('│      Type       │      EN     │      KO     │');
      console.log('├─────────────────┼─────────────┼─────────────┤');

      const docTypes = this.results.get(docName);
      const sortedDocTypes = Array.from(docTypes.keys()).sort();

      for (const type of sortedDocTypes) {
        const enStats = docTypes.get(type).get('en');
        const koStats = docTypes.get(type).get('ko');

        const enDisplay = enStats 
          ? `${enStats.contentChars.toLocaleString()}`.padStart(9)
          : '─'.padStart(9);
        const koDisplay = koStats 
          ? `${koStats.contentChars.toLocaleString()}`.padStart(9)
          : '─'.padStart(9);

        console.log(`│ ${type.padEnd(15)} │ ${enDisplay}   │ ${koDisplay}   │`);
      }

      console.log('└─────────────────┴─────────────┴─────────────┘');
    }
  }

  /**
   * Generate summary statistics
   */
  generateSummary() {
    console.log('\n📊 Summary Statistics\n');

    // Count total files by language
    const enCount = Array.from(this.totals.values())
      .reduce((sum, langMap) => sum + (langMap.has('en') ? 1 : 0), 0);
    const koCount = Array.from(this.totals.values())
      .reduce((sum, langMap) => sum + (langMap.has('ko') ? 1 : 0), 0);

    // Calculate total characters by language
    const enTotalChars = Array.from(this.totals.values())
      .reduce((sum, langMap) => sum + (langMap.get('en') || 0), 0);
    const koTotalChars = Array.from(this.totals.values())
      .reduce((sum, langMap) => sum + (langMap.get('ko') || 0), 0);

    console.log(`📁 Total Files Generated:`);
    console.log(`   • EN: ${enCount} files`);
    console.log(`   • KO: ${koCount} files`);
    console.log(`   • Total: ${enCount + koCount} files`);

    console.log(`\n📝 Total Content Generated:`);
    console.log(`   • EN: ${enTotalChars.toLocaleString()} characters (${(enTotalChars/1024).toFixed(1)}KB)`);
    console.log(`   • KO: ${koTotalChars.toLocaleString()} characters (${(koTotalChars/1024).toFixed(1)}KB)`);
    console.log(`   • Total: ${(enTotalChars + koTotalChars).toLocaleString()} characters (${((enTotalChars + koTotalChars)/1024).toFixed(1)}KB)`);

    // Type coverage analysis
    console.log(`\n📋 Type Coverage:`);
    const allTypes = new Set();
    this.totals.forEach((langMap, type) => allTypes.add(type));
    
    for (const type of Array.from(allTypes).sort()) {
      const enExists = this.totals.get(type)?.has('en') ? '✅' : '❌';
      const koExists = this.totals.get(type)?.has('ko') ? '✅' : '❌';
      console.log(`   • ${type.padEnd(10)}: EN ${enExists} KO ${koExists}`);
    }
  }

  /**
   * Generate completion recommendations
   */
  generateRecommendations() {
    console.log('\n🎯 Completion Recommendations\n');

    // Find missing combinations
    const missingCombinations = [];
    const allTypes = new Set();
    this.totals.forEach((langMap, type) => allTypes.add(type));

    for (const type of allTypes) {
      const langMap = this.totals.get(type);
      if (!langMap.has('en')) {
        missingCombinations.push(`EN ${type}`);
      }
      if (!langMap.has('ko')) {
        missingCombinations.push(`KO ${type}`);
      }
    }

    if (missingCombinations.length > 0) {
      console.log('📝 Missing Documents:');
      missingCombinations.forEach(combo => {
        const [lang, type] = combo.split(' ');
        const command = lang === 'EN' 
          ? `pnpm docs:llms:${type}` 
          : `pnpm docs:llms:${type}:ko`;
        console.log(`   • ${combo.padEnd(15)} → ${command}`);
      });
    } else {
      console.log('🎉 All type-language combinations are complete!');
    }

    // Suggest next steps
    console.log('\n💡 Next Steps:');
    console.log('   1. Generate character-limited content: pnpm docs:llms:chars 5000');
    console.log('   2. Implement adaptive composition algorithm');
    console.log('   3. Add automated quality validation');
  }

  /**
   * Run complete analysis
   */
  async run() {
    try {
      this.scanGeneratedDocuments();
      this.generateReport();
      this.generateDocumentBreakdown();
      this.generateSummary();
      this.generateRecommendations();
      
      console.log('\n✅ Analysis complete!\n');
    } catch (error) {
      console.error('\n❌ Analysis failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  const analyzer = new LLMGenerationAnalyzer();
  await analyzer.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default LLMGenerationAnalyzer;