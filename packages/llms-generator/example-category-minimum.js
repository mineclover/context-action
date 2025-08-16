#!/usr/bin/env node

/**
 * CategoryMinimumGenerator 라이브러리 사용 예시
 * TypeScript로 빌드된 라이브러리를 JavaScript에서 사용하는 방법 데모
 */

import { CategoryMinimumGenerator } from './dist/index.js';

async function demonstrateLibraryUsage() {
  console.log('🔧 CategoryMinimumGenerator 라이브러리 사용 예시\n');

  // 1. 생성기 초기화
  console.log('📋 1. 생성기 초기화');
  const generator = new CategoryMinimumGenerator({
    dataDir: './data',
    outputDir: './library-output'
  });

  // 2. 사용 가능한 카테고리 확인
  console.log('📂 2. 사용 가능한 카테고리 확인');
  const categories = generator.getAvailableCategories();
  console.log(`사용 가능한 카테고리: ${categories.join(', ')}`);

  for (const category of categories) {
    const patterns = generator.getCategoryPatterns(category);
    console.log(`  - ${category}: ${patterns.join(', ')}`);
  }
  console.log('');

  // 3. 언어별 문서 통계 확인
  console.log('📊 3. 언어별 문서 통계 확인');
  const languages = ['en', 'ko'];
  
  for (const language of languages) {
    console.log(`\n${language.toUpperCase()} 언어:`);
    const availableDocs = generator.getAvailableDocuments(language);
    availableDocs.forEach(({ category, count }) => {
      console.log(`  - ${category}: ${count}개 문서`);
    });
    
    // 상세 통계
    const stats = generator.getAllStats(language);
    stats.forEach(stat => {
      console.log(`  📈 ${stat.category} 상세:`);
      console.log(`     총 문서: ${stat.totalDocuments}개`);
      console.log(`     평균 우선순위: ${stat.averagePriorityScore}`);
      console.log(`     티어별: ${JSON.stringify(stat.tierBreakdown)}`);
    });
  }

  // 4. 단일 카테고리 생성 테스트
  console.log('\n🎯 4. 단일 카테고리 생성 테스트');
  try {
    const result = await generator.generateSingle('api-spec', 'en');
    
    if (result.success) {
      console.log(`✅ 성공: ${result.filePath}`);
      console.log(`   문서 수: ${result.documentCount}개`);
      console.log(`   카테고리: ${result.category}`);
      console.log(`   언어: ${result.language}`);
    } else {
      console.log(`❌ 실패: ${result.error}`);
    }
  } catch (error) {
    console.log(`💥 오류: ${error.message}`);
  }
  console.log('');

  // 5. 배치 생성 테스트
  console.log('\n🚀 5. 배치 생성 테스트');
  try {
    const results = await generator.generateBatch({
      languages: ['en', 'ko'],
      categories: ['api-spec', 'guide']
    });

    console.log(`총 ${results.length}개의 생성 작업 완료:`);
    
    let successCount = 0;
    let failureCount = 0;
    
    results.forEach(result => {
      if (result.success) {
        successCount++;
        console.log(`  ✅ ${result.category} (${result.language}): ${result.documentCount}개 문서`);
      } else {
        failureCount++;
        console.log(`  ❌ ${result.category} (${result.language}): ${result.error}`);
      }
    });
    
    console.log(`\n📊 결과 요약: 성공 ${successCount}개, 실패 ${failureCount}개`);
    
  } catch (error) {
    console.log(`💥 배치 생성 오류: ${error.message}`);
  }

  console.log('\n🎉 라이브러리 사용 예시 완료!');
  console.log('📁 생성된 파일들은 ./library-output/ 디렉토리에서 확인하세요.');
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateLibraryUsage().catch(console.error);
}