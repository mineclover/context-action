/**
 * Priority JSON 분석 CLI 명령어
 */

import { Command } from 'commander';
import { PriorityStatusAnalyzer } from '../../core/PriorityStatusAnalyzer.js';
import { globalPerformanceMonitor } from '../../infrastructure/monitoring/PerformanceMonitor.js';

export function createAnalyzePriorityCommand(): Command {
  const command = new Command('analyze-priority');
  
  command
    .description('Priority JSON 파일들의 작업 현황을 분석합니다')
    .option('-d, --data-dir <dir>', 'Data 디렉토리 경로', './data')
    .option('-l, --languages <langs>', '지원 언어 (쉼표로 구분)', 'ko,en')
    .option('-f, --format <format>', '출력 형식 (json|table|summary)', 'summary')
    .option('-o, --output <file>', '결과를 파일로 저장')
    .option('--cache', '캐시 사용 (더 빠른 분석)', false)
    .option('--detailed', '상세 분석 결과 표시', false)
    .action(async (options) => {
      const stopTiming = globalPerformanceMonitor.startTiming('analyze-priority');
      
      try {
        console.log('🔍 Priority JSON 현황 분석을 시작합니다...\n');
        
        const languages = options.languages.split(',').map((l: string) => l.trim());
        const analyzer = new PriorityStatusAnalyzer(options.dataDir, languages);
        
        // 전체 현황 분석
        const report = await analyzer.analyzeOverallStatus();
        
        // 작업 진행 현황
        const progress = await analyzer.getWorkProgress();
        
        // 결과 출력
        await displayResults(report, progress, options);
        
        console.log('\n✅ Priority JSON 분석이 완료되었습니다.');
        
      } catch (error) {
        console.error('❌ Priority JSON 분석 중 오류가 발생했습니다:', error);
        process.exit(1);
      } finally {
        stopTiming();
      }
    });

  return command;
}

/**
 * 분석 결과 표시
 */
async function displayResults(
  report: any,
  progress: any,
  options: any
): Promise<void> {
  switch (options.format) {
    case 'json':
      await displayJsonFormat(report, progress, options);
      break;
    case 'table':
      await displayTableFormat(report, progress, options);
      break;
    case 'summary':
    default:
      await displaySummaryFormat(report, progress, options);
      break;
  }
}

/**
 * 요약 형식으로 결과 표시
 */
async function displaySummaryFormat(report: any, progress: any, options: any): Promise<void> {
  console.log('📊 Priority JSON 현황 요약');
  console.log('========================\n');
  
  // 전체 현황
  console.log('🎯 전체 현황:');
  console.log(`  📁 총 파일 수: ${report.summary.totalFiles}개`);
  console.log(`  ✅ 완성된 파일: ${report.summary.completeFiles}개 (${report.summary.completionRate.toFixed(1)}%)`);
  console.log(`  ⚠️  부분 완성: ${report.summary.partialFiles}개`);
  console.log(`  📄 빈 파일: ${report.summary.emptyFiles}개`);
  console.log(`  ❌ 누락된 파일: ${report.summary.missingFiles}개\n`);
  
  // 언어별 현황
  console.log('🌐 언어별 현황:');
  Object.entries(report.byLanguage).forEach(([lang, stats]: [string, any]) => {
    console.log(`  ${lang}: ${stats.complete}/${stats.total} (${stats.completionRate.toFixed(1)}%)`);
  });
  console.log();
  
  // 카테고리별 현황
  console.log('📂 카테고리별 현황:');
  Object.entries(report.byCategory).forEach(([category, stats]: [string, any]) => {
    const avgPriority = stats.averagePriority > 0 ? ` (평균: ${stats.averagePriority.toFixed(1)})` : '';
    console.log(`  ${category}: ${stats.complete}/${stats.total} (${stats.completionRate.toFixed(1)}%)${avgPriority}`);
  });
  console.log();
  
  // 작업 진행률
  console.log('📈 전체 작업 진행률:');
  const progressBar = generateProgressBar(progress.totalProgress);
  console.log(`  ${progressBar} ${progress.totalProgress.toFixed(1)}%\n`);
  
  // 향후 작업
  if (progress.upcomingTasks.length > 0) {
    console.log('📋 향후 작업:');
    progress.upcomingTasks.slice(0, 5).forEach((task: any) => {
      const priorityIcon = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
      console.log(`  ${priorityIcon} ${task.description} (예상: ${task.estimatedTime})`);
    });
    console.log();
  }
  
  // 주요 이슈
  if (report.issues.missingFiles.length > 0 || report.issues.emptyFiles.length > 0) {
    console.log('⚠️  주요 이슈:');
    if (report.issues.missingFiles.length > 0) {
      console.log(`  📄 누락된 파일: ${report.issues.missingFiles.length}개`);
    }
    if (report.issues.emptyFiles.length > 0) {
      console.log(`  📄 빈 파일: ${report.issues.emptyFiles.length}개`);
    }
    if (report.issues.lowQualityFiles.length > 0) {
      console.log(`  📄 품질 문제: ${report.issues.lowQualityFiles.length}개`);
    }
    console.log();
  }
  
  // 권장사항
  if (report.recommendations.length > 0) {
    console.log('💡 권장사항:');
    report.recommendations.forEach((rec: string) => {
      console.log(`  • ${rec}`);
    });
    console.log();
  }
  
  // 상세 정보 (옵션)
  if (options.detailed) {
    await displayDetailedInfo(report, progress);
  }
}

