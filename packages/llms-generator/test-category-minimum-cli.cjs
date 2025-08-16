#!/usr/bin/env node

/**
 * 카테고리별 미니멈 LLMS 테스트 CLI
 * 사용법: node test-category-minimum-cli.cjs [category] [language]
 */

const { generateCategoryMinimum } = require('./category-minimum-generator.cjs');
const fs = require('fs');
const path = require('path');

function showUsage() {
  console.log('📖 사용법:');
  console.log('  node test-category-minimum-cli.cjs [category] [language]');
  console.log('');
  console.log('📋 사용 가능한 카테고리:');
  console.log('  - api-spec  : API 참조 문서');
  console.log('  - guide     : 가이드 문서');
  console.log('  - all       : 모든 카테고리');
  console.log('');
  console.log('🌐 사용 가능한 언어:');
  console.log('  - en        : 영어');
  console.log('  - ko        : 한국어');
  console.log('  - all       : 모든 언어');
  console.log('');
  console.log('💡 예시:');
  console.log('  node test-category-minimum-cli.cjs api-spec en');
  console.log('  node test-category-minimum-cli.cjs guide ko');
  console.log('  node test-category-minimum-cli.cjs all all');
}

async function testSingleCategory(category, language) {
  console.log(`🧪 Testing: ${category} (${language})`);
  console.log('='.repeat(50));
  
  const outputPath = `./test/outputs/llms-minimum-${category}-${language}.txt`;
  
  try {
    // 파일이 존재하는지 확인
    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, 'utf8');
      const lines = content.split('\n');
      
      console.log(`✅ 파일 존재: ${path.basename(outputPath)}`);
      console.log(`📏 파일 크기: ${content.length} 문자`);
      console.log(`📄 라인 수: ${lines.length} 줄`);
      
      // 문서 수 추출
      const docCountMatch = content.match(/총 문서 수\*\*: (\d+)개/);
      if (docCountMatch) {
        console.log(`📚 포함된 문서 수: ${docCountMatch[1]}개`);
      }
      
      // 카테고리별 섹션 수 확인
      const sectionMatches = content.match(/## .+ Documents \((\d+)\)/g);
      if (sectionMatches) {
        console.log(`📂 문서 섹션:`);
        sectionMatches.forEach(match => {
          console.log(`   - ${match.replace('##', '').trim()}`);
        });
      }
      
      // 첫 10줄 미리보기
      console.log(`\n📋 미리보기 (첫 10줄):`);
      console.log('-'.repeat(30));
      lines.slice(0, 10).forEach((line, index) => {
        console.log(`${String(index + 1).padStart(2, ' ')}: ${line}`);
      });
      
      if (lines.length > 10) {
        console.log('   ... (생략) ...');
      }
      
      return true;
    } else {
      console.log(`❌ 파일 없음: ${outputPath}`);
      console.log(`💡 먼저 생성기를 실행하세요: node category-minimum-generator.cjs`);
      return false;
    }
    
  } catch (error) {
    console.log(`💥 오류: ${error.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }
  
  const [categoryArg = 'all', languageArg = 'all'] = args;
  
  console.log('🔍 카테고리별 미니멈 LLMS 테스트 CLI\n');
  
  // 먼저 생성기 실행하여 최신 파일 생성
  console.log('🔧 최신 파일 생성 중...');
  await generateCategoryMinimum();
  console.log('');
  
  const categories = categoryArg === 'all' ? ['api-spec', 'guide'] : [categoryArg];
  const languages = languageArg === 'all' ? ['en', 'ko'] : [languageArg];
  
  let testResults = [];
  
  for (const category of categories) {
    for (const language of languages) {
      const success = await testSingleCategory(category, language);
      testResults.push({ category, language, success });
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(50));
  
  const successful = testResults.filter(r => r.success);
  const failed = testResults.filter(r => r.success === false);
  
  console.log(`✅ 성공: ${successful.length}개`);
  successful.forEach(r => {
    console.log(`   - ${r.category} (${r.language})`);
  });
  
  if (failed.length > 0) {
    console.log(`❌ 실패: ${failed.length}개`);
    failed.forEach(r => {
      console.log(`   - ${r.category} (${r.language})`);
    });
  }
  
  console.log(`\n🎯 결론: ${categories.includes('api-spec') && categories.includes('guide') ? 'API-spec과 Guide' : categoryArg} 카테고리의 미니멈 LLMS가 ${successful.length > 0 ? '성공적으로' : '실패하여'} 생성되었습니다.`);
  
  if (successful.length > 0) {
    console.log(`📁 생성된 파일들: ./test/outputs/ 디렉토리에서 확인하세요.`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}