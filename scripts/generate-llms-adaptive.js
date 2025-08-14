#!/usr/bin/env node

/**
 * Adaptive LLM Content Generator
 * 
 * Generates adaptive LLM integration content based on:
 * - minimum: File paths and navigation links in [title](link) format
 * - origin: Original document content (no YAML)
 * - Character limits: Actual summarized content
 * 
 * Usage:
 * node scripts/generate-llms-adaptive.js --type minimum
 * node scripts/generate-llms-adaptive.js --type origin  
 * node scripts/generate-llms-adaptive.js --chars 10000
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const LLM_CONTENT_DIR = path.join(__dirname, '../docs/llm-content');
// OUTPUT_DIR will be dynamically set based on language

class AdaptiveLLMGenerator {
  constructor() {
    this.documents = new Map();
    this.priorities = new Map();
    
    console.log('🚀 Adaptive LLM Generator initialized');
  }

  /**
   * Load all documents and their priorities
   */
  loadDocuments() {
    console.log('\n📚 Loading documents and priorities...');
    
    const languages = ['en', 'ko'];
    
    for (const lang of languages) {
      const langDir = path.join(LLM_CONTENT_DIR, lang);
      if (!fs.existsSync(langDir)) continue;
      
      const docFolders = fs.readdirSync(langDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const docFolder of docFolders) {
        const docPath = path.join(langDir, docFolder);
        const priorityFile = path.join(docPath, 'priority.json');
        
        if (fs.existsSync(priorityFile)) {
          try {
            const priority = JSON.parse(fs.readFileSync(priorityFile, 'utf-8'));
            const docId = `${lang}/${docFolder}`;
            
            this.priorities.set(docId, priority);
            this.documents.set(docId, {
              id: docFolder,
              lang,
              path: docPath,
              priority: priority.priority.score,
              tier: priority.priority.tier,
              source: priority.document.source_path,
              title: priority.document.title
            });
            
            console.log(`  ✅ Loaded: ${docId} (priority: ${priority.priority.score})`);
          } catch (error) {
            console.warn(`  ⚠️  Failed to load priority: ${docFolder}`, error.message);
          }
        }
      }
    }
    
    console.log(`📊 Loaded ${this.documents.size} documents`);
  }

  /**
   * Get sorted documents by priority
   */
  getSortedDocuments(language = 'en') {
    const docs = Array.from(this.documents.values())
      .filter(doc => doc.lang === language)
      .sort((a, b) => b.priority - a.priority);
    
    console.log(`\n📋 Sorted documents (${language}):`);
    docs.forEach(doc => {
      console.log(`  ${doc.priority}pt [${doc.tier}] ${doc.id} - ${doc.title}`);
    });
    
    return docs;
  }

  /**
   * Generate minimum type content: [title](link) format navigation
   */
  generateMinimumContent(language = 'en') {
    console.log(`\n🔗 Generating minimum content (${language})...`);
    
    const docs = this.getSortedDocuments(language);
    let content = this.generateMinimumHeader();
    
    // Group by tier
    const tierGroups = {
      critical: docs.filter(d => d.tier === 'critical'),
      essential: docs.filter(d => d.tier === 'essential'), 
      important: docs.filter(d => d.tier === 'important'),
      reference: docs.filter(d => d.tier === 'reference')
    };

    for (const [tierName, tierDocs] of Object.entries(tierGroups)) {
      if (tierDocs.length === 0) continue;
      
      content += `\n## ${this.capitalizeTier(tierName)} Documents (${tierDocs.length})\n\n`;
      
      for (const doc of tierDocs) {
        // Generate full URL from source path
        const url = this.generateFullURL(doc.source, doc.id, language);
        content += `- [${doc.title}](${url}) - Priority: ${doc.priority}\n`;
      }
    }
    
    content += this.generateMinimumFooter();
    return content;
  }

  /**
   * Generate origin type content: Original documents without YAML
   */
  generateOriginContent(language = 'en') {
    console.log(`\n📄 Generating origin content (${language})...`);
    
    const docs = this.getSortedDocuments(language);
    let content = this.generateOriginHeader();
    
    for (const doc of docs) {
      content += `\n# ${doc.title}\n\n`;
      content += `**Source**: \`${doc.source}\`  \n`;
      content += `**Priority**: ${doc.priority} (${doc.tier})  \n\n`;
      
      // Try to read original source file
      const originalContent = this.readOriginalDocument(doc.source, language);
      if (originalContent) {
        // Remove YAML frontmatter if present
        const cleanContent = this.removeYAMLFrontmatter(originalContent);
        content += cleanContent;
      } else {
        content += `*Original document not found: ${doc.source}*\n`;
      }
      
      content += '\n\n---\n\n';
    }
    
    content += this.generateOriginFooter();
    return content;
  }

  /**
   * Read original document from docs directory
   */
  readOriginalDocument(sourcePath, language = 'en') {
    if (!sourcePath) return null;
    
    const fullPath = path.join(DOCS_DIR, language, sourcePath);
    
    try {
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      console.warn(`  ⚠️  Could not read original: ${sourcePath}`);
      return null;
    }
  }

  /**
   * Remove YAML frontmatter from content
   */
  removeYAMLFrontmatter(content) {
    // Remove YAML frontmatter (--- at start to first --- or end)
    return content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  }

  /**
   * Generate character-limited content (future implementation)
   */
  generateCharacterLimitedContent(targetChars, language = 'en') {
    console.log(`\n📏 Generating ${targetChars}-character content (${language})...`);
    
    // TODO: Implement adaptive composition algorithm
    // 1. Start with 100-char summaries
    // 2. Calculate remaining characters  
    // 3. Expand by priority
    // 4. Adjust to target
    
    return `# ${targetChars}-Character Context-Action Guide\n\n*Character-limited content generation not yet implemented*\n`;
  }

  /**
   * Generate headers and footers
   */
  generateMinimumHeader() {
    return `# Context-Action Framework - Document Navigation

Generated: ${new Date().toISOString().split('T')[0]}
Type: Minimum (Navigation Links)

This document provides quick navigation links to all Context-Action framework documentation, organized by priority tiers.

`;
  }

  generateMinimumFooter() {
    return `

## Usage Notes

- **Critical**: Essential documents for understanding the framework
- **Essential**: Important guides and API references  
- **Important**: Valuable reference material
- **Reference**: Advanced and supplementary content

## Quick Start Path

For first-time users, follow this recommended reading order:
1. Core Concepts (Critical)
2. Getting Started (Critical)  
3. Pattern Guide (Essential)
4. API Reference (Essential)

---

*Generated automatically from llm-content structure*
`;
  }

  generateOriginHeader() {
    return `# Context-Action Framework - Complete Documentation

Generated: ${new Date().toISOString().split('T')[0]}
Type: Origin (Full Documents)

This document contains the complete original content of all Context-Action framework documentation files, organized by priority.

---

`;
  }

  generateOriginFooter() {
    return `

---

## Document Collection Summary

This collection includes all original documentation content from the Context-Action framework, preserving the complete information while removing YAML metadata for clean presentation.

**Generation Date**: ${new Date().toISOString().split('T')[0]}
**Content Type**: Original Documentation  
**Processing**: YAML frontmatter removed, content preserved

*Generated automatically from source documentation files*
`;
  }

  capitalizeTier(tier) {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  /**
   * Generate full URL from source path
   */
  generateFullURL(sourcePath, docId, language) {
    const baseURL = 'https://mineclover.github.io/context-action';
    
    if (sourcePath) {
      // Remove .md extension and create URL
      const urlPath = sourcePath.replace(/\.md$/, '');
      return `${baseURL}/${language}/${urlPath}`;
    }
    
    // Fallback: generate from document ID
    // Convert document ID format: guide-concepts -> guide/concepts
    const pathSegments = docId.split('-');
    if (pathSegments.length >= 2) {
      const category = pathSegments[0];
      const name = pathSegments.slice(1).join('-');
      return `${baseURL}/${language}/${category}/${name}`;
    }
    
    // Final fallback
    return `${baseURL}/${language}/${docId}`;
  }

  /**
   * Write content to output file
   */
  writeOutput(content, filename, language = 'en') {
    // Create language-specific output directory
    const outputDir = path.join(DOCS_DIR, language, 'llms');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, content, 'utf-8');
    
    const sizeKB = (content.length / 1024).toFixed(1);
    console.log(`\n✅ Generated: ${outputPath}`);
    console.log(`📊 Size: ${sizeKB}KB (${content.length} characters)`);
    
    return outputPath;
  }

  /**
   * Main generation method
   */
  async generate(options = {}) {
    const { type = 'minimum', chars = null, language = 'en' } = options;
    
    this.loadDocuments();
    
    let content;
    let filename;
    
    switch (type) {
      case 'minimum':
        content = this.generateMinimumContent(language);
        filename = `llms-minimum-${language}.txt`;
        break;
        
      case 'origin':
        content = this.generateOriginContent(language);
        filename = `llms-origin-${language}.txt`;
        break;
        
      case 'chars':
        if (!chars) {
          throw new Error('Character count required for "chars" type');
        }
        content = this.generateCharacterLimitedContent(chars, language);
        filename = `llms-${chars}chars-${language}.txt`;
        break;
        
      default:
        throw new Error(`Unknown type: ${type}`);
    }
    
    return this.writeOutput(content, filename, language);
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--type' && i + 1 < args.length) {
      options.type = args[i + 1];
      i++;
    } else if (arg === '--chars' && i + 1 < args.length) {
      options.type = 'chars';
      options.chars = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--lang' && i + 1 < args.length) {
      options.language = args[i + 1];
      i++;
    }
  }
  
  // Default to minimum type
  if (!options.type) {
    options.type = 'minimum';
  }
  
  try {
    const generator = new AdaptiveLLMGenerator();
    const outputPath = await generator.generate(options);
    
    console.log(`\n🎉 Successfully generated LLM content: ${outputPath}`);
  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default AdaptiveLLMGenerator;