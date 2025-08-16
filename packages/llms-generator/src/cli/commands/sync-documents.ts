/**
 * 문서 동기화 명령어 - 요약 문서와 실제 문서 간 양방향 동기화
 * 
 * Git 커밋 트리거를 통한 자동 워크플로우 구현
 */

import { Command } from 'commander';
import { EnhancedWorkStatusManager } from '../../core/EnhancedWorkStatusManager.js';
import { ConfigManager } from '../../core/ConfigManager.js';
import { EnhancedConfigManager } from '../../core/EnhancedConfigManager.js';
import { globalPerformanceMonitor } from '../../infrastructure/monitoring/PerformanceMonitor.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export interface SyncResult {
  success: boolean;
  processedFiles: string[];
  updatedFrontmatters: string[];
  errors: string[];
  summary: {
    totalProcessed: number;
    summaryDocsUpdated: number;
    sourceDosUpdated: number;
    frontmatterUpdates: number;
  };
}

export function createSyncDocumentsCommand(): Command {
  const command = new Command('sync-docs');

  command
    .description('Git 커밋 기반 문서 동기화 - 요약 문서와 실제 문서 간 양방향 동기화')
    .option('--changed-files <files>', 'Git에서 변경된 파일들 (쉼표로 구분)')
    .option('--mode <mode>', '동기화 모드 (summary-to-source|source-to-summary|both)', 'both')
    .option('--dry-run', '실제 변경 없이 분석만 수행', false)
    .option('--quiet', '간소한 출력', false)
    .action(async (options) => {
      const stopTiming = globalPerformanceMonitor.startTiming('sync-documents');

      try {
        // Enhanced config 로드
        const enhancedConfigManager = new EnhancedConfigManager();
        const enhancedConfig = await enhancedConfigManager.loadConfig();

        const result = await performDocumentSync(options, enhancedConfig);

        if (!options.quiet) {
          displaySyncResults(result);
        }

        if (!result.success) {
          process.exit(1);
        }

      } catch (error) {
        console.error('❌ 문서 동기화 중 오류가 발생했습니다:', error);
        process.exit(1);
      } finally {
        stopTiming();
      }
    });

  return command;
}

/**
 * Git에서 변경된 파일들 자동 감지
 */
export function getChangedFiles(): string[] {
  try {
    // 스테이징된 파일들
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(file => file.length > 0);

    // 최근 커밋에서 변경된 파일들
    const recentFiles = execSync('git diff HEAD~1 --name-only', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(file => file.length > 0);

    // 중복 제거하고 마크다운 파일만 필터링
    const allChangedFiles = [...new Set([...stagedFiles, ...recentFiles])]
      .filter(file => file.endsWith('.md') || file.endsWith('.txt'));

    return allChangedFiles;
  } catch (error) {
    console.warn('⚠️ Git 변경 파일 감지 실패, 빈 배열 반환');
    return [];
  }
}

/**
 * 문서 동기화 수행
 */
async function performDocumentSync(options: any, config: any): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    processedFiles: [],
    updatedFrontmatters: [],
    errors: [],
    summary: {
      totalProcessed: 0,
      summaryDocsUpdated: 0,
      sourceDosUpdated: 0,
      frontmatterUpdates: 0
    }
  };

  try {
    // 변경된 파일들 가져오기
    const changedFiles = options.changedFiles 
      ? options.changedFiles.split(',').map((f: string) => f.trim())
      : getChangedFiles();

    if (changedFiles.length === 0) {
      if (!options.quiet) {
        console.log('📄 변경된 문서가 없습니다.');
      }
      return result;
    }

    if (!options.quiet) {
      console.log(`🔄 ${changedFiles.length}개의 변경된 파일을 분석합니다...`);
      changedFiles.forEach(file => console.log(`  📝 ${file}`));
    }

    // WorkStatusManager 초기화
    const workConfig = await ConfigManager.findAndLoadConfig();
    const workStatusManager = new EnhancedWorkStatusManager(workConfig);

    for (const filePath of changedFiles) {
      try {
        result.processedFiles.push(filePath);

        // 파일 타입 판별 (요약 문서 vs 실제 문서)
        const fileType = determineFileType(filePath, config);
        
        if (!options.quiet) {
          console.log(`📄 파일 타입: ${filePath} → ${fileType}`);
        }
        
        if (fileType === 'summary') {
          // 요약 문서가 변경됨 → 실제 문서의 Priority JSON 업데이트
          await handleSummaryDocumentChange(filePath, config, workStatusManager, result, options);
        } else if (fileType === 'source') {
          // 실제 문서가 변경됨 → 요약 문서의 프론트매터 업데이트
          await handleSourceDocumentChange(filePath, config, workStatusManager, result, options);
        } else {
          if (!options.quiet) {
            console.log(`⚠️ 알 수 없는 파일 타입, 건너뜁니다: ${filePath}`);
          }
        }

        result.summary.totalProcessed++;

      } catch (error) {
        result.errors.push(`${filePath}: ${error}`);
        result.success = false;
      }
    }

  } catch (error) {
    result.errors.push(`전체 처리 오류: ${error}`);
    result.success = false;
  }

  return result;
}

