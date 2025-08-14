#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRIORITY_CONFIG_PATH = path.join(__dirname, '../docs/llm-content/priority.json');
const LLM_CONTENT_PATH = path.join(__dirname, '../docs/llm-content');

/**
 * Priority 메타데이터 관리 도구
 * - priority.json 기반으로 YAML 메타데이터 일괄 업데이트
 * - 작업 우선순위 확인 및 필터링
 * - 진행률 추적 및 상태 관리
 */

class PriorityMetadataManager {
  constructor() {
    this.priorityConfig = this.loadPriorityConfig();
    this.documentPriorities = this.buildDocumentPriorityMap();
  }

  loadPriorityConfig() {
    if (!fs.existsSync(PRIORITY_CONFIG_PATH)) {
      throw new Error(`Priority config not found: ${PRIORITY_CONFIG_PATH}`);
    }
    return JSON.parse(fs.readFileSync(PRIORITY_CONFIG_PATH, 'utf8'));
  }

  buildDocumentPriorityMap() {
    const priorityMap = {};
    const matrix = this.priorityConfig.priority_matrix;

    Object.entries(matrix).forEach(([tier, config]) => {
      const [minScore, maxScore] = config.score_range.split('-').map(Number);
      const baseScore = Math.floor((minScore + maxScore) / 2);

      config.documents.forEach(docId => {
        priorityMap[docId] = {
          tier,
          base_score: baseScore,
          description: config.description
        };
      });
    });

    return priorityMap;
  }

  calculateFilePriority(documentId, fileType) {
    const docPriority = this.documentPriorities[documentId];
    if (!docPriority) {
      console.warn(`⚠️ Unknown document: ${documentId}`);
      return 50; // 기본값
    }

    const fileTypeConfig = this.priorityConfig.file_type_strategy[fileType];
    const priorityBoost = fileTypeConfig ? fileTypeConfig.priority_boost : 0;

    return Math.min(100, docPriority.base_score + priorityBoost);
  }

  getAllFiles() {
    const files = [];
    const languages = ['en', 'ko'];

    languages.forEach(lang => {
      const langDir = path.join(LLM_CONTENT_PATH, lang);
      
      if (!fs.existsSync(langDir)) {
        return;
      }

      const documentDirs = fs.readdirSync(langDir);

      documentDirs.forEach(documentDir => {
        const documentPath = path.join(langDir, documentDir);
        if (!fs.statSync(documentPath).isDirectory()) return;

        const txtFiles = fs.readdirSync(documentPath).filter(f => f.endsWith('.txt'));

        txtFiles.forEach(filename => {
          const filePath = path.join(documentPath, filename);
          const match = filename.match(/^(.+)-(\d+|minimum|origin)\.txt$/);
          
          if (match) {
            const [, documentId, fileType] = match;
            files.push({
              path: filePath,
              documentId,
              fileType,
              language: lang,
              filename
            });
          }
        });
      });
    });

    return files;
  }

