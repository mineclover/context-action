/**
 * LLMS 자동 생성 명령어
 * 
 * 사용자 검토/편집 완료된 요약 문서들을 기반으로 LLMS 파일을 자동 생성합니다.
 */

import { Command } from 'commander';
import { EnhancedConfigManager } from '../../core/EnhancedConfigManager.js';
import { LLMSAutoGenerator } from '../../core/LLMSAutoGenerator.js';
import { DocumentStatusManager } from '../../core/DocumentStatusManager.js';
import { globalPerformanceMonitor } from '../../infrastructure/monitoring/PerformanceMonitor.js';
// Default config inline definition
const DEFAULT_CONFIG = {
  paths: {
    docsDir: './docs',
    llmContentDir: './data',
    outputDir: './docs/llms',
    templatesDir: './templates',
    instructionsDir: './instructions'
  },
  generation: {
    supportedLanguages: ['ko', 'en'],
    characterLimits: [100, 300, 1000, 2000],
    defaultLanguage: 'ko',
    outputFormat: 'txt'
  }
};
import path from 'path';
import { existsSync } from 'fs';

export function createLLMSGenerateCommand(): Command {
  const command = new Command('llms-generate');
  
  command
    .description('준비된 문서들에 대해 LLMS 자동 생성')
    .option('-d, --document-id <id>', '특정 문서 ID에 대해서만 생성')
    .option('-l, --language <lang>', '특정 언어에 대해서만 생성')
    .option('--force', '상태에 관계없이 강제 생성')
    .option('--dry-run', '실제 파일 생성 없이 시뮬레이션만 실행')
    .option('--quiet', '최소한의 출력만 표시')
    .action(async (options) => {
      const startTime = Date.now();
      
      try {
        // 성능 모니터링 시작
        const monitor = globalPerformanceMonitor;

        console.log('🚀 LLMS 자동 생성 시작...\n');

        // 설정 로드 (기존 CLI와 동일한 방식)
        const enhancedConfigPath = path.join(process.cwd(), 'llms-generator.config.json');
        let config;
        
        if (existsSync(enhancedConfigPath)) {
          const enhancedConfigManager = new EnhancedConfigManager(enhancedConfigPath);
          const enhancedConfig = await enhancedConfigManager.loadConfig();
          
          // Convert enhanced config to internal format
          const projectRoot = process.cwd();
          config = {
            ...DEFAULT_CONFIG,
            paths: {
              docsDir: path.resolve(projectRoot, enhancedConfig.paths?.docsDir || './docs'),
              llmContentDir: path.resolve(projectRoot, enhancedConfig.paths?.llmContentDir || './data'),
              outputDir: path.resolve(projectRoot, enhancedConfig.paths?.outputDir || './docs/llms'),
              templatesDir: path.resolve(projectRoot, enhancedConfig.paths?.templatesDir || './templates'),
              instructionsDir: path.resolve(projectRoot, enhancedConfig.paths?.instructionsDir || './instructions')
            },
            generation: {
              supportedLanguages: enhancedConfig.generation?.supportedLanguages || ['ko', 'en'],
              characterLimits: enhancedConfig.generation?.characterLimits || [100, 300, 1000, 2000],
              defaultLanguage: enhancedConfig.generation?.defaultLanguage || 'ko',
              outputFormat: enhancedConfig.generation?.outputFormat || 'txt'
            }
          };
        } else {
          config = DEFAULT_CONFIG;
        }
        
        // 옵션 검증 및 기본값 설정
        const validatedOptions = validateAndSetDefaults(options, config);
        
        if (!options.quiet) {
          console.log('📋 LLMS 생성 설정:');
          console.log(`   • 문서 ID: ${validatedOptions.documentId || '전체'}`);
          console.log(`   • 언어: ${validatedOptions.language || '전체'}`);
          console.log(`   • 강제 모드: ${validatedOptions.force ? '활성화' : '비활성화'}`);
          console.log(`   • 드라이런 모드: ${validatedOptions.dryRun ? '활성화' : '비활성화'}`);
          console.log('');
        }

        // LLMS 생성 실행
        const result = await performLLMSGeneration(validatedOptions, config);
        
        // 결과 출력
        await displayResults(result, options);
        
        // 성능 모니터링 기록
        monitor.recordMetric({
          name: 'llms-generate-duration',
          value: Date.now() - startTime,
          unit: 'ms',
          timestamp: new Date(),
          category: 'execution',
          context: {
            success: result.success,
            filesGenerated: result.summary.filesGenerated,
            errors: result.errors.length
          }
        });

        const duration = Date.now() - startTime;
        
        if (!options.quiet) {
          console.log(`\n⏱️ 실행 시간: ${duration}ms`);
          console.log('🎉 LLMS 자동 생성이 완료되었습니다.');
        }

      } catch (error) {
        console.error('❌ LLMS 생성 중 오류가 발생했습니다:', error);
        process.exit(1);
      }
    });

  return command;
}

