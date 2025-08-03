#!/usr/bin/env node

/**
 * jq 기반 정보 조회를 위한 최적화된 JSON 데이터 생성기
 */

const fs = require('fs');
const path = require('path');

async function generateOptimizedData() {
  console.log('🔄 jq 기반 정보 조회용 데이터 생성 중...');
  
  const baseDir = path.dirname(path.dirname(__dirname));
  const glossaryDir = path.join(baseDir, 'glossary');
  const termsDir = path.join(glossaryDir, 'terms');
  const dataDir = path.join(glossaryDir, 'implementations/_data');
  
  // 1. 기존 매핑 데이터 로드
  let mappings = {};
  try {
    const mappingsPath = path.join(dataDir, 'mappings.json');
    const mappingsContent = fs.readFileSync(mappingsPath, 'utf-8');
    mappings = JSON.parse(mappingsContent);
    console.log('📄 매핑 데이터 로드 완료');
  } catch (error) {
    console.warn('⚠️ 매핑 데이터 로드 실패, 빈 객체 사용');
  }
  
  // 2. 용어 정의 파일들 로드
  const termFiles = fs.readdirSync(termsDir)
    .filter(f => f.endsWith('.md') && f !== 'index.md');
  
  const result = {
    metadata: {
      version: '1.0.0',
      generated: new Date().toISOString(),
      totalTerms: 0,
      categories: []
    },
    categories: {},
    terms: {},
    index: {
      byKeyword: {},
      byAlias: {}
    }
  };
  
  console.log('📖 용어 정의 파일 처리 중...');
  
  for (const file of termFiles) {
    const category = file.replace('.md', '');
    const categoryName = formatCategoryName(category);
    const filePath = path.join(termsDir, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const terms = parseTermsFromMarkdown(content, category);
      
      // 카테고리 정보 추가
      result.categories[category] = {
        name: categoryName,
        description: extractCategoryDescription(content),
        termCount: terms.length,
        terms: terms.map(t => t.id)
      };
      
      // 용어 정보 추가
      terms.forEach(term => {
        // 매핑 데이터에서 구현 정보 추가
        if (mappings.terms && mappings.terms[term.id]) {
          term.implementations = mappings.terms[term.id];
        } else {
          term.implementations = [];
        }
        
        result.terms[term.id] = term;
        
        // 키워드 인덱스 구축
        addToKeywordIndex(result.index.byKeyword, term);
        
        // 별칭 인덱스 구축
        if (term.aliases) {
          term.aliases.forEach(alias => {
            result.index.byAlias[alias] = term.id;
          });
        }
      });
      
      console.log(`✅ ${file}: ${terms.length}개 용어 처리 완료`);
      
    } catch (error) {
      console.error(`❌ ${file} 처리 실패:`, error.message);
    }
  }
  
  // 메타데이터 업데이트
  result.metadata.totalTerms = Object.keys(result.terms).length;
  result.metadata.categories = Object.keys(result.categories);
  
  // 3. 최적화된 JSON 파일 생성
  const outputPath = path.join(__dirname, 'glossary-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  
  console.log('✅ 데이터 생성 완료!');
  console.log(`📊 총 ${result.metadata.totalTerms}개 용어`);
  console.log(`📂 ${result.metadata.categories.length}개 카테고리`);
  console.log(`🔍 ${Object.keys(result.index.byKeyword).length}개 키워드`);
  console.log(`🔗 ${Object.keys(result.index.byAlias).length}개 별칭`);
  console.log(`📁 출력: ${outputPath}`);
  
  return outputPath;
}

function formatCategoryName(category) {
  const nameMap = {
    'core-concepts': 'Core Concepts',
    'api-terms': 'API Terms',
    'architecture-terms': 'Architecture Terms',
    'naming-conventions': 'Naming Conventions',
    'validation': 'Validation'
  };
  return nameMap[category] || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function extractCategoryDescription(content) {
  const lines = content.split('\n');
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && !line.startsWith('**')) {
      return line;
    }
  }
  return 'Framework terminology and concepts';
}

