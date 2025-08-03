# jq 기반 정보 조회를 위한 JSON 스펙 설계

## 기본 원칙
1. **단순하고 예측 가능한 구조**: jq 쿼리 작성이 쉽도록
2. **카테고리 기반 분류**: 계층적 데이터 조회 지원
3. **키 기반 인덱싱**: O(1) 조회 성능
4. **메타데이터 포함**: 검색 없이도 충분한 정보 제공

## JSON 구조

```json
{
  "metadata": {
    "version": "1.0.0",
    "generated": "2025-08-03T12:00:00Z",
    "totalTerms": 97,
    "categories": ["core-concepts", "api-terms", "architecture-terms", "naming-conventions", "validation"]
  },
  "categories": {
    "core-concepts": {
      "name": "Core Concepts",
      "description": "Fundamental framework concepts",
      "termCount": 20,
      "terms": ["action-pipeline-system", "store-integration-pattern", ...]
    },
    "api-terms": {
      "name": "API Terms", 
      "description": "Public API interfaces and types",
      "termCount": 37,
      "terms": ["action-dispatcher", "action-events", ...]
    }
  },
  "terms": {
    "action-pipeline-system": {
      "id": "action-pipeline-system",
      "title": "Action Pipeline System",
      "category": "core-concepts",
      "definition": "The central orchestration system...",
      "keywords": ["action", "pipeline", "dispatch", "handler"],
      "aliases": ["액션 파이프라인", "pipeline system"],
      "implementations": [
        {
          "name": "ActionRegister",
          "file": "packages/core/src/ActionRegister.ts",
          "line": 15,
          "type": "class"
        }
      ],
      "relatedTerms": ["action-handler", "pipeline-controller"],
      "examples": ["// Example usage..."],
      "since": "1.0.0",
      "lastModified": "2025-08-02T16:30:24.794Z"
    }
  },
  "index": {
    "byKeyword": {
      "action": ["action-pipeline-system", "action-handler", "action-events"],
      "store": ["store-integration-pattern", "store-registry"],
      "pipeline": ["action-pipeline-system", "pipeline-controller"]
    },
    "byAlias": {
      "액션": "action-pipeline-system",
      "스토어": "store-integration-pattern"
    }
  }
}
```

## jq 쿼리 예시

### 카테고리 조회
```bash
# 모든 카테고리 목록
jq '.categories | keys[]' data.json

# 특정 카테고리 정보
jq '.categories["core-concepts"]' data.json

# 카테고리별 용어 개수
jq '.categories | to_entries | map({category: .key, count: .value.termCount})' data.json
```

### 용어 목록 조회
```bash
# 특정 카테고리의 모든 용어
jq '.categories["core-concepts"].terms[]' data.json

# 용어 제목만 조회
jq '.categories["core-concepts"].terms[] as $id | .terms[$id].title' data.json

# 제한된 개수로 조회
jq '.categories["core-concepts"].terms[:5]' data.json
```

### 상세 정보 조회
```bash
# 특정 용어 상세 정보
jq '.terms["action-pipeline-system"]' data.json

# 용어의 구현체만 조회
jq '.terms["action-pipeline-system"].implementations' data.json

# 관련 용어들의 제목
jq '.terms["action-pipeline-system"].relatedTerms[] as $id | .terms[$id].title' data.json
```

### 키워드 기반 조회
```bash
# 특정 키워드로 용어 찾기
jq '.index.byKeyword["action"]' data.json

# 키워드로 찾은 용어들의 상세 정보
jq '.index.byKeyword["action"][] as $id | .terms[$id]' data.json

# 별칭으로 용어 찾기
jq '.index.byAlias["액션"] as $id | .terms[$id]' data.json
```

## 장점
1. **성능**: 인덱스 기반 O(1) 조회
2. **단순성**: 복잡한 검색 알고리즘 불필요
3. **투명성**: 데이터 구조가 명확하고 예측 가능
4. **확장성**: 새로운 메타데이터 쉽게 추가 가능
5. **표준성**: JSON + jq 표준 도구 활용