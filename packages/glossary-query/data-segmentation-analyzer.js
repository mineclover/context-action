#!/usr/bin/env node

/**
 * 정보 분할 단위 명확성 검증 도구
 * 대용량 JSON 환경에서 정보가 명확하고 일관된 단위로 분할되어 있는지 검증합니다.
 */

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

class DataSegmentationAnalyzer {
  constructor(dataFile) {
    this.dataFile = dataFile;
    this.data = null;
    this.segmentationIssues = [];
    this.stats = {};
  }

  // 메인 분석 실행
  async analyze() {
    console.log(c('blue', '📊 정보 분할 단위 명확성 검증'));
    console.log(c('blue', '═'.repeat(60)));
    
    this.loadData();
    this.analyzeTermSegmentation();
    this.analyzeCategorySegmentation();
    this.analyzeIndexSegmentation();
    this.analyzeRelationshipSegmentation();
    this.analyzeContentConsistency();
    this.generateSegmentationReport();
  }

  // 데이터 로딩
  loadData() {
    console.log(c('cyan', '\n📂 데이터 로딩 및 기본 구조 분석'));
    
    this.data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
    
    // 기본 통계
    this.stats = {
      totalTerms: Object.keys(this.data.terms).length,
      totalCategories: Object.keys(this.data.categories).length,
      totalKeywords: Object.keys(this.data.index.byKeyword).length,
      totalAliases: Object.keys(this.data.index.byAlias).length
    };
    
    console.log(c('gray', `   총 용어: ${this.stats.totalTerms}개`));
    console.log(c('gray', `   총 카테고리: ${this.stats.totalCategories}개`));
    console.log(c('gray', `   총 키워드: ${this.stats.totalKeywords}개`));
    console.log(c('gray', `   총 별칭: ${this.stats.totalAliases}개`));
  }

  // 1. 용어 분할의 명확성 검증
  analyzeTermSegmentation() {
    console.log(c('cyan', '\n📌 1. 용어 분할 단위 명확성 검증'));
    
    const terms = this.data.terms;
    let issueCount = 0;
    
    // 각 용어의 구조적 완전성 검사
    for (const [termId, term] of Object.entries(terms)) {
      const issues = [];
      
      // 필수 필드 검사
      if (!term.title) issues.push('제목 누락');
      if (!term.category) issues.push('카테고리 누락');
      if (!term.definition) issues.push('정의 누락');
      
      // ID와 제목의 일관성 검사
      const expectedId = this.titleToId(term.title);
      if (termId !== expectedId) {
        issues.push(`ID 불일치: ${termId} != ${expectedId}`);
      }
      
      // 정의의 품질 검사
      if (term.definition && term.definition.length < 20) {
        issues.push('정의가 너무 짧음 (<20자)');
      }
      
      // 구현체 정보 검사
      if (term.implementations) {
        for (const impl of term.implementations) {
          if (!impl.file || !impl.line) {
            issues.push('구현체 정보 불완전');
            break;
          }
        }
      }
      
      if (issues.length > 0) {
        this.segmentationIssues.push({
          type: 'term',
          id: termId,
          issues: issues
        });
        issueCount++;
      }
    }
    
    if (issueCount === 0) {
      console.log(c('green', '✅ 모든 용어의 분할 단위가 명확함'));
    } else {
      console.log(c('red', `❌ ${issueCount}개 용어에서 분할 문제 발견`));
    }
    
    // 중복 검사
    const titleMap = new Map();
    let duplicates = 0;
    
    for (const [termId, term] of Object.entries(terms)) {
      const title = term.title.toLowerCase();
      if (titleMap.has(title)) {
        duplicates++;
        this.segmentationIssues.push({
          type: 'duplicate',
          id: termId,
          issues: [`중복된 제목: "${term.title}" (기존: ${titleMap.get(title)})`]
        });
      } else {
        titleMap.set(title, termId);
      }
    }
    
    if (duplicates === 0) {
      console.log(c('green', '✅ 용어 제목 중복 없음'));
    } else {
      console.log(c('red', `❌ ${duplicates}개 중복 제목 발견`));
    }
  }

