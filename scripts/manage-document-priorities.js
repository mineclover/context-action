#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_PATH = path.join(__dirname, '../docs/llm-content/priority-schema.json');
const LLM_CONTENT_PATH = path.join(__dirname, '../docs/llm-content');

/**
 * Document-based Priority Management System
 * - Each document folder has its own priority.json
 * - JSON Schema validation for consistency
 * - Extraction planning and progress tracking
 * - LLM-friendly structure with clear descriptions
 */

class DocumentPriorityManager {
  constructor() {
    this.schema = this.loadSchema();
    this.validator = this.setupValidator();
  }

  loadSchema() {
    if (!fs.existsSync(SCHEMA_PATH)) {
      throw new Error(`Priority schema not found: ${SCHEMA_PATH}`);
    }
    return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  }

  setupValidator() {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    return ajv.compile(this.schema);
  }

  // 모든 문서 폴더 찾기
  findDocumentFolders() {
    const folders = [];
    const languages = ['en', 'ko'];

    languages.forEach(lang => {
      const langDir = path.join(LLM_CONTENT_PATH, lang);
      
      if (!fs.existsSync(langDir)) {
        return;
      }

      fs.readdirSync(langDir).forEach(folderName => {
        const folderPath = path.join(langDir, folderName);
        if (fs.statSync(folderPath).isDirectory()) {
          folders.push({
            language: lang,
            documentId: folderName,
            path: folderPath,
            priorityPath: path.join(folderPath, 'priority.json')
          });
        }
      });
    });

    return folders;
  }

  // priority.json 파일 검증
  validatePriorityFile(priorityPath) {
    if (!fs.existsSync(priorityPath)) {
      return { valid: false, error: 'File not found' };
    }

    try {
      const data = JSON.parse(fs.readFileSync(priorityPath, 'utf8'));
      const valid = this.validator(data);
      
      if (!valid) {
        return { 
          valid: false, 
          error: 'Schema validation failed',
          details: this.validator.errors 
        };
      }

      return { valid: true, data };
    } catch (error) {
      return { 
        valid: false, 
        error: `JSON parse error: ${error.message}` 
      };
    }
  }

  // priority.json 템플릿 생성
  generatePriorityTemplate(documentFolder) {
    const { documentId, language } = documentFolder;
    
    // 카테고리 추론
    let category = 'guide';
    if (documentId.startsWith('api-')) category = 'api';
    else if (documentId.startsWith('concept-')) category = 'concept';
    else if (documentId.startsWith('example-')) category = 'example';
    else if (documentId.startsWith('llms-')) category = 'llms';

    // 기본 우선순위 점수
    let defaultScore = 50;
    if (documentId.includes('concepts') || documentId.includes('overview')) defaultScore = 100;
    else if (documentId.includes('getting-started') || documentId.includes('quick-start')) defaultScore = 95;
    else if (documentId.includes('best-practices') || documentId.includes('guide-')) defaultScore = 80;
    else if (documentId.includes('api-')) defaultScore = 75;
    else if (documentId.includes('example-')) defaultScore = 70;

    const template = {
      "$schema": "../../priority-schema.json",
      document: {
        id: documentId,
        title: this.generateTitle(documentId),
        source_path: this.inferSourcePath(documentId),
        category: category,
        subcategory: "TODO"
      },
      priority: {
        score: defaultScore,
        tier: this.scoresToTier(defaultScore),
        rationale: "TODO: Add rationale for this priority level"
      },
      purpose: {
        primary_goal: "TODO: Define the main purpose of this document",
        target_audience: ["framework-users"],
        use_cases: ["TODO: Add specific use cases"],
        dependencies: []
      },
      keywords: {
        primary: ["TODO: Add primary keywords"],
        technical: ["TODO: Add technical terms"],
        patterns: ["TODO: Add relevant patterns"],
        avoid: ["TODO: Add terms to avoid"]
      },
      extraction: {
        strategy: category === 'api' ? 'api-first' : 
                 category === 'example' ? 'example-first' : 'concept-first',
        character_limits: {
          "minimum": {
            focus: "Quick reference and navigation",
            structure: "Document links + brief description + related docs",
            must_include: ["source link", "brief purpose"],
            avoid: ["detailed explanations"]
          },
          "origin": {
            focus: "Complete original content",
            structure: "Full markdown from source file",
            must_include: ["complete original content"],
            avoid: ["modifications"]
          },
          "100": {
            focus: "TODO: Define focus for 100 chars",
            structure: "TODO: Define structure",
            must_include: ["TODO"],
            avoid: ["TODO"]
          },
          "300": {
            focus: "TODO: Define focus for 300 chars", 
            structure: "TODO: Define structure",
            must_include: ["TODO"],
            avoid: ["TODO"]
          },
          "500": {
            focus: "TODO: Define focus for 500 chars",
            structure: "TODO: Define structure",
            must_include: ["TODO"],
            avoid: ["TODO"]
          },
          "1000": {
            focus: "TODO: Define focus for 1000 chars",
            structure: "TODO: Define structure", 
            must_include: ["TODO"],
            avoid: ["TODO"]
          },
          "2000": {
            focus: "TODO: Define focus for 2000 chars",
            structure: "TODO: Define structure",
            must_include: ["TODO"],
            avoid: ["TODO"]
          },
          "3000": {
            focus: "TODO: Define focus for 3000 chars",
            structure: "TODO: Define structure",
            must_include: ["TODO"],
            avoid: ["TODO"]
          },
          "4000": {
            focus: "TODO: Define focus for 4000 chars",
            structure: "TODO: Define structure",
            must_include: ["TODO"],
            avoid: ["TODO"]
          }
        },
        emphasis: {
          must_include: ["TODO: Critical elements"],
          nice_to_have: ["TODO: Optional elements"]
        }
      },
      quality: {
        completeness_threshold: 0.8,
        code_examples_required: category === 'api' || category === 'example',
        consistency_checks: ["terminology", "pattern_usage"]
      },
      metadata: {
        created: new Date().toISOString().split('T')[0],
        version: "1.0",
        original_size: 0,
        estimated_extraction_time: {
          "300": "20 minutes",
          "1000": "45 minutes", 
          "2000": "60 minutes"
        }
      }
    };

    return template;
  }

