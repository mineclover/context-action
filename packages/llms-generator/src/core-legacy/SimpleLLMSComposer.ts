/**
 * Simple LLMS Composer
 * 
 * 같은 character limit의 모든 개별 .md 파일들을 단순 결합하여 LLMS 파일 생성
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { LLMSConfig } from '../types/index.js';

export interface SimpleLLMSOptions {
  language: string;
  characterLimit: number;
  outputDir?: string;
  includeMetadata?: boolean;
  sortBy?: 'alphabetical' | 'priority' | 'category';
}

export interface SimpleLLMSResult {
  outputPath: string;
  totalFiles: number;
  totalCharacters: number;
  averageCharacters: number;
  files: Array<{
    documentId: string;
    filePath: string;
    characters: number;
    title?: string;
    category?: string;
  }>;
}

export interface DocumentFileInfo {
  documentId: string;
  filePath: string;
  content: string;
  characters: number;
  title?: string;
  category?: string;
  priority?: number;
}

export class SimpleLLMSComposer {
  private config: LLMSConfig;

  constructor(config: LLMSConfig) {
    this.config = config;
  }

  /**
   * 특정 character limit의 모든 개별 파일들을 단순 결합
   */
  async generateSimpleLLMS(options: SimpleLLMSOptions): Promise<SimpleLLMSResult> {
    const { language, characterLimit, outputDir, includeMetadata = true, sortBy = 'alphabetical' } = options;

    console.log(`📝 Generating simple LLMS for ${characterLimit} characters (${language})`);

    // 해당 character limit의 모든 파일 수집
    const files = await this.collectCharacterLimitFiles(language, characterLimit);
    
    if (files.length === 0) {
      throw new Error(`No files found for character limit ${characterLimit} in language ${language}`);
    }

    // 정렬
    const sortedFiles = this.sortFiles(files, sortBy);

    // 콘텐츠 결합
    const combinedContent = this.combineContent(sortedFiles, characterLimit, language, includeMetadata);

    // 출력 파일 생성
    const outputPath = await this.writeOutput(combinedContent, language, characterLimit, outputDir);

    // 통계 계산
    const totalCharacters = combinedContent.length;
    const averageCharacters = Math.round(sortedFiles.reduce((sum, file) => sum + file.characters, 0) / sortedFiles.length);

    console.log(`✅ Generated: ${outputPath}`);
    console.log(`📊 Combined ${files.length} files (${totalCharacters} total characters)`);

    return {
      outputPath,
      totalFiles: files.length,
      totalCharacters,
      averageCharacters,
      files: sortedFiles.map(file => ({
        documentId: file.documentId,
        filePath: file.filePath,
        characters: file.characters,
        title: file.title,
        category: file.category
      }))
    };
  }

  /**
   * 여러 character limit에 대해 배치 생성
   */
  async generateBatchSimpleLLMS(
    language: string,
    characterLimits: number[],
    options: Partial<SimpleLLMSOptions> = {}
  ): Promise<Map<number, SimpleLLMSResult>> {
    const results = new Map<number, SimpleLLMSResult>();

    console.log(`🚀 Batch generating simple LLMS for ${characterLimits.length} character limits`);

    for (const limit of characterLimits) {
      try {
        const result = await this.generateSimpleLLMS({
          language,
          characterLimit: limit,
          ...options
        });
        results.set(limit, result);
      } catch (error) {
        console.warn(`⚠️  Failed to generate LLMS for ${limit} characters: ${error}`);
      }
    }

    console.log(`✅ Batch generation completed: ${results.size}/${characterLimits.length} successful`);
    return results;
  }

  /**
   * 특정 character limit의 모든 개별 파일 수집
   * docs 디렉토리의 실제 마크다운 파일들을 재귀적으로 스캔하여 수집
   */
  private async collectCharacterLimitFiles(language: string, characterLimit: number): Promise<DocumentFileInfo[]> {
    const files: DocumentFileInfo[] = [];
    // Simple LLMS는 실제 docs 디렉토리에서 마크다운 파일들을 찾아야 함
    const languageDir = path.join(this.config.paths.docsDir, language);

    if (!existsSync(languageDir)) {
      console.warn(`⚠️  Language directory not found: ${languageDir}`);
      return files;
    }

    try {
      // 재귀적으로 모든 .md 파일 찾기
      const markdownFiles = await this.findMarkdownFiles(languageDir);
      
      console.log(`📄 Found ${markdownFiles.length} markdown files in ${languageDir}`);

      for (const filePath of markdownFiles) {
        try {
          const content = await readFile(filePath, 'utf-8');
          const { cleanContent, frontmatter } = this.extractContentAndFrontmatter(content);

          // 빈 콘텐츠는 제외
          if (cleanContent.trim().length === 0) {
            console.warn(`⚠️  Skipping empty file: ${filePath}`);
            continue;
          }

          // character limit에 맞게 요약
          const truncatedContent = this.truncateToCharacterLimit(cleanContent, characterLimit);

          // 파일 경로로부터 document ID 생성
          const documentId = this.generateDocumentIdFromPath(filePath, languageDir);

          files.push({
            documentId,
            filePath,
            content: truncatedContent,
            characters: truncatedContent.length,
            title: frontmatter?.title || this.generateTitleFromFilePath(filePath),
            category: frontmatter?.category || this.inferCategoryFromPath(filePath),
            priority: frontmatter?.priority
          });
        } catch (error) {
          console.warn(`⚠️  Failed to read file ${filePath}: ${error}`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to scan directory ${languageDir}: ${error}`);
    }

    return files;
  }

  /**
   * 파일들 정렬
   */
  private sortFiles(files: DocumentFileInfo[], sortBy: SimpleLLMSOptions['sortBy']): DocumentFileInfo[] {
    switch (sortBy) {
      case 'priority':
        return files.sort((a, b) => (b.priority || 50) - (a.priority || 50));
      
      case 'category':
        return files.sort((a, b) => {
          const categoryA = a.category || 'zzz';
          const categoryB = b.category || 'zzz';
          if (categoryA !== categoryB) {
            return categoryA.localeCompare(categoryB);
          }
          return a.documentId.localeCompare(b.documentId);
        });
      
      case 'alphabetical':
      default:
        return files.sort((a, b) => a.documentId.localeCompare(b.documentId));
    }
  }

  /**
   * 콘텐츠 결합
   */
  private combineContent(
    files: DocumentFileInfo[],
    characterLimit: number,
    language: string,
    includeMetadata: boolean
  ): string {
    let combined = '';

    // 헤더 추가
    if (includeMetadata) {
      combined += this.generateHeader(characterLimit, language, files.length);
    }

    // 각 문서 추가
    for (const file of files) {
      combined += `\n# ${file.title}\n\n`;
      
      if (includeMetadata) {
        combined += `**Document ID**: \`${file.documentId}\`  \n`;
        if (file.category) {
          combined += `**Category**: ${file.category}  \n`;
        }
        combined += `**Characters**: ${file.characters}  \n\n`;
      }
      
      combined += file.content;
      combined += '\n\n---\n\n';
    }

    // 푸터 추가
    if (includeMetadata) {
      combined += this.generateFooter(files);
    }

    return combined.trim();
  }

  /**
   * 출력 파일 작성
   */
  private async writeOutput(
    content: string,
    language: string,
    characterLimit: number,
    customOutputDir?: string
  ): Promise<string> {
    // customOutputDir가 제공되면 그것을 사용, 아니면 기본 outputDir 사용 (언어별 하위디렉토리 생성 안함)
    const outputDir = customOutputDir || this.config.paths.outputDir;
    
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }
    
    const filename = `llms-simple-${characterLimit}chars-${language}.txt`;
    const outputPath = path.join(outputDir, filename);
    
    await writeFile(outputPath, content, 'utf-8');
    
    return outputPath;
  }

  /**
   * YAML frontmatter와 콘텐츠 분리
   */
  private extractContentAndFrontmatter(content: string): { 
    cleanContent: string; 
    frontmatter?: any 
  } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      try {
        // YAML frontmatter 파싱은 간단하게 처리 (정규식 기반)
        const frontmatterText = match[1];
        const frontmatter: any = {};
        
        // 기본적인 필드만 추출
        const titleMatch = frontmatterText.match(/title:\s*(.+)/);
        const categoryMatch = frontmatterText.match(/category:\s*(.+)/);
        const priorityMatch = frontmatterText.match(/priority:\s*(\d+)/);
        
        if (titleMatch) frontmatter.title = titleMatch[1].replace(/['"]/g, '').trim();
        if (categoryMatch) frontmatter.category = categoryMatch[1].replace(/['"]/g, '').trim();
        if (priorityMatch) frontmatter.priority = parseInt(priorityMatch[1]);
        
        // 빈 객체인 경우 undefined 반환
        const hasValidFields = Object.keys(frontmatter).length > 0;
        
        return {
          cleanContent: match[2].trim(),
          frontmatter: hasValidFields ? frontmatter : undefined
        };
      } catch (error) {
        console.warn(`⚠️  Failed to parse frontmatter: ${error}`);
      }
    }
    
    return { cleanContent: content.trim() };
  }

  /**
   * Document ID로부터 제목 생성
   */
  private generateTitleFromDocumentId(documentId: string): string {
    return documentId
      .split('--')
      .map(part => part.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '))
      .join(' → ');
  }

  /**
   * 헤더 생성
   */
  private generateHeader(characterLimit: number, language: string, fileCount: number): string {
    return `# Context-Action Framework - Simple LLMS (${characterLimit} chars)

Generated: ${new Date().toISOString().split('T')[0]}
Type: Simple Combination
Language: ${language.toUpperCase()}
Character Limit: ${characterLimit}
Total Documents: ${fileCount}

This document contains all individual ${characterLimit}-character summaries combined in simple sequential order.

---

`;
  }

  /**
   * 푸터 생성
   */
  private generateFooter(files: DocumentFileInfo[]): string {
    const totalChars = files.reduce((sum, file) => sum + file.characters, 0);
    const avgChars = Math.round(totalChars / files.length);
    
    return `

---

## Document Collection Summary

**Total Documents**: ${files.length}
**Total Characters**: ${totalChars.toLocaleString()}
**Average Characters**: ${avgChars}

**Generation Date**: ${new Date().toISOString().split('T')[0]}
**Content Type**: Simple Combined Summaries
**Processing**: Direct concatenation of individual character-limited files

*Generated automatically by SimpleLLMSComposer*`;
  }

  /**
   * 사용 가능한 character limit 조회
   * docs 디렉토리에서 실제 마크다운 파일들을 기반으로 config에 정의된 character limits 반환
   */
  async getAvailableCharacterLimits(language: string): Promise<number[]> {
    // Simple LLMS는 실제 docs 디렉토리에서 마크다운 파일들을 찾아야 함
    const languageDir = path.join(this.config.paths.docsDir, language);

    if (!existsSync(languageDir)) {
      console.warn(`⚠️  Language directory not found: ${languageDir}`);
      return [];
    }

    try {
      // docs 디렉토리에 마크다운 파일이 있는지 확인
      const markdownFiles = await this.findMarkdownFiles(languageDir);
      
      if (markdownFiles.length === 0) {
        console.warn(`⚠️  No markdown files found in ${languageDir}`);
        return [];
      }

      // config에 정의된 character limits 반환
      return this.config.generation.characterLimits;
    } catch (error) {
      console.warn(`⚠️  Failed to scan available limits: ${error}`);
      return [];
    }
  }

  /**
   * 특정 character limit의 통계 조회
   */
  async getCharacterLimitStats(language: string, characterLimit: number): Promise<{
    totalFiles: number;
    totalCharacters: number;
    averageCharacters: number;
    minCharacters: number;
    maxCharacters: number;
  }> {
    const files = await this.collectCharacterLimitFiles(language, characterLimit);
    
    if (files.length === 0) {
      return {
        totalFiles: 0,
        totalCharacters: 0,
        averageCharacters: 0,
        minCharacters: 0,
        maxCharacters: 0
      };
    }

    const characters = files.map(f => f.characters);
    const totalCharacters = characters.reduce((sum, chars) => sum + chars, 0);

    return {
      totalFiles: files.length,
      totalCharacters,
      averageCharacters: Math.round(totalCharacters / files.length),
      minCharacters: Math.min(...characters),
      maxCharacters: Math.max(...characters)
    };
  }

  /**
   * 출력 디렉토리가 없으면 생성
   */
  async ensureOutputDirectoryExists(language: string): Promise<void> {
    const outputDir = path.join(this.config.paths.outputDir, language);
    
    if (!existsSync(outputDir)) {
      console.log(`📁 Creating output directory: ${outputDir}`);
      try {
        await mkdir(outputDir, { recursive: true });
        console.log(`✅ Output directory created successfully`);
      } catch (error) {
        throw new Error(`Failed to create output directory: ${error}`);
      }
    }
  }

  /**
   * 데이터 디렉토리 초기화 (심볼릭 링크 또는 빈 디렉토리 생성)
   * @deprecated Simple LLMS는 docs 디렉토리에서 직접 읽어오므로 필요 없음. 다른 명령어들만 사용.
   */
  async createDataSymlink(): Promise<void> {
    const dataDir = this.config.paths.llmContentDir;
    
    // 이미 존재하면 스킵
    if (existsSync(dataDir)) {
      return;
    }

    const sourceDir = path.join(process.cwd(), 'packages', 'llms-generator', 'data');
    
    // packages/llms-generator/data가 존재하는지 확인
    if (existsSync(sourceDir)) {
      console.log(`🔗 Creating symlink: ${dataDir} → ${sourceDir}`);
      try {
        const { symlink } = await import('fs/promises');
        await symlink('packages/llms-generator/data', dataDir);
        console.log(`✅ Symlink created successfully`);
      } catch (error) {
        // 심볼릭 링크 실패 시 디렉토리 생성
        console.warn(`⚠️  Symlink failed, creating directory instead: ${error}`);
        await mkdir(dataDir, { recursive: true });
        console.log(`✅ Directory created instead of symlink`);
      }
    } else {
      // packages/llms-generator/data가 없으면 빈 디렉토리 생성
      console.log(`📁 Creating empty data directory: ${dataDir}`);
      await mkdir(dataDir, { recursive: true });
      console.log(`✅ Empty data directory created`);
      console.log(`💡 Tip: Add your .md files to ${dataDir}/[language]/[document-id]/`);
    }
  }

  /**
   * 디렉토리를 재귀적으로 스캔하여 모든 .md 파일 찾기
   */
  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // 'llms' 디렉토리는 제외 (출력 디렉토리)
          if (entry.name !== 'llms') {
            const subFiles = await this.findMarkdownFiles(fullPath);
            files.push(...subFiles);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to scan directory ${dir}: ${error}`);
    }
    
    return files;
  }

  /**
   * 콘텐츠를 character limit에 맞게 잘라내기
   */
  private truncateToCharacterLimit(content: string, characterLimit: number): string {
    if (content.length <= characterLimit) {
      return content;
    }
    
    // 단어 경계에서 자르기
    const truncated = content.substring(0, characterLimit);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > characterLimit * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * 파일 경로로부터 document ID 생성
   */
  private generateDocumentIdFromPath(filePath: string, languageDir: string): string {
    const relativePath = path.relative(languageDir, filePath);
    const pathWithoutExtension = relativePath.replace(/\.md$/, '');
    
    // PriorityGenerator와 동일한 로직 사용: 경로는 --, 단어 내부는 -
    const pathParts = pathWithoutExtension.split('/');
    
    return pathParts.join('--').toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{3,}/g, '--')  // 3개 이상 연속 대시를 --로 변환
      .replace(/^-+|-+$/g, ''); // 앞뒤 대시 제거
  }

  /**
   * 파일 경로로부터 제목 생성
   */
  private generateTitleFromFilePath(filePath: string): string {
    const filename = path.basename(filePath, '.md');
    return filename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * 파일 경로로부터 카테고리 추론
   */
  private inferCategoryFromPath(filePath: string): string {
    const pathParts = filePath.split(path.sep);
    
    // docs/en/guide/... → 'guide'
    // docs/ko/api/... → 'api'
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === 'docs' && i + 2 < pathParts.length) {
        return pathParts[i + 2]; // docs/[language]/[category]/...
      }
    }
    
    return 'misc';
  }
}