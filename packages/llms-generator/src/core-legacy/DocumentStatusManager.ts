/**
 * DocumentStatusManager - 문서 상태 관리 시스템
 * 
 * Git 커밋 기반 워크플로우와 통합된 문서 상태 관리를 제공합니다.
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { LLMSConfig } from '../types/config.js';
import {
  DocumentUpdateStatus,
  StatusTrigger,
  StatusContext,
  StatusHistoryEntry,
  EnhancedFrontmatter,
  IDocumentStatusManager,
  StatusTransition,
  WorkflowConfig,
  ValidationResult,
  DEFAULT_STATUS_TRANSITIONS,
  DEFAULT_WORKFLOW_CONFIG
} from '../types/document-status.js';
import { LLMSAutoGenerator } from './LLMSAutoGenerator.js';

/**
 * YAML 프론트메터 파싱 결과
 */
interface ParsedFrontmatter {
  frontmatter: EnhancedFrontmatter;
  content: string;
}

export class DocumentStatusManager implements IDocumentStatusManager {
  private transitions: StatusTransition[];
  private workflowConfig: WorkflowConfig;
  private llmsGenerator: LLMSAutoGenerator;

  constructor(
    private config: LLMSConfig,
    transitions: StatusTransition[] = DEFAULT_STATUS_TRANSITIONS,
    workflowConfig: WorkflowConfig = DEFAULT_WORKFLOW_CONFIG
  ) {
    this.transitions = transitions;
    this.workflowConfig = workflowConfig;
    this.llmsGenerator = new LLMSAutoGenerator(config);
  }

  /**
   * 문서의 현재 상태 조회
   */
  async getCurrentStatus(documentId: string): Promise<DocumentUpdateStatus> {
    try {
      const summaryFiles = await this.findSummaryFiles(documentId);
      
      if (summaryFiles.length === 0) {
        return DocumentUpdateStatus.TEMPLATE_GENERATED;
      }

      // 첫 번째 요약 파일에서 상태 확인
      const frontmatter = await this.loadFrontmatter(summaryFiles[0]);
      return frontmatter.update_status || DocumentUpdateStatus.TEMPLATE_GENERATED;
    } catch (error) {
      console.warn(`Failed to get current status for ${documentId}:`, error);
      return DocumentUpdateStatus.ERROR;
    }
  }

  /**
   * 문서의 상태 히스토리 조회
   */
  async getStatusHistory(documentId: string): Promise<StatusHistoryEntry[]> {
    try {
      const summaryFiles = await this.findSummaryFiles(documentId);
      
      if (summaryFiles.length === 0) {
        return [];
      }

      const frontmatter = await this.loadFrontmatter(summaryFiles[0]);
      return frontmatter.status_history || [];
    } catch (error) {
      console.warn(`Failed to get status history for ${documentId}:`, error);
      return [];
    }
  }

  /**
   * 상태 전환 실행
   */
  async transitionStatus(
    documentId: string,
    newStatus: DocumentUpdateStatus,
    trigger: StatusTrigger,
    context: StatusContext
  ): Promise<void> {
    const currentStatus = await this.getCurrentStatus(documentId);
    
    // 상태 전환 검증
    const validationResult = await this.validateTransition(currentStatus, newStatus, context);
    if (!validationResult.valid) {
      throw new Error(`Invalid status transition: ${validationResult.message}`);
    }

    // 모든 요약 파일 업데이트
    const summaryFiles = await this.findSummaryFiles(documentId);
    
    for (const summaryFile of summaryFiles) {
      await this.updateSummaryStatus(summaryFile, currentStatus, newStatus, trigger, context);
    }

    // 워크플로우 트리거 처리
    if (this.workflowConfig.autoLLMSGeneration && 
        this.workflowConfig.llmsGenerationTriggers.includes(newStatus)) {
      await this.triggerLLMSGeneration(documentId, context);
    }
  }

  /**
   * 워크플로우 트리거 처리
   */
  async processWorkflowTrigger(trigger: StatusTrigger, context: StatusContext): Promise<void> {
    const currentStatus = await this.getCurrentStatus(context.documentId);
    
    // 트리거에 따른 상태 전환 찾기
    const transition = this.transitions.find(t => 
      t.from === currentStatus && t.trigger === trigger
    );

    if (transition) {
      // 조건 확인
      if (transition.condition && !transition.condition(context)) {
        return;
      }

      // 상태 전환 실행
      await this.transitionStatus(context.documentId, transition.to, trigger, context);

      // 추가 액션 실행
      if (transition.action) {
        await transition.action(context);
      }
    }
  }