  generateTitle(documentId) {
    return documentId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  inferSourcePath(documentId) {
    const parts = documentId.split('-');
    const category = parts[0];
    const rest = parts.slice(1).join('-');
    
    switch (category) {
      case 'guide':
        return `guide/${rest}.md`;
      case 'api':
        return `api/${rest}.md`;
      case 'concept':
        return `concept/${rest}.md`;
      case 'example':
        return `examples/${rest}.md`;
      case 'llms':
        return `llms/${rest}.md`;
      default:
        return `${documentId}.md`;
    }
  }

  scoresToTier(score) {
    if (score >= 90) return 'critical';
    if (score >= 80) return 'essential';
    if (score >= 60) return 'important';
    if (score >= 40) return 'reference';
    return 'supplementary';
  }

  // 명령어 실행 메서드들

  // 1. 전체 상태 보고서
  generateStatusReport() {
    console.log('\\n📊 Document Priority Status Report\\n');
    
    const folders = this.findDocumentFolders();
    const stats = {
      total: folders.length,
      withPriority: 0,
      valid: 0,
      invalid: 0,
      byLanguage: { en: 0, ko: 0 },
      byCategory: {},
      byTier: {},
      avgScore: 0
    };

    const validPriorities = [];
    const invalidFiles = [];

    folders.forEach(folder => {
      stats.byLanguage[folder.language]++;
      
      if (fs.existsSync(folder.priorityPath)) {
        stats.withPriority++;
        
        const validation = this.validatePriorityFile(folder.priorityPath);
        if (validation.valid) {
          stats.valid++;
          validPriorities.push(validation.data);
          
          const { category } = validation.data.document;
          const { tier, score } = validation.data.priority;
          
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
          stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
        } else {
          stats.invalid++;
          invalidFiles.push({
            path: folder.priorityPath,
            error: validation.error
          });
        }
      }
    });

    // 평균 점수 계산
    if (validPriorities.length > 0) {
      stats.avgScore = Math.round(
        validPriorities.reduce((sum, p) => sum + p.priority.score, 0) / validPriorities.length
      );
    }

    // 보고서 출력
    console.log('📁 Overall Statistics:');
    console.log(`  Total documents: ${stats.total}`);
    console.log(`  With priority.json: ${stats.withPriority} (${Math.round(stats.withPriority/stats.total*100)}%)`);
    console.log(`  Valid priority files: ${stats.valid}`);
    console.log(`  Invalid priority files: ${stats.invalid}`);
    console.log(`  Average priority score: ${stats.avgScore}/100`);

    console.log('\\n🌐 By Language:');
    Object.entries(stats.byLanguage).forEach(([lang, count]) => {
      console.log(`  ${lang}: ${count} documents`);
    });

    console.log('\\n📂 By Category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} documents`);
    });

    console.log('\\n🎯 By Priority Tier:');
    Object.entries(stats.byTier).forEach(([tier, count]) => {
      console.log(`  ${tier}: ${count} documents`);
    });

    if (invalidFiles.length > 0) {
      console.log('\\n❌ Invalid Priority Files:');
      invalidFiles.forEach(file => {
        console.log(`  ${file.path}: ${file.error}`);
      });
    }
  }

