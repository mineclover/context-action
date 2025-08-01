#!/usr/bin/env node

/**
 * 구현 현황 대시보드 생성 도구
 * 
 * 기능:
 * - 전체 구현 현황 요약
 * - 카테고리별 진행률 시각화
 * - 우선순위 기반 TODO 리스트
 * - 진행 트렌드 분석
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

/**
 * 대시보드 생성 메인 함수
 */
async function generateDashboard() {
  console.log('📊 구현 현황 대시보드 생성 중...\n');
  
  try {
    // 기존 데이터 로드
    const mappings = loadMappingsData();
    const validation = loadValidationData();
    const missingAnalysis = loadMissingAnalysisData();
    
    // 대시보드 데이터 구성
    const dashboardData = compileDashboardData(mappings, validation, missingAnalysis);
    
    // 마크다운 대시보드 생성
    const dashboardMarkdown = generateDashboardMarkdown(dashboardData);
    
    // 파일 저장
    await saveDashboard(dashboardMarkdown, dashboardData);
    
    console.log('✅ 구현 현황 대시보드 생성 완료!');
    
  } catch (error) {
    console.error('❌ 대시보드 생성 실패:', error.message);
    console.log('\n💡 다음 명령어들을 먼저 실행해주세요:');
    console.log('   1. node glossary-scanner-v2.js');
    console.log('   2. node glossary-validator-v2.js'); 
    console.log('   3. node missing-analysis.js');
    process.exit(1);
  }
}

/**
 * 기존 데이터 파일들 로드
 */
function loadMappingsData() {
  const mappingsPath = path.join(__dirname, '../implementations/_data/mappings.json');
  if (!fs.existsSync(mappingsPath)) {
    throw new Error('mappings.json 파일이 없습니다. glossary-scanner-v2.js를 먼저 실행해주세요.');
  }
  return JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
}

function loadValidationData() {
  const validationPath = path.join(__dirname, '../implementations/_data/validation-report.json');
  if (!fs.existsSync(validationPath)) {
    throw new Error('validation-report.json 파일이 없습니다. glossary-validator-v2.js를 먼저 실행해주세요.');
  }
  return JSON.parse(fs.readFileSync(validationPath, 'utf8'));
}

function loadMissingAnalysisData() {
  const analysisPath = path.join(__dirname, '../implementations/_data/missing-analysis-report.json');
  if (!fs.existsSync(analysisPath)) {
    console.log('⚠️  missing-analysis-report.json이 없습니다. 기본 분석을 수행합니다.');
    return null;
  }
  return JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
}

/**
 * 대시보드 데이터 컴파일
 */
function compileDashboardData(mappings, validation, missingAnalysis) {
  const now = new Date();
  
  return {
    metadata: {
      generated_at: now.toISOString(),
      generated_date: now.toLocaleDateString('ko-KR'),
      generated_time: now.toLocaleTimeString('ko-KR')
    },
    
    overview: {
      total_glossary_terms: validation.summary.glossaryTerms,
      mapped_terms: validation.summary.mappedTerms,
      implementation_rate: validation.summary.implementationRate,
      files_scanned: mappings.statistics.totalFiles,
      files_with_tags: mappings.statistics.taggedFiles,
      categories_count: Object.keys(mappings.categories || {}).length
    },
    
    quality: {
      errors: validation.summary.errors,
      warnings: validation.summary.warnings,
      validation_status: validation.success ? 'PASS' : 'FAIL'
    },
    
    categories: compileCategoryData(mappings, validation, missingAnalysis),
    
    recent_implementations: getRecentImplementations(mappings),
    
    priority_todos: generatePriorityTodos(missingAnalysis, validation),
    
    trends: calculateTrends(mappings, validation),
    
    raw_data: {
      mappings_summary: mappings.statistics,
      validation_summary: validation.summary,
      missing_analysis_summary: missingAnalysis?.statistics || null
    }
  };
}

/**
 * 카테고리별 데이터 컴파일
 */
