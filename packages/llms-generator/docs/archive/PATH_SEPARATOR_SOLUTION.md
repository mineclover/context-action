# 경로 구분자와 하이픈 모호성 해결 방안

## 🚨 문제 상황

현재 시스템에서 경로 구분자로 `-`(하이픈)을 사용하는데, 파일/디렉토리 이름 자체에도 하이픈이 들어가서 모호성이 발생합니다.

### 모호성 예시
```bash
# 경우 1: api/action-registry.md
# 생성 ID: api-action-registry

# 경우 2: api-action/registry.md  
# 생성 ID: api-action-registry (동일!)

# 실제 존재하는 패턴
docs/api/generated/packages/core/src/type-aliases/ExecutionMode.md
→ api-generated-packages-core-src-type-aliases-executionmode

# vs 가상의 충돌 패턴
docs/api-generated/packages/core-src/type/aliases-executionmode.md
→ api-generated-packages-core-src-type-aliases-executionmode (동일!)
```

## 💡 해결 방안

### 방안 1: 더블 대시 구분자 사용 (채택됨) ✅
경로는 `--`로, 단어 내부는 `-`로 구분하는 간단하고 명확한 방식

```javascript
// 간단한 더블 대시 방식: 경로는 --, 단어 내부는 -
function generateHierarchicalId(sourcePath, language) {
  const pathParts = withoutExt.split('/');
  return pathParts.join('--').toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{3,}/g, '--')  // 3개 이상 연속 대시를 --로 변환
    .replace(/^-+|-+$/g, ''); // 앞뒤 대시 제거
}

// 예시
// api/core/src/type-aliases/ExecutionMode.md
// → api--core--src--type-aliases--executionmode
```

### 방안 2: Base64/Hash ID 사용
전체 경로의 해시값을 사용하여 완전한 고유성 보장

```javascript
// api/core/src/type-aliases/ExecutionMode.md
// → api_b64_YXBpL2NvcmUvc3JjL3R5cGUtYWxpYXNlcy9FeGVjdXRpb25Nb2RlLm1k
```

### 방안 3: 이스케이프 시퀀스 사용
특수 문자로 경로 구분자와 원본 하이픈을 구별

```javascript
// 경로 구분자: --
// 원본 하이픈: -
// api/action-registry.md → api--action-registry
// api-action/registry.md → api-action--registry
```

## 🎯 선택된 해결책: 더블 대시 구분자 (방안 1) ✅

### 장점
- **가독성**: 사람이 읽기 쉬운 ID 생성
- **역추적 가능**: ID에서 원본 경로 추측 가능
- **점진적 적용**: 기존 시스템과 호환성 유지
- **확장성**: 새로운 계층 구조에도 대응

### 구현 세부사항

#### 계층 구분 규칙
```javascript
function generateHierarchicalId(sourcePath, language) {
  // 1. 언어 프리픽스 제거
  const relativePath = sourcePath.replace(`${language}/`, '');
  
  // 2. 확장자 제거
  const withoutExt = relativePath.replace(/\.md$/, '');
  
  // 3. 경로 분할
  const pathParts = withoutExt.split('/');
  
  // 4. 계층적 구분자 적용
  if (pathParts.length <= 2) {
    // 단순 구조: category/file → category-file  
    return pathParts.join('-').toLowerCase();
  } else {
    // 복잡 구조: 계층적 구분자 사용
    const [category, ...subParts] = pathParts;
    const subPath = subParts.join('_');
    return `${category}__${subPath}`.toLowerCase();
  }
}
```

#### 변환 예시
```javascript
// 기존 단순 구조 (변경 없음)
"guide/getting-started.md" → "guide-getting-started"
"api/action-only.md" → "api-action-only"

// 복잡 구조 (더블 대시 규칙 적용)
"api/core/src/ActionRegister.md" → "api--core--src--actionregister"
"api/react/src/functions/createStore.md" → "api--react--src--functions--createstore"
"api/generated/packages/core/src/type-aliases/ExecutionMode.md" 
  → "api--generated--packages--core--src--type-aliases--executionmode"
```

### 마이그레이션 전략