/**
 * 파일 타입 판별
 */
function determineFileType(filePath: string, config: any): 'summary' | 'source' | 'unknown' {
  const normalizedPath = path.normalize(filePath);
  
  // 요약 문서 패턴 (docs/llms/, docs/en/llms/, docs/ko/llms/)
  if (normalizedPath.includes('/llms/') && normalizedPath.endsWith('.txt')) {
    return 'summary';
  }
  
  // 실제 문서 패턴 (docs/ 하위의 .md 파일들, llms 폴더 제외)
  // docs/README.md, docs/guide/something.md 등
  if (normalizedPath.endsWith('.md') && !normalizedPath.includes('/llms/')) {
    // docs/ 디렉토리 체크를 더 유연하게
    if (normalizedPath.startsWith('docs/') || normalizedPath.includes('/docs/')) {
      return 'source';
    }
  }
  
  return 'unknown';
}

/**
 * 요약 문서 변경 처리
 */
async function handleSummaryDocumentChange(
  summaryPath: string, 
  config: any, 
  workStatusManager: EnhancedWorkStatusManager,
  result: SyncResult,
  options: any
): Promise<void> {
  try {
    // 요약 문서에서 언어와 문자 제한 추출
    const { language, charLimit, documentIds } = await extractSummaryMetadata(summaryPath);
    
    if (!language || !documentIds.length) {
      result.errors.push(`${summaryPath}: 메타데이터 추출 실패`);
      return;
    }

    if (!options.quiet) {
      console.log(`📝 요약 문서 변경 감지: ${summaryPath} (${language}, ${charLimit}자)`);
    }

    // 관련된 Priority JSON 파일들 업데이트
    for (const docId of documentIds) {
      const priorityPath = path.join(config.paths?.llmContentDir || './data', language, `${docId}.json`);
      
      if (existsSync(priorityPath)) {
        if (!options.dryRun) {
          await updatePriorityFrontmatter(priorityPath, {
            lastSummaryUpdate: new Date().toISOString(),
            summaryPath: summaryPath,
            charLimit: charLimit,
            language: language
          });
        }
        
        result.updatedFrontmatters.push(priorityPath);
        result.summary.summaryDocsUpdated++;
        
        if (!options.quiet) {
          console.log(`  ✅ Priority JSON 업데이트: ${priorityPath}`);
        }
      }
    }

  } catch (error) {
    result.errors.push(`요약 문서 처리 오류 ${summaryPath}: ${error}`);
  }
}

/**
 * 실제 문서 변경 처리
 */
