#!/usr/bin/env node

/**
 * 정보 누락 방지 검증 시스템
 * 대용량 JSON 환경에서 정보가 누락되지 않도록 종합적으로 검증합니다.
 */

const fs = require('fs');
const { execSync } = require('child_process');

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

class CompletenessVerifier {
  constructor() {
    this.data = JSON.parse(fs.readFileSync('glossary-data.json', 'utf8'));
    this.results = {
      totalChecks: 0,
      passedChecks: 0,
      criticalIssues: [],
      warnings: [],
      recommendations: []
    };
  }

  // 메인 검증 실행
  async verify() {
    console.log(c('blue', '🔍 정보 누락 방지 종합 검증 시스템'));
    console.log(c('blue', '═'.repeat(60)));
    
    await this.verifyDataCompleteness();
    await this.verifySearchCompleteness();
    await this.verifyRelationshipCompleteness();
    await this.verifyImplementationCompleteness();
    await this.verifyCategoryCompleteness();
    await this.verifyIndexCompleteness();
    await this.performCrossValidation();
    
    this.generateCompletenessReport();
  }

  // 테스트 기록 헬퍼
  recordCheck(name, passed, details = '', critical = false) {
    this.results.totalChecks++;
    if (passed) this.results.passedChecks++;
    
    if (!passed) {
      const issue = { name, details, critical };
      if (critical) {
        this.results.criticalIssues.push(issue);
      } else {
        this.results.warnings.push(issue);
      }
    }
    
    const status = passed ? c('green', '✅') : (critical ? c('red', '🚨') : c('yellow', '⚠️'));
    console.log(`${status} ${name}${details ? ` - ${details}` : ''}`);
  }

  // 1. 데이터 완전성 검증
  async verifyDataCompleteness() {
    console.log(c('cyan', '\n📊 1. 데이터 완전성 검증'));
    
    const terms = this.data.terms;
    const categories = this.data.categories;
    
    // 전체 용어 수 일치성
    const metadataTotal = this.data.metadata.totalTerms;
    const actualTotal = Object.keys(terms).length;
    this.recordCheck(
      '전체 용어 수 일치성',
      metadataTotal === actualTotal,
      `메타데이터: ${metadataTotal}, 실제: ${actualTotal}`,
      true
    );
    
    // 카테고리별 용어 수 일치성
    let categoryMismatches = 0;
    for (const [categoryId, categoryData] of Object.entries(categories)) {
      const declared = categoryData.termCount;
      const actual = categoryData.terms ? categoryData.terms.length : 0;
      if (declared !== actual) categoryMismatches++;
    }
    
    this.recordCheck(
      '카테고리별 용어 수 일치성',
      categoryMismatches === 0,
      `${categoryMismatches}개 카테고리에서 불일치`,
      categoryMismatches > 0
    );
    
    // 필수 필드 완전성
    let missingFields = 0;
    for (const [termId, term] of Object.entries(terms)) {
      if (!term.title || !term.category || !term.definition) {
        missingFields++;
      }
    }
    
    this.recordCheck(
      '필수 필드 완전성',
      missingFields === 0,
      `${missingFields}개 용어에서 필수 필드 누락`,
      missingFields > 5
    );
    
    // 정의 품질 완전성
    let shortDefinitions = 0;
    for (const [termId, term] of Object.entries(terms)) {
      if (term.definition && term.definition.length < 50) {
        shortDefinitions++;
      }
    }
    
    this.recordCheck(
      '정의 품질 완전성',
      shortDefinitions < actualTotal * 0.1,
      `${shortDefinitions}개 용어의 정의가 너무 짧음`,
      shortDefinitions > actualTotal * 0.3
    );
  }