  // 2. 누락된 priority.json 파일 생성
  generateMissingPriorityFiles() {
    console.log('🔄 Generating missing priority.json files...');
    
    const folders = this.findDocumentFolders();
    let created = 0;

    folders.forEach(folder => {
      if (!fs.existsSync(folder.priorityPath)) {
        const template = this.generatePriorityTemplate(folder);
        fs.writeFileSync(folder.priorityPath, JSON.stringify(template, null, 2));
        console.log(`✅ Created: ${folder.priorityPath}`);
        created++;
      }
    });

    console.log(`\\n📊 Summary: ${created} priority.json files created`);
  }

  // 3. 스키마 검증
  validateAllPriorityFiles() {
    console.log('🔍 Validating all priority.json files...');
    
    const folders = this.findDocumentFolders();
    let valid = 0;
    let invalid = 0;

    folders.forEach(folder => {
      if (!fs.existsSync(folder.priorityPath)) {
        console.log(`⚠️  Missing: ${folder.priorityPath}`);
        return;
      }

      const validation = this.validatePriorityFile(folder.priorityPath);
      if (validation.valid) {
        valid++;
        console.log(`✅ Valid: ${folder.documentId} (${folder.language})`);
      } else {
        invalid++;
        console.log(`❌ Invalid: ${folder.documentId} (${folder.language})`);
        console.log(`   Error: ${validation.error}`);
        if (validation.details) {
          validation.details.forEach(detail => {
            console.log(`   - ${detail.instancePath || 'root'}: ${detail.message}`);
          });
        }
      }
    });

    console.log(`\\n📊 Summary: ${valid} valid, ${invalid} invalid`);
  }

  // 4. 작업 우선순위 목록
  generateWorkList(tier = null, language = 'en') {
    console.log(`\\n📋 Work Priority List${tier ? ` (${tier} tier)` : ''} - ${language.toUpperCase()}\\n`);
    
    const folders = this.findDocumentFolders()
      .filter(f => f.language === language);
    
    const workItems = [];

    folders.forEach(folder => {
      if (!fs.existsSync(folder.priorityPath)) {
        return;
      }

      const validation = this.validatePriorityFile(folder.priorityPath);
      if (!validation.valid) {
        return;
      }

      const priority = validation.data;
      
      // Tier 필터링
      if (tier && priority.priority.tier !== tier) {
        return;
      }

      workItems.push({
        documentId: folder.documentId,
        score: priority.priority.score,
        tier: priority.priority.tier,
        title: priority.document.title,
        category: priority.document.category,
        primaryGoal: priority.purpose.primary_goal,
        estimatedTime: priority.metadata.estimated_extraction_time || {},
        codeRequired: priority.quality.code_examples_required
      });
    });

    // 점수순 정렬
    workItems.sort((a, b) => b.score - a.score);

    // 출력
    workItems.forEach((item, index) => {
      const codeIcon = item.codeRequired ? '💻' : '📝';
      const timeEst = item.estimatedTime['300'] || 'N/A';
      
      console.log(`${index + 1}. [${item.score}pts] ${codeIcon} ${item.title}`);
      console.log(`   ID: ${item.documentId} | Category: ${item.category} | Tier: ${item.tier}`);
      console.log(`   Goal: ${item.primaryGoal}`);
      console.log(`   Est. Time (300 chars): ${timeEst}\\n`);
    });

    console.log(`Total: ${workItems.length} documents`);
    
    // Tier별 통계
    const tierStats = {};
    workItems.forEach(item => {
      tierStats[item.tier] = (tierStats[item.tier] || 0) + 1;
    });
    
    console.log('\\nBy tier:');
    Object.entries(tierStats).forEach(([tier, count]) => {
      console.log(`  ${tier}: ${count} documents`);
    });
  }

