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
      }

      // 1. 입력 검증 및 필터링
      if (!options.quiet) {
        console.log(`🔍 Input files to analyze: ${options.changedFiles.join(', ')}`);
      }
      
      const validChangedFiles = await this.validateAndFilterChangedFiles(options.changedFiles);
      
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

  private async validateAndFilterChangedFiles(changedFiles: string[]): Promise<string[]> {
    const validFiles: string[] = [];

    for (let filePath of changedFiles) {
      // 절대 경로를 상대 경로로 변환
      if (path.isAbsolute(filePath)) {
        const cwd = process.cwd();
        filePath = path.relative(cwd, filePath);
      }

      // docs/(en|ko)/**/*.md 패턴만 처리
      const isDocFile = /^docs\/(en|ko)\/.*\.md$/.test(filePath);
      
      if (!isDocFile) {
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
      // 이미 존재하는지 확인
      await fs.access(priorityPath);
      return null; // 이미 존재하면 업데이트하지 않음
    } catch {
      // 존재하지 않으면 기본 priority.json 생성
      const defaultPriority = {
        documentId: change.documentId,
        title: path.basename(change.filePath, '.md'),
        category: change.category,
        language: change.language,
        priority: 0.5, // 기본 우선순위
        tags: [],
        lastUpdated: new Date().toISOString(),
        source: {
          file: change.filePath,
          lastModified: new Date().toISOString()
        }
      };

      await fs.mkdir(path.dirname(priorityPath), { recursive: true });
      await fs.writeFile(priorityPath, JSON.stringify(defaultPriority, null, 2));
      
      return priorityPath;
    }
  }

  private async updateTemplates(_change: DocumentChange, _quiet = false): Promise<string[]> {
    // GenerateTemplatesCommand를 활용하여 특정 문서의 템플릿만 업데이트
    // 현재는 간단한 버전으로 구현
    return [];
  }

  private getPriorityJsonPath(change: DocumentChange): string {
    const docsDir = this.config.paths?.docsDir || './docs';
    return path.join(docsDir, change.language, 'llms', change.category, `${path.basename(change.filePath, '.md')}-priority.json`);
  }

  private async updateGitStaging(updatedFiles: string[], quiet = false): Promise<void> {
    if (updatedFiles.length === 0) {
      return;
    }

    try {
      // 업데이트된 파일들을 Git 스테이징에 추가
      const filesToAdd = [
        'packages/llms-generator/data/',
        'docs/*/llms/'
      ];

      for (const pattern of filesToAdd) {
        try {
          await execAsync(`git add ${pattern}`, { cwd: process.cwd() });
        } catch {
          // 파일이 없어도 에러 무시
        }
      }

      if (!quiet) {
        console.log(`📦 Added ${updatedFiles.length} updated file(s) to git staging`);
      }
    } catch (error) {
      if (!quiet) {
        console.warn('⚠️  Warning: Could not update git staging:', error instanceof Error ? error.message : error);
      }
    }
  }
}