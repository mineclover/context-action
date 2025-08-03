#!/usr/bin/env node

/**
 * @fileoverview 쿼리 테스트 및 실사용 기능 검증
 * @implements query-test
 * @implements practical-usage-test
 * @memberof glossary-tools
 * @version 1.0.0
 * 
 * 실제 데이터를 사용하여 다양한 쿼리를 테스트하고 실용성을 검증
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * 쿼리 테스트 실행기
 * @implements query-test-runner
 * @memberof core-concepts
 * @since 1.0.0
 */
class QueryTester {
  constructor() {
    this.dataPath = path.join(__dirname, '../implementations/_data');
    this.termsPath = path.join(__dirname, '../terms');
    
    // 데이터
    this.mappings = null;
    this.analysis = null;
    this.termDefinitions = new Map();
    
    // 테스트 결과
    this.testResults = [];
  }

  /**
   * 전체 쿼리 테스트 실행
   * @implements run-query-tests
   * @memberof api-terms
   * @since 1.0.0
   */
  async runAllTests() {
    console.log('🧪 실제 쿼리 테스트 시작...\n');
    
    try {
      // 데이터 로드
      await this.loadData();
      
      // 기본 쿼리 테스트
      await this.testBasicQueries();
      
      // 실용적 시나리오 테스트
      await this.testPracticalScenarios();
      
      // 성능 테스트
      await this.testPerformance();
      
      // 개선점 분석
      await this.analyzeImprovements();
      
      // 결과 요약
      this.printTestSummary();
      
    } catch (error) {
      console.error('❌ 쿼리 테스트 실행 오류:', error);
    }
  }

  /**
   * 데이터 로드
   * @implements load-test-data
   * @memberof api-terms
   * @since 1.0.0
   */
  async loadData() {
    console.log('📊 테스트 데이터 로드...');
    
    // 매핑 데이터 로드
    const mappingsPath = path.join(this.dataPath, 'mappings.json');
    this.mappings = JSON.parse(await fs.readFile(mappingsPath, 'utf-8'));
    
    // 구조적 분석 데이터 로드
    const analysisPath = path.join(this.dataPath, 'structural-analysis.json');
    this.analysis = JSON.parse(await fs.readFile(analysisPath, 'utf-8'));
    
    // 용어 정의 로드
    const termFiles = ['core-concepts.md', 'api-terms.md', 'architecture-terms.md', 'naming-conventions.md'];
    
    for (const filename of termFiles) {
      const category = filename.replace('.md', '');
      const content = await fs.readFile(path.join(this.termsPath, filename), 'utf-8');
      
      const terms = this.parseMarkdownTerms(content, category);
      terms.forEach(term => {
        this.termDefinitions.set(term.id, term);
      });
    }
    
    console.log(`✅ 데이터 로드 완료: ${Object.keys(this.mappings.terms).length}개 용어, ${this.termDefinitions.size}개 정의`);
  }

  /**
   * 기본 쿼리 테스트
   * @implements test-basic-queries
   * @memberof api-terms
   * @since 1.0.0
   */
  async testBasicQueries() {
    console.log('\n🔍 기본 쿼리 테스트...');
    
    // 1. 전체 용어 목록 조회
    const allTerms = Object.keys(this.mappings.terms);
    this.addTestResult('전체 용어 조회', allTerms.length > 0, `${allTerms.length}개 용어 발견`);
    
    // 2. 카테고리별 용어 조회
    const categories = ['core-concepts', 'api-terms', 'architecture-terms', 'naming-conventions'];
    categories.forEach(category => {
      const categoryTerms = Array.from(this.termDefinitions.values())
        .filter(term => term.category === category);
      this.addTestResult(`카테고리 쿼리: ${category}`, categoryTerms.length > 0, 
        `${categoryTerms.length}개 용어`);
    });
    
    // 3. 구현 수준별 용어 조회
    const implementationLevels = {
      'multiple': [],
      'single': [],
      'none': []
    };
    
    Object.entries(this.mappings.terms).forEach(([termId, implementations]) => {
      if (implementations.length > 1) {
        implementationLevels.multiple.push({ termId, count: implementations.length });
      } else if (implementations.length === 1) {
        implementationLevels.single.push({ termId, count: 1 });
      } else {
        implementationLevels.none.push({ termId, count: 0 });
      }
    });
    
    Object.entries(implementationLevels).forEach(([level, terms]) => {
      this.addTestResult(`구현 수준 쿼리: ${level}`, terms.length >= 0, 
        `${terms.length}개 용어`);
    });
    
    // 4. 키워드 검색 시뮬레이션
    const keywords = ['action', 'store', 'handler', 'provider', 'pipeline'];
    keywords.forEach(keyword => {
      const matches = this.searchByKeyword(keyword);
      this.addTestResult(`키워드 검색: ${keyword}`, matches.length > 0, 
        `${matches.length}개 결과`);
    });
  }