  // 2. 카테고리 분할의 명확성 검증
  analyzeCategorySegmentation() {
    console.log(c('cyan', '\n📂 2. 카테고리 분할 단위 명확성 검증'));
    
    const categories = this.data.categories;
    let issueCount = 0;
    
    // 카테고리별 용어 분포 분석
    const distribution = {};
    let totalTermsInCategories = 0;
    
    for (const [categoryId, categoryData] of Object.entries(categories)) {
      const issues = [];
      
      // 필수 필드 검사
      if (!categoryData.name) issues.push('카테고리 이름 누락');
      if (!categoryData.description) issues.push('카테고리 설명 누락');
      if (!categoryData.terms || !Array.isArray(categoryData.terms)) {
        issues.push('용어 목록 누락 또는 형식 오류');
      }
      
      // 용어 수 일치성 검사
      const declaredCount = categoryData.termCount;
      const actualCount = categoryData.terms ? categoryData.terms.length : 0;
      
      if (declaredCount !== actualCount) {
        issues.push(`용어 수 불일치: 선언(${declaredCount}) != 실제(${actualCount})`);
      }
      
      // 카테고리 크기 분석
      distribution[categoryId] = actualCount;
      totalTermsInCategories += actualCount;
      
      // 카테고리가 너무 크거나 작은지 검사
      if (actualCount > 50) {
        issues.push('카테고리가 너무 큼 (>50개 용어) - 세분화 필요');
      } else if (actualCount < 5) {
        issues.push('카테고리가 너무 작음 (<5개 용어) - 통합 고려');
      }
      
      if (issues.length > 0) {
        this.segmentationIssues.push({
          type: 'category',
          id: categoryId,
          issues: issues
        });
        issueCount++;
      }
    }
    
    // 전체 용어 수 일치성 검사
    if (totalTermsInCategories !== this.stats.totalTerms) {
      this.segmentationIssues.push({
        type: 'category',
        id: 'global',
        issues: [`전체 용어 수 불일치: 카테고리 합계(${totalTermsInCategories}) != 실제(${this.stats.totalTerms})`]
      });
      issueCount++;
    }
    
    if (issueCount === 0) {
      console.log(c('green', '✅ 모든 카테고리의 분할이 명확함'));
    } else {
      console.log(c('red', `❌ ${issueCount}개 카테고리에서 분할 문제 발견`));
    }
    
    // 카테고리 균형성 분석
    console.log(c('gray', '   카테고리별 용어 분포:'));
    for (const [categoryId, count] of Object.entries(distribution)) {
      const percentage = ((count / this.stats.totalTerms) * 100).toFixed(1);
      console.log(c('gray', `     ${categoryId}: ${count}개 (${percentage}%)`));
    }
  }

  // 3. 인덱스 분할의 명확성 검증
  analyzeIndexSegmentation() {
    console.log(c('cyan', '\n🔍 3. 인덱스 분할 단위 명확성 검증'));
    
    const keywordIndex = this.data.index.byKeyword;
    const aliasIndex = this.data.index.byAlias;
    let issueCount = 0;
    
    // 키워드 인덱스 검증
    const keywordStats = {
      totalEntries: Object.keys(keywordIndex).length,
      emptyEntries: 0,
      oversizedEntries: 0,
      averageTermsPerKeyword: 0
    };
    
    let totalMappings = 0;
    
    for (const [keyword, termIds] of Object.entries(keywordIndex)) {
      if (!Array.isArray(termIds) || termIds.length === 0) {
        keywordStats.emptyEntries++;
        this.segmentationIssues.push({
          type: 'index',
          id: `keyword:${keyword}`,
          issues: ['빈 키워드 엔트리']
        });
        issueCount++;
      } else {
        totalMappings += termIds.length;
        
        // 너무 많은 용어가 매핑된 키워드 (분할 부족)
        if (termIds.length > 20) {
          keywordStats.oversizedEntries++;
          this.segmentationIssues.push({
            type: 'index',
            id: `keyword:${keyword}`,
            issues: [`너무 많은 용어 매핑 (${termIds.length}개) - 키워드 세분화 필요`]
          });
          issueCount++;
        }
      }
    }
    
    keywordStats.averageTermsPerKeyword = (totalMappings / keywordStats.totalEntries).toFixed(2);
    
    // 별칭 인덱스 검증
    const aliasStats = {
      totalEntries: Object.keys(aliasIndex).length,
      invalidReferences: 0
    };
    
    for (const [alias, termId] of Object.entries(aliasIndex)) {
      if (!this.data.terms[termId]) {
        aliasStats.invalidReferences++;
        this.segmentationIssues.push({
          type: 'index',
          id: `alias:${alias}`,
          issues: [`존재하지 않는 용어 참조: ${termId}`]
        });
        issueCount++;
      }
    }
    
    if (issueCount === 0) {
      console.log(c('green', '✅ 인덱스 분할이 명확함'));
    } else {
      console.log(c('red', `❌ ${issueCount}개 인덱스에서 분할 문제 발견`));
    }
    
    console.log(c('gray', '   인덱스 통계:'));
    console.log(c('gray', `     키워드당 평균 용어 수: ${keywordStats.averageTermsPerKeyword}개`));
    console.log(c('gray', `     과도한 매핑 키워드: ${keywordStats.oversizedEntries}개`));
    console.log(c('gray', `     별칭 유효성: ${aliasStats.totalEntries - aliasStats.invalidReferences}/${aliasStats.totalEntries}`));
  }

