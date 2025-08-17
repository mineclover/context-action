/**
 * LLMSAutoGenerator - LLMS 자동 생성 시스템
 * 
 * 사용자 검토/편집 완료 상태를 감지하여 LLMS 파일을 자동 생성합니다.
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { LLMSConfig } from '../types/index.js';
import { DocumentUpdateStatus, StatusContext } from '../types/document-status.js';

/**
 * LLMS 생성 결과
 */
export interface LLMSGenerationResult {
  success: boolean;
  generatedFiles: string[];
  errors: string[];
  summary: {
    documentsProcessed: number;
    filesGenerated: number;
    totalCharacters: number;
  };
}

/**
 * 문서 요약 정보
 */
interface DocumentSummary {
  documentId: string;
  language: string;
  summaries: {
    characterLimit: number;
    content: string;
    path: string;
  }[];
}

export class LLMSAutoGenerator {
  constructor(private config: LLMSConfig) {}

  /**
   * 준비된 문서들에 대해 LLMS 자동 생성
   */
  async generateLLMSForReadyDocuments(): Promise<LLMSGenerationResult> {
    const result: LLMSGenerationResult = {
      success: true,
      generatedFiles: [],
      errors: [],
      summary: {
        documentsProcessed: 0,
        filesGenerated: 0,
        totalCharacters: 0
      }
    };

    try {
      // READY_FOR_LLMS 상태의 문서들 찾기
      const readyDocuments = await this.findReadyDocuments();
      
      console.log(`📋 LLMS 생성 준비된 문서: ${readyDocuments.length}개`);

      for (const docSummary of readyDocuments) {
        try {
          const llmsFile = await this.generateLLMSFile(docSummary);
          result.generatedFiles.push(llmsFile);
          result.summary.filesGenerated++;
          result.summary.documentsProcessed++;
          
          console.log(`✅ LLMS 파일 생성: ${llmsFile}`);
        } catch (error) {
          result.errors.push(`${docSummary.documentId}: ${error}`);
          result.success = false;
        }
      }

      console.log(`\n📊 LLMS 생성 완료:`);
      console.log(`   ✅ 성공: ${result.summary.filesGenerated}개`);
      console.log(`   ❌ 실패: ${result.errors.length}개`);

    } catch (error) {
      result.errors.push(`LLMS 생성 전체 실패: ${error}`);
      result.success = false;
    }

    return result;
  }

  /**
   * 특정 문서 ID에 대해 LLMS 생성
   */
  async generateLLMSForDocument(documentId: string, language: string): Promise<string> {
    console.log(`🚀 LLMS 생성 시작: ${documentId} (${language})`);

    const docSummary = await this.loadDocumentSummary(documentId, language);
    const llmsFile = await this.generateLLMSFile(docSummary);
    
    console.log(`✅ LLMS 파일 생성 완료: ${llmsFile}`);
    return llmsFile;
  }

  /**
   * READY_FOR_LLMS 상태의 문서들 찾기
   */
  private async findReadyDocuments(): Promise<DocumentSummary[]> {
    const readyDocuments: DocumentSummary[] = [];
    const dataDir = this.config.paths.llmContentDir;

    for (const language of this.config.generation.supportedLanguages) {
      const languageDir = join(dataDir, language);
      
      if (!existsSync(languageDir)) continue;

      const entries = await readdir(languageDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const documentId = entry.name;
          const hasReadyStatus = await this.checkDocumentStatus(documentId, language);
          
          if (hasReadyStatus) {
            try {
              const docSummary = await this.loadDocumentSummary(documentId, language);
              readyDocuments.push(docSummary);
            } catch (error) {
              console.warn(`⚠️ 문서 로드 실패 ${documentId}:`, error);
            }
          }
        }
      }
    }