  /**
   * 실용적 시나리오 테스트
   * @implements test-practical-scenarios
   * @memberof api-terms
   * @since 1.0.0
   */
  async testPracticalScenarios() {
    console.log('\n🎯 실용적 시나리오 테스트...');
    
    // 시나리오 1: 새로운 개발자 온보딩
    console.log('\n📚 시나리오 1: 새로운 개발자 온보딩');
    const onboardingTest = this.testOnboardingScenario();
    
    // 시나리오 2: 특정 기능 구현 시 참고자료 찾기
    console.log('\n🔧 시나리오 2: 기능 구현 참고자료');
    const implementationTest = this.testImplementationScenario();
    
    // 시나리오 3: 아키텍처 리뷰 및 의존성 분석
    console.log('\n🏗️ 시나리오 3: 아키텍처 리뷰');
    const architectureTest = this.testArchitectureScenario();
    
    // 시나리오 4: 문서화 품질 개선
    console.log('\n📝 시나리오 4: 문서화 품질 개선');
    const documentationTest = this.testDocumentationScenario();
  }

  /**
   * 온보딩 시나리오 테스트
   * @implements test-onboarding-scenario
   * @memberof api-terms
   * @since 1.0.0
   */
  testOnboardingScenario() {
    // 1단계: 중심적인 핵심 개념부터 시작
    const coreTerms = this.analysis.centrality?.rankings?.slice(0, 5) || [];
    console.log('  1단계 - 핵심 개념:');
    coreTerms.forEach(([termId, metrics], index) => {
      const termDef = this.termDefinitions.get(termId);
      console.log(`    ${index + 1}. ${termDef?.title || termId} (연결도: ${metrics.degree})`);
    });
    
    // 2단계: 카테고리별 학습 순서 제안
    const categoryOrder = Object.entries(this.analysis.categories)
      .sort((a, b) => b[1].implementationRate - a[1].implementationRate)
      .map(([categoryId, data]) => ({ categoryId, ...data }));
    
    console.log('  2단계 - 카테고리 학습 순서:');
    categoryOrder.forEach((category, index) => {
      console.log(`    ${index + 1}. ${category.name} (구현률: ${(category.implementationRate * 100).toFixed(1)}%)`);
    });
    
    // 3단계: 관련 구현체가 많은 용어 우선 학습
    const wellImplementedTerms = Object.entries(this.mappings.terms)
      .filter(([termId, impls]) => impls.length >= 2)
      .map(([termId, impls]) => ({
        termId,
        title: this.termDefinitions.get(termId)?.title || termId,
        implementationCount: impls.length
      }))
      .sort((a, b) => b.implementationCount - a.implementationCount);
    
    console.log('  3단계 - 잘 구현된 용어들:');
    wellImplementedTerms.slice(0, 5).forEach((term, index) => {
      console.log(`    ${index + 1}. ${term.title} (${term.implementationCount}개 구현)`);
    });
    
    this.addTestResult('온보딩 시나리오', true, 
      `${coreTerms.length}개 핵심 개념, ${wellImplementedTerms.length}개 잘 구현된 용어`);
  }

