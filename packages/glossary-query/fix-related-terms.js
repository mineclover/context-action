#!/usr/bin/env node

/**
 * 관련 용어 참조 오류 수정 스크립트
 * JSON 데이터에서 존재하지 않는 관련 용어 참조를 정리하고 수정합니다.
 */

const fs = require('fs');

// 색상 정의
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[37m'
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

function fixRelatedTermsReferences() {
  console.log(c('blue', '🔧 관련 용어 참조 오류 수정 시작'));
  console.log(c('blue', '═'.repeat(50)));

  // 데이터 로딩
  const dataFile = 'glossary-data.json';
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  
  const terms = data.terms;
  const termIds = new Set(Object.keys(terms));
  
  let fixedCount = 0;
  let removedCount = 0;
  
  console.log(c('cyan', `\n📊 현재 상태:`));
  console.log(c('gray', `   총 용어 수: ${termIds.size}개`));
  
  // 각 용어의 관련 용어 참조 검사 및 수정
  for (const [termId, term] of Object.entries(terms)) {
    if (term.relatedTerms && Array.isArray(term.relatedTerms)) {
      const originalCount = term.relatedTerms.length;
      
      // 존재하는 용어만 유지
      const validRelatedTerms = term.relatedTerms.filter(relatedId => {
        const exists = termIds.has(relatedId);
        if (!exists) {
          console.log(c('yellow', `   ⚠️ ${termId} → 제거: ${relatedId} (존재하지 않음)`));
          removedCount++;
        }
        return exists;
      });
      
      // 수정된 관련 용어 배열 업데이트
      term.relatedTerms = validRelatedTerms;
      
      if (originalCount !== validRelatedTerms.length) {
        fixedCount++;
      }
    }
  }
  
  console.log(c('cyan', `\n📈 수정 결과:`));
  console.log(c('gray', `   수정된 용어: ${fixedCount}개`));
  console.log(c('gray', `   제거된 참조: ${removedCount}개`));
  
  // 추가로 실제 존재하는 용어들 간의 의미적 관련성을 기반으로 관련 용어 재구성
  console.log(c('cyan', `\n🔗 의미적 관련성 기반 관련 용어 재구성:`));
  
  const keywordIndex = data.index.byKeyword;
  let addedRelations = 0;
  
  // 키워드 기반으로 관련성이 높은 용어들 찾기
  for (const [termId, term] of Object.entries(terms)) {
    if (!term.relatedTerms) {
      term.relatedTerms = [];
    }
    
    // 현재 용어의 키워드들 추출
    const termKeywords = extractTermKeywords(term);
    const currentRelatedTerms = new Set(term.relatedTerms);
    
    // 같은 키워드를 가진 다른 용어들 찾기
    for (const keyword of termKeywords) {
      if (keywordIndex[keyword]) {
        for (const candidateId of keywordIndex[keyword]) {
          if (candidateId !== termId && 
              !currentRelatedTerms.has(candidateId) && 
              termIds.has(candidateId)) {
            
            // 관련성 점수 계산
            const candidateTerm = terms[candidateId];
            const relationScore = calculateRelationScore(term, candidateTerm);
            
            // 높은 관련성 점수를 가진 용어만 추가 (threshold: 0.3)
            if (relationScore > 0.3 && term.relatedTerms.length < 5) {
              term.relatedTerms.push(candidateId);
              currentRelatedTerms.add(candidateId);
              addedRelations++;
              console.log(c('green', `   ✅ ${termId} → 추가: ${candidateId} (점수: ${relationScore.toFixed(2)})`));
            }
          }
        }
      }
    }
  }
  
  console.log(c('gray', `   추가된 관련 용어: ${addedRelations}개`));
  
  // 수정된 데이터 저장
  const backupFile = `${dataFile}.backup.${Date.now()}`;
  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
  console.log(c('yellow', `\n💾 백업 파일 생성: ${backupFile}`));
  
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  console.log(c('green', `✅ 수정된 데이터 저장 완료: ${dataFile}`));
  
  console.log(c('blue', '\n' + '═'.repeat(50)));
  console.log(c('green', '🎉 관련 용어 참조 수정 완료!'));
}

// 용어에서 키워드 추출
function extractTermKeywords(term) {
  const keywords = new Set();
  
  // 제목에서 키워드 추출
  const titleWords = term.title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  titleWords.forEach(word => keywords.add(word));
  
  // 카테고리 키워드
  if (term.category) {
    keywords.add(term.category.toLowerCase());
  }
  
  return Array.from(keywords);
}

// 두 용어 간의 관련성 점수 계산
function calculateRelationScore(term1, term2) {
  let score = 0;
  
  // 같은 카테고리면 보너스
  if (term1.category === term2.category) {
    score += 0.3;
  }
  
  // 제목 단어 겹치는 정도
  const words1 = new Set(term1.title.toLowerCase().split(/\s+/));
  const words2 = new Set(term2.title.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size > 0) {
    score += (intersection.size / union.size) * 0.5;
  }
  
  // 정의에서 상호 참조 여부 (간단한 검사)
  if (term1.definition && term2.definition) {
    const def1Lower = term1.definition.toLowerCase();
    const def2Lower = term2.definition.toLowerCase();
    const title1Lower = term1.title.toLowerCase();
    const title2Lower = term2.title.toLowerCase();
    
    if (def1Lower.includes(title2Lower) || def2Lower.includes(title1Lower)) {
      score += 0.4;
    }
  }
  
  return Math.min(1.0, score);
}

// 실행
if (require.main === module) {
  fixRelatedTermsReferences();
}

module.exports = { fixRelatedTermsReferences };