  // 2. 검색 완전성 검증
  async verifySearchCompleteness() {
    console.log(c('cyan', '\n🔍 2. 검색 완전성 검증'));
    
    const terms = this.data.terms;
    let searchableTerms = 0;
    let unsearchableTerms = [];
    
    // 각 용어가 검색 가능한지 확인
    for (const [termId, term] of Object.entries(terms)) {
      let isSearchable = false;
      
      // 1. 직접 제목 검색
      try {
        const result = execSync(`./jq-cli.sh detail "${term.title}"`, { encoding: 'utf8', timeout: 5000 });
        if (result.includes(term.title)) {
          isSearchable = true;
        }
      } catch (error) {
        // 검색 실패는 일단 넘어감
      }
      
      // 2. 키워드 인덱스에서 검색 가능한지 확인
      if (!isSearchable) {
        for (const [keyword, termIds] of Object.entries(this.data.index.byKeyword)) {
          if (termIds.includes(termId)) {
            isSearchable = true;
            break;
          }
        }
      }
      
      // 3. 별칭 인덱스에서 검색 가능한지 확인
      if (!isSearchable) {
        for (const [alias, aliasTermId] of Object.entries(this.data.index.byAlias)) {
          if (aliasTermId === termId) {
            isSearchable = true;
            break;
          }
        }
      }
      
      if (isSearchable) {
        searchableTerms++;
      } else {
        unsearchableTerms.push(termId);
      }
    }
    
    const searchCoverage = (searchableTerms / Object.keys(terms).length * 100).toFixed(1);
    this.recordCheck(
      '검색 커버리지 완전성',
      searchCoverage >= 95,
      `${searchCoverage}% 커버리지`,
      searchCoverage < 90
    );
    
    // 검색 메커니즘별 완전성
    const keywordCount = Object.keys(this.data.index.byKeyword).length;
    const aliasCount = Object.keys(this.data.index.byAlias).length;
    
    this.recordCheck(
      '키워드 인덱스 완전성',
      keywordCount >= Object.keys(terms).length * 3,
      `${keywordCount}개 키워드 (최소 ${Object.keys(terms).length * 3}개 권장)`,
      keywordCount < Object.keys(terms).length * 2
    );
    
    this.recordCheck(
      '별칭 인덱스 완전성',
      aliasCount >= Object.keys(terms).length * 0.5,
      `${aliasCount}개 별칭 (최소 ${Math.floor(Object.keys(terms).length * 0.5)}개 권장)`,
      aliasCount < Object.keys(terms).length * 0.3
    );
  }

  // 3. 관계 완전성 검증
  async verifyRelationshipCompleteness() {
    console.log(c('cyan', '\n🔗 3. 관계 완전성 검증'));
    
    const terms = this.data.terms;
    let termsWithRelations = 0;
    let orphanedTerms = [];
    let asymmetricRelations = 0;
    
    for (const [termId, term] of Object.entries(terms)) {
      if (term.relatedTerms && term.relatedTerms.length > 0) {
        termsWithRelations++;
        
        // 비대칭 관계 검사
        for (const relatedId of term.relatedTerms) {
          const relatedTerm = terms[relatedId];
          if (relatedTerm && relatedTerm.relatedTerms && 
              !relatedTerm.relatedTerms.includes(termId)) {
            asymmetricRelations++;
          }
        }
      } else {
        orphanedTerms.push(termId);
      }
    }
    
    const relationshipCoverage = (termsWithRelations / Object.keys(terms).length * 100).toFixed(1);
    
    this.recordCheck(
      '관계 네트워크 완전성',
      relationshipCoverage >= 80,
      `${relationshipCoverage}% 용어가 관련 용어 보유`,
      relationshipCoverage < 60
    );
    
    this.recordCheck(
      '고립된 용어 최소화',
      orphanedTerms.length < Object.keys(terms).length * 0.2,
      `${orphanedTerms.length}개 고립된 용어`,
      orphanedTerms.length > Object.keys(terms).length * 0.3
    );
    
    this.recordCheck(
      '관계 대칭성',
      asymmetricRelations < termsWithRelations * 0.3,
      `${asymmetricRelations}개 비대칭 관계`,
      asymmetricRelations > termsWithRelations * 0.5
    );
  }

  // 4. 구현체 정보 완전성 검증
  async verifyImplementationCompleteness() {
    console.log(c('cyan', '\n🔧 4. 구현체 정보 완전성 검증'));
    
    const terms = this.data.terms;
    let termsWithImplementations = 0;
    let invalidImplementations = 0;
    
    for (const [termId, term] of Object.entries(terms)) {
      if (term.implementations && term.implementations.length > 0) {
        termsWithImplementations++;
        
        // 구현체 정보 유효성 검사
        for (const impl of term.implementations) {
          if (!impl.file || !impl.line || !impl.name) {
            invalidImplementations++;
            break;
          }
        }
      }
    }
    
    const implementationCoverage = (termsWithImplementations / Object.keys(terms).length * 100).toFixed(1);
    
    this.recordCheck(
      '구현체 정보 완전성',
      implementationCoverage >= 50,
      `${implementationCoverage}% 용어가 구현체 보유`,
      implementationCoverage < 30
    );
    
    this.recordCheck(
      '구현체 정보 유효성',
      invalidImplementations === 0,
      `${invalidImplementations}개 무효한 구현체 정보`,
      invalidImplementations > 0
    );
  }