function compileCategoryData(mappings, validation, missingAnalysis) {
  const categories = {
    'core-concepts': { name: '핵심 개념', icon: '🎯' },
    'architecture-terms': { name: '아키텍처', icon: '🏗️' },
    'api-terms': { name: 'API 용어', icon: '🔌' },
    'naming-conventions': { name: '네이밍 규칙', icon: '📝' }
  };
  
  const categoryData = {};
  
  for (const [categoryId, categoryInfo] of Object.entries(categories)) {
    const implementedTerms = mappings.categories?.[categoryId] || [];
    const totalTerms = getTotalTermsForCategory(categoryId, validation);
    const missingTerms = getMissingTermsForCategory(categoryId, missingAnalysis);
    
    const implementationRate = totalTerms > 0 ? Math.round((implementedTerms.length / totalTerms) * 100) : 0;
    
    categoryData[categoryId] = {
      name: categoryInfo.name,
      icon: categoryInfo.icon,
      implemented: implementedTerms.length,
      total: totalTerms,
      missing: missingTerms.length,
      implementation_rate: implementationRate,
      status: getStatusBadge(implementationRate),
      priority_terms: missingTerms.slice(0, 3),
      recent_implementations: implementedTerms.slice(0, 2)
    };
  }
  
  return categoryData;
}

/**
 * 최근 구현 항목들 가져오기
 */
function getRecentImplementations(mappings) {
  const allImplementations = [];
  
  for (const [term, implementations] of Object.entries(mappings.terms || {})) {
    for (const impl of implementations) {
      allImplementations.push({
        term,
        ...impl,
        lastModified: new Date(impl.lastModified)
      });
    }
  }
  
  // 최근 수정된 순으로 정렬
  allImplementations.sort((a, b) => b.lastModified - a.lastModified);
  
  return allImplementations.slice(0, 5).map(impl => ({
    term: impl.term,
    name: impl.name,
    file: impl.file,
    type: impl.type,
    date: impl.lastModified.toLocaleDateString('ko-KR')
  }));
}

/**
 * 우선순위 TODO 생성
 */
