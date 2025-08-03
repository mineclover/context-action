# Context-Action 용어집 정보 조회 CLI 사용 가이드

## 🚀 개요

jq 기반 고성능 정보 조회 시스템으로 Context-Action 프레임워크의 용어와 구현체 정보를 빠르게 조회할 수 있습니다.

## 📋 기본 사용법

### 1. 카테고리 탐색 워크플로우

```bash
# 1단계: 전체 카테고리 목록 확인
./jq-cli.sh categories

# 2단계: 특정 카테고리의 용어 목록 보기
./jq-cli.sh list core-concepts

# 3단계: 관심 있는 용어의 상세 정보 조회
./jq-cli.sh detail "Action Pipeline System"
```

## 📚 주요 명령어

### Categories - 카테고리 목록

```bash
./jq-cli.sh categories
```

**출력 예시:**
```
📂 카테고리 목록 (총 5개):

🟦 core-concepts (20개 용어)
   핵심 개념과 아키텍처 패턴

🟨 api-terms (40개 용어)  
   API 인터페이스와 사용 방법

🟩 architecture-terms (18개 용어)
   시스템 아키텍처와 설계 패턴

🟪 naming-conventions (18개 용어)
   명명 규칙과 코딩 표준

🟫 VALIDATION (6개 용어)
   유효성 검사와 검증 로직
```

### List - 용어 목록 조회

#### 전체 용어 목록 (기본 10개)
```bash
./jq-cli.sh list
```

#### 카테고리별 용어 목록
```bash
./jq-cli.sh list core-concepts
./jq-cli.sh list api-terms
./jq-cli.sh list architecture-terms
```

#### 제한된 개수로 조회
```bash
./jq-cli.sh list core-concepts --limit 5
./jq-cli.sh list api-terms --limit 15
```

**출력 예시:**
```
📌 용어 목록:
📂 카테고리: core-concepts
📊 표시: 5 용어

 1. 📌 Action Pipeline System
     🏷️  [core-concepts] | 구현: 3개
     📄 The central orchestration system that processes dispatched a...

 2. 📌 Store Integration Pattern
     🏷️  [core-concepts] | 구현: 9개
     📄 The architectural pattern that enables action handlers to re...
```

### Detail - 용어 상세 정보

```bash
./jq-cli.sh detail "Action Pipeline System"
./jq-cli.sh detail "Store Registry"
./jq-cli.sh info "Pipeline Controller"  # info는 detail과 동일
```

**출력 예시:**
```
📌 Action Pipeline System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ ID: action-pipeline-system
🏷️  카테고리: core-concepts

📄 정의:
   The central orchestration system that processes dispatched actions through a series of registered handlers in priority order.

🔧 구현체 (3):
   • StoreActionSetup (example/src/pages/store/StoreFullDemoPage.tsx:35)
   • logger (example/src/demos/store-scenarios/actions/index.ts:26)
   • ActionRegister (packages/core/src/ActionRegister.ts:109)

🔗 관련 용어:
   • Action Handler
   • Pipeline Controller
   • Store Integration Pattern
```

### Keyword - 키워드 검색

```bash
./jq-cli.sh keyword action
./jq-cli.sh keyword store  
./jq-cli.sh keyword provider
```

**출력 예시:**
```
🔍 키워드 'action' 검색 결과:
 1. 📌 ActionRegister [core-concepts]
 2. 📌 ActionProvider [api-terms]
 3. 📌 Action Pipeline System [core-concepts]
 4. 📌 Action Handler [core-concepts]
 ...
```

### Alias - 별칭 검색

```bash
./jq-cli.sh alias 액션
./jq-cli.sh alias 스토어
```

**참고:** 현재 별칭 데이터가 제한적이므로 키워드 검색을 권장합니다.

### Stats - 시스템 통계

```bash
./jq-cli.sh stats
```

**출력 예시:**
```
📊 시스템 통계:
📚 총 용어 수: 97개
📂 카테고리 수: 5개
🔍 키워드 수: 378개
🔗 별칭 수: 46개
⏰ 데이터 생성: 2025-08-03T07:14:26.791Z

카테고리별 용어 수:
  API Terms: 40개
  Core Concepts: 20개
  Naming Conventions: 18개
  Architecture Terms: 18개
  VALIDATION: 6개
```

## 🎯 사용 시나리오

### 시나리오 1: 새로운 개념 학습

```bash
# 1. 전체 카테고리 파악
./jq-cli.sh categories

# 2. 핵심 개념부터 학습
./jq-cli.sh list core-concepts

# 3. 기본 개념 이해
./jq-cli.sh detail "Action Pipeline System"
./jq-cli.sh detail "Store Integration Pattern"

# 4. 관련 용어 탐색
./jq-cli.sh detail "Action Handler"
./jq-cli.sh detail "Pipeline Controller"
```

### 시나리오 2: API 사용법 조회

