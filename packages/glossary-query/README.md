# @context-action/glossary-query

> jq 기반 고성능 Context-Action 프레임워크 용어집 정보 조회 시스템

## 🚀 개요

Context-Action 프레임워크의 모든 용어와 구현체 정보를 빠르고 정확하게 조회할 수 있는 시스템입니다. 
**jq**라는 표준 도구를 활용하여 복잡한 검색 엔진 없이도 강력한 정보 조회 기능을 제공합니다.

## ✨ 주요 특징

- **⚡ 초고속**: 모든 명령어 < 100ms 응답 (jq 네이티브 성능)
- **🧠 스마트 검색**: 4단계 검색 (정확한 매칭 → 별칭 → 퍼지 → 키워드)
- **🌐 한국어 지원**: 104개 한국어 별칭 및 약어 지원
- **🔧 유연한 CLI**: 인수 순서 무관, 직관적인 명령어 구조
- **📊 풍부한 데이터**: 97개 용어, 378개 키워드, 구현체 위치 정보

## 📋 전제 조건

### jq 설치
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq

# CentOS/RHEL
sudo yum install jq
```

## 🚀 빠른 시작

### 30초 만에 찾기
```bash
# 1단계: 카테고리 확인 (3초)
./jq-cli.sh categories

# 2단계: 관심 영역 탐색 (5초)  
./jq-cli.sh list core-concepts

# 3단계: 구체적 정보 확인 (2초)
./jq-cli.sh detail "Action Pipeline System"
```

### 🌟 새로운 기능들 (v2.1)
```bash
# ✅ 유연한 CLI - 순서 무관
./jq-cli.sh list --limit 5              # 전체에서 5개
./jq-cli.sh list core-concepts --limit 3 # 카테고리에서 3개

# ✅ 한국어 별칭 지원
./jq-cli.sh alias "액션 핸들러"           # Action Handler
./jq-cli.sh alias "APS"                  # Action Pipeline System

# ✅ 스마트 퍼지 검색
./jq-cli.sh detail "pipeline"           # "Pipeline Context" 자동 매칭
./jq-cli.sh detail "store"              # "StoreProvider" 자동 매칭
```

## 📖 사용법

### 기본 명령어

```bash
# 카테고리 목록
./jq-cli.sh categories

# 용어 목록 (기본 10개)
./jq-cli.sh list

# 특정 카테고리 용어들
./jq-cli.sh list <카테고리>

# 용어 상세 정보
./jq-cli.sh detail <용어명>

# 키워드로 검색
./jq-cli.sh keyword <키워드>

# 별칭으로 검색
./jq-cli.sh alias <별칭>

# 시스템 통계
./jq-cli.sh stats
```

### 추천 워크플로우

```bash
# 1단계: 어떤 카테고리가 있는지 확인
./jq-cli.sh categories

# 2단계: 관심 있는 카테고리의 용어들 보기
./jq-cli.sh list core-concepts

# 3단계: 특정 용어의 상세 정보 보기
./jq-cli.sh detail "Action Pipeline System"
```

## 📊 데이터 구조

### JSON 스펙
```json
{
  "metadata": {
    "version": "1.0.0",
    "totalTerms": 97,
    "categories": ["core-concepts", "api-terms", ...]
  },
  "categories": {
    "core-concepts": {
      "name": "Core Concepts",
      "termCount": 20,
      "terms": ["action-pipeline-system", ...]
    }
  },
  "terms": {
    "action-pipeline-system": {
      "title": "Action Pipeline System",
      "category": "core-concepts",
      "definition": "...",
      "implementations": [...],
      "relatedTerms": [...]
    }
  },
  "index": {
    "byKeyword": {
      "action": ["action-pipeline-system", ...]
    },
    "byAlias": {
      "액션": "action-pipeline-system"
    }
  }
}
```

### 직접 jq 쿼리 사용

```bash
# 모든 카테고리 목록
jq '.categories | keys[]' glossary-data.json

# 특정 카테고리의 용어 개수
jq '.categories["core-concepts"].termCount' glossary-data.json

# 특정 용어의 구현체 목록
jq '.terms["action-pipeline-system"].implementations' glossary-data.json

# 키워드로 용어 찾기
jq '.index.byKeyword["action"]' glossary-data.json
```

## 🔧 개발

### 데이터 생성
```bash
# 최신 용어집 데이터로 JSON 재생성
node generate-data.js
```

### 패키지 스크립트
```bash
# 데이터 생성
npm run build

# CLI 실행
npm run query -- categories

# 시스템 테스트
npm test

# 도움말
npm run help
```

## 📈 성능

- **응답 시간**: < 100ms (모든 명령어)
- **데이터 크기**: ~120KB (97개 용어, 104개 별칭)
- **메모리 사용량**: 최소 (jq 스트리밍)
- **검색 성공률**: 95%+ (4단계 스마트 검색)

## 🆚 기존 시스템과의 비교

| 항목 | 기존 검색 시스템 | jq 기반 시스템 |
|------|------------------|----------------|
| **복잡도** | 28파일, 5000+ 라인 | 3파일, 500 라인 |
| **의존성** | TypeScript, 빌드 시스템 | jq만 필요 |
| **성능** | ~7ms 초기화 | ~0ms (jq 네이티브) |
| **투명성** | 복잡한 알고리즘 | 명확한 JSON 구조 |
| **유지보수** | 높은 복잡도 | 단순한 구조 |

## 🎯 설계 철학

1. **단순함 > 복잡함**: 복잡한 검색 대신 명확한 정보 조회
2. **표준 도구 활용**: jq라는 검증된 도구 사용
3. **투명한 데이터**: 예측 가능한 JSON 구조
4. **성능 최적화**: 인덱스 기반 O(1) 조회
5. **사용자 친화적**: 직관적인 CLI 워크플로우

## 📚 문서 가이드

상황에 맞는 문서를 선택하세요:

| 문서 | 용도 | 대상 |
|------|------|------|
| **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** | 빠른 명령어 참조 | 모든 사용자 |
| **[SEARCH-GUIDE.md](./SEARCH-GUIDE.md)** | 상세한 검색 전략 | 신규 사용자 |
| **[USAGE.md](./USAGE.md)** | 완전한 사용법 가이드 | 심화 사용자 |
| **[data-spec.md](./data-spec.md)** | JSON 구조 및 jq 쿼리 | 개발자 |
| **[DEPENDENCIES.md](./DEPENDENCIES.md)** | 의존성 정보 | 관리자 |
| **[TEST-SCENARIOS.md](./TEST-SCENARIOS.md)** | 테스트 결과 및 성능 | QA/개발자 |

### 🎯 추천 학습 경로
1. **처음 사용**: QUICK-REFERENCE.md → 실제 사용
2. **본격 활용**: SEARCH-GUIDE.md → USAGE.md  
3. **고급 사용**: data-spec.md에서 커스텀 jq 쿼리

## 📝 라이선스

MIT License

## 🤝 기여

Context-Action 프레임워크 프로젝트에 기여하려면 메인 저장소를 참조하세요.

---

**현재 버전**: v2.1 - 모든 주요 검색 문제 해결 완료 ✅