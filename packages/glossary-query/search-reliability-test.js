#!/usr/bin/env node

/**
 * 검색 시스템 신뢰도 종합 테스트
 * 다양한 검색 시나리오에서의 정확도와 완전성을 검증합니다.
 */

const { execSync } = require('child_process');
const fs = require('fs');

// 색상 정의
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[37m'
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

class SearchReliabilityTester {
  constructor() {
    this.data = JSON.parse(fs.readFileSync('glossary-data.json', 'utf8'));
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  // 메인 테스트 실행
  async runTests() {
    console.log(c('blue', '🔍 검색 시스템 신뢰도 종합 테스트'));
    console.log(c('blue', '═'.repeat(60)));
    
    await this.testExactMatch();
    await this.testAliasSearch();
    await this.testFuzzySearch();
    await this.testKeywordSearch();
    await this.testNetworkExploration();
    await this.testEdgeCases();
    await this.testDataConsistency();
    
    this.generateReport();
  }

  // CLI 명령어 실행 헬퍼
  executeCommand(command) {
    try {
      const result = execSync(command, { encoding: 'utf8', timeout: 5000 });
      return { success: true, output: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 테스트 결과 기록 헬퍼
  recordTest(testName, passed, details = '') {
    this.totalTests++;
    if (passed) this.passedTests++;
    
    this.testResults.push({
      name: testName,
      passed,
      details
    });
    
    const status = passed ? c('green', '✅') : c('red', '❌');
    console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
  }

  // 1. 정확한 매칭 테스트
  async testExactMatch() {
    console.log(c('cyan', '\n📋 1. 정확한 매칭 테스트'));
    
    const exactTestCases = [
      'ActionRegister',
      'Action Pipeline System',
      'Store Integration Pattern',
      'useActionDispatch',
      'Pipeline Controller'
    ];
    
    for (const term of exactTestCases) {
      const result = this.executeCommand(`./jq-cli.sh detail "${term}"`);
      const passed = result.success && result.output.includes(term);
      this.recordTest(`정확한 매칭: "${term}"`, passed);
    }
  }

  // 2. 별칭 검색 테스트
  async testAliasSearch() {
    console.log(c('cyan', '\n🔗 2. 별칭 검색 테스트'));
    
    const aliasTestCases = [
      { alias: '액션 레지스터', expected: 'ActionRegister' },
      { alias: 'APS', expected: 'Action Pipeline System' },
      { alias: '스토어 통합 패턴', expected: 'Store Integration Pattern' },
      { alias: '파이프라인 컨트롤러', expected: 'Pipeline Controller' }
    ];
    
    for (const testCase of aliasTestCases) {
      const result = this.executeCommand(`./jq-cli.sh alias "${testCase.alias}"`);
      const passed = result.success && result.output.includes(testCase.expected);
      this.recordTest(`별칭 검색: "${testCase.alias}" → "${testCase.expected}"`, passed);
    }
  }

  // 3. 퍼지 검색 테스트
  async testFuzzySearch() {
    console.log(c('cyan', '\n🔍 3. 퍼지 검색 테스트'));
    
    const fuzzyTestCases = [
      { input: 'pipeline', shouldFind: 'Pipeline Controller' },
      { input: 'store', shouldFind: 'Store' },
      { input: 'action', shouldFind: 'Action' },
      { input: 'register', shouldFind: 'ActionRegister' }
    ];
    
    for (const testCase of fuzzyTestCases) {
      const result = this.executeCommand(`./jq-cli.sh detail "${testCase.input}"`);
      const passed = result.success && result.output.includes(testCase.shouldFind);
      this.recordTest(`퍼지 검색: "${testCase.input}"`, passed);
    }
  }

  // 4. 키워드 검색 테스트
  async testKeywordSearch() {
    console.log(c('cyan', '\n🏷️ 4. 키워드 검색 테스트'));
    
    const keywordTestCases = [
      'action',
      'store',
      'pipeline',
      'hook',
      'provider'
    ];
    
    for (const keyword of keywordTestCases) {
      const result = this.executeCommand(`./jq-cli.sh keyword "${keyword}"`);
      const passed = result.success && !result.output.includes('매칭되는 용어가 없습니다');
      this.recordTest(`키워드 검색: "${keyword}"`, passed);
    }
  }

  // 5. 네트워크 탐색 테스트
  async testNetworkExploration() {
    console.log(c('cyan', '\n🔗 5. 네트워크 탐색 테스트'));
    
    const networkTestCases = [
      { term: 'ActionRegister', depth: 1 },
      { term: 'Action Pipeline System', depth: 2 },
      { term: 'Store Registry', depth: 1 }
    ];
    
    for (const testCase of networkTestCases) {
      const command = testCase.depth > 1 
        ? `./jq-cli.sh explore "${testCase.term}" ${testCase.depth}`
        : `./jq-cli.sh explore "${testCase.term}"`;
      
      const result = this.executeCommand(command);
      const passed = result.success && 
                    result.output.includes('중심 용어') && 
                    result.output.includes('직접 관련 용어들');
      this.recordTest(`네트워크 탐색: "${testCase.term}" (깊이 ${testCase.depth})`, passed);
    }
  }

  // 6. 엣지 케이스 테스트
  async testEdgeCases() {
    console.log(c('cyan', '\n⚠️ 6. 엣지 케이스 테스트'));
    
    // 존재하지 않는 용어
    let result = this.executeCommand('./jq-cli.sh detail "NonExistentTerm"');
    let passed = !result.success || result.output.includes('찾을 수 없습니다');
    this.recordTest('존재하지 않는 용어 처리', passed);
    
    // 빈 검색어
    result = this.executeCommand('./jq-cli.sh detail ""');
    passed = !result.success || result.output.includes('입력해주세요');
    this.recordTest('빈 검색어 처리', passed);
    
    // 특수 문자
    result = this.executeCommand('./jq-cli.sh detail "!@#$%"');
    passed = !result.success || result.output.includes('찾을 수 없습니다');
    this.recordTest('특수 문자 처리', passed);
    
    // 대소문자 구분
    result = this.executeCommand('./jq-cli.sh detail "actionregister"');
    passed = result.success; // 퍼지 검색으로 찾아야 함
    this.recordTest('대소문자 무시 (퍼지 검색)', passed);
  }

  // 7. 데이터 일관성 테스트
  async testDataConsistency() {
    console.log(c('cyan', '\n📊 7. 데이터 일관성 테스트'));
    
    // 카테고리 일관성
    let result = this.executeCommand('./jq-cli.sh categories');
    let passed = result.success && result.output.includes('카테고리 목록');
    this.recordTest('카테고리 목록 조회', passed);
    
    // 통계 일관성
    result = this.executeCommand('./jq-cli.sh stats');
    passed = result.success && result.output.includes('시스템 통계');
    this.recordTest('시스템 통계 조회', passed);
    
    // 각 카테고리별 용어 목록
    const categories = ['core-concepts', 'api-terms', 'architecture-terms', 'naming-conventions'];
    for (const category of categories) {
      result = this.executeCommand(`./jq-cli.sh list ${category}`);
      passed = result.success && result.output.includes('용어 목록');
      this.recordTest(`카테고리 "${category}" 목록 조회`, passed);
    }
  }

  // 8. 성능 테스트
  async testPerformance() {
    console.log(c('cyan', '\n⚡ 8. 성능 테스트'));
    
    const performanceTestCases = [
      { command: './jq-cli.sh categories', maxTime: 100 },
      { command: './jq-cli.sh list core-concepts', maxTime: 100 },
      { command: './jq-cli.sh detail "ActionRegister"', maxTime: 100 },
      { command: './jq-cli.sh explore "ActionRegister"', maxTime: 500 },
      { command: './jq-cli.sh explore "Action Pipeline System" 2', maxTime: 1000 }
    ];
    
    for (const testCase of performanceTestCases) {
      const startTime = Date.now();
      const result = this.executeCommand(testCase.command);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const passed = result.success && duration <= testCase.maxTime;
      this.recordTest(
        `성능: ${testCase.command.split(' ').slice(1).join(' ')}`, 
        passed, 
        `${duration}ms (한계: ${testCase.maxTime}ms)`
      );
    }
  }

  // 최종 보고서 생성
  generateReport() {
    console.log(c('blue', '\n📊 검색 시스템 신뢰도 테스트 결과'));
    console.log(c('blue', '═'.repeat(60)));
    
    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    
    // 전체 결과
    if (successRate >= 95) {
      console.log(c('green', `🎉 우수한 신뢰도: ${successRate}% (${this.passedTests}/${this.totalTests})`));
    } else if (successRate >= 85) {
      console.log(c('yellow', `⚠️ 보통 신뢰도: ${successRate}% (${this.passedTests}/${this.totalTests})`));
    } else {
      console.log(c('red', `❌ 낮은 신뢰도: ${successRate}% (${this.passedTests}/${this.totalTests})`));
    }
    
    // 실패한 테스트들
    const failedTests = this.testResults.filter(test => !test.passed);
    if (failedTests.length > 0) {
      console.log(c('red', `\n❌ 실패한 테스트 (${failedTests.length}개):`));
      failedTests.forEach((test, index) => {
        console.log(c('red', `   ${index + 1}. ${test.name}${test.details ? ` - ${test.details}` : ''}`));
      });
    }
    
    // 신뢰도 등급
    let grade = '';
    if (successRate >= 95) grade = 'A+ (매우 높음)';
    else if (successRate >= 90) grade = 'A (높음)';
    else if (successRate >= 80) grade = 'B (보통)';
    else if (successRate >= 70) grade = 'C (낮음)';
    else grade = 'D (매우 낮음)';
    
    console.log(c('cyan', `\n🎯 신뢰도 등급: ${grade}`));
    
    // 추천사항
    console.log(c('cyan', '\n💡 추천사항:'));
    if (successRate >= 95) {
      console.log(c('gray', '   • 현재 수준 유지 및 정기적 검증'));
    } else if (successRate >= 85) {
      console.log(c('gray', '   • 실패한 테스트 케이스 분석 및 개선'));
    } else {
      console.log(c('gray', '   • 검색 알고리즘 및 데이터 구조 전면 재검토'));
    }
    
    console.log(c('blue', '\n' + '═'.repeat(60)));
  }
}

// 메인 실행
async function main() {
  const tester = new SearchReliabilityTester();
  await tester.runTests();
  await tester.testPerformance();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SearchReliabilityTester;