  updateFileMetadata(filePath, updates) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!yamlMatch) {
      console.warn(`⚠️ No YAML metadata found: ${filePath}`);
      return false;
    }

    try {
      const metadata = yaml.load(yamlMatch[1]);
      const updatedMetadata = { ...metadata, ...updates };
      const newYamlContent = yaml.dump(updatedMetadata, { indent: 2 });
      const newContent = content.replace(/^---\\n[\\s\\S]*?\\n---/, `---\\n${newYamlContent}---`);
      
      fs.writeFileSync(filePath, newContent);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update metadata: ${filePath}`, error.message);
      return false;
    }
  }

  getFileMetadata(filePath) {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!yamlMatch) {
      return null;
    }

    try {
      return yaml.load(yamlMatch[1]);
    } catch (error) {
      console.error(`❌ Failed to parse metadata: ${filePath}`, error.message);
      return null;
    }
  }

  // 메인 커맨드들
  updateAllPriorities() {
    console.log('🔄 모든 파일의 우선순위 업데이트 중...');
    
    const files = this.getAllFiles();
    let updated = 0;
    let errors = 0;

    files.forEach(file => {
      const priority = this.calculateFilePriority(file.documentId, file.fileType);
      const docInfo = this.documentPriorities[file.documentId];
      
      const updates = {
        priority,
        tier: docInfo?.tier || 'unknown',
        updated: new Date().toISOString().split('T')[0]
      };

      if (this.updateFileMetadata(file.path, updates)) {
        updated++;
      } else {
        errors++;
      }
    });

    console.log(`✅ ${updated}개 파일 업데이트 완료`);
    if (errors > 0) {
      console.log(`❌ ${errors}개 파일 업데이트 실패`);
    }
  }

  showPriorityReport() {
    console.log('\\n📊 우선순위 보고서\\n');
    
    const files = this.getAllFiles();
    const stats = {
      byTier: {},
      byFileType: {},
      byStatus: {},
      byLanguage: { en: 0, ko: 0 }
    };

    files.forEach(file => {
      const metadata = this.getFileMetadata(file.path);
      if (!metadata) return;

      // Tier별 통계
      const tier = metadata.tier || 'unknown';
      stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;

      // 파일 타입별 통계  
      stats.byFileType[file.fileType] = (stats.byFileType[file.fileType] || 0) + 1;

      // 상태별 통계
      const status = metadata.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // 언어별 통계
      stats.byLanguage[file.language]++;
    });

    // Tier별 출력
    console.log('🎯 Tier별 파일 수:');
    Object.entries(stats.byTier).forEach(([tier, count]) => {
      const config = Object.values(this.priorityConfig.priority_matrix).find(c => 
        Object.keys(this.priorityConfig.priority_matrix).includes(tier)
      );
      const description = config ? config.description : '알 수 없음';
      console.log(`  ${tier}: ${count}개 (${description})`);
    });

    // 파일 타입별 출력  
    console.log('\\n📝 파일 타입별:');
    Object.entries(stats.byFileType).forEach(([type, count]) => {
      const config = this.priorityConfig.file_type_strategy[type];
      const priority = config ? `+${config.priority_boost}점` : '';
      console.log(`  ${type}: ${count}개 ${priority}`);
    });

    // 상태별 출력
    console.log('\\n🚦 상태별:');
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      const emoji = {
        placeholder: '⏳',
        draft: '📝',
        review: '👀', 
        complete: '✅'
      }[status] || '❓';
      console.log(`  ${emoji} ${status}: ${count}개`);
    });

    console.log(`\\n🌐 언어별: 영어 ${stats.byLanguage.en}개, 한국어 ${stats.byLanguage.ko}개`);
    console.log(`📈 총 파일 수: ${files.length}개`);
  }

  getWorkList(phase) {
    console.log(`\\n📋 ${phase || 'phase_1'} 작업 목록\\n`);
    
    const phaseConfig = this.priorityConfig.work_phases[phase || 'phase_1'];
    if (!phaseConfig) {
      console.error('❌ 잘못된 phase입니다.');
      return;
    }

    console.log(`🎯 목표: ${phaseConfig.target}`);
    console.log(`⏱️  기간: ${phaseConfig.duration}`);
    console.log(`📊 예상 파일 수: ${phaseConfig.file_count}\\n`);

    const files = this.getAllFiles();
    const workList = [];

    files.forEach(file => {
      const metadata = this.getFileMetadata(file.path);
      if (!metadata) return;

      const priority = metadata.priority || 50;
      const fileType = file.fileType;
      
      // Phase 1: 300자 파일, 우선순위 70+ 
      let shouldInclude = false;
      if (phase === 'phase_1' || !phase) {
        shouldInclude = fileType === '300' && priority >= 70;
      } else if (phase === 'phase_2') {
        shouldInclude = fileType === '1000' && priority >= 70;
      } else if (phase === 'phase_3') {
        shouldInclude = fileType === '2000' && priority >= 80;
      }

      if (shouldInclude) {
        workList.push({
          ...file,
          priority,
          status: metadata.status,
          tier: metadata.tier
        });
      }
    });

    // 우선순위 순으로 정렬
    workList.sort((a, b) => b.priority - a.priority);

    console.log('우선순위 순 작업 목록:');
    workList.forEach((item, index) => {
      const statusEmoji = {
        placeholder: '⏳',
        draft: '📝', 
        review: '👀',
        complete: '✅'
      }[item.status] || '❓';
      
      console.log(`${index + 1}. [${item.priority}점] ${statusEmoji} ${item.documentId}-${item.fileType}.txt (${item.language})`);
    });

    console.log(`\\n총 ${workList.length}개 파일`);
    
    const incomplete = workList.filter(item => item.status === 'placeholder').length;
    const completed = workList.filter(item => item.status === 'complete').length;
    
    console.log(`⏳ 미완료: ${incomplete}개 | ✅ 완료: ${completed}개 | 🎯 진행률: ${Math.round(completed/workList.length*100)}%`);
  }

  updateStatus(documentId, fileType, language, newStatus) {
    const files = this.getAllFiles();
    const targetFile = files.find(f => 
      f.documentId === documentId && 
      f.fileType === fileType && 
      f.language === language
    );

    if (!targetFile) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${documentId}-${fileType} (${language})`);
      return;
    }

    const validStatuses = ['placeholder', 'draft', 'review', 'complete'];
    if (!validStatuses.includes(newStatus)) {
      console.error(`❌ 잘못된 상태입니다. 사용 가능: ${validStatuses.join(', ')}`);
      return;
    }

    const updates = {
      status: newStatus,
      updated: new Date().toISOString().split('T')[0]
    };

    if (this.updateFileMetadata(targetFile.path, updates)) {
      console.log(`✅ ${targetFile.filename} 상태 업데이트: ${newStatus}`);
    }
  }
}

// CLI 인터페이스
function main() {
  const manager = new PriorityMetadataManager();
  const command = process.argv[2];

  switch (command) {
    case 'update-priorities':
      manager.updateAllPriorities();
      break;
      
    case 'report':
      manager.showPriorityReport();
      break;
      
    case 'worklist':
      const phase = process.argv[3];
      manager.getWorkList(phase);
      break;
      
    case 'status':
      const [, , , documentId, fileType, language, newStatus] = process.argv;
      if (!documentId || !fileType || !language || !newStatus) {
        console.log('사용법: node manage-priority-metadata.js status <documentId> <fileType> <language> <newStatus>');
        console.log('예시: node manage-priority-metadata.js status guide-concepts 300 en draft');
        break;
      }
      manager.updateStatus(documentId, fileType, language, newStatus);
      break;
      
    default:
      console.log('Context-Action 우선순위 메타데이터 관리 도구\\n');
      console.log('사용 가능한 명령어:');
      console.log('  update-priorities  - 모든 파일의 우선순위 업데이트');
      console.log('  report            - 우선순위 및 진행률 보고서');
      console.log('  worklist [phase]  - 작업 목록 출력 (phase_1, phase_2, phase_3)');
      console.log('  status <docId> <type> <lang> <status> - 특정 파일 상태 업데이트');
      console.log('\\n예시:');
      console.log('  node manage-priority-metadata.js report');
      console.log('  node manage-priority-metadata.js worklist phase_1'); 
      console.log('  node manage-priority-metadata.js status guide-concepts 300 en draft');
  }
}

// ES module 환경에서 직접 실행 확인
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

export default PriorityMetadataManager;