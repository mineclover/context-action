/**
 * 문서 동기화 명령어 - 요약 문서와 실제 문서 간 양방향 동기화
 * 
 * Git 커밋 트리거를 통한 자동 워크플로우 구현
 */

import { Command } from 'commander';
import { EnhancedWorkStatusManager } from '../../core/EnhancedWorkStatusManager.js';
import { ConfigManager } from '../../core/ConfigManager.js';
import { EnhancedConfigManager } from '../../core/EnhancedConfigManager.js';
import { DocumentStatusManager } from '../../core/DocumentStatusManager.js';
import { globalPerformanceMonitor } from '../../infrastructure/monitoring/PerformanceMonitor.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { readFile, writeFile, readdir } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { 
  DocumentUpdateStatus, 
  StatusTrigger,
  StatusContext 
} from '../../types/document-status.js';

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
    // DocumentStatusManager 초기화
    const statusManager = new DocumentStatusManager(config);
    
    // 변경된 파일들 가져오기
    const changedFiles = options.changedFiles 
      ? options.changedFiles.split(',').map((f: string) => f.trim())
      : getChangedFiles();
    
    // 프로젝트 루트에서 절대 경로로 변환
    const absoluteChangedFiles = changedFiles.map(file => {
      if (path.isAbsolute(file)) {
        return file;
      }
      // Git 루트 디렉토리 찾기
      try {
        const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
        return path.resolve(gitRoot, file);
      } catch {
        // Git 루트를 찾을 수 없으면 현재 디렉토리 기준으로 변환
        return path.resolve(file);
      }
    });

    if (absoluteChangedFiles.length === 0) {
      if (!options.quiet) {
        console.log('📄 변경된 문서가 없습니다.');
      }
      return result;
    }

    if (!options.quiet) {
      console.log(`🔄 ${absoluteChangedFiles.length}개의 변경된 파일을 분석합니다...`);
      absoluteChangedFiles.forEach(file => console.log(`  📝 ${file}`));
    }

    // WorkStatusManager 초기화
    const workConfig = await ConfigManager.findAndLoadConfig();
    const workStatusManager = new EnhancedWorkStatusManager(workConfig);

    for (const filePath of absoluteChangedFiles) {
      try {
        result.processedFiles.push(filePath);

        // 파일 타입 판별 (요약 문서 vs 실제 문서)
        const fileType = determineFileType(filePath, config);
        
        if (!options.quiet) {
          console.log(`📄 파일 타입: ${filePath} → ${fileType}`);
        }
        
        if (fileType === 'summary') {
          // 요약 문서가 변경됨 → 상태 관리 및 Priority JSON 업데이트
          await handleSummaryDocumentChange(filePath, config, workStatusManager, statusManager, result, options);
        } else if (fileType === 'source') {
          // 실제 문서가 변경됨 → 상태 관리 및 요약 문서 프론트매터 업데이트
          await handleSourceDocumentChange(filePath, config, workStatusManager, statusManager, result, options);
        } else if (fileType === 'priority') {
          // Priority JSON이 변경됨 → 관련 요약 문서들에 상태 정보 업데이트
          await handlePriorityJsonChange(filePath, config, workStatusManager, result, options);
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
function determineFileType(filePath: string, config: any): 'summary' | 'source' | 'priority' | 'unknown' {
  const normalizedPath = path.normalize(filePath);
  
  // Priority JSON 파일 패턴 (/data/언어/카테고리/priority.json)
  if (normalizedPath.includes('/data/') && normalizedPath.endsWith('/priority.json')) {
    return 'priority';
  }
  
  // 요약 문서 패턴 1: /data/ 디렉토리의 생성된 요약 문서들
  // 예: /data/en/api--action-only/api--action-only-200.md
  if (normalizedPath.includes('/data/') && normalizedPath.endsWith('.md')) {
    // 파일명에 숫자가 포함된 경우 (200.md, 500.md 등)
    const fileName = path.basename(normalizedPath);
    if (fileName.includes('-200.md') || fileName.includes('-500.md') || fileName.includes('-1000.md') || fileName.includes('-minimum.md') || fileName.includes('-origin.md')) {
      return 'summary';
    }
  }
  
  // 요약 문서 패턴 2: docs/llms/ 디렉토리의 최종 LLMS 파일들
  if (normalizedPath.includes('/llms/') && normalizedPath.endsWith('.txt')) {
    return 'summary';
  }
  
  // 실제 문서 패턴 (docs/ 하위의 원본 .md 파일들)
  if (normalizedPath.endsWith('.md') && !normalizedPath.includes('/llms/') && !normalizedPath.includes('/data/')) {
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
  statusManager: DocumentStatusManager,
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

    // 상태 관리: 요약 문서 변경에 따른 상태 감지
    for (const docId of documentIds) {
      try {
        // 현재 상태 확인
        const currentStatus = await statusManager.getCurrentStatus(docId);
        
        // 요약 문서 내용 분석으로 사용자 액션 감지
        const userAction = await detectUserAction(summaryPath);
        
        if (userAction === 'review_completed') {
          await statusManager.handleUserReviewCompleted(docId, summaryPath);
          if (!options.quiet) {
            console.log(`  ✅ 검토 완료 상태로 업데이트: ${docId}`);
          }
        } else if (userAction === 'edit_completed') {
          await statusManager.handleUserEditCompleted(docId, summaryPath);
          if (!options.quiet) {
            console.log(`  ✏️ 편집 완료 상태로 업데이트: ${docId}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ 상태 관리 실패 for ${docId}:`, error);
      }
    }

    // 관련된 Priority JSON 파일들 업데이트
    for (const docId of documentIds) {
      const llmContentDir = config.paths?.llmContentDir || './data';
      const priorityPath = path.resolve(llmContentDir, language, docId, 'priority.json');
      
      
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
  statusManager: DocumentStatusManager,
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

    // 상태 관리: 소스 문서 변경 처리
    try {
      await statusManager.handleSourceDocumentChange(documentId, sourcePath);
      if (!options.quiet) {
        console.log(`  🔄 상태 업데이트: ${documentId} → source_updated`);
      }
    } catch (error) {
      console.warn(`⚠️ 상태 관리 실패 for ${documentId}:`, error);
    }

    // 모든 언어의 Priority JSON 파일 업데이트
    const languages = config.generation?.supportedLanguages || ['ko', 'en'];
    
    for (const language of languages) {
      const llmContentDir = config.paths?.llmContentDir || './data';
      const priorityPath = path.resolve(llmContentDir, language, documentId, 'priority.json');
      
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
 * 요약 문서 메타데이터 추출 (YAML 프론트메터 기반)
 */
async function extractSummaryMetadata(summaryPath: string): Promise<{
  language: string;
  charLimit: string;
  documentIds: string[];
}> {
  // 절대 경로로 변환
  const absolutePath = path.isAbsolute(summaryPath) ? summaryPath : path.resolve(summaryPath);
  const content = await readFile(absolutePath, 'utf-8');
  
  // YAML 프론트메터 파싱
  const { frontmatter, content: bodyContent } = parseYamlFrontmatter(content);
  
  let language = '';
  let charLimit = '';
  const documentIds: string[] = [];

  // 프론트메터에서 메타데이터 추출
  if (frontmatter.source_path && typeof frontmatter.source_path === 'string') {
    // source_path에서 언어 추출 (예: "en/api/action-only.md" → "en")
    const pathParts = frontmatter.source_path.split('/');
    if (pathParts.length > 0) {
      language = pathParts[0].toLowerCase();
    }
  }
  
  if (frontmatter.character_limit) {
    charLimit = String(frontmatter.character_limit);
  }
  
  if (frontmatter.document_id && typeof frontmatter.document_id === 'string') {
    documentIds.push(frontmatter.document_id);
  }

  // 파일명에서도 메타데이터 추출 (폴백)
  const fileName = path.basename(summaryPath);
  
  // /data/언어/문서ID/문서ID-숫자.md 패턴에서 추출
  const pathSegments = absolutePath.split('/');
  const dataIndex = pathSegments.findIndex(segment => segment === 'data');
  if (dataIndex !== -1 && dataIndex + 2 < pathSegments.length) {
    if (!language) {
      language = pathSegments[dataIndex + 1]; // data 다음이 언어
    }
    if (documentIds.length === 0) {
      const dirName = pathSegments[dataIndex + 2]; // 언어 다음이 문서 디렉토리
      documentIds.push(dirName);
    }
  }
  
  // 파일명에서 문자 제한 추출 (예: api--action-only-200.md)
  if (!charLimit) {
    const fileMatch = fileName.match(/-(\d+)\.md$/);
    if (fileMatch) {
      charLimit = fileMatch[1];
    } else if (fileName.includes('-minimum.md')) {
      charLimit = 'minimum';
    } else if (fileName.includes('-origin.md')) {
      charLimit = 'origin';
    }
  }

  // 최종 LLMS 파일인 경우 (예: llms-1000chars-en.txt)
  const llmsMatch = fileName.match(/llms-(\w+)-(\w+)\.txt/);
  if (llmsMatch) {
    if (!charLimit) charLimit = llmsMatch[1]; // minimum, origin, 1000chars 등
    if (!language) language = llmsMatch[2].toLowerCase(); // en, ko 등
  }

  // 본문에서 링크를 통한 문서 ID들 추출 (여러 문서가 병합된 경우)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkPattern.exec(bodyContent)) !== null) {
    const url = match[2];
    // URL에서 문서 ID 추출 (마지막 세그먼트)
    const segments = url.split('/');
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && !lastSegment.startsWith('http') && !documentIds.includes(lastSegment)) {
      documentIds.push(lastSegment);
    }
  }

  // 본문에서 간접적으로 문서 ID 추출 (링크가 없는 경우)
  if (documentIds.length === 0) {
    // 제목이나 설명에서 추출 시도
    const titlePattern = /## (.+)/g;
    let titleMatch;
    while ((titleMatch = titlePattern.exec(bodyContent)) !== null) {
      const title = titleMatch[1].toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      if (title && title.length > 2 && !documentIds.includes(title)) {
        documentIds.push(title);
      }
    }
  }

  return { language, charLimit, documentIds };
}

/**
 * 문서 ID 추출 (소스 경로를 우리 디렉토리 구조에 맞게 변환)
 */
function extractDocumentId(filePath: string): string {
  // 절대 경로를 상대 경로로 변환
  let relativePath = filePath;
  
  // docs/ 경로 제거
  if (relativePath.includes('/docs/')) {
    const docsIndex = relativePath.indexOf('/docs/');
    relativePath = relativePath.substring(docsIndex + 6); // '/docs/' 제거
  }
  
  // 확장자 제거
  if (relativePath.endsWith('.md')) {
    relativePath = relativePath.substring(0, relativePath.length - 3);
  }
  
  // 경로를 우리 명명 규칙에 맞게 변환
  // 예: "ko/api/action-only" → "api--action-only"
  // 예: "en/guide/getting-started" → "guide--getting-started"
  const pathParts = relativePath.split('/');
  if (pathParts.length >= 3) {
    // 언어 부분 제거하고 나머지를 -- 로 결합
    const [, ...contentParts] = pathParts;
    return contentParts.join('--');
  }
  
  // 폴백: 파일명만 사용
  return path.basename(filePath, path.extname(filePath));
}

/**
 * Priority JSON 프론트매터 업데이트
 */
async function updatePriorityFrontmatter(priorityPath: string, updates: Record<string, any>): Promise<void> {
  try {
    const absolutePath = path.isAbsolute(priorityPath) ? priorityPath : path.resolve(priorityPath);
    const content = await readFile(absolutePath, 'utf-8');
    const priorityData = JSON.parse(content);

    // work_status 섹션 업데이트
    if (!priorityData.work_status) {
      priorityData.work_status = {};
    }

    // 업데이트 정보 추가
    Object.assign(priorityData.work_status, updates);
    priorityData.work_status.last_checked = new Date().toISOString();

    await writeFile(absolutePath, JSON.stringify(priorityData, null, 2), 'utf-8');
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
 * 요약 문서 프론트메터 업데이트 (YAML 표준 형식)
 */
async function updateSummaryDocumentHeader(summaryPath: string, updates: Record<string, any>): Promise<void> {
  try {
    const absolutePath = path.isAbsolute(summaryPath) ? summaryPath : path.resolve(summaryPath);
    const content = await readFile(absolutePath, 'utf-8');
    
    // YAML 프론트메터 업데이트
    const updatedContent = updateYamlFrontmatter(content, updates);
    
    await writeFile(absolutePath, updatedContent, 'utf-8');
  } catch (error) {
    throw new Error(`요약 문서 프론트메터 업데이트 실패: ${error}`);
  }
}

/**
 * Priority JSON 변경 처리
 */
async function handlePriorityJsonChange(
  priorityPath: string,
  config: any,
  workStatusManager: EnhancedWorkStatusManager,
  result: SyncResult,
  options: any
): Promise<void> {
  try {
    // Priority JSON 파일에서 문서 ID와 메타데이터 추출
    const absolutePath = path.isAbsolute(priorityPath) ? priorityPath : path.resolve(priorityPath);
    const priorityData = JSON.parse(await readFile(absolutePath, 'utf-8'));
    
    const documentId = priorityData.document?.id;
    if (!documentId) {
      result.errors.push(`${priorityPath}: document.id가 없습니다`);
      return;
    }

    if (!options.quiet) {
      console.log(`📋 Priority JSON 변경 감지: ${priorityPath} (ID: ${documentId})`);
    }

    // 관련된 요약 문서들 찾기 및 업데이트
    const priorityDir = path.dirname(absolutePath);
    const summaryFiles = await findSummaryFilesInDirectory(priorityDir);
    
    for (const summaryFile of summaryFiles) {
      if (!options.dryRun) {
        // 요약 문서에 Priority 상태 정보 추가
        const priorityStatus = {
          priority_score: priorityData.priority?.score || 0,
          priority_tier: priorityData.priority?.tier || 'reference',
          last_priority_update: new Date().toISOString(),
          work_status: priorityData.work_status || {},
          completion_status: priorityData.work_status?.completion_status || 'unknown'
        };
        
        await updateSummaryDocumentHeader(summaryFile, priorityStatus);
      }
      
      result.updatedFrontmatters.push(summaryFile);
      result.summary.frontmatterUpdates++;
      
      if (!options.quiet) {
        console.log(`  ✅ 요약 문서 업데이트: ${summaryFile}`);
      }
    }

  } catch (error) {
    result.errors.push(`Priority JSON 처리 오류 ${priorityPath}: ${error}`);
  }
}

/**
 * 디렉토리에서 요약 문서 파일들 찾기
 */
async function findSummaryFilesInDirectory(directory: string): Promise<string[]> {
  try {
    const files = await readdir(directory);
    return files
      .filter(file => file.endsWith('.md') && (
        file.includes('-200.md') || 
        file.includes('-500.md') || 
        file.includes('-1000.md') || 
        file.includes('-minimum.md') || 
        file.includes('-origin.md')
      ))
      .map(file => path.join(directory, file));
  } catch (error) {
    return [];
  }
}

/**
 * YAML 프론트메터 파싱
 */
function parseYamlFrontmatter(content: string): { frontmatter: Record<string, any>, content: string } {
  const lines = content.split('\n');
  
  // 첫 번째 줄이 --- 인지 확인
  if (lines[0]?.trim() !== '---') {
    return { frontmatter: {}, content };
  }
  
  // 두 번째 --- 찾기
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    return { frontmatter: {}, content };
  }
  
  // YAML 파싱 (간단한 key: value 형식만 지원)
  const frontmatterLines = lines.slice(1, endIndex);
  const frontmatter: Record<string, any> = {};
  
  for (const line of frontmatterLines) {
    const trimmed = line.trim();
    if (trimmed && trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      
      // 기본 타입 변환
      if (value === 'true') {
        frontmatter[key.trim()] = true;
      } else if (value === 'false') {
        frontmatter[key.trim()] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        frontmatter[key.trim()] = Number(value);
      } else {
        frontmatter[key.trim()] = value;
      }
    }
  }
  
  // 프론트메터를 제거한 콘텐츠 반환
  const bodyContent = lines.slice(endIndex + 1).join('\n');
  
  return { frontmatter, content: bodyContent };
}

/**
 * YAML 프론트메터 생성
 */
function generateYamlFrontmatter(frontmatter: Record<string, any>): string {
  const lines = ['---'];
  
  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(`${key}: ${value}`);
  }
  
  lines.push('---');
  return lines.join('\n');
}

/**
 * 프론트메터 업데이트
 */
function updateYamlFrontmatter(content: string, updates: Record<string, any>): string {
  const { frontmatter, content: bodyContent } = parseYamlFrontmatter(content);
  
  // 프론트메터 업데이트
  const updatedFrontmatter = { ...frontmatter, ...updates };
  
  // 새로운 콘텐츠 생성
  return generateYamlFrontmatter(updatedFrontmatter) + '\n' + bodyContent;
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

/**
 * 요약 문서 내용 분석으로 사용자 액션 감지
 */
async function detectUserAction(summaryPath: string): Promise<'review_completed' | 'edit_completed' | 'none'> {
  try {
    const content = await readFile(summaryPath, 'utf-8');
    
    // 프론트메터에서 completion_status 확인
    const { frontmatter } = parseYamlFrontmatter(content);
    
    // 명시적인 상태 표시 확인
    if (frontmatter.completion_status === 'review' || 
        frontmatter.completion_status === 'completed') {
      return 'review_completed';
    }
    
    // 내용 변경 여부 확인 (템플릿에서 벗어난 실질적인 내용)
    const hasRealContent = content.includes('<!-- 여기에') === false && 
                          content.length > 1000 && // 템플릿보다 충분한 내용
                          !content.includes('템플릿 내용'); // 템플릿 표시가 없음
    
    if (hasRealContent) {
      return 'edit_completed';
    }
    
    return 'none';
  } catch (error) {
    console.warn(`사용자 액션 감지 실패 for ${summaryPath}:`, error);
    return 'none';
  }
}