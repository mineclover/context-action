#!/usr/bin/env node

/**
 * 미구현 분석 도구 - 양방향 분석
 * 
 * 분석 방향:
 * 1. 용어집 → 코드: 용어집에 정의되어 있지만 코드에 구현되지 않은 용어들
 * 2. 코드 → 용어집: 코드에서 참조하지만 용어집에 정의되지 않은 용어들
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// Import from the new glossary package (when built)
async function loadGlossaryAPI() {
  try {
    const { createGlossaryAPI } = await import('../../packages/glossary/dist/index.js');
    return createGlossaryAPI;
  } catch (error) {
    console.log('⚠️  Could not import built package. Please run: pnpm --filter @context-action/glossary build');
    process.exit(1);
  }
}

/**
 * 양방향 미구현 분석 수행
 */
async function analyzeMissingImplementations() {
  console.log('🔍 양방향 미구현 분석 시작...\n');
  
  try {
    const createGlossaryAPI = await loadGlossaryAPI();
    
    // 용어집 API 초기화
    const glossary = await createGlossaryAPI({
      rootDir,
      debug: false,
      scanPaths: [
        'example/src/**/*.{ts,tsx,js,jsx}',
        'packages/*/src/**/*.{ts,tsx,js,jsx}'
      ],
      excludePaths: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        '**/*.d.ts'
      ],
      glossaryPaths: {
        'core-concepts': join(rootDir, 'glossary/terms/core-concepts.md'),
        'architecture-terms': join(rootDir, 'glossary/terms/architecture-terms.md'),
        'api-terms': join(rootDir, 'glossary/terms/api-terms.md'),
        'naming-conventions': join(rootDir, 'glossary/terms/naming-conventions.md')
      }
    });

    // 매핑 및 검증 데이터 로드
    const mappings = await glossary.scan();
    const validation = await glossary.validate(mappings);
    
    // 양방향 분석 수행
    const analysis = performBidirectionalAnalysis(mappings, validation);
    
    // 결과 출력
    printAnalysisResults(analysis);
    
    // JSON 리포트 생성
    await saveAnalysisReport(analysis);
    
  } catch (error) {
    console.error('❌ 분석 실패:', error.message);
    process.exit(1);
  }
}

/**
 * 양방향 분석 수행
 */
function performBidirectionalAnalysis(mappings, validation) {
  const analysis = {
    // 용어집 → 코드 방향 (정의되었지만 미구현)
    glossaryToCode: {
      missing: [],          // 완전히 미구현된 용어들
      partial: [],          // 부분적으로 구현된 용어들
      categories: {}        // 카테고리별 미구현 현황
    },
    
    // 코드 → 용어집 방향 (참조되지만 미정의)
    codeToGlossary: {
      undefined: [],        // 정의되지 않은 용어들 (validation 에러에서)
      outdated: [],         // 용어집에는 있지만 다른 이름으로 참조
      suggestions: []       // 유사한 용어 제안
    },
    
    // 통계 정보
    statistics: {
      totalGlossaryTerms: validation.summary.glossaryTerms,
      totalMappedTerms: validation.summary.mappedTerms,
      implementationRate: validation.summary.implementationRate,
      missingFromCode: 0,
      missingFromGlossary: 0,
      partialImplementations: 0
    },
    
    // 카테고리별 분석
    categoryAnalysis: {},
    
    timestamp: new Date().toISOString()
  };

  // 1. 용어집 → 코드 분석 (정의되었지만 미구현)
  analyzeGlossaryToCode(analysis, mappings, validation);
  
  // 2. 코드 → 용어집 분석 (참조되지만 미정의)
  analyzeCodeToGlossary(analysis, validation);
  
  // 3. 카테고리별 분석
  analyzeCategoryStatus(analysis, mappings, validation);
  
  // 4. 통계 계산
  calculateStatistics(analysis);
  
  return analysis;
}

/**
 * 용어집 → 코드 방향 분석
 */