  // 4. 관계 분할의 명확성 검증
  analyzeRelationshipSegmentation() {
    console.log(c('cyan', '\n🔗 4. 관계 분할 단위 명확성 검증'));
    
    const terms = this.data.terms;
    let issueCount = 0;
    
    const relationshipStats = {
      termsWithRelations: 0,
      totalRelations: 0,
      circularReferences: 0,
      asymmetricRelations: 0
    };
    
    // 각 용어의 관련 용어 검증
    for (const [termId, term] of Object.entries(terms)) {
      if (term.relatedTerms && term.relatedTerms.length > 0) {
        relationshipStats.termsWithRelations++;
        relationshipStats.totalRelations += term.relatedTerms.length;
        
        // 순환 참조 검사
        if (term.relatedTerms.includes(termId)) {
          relationshipStats.circularReferences++;
          this.segmentationIssues.push({
            type: 'relationship',
            id: termId,
            issues: ['자기 자신을 관련 용어로 참조 (순환 참조)']
          });
          issueCount++;
        }
        
        // 관련 용어가 너무 많은 경우 (분할 부족)
        if (term.relatedTerms.length > 10) {
          this.segmentationIssues.push({
            type: 'relationship',
            id: termId,
            issues: [`관련 용어가 너무 많음 (${term.relatedTerms.length}개) - 관계 정제 필요`]
          });
          issueCount++;
        }
        
        // 비대칭 관계 검사
        for (const relatedId of term.relatedTerms) {
          const relatedTerm = terms[relatedId];
          if (relatedTerm && relatedTerm.relatedTerms && 
              !relatedTerm.relatedTerms.includes(termId)) {
            relationshipStats.asymmetricRelations++;
          }
        }
      }
    }
    
    if (issueCount === 0) {
      console.log(c('green', '✅ 관계 분할이 명확함'));
    } else {
      console.log(c('red', `❌ ${issueCount}개 관계에서 분할 문제 발견`));
    }
    
    const avgRelations = relationshipStats.termsWithRelations > 0 
      ? (relationshipStats.totalRelations / relationshipStats.termsWithRelations).toFixed(2)
      : 0;
    
    console.log(c('gray', '   관계 통계:'));
    console.log(c('gray', `     관련 용어가 있는 용어: ${relationshipStats.termsWithRelations}개`));
    console.log(c('gray', `     평균 관련 용어 수: ${avgRelations}개`));
    console.log(c('gray', `     비대칭 관계: ${relationshipStats.asymmetricRelations}개`));
    console.log(c('gray', `     순환 참조: ${relationshipStats.circularReferences}개`));
  }

