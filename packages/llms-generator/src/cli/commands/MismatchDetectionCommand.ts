/* eslint-disable no-console */
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { EnhancedLLMSConfig } from '../../types/config.js';

export interface MismatchDetectionOptions {
  outputFile?: string;           // 미스매치 리포트 출력 파일 경로 (기본: docs/llms-mismatch-report.md)
  autoFix?: boolean;             // 자동 수정 여부 (현재는 안전상 false만 지원)
  verbose?: boolean;             // 상세 출력
  checkOnly?: boolean;           // 검사만 수행하고 파일 생성 안 함
}

export interface MismatchItem {
  type: 'orphaned_llms' | 'missing_llms' | 'inconsistent_structure';
  severity: 'high' | 'medium' | 'low';
  sourcePath?: string;           // docs/ 경로의 원본 문서
  llmsPath: string;             // llmsData/ 경로의 LLMS 파일/디렉토리
  description: string;          // 미스매치 설명
  suggestedAction: string;      // 권장 조치
  category: string;             // 문서 카테고리 (guide, concept, examples 등)
  language: string;             // 언어 (en, ko)
}

export interface MismatchReport {
  generatedAt: string;
  totalMismatches: number;
  summary: {
    orphanedLlms: number;        // 원본이 없는 LLMS 파일들
    missingLlms: number;         // LLMS 파일이 없는 원본 문서들
    inconsistentStructure: number; // 구조가 일치하지 않는 것들
  };
  mismatches: MismatchItem[];
}

export class MismatchDetectionCommand {
  constructor(private config: EnhancedLLMSConfig) {}

