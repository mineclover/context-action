/**
 * Pre-commit hook for Priority JSON validation
 * 
 * Husky pre-commit 훅에서 사용할 Priority JSON 검증 시스템
 * 100, 200, 300자 제한 중 누락된 것들을 체크하고 자동 수정 시도
 */

import { Command } from 'commander';
import { WorkStatusManager } from '../../core/WorkStatusManager.js';
import { EnhancedWorkStatusManager } from '../../core/EnhancedWorkStatusManager.js';
import { PriorityStatusAnalyzer } from '../../core/PriorityStatusAnalyzer.js';
import { globalPerformanceMonitor } from '../../infrastructure/monitoring/PerformanceMonitor.js';
import { DEFAULT_CONFIG } from '../../index.js';
import { ConfigManager } from '../../core/ConfigManager.js';
import { EnhancedConfigManager } from '../../core/EnhancedConfigManager.js';
import path from 'path';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';

export interface PreCommitConfig {
  dataDir: string;
  languages: string[];
  requiredLimits: number[];
  criticalLimits: number[];
  enableAutoFix: boolean;
  blockOnCritical: boolean;
  maxMissingFiles: number;
}

export interface PreCommitResult {
  success: boolean;
  canCommit: boolean;
  summary: {
    totalChecked: number;
    missingFiles: number;
    outdatedFiles: number;
    autoFixed: number;
    criticalIssues: number;
  };
  details: {
    blockers: string[];
    warnings: string[];
    autoFixed: string[];
    recommendations: string[];
  };
  reportPath?: string;
}

export function createPreCommitCheckCommand(): Command {
  const command = new Command('pre-commit-check');

  command
    .description('Git pre-commit hook에서 Priority JSON 파일들을 검증합니다 (config 기반)')
    .option('-d, --data-dir <dir>', 'Data 디렉토리 경로 (config 덮어씀)')
    .option('-l, --languages <langs>', '검증할 언어 (config 덮어씀)')
    .option('--required-limits <limits>', '필수 문자 제한 (config 덮어씀)')
    .option('--critical-limits <limits>', '중요 문자 제한 (config 덮어씀)')
    .option('--no-auto-fix', '자동 수정 비활성화', false)
    .option('--allow-critical', '중요 이슈에도 커밋 허용', false)
    .option('--max-missing <number>', '허용 가능한 최대 누락 파일 수 (config 덮어씀)')
    .option('--report <file>', '결과 리포트 파일 경로 (config 덮어씀)')
    .option('--strict', '엄격 모드 (모든 경고를 에러로 처리)', false)
    .option('--quiet', '간단한 출력만 표시 (config 덮어씀)', false)
    .action(async (options) => {
      const stopTiming = globalPerformanceMonitor.startTiming('pre-commit-check');

      try {
        // Enhanced config 로드
        const enhancedConfigManager = new EnhancedConfigManager();
        const enhancedConfig = await enhancedConfigManager.loadConfig();
        
        // Config에서 기본값 가져오기, CLI 옵션으로 덮어쓰기
        const preCommitConfig = enhancedConfig.preCommit || {};
        const validationConfig = preCommitConfig.validation || {};
        const rulesConfig = preCommitConfig.rules || {};
        
        const config: PreCommitConfig = {
          dataDir: options.dataDir || enhancedConfig.paths?.llmContentDir || './data',
          languages: options.languages 
            ? options.languages.split(',').map((l: string) => l.trim()) 
            : enhancedConfig.generation?.supportedLanguages || ['ko', 'en'],
          requiredLimits: options.requiredLimits 
            ? options.requiredLimits.split(',').map(Number)
            : validationConfig.requiredLimits || enhancedConfig.generation?.characterLimits || [100, 200, 300],
          criticalLimits: options.criticalLimits 
            ? options.criticalLimits.split(',').map(Number)
            : validationConfig.criticalLimits || [100, 200],
          enableAutoFix: options.noAutoFix ? false : (validationConfig.autoFix !== false),
          blockOnCritical: options.allowCritical ? false : (rulesConfig.blockOnCriticalMissing !== false),
          maxMissingFiles: options.maxMissing 
            ? parseInt(options.maxMissing)
            : validationConfig.maxMissingDocuments || 10
        };
        
        // 리포트 경로 설정
        const reportPath = options.report || validationConfig.reportPath;
        const quietMode = options.quiet !== undefined ? options.quiet : (validationConfig.quietMode || false);

        if (!quietMode) {
          console.log('🔍 Git pre-commit Priority JSON 검증을 시작합니다...\n');
          console.log(`📁 Data 디렉토리: ${config.dataDir}`);
          console.log(`🌐 언어: ${config.languages.join(', ')}`);
          console.log(`📏 필수 문자 제한: ${config.requiredLimits.join(', ')}`);
          console.log(`🔴 중요 문자 제한: ${config.criticalLimits.join(', ')}`);
          console.log(`🔧 자동 수정: ${config.enableAutoFix ? '활성화' : '비활성화'}`);
          console.log('');
        }

        const result = await performPreCommitCheck(config, quietMode);

        // 리포트 저장
        if (reportPath) {
          await saveReport(result, reportPath);
          if (!quietMode) {
            console.log(`📄 상세 리포트가 ${reportPath}에 저장되었습니다.`);
          }
        }

        // 결과 출력
        displayResults(result, quietMode, options.strict);

        // Exit code 설정
        if (!result.canCommit) {
          process.exit(1);
        } else if (!result.success) {
          process.exit(options.strict ? 1 : 0);
        }

      } catch (error) {
        console.error('❌ Pre-commit 검증 중 오류가 발생했습니다:', error);
        process.exit(1);
      } finally {
        stopTiming();
      }
    });

  return command;
}