  // 5. 특정 문서 정보 출력
  showDocumentInfo(documentId, language = 'en') {
    const folder = this.findDocumentFolders()
      .find(f => f.documentId === documentId && f.language === language);

    if (!folder) {
      console.error(`❌ Document not found: ${documentId} (${language})`);
      return;
    }

    if (!fs.existsSync(folder.priorityPath)) {
      console.error(`❌ Priority file not found: ${folder.priorityPath}`);
      return;
    }

    const validation = this.validatePriorityFile(folder.priorityPath);
    if (!validation.valid) {
      console.error(`❌ Invalid priority file: ${validation.error}`);
      return;
    }

    const priority = validation.data;

    console.log(`\\n📄 Document Information: ${priority.document.title}\\n`);
    console.log(`🆔 ID: ${priority.document.id}`);
    console.log(`📂 Category: ${priority.document.category} / ${priority.document.subcategory || 'N/A'}`);
    console.log(`📍 Source: ${priority.document.source_path}`);
    console.log(`🎯 Priority: ${priority.priority.score}/100 (${priority.priority.tier})`);
    console.log(`📝 Goal: ${priority.purpose.primary_goal}`);
    
    console.log(`\\n🎯 Target Audience: ${priority.purpose.target_audience.join(', ')}`);
    
    if (priority.purpose.dependencies.length > 0) {
      console.log(`📚 Dependencies: ${priority.purpose.dependencies.join(', ')}`);
    }

    console.log(`\\n🔑 Keywords:`);
    console.log(`  Primary: ${priority.keywords.primary.join(', ')}`);
    console.log(`  Technical: ${priority.keywords.technical.join(', ')}`);
    
    console.log(`\\n📊 Extraction Strategy: ${priority.extraction.strategy}`);
    
    console.log('\\n⏱️ Estimated Time:');
    Object.entries(priority.metadata.estimated_extraction_time || {}).forEach(([chars, time]) => {
      console.log(`  ${chars} chars: ${time}`);
    });

    console.log(`\\n📏 Quality Standards:`);
    console.log(`  Completeness: ${(priority.quality.completeness_threshold * 100).toFixed(0)}%`);
    console.log(`  Code examples required: ${priority.quality.code_examples_required ? 'Yes' : 'No'}`);
    console.log(`  Consistency checks: ${priority.quality.consistency_checks.join(', ')}`);
  }
}

// CLI Interface
function main() {
  const manager = new DocumentPriorityManager();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'status':
        manager.generateStatusReport();
        break;
        
      case 'generate':
        manager.generateMissingPriorityFiles();
        break;
        
      case 'validate':
        manager.validateAllPriorityFiles(); 
        break;
        
      case 'worklist':
        const tier = process.argv[3];
        const language = process.argv[4] || 'en';
        manager.generateWorkList(tier, language);
        break;
        
      case 'info':
        const documentId = process.argv[3];
        const lang = process.argv[4] || 'en';
        if (!documentId) {
          console.log('Usage: info <documentId> [language]');
          break;
        }
        manager.showDocumentInfo(documentId, lang);
        break;
        
      default:
        console.log('Document-based Priority Management System\\n');
        console.log('Commands:');
        console.log('  status                    - Show overall status report');
        console.log('  generate                  - Generate missing priority.json files');
        console.log('  validate                  - Validate all priority.json files'); 
        console.log('  worklist [tier] [lang]    - Show work priority list');
        console.log('  info <documentId> [lang]  - Show document details');
        console.log('\\nExamples:');
        console.log('  npm run docs:priority:status');
        console.log('  npm run docs:priority:generate');
        console.log('  npm run docs:priority:worklist critical en');
        console.log('  npm run docs:priority:info guide-concepts');
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// ES module 환경에서 직접 실행 확인
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DocumentPriorityManager;