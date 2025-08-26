/* eslint-disable no-console */
import { promises as fs } from 'fs';
import path from 'path';
import { EnhancedLLMSConfig } from '../../types/config.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SyncDocsOptions {
  changedFiles: string[];     // 변경된 문서 파일 목록
  quiet?: boolean;           // 조용한 모드
  dryRun?: boolean;          // 미리보기 모드
  force?: boolean;           // 강제 업데이트
  languages?: string[];      // 처리할 언어 필터 (예: ['en', 'ko'])
  includeKorean?: boolean;   // 한국어 문서 처리 활성화 (기본: true)
  onlyKorean?: boolean;      // 한국어 문서만 처리
  onlyEnglish?: boolean;     // 영어 문서만 처리
}

export interface DocumentChange {
  filePath: string;
  changeType: 'added' | 'modified' | 'deleted';
  category: string;
  language: string;
  documentId: string;
  affectedOutputs: {
    priorityJson: boolean;
    templates: number[]; // character limits
    llmsFiles: string[];
  };
}

export class SyncDocsCommand {
  constructor(private config: EnhancedLLMSConfig) {}

  async execute(options: SyncDocsOptions): Promise<void> {
    try {
      if (!options.quiet) {
        console.log('📝 Syncing documentation changes...');
        
        // 언어 필터링 정보 출력
        if (options.onlyKorean) {
          console.log('🇰🇷 Processing Korean documents only');
        } else if (options.onlyEnglish) {
          console.log('🇺🇸 Processing English documents only');
        } else if (options.languages) {
          console.log(`🌐 Processing languages: ${options.languages.join(', ')}`);
        } else if (options.includeKorean === false) {
          console.log('🇺🇸 Korean document processing disabled');
        }
      }

      // 1. 입력 검증 및 필터링
      if (!options.quiet) {
        console.log(`🔍 Input files to analyze: ${options.changedFiles.join(', ')}`);
      }
      
      const validChangedFiles = await this.validateAndFilterChangedFiles(options.changedFiles, options);
      
      if (!options.quiet) {
        console.log(`🔍 Valid files after filtering: ${validChangedFiles.join(', ')}`);
      }
      
      if (validChangedFiles.length === 0) {
        if (!options.quiet) {
          console.log('✅ No relevant documentation changes detected');
        }
        return;
      }

      if (!options.quiet) {
        console.log(`🔍 Processing ${validChangedFiles.length} changed file(s):`);
        validChangedFiles.forEach(file => console.log(`   - ${file}`));
        console.log();
      }

      // 2. 변경 분석
      const documentChanges = await this.analyzeChanges(validChangedFiles);

      if (documentChanges.length === 0) {
        if (!options.quiet) {
          console.log('✅ No processing required for the changed files');
        }
        return;
      }

      // 3. Dry run 모드 처리
      if (options.dryRun) {
        await this.showDryRunPreview(documentChanges);
        return;
      }

      // 4. 선택적 재생성 수행
      const updatedFiles = await this.performSelectiveRegeneration(documentChanges, options.quiet);

      // 5. Git 스테이징 업데이트
      if (updatedFiles.length > 0) {
        await this.updateGitStaging(updatedFiles, options.quiet);
      }

      if (!options.quiet) {
        console.log(`✅ Documentation sync completed! Updated ${updatedFiles.length} file(s)`);
      }

    } catch (error) {
      if (!options.quiet) {
        console.error('❌ Error during documentation sync:', error instanceof Error ? error.message : error);
      }
      // pre-commit에서 실패해도 커밋을 차단하지 않도록 조용히 종료
      if (options.quiet) {
        process.exit(0);
      }
      throw error;
    }
  }

  private async validateAndFilterChangedFiles(changedFiles: string[], options: SyncDocsOptions): Promise<string[]> {
    const validFiles: string[] = [];

    for (let filePath of changedFiles) {
      // 절대 경로를 상대 경로로 변환
      if (path.isAbsolute(filePath)) {
        const cwd = process.cwd();
        filePath = path.relative(cwd, filePath);
      }

      // docs/(en|ko)/**/*.md 패턴만 처리
      const docMatch = filePath.match(/^docs\/(en|ko)\/.*\.md$/);
      if (!docMatch) {
        continue;
      }

      const language = docMatch[1]; // 'en' 또는 'ko'

      // 언어 필터링 적용
      if (!this.shouldProcessLanguage(language, options)) {
        if (!options.quiet) {
          console.log(`⏭️  Skipping ${language} document: ${filePath}`);
        }
        continue;
      }

      // llms/ 디렉토리는 제외 (무한 루프 방지)
      if (filePath.includes('/llms/')) {
        continue;
      }

      // 파일 존재 여부 확인 (삭제된 파일도 처리 필요)
      try {
        await fs.access(filePath);
        validFiles.push(filePath);
      } catch {
        // 삭제된 파일도 처리할 수 있지만, 현재는 존재하는 파일만 처리
        continue;
      }
    }

    return validFiles;
  }