    return readyDocuments;
  }

  /**
   * 문서 상태가 READY_FOR_LLMS 또는 EDIT_COMPLETED인지 확인
   */
  private async checkDocumentStatus(documentId: string, language: string): Promise<boolean> {
    const documentDir = join(this.config.paths.llmContentDir, language, documentId);
    
    if (!existsSync(documentDir)) return false;

    const files = await readdir(documentDir);
    const summaryFiles = files.filter(file => file.endsWith('.md') && file.includes(documentId));

    for (const file of summaryFiles) {
      try {
        const filePath = join(documentDir, file);
        const content = await readFile(filePath, 'utf-8');
        const { frontmatter } = this.parseYamlFrontmatter(content);
        
        const status = frontmatter.update_status;
        if (status === DocumentUpdateStatus.READY_FOR_LLMS || 
            status === DocumentUpdateStatus.EDIT_COMPLETED ||
            status === DocumentUpdateStatus.REVIEW_COMPLETED) {
          return true;
        }
      } catch (error) {
        console.warn(`상태 확인 실패 ${file}:`, error);
      }
    }

    return false;
  }

  /**
   * 문서 요약 정보 로드
   */
  private async loadDocumentSummary(documentId: string, language: string): Promise<DocumentSummary> {
    const documentDir = join(this.config.paths.llmContentDir, language, documentId);
    const files = await readdir(documentDir);
    const summaryFiles = files.filter(file => file.endsWith('.md') && file.includes(documentId));

    const summaries: DocumentSummary['summaries'] = [];

    for (const file of summaryFiles) {
      const filePath = join(documentDir, file);
      const content = await readFile(filePath, 'utf-8');
      const { frontmatter, content: bodyContent } = this.parseYamlFrontmatter(content);
      
      const characterLimit = frontmatter.character_limit || this.extractLimitFromFilename(file);
      
      summaries.push({
        characterLimit,
        content: bodyContent,
        path: filePath
      });
    }

    // 문자 제한별로 정렬
    summaries.sort((a, b) => a.characterLimit - b.characterLimit);

    return {
      documentId,
      language,
      summaries
    };
  }

  /**
   * LLMS 파일 생성
   */
  private async generateLLMSFile(docSummary: DocumentSummary): Promise<string> {
    const { documentId, language, summaries } = docSummary;
    
    // LLMS 파일 경로
    const outputDir = this.config.paths.outputDir || join(process.cwd(), 'docs', 'llms');
    const llmsFilePath = join(outputDir, language, `${documentId}.txt`);

    // 디렉토리 생성
    const dir = dirname(llmsFilePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // LLMS 내용 생성
    const llmsContent = this.buildLLMSContent(docSummary);
    
    // 파일 쓰기
    await writeFile(llmsFilePath, llmsContent, 'utf-8');
    
    return llmsFilePath;
  }

  /**
   * LLMS 내용 구성
   */
  private buildLLMSContent(docSummary: DocumentSummary): string {
    const { documentId, language, summaries } = docSummary;
    
    const sections: string[] = [];
    
    // 헤더
    sections.push(`# ${documentId} (${language})`);
    sections.push(`Generated: ${new Date().toISOString()}`);
    sections.push('');

    // 각 문자 제한별 요약 추가
    for (const summary of summaries) {
      sections.push(`## ${summary.characterLimit}자 요약`);
      sections.push('');
      
      // 프론트메터 제거하고 내용만 추가
      const cleanContent = this.cleanContent(summary.content);
      sections.push(cleanContent);
      sections.push('');
      sections.push('---');
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * 내용 정리 (프론트메터, 템플릿 마커 제거)
   */
  private cleanContent(content: string): string {
    let cleaned = content;
    
    // 템플릿 마커 제거
    cleaned = cleaned.replace(/```markdown\s*<!-- 여기에.*?```/gs, '');
    cleaned = cleaned.replace(/## 템플릿 내용.*$/gms, '');
    cleaned = cleaned.replace(/---\s*>\s*\*\*참고\*\*:.*$/gms, '');
    
    // 빈 줄 정리
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  /**
   * 파일명에서 문자 제한 추출
   */
  private extractLimitFromFilename(filename: string): number {
    const match = filename.match(/-(\d+)\.md$/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * YAML 프론트메터 파싱
   */
  private parseYamlFrontmatter(content: string): { frontmatter: Record<string, any>, content: string } {
    const lines = content.split('\n');
    
    if (lines[0]?.trim() !== '---') {
      return { frontmatter: {}, content };
    }
    
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
    
    const frontmatterLines = lines.slice(1, endIndex);
    const frontmatter: Record<string, any> = {};
    
    for (const line of frontmatterLines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        
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
    
    return { frontmatter, content: bodyContent };
  }
}