async function handleSourceDocumentChange(
  sourcePath: string,
  config: any,
  workStatusManager: EnhancedWorkStatusManager, 
  result: SyncResult,
  options: any
): Promise<void> {
  try {
    // 문서 ID 추출 (파일명 기반)
    const documentId = extractDocumentId(sourcePath);
    
    if (!documentId) {
      result.errors.push(`${sourcePath}: 문서 ID 추출 실패`);
      return;
    }

    if (!options.quiet) {
      console.log(`📄 실제 문서 변경 감지: ${sourcePath} (ID: ${documentId})`);
    }

    // 모든 언어의 Priority JSON 파일 업데이트
    const languages = config.generation?.supportedLanguages || ['ko', 'en'];
    
    for (const language of languages) {
      const priorityPath = path.join(config.paths?.llmContentDir || './data', language, `${documentId}.json`);
      
      if (existsSync(priorityPath)) {
        if (!options.dryRun) {
          await updatePriorityFrontmatter(priorityPath, {
            lastSourceUpdate: new Date().toISOString(),
            sourcePath: sourcePath,
            needsUpdate: true // 요약 문서들이 재생성 필요함을 표시
          });
        }
        
        result.updatedFrontmatters.push(priorityPath);
        result.summary.sourceDosUpdated++;
        
        if (!options.quiet) {
          console.log(`  ✅ Priority JSON 업데이트: ${priorityPath}`);
        }

        // 관련 요약 문서들의 프론트매터도 업데이트
        await updateRelatedSummaryDocuments(documentId, language, config, result, options);
      }
    }

  } catch (error) {
    result.errors.push(`실제 문서 처리 오류 ${sourcePath}: ${error}`);
  }
}

/**
 * 요약 문서 메타데이터 추출
 */
async function extractSummaryMetadata(summaryPath: string): Promise<{
  language: string;
  charLimit: string;
  documentIds: string[];
}> {
  const content = await readFile(summaryPath, 'utf-8');
  const lines = content.split('\n');
  
  let language = '';
  let charLimit = '';
  const documentIds: string[] = [];

  // 헤더에서 메타데이터 추출 (실제 형식에 맞춤)
  for (const line of lines.slice(0, 10)) {
    if (line.startsWith('Language:')) {
      language = line.split(':')[1]?.trim() || '';
    }
    if (line.startsWith('Type:')) {
      // "Type: Minimum (Navigation Links)" 또는 "Type: 1000chars" 등
      if (line.includes('chars')) {
        const match = line.match(/(\d+)chars/);
        charLimit = match ? match[1] : '';
      } else if (line.includes('Minimum')) {
        charLimit = 'minimum';
      } else if (line.includes('Origin')) {
        charLimit = 'origin';
      }
    }
  }

  // 파일명에서도 메타데이터 추출 (예: llms-1000chars-en.txt)
  const fileName = path.basename(summaryPath);
  const fileMatch = fileName.match(/llms-(\w+)-(\w+)\.txt/);
  if (fileMatch) {
    if (!charLimit) charLimit = fileMatch[1]; // minimum, origin, 1000chars 등
    if (!language) language = fileMatch[2].toUpperCase(); // en -> EN, ko -> KO
  }

  // 링크에서 문서 ID들 추출
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    const url = match[2];
    // URL에서 문서 ID 추출 (마지막 세그먼트)
    const segments = url.split('/');
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && !lastSegment.startsWith('http')) {
      documentIds.push(lastSegment);
    }
  }

  // 텍스트에서 간접적으로 문서 ID 추출 (링크가 없는 경우)
  if (documentIds.length === 0) {
    // 제목이나 설명에서 추출 시도
    const titlePattern = /## (.+)/g;
    let titleMatch;
    while ((titleMatch = titlePattern.exec(content)) !== null) {
      const title = titleMatch[1].toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      if (title && title.length > 2) {
        documentIds.push(title);
      }
    }
  }

  return { language, charLimit, documentIds };
}

/**
 * 문서 ID 추출
 */
function extractDocumentId(filePath: string): string {
  const fileName = path.basename(filePath, path.extname(filePath));
  return fileName;
}

/**
 * Priority JSON 프론트매터 업데이트
 */
