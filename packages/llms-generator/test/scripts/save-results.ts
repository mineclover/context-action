/**
 * Test results saving utility
 * TypeScript migration of save-test-results.cjs
 */

import { writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';

export interface TestResult {
  testName: string;
  timestamp: Date;
  success: boolean;
  duration?: number;
  details?: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SaveResultsOptions {
  outputDir?: string;
  format?: 'json' | 'csv' | 'txt';
  append?: boolean;
  includeMetadata?: boolean;
}

export async function saveTestResults(
  results: TestResult[],
  options: SaveResultsOptions = {}
): Promise<string> {
  const outputDir = options.outputDir || resolve(process.cwd(), 'test', 'outputs');
  const format = options.format || 'json';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // 출력 디렉토리 생성
  await mkdir(outputDir, { recursive: true });
  
  let fileName: string;
  let content: string;
  
  switch (format) {
    case 'json':
      fileName = `test-results-${timestamp}.json`;
      content = JSON.stringify({
        timestamp: new Date().toISOString(),
        totalTests: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }, null, 2);
      break;
      
    case 'csv':
      fileName = `test-results-${timestamp}.csv`;
      content = generateCSV(results);
      break;
      
    case 'txt':
      fileName = `test-results-${timestamp}.txt`;
      content = generateTextReport(results);
      break;
      
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  
  const filePath = resolve(outputDir, fileName);
  await writeFile(filePath, content, 'utf-8');
  
  console.log(`📊 테스트 결과 저장됨: ${filePath}`);
  console.log(`📈 총 ${results.length}개 테스트 중 ${results.filter(r => r.success).length}개 성공`);
  
  return filePath;
}

function generateCSV(results: TestResult[]): string {
  const headers = ['Test Name', 'Timestamp', 'Success', 'Duration (ms)', 'Error'];
  const rows = results.map(result => [
    `"${result.testName}"`,
    result.timestamp.toISOString(),
    result.success ? 'true' : 'false',
    result.duration?.toString() || '',
    result.error ? `"${result.error.replace(/"/g, '""')}"` : ''
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateTextReport(results: TestResult[]): string {
  const lines: string[] = [];
  
  lines.push('🧪 테스트 결과 리포트');
  lines.push('='.repeat(50));
  lines.push(`생성 시간: ${new Date().toISOString()}`);
  lines.push(`총 테스트: ${results.length}`);
  lines.push(`성공: ${results.filter(r => r.success).length}`);
  lines.push(`실패: ${results.filter(r => !r.success).length}`);
  lines.push('');
  
  lines.push('📋 개별 테스트 결과:');
  lines.push('-'.repeat(30));
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    
    lines.push(`${index + 1}. ${status} ${result.testName}${duration}`);
    
    if (result.error) {
      lines.push(`   오류: ${result.error}`);
    }
    
    if (result.details && Object.keys(result.details).length > 0) {
      lines.push(`   세부사항: ${JSON.stringify(result.details)}`);
    }
    
    lines.push('');
  });
  
  // 실패한 테스트 요약
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    lines.push('❌ 실패한 테스트 요약:');
    lines.push('-'.repeat(30));
    failedTests.forEach(test => {
      lines.push(`• ${test.testName}: ${test.error || '알 수 없는 오류'}`);
    });
  }
  
  return lines.join('\n');
}

export async function loadTestResults(filePath: string): Promise<{
  timestamp: string;
  totalTests: number;
  successful: number;
  failed: number;
  results: TestResult[];
}> {
  const content = await import('fs/promises').then(fs => fs.readFile(filePath, 'utf-8'));
  return JSON.parse(content);
}

// 유틸리티 함수들
export function createTestResult(
  testName: string,
  success: boolean,
  options: {
    duration?: number;
    details?: Record<string, any>;
    error?: string;
    metadata?: Record<string, any>;
  } = {}
): TestResult {
  return {
    testName,
    timestamp: new Date(),
    success,
    ...options
  };
}

export function measureTestTime<T>(testFn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  
  return testFn().then(result => ({
    result,
    duration: Math.round(performance.now() - startTime)
  }));
}

// CLI integration for standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 사용법: save-results <test-results-file.json> [options]');
    console.log('');
    console.log('옵션:');
    console.log('  --format json|csv|txt  출력 형식 (기본값: json)');
    console.log('  --output-dir <path>    출력 디렉토리');
    console.log('');
    console.log('예시:');
    console.log('  save-results test-results.json --format csv');
    console.log('  save-results test-results.json --output-dir ./reports');
    process.exit(0);
  }
  
  const inputFile = args[0];
  const format = (args.find(arg => arg.startsWith('--format='))?.split('=')[1] as 'json' | 'csv' | 'txt') || 'json';
  const outputDir = args.find(arg => arg.startsWith('--output-dir='))?.split('=')[1];
  
  loadTestResults(inputFile)
    .then(data => saveTestResults(data.results, { format, outputDir }))
    .then(filePath => {
      console.log(`✅ 결과 저장 완료: ${filePath}`);
    })
    .catch(error => {
      console.error('❌ 결과 저장 실패:', error);
      process.exit(1);
    });
}