  /**
   * 상태 전환 검증
   */
  async validateTransition(
    from: DocumentUpdateStatus,
    to: DocumentUpdateStatus,
    context: StatusContext
  ): Promise<ValidationResult> {
    // 동일 상태로의 전환은 허용
    if (from === to) {
      return { valid: true };
    }

    // 허용된 전환인지 확인
    const validTransition = this.transitions.some(t => t.from === from && t.to === to);
    
    if (!validTransition) {
      return {
        valid: false,
        message: `Transition from ${from} to ${to} is not allowed`,
        suggestions: this.getValidTransitions(from)
      };
    }

    // 추가 검증 규칙 실행
    for (const rule of this.workflowConfig.validationRules) {
      const result = await rule.validate(context);
      if (!result.valid && rule.severity === 'error') {
        return result;
      }
    }

    return { valid: true };
  }

  /**
   * Git 커밋 기반 소스 문서 변경 감지
   */
  async handleSourceDocumentChange(
    documentId: string,
    sourcePath: string,
    commitHash?: string
  ): Promise<void> {
    const context: StatusContext = {
      documentId,
      documentPath: sourcePath,
      commitHash,
      timestamp: new Date().toISOString(),
      metadata: { source: 'git-commit' }
    };

    await this.processWorkflowTrigger(StatusTrigger.SOURCE_COMMIT, context);
  }

  /**
   * 사용자 검토 완료 처리
   */
  async handleUserReviewCompleted(
    documentId: string,
    summaryPath: string,
    userId?: string
  ): Promise<void> {
    const context: StatusContext = {
      documentId,
      summaryPath,
      userId,
      timestamp: new Date().toISOString(),
      metadata: { source: 'user-review' }
    };

    await this.transitionStatus(
      documentId,
      DocumentUpdateStatus.REVIEW_COMPLETED,
      StatusTrigger.USER_REVIEW,
      context
    );
  }

  /**
   * 사용자 편집 완료 처리
   */
  async handleUserEditCompleted(
    documentId: string,
    summaryPath: string,
    userId?: string
  ): Promise<void> {
    const context: StatusContext = {
      documentId,
      summaryPath,
      userId,
      timestamp: new Date().toISOString(),
      metadata: { source: 'user-edit' }
    };

    await this.transitionStatus(
      documentId,
      DocumentUpdateStatus.EDIT_COMPLETED,
      StatusTrigger.USER_EDIT,
      context
    );
  }

  /**
   * LLMS 자동 생성 트리거
   */
  private async triggerLLMSGeneration(documentId: string, context: StatusContext): Promise<void> {
    console.log(`🚀 Triggering LLMS generation for document: ${documentId}`);
    
    try {
      // 언어 감지 (context 또는 config에서)
      const language = this.extractLanguageFromContext(context) || this.config.generation.defaultLanguage;
      
      // LLMS 파일 생성
      const llmsFile = await this.llmsGenerator.generateLLMSForDocument(documentId, language);
      
      const llmsContext: StatusContext = {
        ...context,
        timestamp: new Date().toISOString(),
        metadata: { 
          ...context.metadata, 
          trigger: 'auto-llms-generation',
          llmsFile,
          generatedAt: new Date().toISOString()
        }
      };

      await this.transitionStatus(
        documentId,
        DocumentUpdateStatus.LLMS_GENERATED,
        StatusTrigger.LLMS_COMPLETION,
        llmsContext
      );
      
      console.log(`✅ LLMS 자동 생성 완료: ${llmsFile}`);
    } catch (error) {
      console.error(`❌ LLMS 자동 생성 실패 for ${documentId}:`, error);
      
      // 에러 상태로 전환
      const errorContext: StatusContext = {
        ...context,
        timestamp: new Date().toISOString(),
        metadata: { 
          ...context.metadata, 
          error: error.toString(),
          errorType: 'llms-generation-failed'
        }
      };

      await this.transitionStatus(
        documentId,
        DocumentUpdateStatus.ERROR,
        StatusTrigger.AUTO_VALIDATION,
        errorContext
      );
    }
  }

