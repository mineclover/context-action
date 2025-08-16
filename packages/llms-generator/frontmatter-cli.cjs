#!/usr/bin/env node

/**
 * Markdown with Frontmatter CLI for Enhanced LLMS-Generator
 * Generates Markdown files with YAML frontmatter
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const COMMANDS = {
  GENERATE: 'generate',
  UPDATE: 'update', 
  PROCESS: 'process',
  VALIDATE: 'validate',
  HELP: 'help'
};

class FrontmatterCLI {
  constructor() {
    this.defaultConfig = {
      generation: {
        defaultCharacterLimits: [100, 200, 300, 500, 1000],
        defaultLanguages: ['ko', 'en'],
        defaultCategories: ['guide', 'api', 'tutorial'],
        outputDirectory: './md-templates',
        templateDirectory: './templates',
        batchSize: 10,
        priorityUpdateMode: 'update-only'
      }
    };
  }

  async run(args) {
    const command = args[2] || COMMANDS.HELP;
    
    console.log('🚀 Markdown with Frontmatter Generator CLI');
    console.log('='.repeat(50));
    
    try {
      switch (command) {
        case COMMANDS.GENERATE:
          await this.handleGenerate(args);
          break;
        case COMMANDS.UPDATE:
          await this.handleUpdate(args);
          break;
        case COMMANDS.PROCESS:
          await this.handleProcess(args);
          break;
        case COMMANDS.VALIDATE:
          await this.handleValidate(args);
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
   * Generate Markdown templates with frontmatter
   */
  async handleGenerate(args) {
    console.log('🏭 Generating Markdown files with frontmatter...');
    
    const languages = this.parseStringArray(args, '--langs') || this.defaultConfig.generation.defaultLanguages;
    const charLimits = this.parseNumberArray(args, '--limits') || this.defaultConfig.generation.defaultCharacterLimits;
    const categories = this.parseStringArray(args, '--categories') || this.defaultConfig.generation.defaultCategories;
    const outputDir = this.parseOption(args, '--output') || this.defaultConfig.generation.outputDirectory;
    
    console.log(`📊 Configuration:`);
    console.log(`   Languages: ${languages.join(', ')}`);
    console.log(`   Character Limits: ${charLimits.join(', ')}`);
    console.log(`   Categories: ${categories.join(', ')}`);
    console.log(`   Output Directory: ${outputDir}`);
    console.log('');
    
    const sampleDocs = await this.getSampleDocuments();
    const generatedFiles = [];
    
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    for (const lang of languages) {
      for (const doc of sampleDocs) {
        for (const charLimit of charLimits) {
          const outputPath = path.join(
            outputDir,
            lang,
            doc.category,
            `${doc.documentId}-${charLimit}.md`
          );
          
          await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
          
          const markdownContent = this.generateMarkdownWithFrontmatter(doc, lang, charLimit);
          await fs.promises.writeFile(outputPath, markdownContent, 'utf-8');
          generatedFiles.push(outputPath);
          
          console.log(`   ✅ Generated: ${path.relative('.', outputPath)}`);
        }
      }
    }
    
    console.log(`📊 Generated ${generatedFiles.length} Markdown files with frontmatter`);
  }

  /**
   * Update priorities in Markdown files
   */
  async handleUpdate(args) {
    console.log('🔄 Updating priorities...');
    
    const templatesDir = this.parseOption(args, '--input') || './md-templates';
    const priorityFile = this.parseOption(args, '--priorities');
    
    if (!priorityFile) {
      throw new Error('--priorities file required for update command');
    }
    
    console.log(`📂 Templates Directory: ${templatesDir}`);
    console.log(`📄 Priority File: ${priorityFile}`);
    console.log('');
    
    const priorityUpdates = JSON.parse(await fs.promises.readFile(priorityFile, 'utf-8'));
    
    const mdFiles = await this.findMarkdownFiles(templatesDir);
    let updatedCount = 0;
    
    for (const mdFile of mdFiles) {
      try {
        const { frontmatter, content } = await this.parseMarkdownWithFrontmatter(mdFile);
        if (!frontmatter) continue;
        
        const updateKey = frontmatter.document.id;
        if (priorityUpdates[updateKey]) {
          const update = priorityUpdates[updateKey];
          
          frontmatter.priority.score = update.score;
          frontmatter.priority.tier = update.tier;
          frontmatter.work_status.modified = new Date().toISOString();
          frontmatter.work_status.needs_update = false;
          
          const updatedContent = this.formatAsMarkdownWithFrontmatter(frontmatter, content);
          await fs.promises.writeFile(mdFile, updatedContent, 'utf-8');
          updatedCount++;
          
          console.log(`   ✅ Updated ${updateKey}: score=${update.score}, tier=${update.tier}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to update ${mdFile}: ${error.message}`);
      }
    }
    
    console.log(`📊 Updated priorities in ${updatedCount} files`);
  }

  /**
   * Process Markdown templates with priority filtering
   */
  async handleProcess(args) {
    console.log('🔥 Processing templates with priority filtering...');
    
    const templatesDir = this.parseOption(args, '--input') || './md-templates';
    const outputDir = this.parseOption(args, '--output') || './processed-md';
    const minPriority = parseInt(this.parseOption(args, '--min-priority') || '80');
    
    console.log(`📂 Input Directory: ${templatesDir}`);
    console.log(`📁 Output Directory: ${outputDir}`);
    console.log(`🎯 Minimum Priority: ${minPriority}`);
    console.log('');
    
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    const mdFiles = await this.findMarkdownFiles(templatesDir);
    const processedFiles = [];
    
    for (const mdFile of mdFiles) {
      try {
        const { frontmatter, content } = await this.parseMarkdownWithFrontmatter(mdFile);
        if (!frontmatter) continue;
        
        if (frontmatter.priority.score >= minPriority) {
          const outputPath = path.join(
            outputDir,
            `${frontmatter.document.id}-${frontmatter.summary.character_limit}-processed.md`
          );
          
          const processedContent = `[PROCESSED] ${content}`;
          frontmatter.work_status.modified = new Date().toISOString();
          frontmatter.work_status.needs_update = false;
          
          const processedMarkdown = this.formatAsMarkdownWithFrontmatter(frontmatter, processedContent);
          await fs.promises.writeFile(outputPath, processedMarkdown, 'utf-8');
          processedFiles.push(outputPath);
          
          console.log(`   ✅ Processed ${frontmatter.document.id} (priority: ${frontmatter.priority.score})`);
        } else {
          console.log(`   ⏭️  Skipped ${frontmatter?.document.id} (priority: ${frontmatter?.priority.score} < ${minPriority})`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to process ${mdFile}: ${error.message}`);
      }
    }
    
    console.log(`📊 Processed ${processedFiles.length} files based on priority`);
  }

  /**
   * Validate Markdown templates
   */
  async handleValidate(args) {
    console.log('🔍 Validating Markdown templates with frontmatter...');
    
    const templatesDir = this.parseOption(args, '--input') || './md-templates';
    
    console.log(`📂 Templates Directory: ${templatesDir}`);
    console.log('');
    
    const mdFiles = await this.findMarkdownFiles(templatesDir);
    let validCount = 0;
    let invalidCount = 0;
    
    for (const mdFile of mdFiles) {
      try {
        const { frontmatter } = await this.parseMarkdownWithFrontmatter(mdFile);
        
        if (this.validateTemplate(frontmatter)) {
          console.log(`   ✅ Valid: ${path.relative(templatesDir, mdFile)}`);
          validCount++;
        } else {
          console.log(`   ❌ Invalid: ${path.relative(templatesDir, mdFile)}`);
          invalidCount++;
        }
      } catch (error) {
        console.log(`   ❌ Parse Error: ${path.relative(templatesDir, mdFile)} - ${error.message}`);
        invalidCount++;
      }
    }
    
    console.log(`📊 Validation Results: ${validCount} valid, ${invalidCount} invalid`);
    
    if (invalidCount > 0) {
      process.exit(1);
    }
  }

  // Helper methods
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

  async getSampleDocuments() {
    return [
      {
        documentId: 'guide-action-handlers',
        title: {
          ko: '액션 핸들러',
          en: 'Action Handlers'
        },
        category: 'guide',
        priority: { score: 90, tier: 'essential' }
      },
      {
        documentId: 'guide-store-integration',
        title: {
          ko: '스토어 통합',
          en: 'Store Integration'
        },
        category: 'guide',
        priority: { score: 85, tier: 'important' }
      },
      {
        documentId: 'api-action-context',
        title: {
          ko: '액션 컨텍스트 API',
          en: 'Action Context API'
        },
        category: 'api',
        priority: { score: 80, tier: 'useful' }
      }
    ];
  }

  generateMarkdownWithFrontmatter(doc, language, characterLimit) {
    const lines = [];
    
    // Get language-specific values
    const title = doc.title[language] || doc.title.ko;
    const sourcePath = `${language}/${doc.category}/${doc.documentId}.md`;
    const focus = language === 'ko' ? '기본 개념' : 'Core Concepts';
    const contentTemplate = language === 'ko' 
      ? `${title}에 대한 ${characterLimit}자 요약입니다. 이 내용은 자동으로 생성된 템플릿입니다.`
      : `This is a ${characterLimit}-character summary about ${title}. This content is an automatically generated template.`;
    
    // Start frontmatter
    lines.push('---');
    
    // Document section
    lines.push('document:');
    lines.push(`  path: "${sourcePath}"`);
    lines.push(`  title: "${title}"`);
    lines.push(`  id: "${doc.documentId}"`);
    lines.push(`  category: "${doc.category}"`);
    
    // Priority section
    lines.push('priority:');
    lines.push(`  score: ${doc.priority.score}`);
    lines.push(`  tier: "${doc.priority.tier}"`);
    
    // Summary section
    lines.push('summary:');
    lines.push(`  character_limit: ${characterLimit}`);
    lines.push(`  focus: "${focus}"`);
    lines.push(`  strategy: "concept-first"`);
    lines.push(`  language: "${language}"`);
    
    // Work status section
    lines.push('work_status:');
    lines.push(`  created: "${new Date().toISOString()}"`);
    lines.push(`  modified: "${new Date().toISOString()}"`);
    lines.push(`  edited: false`);
    lines.push(`  needs_update: true`);
    
    // End frontmatter
    lines.push('---');
    lines.push('');
    
    // Add markdown content
    lines.push(`# ${title}`);
    lines.push('');
    lines.push(contentTemplate);
    lines.push('');
    
    return lines.join('\n');
  }

  formatAsMarkdownWithFrontmatter(frontmatter, content) {
    const lines = [];
    
    // Start frontmatter
    lines.push('---');
    
    // Document section
    lines.push('document:');
    lines.push(`  path: "${frontmatter.document.path}"`);
    lines.push(`  title: "${frontmatter.document.title}"`);
    lines.push(`  id: "${frontmatter.document.id}"`);
    lines.push(`  category: "${frontmatter.document.category}"`);
    
    // Priority section
    lines.push('priority:');
    lines.push(`  score: ${frontmatter.priority.score}`);
    lines.push(`  tier: "${frontmatter.priority.tier}"`);
    
    // Summary section
    lines.push('summary:');
    lines.push(`  character_limit: ${frontmatter.summary.character_limit}`);
    lines.push(`  focus: "${frontmatter.summary.focus}"`);
    lines.push(`  strategy: "${frontmatter.summary.strategy}"`);
    lines.push(`  language: "${frontmatter.summary.language}"`);
    
    // Work status section
    lines.push('work_status:');
    lines.push(`  created: "${frontmatter.work_status.created}"`);
    lines.push(`  modified: "${frontmatter.work_status.modified}"`);
    lines.push(`  edited: ${frontmatter.work_status.edited}`);
    lines.push(`  needs_update: ${frontmatter.work_status.needs_update}`);
    
    // End frontmatter
    lines.push('---');
    lines.push('');
    
    // Add markdown content
    lines.push(`# ${frontmatter.document.title}`);
    lines.push('');
    lines.push(content);
    lines.push('');
    
    return lines.join('\n');
  }

  async parseMarkdownWithFrontmatter(filePath) {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    
    // Extract frontmatter
    const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
    
    if (!frontmatterMatch) {
      return { frontmatter: null, content: fileContent };
    }
    
    const frontmatter = YAML.parse(frontmatterMatch[1]);
    const content = frontmatterMatch[2].replace(/^# .*\n\n/, '').trim();
    
    return { frontmatter, content };
  }

  async findMarkdownFiles(dir) {
    const mdFiles = [];
    
    const scan = async (currentDir) => {
      try {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            mdFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore directory read errors
      }
    };
    
    await scan(dir);
    return mdFiles;
  }

  validateTemplate(template) {
    if (!template) return false;
    
    const required = [
      'document', 'priority', 'summary', 'work_status'
    ];
    
    return required.every(field => template[field] !== undefined && template[field] !== null);
  }

  showHelp() {
    console.log('📖 Markdown with Frontmatter Generator CLI Help');
    console.log('');
    console.log('Usage: node frontmatter-cli.cjs <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  generate    Generate Markdown files with frontmatter');
    console.log('  update      Update priorities in Markdown files');
    console.log('  process     Process Markdown templates with priority filtering');
    console.log('  validate    Validate Markdown template structure');
    console.log('  help        Show this help message');
    console.log('');
    console.log('Generate Options:');
    console.log('  --langs <lang1,lang2>         Languages (default: ko,en)');
    console.log('  --limits <100,200,300>        Character limits (default: 100,200,300,500,1000)');
    console.log('  --categories <cat1,cat2>      Categories (default: guide,api,tutorial)');
    console.log('  --output <dir>                Output directory (default: ./md-templates)');
    console.log('');
    console.log('Update Options:');
    console.log('  --input <dir>                 Templates directory (default: ./md-templates)');
    console.log('  --priorities <file.json>      Priority updates JSON file (required)');
    console.log('');
    console.log('Process Options:');
    console.log('  --input <dir>                 Templates directory (default: ./md-templates)');
    console.log('  --output <dir>                Output directory (default: ./processed-md)');
    console.log('  --min-priority <score>        Minimum priority score (default: 80)');
    console.log('');
    console.log('Validate Options:');
    console.log('  --input <dir>                 Templates directory (default: ./md-templates)');
    console.log('');
    console.log('Examples:');
    console.log('  node frontmatter-cli.cjs generate --langs ko,en --limits 100,200,300');
    console.log('  node frontmatter-cli.cjs update --input ./md-templates --priorities priorities.json');
    console.log('  node frontmatter-cli.cjs process --input ./md-templates --min-priority 85');
    console.log('  node frontmatter-cli.cjs validate --input ./md-templates');
  }
}

// Run CLI
const cli = new FrontmatterCLI();
cli.run(process.argv);