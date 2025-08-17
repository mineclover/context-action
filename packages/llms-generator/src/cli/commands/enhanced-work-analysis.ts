/**
 * Enhanced Work Analysis Command
 * 
 * 고도화된 작업 상태 분석 및 리포트 생성 시스템
 */

import { Command } from 'commander';
import { EnhancedWorkStatusManager } from '../../core/EnhancedWorkStatusManager.js';
import { globalPerformanceMonitor } from '../../infrastructure/monitoring/PerformanceMonitor.js';
import { DEFAULT_CONFIG } from '../../index.js';
import { writeFile } from 'fs/promises';
import path from 'path';

export function createEnhancedWorkAnalysisCommand(): Command {
  const command = new Command('enhanced-work-analysis');

  command
    .description('고도화된 작업 상태 분석 및 인사이트 제공')
    .option('-l, --language <lang>', '분석할 언어', 'ko')
    .option('-o, --output <file>', '결과를 저장할 JSON 파일 경로')
    .option('--format <format>', '출력 형식 (table, json, summary)', 'summary')
    .option('--detailed', '상세한 분석 결과 표시', false)
    .option('--priority-queue <n>', '우선순위 작업 큐 크기', '10')
    .option('--trends', '트렌드 분석 포함', false)
    .action(async (options) => {
      const stopTiming = globalPerformanceMonitor.startTiming('enhanced-work-analysis');

      try {
        console.log(`🔍 Enhanced Work Analysis - ${options.language.toUpperCase()} 언어\n`);

        // Use correct data path for testing
        const testConfig = {
          ...DEFAULT_CONFIG,
          paths: {
            ...DEFAULT_CONFIG.paths,
            llmContentDir: './data'  // Correct path for the current project
          }
        };
        
        const manager = new EnhancedWorkStatusManager(testConfig);
        
        // 1. Enhanced Report 생성
        console.log('📊 포괄적인 작업 현황 분석 중...');
        const enhancedReport = await manager.generateEnhancedReport(options.language);
        
        // 2. 우선순위 작업 큐 생성
        console.log('📝 우선순위 작업 큐 생성 중...');
        const priorityQueue = await manager.getPrioritizedWorkQueue(
          options.language, 
          parseInt(options.priorityQueue)
        );
        
        // 3. 품질 평가
        console.log('🎯 품질 평가 수행 중...');
        const qualityAssessment = await manager.performQualityAssessment(options.language);
        
        // 4. 트렌드 분석 (옵션)
        let trends = null;
        if (options.trends) {
          console.log('📈 트렌드 분석 수행 중...');
          trends = await manager.analyzeWorkStatusTrends(options.language);
        }

        // 결과 출력
        displayEnhancedResults({
          enhancedReport,
          priorityQueue,
          qualityAssessment,
          trends,
          language: options.language,
          format: options.format,
          detailed: options.detailed
        });

        // JSON 파일로 저장 (옵션)
        if (options.output) {
          const fullReport = {
            timestamp: new Date().toISOString(),
            language: options.language,
            enhancedReport,
            priorityQueue,
            qualityAssessment,
            trends,
            metadata: {
              version: '2.0.0',
              generatedBy: 'Enhanced WorkStatusManager'
            }
          };

          await writeFile(options.output, JSON.stringify(fullReport, null, 2), 'utf-8');
          console.log(`\n💾 상세 리포트가 ${options.output}에 저장되었습니다.`);
        }

      } catch (error) {
        console.error('❌ Enhanced Work Analysis 중 오류가 발생했습니다:', error);
        process.exit(1);
      } finally {
        stopTiming();
      }
    });

  return command;
}

/**
 * Enhanced 분석 결과 출력
 */