  // 5. 카테고리 완전성 검증
  async verifyCategoryCompleteness() {
    console.log(c('cyan', '\n📂 5. 카테고리 완전성 검증'));
    
    const categories = this.data.categories;
    const terms = this.data.terms;
    
    // 카테고리 균형성 검사
    const distribution = {};
    for (const [categoryId, categoryData] of Object.entries(categories)) {
      distribution[categoryId] = categoryData.termCount;
    }
    
    const avgTermsPerCategory = Object.values(distribution).reduce((a, b) => a + b, 0) / Object.keys(distribution).length;
    let imbalancedCategories = 0;
    
    for (const [categoryId, count] of Object.entries(distribution)) {
      if (count < 5 || count > avgTermsPerCategory * 2) {
        imbalancedCategories++;
      }
    }
    
    this.recordCheck(
      '카테고리 균형성',
      imbalancedCategories <= 1,
      `${imbalancedCategories}개 불균형 카테고리`,
      imbalancedCategories > 2
    );
    
    // 카테고리 참조 무결성
    let orphanedTerms = 0;
    for (const [termId, term] of Object.entries(terms)) {
      if (!categories[term.category] || !categories[term.category].terms.includes(termId)) {
        orphanedTerms++;
      }
    }
    
    this.recordCheck(
      '카테고리 참조 무결성',
      orphanedTerms === 0,
      `${orphanedTerms}개 용어가 카테고리에서 누락`,
      orphanedTerms > 0
    );
  }

  // 6. 인덱스 완전성 검증
  async verifyIndexCompleteness() {
    console.log(c('cyan', '\n📇 6. 인덱스 완전성 검증'));
    
    const terms = this.data.terms;
    const keywordIndex = this.data.index.byKeyword;
    const aliasIndex = this.data.index.byAlias;
    
    // 모든 용어가 인덱스에 등록되어 있는지 확인
    let unindexedTerms = [];
    
    for (const [termId, term] of Object.entries(terms)) {
      let isIndexed = false;
      
      // 키워드 인덱스에서 확인
      for (const [keyword, termIds] of Object.entries(keywordIndex)) {
        if (termIds.includes(termId)) {
          isIndexed = true;
          break;
        }
      }
      
      if (!isIndexed) {
        unindexedTerms.push(termId);
      }
    }
    
    this.recordCheck(
      '인덱스 등록 완전성',
      unindexedTerms.length === 0,
      `${unindexedTerms.length}개 용어가 인덱스 미등록`,
      unindexedTerms.length > 0
    );
    
    // 인덱스 참조 유효성
    let invalidKeywordRefs = 0;
    let invalidAliasRefs = 0;
    
    for (const [keyword, termIds] of Object.entries(keywordIndex)) {
      for (const termId of termIds) {
        if (!terms[termId]) {
          invalidKeywordRefs++;
        }
      }
    }
    
    for (const [alias, termId] of Object.entries(aliasIndex)) {
      if (!terms[termId]) {
        invalidAliasRefs++;
      }
    }
    
    this.recordCheck(
      '키워드 인덱스 참조 유효성',
      invalidKeywordRefs === 0,
      `${invalidKeywordRefs}개 무효한 참조`,
      invalidKeywordRefs > 0
    );
    
    this.recordCheck(
      '별칭 인덱스 참조 유효성',
      invalidAliasRefs === 0,
      `${invalidAliasRefs}개 무효한 참조`,
      invalidAliasRefs > 0
    );
  }

  // 7. 교차 검증
  async performCrossValidation() {
    console.log(c('cyan', '\n🔄 7. 교차 검증'));
    
    // 주요 용어들의 실제 검색 테스트
    const criticalTerms = [
      'ActionRegister',
      'Action Pipeline System',
      'Store Integration Pattern',
      'useActionDispatch',
      'Pipeline Controller'
    ];
    
    let searchFailures = 0;
    
    for (const term of criticalTerms) {
      try {
        const result = execSync(`./jq-cli.sh detail "${term}"`, { encoding: 'utf8', timeout: 5000 });
        if (!result.includes(term)) {
          searchFailures++;
        }
      } catch (error) {
        searchFailures++;
      }
    }
    
    this.recordCheck(
      '핵심 용어 검색 가능성',
      searchFailures === 0,
      `${searchFailures}개 핵심 용어 검색 실패`,
      searchFailures > 0
    );
    
    // 네트워크 탐색 기능 검증
    try {
      const networkResult = execSync('./jq-cli.sh explore "ActionRegister"', { encoding: 'utf8', timeout: 10000 });
      const networkWorking = networkResult.includes('중심 용어') && networkResult.includes('직접 관련 용어들');
      
      this.recordCheck(
        '네트워크 탐색 기능',
        networkWorking,
        networkWorking ? '정상 작동' : '오류 발생',
        !networkWorking
      );
    } catch (error) {
      this.recordCheck(
        '네트워크 탐색 기능',
        false,
        '실행 실패',
        true
      );
    }
    
    // 시스템 통계 일관성
    try {
      const statsResult = execSync('./jq-cli.sh stats', { encoding: 'utf8', timeout: 5000 });
      const statsWorking = statsResult.includes('시스템 통계') && statsResult.includes('총 용어 수');
      
      this.recordCheck(
        '시스템 통계 일관성',
        statsWorking,
        statsWorking ? '정상 작동' : '오류 발생',
        !statsWorking
      );
    } catch (error) {
      this.recordCheck(
        '시스템 통계 일관성',
        false,
        '실행 실패',
        true
      );
    }
  }

