# Context-Action 용어집 검색 가이드

## 🎯 개요

이 문서는 Context-Action 프레임워크 용어집을 원활하게 검색하기 위해 필요한 모든 지식을 제공합니다.

## 🚀 빠른 검색 시작하기

### 30초 만에 찾기
```bash
# 1단계: 카테고리 확인 (3초)
./jq-cli.sh categories

# 2단계: 관심 영역 탐색 (5초)
./jq-cli.sh list core-concepts

# 3단계: 구체적 정보 확인 (2초)
./jq-cli.sh detail "Action Pipeline System"
```

## 🔍 검색 전략별 가이드

### 1. 🎯 목적별 검색

#### A. 개념 이해하고 싶을 때
```bash
./jq-cli.sh list core-concepts        # 핵심 개념들
./jq-cli.sh detail "Action Pipeline System"
./jq-cli.sh detail "Store Integration Pattern"
```

#### B. API 사용법 알고 싶을 때
```bash
./jq-cli.sh list api-terms            # API 관련 용어들
./jq-cli.sh detail "useActionDispatch"
./jq-cli.sh detail "ActionProvider"
```

#### C. 아키텍처 이해하고 싶을 때
```bash
./jq-cli.sh list architecture-terms   # 아키텍처 패턴들
./jq-cli.sh detail "MVVM Pattern"
./jq-cli.sh detail "Context Store Pattern"
```

#### D. 코딩 규칙 확인하고 싶을 때
```bash
./jq-cli.sh list naming-conventions   # 명명 규칙들
```

### 2. 🔤 검색어 유형별 전략

#### A. 정확한 용어명 알 때
```bash
./jq-cli.sh detail "Action Pipeline System"
./jq-cli.sh detail "Store Registry"
```

#### B. 부분적으로만 기억할 때
```bash
./jq-cli.sh detail "pipeline"         # "Pipeline Context" 찾음
./jq-cli.sh detail "store"           # "StoreProvider" 찾음
./jq-cli.sh detail "action"          # 관련 용어 매칭
```

#### C. 한국어로 알고 있을 때
```bash
./jq-cli.sh alias "액션 핸들러"        # Action Handler
./jq-cli.sh alias "스토어 레지스트리"   # Store Registry
./jq-cli.sh alias "파이프라인 컨트롤러" # Pipeline Controller
```

#### D. 약어로 알고 있을 때
```bash
./jq-cli.sh alias "APS"               # Action Pipeline System
./jq-cli.sh alias "MVVM"              # MVVM Pattern
```

#### E. 키워드로 관련 용어 찾을 때
```bash
./jq-cli.sh keyword action            # action 관련 모든 용어
./jq-cli.sh keyword store             # store 관련 모든 용어
./jq-cli.sh keyword hook              # hook 관련 모든 용어
```

## 📚 주요 용어 카테고리 가이드

### 🔧 Core Concepts (핵심 개념)
**언제 찾아보나:** 프레임워크의 기본 동작 원리를 이해하고 싶을 때

**주요 용어들:**
- `Action Pipeline System` - 전체 액션 처리 시스템
- `Store Integration Pattern` - 스토어와 액션 연결 패턴
- `Action Handler` - 개별 액션 처리 함수
- `Pipeline Controller` - 파이프라인 제어 인터페이스

```bash
./jq-cli.sh list core-concepts --limit 5
```

### 🔌 API Terms (API 용어)
**언제 찾아보나:** 구체적인 코드 구현 방법을 알고 싶을 때

**주요 용어들:**
- `useActionDispatch` - 액션 디스패치 훅
- `ActionProvider` - React 컨텍스트 프로바이더
- `StoreProvider` - 스토어 컨텍스트 프로바이더
- `useStoreValue` - 스토어 값 구독 훅

```bash
./jq-cli.sh list api-terms --limit 10
```

### 🏗️ Architecture Terms (아키텍처 용어)
**언제 찾아보나:** 시스템 설계나 구조를 이해하고 싶을 때

**주요 용어들:**
- `MVVM Pattern` - Model-View-ViewModel 패턴
- `Context Store Pattern` - 컨텍스트 기반 스토어 패턴
- `Provider Pattern` - 프로바이더 패턴

```bash
./jq-cli.sh list architecture-terms
```

### 📝 Naming Conventions (명명 규칙)
**언제 찾아보나:** 일관된 네이밍을 위한 규칙을 확인하고 싶을 때

```bash
./jq-cli.sh list naming-conventions
```

## 🎯 상황별 검색 패턴

### 🆕 신규 개발자 온보딩
```bash
# 1. 전체 구조 파악
./jq-cli.sh categories
./jq-cli.sh stats

# 2. 핵심 개념 학습
./jq-cli.sh list core-concepts
./jq-cli.sh detail "Action Pipeline System"
./jq-cli.sh detail "Store Integration Pattern"

# 3. API 사용법 학습
./jq-cli.sh list api-terms
./jq-cli.sh detail "useActionDispatch"
./jq-cli.sh detail "ActionProvider"
```

### 🔧 구현 중 막힐 때
```bash
# 1. 키워드로 관련 용어 찾기
./jq-cli.sh keyword <현재_작업_키워드>

# 2. 구현체 위치 확인
./jq-cli.sh detail "<용어명>"  # 구현체 섹션에서 파일 위치 확인

# 3. 관련 용어들 탐색
# detail 결과의 "관련 용어" 섹션 활용
```