  /**
   * 요약 파일의 상태 업데이트
   */
  private async updateSummaryStatus(
    summaryPath: string,
    previousStatus: DocumentUpdateStatus,
    newStatus: DocumentUpdateStatus,
    trigger: StatusTrigger,
    context: StatusContext
  ): Promise<void> {
    const { frontmatter, content } = await this.parseFrontmatter(summaryPath);
    
    // 상태 히스토리 항목 생성
    const historyEntry: StatusHistoryEntry = {
      timestamp: context.timestamp,
      previousStatus,
      newStatus,
      trigger,
      context
    };

    // 프론트메터 업데이트
    const updatedFrontmatter: EnhancedFrontmatter = {
      ...frontmatter,
      update_status: newStatus,
      last_update: context.timestamp,
      status_history: [
        ...(frontmatter.status_history || []),
        historyEntry
      ]
    };

    // 컨텍스트별 추가 메타데이터 설정
    if (context.documentPath) {
      updatedFrontmatter.last_source_update = context.timestamp;
      updatedFrontmatter.related_document = context.documentId;
    }

    if (context.userId) {
      updatedFrontmatter.assigned_reviewer = context.userId;
      if (newStatus === DocumentUpdateStatus.REVIEW_COMPLETED) {
        updatedFrontmatter.last_review_date = context.timestamp;
      }
    }

    // 파일 쓰기
    await this.writeFrontmatter(summaryPath, updatedFrontmatter, content);
  }

  /**
   * 문서 ID로 요약 파일들 찾기
   */
  private async findSummaryFiles(documentId: string): Promise<string[]> {
    const files: string[] = [];
    const dataDir = this.config.paths.llmContentDir;

    // 언어별 디렉토리 순회
    for (const language of this.config.generation.supportedLanguages) {
      const languageDir = join(dataDir, language, documentId);
      
      if (existsSync(languageDir)) {
        const { readdirSync } = require('fs');
        const items = readdirSync(languageDir);
        
        for (const item of items) {
          if (item.endsWith('.md') && item.includes(documentId)) {
            files.push(join(languageDir, item));
          }
        }
      }
    }

    return files;
  }

  /**
   * 프론트메터 로드
   */
  private async loadFrontmatter(filePath: string): Promise<EnhancedFrontmatter> {
    const { frontmatter } = await this.parseFrontmatter(filePath);
    return frontmatter;
  }

  /**
   * YAML 프론트메터 파싱
   */
  private async parseFrontmatter(filePath: string): Promise<ParsedFrontmatter> {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    if (lines[0]?.trim() !== '---') {
      throw new Error(`Invalid frontmatter format in ${filePath}`);
    }

    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      throw new Error(`Frontmatter end delimiter not found in ${filePath}`);
    }

    // YAML 파싱 (간단한 key: value 형식)
    const frontmatterLines = lines.slice(1, endIndex);
    const frontmatter: any = {};

    for (const line of frontmatterLines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();

        // 타입 변환
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

    const bodyContent = lines.slice(endIndex + 1).join('\n');

    return {
      frontmatter: frontmatter as EnhancedFrontmatter,
      content: bodyContent
    };
  }

  /**
   * 프론트메터 쓰기
   */
  private async writeFrontmatter(
    filePath: string,
    frontmatter: EnhancedFrontmatter,
    content: string
  ): Promise<void> {
    const frontmatterLines = ['---'];

    for (const [key, value] of Object.entries(frontmatter)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // 배열은 JSON 형태로 저장
          frontmatterLines.push(`${key}: ${JSON.stringify(value)}`);
        } else if (typeof value === 'object') {
          // 객체도 JSON 형태로 저장
          frontmatterLines.push(`${key}: ${JSON.stringify(value)}`);
        } else {
          frontmatterLines.push(`${key}: ${value}`);
        }
      }
    }

    frontmatterLines.push('---');
    
    const fileContent = frontmatterLines.join('\n') + '\n\n' + content;
    
    // 디렉토리 생성
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    await writeFile(filePath, fileContent, 'utf-8');
  }

  /**
   * 현재 상태에서 가능한 전환 상태 목록
   */
  private getValidTransitions(from: DocumentUpdateStatus): string[] {
    return this.transitions
      .filter(t => t.from === from)
      .map(t => t.to);
  }

  /**
   * Context에서 언어 추출
   */
  private extractLanguageFromContext(context: StatusContext): string | null {
    // summaryPath에서 언어 추출
    if (context.summaryPath) {
      const pathParts = context.summaryPath.split('/');
      const dataIndex = pathParts.findIndex(part => part === 'data');
      if (dataIndex !== -1 && dataIndex + 1 < pathParts.length) {
        return pathParts[dataIndex + 1];
      }
    }

    // documentPath에서 언어 추출
    if (context.documentPath) {
      const pathParts = context.documentPath.split('/');
      const docsIndex = pathParts.findIndex(part => part === 'docs');
      if (docsIndex !== -1 && docsIndex + 1 < pathParts.length) {
        return pathParts[docsIndex + 1];
      }
    }

    return null;
  }
}