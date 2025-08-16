# 이름 중복 처리 전략 (Duplicate Handling Strategy)

LLMS Generator 시스템에서 발생할 수 있는 다양한 유형의 이름 중복과 구체적인 처리 방법을 정의합니다.

## 🎯 중복 유형 분류

### 1. **언어별 동일 문서 ID** (현재 상황)
```
en/guide/action-handlers.md → guide-action-handlers
ko/guide/action-handlers.md → guide-action-handlers
```
**처리 방식**: ✅ **허용** - 언어별 독립적 관리

### 2. **동일 언어 내 경로 충돌**
```
en/api/store.md → api-store
en/api/stores.md → api-stores (다른 파일이므로 OK)
en/guide/store.md → guide-store (다른 카테고리이므로 OK)
```
**처리 방식**: ⚠️ **검증 필요** - 실제 충돌 시에만 해결

### 3. **파일 시스템 제약 충돌**
```
en/api/Store.md → api-store
en/api/store.md → api-store (대소문자 구분 안 되는 시스템에서 충돌)
```
**처리 방식**: 🚨 **강제 해결** - 자동 중복 제거 로직 적용

## 📋 구체적 처리 로직

### Phase 1: ID 생성 규칙 표준화

#### 기본 ID 생성 알고리즘
```javascript
function generateDocumentId(sourcePath, language) {
  // 1. 경로에서 언어 프리픽스 제거
  const relativePath = sourcePath.replace(`${language}/`, '');
  
  // 2. 파일 확장자 제거
  const withoutExt = relativePath.replace(/\.md$/, '');
  
  // 3. 슬래시를 대시로 변환
  const baseId = withoutExt.replace(/\//g, '-');
  
  // 4. 특수문자 정규화
  const normalizedId = baseId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return normalizedId;
}
```

#### 고급 정규화 규칙
```javascript
const NORMALIZATION_RULES = {
  // 대소문자 통일
  caseNormalization: 'lowercase',
  
  // 특수문자 처리
  specialChars: {
    '&': 'and',
    '@': 'at', 
    '#': 'hash',
    '$': 'dollar',
    '%': 'percent',
    '+': 'plus',
    '=': 'equals',
    '?': 'question',
    ' ': '-',
    '_': '-',
    '.': '-'
  },
  
  // 연속 대시 제거
  multiDashPattern: /-+/g,
  
  // 앞뒤 대시 제거
  trimDashPattern: /^-|-$/g
};
```

### Phase 2: 중복 감지 시스템

#### 중복 검사 레벨
```javascript
class DuplicateDetector {
  checkDuplicates(documents, options = {}) {
    const results = {
      byLanguage: {},     // 언어별 중복 (허용)
      crossLanguage: {},  // 언어간 중복 (허용) 
      sameLanguage: {},   // 동일 언어 내 중복 (해결 필요)
      filesystem: {}      // 파일시스템 충돌 (강제 해결)
    };
    
    // 1. 언어별 그룹핑
    const languageGroups = this.groupByLanguage(documents);
    
    // 2. 각 언어 내에서 중복 검사
    Object.entries(languageGroups).forEach(([lang, docs]) => {
      const duplicates = this.findIntraLanguageDuplicates(docs);
      if (duplicates.length > 0) {
        results.sameLanguage[lang] = duplicates;
      }
    });
    
    // 3. 파일시스템 레벨 충돌 검사
    const fsConflicts = this.findFilesystemConflicts(documents);
    if (fsConflicts.length > 0) {
      results.filesystem = fsConflicts;
    }
    
    return results;
  }
}
```

### Phase 3: 자동 해결 전략

#### 중복 해결 알고리즘 우선순위
```javascript
const RESOLUTION_STRATEGIES = [
  {
    name: 'category-prefix',
    priority: 1,
    apply: (duplicates) => {
      // 카테고리 정보를 ID에 포함
      // guide-action-handlers → guide-action-handlers
      // api-action-handlers → api-action-handlers (이미 포함됨)
      return duplicates.map(doc => ({
        ...doc,
        id: `${doc.category}-${doc.baseId}`
      }));
    }
  },
  
  {
    name: 'path-hierarchy',
    priority: 2, 
    apply: (duplicates) => {
      // 전체 경로 계층 구조 반영
      // api/core/store.md → api-core-store
      // api/react/store.md → api-react-store
      return duplicates.map(doc => ({
        ...doc,
        id: doc.sourcePath
          .replace(`${doc.language}/`, '')
          .replace(/\.md$/, '')
          .replace(/\//g, '-')
      }));
    }
  },
  
  {
    name: 'numeric-suffix',
    priority: 3,
    apply: (duplicates) => {
      // 숫자 접미사 추가 (최후 수단)
      return duplicates.map((doc, index) => ({
        ...doc,
        id: index === 0 ? doc.id : `${doc.id}-${index + 1}`
      }));
    }
  }
];
```

