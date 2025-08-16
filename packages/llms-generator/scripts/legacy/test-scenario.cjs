#!/usr/bin/env node

/**
 * 테스트 시나리오: API-spec과 Guide 문서의 개별 LLMS 생성 테스트
 */

const fs = require('fs');
const path = require('path');

// LLMS 생성 함수 (간단한 버전)
function generateLLMS(content, characterLimit, strategy) {
  // 콘텐츠가 제한보다 짧으면 그대로 반환
  if (content.length <= characterLimit) {
    return content;
  }
  
  // 전략에 따른 요약 생성
  const lines = content.split('\n').filter(line => line.trim());
  let result = '';
  
  if (strategy === 'api-first') {
    // API 문서용: 함수 시그니처와 핵심 사용법 우선
    for (const line of lines) {
      if (line.includes('```') || line.includes('function') || line.includes('interface') || 
          line.includes('type') || line.includes('Parameters') || line.includes('Returns') ||
          line.includes('##')) {
        const candidate = result + line + '\n';
        if (candidate.length > characterLimit) break;
        result = candidate;
      }
    }
  } else if (strategy === 'concept-first') {
    // 가이드 문서용: 개념과 단계적 설명 우선
    for (const line of lines) {
      if (line.includes('#') || line.includes('Step') || line.includes('Overview') ||
          line.includes('개념') || line.includes('단계') || line.includes('중요')) {
        const candidate = result + line + '\n';
        if (candidate.length > characterLimit) break;
        result = candidate;
      }
    }
  }
  
  // 기본 트리밍 (문장 단위)
  if (result.length === 0 || result.length > characterLimit) {
    const sentences = content.split(/[.!?]\s+/);
    result = '';
    for (const sentence of sentences) {
      const candidate = result + sentence + '. ';
      if (candidate.length > characterLimit) break;
      result = candidate;
    }
  }
  
  return result.trim() || content.substring(0, characterLimit - 3) + '...';
}

// 테스트 실행
async function runTest() {
  console.log('🧪 API-spec과 Guide LLMS 생성 테스트 시작\n');
  
  // 1. API 문서 테스트
  console.log('📋 API 문서 테스트');
  console.log('=' .repeat(50));
  
  const apiContent = fs.readFileSync('./test-docs/api-spec-example.md', 'utf8');
  console.log(`원본 길이: ${apiContent.length} 문자\n`);
  
  // API 문서 300자 제한
  const api300 = generateLLMS(apiContent, 300, 'api-first');
  console.log('📦 API 문서 (300자 제한):');
  console.log('-'.repeat(30));
  console.log(api300);
  console.log(`\n생성된 길이: ${api300.length} 문자\n`);
  
  // API 문서 1000자 제한
  const api1000 = generateLLMS(apiContent, 1000, 'api-first');
  console.log('📦 API 문서 (1000자 제한):');
  console.log('-'.repeat(30));
  console.log(api1000);
  console.log(`\n생성된 길이: ${api1000.length} 문자\n`);
  
  // 2. 가이드 문서 테스트
  console.log('📚 가이드 문서 테스트');
  console.log('=' .repeat(50));
  
  const guideContent = fs.readFileSync('./test-docs/guide-example.md', 'utf8');
  console.log(`원본 길이: ${guideContent.length} 문자\n`);
  
  // 가이드 문서 300자 제한
  const guide300 = generateLLMS(guideContent, 300, 'concept-first');
  console.log('📖 가이드 문서 (300자 제한):');
  console.log('-'.repeat(30));
  console.log(guide300);
  console.log(`\n생성된 길이: ${guide300.length} 문자\n`);
  
  // 가이드 문서 1000자 제한
  const guide1000 = generateLLMS(guideContent, 1000, 'concept-first');
  console.log('📖 가이드 문서 (1000자 제한):');
  console.log('-'.repeat(30));
  console.log(guide1000);
  console.log(`\n생성된 길이: ${guide1000.length} 문자\n`);
  
  // 3. 결과 분석
  console.log('🔍 결과 분석');
  console.log('=' .repeat(50));
  console.log(`✅ API 문서 두 개의 다른 길이 LLMS 생성 완료`);
  console.log(`   - 300자: ${api300.length}자 (${(api300.length/apiContent.length*100).toFixed(1)}% 압축)`);
  console.log(`   - 1000자: ${api1000.length}자 (${(api1000.length/apiContent.length*100).toFixed(1)}% 압축)`);
  
  console.log(`✅ 가이드 문서 두 개의 다른 길이 LLMS 생성 완료`);
  console.log(`   - 300자: ${guide300.length}자 (${(guide300.length/guideContent.length*100).toFixed(1)}% 압축)`);
  console.log(`   - 1000자: ${guide1000.length}자 (${(guide1000.length/guideContent.length*100).toFixed(1)}% 압축)`);
  
  console.log(`\n🎯 개별 문서로 총 4개의 LLMS 텍스트가 성공적으로 생성되었습니다!`);
  
  // 4. 파일로 저장
  const outputDir = './test-output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(outputDir, 'api-spec-300.md'), 
    `---\ntitle: "API Spec - useActionDispatch"\ncategory: "api"\ncharacter_limit: 300\nstrategy: "api-first"\n---\n\n${api300}`);
  
  fs.writeFileSync(path.join(outputDir, 'api-spec-1000.md'), 
    `---\ntitle: "API Spec - useActionDispatch"\ncategory: "api"\ncharacter_limit: 1000\nstrategy: "api-first"\n---\n\n${api1000}`);
  
  fs.writeFileSync(path.join(outputDir, 'guide-300.md'), 
    `---\ntitle: "Getting Started Guide"\ncategory: "guide"\ncharacter_limit: 300\nstrategy: "concept-first"\n---\n\n${guide300}`);
  
  fs.writeFileSync(path.join(outputDir, 'guide-1000.md'), 
    `---\ntitle: "Getting Started Guide"\ncategory: "guide"\ncharacter_limit: 1000\nstrategy: "concept-first"\n---\n\n${guide1000}`);
  
  console.log(`\n💾 결과가 ${outputDir} 디렉토리에 저장되었습니다.`);
}

if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { generateLLMS, runTest };