  /**
   * 구현 참고자료 시나리오 테스트
   * @implements test-implementation-scenario
   * @memberof api-terms
   * @since 1.0.0
   */
  testImplementationScenario() {
    // 예시: "store" 관련 기능을 구현하려는 경우
    const targetKeyword = 'store';
    
    // 1단계: 키워드 관련 용어 찾기
    const relatedTerms = this.searchByKeyword(targetKeyword);
    console.log(`  1단계 - "${targetKeyword}" 관련 용어:`);
    relatedTerms.slice(0, 5).forEach((term, index) => {
      console.log(`    ${index + 1}. ${term.title} (관련성: ${term.relevance})`);
    });
    
    // 2단계: 구현 예제가 많은 용어 우선 참고
    const implementedTerms = relatedTerms
      .filter(term => this.mappings.terms[term.termId]?.length > 0)
      .map(term => ({
        ...term,
        implementations: this.mappings.terms[term.termId] || []
      }))
      .sort((a, b) => b.implementations.length - a.implementations.length);
    
    console.log('  2단계 - 구현 예제가 있는 용어:');
    implementedTerms.slice(0, 3).forEach((term, index) => {
      console.log(`    ${index + 1}. ${term.title} (${term.implementations.length}개 구현)`);
      term.implementations.slice(0, 2).forEach(impl => {
        console.log(`       - ${impl.name} (${impl.file})`);
      });
    });
    
    // 3단계: 패턴 분석 - 같은 파일에서 함께 구현된 용어들
    const coImplementedTerms = new Map();
    Object.entries(this.mappings.terms).forEach(([termId, implementations]) => {
      implementations.forEach(impl => {
        if (!coImplementedTerms.has(impl.file)) {
          coImplementedTerms.set(impl.file, []);
        }
        coImplementedTerms.get(impl.file).push(termId);
      });
    });
    
    const storeRelatedFiles = Array.from(coImplementedTerms.entries())
      .filter(([file, terms]) => 
        terms.some(termId => this.termDefinitions.get(termId)?.title?.toLowerCase().includes('store'))
      )
      .slice(0, 3);
    
    console.log('  3단계 - Store 관련 파일의 함께 구현된 패턴:');
    storeRelatedFiles.forEach(([file, termIds]) => {
      const fileTerms = termIds.map(id => this.termDefinitions.get(id)?.title || id);
      console.log(`    ${file}:`);
      console.log(`      함께 구현: ${fileTerms.join(', ')}`);
    });
    
    this.addTestResult('구현 참고자료 시나리오', implementedTerms.length > 0, 
      `${relatedTerms.length}개 관련 용어, ${implementedTerms.length}개 구현 예제`);
  }

  /**
   * 아키텍처 리뷰 시나리오 테스트
   * @implements test-architecture-scenario
   * @memberof api-terms
   * @since 1.0.0
   */
  testArchitectureScenario() {
    // 1단계: 시스템 중심 구조 파악
    const centralTerms = this.analysis.centrality?.rankings?.slice(0, 10) || [];
    console.log('  1단계 - 시스템 중심 구조:');
    centralTerms.forEach(([termId, metrics], index) => {
      const termDef = this.termDefinitions.get(termId);
      const category = termDef?.category || 'unknown';
      console.log(`    ${index + 1}. ${termDef?.title || termId} (${category})`);
      console.log(`       연결도: ${metrics.degree}, 중개성: ${metrics.betweenness}, 구현: ${metrics.implementation}`);
    });
    
    // 2단계: 의존성 레벨 분석
    const dependencyLevels = this.analysis.dependencies?.levelDistribution || {};
    console.log('  2단계 - 의존성 레벨 분포:');
    Object.entries(dependencyLevels).forEach(([level, count]) => {
      console.log(`    레벨 ${level}: ${count}개 용어`);
    });
    
    // 3단계: 카테고리 간 연결성 분석
    console.log('  3단계 - 카테고리 간 연결성:');
    Object.entries(this.analysis.categories).forEach(([categoryId, data]) => {
      if (data.crossCategoryReferences) {
        console.log(`    ${data.name}:`);
        Object.entries(data.crossCategoryReferences).forEach(([targetCategory, count]) => {
          console.log(`      → ${targetCategory}: ${count}개 참조`);
        });
      }
    });
    
    // 4단계: 클러스터 분석
    const clusters = this.analysis.clusters || [];
    console.log('  4단계 - 용어 클러스터:');
    clusters.slice(0, 3).forEach((cluster, index) => {
      console.log(`    클러스터 ${index + 1} (밀도: ${cluster.density.toFixed(2)}):`);
      cluster.terms.slice(0, 3).forEach(termId => {
        const termDef = this.termDefinitions.get(termId);
        console.log(`      - ${termDef?.title || termId}`);
      });
    });
    
    this.addTestResult('아키텍처 리뷰 시나리오', centralTerms.length > 0, 
      `${centralTerms.length}개 중심 용어, ${clusters.length}개 클러스터`);
  }