function analyzeGlossaryToCode(analysis, mappings, validation) {
  // 완전히 미구현된 용어들 (orphaned terms)
  const orphanedTerms = validation.details.warnings.filter(w => w.type === 'ORPHANED_TERM');
  
  for (const orphan of orphanedTerms) {
    const termData = {
      term: orphan.term,
      name: orphan.message.match(/'([^']+)'/)?.[1] || orphan.term,
      category: findTermCategory(orphan.term, validation),
      reason: 'no_implementation',
      suggestions: generateImplementationSuggestions(orphan.term)
    };
    
    analysis.glossaryToCode.missing.push(termData);
  }
  
  // 부분적으로 구현된 용어들 (여러 구현이 가능하지만 일부만 구현)
  for (const [term, implementations] of Object.entries(mappings.terms)) {
    if (implementations.length === 1) {
      // 단일 구현인 경우 부분 구현 가능성 체크
      const impl = implementations[0];
      if (shouldHaveMoreImplementations(term, impl)) {
        analysis.glossaryToCode.partial.push({
          term,
          currentImplementations: implementations.length,
          expectedImplementations: getExpectedImplementationCount(term),
          existing: implementations.map(i => ({
            file: i.file,
            name: i.name,
            type: i.type
          })),
          suggestions: generateAdditionalImplementationSuggestions(term)
        });
      }
    }
  }
}

/**
 * 코드 → 용어집 방향 분석
 */
function analyzeCodeToGlossary(analysis, validation) {
  // 정의되지 않은 용어들 (validation 에러에서)
  const undefinedTerms = validation.details.errors.filter(e => e.type === 'TERM_NOT_FOUND');
  
  const termCounts = {};
  for (const error of undefinedTerms) {
    if (!termCounts[error.term]) {
      termCounts[error.term] = {
        term: error.term,
        count: 0,
        files: new Set(),
        methods: new Set(),
        locations: []
      };
    }
    
    termCounts[error.term].count++;
    termCounts[error.term].files.add(error.file);
    termCounts[error.term].methods.add(error.method);
    termCounts[error.term].locations.push({
      file: error.file,
      line: error.line,
      method: error.method
    });
  }
  
  for (const [term, data] of Object.entries(termCounts)) {
    analysis.codeToGlossary.undefined.push({
      term,
      usage_count: data.count,
      files_count: data.files.size,
      methods_count: data.methods.size,
      locations: data.locations,
      suggestions: generateGlossaryDefinitionSuggestions(term)
    });
  }
}

/**
 * 카테고리별 분석
 */
function analyzeCategoryStatus(analysis, mappings, validation) {
  const categories = ['core-concepts', 'architecture-terms', 'api-terms', 'naming-conventions'];
  
  for (const category of categories) {
    const categoryTerms = getCategoryTerms(category, validation);
    const implementedTerms = getCategoryImplementedTerms(category, mappings);
    
    analysis.categoryAnalysis[category] = {
      total_terms: categoryTerms.length,
      implemented_terms: implementedTerms.length,
      missing_terms: categoryTerms.filter(term => !implementedTerms.includes(term)),
      implementation_rate: categoryTerms.length > 0 
        ? Math.round((implementedTerms.length / categoryTerms.length) * 100)
        : 0,
      priority_suggestions: generateCategoryPrioritySuggestions(category, categoryTerms, implementedTerms)
    };
    
    analysis.glossaryToCode.categories[category] = analysis.categoryAnalysis[category];
  }
}

/**
 * 통계 계산
 */
function calculateStatistics(analysis) {
  analysis.statistics.missingFromCode = analysis.glossaryToCode.missing.length;
  analysis.statistics.missingFromGlossary = analysis.codeToGlossary.undefined.length;
  analysis.statistics.partialImplementations = analysis.glossaryToCode.partial.length;
}

// 유틸리티 함수들

function findTermCategory(term, validation) {
  // validation 데이터에서 카테고리 추론
  const categoryKeywords = {
    'core-concepts': ['action', 'handler', 'pipeline', 'store', 'registry'],
    'architecture-terms': ['mvvm', 'layer', 'pattern', 'architecture', 'flow'],
    'api-terms': ['register', 'provider', 'hooks', 'dispatcher', 'computed'],
    'naming-conventions': ['naming', 'class', 'interface', 'function', 'constant']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => term.toLowerCase().includes(keyword))) {
      return category;
    }
  }
  
  return 'unknown';
}