/**
 * 테이블 형식으로 결과 표시
 */
async function displayTableFormat(report: any, progress: any, options: any): Promise<void> {
  console.log('📊 Priority JSON 상세 현황\n');
  
  // 파일별 상태 테이블
  console.log('파일별 상태:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('언어    카테고리                     상태        우선순위 개수   평균 점수   이슈');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  report.files.forEach((file: any) => {
    const statusIcon = getStatusIcon(file.completionStatus);
    const category = file.category.padEnd(25);
    const lang = file.language.padEnd(6);
    const status = `${statusIcon} ${file.completionStatus}`.padEnd(11);
    const count = file.priorityCount.toString().padEnd(13);
    const avgPriority = file.averagePriority > 0 ? file.averagePriority.toFixed(1).padEnd(9) : '-'.padEnd(9);
    const issues = file.issues.length > 0 ? file.issues.length.toString() : '-';
    
    console.log(`${lang} ${category} ${status} ${count} ${avgPriority} ${issues}`);
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * JSON 형식으로 결과 표시
 */
async function displayJsonFormat(report: any, progress: any, options: any): Promise<void> {
  const result = {
    analysis: report,
    progress: progress,
    timestamp: new Date().toISOString()
  };
  
  if (options.output) {
    const fs = await import('fs/promises');
    await fs.writeFile(options.output, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`📄 결과가 ${options.output}에 저장되었습니다.`);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

/**
 * 상세 정보 표시
 */
async function displayDetailedInfo(report: any, progress: any): Promise<void> {
  console.log('🔍 상세 분석 정보\n');
  
  // 카테고리별 상세 진행률
  console.log('📂 카테고리별 상세 진행률:');
  Object.entries(progress.categoryProgress).forEach(([category, progressValue]: [string, any]) => {
    const bar = generateProgressBar(progressValue);
    console.log(`  ${category.padEnd(30)} ${bar} ${progressValue.toFixed(1)}%`);
  });
  console.log();
  
  // 언어별 상세 진행률
  console.log('🌐 언어별 상세 진행률:');
  Object.entries(progress.languageProgress).forEach(([language, progressValue]: [string, any]) => {
    const bar = generateProgressBar(progressValue);
    console.log(`  ${language.padEnd(30)} ${bar} ${progressValue.toFixed(1)}%`);
  });
  console.log();
  
  // 문제가 있는 파일들
  if (report.issues.lowQualityFiles.length > 0) {
    console.log('⚠️  품질 문제가 있는 파일들:');
    report.issues.lowQualityFiles.slice(0, 10).forEach((filePath: string) => {
      const file = report.files.find((f: any) => f.path === filePath);
      if (file) {
        console.log(`  📄 ${filePath}`);
        file.issues.forEach((issue: string) => {
          console.log(`     • ${issue}`);
        });
      }
    });
    if (report.issues.lowQualityFiles.length > 10) {
      console.log(`  ... 그 외 ${report.issues.lowQualityFiles.length - 10}개 파일`);
    }
    console.log();
  }
}

/**
 * 진행률 바 생성
 */
function generateProgressBar(progress: number, length: number = 20): string {
  const filled = Math.round((progress / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 상태 아이콘 가져오기
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'complete': return '✅';
    case 'partial': return '⚠️';
    case 'empty': return '📄';
    case 'missing': return '❌';
    default: return '❓';
  }
}