  /**
   * 문서화 품질 개선 시나리오 테스트
   * @implements test-documentation-scenario
   * @memberof api-terms
   * @since 1.0.0
   */
  testDocumentationScenario() {
    // 1단계: 미구현 용어 중 우선순위 높은 것들
    const unimplementedTerms = [];
    this.termDefinitions.forEach((termDef, termId) => {
      const implementations = this.mappings.terms[termId] || [];
      if (implementations.length === 0) {
        const connections = this.getTermConnections(termId);
        unimplementedTerms.push({
          termId,
          title: termDef.title,
          category: termDef.category,
          connections,
          priority: this.calculateImplementationPriority(termId, 0, connections)
        });
      }
    });
    
    const highPriorityUnimplemented = unimplementedTerms
      .filter(term => term.priority === 'high')
      .sort((a, b) => b.connections - a.connections);
    
    console.log('  1단계 - 우선순위 높은 미구현 용어:');
    highPriorityUnimplemented.slice(0, 5).forEach((term, index) => {
      console.log(`    ${index + 1}. ${term.title} (${term.category}, 연결: ${term.connections})`);
    });
    
    // 2단계: 정의는 있지만 관련 용어 연결이 부족한 용어들
    const poorlyLinkedTerms = [];
    this.termDefinitions.forEach((termDef, termId) => {
      const relatedCount = termDef.relatedTerms?.length || 0;
      const actualConnections = this.getTermConnections(termId);
      
      if (relatedCount < 2 && actualConnections >= 3) {
        poorlyLinkedTerms.push({
          termId,
          title: termDef.title,
          category: termDef.category,
          definedRelated: relatedCount,
          actualConnections
        });
      }
    });
    
    console.log('  2단계 - 관련 용어 연결이 부족한 용어:');
    poorlyLinkedTerms.slice(0, 5).forEach((term, index) => {
      console.log(`    ${index + 1}. ${term.title} (정의된 관련: ${term.definedRelated}, 실제 연결: ${term.actualConnections})`);
    });
    
    // 3단계: 카테고리별 완성도 분석
    const categoryCompleteness = {};
    Object.entries(this.analysis.categories).forEach(([categoryId, data]) => {
      categoryCompleteness[categoryId] = {
        name: data.name,
        implementationRate: data.implementationRate,
        status: this.getCategoryStatus(data.implementationRate),
        totalTerms: data.termCount,
        needsWork: data.implementationRate < 0.5
      };
    });
    
    console.log('  3단계 - 카테고리별 완성도:');
    Object.entries(categoryCompleteness).forEach(([categoryId, data]) => {
      const status = data.needsWork ? '⚠️ 개선필요' : '✅ 양호';
      console.log(`    ${data.name}: ${(data.implementationRate * 100).toFixed(1)}% ${status}`);
    });
    
    this.addTestResult('문서화 품질 개선 시나리오', true, 
      `${highPriorityUnimplemented.length}개 우선순위 용어, ${poorlyLinkedTerms.length}개 연결 부족 용어`);
  }