function displayEnhancedResults(options: {
  enhancedReport: any;
  priorityQueue: any[];
  qualityAssessment: any;
  trends: any;
  language: string;
  format: string;
  detailed: boolean;
}) {
  const { enhancedReport, priorityQueue, qualityAssessment, format, detailed } = options;

  if (format === 'json') {
    console.log(JSON.stringify({
      enhancedReport,
      priorityQueue,
      qualityAssessment
    }, null, 2));
    return;
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 Enhanced Work Status Analysis Report');
  console.log('='.repeat(80));

  // 1. 요약 정보
  console.log('\n📊 전체 현황 요약:');
  console.log(`  총 문서: ${enhancedReport.summary.totalDocuments}개`);
  console.log(`  작업 완성률: ${enhancedReport.summary.workCompletionRate.toFixed(1)}%`);
  console.log(`  품질 점수: ${enhancedReport.summary.qualityScore.toFixed(1)}/100 (${qualityAssessment.overallGrade}등급)`);
  console.log(`  작업 필요: ${enhancedReport.summary.documentsNeedingWork}개`);
  console.log(`  긴급 항목: ${enhancedReport.summary.urgentItems}개`);

  // 2. 품질 분석
  console.log('\n🎯 품질 분석:');
  console.log(`  전체 등급: ${qualityAssessment.overallGrade}`);
  console.log(`  품질 점수: ${qualityAssessment.score.toFixed(1)}/100`);
  console.log(`  발견된 이슈: ${qualityAssessment.issues.length}개`);
  console.log(`  강점: ${qualityAssessment.strengths.length}개`);
  console.log(`  개선 영역: ${qualityAssessment.improvementAreas.length}개`);

  // 3. 문자 제한별 분석
  if (detailed && Object.keys(enhancedReport.breakdown.byCharacterLimit).length > 0) {
    console.log('\n📏 문자 제한별 현황:');
    console.log('  제한   | 총계 | 완료 | 작업필요 | 평균품질');
    console.log('  -------|------|------|----------|----------');
    
    for (const [limit, stats] of Object.entries(enhancedReport.breakdown.byCharacterLimit)) {
      const total = (stats as any).total;
      const completed = (stats as any).completed;
      const needsWork = (stats as any).needsWork;
      const avgQuality = (stats as any).averageQuality;
      
      console.log(`  ${limit.padStart(5)}  | ${total.toString().padStart(4)} | ${completed.toString().padStart(4)} | ${needsWork.toString().padStart(8)} | ${avgQuality.toFixed(1).padStart(8)}`);
    }
  }

  // 4. 우선순위 작업 큐
  if (priorityQueue.length > 0) {
    console.log('\n🔥 우선순위 작업 큐 (상위 5개):');
    priorityQueue.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.workStatus.documentId}`);
      console.log(`     우선순위: ${item.priorityScore}점 | 긴급도: ${item.urgencyLevel}`);
      console.log(`     카테고리: ${item.category}`);
      if (item.workStatus.updateReasons.length > 0) {
        console.log(`     이슈: ${item.workStatus.updateReasons.slice(0, 2).join(', ')}`);
      }
      console.log('');
    });
  }

  // 5. 주요 권장사항
  if (enhancedReport.recommendations.length > 0) {
    console.log('💡 주요 권장사항:');
    enhancedReport.recommendations.slice(0, 5).forEach((rec: any, index: number) => {
      const priorityIcon = {
        'high': '🔴',
        'medium': '🟡', 
        'low': '🟢'
      }[rec.priority as 'high' | 'medium' | 'low'] || '⚪';
      
      console.log(`  ${priorityIcon} [${rec.priority}] ${rec.description}`);
      console.log(`     영향 범위: ${rec.affectedCount}개`);
      console.log(`     조치 방법: ${rec.action}`);
      console.log('');
    });
  }

  // 6. 핵심 인사이트
  if (enhancedReport.insights.length > 0) {
    console.log('🔍 핵심 인사이트:');
    enhancedReport.insights.forEach((insight: any, index: number) => {
      const typeIcon = {
        'pattern': '📊',
        'anomaly': '⚠️',
        'trend': '📈'
      }[insight.type as 'pattern' | 'anomaly' | 'trend'] || '💡';
      
      const impactIcon = {
        'high': '🔴',
        'medium': '🟡',
        'low': '🟢'
      }[insight.impact as 'high' | 'medium' | 'low'] || '⚪';
      
      console.log(`  ${typeIcon} [${insight.type}] ${insight.description} ${impactIcon}`);
      if (insight.suggestion) {
        console.log(`     💡 제안: ${insight.suggestion}`);
      }
      console.log('');
    });
  }

  // 7. 다음 단계 제안
  console.log('🚀 다음 단계 제안:');
  if (enhancedReport.summary.urgentItems > 0) {
    console.log(`  1. 긴급 항목 ${enhancedReport.summary.urgentItems}개를 우선 처리하세요`);
  }
  if (enhancedReport.summary.workCompletionRate < 90) {
    console.log('  2. 누락된 파일들을 생성하여 완성률을 높이세요');
  }
  if (qualityAssessment.score < 70) {
    console.log('  3. 템플릿 표현을 제거하고 구체적인 내용으로 개선하세요');
  }
  if (priorityQueue.length > 0) {
    console.log('  4. 우선순위 작업 큐의 상위 항목부터 순차적으로 처리하세요');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✨ Enhanced Work Status Analysis 완료');
  console.log('='.repeat(80));
}