  // 5. 내용 일관성 검증
  analyzeContentConsistency() {
    console.log(c('cyan', '\n📝 5. 내용 일관성 및 품질 검증'));
    
    const terms = this.data.terms;
    let issueCount = 0;
    
    const contentStats = {
      averageDefinitionLength: 0,
      shortDefinitions: 0,
      longDefinitions: 0,
      missingImplementations: 0
    };
    
    let totalDefinitionLength = 0;
    
    for (const [termId, term] of Object.entries(terms)) {
      const issues = [];
      
      // 정의 품질 검사
      if (term.definition) {
        const defLength = term.definition.length;
        totalDefinitionLength += defLength;
        
        if (defLength < 50) {
          contentStats.shortDefinitions++;
          issues.push('정의가 너무 짧음 (<50자)');
        } else if (defLength > 500) {
          contentStats.longDefinitions++;
          issues.push('정의가 너무 길음 (>500자) - 요약 필요');
        }
        
        // 정의에 HTML 태그나 특수 문자 검사
        if (term.definition.includes('<') || term.definition.includes('>')) {
          issues.push('정의에 HTML 태그 포함');
        }
      }
      
      // 구현체 존재 여부
      if (!term.implementations || term.implementations.length === 0) {
        contentStats.missingImplementations++;
      }
      
      // 카테고리와 내용의 일치성
      const category = this.data.categories[term.category];
      if (category && !category.terms.includes(termId)) {
        issues.push('카테고리와 용어 목록 불일치');
      }
      
      if (issues.length > 0) {
        this.segmentationIssues.push({
          type: 'content',
          id: termId,
          issues: issues
        });
        issueCount++;
      }
    }
    
    contentStats.averageDefinitionLength = (totalDefinitionLength / this.stats.totalTerms).toFixed(0);
    
    if (issueCount === 0) {
      console.log(c('green', '✅ 내용 일관성이 우수함'));
    } else {
      console.log(c('red', `❌ ${issueCount}개 용어에서 내용 문제 발견`));
    }
    
    console.log(c('gray', '   내용 품질 통계:'));
    console.log(c('gray', `     평균 정의 길이: ${contentStats.averageDefinitionLength}자`));
    console.log(c('gray', `     짧은 정의: ${contentStats.shortDefinitions}개`));
    console.log(c('gray', `     긴 정의: ${contentStats.longDefinitions}개`));
    console.log(c('gray', `     구현체 없는 용어: ${contentStats.missingImplementations}개`));
  }

  // 보고서 생성
  generateSegmentationReport() {
    console.log(c('blue', '\n📊 정보 분할 단위 명확성 종합 보고서'));
    console.log(c('blue', '═'.repeat(60)));
    
    const totalIssues = this.segmentationIssues.length;
    
    if (totalIssues === 0) {
      console.log(c('green', '🎉 완벽한 정보 분할 - 모든 단위가 명확함!'));
    } else {
      console.log(c('red', `⚠️ ${totalIssues}개의 분할 문제 발견`));
    }
    
    // 문제 유형별 분류
    const issuesByType = {};
    this.segmentationIssues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });
    
    // 각 유형별 문제 출력
    for (const [type, issues] of Object.entries(issuesByType)) {
      console.log(c('cyan', `\n📋 ${type.toUpperCase()} 문제 (${issues.length}개):`));
      issues.slice(0, 5).forEach((issue, index) => {
        console.log(c('gray', `   ${index + 1}. ${issue.id}: ${issue.issues.join(', ')}`));
      });
      if (issues.length > 5) {
        console.log(c('gray', `   ... 그리고 ${issues.length - 5}개 더`));
      }
    }
    
    // 분할 품질 점수 계산
    const qualityScore = Math.max(0, 100 - (totalIssues * 2));
    let grade = '';
    
    if (qualityScore >= 95) grade = 'A+ (매우 우수)';
    else if (qualityScore >= 90) grade = 'A (우수)';
    else if (qualityScore >= 80) grade = 'B (양호)';
    else if (qualityScore >= 70) grade = 'C (보통)';
    else grade = 'D (개선 필요)';
    
    console.log(c('cyan', `\n🎯 분할 품질 점수: ${qualityScore}/100 (${grade})`));
    
    // 개선 권장사항
    console.log(c('cyan', '\n💡 개선 권장사항:'));
    if (qualityScore >= 95) {
      console.log(c('gray', '   • 현재 수준 유지 및 정기적 검증'));
    } else {
      console.log(c('gray', '   • 발견된 분할 문제 우선 수정'));
      console.log(c('gray', '   • 카테고리 균형성 재검토'));
      console.log(c('gray', '   • 관계 설정 품질 개선'));
    }
    
    console.log(c('blue', '\n' + '═'.repeat(60)));
  }

  // 제목을 ID로 변환 (generate-data.js와 동일한 로직)
  titleToId(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

// 메인 실행
async function main() {
  const dataFile = process.argv[2] || 'glossary-data.json';
  const analyzer = new DataSegmentationAnalyzer(dataFile);
  await analyzer.analyze();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DataSegmentationAnalyzer;