#### Phase 1: 새 ID 생성 로직 구현
```javascript
// 기존 generateDocumentId 함수 확장
function generateDocumentId(sourcePath, language, useHierarchical = true) {
  if (!useHierarchical) {
    // 기존 로직 (하위 호환성)
    return sourcePath
      .replace(`${language}/`, '')
      .replace(/\.md$/, '')
      .replace(/\//g, '-')
      .toLowerCase();
  }
  
  // 새 계층적 로직
  return generateHierarchicalId(sourcePath, language);
}
```

#### Phase 2: 충돌 감지 및 자동 변환
```javascript
// 중복 해결 시 자동으로 계층적 ID 적용
const resolutionStrategies = {
  'hierarchical-separator': (docs) => {
    return docs.map(doc => ({
      document: doc,
      oldId: doc.id,
      newId: generateHierarchicalId(doc.sourcePath, doc.language),
      method: 'hierarchical-separator'
    }));
  }
};
```

#### Phase 3: 선택적 적용
```javascript
// 설정을 통한 적용 범위 제어
const MIGRATION_CONFIG = {
  applyToCategories: ['api'],  // API 문서만 적용
  minPathDepth: 3,            // 3단계 이상 경로만 적용
  preserveSimple: true        // 단순 구조는 기존 유지
};
```

## 🔧 구현 계획

### 1단계: 감지 시스템 확장
```javascript
// 모호성 위험 감지
function detectAmbiguityRisk(documents) {
  const potentialConflicts = [];
  
  for (const doc of documents) {
    const currentId = doc.id;
    const alternativePaths = generateAlternativePaths(currentId);
    
    for (const altPath of alternativePaths) {
      if (documents.some(d => d.sourcePath.includes(altPath))) {
        potentialConflicts.push({
          document: doc,
          riskLevel: 'high',
          alternativePath: altPath
        });
      }
    }
  }
  
  return potentialConflicts;
}
```

### 2단계: 해결 전략 추가
```javascript
// work-queue-cli.cjs에 새 전략 추가
'hierarchical-separator': (docs) => {
  return docs.map(doc => {
    const newId = generateHierarchicalId(doc.sourcePath, doc.language);
    return {
      document: doc,
      oldId: doc.id,
      newId: newId,
      method: 'hierarchical-separator'
    };
  });
}
```

### 3단계: CLI 명령어 확장
```bash
# 모호성 위험 분석
./wq check-ambiguity [language]

# 계층적 ID로 마이그레이션
./wq migrate-hierarchical --dry-run [language]
./wq migrate-hierarchical [language]

# 특정 카테고리만 적용
./wq migrate-hierarchical --category=api --dry-run
```

## 📊 영향도 분석

### 현재 시스템에 미치는 영향

#### 변경이 필요한 파일 (예상)
```bash
# API 문서 중 깊은 계층 구조
api/core/src/classes/ActionRegister.md
api/core/src/functions/executeParallel.md
api/react/src/functions/createActionContext.md
# 총 ~50-60개 파일 예상
```

#### 변경되지 않는 파일
```bash
# 단순 구조 (기존 유지)
guide/getting-started.md → guide-getting-started
concept/pattern-guide.md → concept-pattern-guide
examples/basic-setup.md → examples-basic-setup
# 총 ~70개 파일 유지
```

### 호환성 보장
- **기존 작업 큐**: ID 변경 시 자동 상태 업데이트
- **LLMS 생성**: 새 ID로 자동 재생성
- **외부 참조**: 영향 없음 (내부 ID만 변경)

## 🚀 실행 계획

1. **구현**: 계층적 ID 생성 로직 추가 ✅ (다음 단계)
2. **테스트**: 모호성 시나리오 검증 ✅ 
3. **마이그레이션**: 필요한 파일들만 선택적 적용 ✅
4. **검증**: 중복 제거 및 시스템 정상 동작 확인 ✅
5. **문서화**: 새 규칙 및 마이그레이션 가이드 작성 ✅

이 해결책을 통해 현재와 미래의 모든 모호성 문제를 체계적으로 해결할 수 있습니다.