/**
 * 옵션 검증 및 기본값 설정
 */
function validateAndSetDefaults(options: any, config: any): any {
  const validatedOptions = { ...options };

  // 언어 검증
  if (validatedOptions.language) {
    const supportedLanguages = config.generation?.supportedLanguages || ['ko', 'en'];
    if (!supportedLanguages.includes(validatedOptions.language)) {
      throw new Error(`지원되지 않는 언어: ${validatedOptions.language}. 지원 언어: ${supportedLanguages.join(', ')}`);
    }
  }

  return validatedOptions;
}

/**
 * LLMS 생성 실행
 */
async function performLLMSGeneration(options: any, config: any): Promise<any> {
  const generator = new LLMSAutoGenerator(config);
  const statusManager = new DocumentStatusManager(config);

  if (options.documentId && options.language) {
    // 특정 문서에 대해 생성
    console.log(`📄 특정 문서 LLMS 생성: ${options.documentId} (${options.language})`);
    
    if (options.dryRun) {
      return {
        success: true,
        generatedFiles: [`[DRY-RUN] ${options.documentId}.txt`],
        errors: [],
        summary: {
          documentsProcessed: 1,
          filesGenerated: 1,
          totalCharacters: 0
        }
      };
    }

    // 강제 모드가 아니면 상태 확인
    if (!options.force) {
      const currentStatus = await statusManager.getCurrentStatus(options.documentId);
      const readyStatuses = [
        'ready_for_llms',
        'edit_completed', 
        'review_completed'
      ];
      
      if (!readyStatuses.includes(currentStatus)) {
        throw new Error(`문서 ${options.documentId}가 LLMS 생성 준비 상태가 아닙니다. 현재 상태: ${currentStatus}`);
      }
    }

    const llmsFile = await generator.generateLLMSForDocument(options.documentId, options.language);
    
    return {
      success: true,
      generatedFiles: [llmsFile],
      errors: [],
      summary: {
        documentsProcessed: 1,
        filesGenerated: 1,
        totalCharacters: 0
      }
    };
  } else {
    // 모든 준비된 문서에 대해 생성
    console.log('📋 모든 준비된 문서에 대해 LLMS 생성...');
    
    if (options.dryRun) {
      return {
        success: true,
        generatedFiles: ['[DRY-RUN] Multiple files would be generated'],
        errors: [],
        summary: {
          documentsProcessed: 5,
          filesGenerated: 5,
          totalCharacters: 0
        }
      };
    }

    return await generator.generateLLMSForReadyDocuments();
  }
}

/**
 * 결과 출력
 */
async function displayResults(result: any, options: any): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('📊 LLMS 생성 결과');
  console.log('='.repeat(60));
  
  console.log(`📈 요약:`);
  console.log(`   • 처리된 문서: ${result.summary.documentsProcessed}개`);
  console.log(`   • 생성된 파일: ${result.summary.filesGenerated}개`);
  console.log(`   • 오류: ${result.errors.length}개`);
  
  if (result.generatedFiles.length > 0 && !options.quiet) {
    console.log('\n✅ 생성된 파일들:');
    result.generatedFiles.forEach((file: string) => {
      console.log(`   • ${file}`);
    });
  }

  if (result.errors.length > 0) {
    console.log('\n❌ 오류 목록:');
    result.errors.forEach((error: string) => {
      console.log(`   • ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  if (result.success) {
    console.log('✅ LLMS 생성이 성공적으로 완료되었습니다.');
  } else {
    console.log('⚠️ LLMS 생성이 일부 오류와 함께 완료되었습니다.');
  }
  console.log('='.repeat(60));
}