#### 해결 프로세스
```javascript
async function resolveDuplicates(duplicates, strategy = 'auto') {
  const resolved = [];
  const conflicts = [];
  
  for (const duplicateGroup of duplicates) {
    try {
      // 전략 적용
      const candidates = await applyResolutionStrategy(duplicateGroup, strategy);
      
      // 해결 결과 검증
      const validation = await validateResolution(candidates);
      
      if (validation.success) {
        resolved.push(...candidates);
      } else {
        conflicts.push({
          group: duplicateGroup,
          error: validation.error,
          suggestions: validation.suggestions
        });
      }
    } catch (error) {
      conflicts.push({
        group: duplicateGroup,
        error: error.message
      });
    }
  }
  
  return { resolved, conflicts };
}
```

### Phase 4: 안전장치 및 백업

#### 변경 전 백업
```javascript
class SafeDuplicateResolver {
  async resolveWithBackup(duplicates) {
    // 1. 변경 사항 백업
    const backup = await this.createBackup(duplicates);
    
    try {
      // 2. 중복 해결 실행
      const result = await this.resolveDuplicates(duplicates);
      
      // 3. 검증
      const validation = await this.validateResolution(result);
      
      if (!validation.success) {
        // 4. 실패 시 롤백
        await this.rollback(backup);
        throw new Error(`Resolution failed: ${validation.error}`);
      }
      
      return result;
    } catch (error) {
      // 5. 예외 발생 시 롤백
      await this.rollback(backup);
      throw error;
    }
  }
  
  async createBackup(affectedFiles) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backup-${timestamp}`;
    
    for (const file of affectedFiles) {
      await fs.copy(file.path, `${backupDir}/${file.relativePath}`);
    }
    
    return { backupDir, timestamp, files: affectedFiles };
  }
}
```

## 🛠️ 구현 상세

### 중복 검사 CLI 명령어
```bash
# 중복 검사 실행
node work-queue-cli.cjs check-duplicates [language]

# 중복 해결 실행 (드라이런)
node work-queue-cli.cjs resolve-duplicates --dry-run [language]

# 중복 해결 실행 (실제 적용)
node work-queue-cli.cjs resolve-duplicates --apply [language]

# 백업에서 복구
node work-queue-cli.cjs restore-backup <backup-id>
```

### 설정 파일: `duplicate-config.json`
```json
{
  "detection": {
    "enabled": true,
    "checkLevels": ["sameLanguage", "filesystem"],
    "ignorePatterns": ["api-*-src-*"],
    "caseSensitive": false
  },
  "resolution": {
    "strategy": "auto",
    "fallbackStrategy": "numeric-suffix",
    "preserveOriginal": true,
    "createBackup": true,
    "validateAfterResolve": true
  },
  "rules": {
    "maxIdLength": 100,
    "allowedCharacters": "a-z0-9-",
    "reservedIds": ["index", "readme", "main"],
    "categoryMapping": {
      "guide": "guide",
      "concept": "concept", 
      "api": "api",
      "examples": "examples"
    }
  }
}
```

### 로깅 및 보고서
```javascript
class DuplicateResolutionReporter {
  generateReport(resolution) {
    return {
      summary: {
        totalProcessed: resolution.processed.length,
        duplicatesFound: resolution.duplicates.length,
        resolved: resolution.resolved.length,
        conflicts: resolution.conflicts.length,
        strategy: resolution.strategy
      },
      details: {
        beforeAfter: resolution.changes.map(change => ({
          original: change.before,
          resolved: change.after,
          method: change.resolutionMethod
        })),
        conflicts: resolution.conflicts.map(conflict => ({
          files: conflict.group,
          error: conflict.error,
          suggestions: conflict.suggestions
        }))
      },
      backup: resolution.backup,
      timestamp: new Date().toISOString()
    };
  }
}
```

## 📊 예상 중복 시나리오

### 현재 시스템에서 확인된 패턴
1. **언어별 동일 문서**: 26개 문서가 en/ko 양쪽에 존재 ✅ **정상**
2. **API 문서 세분화**: `api-core-src-*`, `api-react-src-*` 패턴 ✅ **정상**
3. **카테고리 구분**: `guide-*`, `concept-*`, `api-*`, `examples-*` ✅ **정상**

### 미래 확장 시 주의사항
1. **새 언어 추가**: 기존 패턴 유지
2. **새 카테고리 추가**: 고유한 접두사 사용
3. **깊은 중첩 구조**: path-hierarchy 전략 활용
4. **특수 문서 유형**: 예약 ID 목록 확장

## 🚨 긴급 대응 절차

### 중복으로 인한 시스템 오류 발생 시
1. **즉시 백업 생성**: `./wq backup-all`
2. **중복 검사 실행**: `./wq check-duplicates --verbose`
3. **자동 해결 시도**: `./wq resolve-duplicates --dry-run`
4. **수동 검토 후 적용**: `./wq resolve-duplicates --apply`
5. **시스템 검증**: `./wq validate-system`

이 전략을 통해 현재 128개 문서와 향후 확장되는 모든 문서들의 이름 중복을 체계적으로 관리할 수 있습니다.