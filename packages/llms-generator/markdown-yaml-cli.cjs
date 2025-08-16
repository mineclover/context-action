#!/usr/bin/env node

/**
 * Markdown-in-YAML CLI for Enhanced LLMS-Generator
 * Generates templates in YAML format with markdown content blocks
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

class MarkdownYamlCLI {
  constructor() {
    this.defaultConfig = {
      generation: {
        defaultCharacterLimits: [100, 200, 300, 500, 1000],
        defaultLanguages: ['ko', 'en'],
        defaultCategories: ['guide', 'api', 'tutorial'],
        outputDirectory: './yaml-templates',
        templateDirectory: './templates',
        batchSize: 10,
        priorityUpdateMode: 'update-only'
      }
    };
  }

  async run(args) {
    const command = args[2] || COMMANDS.HELP;
    
    console.log('🚀 Markdown-in-YAML Generator CLI');
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
   * Generate YAML templates with markdown content
   */
  async handleGenerate(args) {
    console.log('🏭 Generating Markdown-in-YAML templates...');
    
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
            `${doc.documentId}-${charLimit}.yaml`
          );
          
          await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
          
          const templateContent = this.generateMarkdownYamlTemplate(doc, lang, charLimit);
          await fs.promises.writeFile(outputPath, templateContent, 'utf-8');
          generatedFiles.push(outputPath);
          
          console.log(`   ✅ Generated: ${path.relative('.', outputPath)}`);
        }
      }
    }
    
    console.log(`📊 Generated ${generatedFiles.length} Markdown-in-YAML templates`);
  }

  /**
   * Update priorities in YAML templates
   */
  async handleUpdate(args) {
    console.log('🔄 Updating priorities...');
    
    const templatesDir = this.parseOption(args, '--input') || './yaml-templates';
    const priorityFile = this.parseOption(args, '--priorities');
    
    if (!priorityFile) {
      throw new Error('--priorities file required for update command');
    }
    
    console.log(`📂 Templates Directory: ${templatesDir}`);
    console.log(`📄 Priority File: ${priorityFile}`);
    console.log('');
    
    const priorityUpdates = JSON.parse(await fs.promises.readFile(priorityFile, 'utf-8'));
    
    const yamlFiles = await this.findYamlFiles(templatesDir);
    let updatedCount = 0;
    
    for (const yamlFile of yamlFiles) {
      try {
        const content = await fs.promises.readFile(yamlFile, 'utf-8');
        const template = YAML.parse(content);
        
        const updateKey = template.document.id;
        if (priorityUpdates[updateKey]) {
          const update = priorityUpdates[updateKey];
          
          template.priority.score = update.score;
          template.priority.tier = update.tier;
          template.work_status.modified = new Date().toISOString();
          template.work_status.needs_update = false;
          
          const updatedContent = YAML.stringify(template);
          await fs.promises.writeFile(yamlFile, updatedContent, 'utf-8');
          updatedCount++;
          
          console.log(`   ✅ Updated ${updateKey}: score=${update.score}, tier=${update.tier}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to update ${yamlFile}: ${error.message}`);
      }
    }
    
    console.log(`📊 Updated priorities in ${updatedCount} files`);
  }

  /**
   * Process YAML templates with priority filtering
   */
  async handleProcess(args) {
    console.log('🔥 Processing templates with priority filtering...');
    
    const templatesDir = this.parseOption(args, '--input') || './yaml-templates';
    const outputDir = this.parseOption(args, '--output') || './processed-yaml';
    const minPriority = parseInt(this.parseOption(args, '--min-priority') || '80');
    
    console.log(`📂 Input Directory: ${templatesDir}`);
    console.log(`📁 Output Directory: ${outputDir}`);
    console.log(`🎯 Minimum Priority: ${minPriority}`);
    console.log('');
    
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    const yamlFiles = await this.findYamlFiles(templatesDir);
    const processedFiles = [];
    
    for (const yamlFile of yamlFiles) {
      try {
        const content = await fs.promises.readFile(yamlFile, 'utf-8');
        const template = YAML.parse(content);
        
        if (template.priority.score >= minPriority) {
          const outputPath = path.join(
            outputDir,
            `${template.document.id}-${template.summary.character_limit}-processed.yaml`
          );
          
          template.content = `[PROCESSED] ${template.content}`;
          template.work_status.modified = new Date().toISOString();
          template.work_status.needs_update = false;
          
          const processedContent = YAML.stringify(template);
          await fs.promises.writeFile(outputPath, processedContent, 'utf-8');
          processedFiles.push(outputPath);
          
          console.log(`   ✅ Processed ${template.document.id} (priority: ${template.priority.score})`);
        } else {
          console.log(`   ⏭️  Skipped ${template?.document.id} (priority: ${template?.priority.score} < ${minPriority})`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to process ${yamlFile}: ${error.message}`);
      }
    }
    
    console.log(`📊 Processed ${processedFiles.length} files based on priority`);
  }

  /**
   * Validate YAML templates
   */
  async handleValidate(args) {
    console.log('🔍 Validating Markdown-in-YAML templates...');
    
    const templatesDir = this.parseOption(args, '--input') || './yaml-templates';
    
    console.log(`📂 Templates Directory: ${templatesDir}`);
    console.log('');
    
    const yamlFiles = await this.findYamlFiles(templatesDir);
    let validCount = 0;
    let invalidCount = 0;
    
    for (const yamlFile of yamlFiles) {
      try {
        const content = await fs.promises.readFile(yamlFile, 'utf-8');
        const template = YAML.parse(content);
        
        if (this.validateTemplate(template)) {
          console.log(`   ✅ Valid: ${path.relative(templatesDir, yamlFile)}`);
          validCount++;
        } else {
          console.log(`   ❌ Invalid: ${path.relative(templatesDir, yamlFile)}`);
          invalidCount++;
        }
      } catch (error) {
        console.log(`   ❌ Parse Error: ${path.relative(templatesDir, yamlFile)} - ${error.message}`);
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
        title: '액션 핸들러',
        category: 'guide',
        sourcePath: 'ko/guide/action-handlers.md',
        priority: { score: 90, tier: 'essential' }
      },
      {
        documentId: 'guide-store-integration',
        title: '스토어 통합',
        category: 'guide',
        sourcePath: 'ko/guide/store-integration.md',
        priority: { score: 85, tier: 'important' }
      },
      {
        documentId: 'api-action-context',
        title: '액션 컨텍스트 API',
        category: 'api',
        sourcePath: 'ko/api/action-context.md',
        priority: { score: 80, tier: 'useful' }
      }
    ];
  }

  generateMarkdownYamlTemplate(doc, language, characterLimit) {
    const template = {
      document: {
        path: doc.sourcePath,
        title: doc.title,
        id: doc.documentId,
        category: doc.category
      },
      priority: {
        score: doc.priority.score,
        tier: doc.priority.tier
      },
      summary: {
        character_limit: characterLimit,
        focus: '기본 개념',
        strategy: 'concept-first',
        language: language
      },
      content: `${doc.title}에 대한 ${characterLimit}자 요약입니다. 이 내용은 자동으로 생성된 템플릿입니다.`,
      work_status: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        edited: false,
        needs_update: true
      }
    };

    return YAML.stringify(template);
  }

  async findYamlFiles(dir) {
    const yamlFiles = [];
    
    const scan = async (currentDir) => {
      try {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile() && /\.ya?ml$/.test(entry.name)) {
            yamlFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore directory read errors
      }
    };
    
    await scan(dir);
    return yamlFiles;
  }

  validateTemplate(template) {
    const required = [
      'document', 'priority', 'summary', 'content', 'work_status'
    ];
    
    return required.every(field => template[field] !== undefined && template[field] !== null);
  }

  showHelp() {
    console.log('📖 Markdown-in-YAML Generator CLI Help');
    console.log('');
    console.log('Usage: node markdown-yaml-cli.cjs <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  generate    Generate YAML templates with markdown content');
    console.log('  update      Update priorities in YAML templates');
    console.log('  process     Process YAML templates with priority filtering');
    console.log('  validate    Validate YAML template structure');
    console.log('  help        Show this help message');
    console.log('');
    console.log('Generate Options:');
    console.log('  --langs <lang1,lang2>         Languages (default: ko,en)');
    console.log('  --limits <100,200,300>        Character limits (default: 100,200,300,500,1000)');
    console.log('  --categories <cat1,cat2>      Categories (default: guide,api,tutorial)');
    console.log('  --output <dir>                Output directory (default: ./yaml-templates)');
    console.log('');
    console.log('Update Options:');
    console.log('  --input <dir>                 Templates directory (default: ./yaml-templates)');
    console.log('  --priorities <file.json>      Priority updates JSON file (required)');
    console.log('');
    console.log('Process Options:');
    console.log('  --input <dir>                 Templates directory (default: ./yaml-templates)');
    console.log('  --output <dir>                Output directory (default: ./processed-yaml)');
    console.log('  --min-priority <score>        Minimum priority score (default: 80)');
    console.log('');
    console.log('Validate Options:');
    console.log('  --input <dir>                 Templates directory (default: ./yaml-templates)');
    console.log('');
    console.log('Examples:');
    console.log('  node markdown-yaml-cli.cjs generate --langs ko,en --limits 100,200,300');
    console.log('  node markdown-yaml-cli.cjs update --input ./yaml-templates --priorities priorities.json');
    console.log('  node markdown-yaml-cli.cjs process --input ./yaml-templates --min-priority 85');
    console.log('  node markdown-yaml-cli.cjs validate --input ./yaml-templates');
  }
}

// Run CLI
const cli = new MarkdownYamlCLI();
cli.run(process.argv);