  async execute(options: MismatchDetectionOptions = {}): Promise<MismatchReport> {
    const report: MismatchReport = {
      generatedAt: new Date().toISOString(),
      totalMismatches: 0,
      summary: {
        orphanedLlms: 0,
        missingLlms: 0,
        inconsistentStructure: 0
      },
      mismatches: []
    };

    try {
      if (options.verbose) {
        console.log('🔍 Starting mismatch detection...');
      }

      // 1. 원본 문서와 LLMS 데이터 수집
      const sourceDocuments = await this.collectSourceDocuments();
      const llmsData = await this.collectLLMSData();

      if (options.verbose) {
        console.log(`📚 Found ${sourceDocuments.length} source documents`);
        console.log(`🤖 Found ${llmsData.length} LLMS entries`);
      }

      // 2. 미스매치 검사
      await this.detectOrphanedLLMS(sourceDocuments, llmsData, report);
      await this.detectMissingLLMS(sourceDocuments, llmsData, report);
      await this.detectInconsistentStructures(llmsData, report);

      // 3. 통계 업데이트
      report.totalMismatches = report.mismatches.length;
      report.summary.orphanedLlms = report.mismatches.filter(m => m.type === 'orphaned_llms').length;
      report.summary.missingLlms = report.mismatches.filter(m => m.type === 'missing_llms').length;
      report.summary.inconsistentStructure = report.mismatches.filter(m => m.type === 'inconsistent_structure').length;

      // 4. 리포트 출력
      if (!options.checkOnly) {
        await this.generateReport(report, options);
      }

      if (options.verbose) {
        console.log(`✅ Mismatch detection completed. Found ${report.totalMismatches} mismatches.`);
      }

      return report;

    } catch (error) {
      console.error('❌ Error during mismatch detection:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  private async collectSourceDocuments(): Promise<Array<{ path: string; language: string; category: string; documentId: string }>> {
    const documents: Array<{ path: string; language: string; category: string; documentId: string }> = [];
    
    // docs/(en|ko)/**/*.md 패턴으로 문서 검색
    const pattern = 'docs/{en,ko}/**/*.md';
    const files = await glob(pattern, { 
      ignore: ['**/llms/**', '**/api/**'], // llms와 api 디렉토리는 제외
      cwd: process.cwd()
    });

    for (const filePath of files) {
      const pathParts = filePath.split('/');
      if (pathParts.length < 3) continue;

      const language = pathParts[1];
      const category = pathParts[2];
      const fileName = path.basename(filePath, '.md');
      const documentId = this.generateDocumentId(language, category, fileName);

      documents.push({
        path: filePath,
        language,
        category,
        documentId
      });
    }

    return documents;
  }

  private async collectLLMSData(): Promise<Array<{ path: string; language: string; category: string; documentId: string; type: 'directory' | 'file' }>> {
    const llmsData: Array<{ path: string; language: string; category: string; documentId: string; type: 'directory' | 'file' }> = [];
    const llmsDir = this.config.paths?.llmContentDir || './llmsData';

    try {
      await fs.access(llmsDir);
    } catch {
      // llmsData 디렉토리가 없으면 빈 배열 반환
      return llmsData;
    }

    // llmsData/{언어}/ 구조 탐색
    const languages = await fs.readdir(llmsDir, { withFileTypes: true });

    for (const langDir of languages) {
      if (!langDir.isDirectory() || !['en', 'ko'].includes(langDir.name)) {
        continue;
      }

      const language = langDir.name;
      const langPath = path.join(llmsDir, language);

      try {
        const entries = await fs.readdir(langPath, { withFileTypes: true });

        for (const entry of entries) {
          const entryPath = path.join(langPath, entry.name);
          
          if (entry.isDirectory()) {
            // category--filename 형태의 디렉토리
            const match = entry.name.match(/^(.+?)--(.+)$/);
            if (match) {
              const [, category, fileName] = match;
              const documentId = this.generateDocumentId(language, category, fileName);

              llmsData.push({
                path: entryPath,
                language,
                category,
                documentId,
                type: 'directory'
              });
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Warning: Could not read ${langPath}:`, error instanceof Error ? error.message : error);
      }
    }

    return llmsData;
  }

  private generateDocumentId(language: string, category: string, fileName: string): string {
    return `${language}_${category}_${fileName}`;
  }

  private async detectOrphanedLLMS(
    sourceDocuments: Array<{ path: string; language: string; category: string; documentId: string }>,
    llmsData: Array<{ path: string; language: string; category: string; documentId: string; type: 'directory' | 'file' }>,
    report: MismatchReport
  ): Promise<void> {
    const sourceIds = new Set(sourceDocuments.map(doc => doc.documentId));

    for (const llmsEntry of llmsData) {
      if (!sourceIds.has(llmsEntry.documentId)) {
        const expectedSourcePath = this.reconstructSourcePath(llmsEntry);
        
        report.mismatches.push({
          type: 'orphaned_llms',
          severity: 'medium',
          sourcePath: expectedSourcePath,
          llmsPath: llmsEntry.path,
          description: `LLMS data exists but corresponding source document is missing`,
          suggestedAction: `Check if '${expectedSourcePath}' was deleted or moved. Consider removing orphaned LLMS data.`,
          category: llmsEntry.category,
          language: llmsEntry.language
        });
      }
    }
  }

  private async detectMissingLLMS(
    sourceDocuments: Array<{ path: string; language: string; category: string; documentId: string }>,
    llmsData: Array<{ path: string; language: string; category: string; documentId: string; type: 'directory' | 'file' }>,
    report: MismatchReport
  ): Promise<void> {
    const llmsIds = new Set(llmsData.map(entry => entry.documentId));

    for (const sourceDoc of sourceDocuments) {
      if (!llmsIds.has(sourceDoc.documentId)) {
        const expectedLlmsPath = this.constructLLMSPath(sourceDoc);
        
        report.mismatches.push({
          type: 'missing_llms',
          severity: 'low',
          sourcePath: sourceDoc.path,
          llmsPath: expectedLlmsPath,
          description: `Source document exists but LLMS data is missing`,
          suggestedAction: `Run 'pnpm llms:sync-docs --changed-files ${sourceDoc.path}' to generate LLMS data.`,
          category: sourceDoc.category,
          language: sourceDoc.language
        });
      }
    }
  }

  private async detectInconsistentStructures(
    llmsData: Array<{ path: string; language: string; category: string; documentId: string; type: 'directory' | 'file' }>,
    report: MismatchReport
  ): Promise<void> {
    for (const llmsEntry of llmsData) {
      if (llmsEntry.type === 'directory') {
        try {
          const issues = await this.checkLLMSDirectoryStructure(llmsEntry.path);
          
          for (const issue of issues) {
            report.mismatches.push({
              type: 'inconsistent_structure',
              severity: 'low',
              llmsPath: llmsEntry.path,
              description: issue.description,
              suggestedAction: issue.suggestedAction,
              category: llmsEntry.category,
              language: llmsEntry.language
            });
          }
        } catch (error) {
          report.mismatches.push({
            type: 'inconsistent_structure',
            severity: 'high',
            llmsPath: llmsEntry.path,
            description: `Cannot access LLMS directory: ${error instanceof Error ? error.message : error}`,
            suggestedAction: `Check if directory permissions are correct or if directory exists.`,
            category: llmsEntry.category,
            language: llmsEntry.language
          });
        }
      }
    }
  }

  private async checkLLMSDirectoryStructure(llmsPath: string): Promise<Array<{ description: string; suggestedAction: string }>> {
    const issues: Array<{ description: string; suggestedAction: string }> = [];

    try {
      const entries = await fs.readdir(llmsPath);
      
      // priority.json 확인
      const hasPriorityJson = entries.includes('priority.json');
      if (!hasPriorityJson) {
        issues.push({
          description: 'Missing priority.json file',
          suggestedAction: 'Run sync-docs command to generate priority.json'
        });
      }

      // 템플릿 파일들 확인 (기본 character limits)
      const expectedLimits = this.config.generation?.characterLimits || [100, 300, 500, 1000];
      const templateFiles = entries.filter(name => name.match(/-\d+\.md$/));

      if (templateFiles.length === 0) {
        issues.push({
          description: 'No template files found',
          suggestedAction: 'Run sync-docs command to generate template files'
        });
      } else {
        // 예상되는 템플릿 파일들이 모두 있는지 확인
        const presentLimits = templateFiles
          .map(name => {
            const match = name.match(/-(\d+)\.md$/);
            return match ? parseInt(match[1]) : null;
          })
          .filter(limit => limit !== null) as number[];

        const missingLimits = expectedLimits.filter(limit => !presentLimits.includes(limit));
        if (missingLimits.length > 0) {
          issues.push({
            description: `Missing template files for character limits: ${missingLimits.join(', ')}`,
            suggestedAction: 'Run sync-docs command to generate missing template files'
          });
        }
      }

    } catch (error) {
      issues.push({
        description: `Cannot read directory contents: ${error instanceof Error ? error.message : error}`,
        suggestedAction: 'Check directory permissions and existence'
      });
    }

    return issues;
  }

  private reconstructSourcePath(llmsEntry: { path: string; language: string; category: string; documentId: string }): string {
    // category--filename에서 filename 추출
    const dirName = path.basename(llmsEntry.path);
    const match = dirName.match(/^(.+?)--(.+)$/);
    
    if (match) {
      const [, category, fileName] = match;
      return `docs/${llmsEntry.language}/${category}/${fileName}.md`;
    }
    
    return `docs/${llmsEntry.language}/${llmsEntry.category}/[unknown].md`;
  }

  private constructLLMSPath(sourceDoc: { path: string; language: string; category: string; documentId: string }): string {
    const llmsDir = this.config.paths?.llmContentDir || './llmsData';
    const fileName = path.basename(sourceDoc.path, '.md');
    const docDirName = `${sourceDoc.category}--${fileName}`;
    return path.join(llmsDir, sourceDoc.language, docDirName);
  }

  private async generateReport(report: MismatchReport, options: MismatchDetectionOptions): Promise<void> {
    const outputFile = options.outputFile || 'docs/llms-mismatch-report.md';
    
    const reportContent = this.formatReportAsMarkdown(report);
    
    try {
      // 출력 디렉토리 확인 및 생성
      const outputDir = path.dirname(outputFile);
      await fs.mkdir(outputDir, { recursive: true });
      
      // 리포트 파일 작성
      await fs.writeFile(outputFile, reportContent, 'utf-8');
      
      if (options.verbose) {
        console.log(`📄 Mismatch report generated: ${outputFile}`);
      }
    } catch (error) {
      console.error(`❌ Failed to write report to ${outputFile}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  private formatReportAsMarkdown(report: MismatchReport): string {
    const content = [
      '# LLMS Data Mismatch Report',
      '',
      `**Generated at:** ${new Date(report.generatedAt).toLocaleString()}`,
      `**Total mismatches:** ${report.totalMismatches}`,
      '',
      '## Summary',
      '',
      `- **Orphaned LLMS files:** ${report.summary.orphanedLlms} (LLMS data without source documents)`,
      `- **Missing LLMS data:** ${report.summary.missingLlms} (Source documents without LLMS data)`,
      `- **Inconsistent structures:** ${report.summary.inconsistentStructure} (Structural issues in LLMS directories)`,
      '',
    ];

    if (report.totalMismatches === 0) {
      content.push('✅ **No mismatches found!** All documentation is in sync.');
      content.push('');
    } else {
      // 심각도별 그룹핑
      const groupedMismatches = {
        high: report.mismatches.filter(m => m.severity === 'high'),
        medium: report.mismatches.filter(m => m.severity === 'medium'),
        low: report.mismatches.filter(m => m.severity === 'low')
      };

      for (const [severity, mismatches] of Object.entries(groupedMismatches)) {
        if (mismatches.length === 0) continue;

        const emoji = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : 'ℹ️';
        content.push(`## ${emoji} ${severity.toUpperCase()} Severity (${mismatches.length})`);
        content.push('');

        for (const mismatch of mismatches) {
          content.push(`### ${this.getMismatchTitle(mismatch)}`);
          content.push('');
          content.push(`**Type:** ${mismatch.type.replace('_', ' ')}`);
          content.push(`**Language:** ${mismatch.language}`);
          content.push(`**Category:** ${mismatch.category}`);
          if (mismatch.sourcePath) {
            content.push(`**Source Path:** \`${mismatch.sourcePath}\``);
          }
          content.push(`**LLMS Path:** \`${mismatch.llmsPath}\``);
          content.push('');
          content.push(`**Description:** ${mismatch.description}`);
          content.push('');
          content.push(`**Suggested Action:** ${mismatch.suggestedAction}`);
          content.push('');
          content.push('---');
          content.push('');
        }
      }

      // 자동 수정 명령어 제안
      content.push('## Batch Fix Commands');
      content.push('');
      content.push('### For missing LLMS data:');
      content.push('```bash');
      const missingLlms = report.mismatches.filter(m => m.type === 'missing_llms');
      if (missingLlms.length > 0) {
        const sourceFiles = missingLlms.map(m => m.sourcePath).filter(Boolean);
        if (sourceFiles.length > 0) {
          content.push(`pnpm llms:sync-docs --changed-files "${sourceFiles.join(' ')}"`);
        }
      } else {
        content.push('# No missing LLMS data');
      }
      content.push('```');
      content.push('');

      content.push('### For orphaned LLMS files:');
      content.push('```bash');
      content.push('# ⚠️ Be careful with deletion! Review each case manually:');
      const orphanedLlms = report.mismatches.filter(m => m.type === 'orphaned_llms');
      for (const orphaned of orphanedLlms) {
        content.push(`# rm -rf "${orphaned.llmsPath}"  # Check: ${orphaned.sourcePath || 'unknown source'}`);
      }
      if (orphanedLlms.length === 0) {
        content.push('# No orphaned LLMS files');
      }
      content.push('```');
    }

    content.push('');
    content.push('---');
    content.push('*This report was automatically generated by the LLMS Mismatch Detection system.*');
    content.push('');

    return content.join('\n');
  }

  private getMismatchTitle(mismatch: MismatchItem): string {
    const pathDisplay = mismatch.sourcePath || path.basename(mismatch.llmsPath);
    return `${pathDisplay} [${mismatch.language.toUpperCase()}/${mismatch.category}]`;
  }
}