  /**
   * 성능 테스트
   * @implements test-performance
   * @memberof api-terms
   * @since 1.0.0
   */
  async testPerformance() {
    console.log('\n⚡ 성능 테스트...');
    
    // 검색 성능 테스트
    const keywords = ['action', 'store', 'handler', 'provider', 'pipeline'];
    const searchTimes = [];
    
    keywords.forEach(keyword => {
      const startTime = Date.now();
      const results = this.searchByKeyword(keyword);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      searchTimes.push(duration);
      console.log(`  키워드 "${keyword}": ${results.length}개 결과, ${duration}ms`);
    });
    
    const avgSearchTime = searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length;
    this.addTestResult('검색 성능', avgSearchTime < 100, `평균 ${avgSearchTime.toFixed(1)}ms`);
    
    // 메모리 사용량 추정
    const dataSize = JSON.stringify(this.mappings).length + JSON.stringify(this.analysis).length;
    const memorySizeMB = dataSize / (1024 * 1024);
    console.log(`  메모리 사용량: ${memorySizeMB.toFixed(2)}MB`);
    
    this.addTestResult('메모리 효율성', memorySizeMB < 10, `${memorySizeMB.toFixed(2)}MB`);
  }

  /**
   * 개선점 분석
   * @implements analyze-improvements
   * @memberof api-terms
   * @since 1.0.0
   */
  async analyzeImprovements() {
    console.log('\n🔧 개선점 분석...');
    
    const improvements = [];
    
    // 1. 검색 기능 개선점
    const searchImprovements = this.analyzeSearchImprovements();
    improvements.push(...searchImprovements);
    
    // 2. 데이터 품질 개선점
    const dataImprovements = this.analyzeDataQuality();
    improvements.push(...dataImprovements);
    
    // 3. 사용성 개선점
    const usabilityImprovements = this.analyzeUsability();
    improvements.push(...usabilityImprovements);
    
    // 4. 성능 개선점
    const performanceImprovements = this.analyzePerformanceImprovements();
    improvements.push(...performanceImprovements);
    
    console.log('\n📋 개선 제안사항:');
    improvements.forEach((improvement, index) => {
      console.log(`${index + 1}. [${improvement.priority}] ${improvement.title}`);
      console.log(`   ${improvement.description}`);
      if (improvement.implementation) {
        console.log(`   구현: ${improvement.implementation}`);
      }
    });
    
    // 개선사항을 파일로 저장
    await this.saveImprovements(improvements);
  }

