#!/usr/bin/env node

/**
 * 셀프 테스트 실행기
 */

const fs = require('fs').promises;
const path = require('path');

async function runSelfTest() {
  console.log('🧪 Context-Action 구조적 검색 도구 셀프 테스트');
  console.log('==============================================\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  function test(name, condition, details = '') {
    totalTests++;
    const status = condition ? '✅' : '❌';
    console.log(`${status} ${name}${details ? ': ' + details : ''}`);
    if (condition) passedTests++;
    return condition;
  }
  
  try {
    // 1. 기본 데이터 파일 존재 확인
    console.log('📂 기본 데이터 파일 확인:');
    const dataPath = path.join(__dirname, '../implementations/_data');
    
    const requiredFiles = [
      'mappings.json',
      'structural-analysis.json',
      'dashboard.json'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(dataPath, file);
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      test(`${file} 존재`, exists);
    }
    
    // 2. 용어 정의 파일 확인
    console.log('\n📖 용어 정의 파일 확인:');
    const termsPath = path.join(__dirname, '../terms');
    const termFiles = ['core-concepts.md', 'api-terms.md', 'architecture-terms.md'];
    
    for (const file of termFiles) {
      const filePath = path.join(termsPath, file);
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      test(`${file} 존재`, exists);
    }
    
    // 3. 데이터 내용 검증
    console.log('\n🔍 데이터 내용 검증:');
    const mappings = JSON.parse(await fs.readFile(path.join(dataPath, 'mappings.json'), 'utf-8'));
    const analysis = JSON.parse(await fs.readFile(path.join(dataPath, 'structural-analysis.json'), 'utf-8'));
    
    test('매핑 데이터 유효성', mappings.terms && Object.keys(mappings.terms).length > 0, 
      `${Object.keys(mappings.terms).length}개 용어`);
    
    test('구조 분석 유효성', analysis.metadata && analysis.metadata.totalTerms > 0,
      `${analysis.metadata.totalTerms}개 용어 분석`);
    
    test('카테고리 데이터', analysis.categories && Object.keys(analysis.categories).length >= 3,
      `${Object.keys(analysis.categories).length}개 카테고리`);
    
    // 4. 검색 기능 테스트
    console.log('\n🔍 검색 기능 테스트:');
    
    // 간단한 키워드 검색 시뮬레이션
    const searchTerms = ['action', 'store', 'handler'];
    const coreConceptsContent = await fs.readFile(path.join(termsPath, 'core-concepts.md'), 'utf-8');
    
    searchTerms.forEach(term => {
      const found = coreConceptsContent.toLowerCase().includes(term);
      test(`"${term}" 키워드 찾기`, found);
    });
    
    // 5. 구조적 관계 확인
    console.log('\n🕸️ 구조적 관계 확인:');
    
    test('중심성 데이터', analysis.centrality && analysis.centrality.rankings,
      analysis.centrality?.rankings ? `${analysis.centrality.rankings.length}개 순위` : '');
    
    test('클러스터 데이터', analysis.clusters && analysis.clusters.length > 0,
      `${analysis.clusters?.length || 0}개 클러스터`);
    
    test('의존성 데이터', analysis.dependencies && analysis.dependencies.levelDistribution,
      '의존성 레벨 분석 완료');
    
    // 6. 실제 용어 검색 테스트
    console.log('\n🎯 실제 용어 검색 테스트:');
    
    // ActionRegister 용어 찾기
    const actionRegisterFound = Object.keys(mappings.terms).some(termId => 
      termId.includes('actionregister') || termId.includes('action-register')
    );
    test('ActionRegister 용어 매핑', actionRegisterFound);
    
    // Store 관련 용어들 찾기
    const storeTerms = Object.keys(mappings.terms).filter(termId => 
      termId.includes('store')
    );
    test('Store 관련 용어들', storeTerms.length > 0, `${storeTerms.length}개 발견`);
    
    // 구현이 있는 용어 확인
    const implementedTerms = Object.entries(mappings.terms)
      .filter(([termId, impls]) => impls.length > 0);
    test('구현된 용어 존재', implementedTerms.length > 0, 
      `${implementedTerms.length}개 용어에 구현 존재`);
    
    // 7. 고급 기능 테스트
    console.log('\n⚡ 고급 기능 테스트:');
    
    // 다중 구현 용어 확인
    const multipleImplTerms = Object.entries(mappings.terms)
      .filter(([termId, impls]) => impls.length > 1);
    test('다중 구현 용어', multipleImplTerms.length > 0,
      `${multipleImplTerms.length}개 용어`);
    
    // 카테고리 간 연결성 확인
    const crossCategoryRefs = Object.values(analysis.categories)
      .some(cat => cat.crossCategoryReferences && Object.keys(cat.crossCategoryReferences).length > 0);
    test('카테고리 간 연결성', crossCategoryRefs);
    
    // 관계 네트워크 확인
    const hasRelationships = analysis.relationships && 
      (analysis.relationships.semanticReferences > 0 || analysis.relationships.coImplementations > 0);
    test('관계 네트워크', hasRelationships,
      `${analysis.relationships?.semanticReferences || 0}개 의미적 + ${analysis.relationships?.coImplementations || 0}개 공동구현`);
    
    // 8. 성능 특성 테스트
    console.log('\n⚡ 성능 특성 테스트:');
    
    // 데이터 크기 확인
    const mappingsSize = JSON.stringify(mappings).length;
    const analysisSize = JSON.stringify(analysis).length;
    const totalSizeMB = (mappingsSize + analysisSize) / (1024 * 1024);
    
    test('메모리 효율성', totalSizeMB < 10, `${totalSizeMB.toFixed(2)}MB`);
    
    // 용어 수 대비 관계 밀도
    const relationshipDensity = analysis.metadata.totalRelationships / analysis.metadata.totalTerms;
    test('관계 밀도', relationshipDensity > 1, `용어당 ${relationshipDensity.toFixed(2)}개 관계`);
    
    // 구현 커버리지
    const implementationRate = implementedTerms.length / Object.keys(mappings.terms).length;
    test('구현 커버리지', implementationRate > 0.5, `${(implementationRate * 100).toFixed(1)}%`);
    
    // 9. 실용성 테스트
    console.log('\n🎯 실용성 테스트:');
    
    // 신입 개발자 온보딩 시나리오
    const topCentralTerms = analysis.centrality?.rankings?.slice(0, 5) || [];
    test('온보딩 가이드', topCentralTerms.length >= 3, `상위 ${topCentralTerms.length}개 핵심 용어`);
    
    // 구현 참고자료 시나리오
    const implementationExamples = Object.values(mappings.terms)
      .reduce((sum, impls) => sum + impls.length, 0);
    test('구현 참고자료', implementationExamples > 50, `${implementationExamples}개 구현 예제`);
    
    // 아키텍처 분석 시나리오
    const dependencyLevels = analysis.dependencies?.levelDistribution || {};
    const hasMultipleLevels = Object.keys(dependencyLevels).length > 2;
    test('아키텍처 분석', hasMultipleLevels, `${Object.keys(dependencyLevels).length}개 의존성 레벨`);
    
    // 최종 결과 출력
    console.log('\n📊 셀프 테스트 결과:');
    console.log(`총 테스트: ${totalTests}개`);
    console.log(`✅ 통과: ${passedTests}개`);
    console.log(`❌ 실패: ${totalTests - passedTests}개`);
    console.log(`성공률: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests / totalTests >= 0.9) {
      console.log('\n🎉 시스템이 정상적으로 작동합니다!');
    } else if (passedTests / totalTests >= 0.75) {
      console.log('\n⚠️ 시스템이 기본 기능을 갖추었지만 일부 개선이 필요합니다.');
    } else {
      console.log('\n🔧 시스템에 상당한 문제가 있습니다. 점검이 필요합니다.');
    }
    
    // 실제 검색 시연
    console.log('\n🔍 실제 검색 시연:');
    console.log('검색어 "action" 결과:');
    
    const actionResults = Object.entries(mappings.terms)
      .filter(([termId, impls]) => 
        termId.includes('action') || 
        impls.some(impl => impl.name.toLowerCase().includes('action'))
      )
      .slice(0, 3);
    
    actionResults.forEach(([termId, impls], index) => {
      console.log(`  ${index + 1}. ${termId}`);
      console.log(`     구현: ${impls.length}개`);
      if (impls.length > 0) {
        console.log(`     예시: ${impls[0].name} (${impls[0].file})`);
      }
    });
    
    return passedTests / totalTests >= 0.8;
    
  } catch (error) {
    console.error('❌ 셀프 테스트 실행 중 오류:', error.message);
    return false;
  }
}

if (require.main === module) {
  runSelfTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 셀프 테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = { runSelfTest };