  private shouldProcessLanguage(language: string, options: SyncDocsOptions): boolean {
    // 명시적 언어 필터가 있는 경우
    if (options.languages && options.languages.length > 0) {
      return options.languages.includes(language);
    }

    // 한국어만 처리
    if (options.onlyKorean) {
      return language === 'ko';
    }

    // 영어만 처리
    if (options.onlyEnglish) {
      return language === 'en';
    }

    // 한국어 처리 비활성화
    if (options.includeKorean === false && language === 'ko') {
      return false;
    }

    // 기본값: 모든 언어 처리
    return true;
  }

  private async analyzeChanges(validFiles: string[]): Promise<DocumentChange[]> {
    const changes: DocumentChange[] = [];

    for (const filePath of validFiles) {
      try {
        const change = await this.analyzeDocumentChange(filePath);
        if (change) {
          changes.push(change);
        }
      } catch (error) {
        console.warn(`⚠️  Warning: Could not analyze ${filePath}:`, error instanceof Error ? error.message : error);
      }
    }

    return changes;
  }

  private async analyzeDocumentChange(filePath: string): Promise<DocumentChange | null> {
    // 파일 경로에서 정보 추출: docs/언어/카테고리/파일명.md
    const pathParts = filePath.split('/');
    if (pathParts.length < 3) {
      return null;
    }

    const language = pathParts[1]; // en 또는 ko
    const category = pathParts[2]; // guide, concept, api 등
    const fileName = path.basename(filePath, '.md');
    
    // documentId 생성: language_category_filename
    const documentId = `${language}_${category}_${fileName}`;

    // 기본 character limits (config에서 가져오거나 기본값 사용)
    const characterLimits = this.config.generation?.characterLimits || [100, 300, 500, 1000];

    return {
      filePath,
      changeType: 'modified', // 현재는 수정된 파일만 처리
      category,
      language,
      documentId,
      affectedOutputs: {
        priorityJson: true, // 항상 priority.json 업데이트
        templates: characterLimits, // 모든 character limits의 템플릿 업데이트
        llmsFiles: [] // 현재는 LLMS 파일 자동 업데이트하지 않음
      }
    };
  }

  private async showDryRunPreview(changes: DocumentChange[]): Promise<void> {
    console.log('🔍 Dry run preview - Changes that would be made:\n');
    
    for (const change of changes) {
      console.log(`📄 ${change.filePath} (${change.changeType})`);
      console.log(`   Language: ${change.language}, Category: ${change.category}`);
      console.log(`   Document ID: ${change.documentId}`);
      
      if (change.affectedOutputs.priorityJson) {
        console.log(`   → Would update: priority.json`);
      }
      
      if (change.affectedOutputs.templates.length > 0) {
        console.log(`   → Would update templates for: ${change.affectedOutputs.templates.join(', ')} character limits`);
      }
      
      console.log();
    }
  }

  private async performSelectiveRegeneration(changes: DocumentChange[], quiet = false): Promise<string[]> {
    const updatedFiles: string[] = [];

    for (const change of changes) {
      if (!quiet) {
        console.log(`🔄 Processing ${change.documentId}...`);
      }

      try {
        // Priority JSON 업데이트 (간단한 버전으로 구현)
        if (change.affectedOutputs.priorityJson) {
          const priorityFile = await this.ensurePriorityJson(change);
          if (priorityFile) {
            updatedFiles.push(priorityFile);
          }
        }

        // Template 파일 업데이트 (기존 GenerateTemplatesCommand 활용)
        if (change.affectedOutputs.templates.length > 0) {
          const templateFiles = await this.updateTemplates(change, quiet);
          updatedFiles.push(...templateFiles);
        }

      } catch (error) {
        console.warn(`⚠️  Warning: Could not process ${change.documentId}:`, error instanceof Error ? error.message : error);
      }
    }

    return updatedFiles;
  }