  // 최종 보고서 생성
  generateCompletenessReport() {
    console.log(c('blue', '\n📊 정보 누락 방지 검증 종합 보고서'));
    console.log(c('blue', '═'.repeat(60)));
    
    const successRate = ((this.results.passedChecks / this.results.totalChecks) * 100).toFixed(1);
    const criticalIssueCount = this.results.criticalIssues.length;
    const warningCount = this.results.warnings.length;
    
    // 전체 평가
    if (criticalIssueCount === 0 && warningCount === 0) {
      console.log(c('green', '🎉 완벽한 정보 완전성 - 누락 위험 없음!'));
    } else if (criticalIssueCount === 0) {
      console.log(c('yellow', `⚠️ 경미한 주의사항 있음 - 전반적으로 안전`));
    } else {
      console.log(c('red', `🚨 심각한 누락 위험 발견 - 즉시 수정 필요`));
    }
    
    console.log(c('cyan', `\n📈 검증 결과: ${successRate}% (${this.results.passedChecks}/${this.results.totalChecks})`));
    
    // 위험도 평가
    let riskLevel = '';
    let riskColor = '';
    
    if (criticalIssueCount === 0 && warningCount <= 2) {
      riskLevel = '낮음 (Low)';
      riskColor = 'green';
    } else if (criticalIssueCount === 0 && warningCount <= 5) {
      riskLevel = '보통 (Medium)';
      riskColor = 'yellow';
    } else if (criticalIssueCount <= 2) {
      riskLevel = '높음 (High)';
      riskColor = 'yellow';
    } else {
      riskLevel = '매우 높음 (Critical)';
      riskColor = 'red';
    }
    
    console.log(c(riskColor, `🎯 정보 누락 위험도: ${riskLevel}`));
    
    // 세부 문제 보고
    if (criticalIssueCount > 0) {
      console.log(c('red', `\n🚨 긴급 수정 필요 (${criticalIssueCount}개):`));
      this.results.criticalIssues.forEach((issue, index) => {
        console.log(c('red', `   ${index + 1}. ${issue.name}: ${issue.details}`));
      });
    }
    
    if (warningCount > 0) {
      console.log(c('yellow', `\n⚠️ 개선 권장사항 (${warningCount}개):`));
      this.results.warnings.slice(0, 5).forEach((warning, index) => {
        console.log(c('yellow', `   ${index + 1}. ${warning.name}: ${warning.details}`));
      });
      if (warningCount > 5) {
        console.log(c('yellow', `   ... 그리고 ${warningCount - 5}개 더`));
      }
    }
    
    // 완전성 점수 계산
    let completenessScore = 100;
    completenessScore -= criticalIssueCount * 20;
    completenessScore -= warningCount * 5;
    completenessScore = Math.max(0, completenessScore);
    
    let grade = '';
    if (completenessScore >= 95) grade = 'A+ (완벽)';
    else if (completenessScore >= 90) grade = 'A (우수)';
    else if (completenessScore >= 80) grade = 'B (양호)';
    else if (completenessScore >= 70) grade = 'C (보통)';
    else grade = 'D (위험)';
    
    console.log(c('cyan', `\n📊 정보 완전성 점수: ${completenessScore}/100 (${grade})`));
    
    // 권장 조치사항
    console.log(c('cyan', '\n💡 권장 조치사항:'));
    if (completenessScore >= 95) {
      console.log(c('gray', '   • 현재 수준 유지 및 정기적 모니터링'));
      console.log(c('gray', '   • 월 1회 정기 검증 수행'));
    } else if (criticalIssueCount > 0) {
      console.log(c('gray', '   • 긴급: 심각한 문제들 즉시 수정'));
      console.log(c('gray', '   • 데이터 재생성 및 무결성 재검증'));
      console.log(c('gray', '   • 수정 후 전체 검증 재실행'));
    } else {
      console.log(c('gray', '   • 경고사항들 순차적 개선'));
      console.log(c('gray', '   • 데이터 품질 향상 계획 수립'));
      console.log(c('gray', '   • 주간 모니터링 시스템 구축'));
    }
    
    console.log(c('blue', '\n' + '═'.repeat(60)));
    
    // 종료 코드
    if (criticalIssueCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// 메인 실행
async function main() {
  const verifier = new CompletenessVerifier();
  await verifier.verify();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompletenessVerifier;