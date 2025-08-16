# 이름 중복 처리 시스템 - 기능 명세서

## 📋 **시스템 개요**

LLMS Generator의 priority.json 파일 관리 시 발생할 수 있는 ID 중복을 체계적으로 탐지하고 해결하는 시스템입니다.

### **버전**: 1.0.0
### **최종 업데이트**: 2025-08-16
### **담당 모듈**: `work-queue-cli.cjs`, `wq` (래퍼 스크립트)

---

## 🎯 **핵심 기능 (Core Features)**

### **1. 중복 탐지 시스템 (Duplicate Detection)**

#### **1.1 탐지 범위**
- **언어별 중복**: 동일 언어 내 ID 충돌 검사
- **파일시스템 충돌**: 대소문자 구분 없는 시스템에서의 충돌
- **언어간 중복**: 다국어 간 동일 ID (정상 상황, 정보성)

#### **1.2 탐지 알고리즘**
```javascript
// 입력: 모든 언어의 문서 목록
// 출력: 중복 분류 결과
{
  sameLanguage: { "en": [["duplicate-id", [doc1, doc2]]] },
  filesystem: [["en:duplicate-id", [doc1, doc2]]],
  crossLanguage: [["shared-id", ["en", "ko"]]]
}
```

#### **1.3 검사 명령어**
```bash
# 전체 언어 검사
node work-queue-cli.cjs check-duplicates
./wq check

# 특정 언어 검사  
node work-queue-cli.cjs check-duplicates en
./wq check en
```

### **2. 자동 해결 시스템 (Auto Resolution)**

#### **2.1 해결 전략 (Resolution Strategies)**

| 전략 | 우선순위 | 적용 방식 | 예시 |
|------|----------|-----------|------|
| `path-hierarchy` | 1 | 전체 경로 계층 반영 | `api/core/store.md` → `api-core-store` |
| `category-prefix` | 2 | 카테고리 접두사 추가 | `store.md` → `api-store` |
| `numeric-suffix` | 3 | 숫자 접미사 추가 | `store` → `store-2` |

#### **2.2 자동 전략 선택**
```javascript
if (conflictType === 'filesystem') {
  strategy = 'path-hierarchy';  // 파일시스템 충돌
} else {
  strategy = 'category-prefix'; // 동일 언어 충돌
}
```

#### **2.3 해결 명령어**
```bash
# 시뮬레이션 (변경 없음)
node work-queue-cli.cjs resolve-duplicates --dry-run
./wq resolve --dry-run

# 실제 해결
node work-queue-cli.cjs resolve-duplicates en
./wq resolve en

# 전략 지정
./wq resolve --strategy=path-hierarchy
```

### **3. 안전장치 시스템 (Safety Measures)**

#### **3.1 변경 전 검증**
- **충돌 재검사**: 해결 후에도 중복이 남아있는지 확인
- **Fallback 전략**: 실패 시 다른 전략으로 자동 전환
- **롤백 준비**: 변경 사항 추적 및 복구 정보 보관

#### **3.2 실행 모드**
- **Dry Run**: `--dry-run` 플래그로 변경 없이 분석만 실행
- **실제 적용**: 검증 완료 후 파일 시스템에 실제 변경 적용
- **점진적 적용**: 충돌별로 개별 처리하여 부분 실패 시에도 일부 해결

---

## 🔧 **기술 명세 (Technical Specifications)**

### **데이터 구조**

#### **중복 충돌 객체**
```typescript
interface DuplicateConflict {
  type: 'sameLanguage' | 'filesystem';
  language?: string;           // sameLanguage인 경우
  conflictId?: string;         // 충돌하는 ID
  conflictKey?: string;        // filesystem 충돌 키
  documents: DocumentInfo[];   // 충돌하는 문서들
  severity: 'high' | 'medium' | 'low';
}
```

#### **해결 결과 객체**
```typescript
interface ResolutionResult {
  conflict: DuplicateConflict;
  strategy: string;           // 사용된 해결 전략
  changes: IdChange[];        // 실행된 변경 사항
  applied: boolean;           // 실제 적용 여부
}

interface IdChange {
  document: DocumentInfo;
  oldId: string;
  newId: string;
  method: string;            // 해결 방법
}
```

### **파일 시스템 변경**

#### **영향 받는 파일**
1. **priority.json**: `document.id` 필드 업데이트
2. **metadata.updated**: 변경 일시 기록
3. **디렉토리 이름**: ID와 일치하도록 변경

#### **변경 예시**
```bash
# Before
packages/llms-generator/data/en/store/
├── priority.json          # {"document": {"id": "store"}}
├── store-100.md
└── store-200.md

# After (path-hierarchy 적용)
packages/llms-generator/data/en/api-store/
├── priority.json          # {"document": {"id": "api-store"}}
├── api-store-100.md
└── api-store-200.md
```

---

## 📊 **성능 및 제약사항**

### **처리 성능**
- **검사 속도**: ~102개 문서 < 2초
- **해결 속도**: 충돌당 < 1초
- **메모리 사용량**: < 50MB

### **제약사항**
- **최대 ID 길이**: 100자
- **허용 문자**: `a-z0-9-`
- **예약 ID**: `["index", "readme", "main"]`
- **동시 실행**: 단일 프로세스만 지원

### **확장성**
- **언어 추가**: 설정 변경 없이 자동 지원
- **전략 추가**: `resolutionMethods` 객체에 함수 추가
- **파일 형식**: `.md` 외 다른 확장자 지원 가능

---

## 🧪 **테스트 시나리오**

### **시나리오 1: 정상 상황**
```bash
# 입력: 언어별 고유 ID들
# 예상 출력: "No duplicate conflicts found!"
./wq check
```

### **시나리오 2: 동일 언어 내 중복**
```bash
# 시뮬레이션
mkdir -p data/en/test-duplicate-1 data/en/test-duplicate-2
echo '{"document":{"id":"duplicate"}}' > data/en/test-duplicate-1/priority.json
echo '{"document":{"id":"duplicate"}}' > data/en/test-duplicate-2/priority.json

# 검사 및 해결
./wq check en          # 중복 탐지
./wq resolve --dry-run  # 해결 시뮬레이션
./wq resolve en         # 실제 해결
```

### **시나리오 3: 파일시스템 충돌**
```bash
# macOS/Windows: Store.md vs store.md
# 검사 시 filesystem conflict로 분류
# path-hierarchy 전략으로 해결
```

---

## 🔄 **워크플로우 통합**

### **기존 작업 큐와의 연동**
```bash
# 1. 중복 검사
./wq check

# 2. 중복 해결 (필요시)
./wq resolve --dry-run    # 분석
./wq resolve              # 적용

# 3. 정상 작업 진행
./wq next                 # 다음 작업 대상
./wq c <id>               # 작업 완료
```

### **LLMS 생성 워크플로우와의 통합**
```bash
# priority.json 템플릿 생성
node bulk-priority-generator.cjs en

# 중복 검사 및 해결
./wq check
./wq resolve

# 개별 파일 생성
node generate-individual-files.cjs

# LLMS 집계 파일 생성
node dist/cli/index.js minimum en
```

---

## 📚 **API 문서**

### **주요 메서드**

#### **`checkDuplicates(language?: string)`**
- **목적**: 중복 ID 검사 실행
- **입력**: 언어 코드 (선택사항, 기본값: 모든 언어)
- **출력**: 중복 분류 결과 객체
- **부작용**: 없음 (읽기 전용)

#### **`resolveDuplicates(language?: string, options)`**
- **목적**: 중복 ID 자동 해결
- **입력**: 언어 코드, 옵션 객체
- **옵션**: `{dryRun: boolean, strategy: string}`
- **출력**: 해결 결과 객체
- **부작용**: dryRun=false시 파일 시스템 변경

#### **`resolveConflict(conflict, strategy, dryRun)`**
- **목적**: 개별 충돌 해결
- **입력**: 충돌 객체, 전략명, 드라이런 여부
- **출력**: 개별 해결 결과
- **부작용**: 해결 로직 적용

---

## 🎯 **성공 기준**

### **기능적 요구사항**
- ✅ 모든 중복 유형 정확히 탐지
- ✅ 자동 해결 전략 3가지 구현
- ✅ Dry run 모드 지원
- ✅ 안전한 파일 시스템 변경
- ✅ 명령줄 인터페이스 제공

### **비기능적 요구사항**  
- ✅ 2초 이내 검사 완료 (128개 문서)
- ✅ 사용자 친화적 출력 형식
- ✅ 오류 시 명확한 메시지
- ✅ 래퍼 스크립트 단축 명령어
- ✅ 포괄적 도움말 제공

### **품질 요구사항**
- ✅ 기존 작업 큐 기능과 충돌 없음
- ✅ 기존 파일 구조 보존
- ✅ 롤백 가능한 변경 사항
- ✅ 명확한 로깅 및 보고
- ✅ 확장 가능한 아키텍처

---

## 🔮 **향후 확장 계획**

### **Phase 2 (예정)**
- **백업/복구 시스템**: 자동 백업 및 복구 기능
- **대화형 해결**: 수동 선택 옵션 제공
- **설정 파일**: `duplicate-config.json` 지원
- **웹 인터페이스**: GUI 기반 중복 관리

### **Phase 3 (고려사항)**
- **예방 시스템**: 중복 생성 방지
- **ML 기반 전략**: 패턴 학습 기반 해결
- **통계 대시보드**: 중복 발생 패턴 분석
- **CI/CD 통합**: 자동화된 중복 검사

이 명세서는 구현된 기능의 정확한 동작 방식과 사용법을 완전히 문서화하며, 향후 유지보수와 확장의 기준점 역할을 합니다.