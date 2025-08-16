#!/usr/bin/env node

/**
 * Integrated CLI for Enhanced LLMS-Generator with TXT Template System
 * Complete command-line interface for config-based automatic generation
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const COMMANDS = {
  GENERATE: 'generate',
  CONVERT: 'convert',
  UPDATE: 'update', 
  PROCESS: 'process',
  VALIDATE: 'validate',
  HELP: 'help'
};

class IntegratedCLI {
  constructor() {
    this.defaultConfig = {
      generation: {
        defaultCharacterLimits: [100, 200, 300, 500, 1000],
        defaultLanguages: ['ko', 'en'],
        defaultCategories: ['guide', 'api', 'tutorial'],
        outputDirectory: './generated-templates',
        templateDirectory: './templates',
        batchSize: 10,
        priorityUpdateMode: 'update-only'
      }
    };
  }

  async run(args) {
    const command = args[2] || COMMANDS.HELP;
    
    console.log('🚀 Enhanced LLMS-Generator CLI');
    console.log('='.repeat(50));
    
    try {
      switch (command) {
        case COMMANDS.GENERATE:
          await this.handleGenerate(args);
          break;
        case COMMANDS.CONVERT:
          await this.handleConvert(args);
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
   * Generate TXT templates from configuration
   */
  async handleGenerate(args) {
    console.log('🏭 Generating TXT templates...');
    
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
            `${doc.documentId}-${charLimit}.txt`
          );
          
          await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
          
          const templateContent = this.generateTxtTemplate(doc, lang, charLimit);
          await fs.promises.writeFile(outputPath, templateContent, 'utf-8');
          generatedFiles.push(outputPath);
          
          console.log(`   ✅ Generated: ${path.relative('.', outputPath)}`);
        }
      }
    }
    
    console.log(`📊 Generated ${generatedFiles.length} TXT templates`);
  }

  /**
   * Convert YAML files to TXT format
   */
  async handleConvert(args) {
    console.log('🔄 Converting YAML to TXT...');
    
    const inputPath = this.parseOption(args, '--input') || './data';
    const outputDir = this.parseOption(args, '--output') || './converted-templates';
    
    console.log(`📂 Input Directory: ${inputPath}`);
    console.log(`📁 Output Directory: ${outputDir}`);
    console.log('');
    
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    const yamlFiles = await this.findYamlFiles(inputPath);
    const convertedFiles = [];
    
    for (const yamlFile of yamlFiles) {
      try {
        const txtFile = await this.convertYamlToTxt(yamlFile, outputDir);
        convertedFiles.push(txtFile);
        console.log(`   ✅ Converted: ${path.basename(yamlFile)} → ${path.basename(txtFile)}`);
      } catch (error) {
        console.warn(`   ⚠️  Skipped ${yamlFile}: ${error.message}`);
      }
    }
    
    console.log(`📊 Converted ${convertedFiles.length}/${yamlFiles.length} files`);
  }

  /**
   * Update priorities in TXT templates
   */
  async handleUpdate(args) {
    console.log('🔄 Updating priorities...');
    
    const templatesDir = this.parseOption(args, '--input') || './generated-templates';
    const priorityFile = this.parseOption(args, '--priorities');
    
    if (!priorityFile) {
      throw new Error('--priorities file required for update command');
    }
    
    console.log(`📂 Templates Directory: ${templatesDir}`);
    console.log(`📄 Priority File: ${priorityFile}`);
    console.log('');
    
    const priorityUpdates = JSON.parse(await fs.promises.readFile(priorityFile, 'utf-8'));
    
    const txtFiles = await this.findTxtFiles(templatesDir);
    let updatedCount = 0;
    
    for (const txtFile of txtFiles) {
      try {
        const template = await this.parseTxtTemplate(txtFile);
        if (!template) continue;
        
        const updateKey = template.document_id;
        if (priorityUpdates[updateKey]) {
          const update = priorityUpdates[updateKey];
          
          template.priority_score = update.score;
          template.priority_tier = update.tier;
          template.modified_date = new Date().toISOString();
          template.needs_update = false;
          
          const updatedContent = this.formatTxtTemplate(template);
          await fs.promises.writeFile(txtFile, updatedContent, 'utf-8');
          updatedCount++;
          
          console.log(`   ✅ Updated ${updateKey}: score=${update.score}, tier=${update.tier}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to update ${txtFile}: ${error.message}`);
      }
    }
    
    console.log(`📊 Updated priorities in ${updatedCount} files`);
  }

  /**
   * Process TXT templates with priority filtering
   */
  async handleProcess(args) {
    console.log('🔥 Processing templates with priority filtering...');
    
    const templatesDir = this.parseOption(args, '--input') || './generated-templates';
    const outputDir = this.parseOption(args, '--output') || './processed-templates';
    const minPriority = parseInt(this.parseOption(args, '--min-priority') || '80');
    
    console.log(`📂 Input Directory: ${templatesDir}`);
    console.log(`📁 Output Directory: ${outputDir}`);
    console.log(`🎯 Minimum Priority: ${minPriority}`);
    console.log('');
    
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    const txtFiles = await this.findTxtFiles(templatesDir);
    const processedFiles = [];
    
    for (const txtFile of txtFiles) {
      try {
        const template = await this.parseTxtTemplate(txtFile);
        if (!template) continue;
        
        if (template.priority_score >= minPriority) {
          const outputPath = path.join(
            outputDir,
            `${template.document_id}-${template.character_limit}-processed.txt`
          );
          
          template.content = `[PROCESSED] ${template.content}`;
          template.modified_date = new Date().toISOString();
          template.needs_update = false;
          
          const processedContent = this.formatTxtTemplate(template);
          await fs.promises.writeFile(outputPath, processedContent, 'utf-8');
          processedFiles.push(outputPath);
          
          console.log(`   ✅ Processed ${template.document_id} (priority: ${template.priority_score})`);
        } else {
          console.log(`   ⏭️  Skipped ${template?.document_id} (priority: ${template?.priority_score} < ${minPriority})`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to process ${txtFile}: ${error.message}`);
      }
    }
    
    console.log(`📊 Processed ${processedFiles.length} files based on priority`);
  }

  /**
   * Validate TXT templates
   */
  async handleValidate(args) {
    console.log('🔍 Validating TXT templates...');
    
    const templatesDir = this.parseOption(args, '--input') || './generated-templates';
    
    console.log(`📂 Templates Directory: ${templatesDir}`);
    console.log('');
    
    const txtFiles = await this.findTxtFiles(templatesDir);
    let validCount = 0;
    let invalidCount = 0;
    
    for (const txtFile of txtFiles) {
      try {
        const template = await this.parseTxtTemplate(txtFile);
        
        if (this.validateTemplate(template)) {
          console.log(`   ✅ Valid: ${path.relative(templatesDir, txtFile)}`);
          validCount++;
        } else {
          console.log(`   ❌ Invalid: ${path.relative(templatesDir, txtFile)}`);
          invalidCount++;
        }
      } catch (error) {
        console.log(`   ❌ Parse Error: ${path.relative(templatesDir, txtFile)} - ${error.message}`);
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

  generateTxtTemplate(doc, language, characterLimit) {
    const lines = [];
    
    lines.push('# Document Information');
    lines.push(`Document Path: ${doc.sourcePath}`);
    lines.push(`Title: ${doc.title}`);
    lines.push(`Document ID: ${doc.documentId}`);
    lines.push(`Category: ${doc.category}`);
    lines.push('');
    
    lines.push('# Priority');
    lines.push(`Score: ${doc.priority.score}`);
    lines.push(`Tier: ${doc.priority.tier}`);
    lines.push('');
    
    lines.push('# Summary Configuration');
    lines.push(`Character Limit: ${characterLimit}`);
    lines.push(`Focus: 기본 개념`);
    lines.push(`Strategy: concept-first`);
    lines.push(`Language: ${language}`);
    lines.push('');
    
    lines.push('# Content');
    lines.push(`${doc.title}에 대한 ${characterLimit}자 요약입니다. 이 내용은 자동으로 생성된 템플릿입니다.`);
    lines.push('');
    
    lines.push('# Work Status');
    lines.push(`Created: ${new Date().toISOString()}`);
    lines.push(`Modified: ${new Date().toISOString()}`);
    lines.push(`Edited: No`);
    lines.push(`Needs Update: Yes`);
    
    return lines.join('\n');
  }

  async convertYamlToTxt(yamlFilePath, outputDir) {
    const yamlContent = await fs.promises.readFile(yamlFilePath, 'utf-8');
    const yamlData = YAML.parse(yamlContent);
    
    const lines = [];
    
    lines.push('# Document Information');
    lines.push(`Document Path: ${yamlData.document.path}`);
    lines.push(`Title: ${yamlData.document.title}`);
    lines.push(`Document ID: ${yamlData.document.id}`);
    lines.push(`Category: ${yamlData.document.category}`);
    lines.push('');
    
    lines.push('# Priority');
    lines.push(`Score: ${yamlData.priority.score}`);
    lines.push(`Tier: ${yamlData.priority.tier}`);
    lines.push('');
    
    lines.push('# Summary Configuration');
    lines.push(`Character Limit: ${yamlData.summary.character_limit}`);
    lines.push(`Focus: ${yamlData.summary.focus}`);
    lines.push(`Strategy: ${yamlData.summary.strategy}`);
    lines.push(`Language: ${yamlData.summary.language}`);
    lines.push('');
    
    lines.push('# Content');
    lines.push(yamlData.content.trim());
    lines.push('');
    
    lines.push('# Work Status');
    lines.push(`Created: ${yamlData.work_status.created}`);
    lines.push(`Modified: ${yamlData.work_status.modified}`);
    lines.push(`Edited: ${yamlData.work_status.edited ? 'Yes' : 'No'}`);
    lines.push(`Needs Update: ${yamlData.work_status.needs_update ? 'Yes' : 'No'}`);
    
    const txtContent = lines.join('\n');
    const txtPath = path.join(outputDir, path.basename(yamlFilePath).replace(/\.ya?ml$/, '.txt'));
    
    await fs.promises.writeFile(txtPath, txtContent, 'utf-8');
    return txtPath;
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

  async findTxtFiles(dir) {
    const txtFiles = [];
    
    const scan = async (currentDir) => {
      try {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.txt')) {
            txtFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore directory read errors
      }
    };
    
    await scan(dir);
    return txtFiles;
  }

  async parseTxtTemplate(txtFilePath) {
    const content = await fs.promises.readFile(txtFilePath, 'utf-8');
    const lines = content.split('\n');
    
    const data = {};
    let currentSection = '';
    let contentLines = [];
    let inContentSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('# ')) {
        currentSection = trimmed.substring(2);
        inContentSection = currentSection === 'Content';
        continue;
      }
      
      if (inContentSection && currentSection === 'Content') {
        if (!trimmed.startsWith('#') && trimmed) {
          contentLines.push(line);
        }
      } else if (trimmed.includes(': ')) {
        const [key, value] = trimmed.split(': ', 2);
        
        switch (key) {
          case 'Document Path':
            data.document_path = value;
            break;
          case 'Title':
            data.title = value;
            break;
          case 'Document ID':
            data.document_id = value;
            break;
          case 'Category':
            data.category = value;
            break;
          case 'Score':
            data.priority_score = parseInt(value);
            break;
          case 'Tier':
            data.priority_tier = value;
            break;
          case 'Character Limit':
            data.character_limit = parseInt(value);
            break;
          case 'Focus':
            data.focus = value;
            break;
          case 'Strategy':
            data.strategy = value;
            break;
          case 'Language':
            data.language = value;
            break;
          case 'Created':
            data.created_date = value;
            break;
          case 'Modified':
            data.modified_date = value;
            break;
          case 'Edited':
            data.is_edited = value.toLowerCase() === 'yes';
            break;
          case 'Needs Update':
            data.needs_update = value.toLowerCase() === 'yes';
            break;
        }
      }
    }
    
    data.content = contentLines.join('\n').trim();
    return data;
  }

  formatTxtTemplate(data) {
    const lines = [];
    
    lines.push('# Document Information');
    lines.push(`Document Path: ${data.document_path}`);
    lines.push(`Title: ${data.title}`);
    lines.push(`Document ID: ${data.document_id}`);
    lines.push(`Category: ${data.category}`);
    lines.push('');
    
    lines.push('# Priority');
    lines.push(`Score: ${data.priority_score}`);
    lines.push(`Tier: ${data.priority_tier}`);
    lines.push('');
    
    lines.push('# Summary Configuration');
    lines.push(`Character Limit: ${data.character_limit}`);
    lines.push(`Focus: ${data.focus}`);
    lines.push(`Strategy: ${data.strategy}`);
    lines.push(`Language: ${data.language}`);
    lines.push('');
    
    lines.push('# Content');
    lines.push(data.content);
    lines.push('');
    
    lines.push('# Work Status');
    lines.push(`Created: ${data.created_date}`);
    lines.push(`Modified: ${data.modified_date}`);
    lines.push(`Edited: ${data.is_edited ? 'Yes' : 'No'}`);
    lines.push(`Needs Update: ${data.needs_update ? 'Yes' : 'No'}`);
    
    return lines.join('\n');
  }

  validateTemplate(template) {
    const required = [
      'document_path', 'title', 'document_id', 'category',
      'priority_score', 'priority_tier', 'character_limit',
      'focus', 'strategy', 'language', 'content'
    ];
    
    return required.every(field => template[field] !== undefined && template[field] !== null);
  }

  showHelp() {
    console.log('📖 Enhanced LLMS-Generator CLI Help');
    console.log('');
    console.log('Usage: node integrated-cli.cjs <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  generate    Generate TXT templates from configuration');
    console.log('  convert     Convert YAML files to TXT format');
    console.log('  update      Update priorities in TXT templates');
    console.log('  process     Process TXT templates with priority filtering');
    console.log('  validate    Validate TXT template structure');
    console.log('  help        Show this help message');
    console.log('');
    console.log('Generate Options:');
    console.log('  --langs <lang1,lang2>         Languages (default: ko,en)');
    console.log('  --limits <100,200,300>        Character limits (default: 100,200,300,500,1000)');
    console.log('  --categories <cat1,cat2>      Categories (default: guide,api,tutorial)');
    console.log('  --output <dir>                Output directory (default: ./generated-templates)');
    console.log('');
    console.log('Convert Options:');
    console.log('  --input <dir>                 Input directory with YAML files (default: ./data)');
    console.log('  --output <dir>                Output directory (default: ./converted-templates)');
    console.log('');
    console.log('Update Options:');
    console.log('  --input <dir>                 Templates directory (default: ./generated-templates)');
    console.log('  --priorities <file.json>      Priority updates JSON file (required)');
    console.log('');
    console.log('Process Options:');
    console.log('  --input <dir>                 Templates directory (default: ./generated-templates)');
    console.log('  --output <dir>                Output directory (default: ./processed-templates)');
    console.log('  --min-priority <score>        Minimum priority score (default: 80)');
    console.log('');
    console.log('Validate Options:');
    console.log('  --input <dir>                 Templates directory (default: ./generated-templates)');
    console.log('');
    console.log('Examples:');
    console.log('  node integrated-cli.cjs generate --langs ko,en --limits 100,200,300');
    console.log('  node integrated-cli.cjs convert --input ./data --output ./converted');
    console.log('  node integrated-cli.cjs update --input ./templates --priorities priorities.json');
    console.log('  node integrated-cli.cjs process --input ./templates --min-priority 85');
    console.log('  node integrated-cli.cjs validate --input ./templates');
  }
}

// Run CLI
const cli = new IntegratedCLI();
cli.run(process.argv);