# 빠른 참조 가이드

## 🚀 30초 시작하기

```bash
./jq-cli.sh categories                    # 카테고리 보기
./jq-cli.sh list core-concepts            # 핵심 개념들
./jq-cli.sh detail "Action Pipeline System"  # 상세 정보
```

## 📋 주요 명령어

| 명령어 | 설명 | 예시 |
|--------|------|------|
| `categories` | 카테고리 목록 | `./jq-cli.sh categories` |
| `list` | 용어 목록 | `./jq-cli.sh list core-concepts` |
| `list --limit N` | 제한된 개수 | `./jq-cli.sh list --limit 5` |
| `detail` | 상세 정보 | `./jq-cli.sh detail "Action Handler"` |
| `keyword` | 키워드 검색 | `./jq-cli.sh keyword action` |
| `alias` | 별칭 검색 | `./jq-cli.sh alias "액션 핸들러"` |
| `stats` | 시스템 통계 | `./jq-cli.sh stats` |

## 🎯 카테고리별 주요 용어

### Core Concepts (핵심 개념)
```bash
./jq-cli.sh list core-concepts
```
- `Action Pipeline System` - 전체 액션 처리 시스템
- `Store Integration Pattern` - 스토어 연결 패턴
- `Action Handler` - 액션 처리 함수
- `Pipeline Controller` - 파이프라인 제어

### API Terms (API 용어)
```bash
./jq-cli.sh list api-terms
```
- `useActionDispatch` - 액션 디스패치 훅
- `ActionProvider` - 액션 컨텍스트 프로바이더
- `StoreProvider` - 스토어 컨텍스트 프로바이더
- `useStoreValue` - 스토어 값 구독 훅

### Architecture Terms (아키텍처)
```bash
./jq-cli.sh list architecture-terms
```
- `MVVM Pattern` - MVVM 아키텍처 패턴
- `Context Store Pattern` - 컨텍스트 스토어 패턴
- `Provider Pattern` - 프로바이더 패턴

## 🔍 검색 전략

### 1. 정확한 이름을 알 때
```bash
./jq-cli.sh detail "Action Pipeline System"
```

### 2. 부분만 기억할 때
```bash
./jq-cli.sh detail "pipeline"    # "Pipeline Context" 찾음
./jq-cli.sh detail "store"       # "StoreProvider" 찾음
```

### 3. 한국어로 알 때
```bash
./jq-cli.sh alias "액션 핸들러"       # Action Handler
./jq-cli.sh alias "스토어 레지스트리"  # Store Registry
```

### 4. 약어로 알 때
```bash
./jq-cli.sh alias "APS"          # Action Pipeline System
```

### 5. 관련 용어 찾을 때
```bash
./jq-cli.sh keyword action       # action 관련 모든 용어
./jq-cli.sh keyword store        # store 관련 모든 용어
```

## 📊 현재 데이터

- **97개** 용어
- **5개** 카테고리
- **378개** 키워드
- **104개** 별칭

## ⚡ 성능

- 모든 명령어 **< 100ms**
- jq 네이티브 성능 활용

## 🔧 유지보수

```bash
node generate-data.js    # 데이터 재생성
./check-dependencies.sh  # 의존성 확인
```

## 💡 팁

1. **카테고리부터 시작** - 영역을 먼저 파악
2. **키워드 활용** - 정확한 이름 몰라도 OK
3. **한국어 별칭** - 한국어로도 검색 가능
4. **부분 검색** - 핵심 단어만으로도 찾기 가능
5. **관련 용어 활용** - 하나에서 시작해서 확장