async function updatePriorityFrontmatter(priorityPath: string, updates: Record<string, any>): Promise<void> {
  try {
    const content = await readFile(priorityPath, 'utf-8');
    const priorityData = JSON.parse(content);

    // work_status 섹션 업데이트
    if (!priorityData.work_status) {
      priorityData.work_status = {};
    }

    // 업데이트 정보 추가
    Object.assign(priorityData.work_status, updates);
    priorityData.work_status.last_checked = new Date().toISOString();

    await writeFile(priorityPath, JSON.stringify(priorityData, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Priority JSON 업데이트 실패: ${error}`);
  }
}

/**
 * 관련 요약 문서들의 프론트매터 업데이트
 */
async function updateRelatedSummaryDocuments(
  documentId: string,
  language: string, 
  config: any,
  result: SyncResult,
  options: any
): Promise<void> {
  try {
    const outputDir = path.join(config.paths?.outputDir || './docs/llms', language);
    const characterLimits = config.generation?.characterLimits || [100, 200, 300, 1000, 2000];

    for (const limit of characterLimits) {
      const summaryPath = path.join(outputDir, `llms-${limit}chars-${language}.txt`);
      
      if (existsSync(summaryPath)) {
        // 요약 문서 헤더에 업데이트 정보 추가
        if (!options.dryRun) {
          await updateSummaryDocumentHeader(summaryPath, {
            lastSourceUpdate: new Date().toISOString(),
            relatedDocument: documentId
          });
        }
        
        result.summary.frontmatterUpdates++;
        
        if (!options.quiet) {
          console.log(`    📄 요약 문서 헤더 업데이트: ${summaryPath}`);
        }
      }
    }
  } catch (error) {
    result.errors.push(`관련 요약 문서 업데이트 오류: ${error}`);
  }
}

/**
 * 요약 문서 헤더 업데이트
 */
async function updateSummaryDocumentHeader(summaryPath: string, updates: Record<string, any>): Promise<void> {
  try {
    const content = await readFile(summaryPath, 'utf-8');
    const lines = content.split('\n');
    
    // 헤더 섹션 찾기 (첫 번째 빈 줄까지)
    let headerEndIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '') {
        headerEndIndex = i;
        break;
      }
    }

    // 업데이트 정보를 헤더에 추가
    const updateLines = Object.entries(updates).map(([key, value]) => 
      `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`
    );

    // 기존 업데이트 정보 제거하고 새로 추가
    const filteredLines = lines.slice(0, headerEndIndex).filter(line => 
      !line.startsWith('LastSourceUpdate:') && !line.startsWith('RelatedDocument:')
    );

    const newHeader = [...filteredLines, ...updateLines];
    const newContent = [...newHeader, ...lines.slice(headerEndIndex)].join('\n');

    await writeFile(summaryPath, newContent, 'utf-8');
  } catch (error) {
    throw new Error(`요약 문서 헤더 업데이트 실패: ${error}`);
  }
}

/**
 * 동기화 결과 출력
 */
function displaySyncResults(result: SyncResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 문서 동기화 결과');
  console.log('='.repeat(60));

  console.log('\n📊 동기화 요약:');
  console.log(`  처리된 파일: ${result.summary.totalProcessed}개`);
  console.log(`  요약→실제 업데이트: ${result.summary.summaryDocsUpdated}개`);
  console.log(`  실제→요약 업데이트: ${result.summary.sourceDosUpdated}개`);
  console.log(`  프론트매터 업데이트: ${result.summary.frontmatterUpdates}개`);

  if (result.updatedFrontmatters.length > 0) {
    console.log('\n✅ 업데이트된 파일들:');
    result.updatedFrontmatters.forEach(file => {
      console.log(`  • ${file}`);
    });
  }

  if (result.errors.length > 0) {
    console.log('\n❌ 오류:');
    result.errors.forEach(error => {
      console.log(`  • ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  if (result.success) {
    console.log('✅ 문서 동기화가 성공적으로 완료되었습니다.');
  } else {
    console.log('⚠️ 문서 동기화가 일부 오류와 함께 완료되었습니다.');
  }
  console.log('='.repeat(60));
}