  private async ensurePriorityJson(change: DocumentChange): Promise<string | null> {
    const priorityPath = this.getPriorityJsonPath(change);
    
    try {
      // 파일 상태 확인
      const [priorityExists, sourceStats] = await Promise.all([
        fs.access(priorityPath).then(() => true).catch(() => false),
        fs.stat(change.filePath)
      ]);
      
      if (priorityExists) {
        // 기존 priority.json 읽기
        const existingContent = await fs.readFile(priorityPath, 'utf-8');
        const existingPriority = JSON.parse(existingContent);
        
        // 소스 파일이 더 최신인지 확인
        const priorityModified = new Date(existingPriority.source?.lastModified || 0);
        const sourceModified = new Date(sourceStats.mtime);
        
        if (sourceModified > priorityModified) {
          // 업데이트 필요 - 기존 메타데이터 유지하면서 업데이트
          const updatedPriority = {
            ...existingPriority,
            lastUpdated: new Date().toISOString(),
            source: {
              ...existingPriority.source,
              file: change.filePath,
              lastModified: sourceStats.mtime.toISOString()
            }
          };
          
          await fs.writeFile(priorityPath, JSON.stringify(updatedPriority, null, 2));
          return priorityPath;
        }
        
        return null; // 업데이트 불필요
      }
      
      // 새로 생성
      const sourceContent = await fs.readFile(change.filePath, 'utf-8');
      const title = this.extractTitle(sourceContent) || path.basename(change.filePath, '.md');
      
      const defaultPriority = {
        documentId: change.documentId,
        title: title,
        category: change.category,
        language: change.language,
        priority: 0.5,
        tags: this.extractTags(sourceContent),
        lastUpdated: new Date().toISOString(),
        source: {
          file: change.filePath,
          lastModified: sourceStats.mtime.toISOString()
        }
      };

      await fs.mkdir(path.dirname(priorityPath), { recursive: true });
      await fs.writeFile(priorityPath, JSON.stringify(defaultPriority, null, 2));
      
      return priorityPath;
    } catch (error) {
      console.warn(`⚠️  Warning: Could not process priority.json for ${change.documentId}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  private async updateTemplates(change: DocumentChange, quiet = false): Promise<string[]> {
    const updatedFiles: string[] = [];
    const characterLimits = change.affectedOutputs.templates;
    
    if (characterLimits.length === 0) {
      return updatedFiles;
    }
    
    try {
      // 소스 문서 읽기
      const sourceContent = await fs.readFile(change.filePath, 'utf-8');
      
      for (const limit of characterLimits) {
        const templatePath = this.getTemplatePath(change, limit);
        
        // 템플릿 파일이 이미 존재하는지 확인
        const templateExists = await fs.access(templatePath).then(() => true).catch(() => false);
        
        if (templateExists) {
          // 기존 템플릿 읽기
          const existingTemplate = await fs.readFile(templatePath, 'utf-8');
          
          // 템플릿이 비어있거나 placeholder인 경우에만 업데이트
          if (this.isTemplateEmpty(existingTemplate)) {
            const summary = this.generateSummary(sourceContent, limit, change);
            await fs.writeFile(templatePath, summary);
            updatedFiles.push(templatePath);
            
            if (!quiet) {
              console.log(`   ✅ Updated template: ${path.basename(templatePath)}`);
            }
          }
        } else {
          // 새 템플릿 생성
          const summary = this.generateSummary(sourceContent, limit, change);
          await fs.mkdir(path.dirname(templatePath), { recursive: true });
          await fs.writeFile(templatePath, summary);
          updatedFiles.push(templatePath);
          
          if (!quiet) {
            console.log(`   ✅ Created template: ${path.basename(templatePath)}`);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Warning: Could not update templates for ${change.documentId}:`, error instanceof Error ? error.message : error);
    }
    
    return updatedFiles;
  }

  private getPriorityJsonPath(change: DocumentChange): string {
    const llmsDataDir = this.config.paths?.llmContentDir || './llmsData';
    const fileName = path.basename(change.filePath, '.md');
    const docDirName = `${change.category}--${fileName}`;
    return path.join(llmsDataDir, change.language, docDirName, 'priority.json');
  }
  
  private getTemplatePath(change: DocumentChange, characterLimit: number): string {
    const llmsDataDir = this.config.paths?.llmContentDir || './llmsData';
    const fileName = path.basename(change.filePath, '.md');
    return path.join(llmsDataDir, change.language, change.category, `${fileName}-${characterLimit}.md`);
  }
  