### 🐛 디버깅할 때
```bash
# 1. 문제 영역 관련 용어 검색
./jq-cli.sh keyword error
./jq-cli.sh keyword validation
./jq-cli.sh keyword pipeline

# 2. 관련 개념 상세 확인
./jq-cli.sh detail "Pipeline Controller"
./jq-cli.sh detail "Action Handler"
```

### 📖 문서 작성할 때
```bash
# 1. 정확한 용어 확인
./jq-cli.sh detail "<용어명>"

# 2. 관련 용어들 파악
# detail 결과의 "관련 용어" 활용

# 3. 구현체 예시 확인
# 구현체 섹션에서 실제 코드 위치 확인
```

## 🔍 고급 검색 기법

### 1. 단계적 검색 활용
시스템은 다음 순서로 자동 검색을 시도합니다:
1. **정확한 매칭** - 입력한 이름과 정확히 일치하는 용어
2. **별칭 검색** - 한국어 별칭이나 약어 매칭
3. **퍼지 검색** - 부분 문자열 매칭
4. **키워드 검색** - 관련 키워드로 확장 검색

### 2. 별칭 활용하기
```bash
# 한국어 개발자를 위한 별칭들
./jq-cli.sh alias "액션 파이프라인"      # Action Pipeline System
./jq-cli.sh alias "스토어 통합 패턴"     # Store Integration Pattern
./jq-cli.sh alias "액션 디스패치 훅"     # useActionDispatch

# 약어 활용
./jq-cli.sh alias "APS"                 # Action Pipeline System
```

### 3. 구현체 위치 빠르게 찾기
```bash
# 1. 용어 상세 정보에서 구현체 확인
./jq-cli.sh detail "Store Registry"

# 출력 예시:
# 🔧 구현체 (5개):
#    • HooksStores (example/src/pages/react/ReactHooksPage.tsx:44)
#    • GlobalStores (example/src/pages/react/ReactContextPage.tsx:60)
```

### 4. 관련 용어 네트워크 탐색
```bash
# 1. 시작 용어의 관련 용어들 확인
./jq-cli.sh detail "Action Pipeline System"

# 2. 관련 용어들 하나씩 탐색
./jq-cli.sh detail "Action Handler"
./jq-cli.sh detail "Pipeline Controller"
```

## 🎯 검색 효율성 팁

### ⚡ 빠른 탐색을 위한 명령어
```bash
# 자주 사용하는 alias 설정 (선택사항)
alias caq='./jq-cli.sh'
alias cacat='./jq-cli.sh categories'
alias calist='./jq-cli.sh list'
alias cadet='./jq-cli.sh detail'
alias cakw='./jq-cli.sh keyword'

# 사용 예시
cacat                           # 카테고리 목록
calist core-concepts --limit 5  # 핵심 개념 5개
cadet "Action Pipeline System"  # 상세 정보
cakw action                     # 키워드 검색
```

### 📊 검색 성공률 높이기
1. **카테고리부터 시작** - 대략적인 영역을 먼저 파악
2. **키워드 활용** - 정확한 이름을 모를 때는 키워드 검색
3. **부분 이름으로 시도** - "pipeline", "store" 같은 핵심 단어만으로도 찾기 가능
4. **한국어 별칭 활용** - 한국어로 된 별칭들도 많이 지원
5. **관련 용어 네트워크** - 하나의 용어에서 시작해서 관련 용어들로 확장

## ⚠️ 검색 시 주의사항

### 🔤 대소문자 관련
- **별칭/키워드**: 대소문자 구분 안함
- **정확한 용어명**: 대소문자 구분함 (하지만 퍼지 검색으로 보완)

### 📝 검색어 입력 관련
- **따옴표 사용**: 공백이 포함된 용어는 따옴표로 감싸기
  ```bash
  ./jq-cli.sh detail "Action Pipeline System"  # ✅
  ./jq-cli.sh detail Action Pipeline System    # ❌
  ```

### 🎯 검색 범위 이해
- **현재 데이터**: 97개 용어, 104개 별칭, 378개 키워드
- **업데이트**: `node generate-data.js`로 최신 데이터 생성

## 🔧 고급 사용자를 위한 직접 jq 쿼리

### 커스텀 검색 쿼리
```bash
# 특정 카테고리의 구현체가 많은 용어들
jq '.terms | to_entries[] | select(.value.category == "core-concepts" and (.value.implementations | length) > 3) | .value.title' glossary-data.json

# 특정 파일에 구현된 용어들 찾기
jq '.terms | to_entries[] | select(.value.implementations[]?.file | contains("ActionRegister")) | .value.title' glossary-data.json

# 관련 용어가 많은 용어들
jq '.terms | to_entries[] | select((.value.relatedTerms | length) > 2) | .value.title' glossary-data.json
```

## 📈 성능 최적화 팁

- **응답 시간**: 모든 명령어 < 100ms
- **병렬 검색**: 여러 카테고리를 동시에 확인하고 싶으면 터미널 탭 분할 활용
- **데이터 캐싱**: jq가 자동으로 효율적인 캐싱 처리

---

**💡 기억하세요**: 완벽한 용어명을 몰라도 됩니다! 부분적인 키워드나 한국어 별칭으로도 충분히 찾을 수 있습니다.

**🎯 궁금한 것이 있다면**: `./jq-cli.sh help`로 전체 명령어를 확인하거나 `./jq-cli.sh stats`로 현재 시스템 상태를 확인하세요.