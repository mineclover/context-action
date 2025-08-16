#!/usr/bin/env node

/**
 * Data Folder CLI for Enhanced LLMS-Generator
 * Generates files based on existing priority.json structure
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const COMMANDS = {
  INIT: 'init',
  GENERATE: 'generate',
  UPDATE: 'update',
  VALIDATE: 'validate',
  STATUS: 'status',
  HELP: 'help'
};

class DataFolderCLI {
  constructor() {
    this.defaultConfig = {
      dataDirectory: './data',
      languages: ['ko', 'en'],
      characterLimits: [100, 300, 500, 1000, 2000],
      format: 'md' // or 'txt'
    };
  }

  async run(args) {
    const command = args[2] || COMMANDS.HELP;
    
    console.log('🚀 Data Folder Generator CLI');
    console.log('='.repeat(50));
    
    try {
      switch (command) {
        case COMMANDS.INIT:
          await this.handleInit(args);
          break;
        case COMMANDS.GENERATE:
          await this.handleGenerate(args);
          break;
        case COMMANDS.UPDATE:
          await this.handleUpdate(args);
          break;
        case COMMANDS.VALIDATE:
          await this.handleValidate(args);
          break;
        case COMMANDS.STATUS:
          await this.handleStatus(args);
          break;
        case COMMANDS.HELP:
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Initialize complete system: generate priority.json files first, then generate templates
   */
  async handleInit(args) {
    console.log('🚀 Initializing complete system (priority.json + templates)...');
    
    const dataDir = this.parseOption(args, '--data') || this.defaultConfig.dataDirectory;
    const languages = this.parseStringArray(args, '--langs') || this.defaultConfig.languages;
    const charLimits = this.parseNumberArray(args, '--limits') || this.defaultConfig.characterLimits;
    const format = this.parseOption(args, '--format') || this.defaultConfig.format;
    const docsDir = this.parseOption(args, '--docs') || './docs';
    
    console.log(`📊 Configuration:`);
    console.log(`   Docs Directory: ${docsDir}`);
    console.log(`   Data Directory: ${dataDir}`);
    console.log(`   Languages: ${languages.join(', ')}`);
    console.log(`   Character Limits: ${charLimits.join(', ')}`);
    console.log(`   Format: ${format}`);
    console.log('');
    
    // Step 1: Generate priority.json files using PriorityGenerator logic
    console.log('📝 Step 1: Generating priority.json files...');
    await this.generatePriorityFiles(docsDir, dataDir, languages);
    
    // Step 2: Generate template files
    console.log('\n🏭 Step 2: Generating template files...');
    await this.handleGenerate(args);
    
    console.log('\n✅ System initialization completed!');
  }

  /**
   * Generate priority.json files by discovering documents
   */
  async generatePriorityFiles(docsDir, dataDir, languages) {
    for (const language of languages) {
      const langDocsDir = path.join(docsDir, language);
      
      if (!await this.directoryExists(langDocsDir)) {
        console.warn(`⚠️  Docs directory not found: ${langDocsDir}`);
        continue;
      }
      
      console.log(`🔍 Discovering documents for language: ${language}`);
      const documents = await this.discoverDocuments(langDocsDir, language);
      console.log(`📄 Found ${documents.length} documents`);
      
      for (const document of documents) {
        try {
          const outputDir = path.join(dataDir, language, document.documentId);
          const priorityPath = path.join(outputDir, 'priority.json');
          
          // Skip if priority.json already exists
          if (await this.fileExists(priorityPath)) {
            console.log(`⏭️  Skipping ${document.documentId} (priority.json exists)`);
            continue;
          }
          
          // Create directory
          await fs.promises.mkdir(outputDir, { recursive: true });
          
          // Generate priority.json
          const priorityData = this.generatePriorityData(document);
          await fs.promises.writeFile(
            priorityPath,
            JSON.stringify(priorityData, null, 2),
            'utf-8'
          );
          
          console.log(`   ✅ Generated priority.json: ${document.documentId}`);
        } catch (error) {
          console.warn(`   ⚠️  Failed to generate priority for ${document.documentId}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Discover documents in docs directory
   */
  async discoverDocuments(docsDir, language) {
    const documents = [];
    await this.scanDocsDirectory(docsDir, language, '', documents);
    return documents.sort((a, b) => a.documentId.localeCompare(b.documentId));
  }

  /**
   * Recursively scan docs directory for markdown files
   */
  async scanDocsDirectory(dirPath, language, relativePath, results) {
    try {
      const entries = await fs.promises.readdir(dirPath);
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stats = await fs.promises.stat(fullPath);
        const currentRelativePath = relativePath ? `${relativePath}/${entry}` : entry;
        
        if (stats.isDirectory()) {
          // Skip certain directories
          if (['llms', 'assets', '.vitepress', 'node_modules'].includes(entry)) {
            continue;
          }
          
          await this.scanDocsDirectory(fullPath, language, currentRelativePath, results);
        } else if (stats.isFile() && entry.endsWith('.md') && entry !== 'index.md') {
          const sourcePath = currentRelativePath;
          const documentId = this.generateDocumentId(sourcePath);
          const category = this.extractCategory(sourcePath);
          
          results.push({
            documentId,
            sourcePath,
            fullPath,
            category,
            language,
            title: this.extractTitleFromFilename(entry),
            stats: {
              size: stats.size,
              modified: stats.mtime
            }
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error);
    }
  }

  /**
   * Generate document ID from source path
   */
  generateDocumentId(sourcePath) {
    return sourcePath
      .replace(/\.md$/, '')
      .replace(/\//g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Extract category from source path
   */
  extractCategory(sourcePath) {
    const parts = sourcePath.split('/');
    const firstPart = parts[0];
    
    const categoryMap = {
      'guide': 'guide',
      'api': 'api',
      'concept': 'concept',
      'examples': 'examples',
      'reference': 'reference',
      'llms': 'llms'
    };
    
    return categoryMap[firstPart] || 'guide';
  }

  /**
   * Extract title from filename
   */
  extractTitleFromFilename(filename) {
    return filename
      .replace(/\.md$/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate priority.json data structure based on enhanced schema
   * Only auto-populate fields that can be reliably generated, leave others empty for manual completion
   */
  generatePriorityData(document) {
    return {
      "$schema": "../../priority-schema-enhanced.json",
      
      // Auto-generated: File system information
      "document": {
        "id": document.documentId,
        "title": document.title,
        "source_path": document.sourcePath,
        "category": document.category,
        "lastModified": new Date().toISOString(),
        "wordCount": Math.round((document.stats?.size || 0) / 5), // Estimate: 5 chars per word
        "subcategory": "" // Manual: Requires content analysis
      },
      
      // Manual: Requires content analysis and priority assessment
      "priority": {
        "score": null, // Manual: Requires priority assessment
        "tier": "", // Manual: Requires priority assessment
        "rationale": "", // Manual: Requires justification
        "reviewDate": new Date().toISOString().split('T')[0],
        "autoCalculated": false
      },
      
      // Manual: Requires content understanding
      "purpose": {
        "primary_goal": "", // Manual: Requires content analysis
        "target_audience": [], // Manual: Requires content analysis
        "use_cases": [], // Manual: Requires content analysis
        "learning_objectives": [] // Manual: Requires content analysis
      },
      
      // Manual: Requires content analysis
      "keywords": {
        "primary": [], // Manual: Requires content analysis
        "technical": [], // Manual: Requires content analysis
        "patterns": [], // Manual: Requires content analysis
        "avoid": [] // Manual: Requires content analysis
      },
      
      // Partial auto-generation: Basic structure only
      "tags": {
        "primary": [], // Manual: Requires content analysis
        "secondary": [], // Manual: Requires content analysis
        "audience": [], // Manual: Requires content analysis
        "complexity": "", // Manual: Requires content analysis
        "estimatedReadingTime": this.getEstimatedReadingTime(document.stats?.size || 0), // Auto: File size based
        "lastUpdated": new Date().toISOString().split('T')[0] // Auto: Current date
      },
      
      // Manual: Requires content analysis for relationships
      "dependencies": {
        "prerequisites": [], // Manual: Requires content analysis
        "references": [], // Manual: Requires content analysis
        "followups": [], // Manual: Requires content analysis
        "conflicts": [], // Manual: Requires content analysis
        "complements": [] // Manual: Requires content analysis
      },
      
      // Template structure for manual completion
      "extraction": {
        "strategy": "", // Manual: Requires content analysis
        "character_limits": {
          "100": {
            "focus": "", // Manual: Requires content analysis
            "structure": "", // Manual: Requires content analysis
            "must_include": [], // Manual: Requires content analysis
            "avoid": [], // Manual: Requires content analysis
            "example_structure": "" // Manual: Requires content analysis
          },
          "300": {
            "focus": "", // Manual: Requires content analysis
            "structure": "", // Manual: Requires content analysis
            "must_include": [], // Manual: Requires content analysis
            "avoid": [], // Manual: Requires content analysis
            "example_structure": "" // Manual: Requires content analysis
          },
          "500": {
            "focus": "", // Manual: Requires content analysis
            "structure": "", // Manual: Requires content analysis
            "must_include": [], // Manual: Requires content analysis
            "avoid": [], // Manual: Requires content analysis
            "example_structure": "" // Manual: Requires content analysis
          }
        },
        "emphasis": {
          "must_include": [], // Manual: Requires content analysis
          "nice_to_have": [], // Manual: Requires content analysis
          "contextual_keywords": [] // Manual: Requires content analysis
        }
      },
      
      // Manual: Requires content analysis
      "quality": {
        "completeness_threshold": null, // Manual: Requires assessment
        "code_examples_required": null, // Manual: Requires content analysis
        "consistency_checks": [], // Manual: Requires content analysis
        "lastQualityCheck": "", // Manual: When quality is checked
        "qualityScore": null // Manual: Requires assessment
      },
      
      // Auto-generated: System metadata
      "metadata": {
        "created": new Date().toISOString().split('T')[0], // Auto: Current date
        "updated": new Date().toISOString().split('T')[0], // Auto: Current date
        "version": "1.0", // Auto: Initial version
        "original_size": document.stats?.size || 0, // Auto: File size
        "estimated_extraction_time": {}, // Manual: Requires content analysis
        "maintainer": "", // Manual: Assign maintainer
        "reviewCycle": "" // Manual: Determine review frequency
      },
      
      // Manual: Requires content analysis
      "tags": {
        "primary": [], // Manual: Primary classification tags (required, 1-5 items)
        "secondary": [], // Manual: Additional descriptive tags
        "audience": [], // Manual: Target audience tags
        "complexity": "", // Manual: Content complexity level (basic|intermediate|advanced|expert)
        "estimatedReadingTime": "", // Manual: Reading time estimate
        "lastUpdated": new Date().toISOString().split('T')[0] // Auto: Current date
      },
      
      // Manual: Requires relationship analysis
      "dependencies": {
        "prerequisites": [], // Manual: Documents that should be read before this one
        "references": [], // Manual: Referenced documents
        "followups": [], // Manual: Documents that should be read after this one
        "conflicts": [], // Manual: Documents that conflict with this one
        "complements": [] // Manual: Documents that complement this one
      },
      
      // Auto-generated: Work tracking
      "work_status": {
        "generated_files": {}, // Auto: Populated when files are generated
        "last_checked": new Date().toISOString(), // Auto: Current timestamp
        "automation_status": {
          "auto_tag_extraction": false, // Auto: System capability
          "auto_dependency_detection": false, // Auto: System capability
          "last_auto_update": new Date().toISOString() // Auto: Current timestamp
        }
      }
    };
  }

  /**
   * Get default priority score based on category
   */
  getDefaultPriorityScore(category) {
    const scoreMap = {
      'guide': 80,
      'api': 75,
      'concept': 50,
      'examples': 75,
      'reference': 50,
      'llms': 50
    };
    
    return scoreMap[category] || 75;
  }

  /**
   * Get default priority tier based on category
   */
  getDefaultPriorityTier(category) {
    const tierMap = {
      'guide': 'essential',
      'api': 'important',
      'concept': 'useful',
      'examples': 'important',
      'reference': 'useful',
      'llms': 'useful'
    };
    
    return tierMap[category] || 'important';
  }

  /**
   * Get default extraction strategy based on category
   */
  getDefaultStrategy(category) {
    const strategyMap = {
      'guide': 'tutorial-first',
      'api': 'api-first',
      'concept': 'concept-first',
      'examples': 'example-first',
      'reference': 'reference-first',
      'llms': 'reference-first'
    };
    
    return strategyMap[category] || 'concept-first';
  }

  /**
   * Get default tags based on category
   */
  getDefaultTags(category) {
    const tagMap = {
      'guide': ['tutorial', 'step-by-step', 'practical'],
      'api': ['reference', 'technical', 'developer'],
      'concept': ['theory', 'core', 'beginner'],
      'examples': ['code', 'sample', 'practical'],
      'reference': ['reference', 'technical'],
      'llms': ['reference', 'technical']
    };
    
    return tagMap[category] || ['beginner', 'core'];
  }

  /**
   * Get default audience tags based on category
   */
  getDefaultAudienceTags(category) {
    const audienceMap = {
      'guide': ['beginners', 'framework-users'],
      'api': ['experienced-users', 'framework-users'],
      'concept': ['beginners', 'all-users'],
      'examples': ['intermediate', 'framework-users'],
      'reference': ['experienced-users', 'experts'],
      'llms': ['all-users']
    };
    
    return audienceMap[category] || ['all-users'];
  }

  /**
   * Get default complexity based on category
   */
  getDefaultComplexity(category) {
    const complexityMap = {
      'guide': 'basic',
      'api': 'intermediate',
      'concept': 'basic',
      'examples': 'intermediate',
      'reference': 'advanced',
      'llms': 'basic'
    };
    
    return complexityMap[category] || 'basic';
  }

  /**
   * Get estimated reading time based on file size
   */
  getEstimatedReadingTime(fileSize) {
    const wordsPerMinute = 200; // Average reading speed
    const charsPerWord = 5;
    const estimatedWords = Math.round(fileSize / charsPerWord);
    const estimatedMinutes = Math.max(1, Math.round(estimatedWords / wordsPerMinute));
    
    if (estimatedMinutes < 5) {
      return '5분';
    } else if (estimatedMinutes < 15) {
      return '10-15분';
    } else if (estimatedMinutes < 30) {
      return '15-30분';
    } else {
      return '30분+';
    }
  }

  /**
   * Check if directory exists
   */
  async directoryExists(dir) {
    try {
      const stats = await fs.promises.stat(dir);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(file) {
    try {
      await fs.promises.access(file);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate files based on priority.json files
   */
  async handleGenerate(args) {
    console.log('🏭 Generating files from priority.json structure...');
    
    const languages = this.parseStringArray(args, '--langs') || this.defaultConfig.languages;
    const charLimits = this.parseNumberArray(args, '--limits') || this.defaultConfig.characterLimits;
    const dataDir = this.parseOption(args, '--data') || this.defaultConfig.dataDirectory;
    const format = this.parseOption(args, '--format') || this.defaultConfig.format;
    
    console.log(`📊 Configuration:`);
    console.log(`   Data Directory: ${dataDir}`);
    console.log(`   Languages: ${languages.join(', ')}`);
    console.log(`   Character Limits: ${charLimits.join(', ')}`);
    console.log(`   Format: ${format}`);
    console.log('');
    
    // Find all priority.json files
    const priorityFiles = await this.findPriorityFiles(dataDir, languages);
    console.log(`📄 Found ${priorityFiles.length} priority.json files`);
    
    let totalGenerated = 0;
    let totalSkipped = 0;
    
    // Process each priority file
    for (const priorityFile of priorityFiles) {
      try {
        const folderPath = path.dirname(priorityFile);
        const priorityData = JSON.parse(await fs.promises.readFile(priorityFile, 'utf-8'));
        
        if (!priorityData.document) {
          console.warn(`⚠️  Skipping invalid priority file: ${priorityFile}`);
          continue;
        }
        
        // Generate files for each character limit
        for (const charLimit of charLimits) {
          const generated = await this.generateSingleFile(
            folderPath,
            priorityData,
            charLimit,
            format
          );
          
          if (generated) {
            console.log(`   ✅ Generated: ${path.relative(dataDir, generated)}`);
            totalGenerated++;
          } else {
            totalSkipped++;
          }
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process ${priorityFile}: ${error.message}`);
      }
    }
    
    console.log(`📊 Generated ${totalGenerated} files, skipped ${totalSkipped} existing files`);
  }

  /**
   * Update work_status in priority.json files
   */
  async handleUpdate(args) {
    console.log('🔄 Updating work_status in priority.json files...');
    
    const dataDir = this.parseOption(args, '--data') || this.defaultConfig.dataDirectory;
    const languages = this.parseStringArray(args, '--langs') || this.defaultConfig.languages;
    
    const priorityFiles = await this.findPriorityFiles(dataDir, languages);
    let updatedCount = 0;
    
    for (const priorityFile of priorityFiles) {
      try {
        const folderPath = path.dirname(priorityFile);
        const priorityData = JSON.parse(await fs.promises.readFile(priorityFile, 'utf-8'));
        
        // Check existing generated files
        const files = await fs.promises.readdir(folderPath);
        const generatedFiles = files.filter(f => f.match(/\-\d+\.(md|txt)$/));
        
        if (generatedFiles.length > 0) {
          // Update work_status
          if (!priorityData.work_status) {
            priorityData.work_status = {};
          }
          if (!priorityData.work_status.generated_files) {
            priorityData.work_status.generated_files = {};
          }
          
          for (const file of generatedFiles) {
            const match = file.match(/\-(\d+)\.(md|txt)$/);
            if (match) {
              const charLimit = match[1];
              const filePath = path.join(folderPath, file);
              const stat = await fs.promises.stat(filePath);
              
              priorityData.work_status.generated_files[charLimit] = {
                path: filePath,
                created: stat.birthtime.toISOString(),
                modified: stat.mtime.toISOString(),
                edited: false,
                needs_update: false
              };
            }
          }
          
          priorityData.work_status.last_checked = new Date().toISOString();
          
          await fs.promises.writeFile(
            priorityFile,
            JSON.stringify(priorityData, null, 2),
            'utf-8'
          );
          
          console.log(`   ✅ Updated: ${path.relative(dataDir, priorityFile)}`);
          updatedCount++;
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to update ${priorityFile}: ${error.message}`);
      }
    }
    
    console.log(`📊 Updated ${updatedCount} priority.json files`);
  }

  /**
   * Validate generated files
   */
  async handleValidate(args) {
    console.log('🔍 Validating generated files...');
    
    const dataDir = this.parseOption(args, '--data') || this.defaultConfig.dataDirectory;
    const languages = this.parseStringArray(args, '--langs') || this.defaultConfig.languages;
    
    const priorityFiles = await this.findPriorityFiles(dataDir, languages);
    let validCount = 0;
    let invalidCount = 0;
    let missingCount = 0;
    
    for (const priorityFile of priorityFiles) {
      try {
        const priorityData = JSON.parse(await fs.promises.readFile(priorityFile, 'utf-8'));
        const folderPath = path.dirname(priorityFile);
        
        if (priorityData.work_status?.generated_files) {
          for (const [charLimit, fileInfo] of Object.entries(priorityData.work_status.generated_files)) {
            try {
              await fs.promises.access(fileInfo.path);
              console.log(`   ✅ Valid: ${path.relative(dataDir, fileInfo.path)}`);
              validCount++;
            } catch {
              console.log(`   ❌ Missing: ${path.relative(dataDir, fileInfo.path)}`);
              missingCount++;
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Invalid priority.json: ${path.relative(dataDir, priorityFile)}`);
        invalidCount++;
      }
    }
    
    console.log(`📊 Validation Results: ${validCount} valid, ${missingCount} missing, ${invalidCount} invalid`);
  }

  /**
   * Show generation status
   */
  async handleStatus(args) {
    console.log('📊 Generation Status Report...');
    
    const dataDir = this.parseOption(args, '--data') || this.defaultConfig.dataDirectory;
    const languages = this.parseStringArray(args, '--langs') || this.defaultConfig.languages;
    
    const priorityFiles = await this.findPriorityFiles(dataDir, languages);
    const stats = {
      total: priorityFiles.length,
      processed: 0,
      needsUpdate: 0,
      byLanguage: {},
      byCategory: {},
      byTier: {}
    };
    
    for (const priorityFile of priorityFiles) {
      try {
        const priorityData = JSON.parse(await fs.promises.readFile(priorityFile, 'utf-8'));
        const lang = priorityFile.includes('/ko/') ? 'ko' : 'en';
        
        // Language stats
        if (!stats.byLanguage[lang]) stats.byLanguage[lang] = 0;
        stats.byLanguage[lang]++;
        
        // Category stats
        const category = priorityData.document?.category || 'unknown';
        if (!stats.byCategory[category]) stats.byCategory[category] = 0;
        stats.byCategory[category]++;
        
        // Tier stats
        const tier = priorityData.priority?.tier || 'unknown';
        if (!stats.byTier[tier]) stats.byTier[tier] = 0;
        stats.byTier[tier]++;
        
        // Check if processed
        if (priorityData.work_status?.generated_files) {
          stats.processed++;
          
          // Check if needs update
          for (const fileInfo of Object.values(priorityData.work_status.generated_files)) {
            if (fileInfo.needs_update) {
              stats.needsUpdate++;
              break;
            }
          }
        }
      } catch (error) {
        // Skip invalid files
      }
    }
    
    console.log('');
    console.log('📈 Overall Statistics:');
    console.log(`   Total Documents: ${stats.total}`);
    console.log(`   Processed: ${stats.processed} (${Math.round(stats.processed/stats.total*100)}%)`);
    console.log(`   Needs Update: ${stats.needsUpdate}`);
    console.log('');
    console.log('🌐 By Language:');
    for (const [lang, count] of Object.entries(stats.byLanguage)) {
      console.log(`   ${lang}: ${count}`);
    }
    console.log('');
    console.log('📁 By Category:');
    for (const [category, count] of Object.entries(stats.byCategory)) {
      console.log(`   ${category}: ${count}`);
    }
    console.log('');
    console.log('⭐ By Priority Tier:');
    for (const [tier, count] of Object.entries(stats.byTier)) {
      console.log(`   ${tier}: ${count}`);
    }
  }

  // Helper methods
  async generateSingleFile(folderPath, priorityData, characterLimit, format) {
    const documentId = priorityData.document.id;
    const fileName = `${documentId}-${characterLimit}.${format}`;
    const outputPath = path.join(folderPath, fileName);
    
    // Check if file already exists
    try {
      await fs.promises.access(outputPath);
      const workStatus = priorityData.work_status?.generated_files?.[characterLimit];
      if (workStatus && !workStatus.needs_update) {
        return null; // Skip if doesn't need update
      }
    } catch {
      // File doesn't exist, will create it
    }
    
    // Determine language from folder path
    const language = folderPath.includes('/ko/') ? 'ko' : 'en';
    
    // Generate content based on format
    let content;
    if (format === 'md') {
      content = this.generateMarkdownContent(priorityData, language, characterLimit);
    } else {
      content = this.generateTxtContent(priorityData, language, characterLimit);
    }
    
    await fs.promises.writeFile(outputPath, content, 'utf-8');
    return outputPath;
  }

  generateMarkdownContent(priorityData, language, characterLimit) {
    const lines = [];
    
    // Optimized frontmatter with only essential document understanding attributes
    lines.push('---');
    lines.push(`title: "${priorityData.document.title}"`);
    lines.push(`category: "${priorityData.document.category}"`);
    
    // Only include complexity if it's not empty
    const complexity = priorityData.tags?.complexity || '';
    if (complexity) {
      lines.push(`complexity: "${complexity}"`);
    }
    
    lines.push(`character_limit: ${characterLimit}`);
    
    const limitConfig = priorityData.extraction?.character_limits?.[characterLimit];
    const focus = limitConfig?.focus || '';
    const strategy = priorityData.extraction?.strategy || '';
    
    // Only include if values exist
    if (focus) {
      lines.push(`focus: "${focus}"`);
    }
    if (strategy) {
      lines.push(`strategy: "${strategy}"`);
    }
    
    // Tags for quick understanding (only if not empty)
    if (priorityData.tags?.primary && priorityData.tags.primary.length > 0) {
      lines.push(`tags:`);
      priorityData.tags.primary.forEach(tag => {
        lines.push(`  - "${tag}"`);
      });
    }
    
    // Target audience for content appropriateness (only if not empty)
    if (priorityData.tags?.audience && priorityData.tags.audience.length > 0) {
      lines.push(`audience:`);
      priorityData.tags.audience.forEach(audience => {
        lines.push(`  - "${audience}"`);
      });
    }
    
    // Estimated reading time for planning (always include as it's auto-generated)
    if (priorityData.tags?.estimatedReadingTime) {
      lines.push(`reading_time: "${priorityData.tags.estimatedReadingTime}"`);
    }
    
    // Must include items for content guidance (only if not empty)
    if (limitConfig?.must_include && limitConfig.must_include.length > 0) {
      lines.push(`must_include:`);
      limitConfig.must_include.forEach(item => {
        lines.push(`  - "${item}"`);
      });
    }
    
    // Source reference for context (always include)
    lines.push(`source: "${language}/${priorityData.document.source_path}"`);
    
    // Note for manual completion
    lines.push(`# NOTE: Complete priority.json manually for full functionality`);
    lines.push('---');
    lines.push('');
    
    // Content
    lines.push(`# ${priorityData.document.title}`);
    lines.push('');
    
    const contentTemplate = language === 'ko' 
      ? `${priorityData.document.title}에 대한 ${characterLimit}자 요약입니다. 이 내용은 자동으로 생성된 템플릿입니다.\n\n**참고**: 이 문서의 priority.json 파일을 수동으로 완성해야 정확한 메타데이터가 반영됩니다.`
      : `This is a ${characterLimit}-character summary about ${priorityData.document.title}. This content is an automatically generated template.\n\n**Note**: Complete the priority.json file manually for accurate metadata.`;
    
    lines.push(contentTemplate);
    lines.push('');
    
    return lines.join('\n');
  }

  generateTxtContent(priorityData, language, characterLimit) {
    const lines = [];
    
    lines.push('# Document Information');
    lines.push(`Document Path: ${language}/${priorityData.document.source_path}`);
    lines.push(`Title: ${priorityData.document.title}`);
    lines.push(`Document ID: ${priorityData.document.id}`);
    lines.push(`Category: ${priorityData.document.category}`);
    lines.push('');
    
    lines.push('# Priority');
    lines.push(`Score: ${priorityData.priority.score}`);
    lines.push(`Tier: ${priorityData.priority.tier}`);
    lines.push('');
    
    lines.push('# Summary Configuration');
    lines.push(`Character Limit: ${characterLimit}`);
    
    const limitConfig = priorityData.extraction?.character_limits?.[characterLimit];
    const focus = limitConfig?.focus || (language === 'ko' ? '기본 개념' : 'Core Concepts');
    
    lines.push(`Focus: ${focus}`);
    lines.push(`Strategy: ${priorityData.extraction?.strategy || 'general'}`);
    lines.push(`Language: ${language}`);
    lines.push('');
    
    lines.push('# Content');
    const contentTemplate = language === 'ko' 
      ? `${priorityData.document.title}에 대한 ${characterLimit}자 요약입니다. 이 내용은 자동으로 생성된 템플릿입니다.`
      : `This is a ${characterLimit}-character summary about ${priorityData.document.title}. This content is an automatically generated template.`;
    
    lines.push(contentTemplate);
    lines.push('');
    
    lines.push('# Work Status');
    lines.push(`Created: ${new Date().toISOString()}`);
    lines.push(`Modified: ${new Date().toISOString()}`);
    lines.push(`Edited: No`);
    lines.push(`Needs Update: Yes`);
    
    return lines.join('\n');
  }

  async findPriorityFiles(dataDir, languages) {
    const priorityFiles = [];
    
    for (const lang of languages) {
      const pattern = path.join(dataDir, lang, '**/priority.json');
      const files = glob.sync(pattern);
      priorityFiles.push(...files);
    }
    
    return priorityFiles;
  }

  parseOption(args, option) {
    const index = args.indexOf(option);
    return index >= 0 && index < args.length - 1 ? args[index + 1] : null;
  }

  parseNumberArray(args, option) {
    const value = this.parseOption(args, option);
    return value ? value.split(',').map(n => parseInt(n.trim())) : null;
  }

  parseStringArray(args, option) {
    const value = this.parseOption(args, option);
    return value ? value.split(',').map(s => s.trim()) : null;
  }

  showHelp() {
    console.log('📖 Data Folder Generator CLI Help');
    console.log('');
    console.log('Usage: node data-folder-cli.cjs <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  generate    Generate files based on priority.json structure');
    console.log('  update      Update work_status in priority.json files');
    console.log('  validate    Validate generated files against priority.json');
    console.log('  status      Show generation status report');
    console.log('  help        Show this help message');
    console.log('');
    console.log('Generate Options:');
    console.log('  --data <dir>                  Data directory (default: ./data)');
    console.log('  --langs <lang1,lang2>         Languages (default: ko,en)');
    console.log('  --limits <100,200,300>        Character limits (default: 100,300,500,1000,2000)');
    console.log('  --format <md|txt>             Output format (default: md)');
    console.log('');
    console.log('Update Options:');
    console.log('  --data <dir>                  Data directory (default: ./data)');
    console.log('  --langs <lang1,lang2>         Languages to process (default: ko,en)');
    console.log('');
    console.log('Validate Options:');
    console.log('  --data <dir>                  Data directory (default: ./data)');
    console.log('  --langs <lang1,lang2>         Languages to validate (default: ko,en)');
    console.log('');
    console.log('Status Options:');
    console.log('  --data <dir>                  Data directory (default: ./data)');
    console.log('  --langs <lang1,lang2>         Languages to report (default: ko,en)');
    console.log('');
    console.log('Examples:');
    console.log('  node data-folder-cli.cjs generate --langs ko --limits 100,200,300');
    console.log('  node data-folder-cli.cjs update --data ./data');
    console.log('  node data-folder-cli.cjs validate --langs ko,en');
    console.log('  node data-folder-cli.cjs status');
  }
}

// Run CLI
const cli = new DataFolderCLI();
cli.run(process.argv);