  private extractTitle(content: string): string | null {
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^#\s+(.+)$/);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }
  
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract from keywords in headers
    const keywordMatch = content.match(/##\s*(?:Keywords?|Tags?|Topics?)[:\s]*([^\n]+)/i);
    if (keywordMatch) {
      const keywords = keywordMatch[1].split(/[,;]/).map(k => k.trim().toLowerCase());
      tags.push(...keywords.filter(k => k.length > 0));
    }
    
    // Extract from code fence languages
    const codeFences = content.match(/```(\w+)/g);
    if (codeFences) {
      const languages = codeFences.map(fence => fence.replace('```', '').toLowerCase());
      tags.push(...[...new Set(languages)]);
    }
    
    return [...new Set(tags)].slice(0, 10); // Limit to 10 unique tags
  }
  
  private isTemplateEmpty(content: string): boolean {
    // Check if template is empty or just a placeholder
    const trimmed = content.trim();
    return trimmed.length === 0 || 
           trimmed === 'TODO' || 
           trimmed.includes('placeholder') ||
           trimmed.includes('PLACEHOLDER');
  }
  
  private generateSummary(content: string, characterLimit: number, change: DocumentChange): string {
    // Extract title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Document';
    
    // Generate YAML frontmatter
    const frontmatter = `---
document_id: ${change.documentId}
category: ${change.category}
source_path: ${change.filePath.replace('docs/', '')}
character_limit: ${characterLimit}
last_update: '${new Date().toISOString()}'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---`;

    // Remove markdown formatting for summary
    const plainText = content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
      .replace(/[*_~`]/g, '') // Remove formatting characters
      .replace(/\n\n+/g, ' ') // Replace multiple newlines with space
      .replace(/\n/g, ' ') // Replace single newlines with space
      .trim();
    
    // Generate content summary based on character limit
    const availableChars = characterLimit - frontmatter.length - 20; // Reserve some space
    let contentSummary: string;
    
    if (availableChars <= 100) {
      // Very short summary - just title and brief description
      contentSummary = `${title}\n\n${this.getFirstSentence(plainText)}`;
    } else if (availableChars <= 300) {
      // Short summary - title and main points
      const mainPoints = this.extractMainPoints(content, 2);
      contentSummary = `${title}\n\n${plainText.slice(0, 150)}${mainPoints.length > 0 ? '\n\nKey points:\n' + mainPoints.join('\n') : ''}`;
    } else {
      // Longer summary - include more detail
      const mainPoints = this.extractMainPoints(content, Math.floor(availableChars / 100));
      contentSummary = `${title}\n\n${plainText.slice(0, availableChars * 0.6)}${mainPoints.length > 0 ? '\n\nKey points:\n' + mainPoints.join('\n') : ''}`;
    }
    
    // Truncate content to fit within remaining character limit
    contentSummary = this.truncateText(contentSummary, availableChars);
    
    return `${frontmatter}\n${contentSummary}`;
  }
  
  private getFirstSentence(text: string): string {
    const match = text.match(/^[^.!?]+[.!?]/);
    return match ? match[0].trim() : text.slice(0, 100);
  }
  
  private extractMainPoints(content: string, maxPoints: number): string[] {
    const points: string[] = [];
    
    // Look for list items
    const listItems = content.match(/^[-*+]\s+(.+)$/gm);
    if (listItems) {
      points.push(...listItems.slice(0, maxPoints).map(item => 
        item.replace(/^[-*+]\s+/, '• ').trim()
      ));
    }
    
    // Look for numbered items
    const numberedItems = content.match(/^\d+\.\s+(.+)$/gm);
    if (numberedItems && points.length < maxPoints) {
      points.push(...numberedItems.slice(0, maxPoints - points.length).map(item => 
        item.replace(/^\d+\.\s+/, '• ').trim()
      ));
    }
    
    return points.slice(0, maxPoints);
  }
  
  private truncateText(text: string, limit: number): string {
    if (text.length <= limit) {
      return text;
    }
    
    // Try to cut at a word boundary
    const truncated = text.slice(0, limit - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > limit * 0.8) {
      return truncated.slice(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  private async updateGitStaging(updatedFiles: string[], quiet = false): Promise<void> {
    if (updatedFiles.length === 0) {
      return;
    }

    try {
      // 업데이트된 파일들을 Git 스테이징에 추가
      const filesToAdd = [
        'llmsData/'
      ];

      // Note: Git staging will be handled by post-commit hook
      
      if (!quiet) {
        console.log(`📝 Generated ${updatedFiles.length} updated file(s)`);
      }
    } catch (error) {
      if (!quiet) {
        console.warn('⚠️  Warning: Could not process files:', error instanceof Error ? error.message : error);
      }
    }
  }
}