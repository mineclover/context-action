# @context-action/glossary-query

> 신뢰도 있는 대용량 JSON 정보 조회 시스템

## 🚀 개요

Context-Action 프레임워크의 모든 용어와 구현체 정보를 **정보 누락 없이** 신뢰성 있게 조회할 수 있는 시스템입니다. 
대용량 JSON 환경에서 정보 분할의 명확성과 검색 결과의 완전성을 보장합니다.

## ✨ 주요 특징

- **🛡️ 신뢰도 100%**: 31개 테스트 시나리오 모두 통과
- **📊 완전성 보장**: 7단계 검증 시스템으로 정보 누락 방지
- **⚡ 초고속**: 모든 명령어 < 100ms 응답 (jq 네이티브 성능)
- **🧠 스마트 검색**: 4단계 검색 (정확한 매칭 → 별칭 → 퍼지 → 키워드)
- **🌐 한국어 지원**: 104개 한국어 별칭 및 약어 지원
- **🔧 유연한 CLI**: 인수 순서 무관, 직관적인 명령어 구조
- **📊 풍부한 데이터**: 97개 용어, 378개 키워드, 구현체 위치 정보

## 📋 전제 조건

### 1. jq 설치 (필수)
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq

# CentOS/RHEL
sudo yum install jq
```

### 2. 용어집 스캔 (선행 필수)
```bash
# 이 시스템을 실행하기 전에 반드시 용어집 스캔을 먼저 수행해야 합니다
cd ../../
pnpm glossary:scan

# 또는 직접 데이터 생성
cd packages/glossary-query
node generate-data.js
```

⚠️ **중요**: `glossary-data.json` 파일이 없으면 모든 조회 명령어가 실패합니다. 반드시 용어집 스캔을 먼저 실행하세요.

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

## 🛡️ 신뢰성 검증 시스템

대용량 JSON 환경에서 정보 누락을 방지하는 종합 검증 시스템:

### 자동화된 검증 도구
```bash
# 1. 데이터 무결성 검사 (100/100 점수)
node data-integrity-check.js

# 2. 검색 신뢰도 테스트 (31/31 통과)
node search-reliability-test.js

# 3. 정보 분할 품질 분석
node data-segmentation-analyzer.js

# 4. 정보 누락 방지 검증 (7단계)
node completeness-verifier.js
```

### 신뢰도 모니터링 지표
- **검색 커버리지**: 100% (모든 용어 검색 가능)
- **데이터 무결성**: 100/100 점수
- **검색 신뢰도**: 100% (31/31 테스트 통과)
- **관계 완전성**: 90.7% (대부분 용어가 관련 용어 보유)

## 📚 문서 가이드

핵심 문서:

| 문서 | 용도 | 대상 |
|------|------|------|
| **[RELIABILITY-GUIDELINES.md](./RELIABILITY-GUIDELINES.md)** | 신뢰도 있는 정보 검색 가이드 | 모든 사용자 |
| **[data-spec.md](./data-spec.md)** | JSON 구조 및 jq 쿼리 | 개발자 |

### 🎯 추천 학습 경로
1. **신뢰성 확보**: RELIABILITY-GUIDELINES.md 숙지
2. **기본 사용**: README 빠른 시작 섹션
3. **고급 사용**: data-spec.md에서 커스텀 jq 쿼리

## 📝 라이선스

MIT License

## 🤝 기여

Context-Action 프레임워크 프로젝트에 기여하려면 메인 저장소를 참조하세요.

---

**현재 버전**: v2.1 - 모든 주요 검색 문제 해결 완료 ✅