function parseTermsFromMarkdown(content, category) {
  const terms = [];
  const sections = content.split(/\n## /).slice(1);
  
  sections.forEach(section => {
    const lines = section.split('\n');
    const title = lines[0].trim();
    const id = titleToId(title);
    
    let definition = '';
    let keywords = [];
    let aliases = [];
    let relatedTerms = [];
    let examples = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.includes('**Definition**:')) {
        definition = trimmed.replace('**Definition**:', '').trim();
      }
      
      if (trimmed.includes('**Related Terms**:')) {
        const relatedText = trimmed.replace('**Related Terms**:', '');
        relatedTerms = extractRelatedTerms(relatedText);
      }
      
      if (trimmed.startsWith('```') && !trimmed.endsWith('```')) {
        // Code example start
        examples.push(trimmed);
      }
    });
    
    // Extract keywords from title and definition
    keywords = extractKeywords(title + ' ' + definition);
    
    // Add common aliases
    aliases = generateAliases(title);
    
    if (title && id) {
      terms.push({
        id,
        title,
        category,
        definition: definition || `${category} 카테고리의 용어`,
        keywords,
        aliases,
        implementations: [],
        relatedTerms,
        examples,
        since: '1.0.0',
        lastModified: new Date().toISOString()
      });
    }
  });
  
  return terms;
}

function titleToId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2)
    .filter(word => !isStopWord(word))
    .slice(0, 10); // 최대 10개 키워드
}

function isStopWord(word) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', '그', '이', '저', '것'
  ]);
  return stopWords.has(word);
}

function generateAliases(title) {
  const aliases = [];
  
  // Korean translations for common terms
  const translations = {
    'Action': '액션',
    'Store': '스토어', 
    'Handler': '핸들러',
    'Provider': '프로바이더',
    'Pipeline': '파이프라인',
    'System': '시스템',
    'Pattern': '패턴',
    'Registry': '레지스트리',
    'Controller': '컨트롤러',
    'Context': '컨텍스트',
    'Hook': '훅',
    'Component': '컴포넌트',
    'Integration': '통합',
    'Dispatcher': '디스패처',
    'Guard': '가드',
    'Configuration': '설정',
    'Payload': '페이로드',
    'Register': '레지스터',
    'Logger': '로거',
    'Interface': '인터페이스',
    'Validator': '검증기',
    'Cleanup': '정리',
    'Metrics': '메트릭',
    'Events': '이벤트',
    'Operations': '연산',
    'Execution': '실행',
    'Management': '관리',
    'Layer': '레이어',
    'Architecture': '아키텍처',
    'Model': '모델',
    'View': '뷰'
  };
  
  // 단어별 한국어 변환
  Object.entries(translations).forEach(([en, ko]) => {
    if (title.includes(en)) {
      aliases.push(title.replace(en, ko));
    }
  });
  
  // 약어 생성
  const abbrevMap = {
    'Action Pipeline System': ['APS', '액션 파이프라인'],
    'Store Registry': ['스토어 레지스트리'],
    'Action Handler': ['액션 핸들러'],
    'Pipeline Controller': ['파이프라인 컨트롤러'],
    'Action Provider': ['액션 프로바이더'],
    'Store Provider': ['스토어 프로바이더'],
    'Context Store Pattern': ['컨텍스트 스토어 패턴'],
    'MVVM Pattern': ['MVVM 패턴'],
    'Store Integration Pattern': ['스토어 통합 패턴']
  };
  
  if (abbrevMap[title]) {
    aliases.push(...abbrevMap[title]);
  }
  
  // 공통 단어 조합 별칭
  const commonPhrases = {
    'useActionDispatch': ['액션 디스패치 훅', 'useAction', '액션 훅'],
    'useStoreValue': ['스토어 값 훅', 'useStore', '스토어 훅'],
    'ActionRegister': ['액션 레지스터', '액션 등록기'],
    'StoreRegistry': ['스토어 레지스트리', '스토어 등록소'],
    'Pipeline Context': ['파이프라인 컨텍스트', '파이프라인 상황']
  };
  
  if (commonPhrases[title]) {
    aliases.push(...commonPhrases[title]);
  }
  
  return aliases.filter(Boolean);
}

function extractRelatedTerms(text) {
  const matches = text.match(/\[([^\]]+)\]/g) || [];
  return matches.map(match => 
    titleToId(match.replace(/[\[\]]/g, ''))
  );
}

function addToKeywordIndex(index, term) {
  term.keywords.forEach(keyword => {
    if (!index[keyword]) {
      index[keyword] = [];
    }
    if (!index[keyword].includes(term.id)) {
      index[keyword].push(term.id);
    }
  });
  
  // Add title words
  const titleWords = extractKeywords(term.title);
  titleWords.forEach(word => {
    if (!index[word]) {
      index[word] = [];
    }
    if (!index[word].includes(term.id)) {
      index[word].push(term.id);
    }
  });
}

// 실행
if (require.main === module) {
  generateOptimizedData().catch(console.error);
}

module.exports = { generateOptimizedData };