function shouldHaveMoreImplementations(term, impl) {
  // 핵심 용어들은 여러 구현이 있어야 함
  const coreTerms = ['action-handler', 'store-hooks', 'actionregister'];
  return coreTerms.includes(term);
}

function getExpectedImplementationCount(term) {
  const expectations = {
    'action-handler': 5,  // 여러 훅들이 있어야 함
    'store-hooks': 3,     // useStoreValue, useStore, useComputedStore 등
    'actionregister': 2   // 클래스와 팩토리 함수
  };
  
  return expectations[term] || 2;
}

function generateImplementationSuggestions(term) {
  const suggestions = {
    'actionregister': [
      'ActionRegister 클래스에 @implements actionregister 태그 추가',
      'createActionRegister 팩토리 함수 구현'
    ],
    'storeprovider': [
      'StoreProvider 컴포넌트에 @implements storeprovider 태그 추가',
      'useStoreRegistry 훅 구현'
    ],
    'store-hooks': [
      'useStoreValue 훅에 @implements store-hooks 태그 추가',
      'useStore 훅 구현',
      'useComputedStore 훅 구현'
    ]
  };
  
  return suggestions[term] || [
    `${term}을 구현하는 함수/클래스/인터페이스에 @implements ${term} 태그 추가`,
    '용어집 정의에 맞는 구체적인 구현 작성'
  ];
}

function generateAdditionalImplementationSuggestions(term) {
  return [
    `${term}의 다른 구현 패턴 탐색`,
    '기존 구현을 확장하는 유틸리티 함수 추가',
    '관련 헬퍼 함수들에 태그 추가'
  ];
}

function generateGlossaryDefinitionSuggestions(term) {
  return [
    `docs/glossary/ 파일에 ## ${term.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 섹션 추가`,
    '용어의 정의, 특징, 관련 용어 작성',
    '코드 예시 및 사용 패턴 포함'
  ];
}

function generateCategoryPrioritySuggestions(category, allTerms, implementedTerms) {
  const missingTerms = allTerms.filter(term => !implementedTerms.includes(term));
  
  // 카테고리별 우선순위 용어들
  const priorities = {
    'core-concepts': ['actionregister', 'store-registry', 'action-dispatcher'],
    'architecture-terms': ['mvvm-pattern', 'view-layer', 'model-layer'],
    'api-terms': ['storeprovider', 'actionprovider', 'store-hooks'],
    'naming-conventions': ['class-naming', 'interface-naming', 'function-naming']
  };
  
  const categoryPriorities = priorities[category] || [];
  const highPriorityMissing = missingTerms.filter(term => categoryPriorities.includes(term));
  
  return highPriorityMissing.slice(0, 3).map(term => 
    `${term} - ${category}의 핵심 용어`
  );
}

function getCategoryTerms(category, validation) {
  // validation에서 해당 카테고리의 모든 용어 추출
  const categoryTerms = [];
  
  for (const warning of validation.details.warnings) {
    if (warning.type === 'ORPHANED_TERM') {
      const termCategory = findTermCategory(warning.term, validation);
      if (termCategory === category) {
        categoryTerms.push(warning.term);
      }
    }
  }
  
  return categoryTerms;
}

function getCategoryImplementedTerms(category, mappings) {
  const implementedTerms = [];
  
  if (mappings.categories && mappings.categories[category]) {
    implementedTerms.push(...mappings.categories[category]);
  }
  
  return implementedTerms;
}

/**
 * 분석 결과 출력
 */
function printAnalysisResults(analysis) {
  console.log('📊 양방향 미구현 분석 결과\n');
  
  // 전체 통계
  console.log('🔢 전체 통계:');
  console.log(`  전체 용어집 용어: ${analysis.statistics.totalGlossaryTerms}개`);
  console.log(`  구현된 용어: ${analysis.statistics.totalMappedTerms}개 (${analysis.statistics.implementationRate}%)`);
  console.log(`  미구현 용어: ${analysis.statistics.missingFromCode}개`);
  console.log(`  미정의 용어: ${analysis.statistics.missingFromGlossary}개`);
  console.log(`  부분 구현 용어: ${analysis.statistics.partialImplementations}개\n`);
  
  // 1. 용어집 → 코드 (정의되었지만 미구현)
  console.log('📚 ➡️  💻 용어집에 정의되었지만 코드에 미구현된 용어들:');
  if (analysis.glossaryToCode.missing.length === 0) {
    console.log('  ✅ 모든 용어가 구현되었습니다!\n');
  } else {
    console.log(`  ❌ ${analysis.glossaryToCode.missing.length}개의 미구현 용어\n`);
    
    // 카테고리별로 그룹화하여 출력
    const missingByCategory = {};
    for (const missing of analysis.glossaryToCode.missing) {
      if (!missingByCategory[missing.category]) {
        missingByCategory[missing.category] = [];
      }
      missingByCategory[missing.category].push(missing);
    }
    
    for (const [category, items] of Object.entries(missingByCategory)) {
      console.log(`  📂 ${category}:`);
      for (const item of items.slice(0, 5)) { // 상위 5개만 표시
        console.log(`    • ${item.name} (${item.term})`);
        console.log(`      💡 ${item.suggestions[0]}`);
      }
      if (items.length > 5) {
        console.log(`    ... 그 외 ${items.length - 5}개 더`);
      }
      console.log();
    }
  }
  
  // 2. 코드 → 용어집 (참조되지만 미정의)
  console.log('💻 ➡️  📚 코드에서 참조되지만 용어집에 미정의된 용어들:');
  if (analysis.codeToGlossary.undefined.length === 0) {
    console.log('  ✅ 모든 참조 용어가 정의되었습니다!\n');
  } else {
    console.log(`  ❌ ${analysis.codeToGlossary.undefined.length}개의 미정의 용어\n`);
    
    for (const item of analysis.codeToGlossary.undefined.slice(0, 5)) {
      console.log(`  • ${item.term}`);
      console.log(`    📍 ${item.usage_count}회 사용 (${item.files_count}개 파일, ${item.methods_count}개 메서드)`);
      console.log(`    💡 ${item.suggestions[0]}`);
      console.log();
    }
  }
  
  // 3. 부분 구현 용어들
  if (analysis.glossaryToCode.partial.length > 0) {
    console.log('⚠️  부분적으로만 구현된 용어들:');
    for (const item of analysis.glossaryToCode.partial) {
      console.log(`  • ${item.term}: ${item.currentImplementations}/${item.expectedImplementations} 구현`);
      console.log(`    💡 ${item.suggestions[0]}`);
    }
    console.log();
  }
  
  // 4. 카테고리별 현황
  console.log('📊 카테고리별 구현 현황:');
  for (const [category, data] of Object.entries(analysis.categoryAnalysis)) {
    const status = data.implementation_rate >= 80 ? '🟢' : 
                   data.implementation_rate >= 50 ? '🟡' : '🔴';
    console.log(`  ${status} ${category}: ${data.implemented_terms}/${data.total_terms} (${data.implementation_rate}%)`);
    
    if (data.priority_suggestions.length > 0) {
      console.log(`    우선순위: ${data.priority_suggestions[0]}`);
    }
  }
  console.log();
  
  // 5. 다음 단계 제안
  console.log('🎯 다음 단계 제안:');
  
  if (analysis.statistics.missingFromGlossary > 0) {
    console.log('  1️⃣ 코드에서 참조하는 미정의 용어들을 용어집에 추가');
  }
  
  if (analysis.statistics.missingFromCode > 0) {
    console.log('  2️⃣ 우선순위 높은 용어부터 JSDoc 태그 추가하여 구현');
  }
  
  if (analysis.statistics.partialImplementations > 0) {
    console.log('  3️⃣ 부분 구현된 용어들의 추가 구현체 작성');
  }
  
  console.log('  4️⃣ 정기적으로 이 분석을 실행하여 진행상황 추적\n');
}

/**
 * 분석 리포트를 JSON 파일로 저장
 */
async function saveAnalysisReport(analysis) {
  const reportPath = join(__dirname, '../implementations/_data/missing-analysis-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  
  console.log(`📄 상세 분석 리포트 저장: ${path.relative(rootDir, reportPath)}`);
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeMissingImplementations().catch(console.error);
}

export { analyzeMissingImplementations };