```bash
# 1. API 관련 용어 목록 확인
./jq-cli.sh list api-terms

# 2. 특정 API 상세 정보
./jq-cli.sh detail "ActionProvider"
./jq-cli.sh detail "useActionDispatch"

# 3. 키워드로 관련 API 찾기
./jq-cli.sh keyword dispatch
./jq-cli.sh keyword hook
```

### 시나리오 3: 구현체 위치 찾기

```bash
# 1. 구현하고 싶은 기능의 용어 검색
./jq-cli.sh keyword store

# 2. 해당 용어의 구현체 확인
./jq-cli.sh detail "Store Registry"
./jq-cli.sh detail "Store Provider"

# 3. 파일 위치와 라인 번호 확인하여 코드 참조
```

### 시나리오 4: 아키텍처 패턴 이해

```bash
# 1. 아키텍처 관련 용어 탐색
./jq-cli.sh list architecture-terms

# 2. 주요 패턴 학습
./jq-cli.sh detail "MVVM Pattern"
./jq-cli.sh detail "Context Store Pattern"

# 3. 관련 구현체 확인
./jq-cli.sh detail "Store Integration Pattern"
```

## ✨ 개선된 기능들

### 1. 유연한 CLI 인수 파싱 ✅
```bash
# ✅ 이제 모두 작동함
./jq-cli.sh list --limit 10           # 전체 용어에서 10개
./jq-cli.sh list core-concepts --limit 5   # 카테고리에서 5개
./jq-cli.sh list --limit 3 core-concepts   # 순서 무관
```

### 2. 확장된 별칭 검색 ✅
```bash
# ✅ 한국어 별칭 지원 (104개 별칭)
./jq-cli.sh alias "액션 핸들러"        # Action Handler
./jq-cli.sh alias "APS"               # Action Pipeline System
./jq-cli.sh alias "스토어 레지스트리"   # Store Registry
```

### 3. 스마트 퍼지 검색 ✅
```bash
# ✅ 부분 매칭과 자동 제안
./jq-cli.sh detail "pipeline"         # "Pipeline Context" 찾음
./jq-cli.sh detail "store"           # "StoreProvider" 찾음
./jq-cli.sh detail "action"          # 관련 용어 자동 매칭
```

### 4. 개선된 오류 처리 ✅
- 단계별 검색: 정확한 매칭 → 별칭 → 퍼지 검색 → 키워드 검색
- 실패 시 유사 용어 제안 및 추천 명령어 안내

## ⚠️ 남은 제한사항

### 1. 대소문자 민감도
- 별칭과 키워드는 대소문자 구분하지 않음
- 하지만 정확한 용어명은 여전히 케이스 센시티브

## 💡 팁과 요령

### 1. 효율적인 탐색 방법
- `categories` → `list` → `detail` 순서로 진행
- 키워드 검색으로 관련 용어 빠르게 발견
- 상세 정보의 "관련 용어" 섹션 활용

### 2. 구현체 활용
- 각 용어의 구현체 목록에서 파일 경로와 라인 번호 확인
- 실제 코드 예시를 통한 학습 권장

### 3. 성능 최적화
- jq 기반으로 빠른 조회 (평균 < 100ms)
- 대용량 데이터도 즉시 응답

## 🔧 문제 해결

### 명령어가 작동하지 않을 때
```bash
# 1. 의존성 확인
./check-dependencies.sh

# 2. 데이터 재생성
node generate-data.js

# 3. 권한 확인
chmod +x jq-cli.sh
```

### 최신 데이터로 업데이트
```bash
# 1. 데이터 재생성
pnpm build

# 2. 또는 직접 실행
node generate-data.js
```

## 📞 도움말

```bash
./jq-cli.sh help  # 전체 명령어 도움말
```

**즉시 시작하기:**
1. `./jq-cli.sh categories` - 카테고리 확인
2. `./jq-cli.sh list core-concepts` - 핵심 개념 목록
3. `./jq-cli.sh detail "Action Pipeline System"` - 상세 정보
4. `./jq-cli.sh keyword action` - 키워드 검색

---

**현재 데이터:** 97개 용어, 5개 카테고리, 378개 키워드, 104개 별칭
**성능:** jq 기반 고속 조회 (< 100ms)
**업데이트:** `node generate-data.js`로 최신 데이터 생성

## 🎉 최신 개선사항 (v2.1)

### ✅ 해결된 문제들
1. **CLI 파싱 이슈** - `./jq-cli.sh list --limit 10` 이제 정상 작동
2. **별칭 부족** - 46개 → 104개 별칭으로 확장 (한국어 별칭 대폭 추가)
3. **검색 정확도** - 퍼지 검색과 단계별 매칭으로 검색 성공률 향상
4. **오류 처리** - 실패 시 유사 용어 제안과 명확한 안내

### 🚀 새로운 기능들
- **스마트 검색**: 정확한 매칭 → 별칭 → 퍼지 검색 → 키워드 검색 순차 시도
- **한국어 지원**: "액션 핸들러", "스토어 레지스트리" 등 한국어 별칭 
- **약어 지원**: "APS" → "Action Pipeline System"
- **부분 매칭**: "pipeline" → "Pipeline Context" 자동 매칭