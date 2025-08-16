#!/usr/bin/env node

/**
 * 테스트 결과를 파일로 저장
 */

const { DocumentSummaryFactory, CharacterLimit } = require('./dist/index.js');
const fs = require('fs');
const path = require('path');

function smartTrim(content, limit) {
  if (content.length <= limit) {
    return content;
  }
  
  const sentences = content.split(/[.!?]\s+/);
  let result = '';
  
  for (const sentence of sentences) {
    const candidate = result + sentence + '. ';
    if (candidate.length > limit) {
      break;
    }
    result = candidate;
  }
  
  return result.trim() || content.substring(0, limit - 3) + '...';
}

async function saveTestResults() {
  console.log('💾 테스트 결과 저장 중...\n');
  
  const outputDir = './test-results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // API 문서 처리
    const apiContentRaw = fs.readFileSync('./test-docs/api-spec-example.md', 'utf8');
    
    // API 300자
    const apiContent300 = smartTrim(apiContentRaw, 280);
    const api300Result = DocumentSummaryFactory.fromPriorityBasedGeneration({
      documentPath: 'api/hooks/useActionDispatch.md',
      documentTitle: 'useActionDispatch Hook API',
      documentCategory: 'api',
      content: apiContent300,
      characterLimit: 300,
      language: 'en',
      strategy: 'api-first',
      priorityScore: 90
    });
    
    if (api300Result.isSuccess) {
      const summary = api300Result.value;
      const frontmatter = `---
title: "${summary.document.title}"
category: "${summary.document.category}"
complexity: "intermediate"
character_limit: ${summary.summary.characterLimit.value}
strategy: "${summary.summary.strategy}"
priority_score: ${summary.priority.score}
priority_tier: "${summary.priority.tier}"
language: "${summary.summary.language}"
document_id: "${summary.document.id.value}"
generated_at: "${summary.generated.timestamp.toISOString()}"
utilization_rate: ${(summary.getUtilizationRate() * 100).toFixed(1)}%
source: "${summary.document.path}"
---

${summary.content}`;
      
      fs.writeFileSync(path.join(outputDir, 'api-spec-300.md'), frontmatter);
      console.log('✅ API 300자 파일 저장: api-spec-300.md');
    }
    
    // API 1000자
    const apiContent1000 = smartTrim(apiContentRaw, 980);
    const api1000Result = DocumentSummaryFactory.fromPriorityBasedGeneration({
      documentPath: 'api/hooks/useActionDispatch.md',
      documentTitle: 'useActionDispatch Hook API',
      documentCategory: 'api',
      content: apiContent1000,
      characterLimit: 1000,
      language: 'en',
      strategy: 'api-first',
      priorityScore: 90
    });
    
    if (api1000Result.isSuccess) {
      const summary = api1000Result.value;
      const frontmatter = `---
title: "${summary.document.title}"
category: "${summary.document.category}"
complexity: "intermediate"
character_limit: ${summary.summary.characterLimit.value}
strategy: "${summary.summary.strategy}"
priority_score: ${summary.priority.score}
priority_tier: "${summary.priority.tier}"
language: "${summary.summary.language}"
document_id: "${summary.document.id.value}"
generated_at: "${summary.generated.timestamp.toISOString()}"
utilization_rate: ${(summary.getUtilizationRate() * 100).toFixed(1)}%
source: "${summary.document.path}"
---

${summary.content}`;
      
      fs.writeFileSync(path.join(outputDir, 'api-spec-1000.md'), frontmatter);
      console.log('✅ API 1000자 파일 저장: api-spec-1000.md');
    }
    
    // 가이드 문서 처리
    const guideContentRaw = fs.readFileSync('./test-docs/guide-example.md', 'utf8');
    
    // 가이드 300자
    const guideContent300 = smartTrim(guideContentRaw, 280);
    const guide300Result = DocumentSummaryFactory.fromPriorityBasedGeneration({
      documentPath: 'guide/getting-started.md',
      documentTitle: 'Getting Started Guide',
      documentCategory: 'guide',
      content: guideContent300,
      characterLimit: 300,
      language: 'en',
      strategy: 'concept-first',
      priorityScore: 85
    });
    
    if (guide300Result.isSuccess) {
      const summary = guide300Result.value;
      const frontmatter = `---
title: "${summary.document.title}"
category: "${summary.document.category}"
complexity: "intermediate"
character_limit: ${summary.summary.characterLimit.value}
strategy: "${summary.summary.strategy}"
priority_score: ${summary.priority.score}
priority_tier: "${summary.priority.tier}"
language: "${summary.summary.language}"
document_id: "${summary.document.id.value}"
generated_at: "${summary.generated.timestamp.toISOString()}"
utilization_rate: ${(summary.getUtilizationRate() * 100).toFixed(1)}%
source: "${summary.document.path}"
---

${summary.content}`;
      
      fs.writeFileSync(path.join(outputDir, 'guide-300.md'), frontmatter);
      console.log('✅ 가이드 300자 파일 저장: guide-300.md');
    }
    
    // 가이드 1000자
    const guideContent1000 = smartTrim(guideContentRaw, 980);
    const guide1000Result = DocumentSummaryFactory.fromPriorityBasedGeneration({
      documentPath: 'guide/getting-started.md',
      documentTitle: 'Getting Started Guide',
      documentCategory: 'guide',
      content: guideContent1000,
      characterLimit: 1000,
      language: 'en',
      strategy: 'concept-first',
      priorityScore: 85
    });
    
    if (guide1000Result.isSuccess) {
      const summary = guide1000Result.value;
      const frontmatter = `---
title: "${summary.document.title}"
category: "${summary.document.category}"
complexity: "intermediate"
character_limit: ${summary.summary.characterLimit.value}
strategy: "${summary.summary.strategy}"
priority_score: ${summary.priority.score}
priority_tier: "${summary.priority.tier}"
language: "${summary.summary.language}"
document_id: "${summary.document.id.value}"
generated_at: "${summary.generated.timestamp.toISOString()}"
utilization_rate: ${(summary.getUtilizationRate() * 100).toFixed(1)}%
source: "${summary.document.path}"
---

${summary.content}`;
      
      fs.writeFileSync(path.join(outputDir, 'guide-1000.md'), frontmatter);
      console.log('✅ 가이드 1000자 파일 저장: guide-1000.md');
    }
    
    console.log(`\n📁 모든 파일이 ${outputDir} 디렉토리에 저장되었습니다.`);
    console.log('\n🎉 테스트 완료: API-spec과 Guide 문서가 각각 두 개의 개별 LLMS 텍스트로 성공적으로 생성되었습니다!');
    
  } catch (error) {
    console.log(`💥 오류: ${error.message}`);
  }
}

if (require.main === module) {
  saveTestResults().catch(console.error);
}

module.exports = { saveTestResults };