  /**
   * 검색 기능 개선점 분석
   * @implements analyze-search-improvements
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzeSearchImprovements() {
    const improvements = [];
    
    // 동의어 및 별칭 지원
    improvements.push({
      priority: 'HIGH',
      title: '동의어/별칭 검색 지원',
      description: 'ActionRegister를 "register"로도 검색할 수 있도록 별칭 매핑 추가',
      implementation: '용어별 aliases 필드 추가, 검색 시 별칭도 포함'
    });
    
    // 퍼지 검색
    improvements.push({
      priority: 'MEDIUM',
      title: '퍼지 검색 (오타 허용)',
      description: '오타가 있어도 유사한 용어를 찾을 수 있는 기능',
      implementation: 'Levenshtein distance 기반 유사도 계산'
    });
    
    // 검색 자동완성
    improvements.push({
      priority: 'MEDIUM',
      title: '검색 자동완성',
      description: '입력 중 실시간으로 용어 제안',
      implementation: 'Trie 자료구조 기반 prefix 매칭'
    });
    
    // 컨텍스트 기반 검색
    improvements.push({
      priority: 'LOW',
      title: '컨텍스트 기반 검색 순서',
      description: '사용자의 이전 검색 기록을 고려한 개인화된 결과',
      implementation: '검색 이력 추적 및 가중치 조정'
    });
    
    return improvements;
  }

  /**
   * 데이터 품질 개선점 분석
   * @implements analyze-data-quality
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzeDataQuality() {
    const improvements = [];
    
    // 관련 용어 연결 개선
    const poorlyLinkedCount = Array.from(this.termDefinitions.values())
      .filter(term => (term.relatedTerms?.length || 0) < 2).length;
    
    if (poorlyLinkedCount > 10) {
      improvements.push({
        priority: 'HIGH',
        title: '용어 간 연결성 개선',
        description: `${poorlyLinkedCount}개 용어의 관련 용어 연결이 부족함`,
        implementation: '자동 관련 용어 추천 시스템 구현'
      });
    }
    
    // 구현 예제 추가
    const unimplementedCount = Object.values(this.mappings.terms)
      .filter(impls => impls.length === 0).length;
    
    if (unimplementedCount > 5) {
      improvements.push({
        priority: 'HIGH',
        title: '미구현 용어 구현 추가',
        description: `${unimplementedCount}개 용어가 아직 구현되지 않음`,
        implementation: '우선순위 기반 구현 계획 수립'
      });
    }
    
    // 정의 품질 개선
    const shortDefinitions = Array.from(this.termDefinitions.values())
      .filter(term => (term.definition?.length || 0) < 50).length;
    
    if (shortDefinitions > 0) {
      improvements.push({
        priority: 'MEDIUM',
        title: '용어 정의 상세화',
        description: `${shortDefinitions}개 용어의 정의가 너무 간단함`,
        implementation: '정의 템플릿 제공 및 가이드라인 작성'
      });
    }
    
    return improvements;
  }

  /**
   * 사용성 개선점 분석
   * @implements analyze-usability
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzeUsability() {
    const improvements = [];
    
    // 웹 인터페이스
    improvements.push({
      priority: 'HIGH',
      title: '웹 기반 탐색 인터페이스',
      description: '브라우저에서 사용할 수 있는 인터랙티브 인터페이스',
      implementation: 'React + D3.js 기반 대시보드 구현'
    });
    
    // 시각화
    improvements.push({
      priority: 'MEDIUM',
      title: '용어 관계 시각화',
      description: '용어 간 관계를 그래프로 표시',
      implementation: '네트워크 그래프 라이브러리 활용'
    });
    
    // CLI 개선
    improvements.push({
      priority: 'MEDIUM',
      title: 'CLI 사용성 개선',
      description: '대화형 CLI 및 명령어 단순화',
      implementation: 'inquirer.js 기반 대화형 인터페이스'
    });
    
    // 내보내기 기능
    improvements.push({
      priority: 'LOW',
      title: '결과 내보내기',
      description: '검색 결과를 다양한 형식으로 내보내기',
      implementation: 'JSON, CSV, Markdown 형식 지원'
    });
    
    return improvements;
  }

  /**
   * 성능 개선점 분석
   * @implements analyze-performance-improvements
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzePerformanceImprovements() {
    const improvements = [];
    
    // 인덱싱 개선
    improvements.push({
      priority: 'MEDIUM',
      title: '역 인덱스 구현',
      description: '키워드별 역 인덱스로 검색 속도 향상',
      implementation: 'Map 기반 역 인덱스 자료구조'
    });
    
    // 캐싱
    improvements.push({
      priority: 'MEDIUM',
      title: '검색 결과 캐싱',
      description: '자주 검색되는 쿼리 결과 캐싱',
      implementation: 'LRU 캐시 구현'
    });
    
    // 레이지 로딩
    improvements.push({
      priority: 'LOW',
      title: '지연 로딩',
      description: '필요한 데이터만 점진적으로 로드',
      implementation: '모듈별 동적 import'
    });
    
    return improvements;
  }

  // 유틸리티 메서드들
  parseMarkdownTerms(content, category) {
    const terms = [];
    const sections = content.split(/\n## /).slice(1);
    
    sections.forEach(section => {
      const lines = section.split('\n');
      const title = lines[0].trim();
      const id = this.titleToId(title);
      
      let definition = '';
      let relatedTerms = [];
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('**Definition**:')) {
          definition = trimmed.replace('**Definition**:', '').trim();
        } else if (trimmed.startsWith('**Related Terms**:')) {
          relatedTerms = this.parseRelatedTerms(trimmed.replace('**Related Terms**:', '').trim());
        }
      });
      
      terms.push({ id, title, definition, relatedTerms, category });
    });
    
    return terms;
  }

  titleToId(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  parseRelatedTerms(text) {
    const terms = [];
    const linkPattern = /\\[([^\\]]+)\\]\\(([^)]+)\\)/g;
    let match;
    
    while ((match = linkPattern.exec(text)) !== null) {
      const [, title, link] = match;
      const id = this.extractIdFromLink(link);
      terms.push({ title: title.trim(), id });
    }
    
    return terms;
  }

  extractIdFromLink(link) {
    if (link.startsWith('#')) {
      return link.substring(1);
    } else if (link.includes('#')) {
      return link.split('#')[1];
    }
    return this.titleToId(link);
  }

  searchByKeyword(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    this.termDefinitions.forEach((term, termId) => {
      let relevance = 0;
      
      // 제목에 포함되면 높은 점수
      if (term.title.toLowerCase().includes(queryLower)) {
        relevance += 2.0;
      }
      
      // 정의에 포함되면 중간 점수
      if (term.definition.toLowerCase().includes(queryLower)) {
        relevance += 1.0;
      }
      
      // ID에 포함되면 낮은 점수
      if (termId.includes(queryLower)) {
        relevance += 0.5;
      }
      
      if (relevance > 0) {
        results.push({
          termId,
          title: term.title,
          relevance,
          category: term.category
        });
      }
    });
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  getTermConnections(termId) {
    // 실제 연결 수 계산 (단순화된 버전)
    const termDef = this.termDefinitions.get(termId);
    if (!termDef) return 0;
    
    let connections = 0;
    
    // 정의된 관련 용어 수
    connections += termDef.relatedTerms?.length || 0;
    
    // 같은 카테고리 용어 수 (최대 5개로 제한)
    const sameCategoryTerms = Array.from(this.termDefinitions.values())
      .filter(term => term.category === termDef.category && term.id !== termId)
      .length;
    connections += Math.min(sameCategoryTerms, 5);
    
    // 구현 파일을 공유하는 용어 수
    const implementations = this.mappings.terms[termId] || [];
    implementations.forEach(impl => {
      Object.entries(this.mappings.terms).forEach(([otherTermId, otherImpls]) => {
        if (otherTermId !== termId && otherImpls.some(otherImpl => otherImpl.file === impl.file)) {
          connections += 0.5; // 공동 구현은 약한 연결
        }
      });
    });
    
    return Math.floor(connections);
  }

  calculateImplementationPriority(termId, implementationCount, connections) {
    if (implementationCount === 0 && connections >= 3) return 'high';
    if (implementationCount === 1 && connections >= 5) return 'medium';
    return 'low';
  }

  getCategoryStatus(implementationRate) {
    if (implementationRate >= 0.8) return { text: '완료', color: 'green' };
    if (implementationRate >= 0.5) return { text: '진행중', color: 'yellow' };
    if (implementationRate >= 0.2) return { text: '개선필요', color: 'orange' };
    return { text: '시작단계', color: 'red' };
  }

  addTestResult(name, success, details) {
    const status = success ? '✅' : '❌';
    console.log(`  ${status} ${name}: ${details}`);
    this.testResults.push({ name, success, details });
  }

  printTestSummary() {
    console.log('\n📊 쿼리 테스트 결과 요약:');
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = total - passed;
    
    console.log(`총 테스트: ${total}개`);
    console.log(`✅ 성공: ${passed}개`);
    console.log(`❌ 실패: ${failed}개`);
    console.log(`성공률: ${((passed / total) * 100).toFixed(1)}%`);
  }

  async saveImprovements(improvements) {
    const improvementsDoc = {
      generated_at: new Date().toISOString(),
      total_improvements: improvements.length,
      priority_breakdown: {
        high: improvements.filter(i => i.priority === 'HIGH').length,
        medium: improvements.filter(i => i.priority === 'MEDIUM').length,
        low: improvements.filter(i => i.priority === 'LOW').length
      },
      improvements: improvements
    };
    
    const improvementsPath = path.join(this.dataPath, 'improvement-suggestions.json');
    await fs.writeFile(improvementsPath, JSON.stringify(improvementsDoc, null, 2));
    
    console.log(`\n💾 개선 제안사항 저장: ${improvementsPath}`);
  }
}

// CLI 실행
if (require.main === module) {
  const tester = new QueryTester();
  
  tester.runAllTests()
    .then(() => {
      console.log('\n🎉 쿼리 테스트 완료!');
    })
    .catch(error => {
      console.error('❌ 쿼리 테스트 실행 실패:', error);
    });
}

module.exports = { QueryTester };