function generatePriorityTodos(missingAnalysis, validation) {
  const todos = [];
  
  // 1. 코드에서 참조하지만 용어집에 없는 용어들 (높은 우선순위)
  if (missingAnalysis?.codeToGlossary?.undefined) {
    for (const item of missingAnalysis.codeToGlossary.undefined.slice(0, 3)) {
      todos.push({
        priority: 'HIGH',
        type: 'DEFINE_TERM',
        title: `용어집에 "${item.term}" 정의 추가`,
        description: `${item.usage_count}회 코드에서 사용되지만 용어집에 미정의`,
        category: '용어집 정의',
        effort: 'Medium',
        files_affected: item.files_count
      });
    }
  }
  
  // 2. 핵심 용어들 중 미구현 (중간 우선순위)
  const coreTerms = ['actionregister', 'storeprovider', 'actionprovider', 'store-hooks'];
  if (missingAnalysis?.glossaryToCode?.missing) {
    for (const missing of missingAnalysis.glossaryToCode.missing) {
      if (coreTerms.includes(missing.term)) {
        todos.push({
          priority: 'HIGH',
          type: 'IMPLEMENT_TERM',
          title: `"${missing.name}" 구현`,
          description: missing.suggestions[0],
          category: missing.category,
          effort: 'High',
          files_affected: 1
        });
      }
    }
  }
  
  // 3. 부분 구현된 용어들 (낮은 우선순위)
  if (missingAnalysis?.glossaryToCode?.partial) {
    for (const partial of missingAnalysis.glossaryToCode.partial) {
      todos.push({
        priority: 'MEDIUM',
        type: 'EXTEND_IMPLEMENTATION',
        title: `"${partial.term}" 추가 구현`,
        description: `현재 ${partial.currentImplementations}개 구현, ${partial.expectedImplementations}개 필요`,
        category: '구현 확장',
        effort: 'Medium',
        files_affected: partial.expectedImplementations - partial.currentImplementations
      });
    }
  }
  
  // 우선순위별 정렬
  todos.sort((a, b) => {
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
  
  return todos.slice(0, 10); // 상위 10개만
}

/**
 * 트렌드 계산 (간단한 버전)
 */
function calculateTrends(mappings, validation) {
  return {
    implementation_velocity: '+ 3 용어/주', // 하드코딩, 나중에 히스토리 데이터로 계산
    most_active_category: findMostActiveCategory(mappings),
    completion_estimate: estimateCompletion(validation)
  };
}

/**
 * 유틸리티 함수들
 */
function getTotalTermsForCategory(categoryId, validation) {
  // validation의 orphaned terms에서 카테고리별 용어 수 계산
  return validation.details.warnings
    .filter(w => w.type === 'ORPHANED_TERM')
    .filter(w => w.term && inferCategoryFromTerm(w.term) === categoryId)
    .length + (getMappedTermsForCategory(categoryId, validation) || 0);
}

function getMappedTermsForCategory(categoryId, validation) {
  // 이미 매핑된 용어들 중 해당 카테고리 개수
  return validation.summary.mappedTerms || 0; // 간단히 처리, 나중에 정확히 계산
}

function getMissingTermsForCategory(categoryId, missingAnalysis) {
  if (!missingAnalysis?.glossaryToCode?.missing) return [];
  
  return missingAnalysis.glossaryToCode.missing
    .filter(missing => missing.category === categoryId);
}

function inferCategoryFromTerm(term) {
  const categoryKeywords = {
    'core-concepts': ['action', 'handler', 'pipeline', 'store', 'registry'],
    'architecture-terms': ['mvvm', 'layer', 'pattern', 'architecture', 'flow', 'decoupled', 'unidirectional'],
    'api-terms': ['register', 'provider', 'hooks', 'dispatcher', 'computed', 'async'],
    'naming-conventions': ['naming', 'class', 'interface', 'function', 'constant', 'variable', 'file']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => term.toLowerCase().includes(keyword))) {
      return category;
    }
  }
  
  return 'core-concepts'; // 기본값
}

function getStatusBadge(rate) {
  if (rate >= 80) return { text: '우수', color: 'green', emoji: '🟢' };
  if (rate >= 50) return { text: '보통', color: 'yellow', emoji: '🟡' };
  if (rate >= 20) return { text: '개선필요', color: 'orange', emoji: '🟠' };
  return { text: '시작단계', color: 'red', emoji: '🔴' };
}

function findMostActiveCategory(mappings) {
  const categoryCounts = {};
  
  for (const [term, implementations] of Object.entries(mappings.terms || {})) {
    for (const impl of implementations) {
      for (const category of impl.memberOf || []) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    }
  }
  
  const mostActive = Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  return mostActive ? mostActive[0] : 'core-concepts';
}

function estimateCompletion(validation) {
  const rate = validation.summary.implementationRate;
  if (rate >= 80) return '1-2개월';
  if (rate >= 50) return '2-3개월';
  if (rate >= 20) return '3-6개월';
  return '6개월 이상';
}

/**
 * 마크다운 대시보드 생성
 */
