#!/usr/bin/env node

/**
 * 카테고리별 미니멈 LLMS 생성기
 * api-spec과 guide 카테고리별로 최소형 문서 생성
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 카테고리별 패턴 매칭
const CATEGORY_PATTERNS = {
  'api-spec': [
    'api--*',
    'api/*'
  ],
  'guide': [
    'guide--*',
    'guide/*',
    'concept--*guide*',
    'concept/*guide*'
  ]
};

// 우선순위 티어 매핑
const PRIORITY_TIER_ORDER = {
  'critical': 1,
  'essential': 2, 
  'important': 3,
  'reference': 4,
  'supplementary': 5
};

/**
 * priority.json 파일 읽기
 */
function readPriorityFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to read ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * 카테고리 매칭 확인
 */
function matchesCategory(documentPath, category) {
  const patterns = CATEGORY_PATTERNS[category];
  if (!patterns) return false;
  
  return patterns.some(pattern => {
    // 와일드카드 패턴 변환
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${regexPattern}`, 'i');
    return regex.test(documentPath);
  });
}

/**
 * 문서 정보 수집
 */
function collectDocuments(dataDir, language, category) {
  const documents = [];
  const priorityFiles = glob.sync(`${dataDir}/${language}/*/priority.json`);
  
  console.log(`📁 Found ${priorityFiles.length} priority files for language: ${language}`);
  
  for (const priorityFile of priorityFiles) {
    const priority = readPriorityFile(priorityFile);
    if (!priority) continue;
    
    const dirName = path.dirname(priorityFile);
    const folderName = path.basename(dirName);
    
    // 카테고리 매칭 확인
    if (!matchesCategory(folderName, category)) {
      continue;
    }
    
    documents.push({
      id: priority.id || folderName,
      title: priority.title || folderName.replace(/--/g, ' ').replace(/-/g, ' '),
      category: priority.category || 'unknown',
      priority_score: priority.priority_score || 0,
      priority_tier: priority.priority_tier || 'reference',
      source_path: priority.source_path || '',
      folder_name: folderName,
      url: generateUrl(folderName, language)
    });
  }
  
  return documents;
}

/**
 * URL 생성
 */
function generateUrl(folderName, language) {
  const baseUrl = 'https://mineclover.github.io/context-action';
  const pathParts = folderName.replace(/--/g, '/');
  return `${baseUrl}/${language}/${pathParts}`;
}

/**
 * 문서 정렬
 */
function sortDocuments(documents) {
  return documents.sort((a, b) => {
    // 우선순위 티어별 정렬
    const tierA = PRIORITY_TIER_ORDER[a.priority_tier] || 999;
    const tierB = PRIORITY_TIER_ORDER[b.priority_tier] || 999;
    
    if (tierA !== tierB) {
      return tierA - tierB;
    }
    
    // 같은 티어 내에서는 우선순위 점수로 정렬
    if (a.priority_score !== b.priority_score) {
      return b.priority_score - a.priority_score;
    }
    
    // 같은 점수면 제목 알파벳 순
    return a.title.localeCompare(b.title);
  });
}

/**
 * 티어별 그룹화
 */
function groupByTier(documents) {
  const grouped = {};
  
  for (const doc of documents) {
    const tier = doc.priority_tier || 'reference';
    if (!grouped[tier]) {
      grouped[tier] = [];
    }
    grouped[tier].push(doc);
  }
  
  return grouped;
}

/**
 * 미니멈 LLMS 텍스트 생성
 */
function generateMinimumLLMS(category, language, documents) {
  const categoryTitle = {
    'api-spec': 'API 참조',
    'guide': '가이드 문서'
  }[category] || category;
  
  const languageTitle = language === 'ko' ? 'KO' : 'EN';
  const today = new Date().toISOString().split('T')[0];
  
  let content = `# Context-Action Framework - ${categoryTitle}

생성일: ${today}
유형: 최소 (${categoryTitle} 탐색 링크)
언어: ${languageTitle}
카테고리: ${category}

이 문서는 Context-Action 프레임워크의 ${categoryTitle} 문서에 대한 빠른 탐색 링크를 우선순위 등급별로 정리하여 제공합니다.

`;

  const grouped = groupByTier(documents);
  const tiers = ['critical', 'essential', 'important', 'reference', 'supplementary'];
  const tierNames = {
    'critical': 'Critical Documents',
    'essential': 'Essential Documents', 
    'important': 'Important Documents',
    'reference': 'Reference Documents',
    'supplementary': 'Supplementary Documents'
  };
  
  let totalDocs = 0;
  
  for (const tier of tiers) {
    if (!grouped[tier] || grouped[tier].length === 0) continue;
    
    const tierDocs = grouped[tier];
    totalDocs += tierDocs.length;
    
    content += `\n## ${tierNames[tier]} (${tierDocs.length})\n\n`;
    
    for (const doc of tierDocs) {
      const priorityText = doc.priority_score > 0 ? doc.priority_score : 'null';
      content += `- [${doc.title}](${doc.url}) - Priority: ${priorityText}\n`;
    }
  }
  
  // 요약 정보 추가
  content += `\n\n## ${categoryTitle} 요약\n\n`;
  content += `- **총 문서 수**: ${totalDocs}개\n`;
  content += `- **카테고리**: ${category}\n`;
  content += `- **언어**: ${languageTitle}\n`;
  
  if (category === 'api-spec') {
    content += `\n## API 문서 사용 안내\n\n`;
    content += `- **Critical**: 핵심 API 및 필수 인터페이스\n`;
    content += `- **Essential**: 주요 함수 및 훅 참조자료\n`;
    content += `- **Important**: 유용한 유틸리티 및 헬퍼\n`;
    content += `- **Reference**: 고급 API 및 타입 정의\n`;
    
    content += `\n## 빠른 API 참조 경로\n\n`;
    content += `개발자를 위한 권장 참조 순서:\n`;
    content += `1. 핵심 API (Critical)\n`;
    content += `2. 주요 훅 (Essential)\n`;
    content += `3. 패턴 및 유틸리티 (Important)\n`;
    content += `4. 고급 타입 (Reference)\n`;
  } else if (category === 'guide') {
    content += `\n## 가이드 문서 사용 안내\n\n`;
    content += `- **Critical**: 프레임워크 이해를 위한 필수 가이드\n`;
    content += `- **Essential**: 중요한 사용법 및 패턴 가이드\n`;
    content += `- **Important**: 유용한 모범 사례 및 팁\n`;
    content += `- **Reference**: 고급 가이드 및 심화 내용\n`;
    
    content += `\n## 빠른 학습 경로\n\n`;
    content += `초급자를 위한 권장 읽기 순서:\n`;
    content += `1. 시작하기 (Critical)\n`;
    content += `2. 핵심 개념 (Essential)\n`;
    content += `3. 패턴 가이드 (Important)\n`;
    content += `4. 고급 활용 (Reference)\n`;
  }
  
  content += `\n---\n\n*llm-content 구조에서 자동 생성됨*\n`;
  
  return content;
}

/**
 * 메인 실행 함수
 */
async function generateCategoryMinimum() {
  console.log('🔧 카테고리별 미니멈 LLMS 생성기 시작\n');
  
  const dataDir = './data';
  const outputDir = './test/outputs';
  const languages = ['ko', 'en'];
  const categories = ['api-spec', 'guide'];
  
  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const language of languages) {
    for (const category of categories) {
      console.log(`📋 Processing: ${category} (${language})`);
      console.log('-'.repeat(50));
      
      // 문서 수집
      const documents = collectDocuments(dataDir, language, category);
      console.log(`📄 Found ${documents.length} documents matching category: ${category}`);
      
      if (documents.length === 0) {
        console.log(`⚠️  No documents found for category: ${category} (${language})\n`);
        continue;
      }
      
      // 정렬
      const sortedDocuments = sortDocuments(documents);
      
      // LLMS 생성
      const llmsContent = generateMinimumLLMS(category, language, sortedDocuments);
      
      // 파일 저장
      const filename = `llms-minimum-${category}-${language}.txt`;
      const filepath = path.join(outputDir, filename);
      
      fs.writeFileSync(filepath, llmsContent, 'utf8');
      console.log(`✅ Generated: ${filename} (${documents.length} documents)`);
      
      // 티어별 통계
      const grouped = groupByTier(sortedDocuments);
      for (const tier of Object.keys(grouped)) {
        console.log(`   - ${tier}: ${grouped[tier].length}개`);
      }
      
      console.log('');
    }
  }
  
  console.log('🎉 카테고리별 미니멈 LLMS 생성 완료!');
  console.log(`📁 결과 파일들이 ${outputDir} 디렉토리에 저장되었습니다.`);
}

if (require.main === module) {
  generateCategoryMinimum().catch(console.error);
}

module.exports = { generateCategoryMinimum };