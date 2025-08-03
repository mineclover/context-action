#!/usr/bin/env node

/**
 * JSON 데이터 무결성 및 검색 시스템 신뢰도 검증 스크립트
 * 대용량 JSON 파싱 환경에서의 정보 누락 방지 및 검색 정확도 검사
 */

const fs = require('fs');
const path = require('path');

// 색상 정의
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[37m'
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

class DataIntegrityChecker {
  constructor(dataFile) {
    this.dataFile = dataFile;
    this.data = null;
    this.errors = [];
    this.warnings = [];
    this.stats = {};
  }

  // 메인 검증 실행
  async runCheck() {
    console.log(c('blue', '🔍 Context-Action 용어집 데이터 무결성 검증'));
    console.log(c('blue', '═'.repeat(60)));
    
    try {
      this.loadData();
      this.checkJsonStructure();
      this.checkDataCompleteness();
      this.checkIndexIntegrity();
      this.checkRelationalIntegrity();
      this.checkSearchReliability();
      this.generateReport();
    } catch (error) {
      this.errors.push(`Critical error: ${error.message}`);
      this.generateReport();
      process.exit(1);
    }
  }

  // 1. 데이터 로딩 및 기본 검증
  loadData() {
    console.log(c('cyan', '\n📂 1. 데이터 로딩 및 기본 검증'));
    
    if (!fs.existsSync(this.dataFile)) {
      throw new Error(`Data file not found: ${this.dataFile}`);
    }

    const rawData = fs.readFileSync(this.dataFile, 'utf8');
    
    try {
      this.data = JSON.parse(rawData);
      console.log(c('green', '✅ JSON 파싱 성공'));
    } catch (error) {
      throw new Error(`JSON parsing failed: ${error.message}`);
    }

    // 파일 크기 및 기본 통계
    const stats = fs.statSync(this.dataFile);
    this.stats.fileSize = Math.round(stats.size / 1024);
    this.stats.totalTerms = this.data.metadata?.totalTerms || 0;
    
    console.log(c('gray', `   파일 크기: ${this.stats.fileSize}KB`));
    console.log(c('gray', `   총 용어 수: ${this.stats.totalTerms}개`));
  }

  // 2. JSON 구조 검증
  checkJsonStructure() {
    console.log(c('cyan', '\n📋 2. JSON 구조 무결성 검증'));
    
    const requiredKeys = ['metadata', 'categories', 'terms', 'index'];
    const missingKeys = requiredKeys.filter(key => !(key in this.data));
    
    if (missingKeys.length > 0) {
      this.errors.push(`Missing required top-level keys: ${missingKeys.join(', ')}`);
    } else {
      console.log(c('green', '✅ 필수 최상위 키 모두 존재'));
    }

    // 메타데이터 구조 검증
    const metadata = this.data.metadata;
    const requiredMetadata = ['version', 'generated', 'totalTerms', 'categories'];
    const missingMetadata = requiredMetadata.filter(key => !(key in metadata));
    
    if (missingMetadata.length > 0) {
      this.errors.push(`Missing metadata fields: ${missingMetadata.join(', ')}`);
    } else {
      console.log(c('green', '✅ 메타데이터 구조 완전'));
    }

    // 카테고리 구조 검증
    if (!this.data.categories || typeof this.data.categories !== 'object') {
      this.errors.push('Categories structure is invalid');
    } else {
      console.log(c('green', '✅ 카테고리 구조 유효'));
    }

    // 용어 구조 검증
    if (!this.data.terms || typeof this.data.terms !== 'object') {
      this.errors.push('Terms structure is invalid');
    } else {
      console.log(c('green', '✅ 용어 구조 유효'));
    }

    // 인덱스 구조 검증
    const index = this.data.index;
    if (!index || !index.byKeyword || !index.byAlias) {
      this.errors.push('Index structure is incomplete');
    } else {
      console.log(c('green', '✅ 인덱스 구조 완전'));
    }
  }

  // 3. 데이터 완전성 검증
  checkDataCompleteness() {
    console.log(c('cyan', '\n📊 3. 데이터 완전성 검증'));
    
    const terms = this.data.terms;
    const categories = this.data.categories;
    
    // 용어 필수 필드 검증
    let incompleteTerms = 0;
    const requiredTermFields = ['title', 'category'];
    
    for (const [termId, term] of Object.entries(terms)) {
      const missingFields = requiredTermFields.filter(field => !term[field]);
      if (missingFields.length > 0) {
        this.errors.push(`Term ${termId} missing fields: ${missingFields.join(', ')}`);
        incompleteTerms++;
      }
      
      // 카테고리 존재 여부 확인
      if (term.category && !categories[term.category]) {
        this.errors.push(`Term ${termId} references non-existent category: ${term.category}`);
      }
    }

    if (incompleteTerms === 0) {
      console.log(c('green', '✅ 모든 용어의 필수 필드 완전'));
    } else {
      console.log(c('red', `❌ ${incompleteTerms}개 용어에 필수 필드 누락`));
    }

    // 카테고리별 용어 수 일치성 검증
    let categoryCountMismatches = 0;
    for (const [categoryId, categoryData] of Object.entries(categories)) {
      const declaredCount = categoryData.termCount;
      const actualCount = categoryData.terms ? categoryData.terms.length : 0;
      
      if (declaredCount !== actualCount) {
        this.errors.push(`Category ${categoryId}: declared count ${declaredCount} != actual count ${actualCount}`);
        categoryCountMismatches++;
      }
    }

    if (categoryCountMismatches === 0) {
      console.log(c('green', '✅ 카테고리별 용어 수 일치성 확인'));
    } else {
      console.log(c('red', `❌ ${categoryCountMismatches}개 카테고리에서 용어 수 불일치`));
    }

    // 전체 용어 수 일치성 검증
    const metadataTotal = this.data.metadata.totalTerms;
    const actualTotal = Object.keys(terms).length;
    
    if (metadataTotal !== actualTotal) {
      this.errors.push(`Metadata total terms ${metadataTotal} != actual terms ${actualTotal}`);
    } else {
      console.log(c('green', '✅ 전체 용어 수 메타데이터 일치'));
    }
  }

  // 4. 인덱스 무결성 검증
  checkIndexIntegrity() {
    console.log(c('cyan', '\n🔗 4. 인덱스 무결성 검증'));
    
    const terms = this.data.terms;
    const keywordIndex = this.data.index.byKeyword;
    const aliasIndex = this.data.index.byAlias;
    
    // 키워드 인덱스 검증
    let keywordErrors = 0;
    for (const [keyword, termIds] of Object.entries(keywordIndex)) {
      if (!Array.isArray(termIds)) {
        this.errors.push(`Keyword index for '${keyword}' is not an array`);
        keywordErrors++;
        continue;
      }
      
      for (const termId of termIds) {
        if (!terms[termId]) {
          this.errors.push(`Keyword '${keyword}' references non-existent term: ${termId}`);
          keywordErrors++;
        }
      }
    }

    if (keywordErrors === 0) {
      console.log(c('green', '✅ 키워드 인덱스 무결성 확인'));
    } else {
      console.log(c('red', `❌ 키워드 인덱스에서 ${keywordErrors}개 오류 발견`));
    }

    // 별칭 인덱스 검증
    let aliasErrors = 0;
    for (const [alias, termId] of Object.entries(aliasIndex)) {
      if (!terms[termId]) {
        this.errors.push(`Alias '${alias}' references non-existent term: ${termId}`);
        aliasErrors++;
      }
    }

    if (aliasErrors === 0) {
      console.log(c('green', '✅ 별칭 인덱스 무결성 확인'));
    } else {
      console.log(c('red', `❌ 별칭 인덱스에서 ${aliasErrors}개 오류 발견`));
    }

    // 인덱스 통계
    this.stats.keywordCount = Object.keys(keywordIndex).length;
    this.stats.aliasCount = Object.keys(aliasIndex).length;
    
    console.log(c('gray', `   키워드 인덱스: ${this.stats.keywordCount}개`));
    console.log(c('gray', `   별칭 인덱스: ${this.stats.aliasCount}개`));
  }

  // 5. 관계형 데이터 무결성 검증
  checkRelationalIntegrity() {
    console.log(c('cyan', '\n🔗 5. 관계형 데이터 무결성 검증'));
    
    const terms = this.data.terms;
    let relationalErrors = 0;
    let orphanedTerms = 0;
    let relatedTermsCount = 0;

    for (const [termId, term] of Object.entries(terms)) {
      // 관련 용어 참조 검증
      if (term.relatedTerms && Array.isArray(term.relatedTerms)) {
        relatedTermsCount++;
        for (const relatedId of term.relatedTerms) {
          if (!terms[relatedId]) {
            this.errors.push(`Term ${termId} references non-existent related term: ${relatedId}`);
            relationalErrors++;
          }
        }
      } else if (term.relatedTerms === undefined || term.relatedTerms.length === 0) {
        orphanedTerms++;
      }

      // 카테고리 내 용어 참조 검증
      const category = this.data.categories[term.category];
      if (category && category.terms && !category.terms.includes(termId)) {
        this.errors.push(`Term ${termId} not listed in its category ${term.category}`);
        relationalErrors++;
      }
    }

    if (relationalErrors === 0) {
      console.log(c('green', '✅ 관련 용어 참조 무결성 확인'));
    } else {
      console.log(c('red', `❌ 관련 용어 참조에서 ${relationalErrors}개 오류`));
    }

    console.log(c('gray', `   관련 용어가 있는 용어: ${relatedTermsCount}개`));
    console.log(c('gray', `   관련 용어가 없는 용어: ${orphanedTerms}개`));
    
    if (orphanedTerms > this.stats.totalTerms * 0.3) {
      this.warnings.push(`High number of orphaned terms (${orphanedTerms}), consider adding more relationships`);
    }
  }

  // 6. 검색 신뢰도 테스트
  checkSearchReliability() {
    console.log(c('cyan', '\n🔍 6. 검색 시스템 신뢰도 테스트'));
    
    const terms = this.data.terms;
    const keywordIndex = this.data.index.byKeyword;
    const aliasIndex = this.data.index.byAlias;
    
    // 검색 커버리지 테스트
    let searchableTerms = 0;
    let unsearchableTerms = [];
    
    for (const [termId, term] of Object.entries(terms)) {
      let isSearchable = false;
      
      // 직접 제목으로 검색 가능한지 확인
      const titleLower = term.title.toLowerCase();
      
      // 키워드 인덱스에서 검색 가능한지 확인
      for (const [keyword, termIds] of Object.entries(keywordIndex)) {
        if (termIds.includes(termId)) {
          isSearchable = true;
          break;
        }
      }
      
      // 별칭 인덱스에서 검색 가능한지 확인
      for (const [alias, aliasTermId] of Object.entries(aliasIndex)) {
        if (aliasTermId === termId) {
          isSearchable = true;
          break;
        }
      }
      
      // 제목 기반 퍼지 검색으로 검색 가능한지 확인 (단어 분해)
      const titleWords = titleLower.split(/\s+/).filter(word => word.length > 2);
      for (const word of titleWords) {
        if (keywordIndex[word]) {
          isSearchable = true;
          break;
        }
      }
      
      if (isSearchable) {
        searchableTerms++;
      } else {
        unsearchableTerms.push(termId);
      }
    }
    
    const searchCoverage = (searchableTerms / this.stats.totalTerms * 100).toFixed(1);
    
    if (searchCoverage >= 95) {
      console.log(c('green', `✅ 검색 커버리지 우수: ${searchCoverage}%`));
    } else if (searchCoverage >= 85) {
      console.log(c('yellow', `⚠️ 검색 커버리지 보통: ${searchCoverage}%`));
      this.warnings.push(`Search coverage could be improved: ${searchCoverage}%`);
    } else {
      console.log(c('red', `❌ 검색 커버리지 부족: ${searchCoverage}%`));
      this.errors.push(`Low search coverage: ${searchCoverage}%`);
    }
    
    if (unsearchableTerms.length > 0) {
      console.log(c('gray', `   검색 불가능한 용어: ${unsearchableTerms.slice(0, 5).join(', ')}${unsearchableTerms.length > 5 ? '...' : ''}`));
    }
    
    this.stats.searchCoverage = searchCoverage;
    this.stats.searchableTerms = searchableTerms;
    this.stats.unsearchableTerms = unsearchableTerms.length;
  }

  // 7. 최종 보고서 생성
  generateReport() {
    console.log(c('blue', '\n📊 데이터 무결성 검증 보고서'));
    console.log(c('blue', '═'.repeat(60)));
    
    // 전체 상태
    const hasErrors = this.errors.length > 0;
    const hasWarnings = this.warnings.length > 0;
    
    if (!hasErrors && !hasWarnings) {
      console.log(c('green', '🎉 완벽한 데이터 무결성 확인 - 모든 검증 통과!'));
    } else if (!hasErrors && hasWarnings) {
      console.log(c('yellow', '⚠️ 경고사항이 있지만 기본적으로 안전한 상태'));
    } else {
      console.log(c('red', '❌ 심각한 문제 발견 - 즉시 수정 필요'));
    }
    
    // 통계 요약
    console.log(c('cyan', '\n📈 데이터 통계:'));
    console.log(c('gray', `   파일 크기: ${this.stats.fileSize}KB`));
    console.log(c('gray', `   총 용어 수: ${this.stats.totalTerms}개`));
    console.log(c('gray', `   키워드 인덱스: ${this.stats.keywordCount}개`));
    console.log(c('gray', `   별칭 인덱스: ${this.stats.aliasCount}개`));
    console.log(c('gray', `   검색 커버리지: ${this.stats.searchCoverage}%`));
    
    // 오류 및 경고 표시
    if (this.errors.length > 0) {
      console.log(c('red', `\n❌ 발견된 오류 (${this.errors.length}개):`));
      this.errors.forEach((error, index) => {
        console.log(c('red', `   ${index + 1}. ${error}`));
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(c('yellow', `\n⚠️ 경고사항 (${this.warnings.length}개):`));
      this.warnings.forEach((warning, index) => {
        console.log(c('yellow', `   ${index + 1}. ${warning}`));
      });
    }
    
    // 신뢰도 평가
    console.log(c('cyan', '\n🎯 시스템 신뢰도 평가:'));
    
    const reliabilityScore = this.calculateReliabilityScore();
    let reliabilityGrade = '';
    let reliabilityColor = '';
    
    if (reliabilityScore >= 95) {
      reliabilityGrade = 'A+ (매우 높음)';
      reliabilityColor = 'green';
    } else if (reliabilityScore >= 90) {
      reliabilityGrade = 'A (높음)';
      reliabilityColor = 'green';
    } else if (reliabilityScore >= 80) {
      reliabilityGrade = 'B (보통)';
      reliabilityColor = 'yellow';
    } else if (reliabilityScore >= 70) {
      reliabilityGrade = 'C (낮음)';
      reliabilityColor = 'yellow';
    } else {
      reliabilityGrade = 'D (매우 낮음)';
      reliabilityColor = 'red';
    }
    
    console.log(c(reliabilityColor, `   신뢰도 점수: ${reliabilityScore}/100 (${reliabilityGrade})`));
    
    // 추천사항
    console.log(c('cyan', '\n💡 추천사항:'));
    if (this.stats.searchCoverage < 95) {
      console.log(c('gray', '   • 검색 커버리지 향상을 위한 키워드/별칭 추가'));
    }
    if (this.errors.length > 0) {
      console.log(c('gray', '   • 발견된 오류 즉시 수정'));
    }
    if (this.warnings.length > 0) {
      console.log(c('gray', '   • 경고사항 검토 및 개선 고려'));
    }
    if (reliabilityScore >= 95) {
      console.log(c('gray', '   • 현재 상태 유지 및 정기적 검증 수행'));
    }
    
    console.log(c('blue', '\n' + '═'.repeat(60)));
    
    // 종료 코드 설정
    if (hasErrors) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }

  // 신뢰도 점수 계산
  calculateReliabilityScore() {
    let score = 100;
    
    // 오류에 대한 감점
    score -= this.errors.length * 10;
    
    // 경고에 대한 감점
    score -= this.warnings.length * 2;
    
    // 검색 커버리지에 대한 보너스/감점
    const coverageBonus = Math.max(0, (parseFloat(this.stats.searchCoverage) - 90) * 0.5);
    const coveragePenalty = Math.max(0, (90 - parseFloat(this.stats.searchCoverage)) * 1);
    score += coverageBonus - coveragePenalty;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

// 메인 실행
async function main() {
  const dataFile = process.argv[2] || 'glossary-data.json';
  const checker = new DataIntegrityChecker(dataFile);
  await checker.runCheck();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DataIntegrityChecker;