function generateDashboardMarkdown(data) {
  return `# 용어집 구현 현황 대시보드

> 🕒 최종 업데이트: ${data.metadata.generated_date} ${data.metadata.generated_time}
> 
> 📊 자동 생성된 구현 현황 리포트입니다.

## 📈 전체 현황

### 구현 통계
- **전체 용어집 용어**: ${data.overview.total_glossary_terms}개
- **구현된 용어**: ${data.overview.mapped_terms}개
- **구현률**: **${data.overview.implementation_rate}%**
- **스캔된 파일**: ${data.overview.files_scanned}개
- **태그가 있는 파일**: ${data.overview.files_with_tags}개

### 품질 현황
- **검증 상태**: ${data.quality.validation_status === 'PASS' ? '✅ 통과' : '❌ 실패'}
- **에러**: ${data.quality.errors}개
- **경고**: ${data.quality.warnings}개

## 📊 카테고리별 현황

${Object.entries(data.categories).map(([categoryId, category]) => `
### ${category.icon} ${category.name}

${category.status.emoji} **${category.status.text}** (${category.implementation_rate}%)

- 구현 완료: ${category.implemented}/${category.total}개
- 미구현: ${category.missing}개

${category.priority_terms.length > 0 ? `
**우선순위 구현 대상:**
${category.priority_terms.map(term => `- ${term.name || term.term}`).join('\n')}
` : '**✅ 모든 핵심 용어 구현 완료**'}

${category.recent_implementations.length > 0 ? `
**최근 구현:**
${category.recent_implementations.map(term => `- ${term}`).join('\n')}
` : ''}
`).join('\n')}

## 🎯 우선순위 TODO

${data.priority_todos.slice(0, 5).map((todo, index) => `
### ${index + 1}. ${todo.title}

- **우선순위**: ${todo.priority === 'HIGH' ? '🔴 높음' : todo.priority === 'MEDIUM' ? '🟡 보통' : '🟢 낮음'}
- **카테고리**: ${todo.category}
- **예상 작업량**: ${todo.effort}
- **영향 파일 수**: ${todo.files_affected}개

${todo.description}
`).join('\n')}

## 📊 최근 구현 현황

${data.recent_implementations.length > 0 ? `
${data.recent_implementations.map(impl => `
- **${impl.term}** \`${impl.name}\` (${impl.type})
  - 📁 \`${impl.file}\`
  - 📅 ${impl.date}
`).join('\n')}
` : '최근 구현된 항목이 없습니다.'}

## 📈 진행 트렌드

- **구현 속도**: ${data.trends.implementation_velocity}
- **가장 활발한 카테고리**: ${data.trends.most_active_category}
- **완료 예상 시기**: ${data.trends.completion_estimate}

## 🔄 다음 단계

### 즉시 실행 가능
1. **우선순위 HIGH 항목들부터 처리**
2. **코드에서 참조하는 미정의 용어들을 용어집에 추가**
3. **핵심 구현체들에 JSDoc 태그 추가**

### 중장기 계획
1. **각 카테고리별 80% 이상 구현률 달성**
2. **CI/CD 파이프라인에 검증 단계 추가**
3. **구현 가이드라인 문서 작성**

## 📋 상세 리포트

- 📊 [매핑 데이터](/_data/mappings.json)
- 🔍 [검증 리포트](/_data/validation-report.json)
- 📈 [미구현 분석](/_data/missing-analysis-report.json)

---

*이 대시보드는 \`node implementation-dashboard.js\` 명령어로 자동 생성됩니다.*
*문제가 있거나 개선사항이 있다면 이슈를 생성해주세요.*

<!-- Dashboard generated at ${data.metadata.generated_at} -->`;
}

/**
 * 대시보드 파일 저장
 */
async function saveDashboard(markdownContent, dashboardData) {
  // 마크다운 파일 저장
  const markdownPath = path.join(__dirname, '../implementations/dashboard.md');
  const markdownDir = path.dirname(markdownPath);
  
  if (!fs.existsSync(markdownDir)) {
    fs.mkdirSync(markdownDir, { recursive: true });
  }
  
  fs.writeFileSync(markdownPath, markdownContent);
  
  // JSON 데이터 저장 (API용)
  const jsonPath = path.join(__dirname, '../implementations/_data/dashboard.json');
  fs.writeFileSync(jsonPath, JSON.stringify(dashboardData, null, 2));
  
  console.log(`📄 대시보드 생성 완료:`);
  console.log(`  📋 ${path.relative(rootDir, markdownPath)}`);
  console.log(`  📊 ${path.relative(rootDir, jsonPath)}`);
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDashboard().catch(console.error);
}

export { generateDashboard };