/**
 * Pre-commit 검증 수행
 */
async function performPreCommitCheck(config: PreCommitConfig, quiet: boolean = false): Promise<PreCommitResult> {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const autoFixed: string[] = [];
  const recommendations: string[] = [];

  let totalChecked = 0;
  let missingFiles = 0;
  let outdatedFiles = 0;
  let criticalIssues = 0;

  try {
    // Enhanced WorkStatusManager 초기화 (config 기반)
    const workConfig = await ConfigManager.findAndLoadConfig();
    const workStatusManager = new EnhancedWorkStatusManager(workConfig);
    
    // PriorityStatusAnalyzer로 전체 현황 파악
    const analyzer = new PriorityStatusAnalyzer(config.dataDir, config.languages);
    const priorityReport = await analyzer.analyzeOverallStatus();

    if (!quiet) {
      console.log(`📊 총 ${priorityReport.summary.totalFiles}개의 Priority JSON 파일을 검사합니다...`);
    }

    totalChecked = priorityReport.summary.totalFiles;

    // 1. 중요한 이슈들 먼저 체크
    criticalIssues = await checkCriticalIssues(priorityReport, config, blockers);

    // 2. 각 언어별로 Enhanced 작업 상태 확인
    for (const language of config.languages) {
      const languageResult = await checkEnhancedLanguageWorkStatus(
        workStatusManager, 
        language, 
        config, 
        warnings, 
        autoFixed,
        recommendations
      );
      
      missingFiles += languageResult.missingFiles;
      outdatedFiles += languageResult.outdatedFiles;
    }

    // 3. 자동 수정 시도
    if (config.enableAutoFix && autoFixed.length === 0) {
      const autoFixResults = await attemptAutoFix(priorityReport, config);
      autoFixed.push(...autoFixResults);
    }

    // 4. 최종 검증
    const canCommit = shouldAllowCommit(blockers, warnings, missingFiles, config);

  } catch (error) {
    blockers.push(`검증 중 오류 발생: ${error}`);
    criticalIssues++;
  }

  return {
    success: blockers.length === 0,
    canCommit: blockers.length === 0,
    summary: {
      totalChecked,
      missingFiles,
      outdatedFiles,
      autoFixed: autoFixed.length,
      criticalIssues
    },
    details: {
      blockers,
      warnings,
      autoFixed,
      recommendations
    }
  };
}

/**
 * 중요한 이슈들 체크
 */
async function checkCriticalIssues(
  priorityReport: any,
  config: PreCommitConfig,
  blockers: string[]
): Promise<number> {
  let criticalIssues = 0;
  // 완전히 빈 파일들
  if (priorityReport.summary.emptyFiles > 0) {
    const message = `${priorityReport.summary.emptyFiles}개의 빈 Priority JSON 파일이 있습니다`;
    if (priorityReport.summary.emptyFiles > config.maxMissingFiles) {
      blockers.push(message);
      criticalIssues++;
    }
  }

  // 누락된 파일들
  if (priorityReport.summary.missingFiles > 0) {
    const message = `${priorityReport.summary.missingFiles}개의 Priority JSON 파일이 누락되었습니다`;
    if (priorityReport.summary.missingFiles > config.maxMissingFiles) {
      blockers.push(message);
      criticalIssues++;
    }
  }

  // 전체 완성률이 너무 낮은 경우
  if (priorityReport.summary.completionRate < 20) {
    const message = `전체 완성률이 ${priorityReport.summary.completionRate.toFixed(1)}%로 너무 낮습니다`;
    if (config.blockOnCritical) {
      blockers.push(message);
      criticalIssues++;
    }
  }
  
  return criticalIssues;
}

/**
 * Enhanced 언어별 작업 상태 확인
 */
async function checkEnhancedLanguageWorkStatus(
  workStatusManager: EnhancedWorkStatusManager,
  language: string,
  config: PreCommitConfig,
  warnings: string[],
  autoFixed: string[],
  recommendations: string[]
): Promise<{ missingFiles: number; outdatedFiles: number }> {
  let missingFiles = 0;
  let outdatedFiles = 0;

  try {
    // Enhanced 작업 상태 분석 수행
    const enhancedReport = await workStatusManager.generateEnhancedReport(language);
    const updateResult = await workStatusManager.updateAllWorkStatus(language);
    
    if (updateResult.errors.length > 0) {
      warnings.push(`${language}: ${updateResult.errors.length}개 문서 업데이트 실패`);
    }
    
    // Enhanced 분석 결과를 warnings와 recommendations에 반영
    if (enhancedReport.summary.urgentItems > 0) {
      warnings.push(`${language}: ${enhancedReport.summary.urgentItems}개의 긴급 처리 항목 발견`);
    }
    
    // 고품질 권장사항 추가
    for (const rec of enhancedReport.recommendations.slice(0, 3)) {
      recommendations.push(`${language}: ${rec.description} (${rec.estimatedTime} 예상)`);
    }

    // 각 필수 문자 제한별로 누락 파일 체크
    for (const limit of config.requiredLimits) {
      const workList = await workStatusManager.listWorkNeeded(language, {
        characterLimit: limit,
        needsUpdate: true
      });

      const missingForLimit = workList.filter(work => 
        !work.generatedFiles.find(f => f.charLimit === limit)?.exists
      );

      const outdatedForLimit = workList.filter(work => {
        const file = work.generatedFiles.find(f => f.charLimit === limit);
        return file?.exists && file.needsUpdate;
      });

      missingFiles += missingForLimit.length;
      outdatedFiles += outdatedForLimit.length;

      // 중요 문자 제한 체크
      if (config.criticalLimits.includes(limit)) {
        if (missingForLimit.length > 0) {
          const isCritical = missingForLimit.length > 3;
          const message = `${language}: ${limit}자 제한 파일 ${missingForLimit.length}개 누락`;
          
          if (isCritical && config.blockOnCritical) {
            warnings.push(message + ' (중요)');
          } else {
            warnings.push(message);
          }
        }
      }

      // Enhanced 권장사항 생성
      if (missingForLimit.length > 0) {
        const estimatedTime = missingForLimit.length * (limit <= 200 ? 8 : 12);
        const priority = config.criticalLimits.includes(limit) ? '중요' : '일반';
        recommendations.push(
          `${language}: ${limit}자 제한 파일 ${missingForLimit.length}개 생성 필요 (${priority}, 예상 ${estimatedTime}분)`
        );
      }
    }

  } catch (error) {
    warnings.push(`${language} 언어 처리 중 오류: ${error}`);
  }

  return { missingFiles, outdatedFiles };
}

/**
 * 자동 수정 시도
 */
async function attemptAutoFix(priorityReport: any, config: PreCommitConfig): Promise<string[]> {
  const autoFixed: string[] = [];

  try {
    // 빈 Priority JSON 파일들에 기본 구조 생성
    const emptyFiles = priorityReport.files.filter(
      (file: any) => file.completionStatus === 'empty'
    );

    for (const file of emptyFiles.slice(0, 5)) { // 최대 5개까지만 자동 수정
      try {
        await createBasicPriorityStructure(file.path);
        autoFixed.push(`기본 Priority 구조 생성: ${path.basename(file.path)}`);
      } catch (error) {
        // 자동 수정 실패는 무시 (경고로 처리)
      }
    }

  } catch (error) {
    // 자동 수정 중 오류 발생해도 전체 프로세스는 계속
  }

  return autoFixed;
}

/**
 * 기본 Priority JSON 구조 생성
 */
async function createBasicPriorityStructure(filePath: string): Promise<void> {
  const basicStructure = {
    document: {
      id: "",
      title: "",
      source_path: "",
      category: "",
      subcategory: "",
      lastModified: new Date().toISOString(),
      wordCount: 0
    },
    priority: {
      score: 50,
      tier: "medium",
      rationale: "자동 생성됨 - 수동 검토 필요",
      reviewDate: new Date().toISOString(),
      autoCalculated: true
    },
    tags: {
      primary: [],
      secondary: [],
      audience: [],
      complexity: "basic",
      estimatedReadingTime: "5분",
      lastUpdated: new Date().toISOString()
    },
    extraction: {
      strategy: "concept-first",
      characterLimit: {
        "100": {
          focus: "핵심 개념",
          key_points: ["수동으로 키 포인트를 추가하세요"]
        },
        "200": {
          focus: "핵심 개념과 사용법",
          key_points: ["수동으로 키 포인트를 추가하세요"]
        },
        "300": {
          focus: "개념, 사용법, 예시",
          key_points: ["수동으로 키 포인트를 추가하세요"]
        }
      }
    },
    dependencies: {
      prerequisites: [],
      references: [],
      followups: [],
      conflicts: [],
      complements: []
    },
    metadata: {
      generated: new Date().toISOString(),
      version: "1.0.0",
      needsReview: true,
      autoGenerated: true
    }
  };

  await writeFile(filePath, JSON.stringify(basicStructure, null, 2), 'utf-8');
}

/**
 * 커밋 허용 여부 결정
 */
function shouldAllowCommit(
  blockers: string[],
  warnings: string[],
  missingFiles: number,
  config: PreCommitConfig
): boolean {
  // 블로커가 있으면 커밋 금지
  if (blockers.length > 0) {
    return false;
  }

  // 누락 파일이 임계치를 초과하면 커밋 금지
  if (missingFiles > config.maxMissingFiles && config.blockOnCritical) {
    return false;
  }

  return true;
}

/**
 * 결과 출력
 */
function displayResults(result: PreCommitResult, quiet: boolean, strict: boolean): void {
  if (quiet) {
    // 간단한 출력
    if (!result.canCommit) {
      console.log('❌ COMMIT BLOCKED');
      result.details.blockers.forEach(blocker => console.log(`   ${blocker}`));
    } else if (!result.success) {
      console.log('⚠️ COMMIT ALLOWED WITH WARNINGS');
      if (strict) {
        console.log('   (--strict 모드에서는 경고도 에러로 처리됩니다)');
      }
    } else {
      console.log('✅ COMMIT ALLOWED');
    }
    return;
  }

  // 상세 출력
  console.log('\n' + '='.repeat(60));
  console.log('📋 Pre-commit Priority JSON 검증 결과');
  console.log('='.repeat(60));

  // 요약
  console.log('\n📊 검증 요약:');
  console.log(`  검사한 파일: ${result.summary.totalChecked}개`);
  console.log(`  누락된 파일: ${result.summary.missingFiles}개`);
  console.log(`  업데이트 필요: ${result.summary.outdatedFiles}개`);
  console.log(`  자동 수정: ${result.summary.autoFixed}개`);
  console.log(`  중요 이슈: ${result.summary.criticalIssues}개`);

  // 블로커
  if (result.details.blockers.length > 0) {
    console.log('\n❌ 커밋 차단 이슈:');
    result.details.blockers.forEach(blocker => {
      console.log(`  • ${blocker}`);
    });
  }

  // 경고
  if (result.details.warnings.length > 0) {
    console.log('\n⚠️ 경고:');
    result.details.warnings.forEach(warning => {
      console.log(`  • ${warning}`);
    });
  }

  // 자동 수정
  if (result.details.autoFixed.length > 0) {
    console.log('\n🔧 자동 수정됨:');
    result.details.autoFixed.forEach(fix => {
      console.log(`  • ${fix}`);
    });
  }

  // 권장사항
  if (result.details.recommendations.length > 0) {
    console.log('\n💡 권장사항:');
    result.details.recommendations.slice(0, 5).forEach(rec => {
      console.log(`  • ${rec}`);
    });
    if (result.details.recommendations.length > 5) {
      console.log(`  ... 그 외 ${result.details.recommendations.length - 5}개`);
    }
  }

  // 최종 결과
  console.log('\n' + '='.repeat(60));
  if (!result.canCommit) {
    console.log('❌ 커밋이 차단되었습니다. 위의 이슈들을 먼저 해결하세요.');
  } else if (!result.success) {
    console.log('⚠️ 경고가 있지만 커밋은 허용됩니다.');
    if (strict) {
      console.log('   (--strict 모드가 활성화되어 경고도 에러로 처리됩니다)');
    }
  } else {
    console.log('✅ 모든 검증을 통과했습니다. 커밋을 진행하세요.');
  }
  console.log('='.repeat(60));
}

/**
 * 리포트 저장
 */
async function saveReport(result: PreCommitResult, reportPath: string): Promise<void> {
  const report = {
    timestamp: new Date().toISOString(),
    result: result,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd()
    }
  };

  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
}