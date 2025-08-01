# 용어집 도구 명세

## 🏗️ 시스템 구조

```
Source Code    →    Tools           →    Generated Docs
TypeScript          Scanner              implementations/
JavaScript     →    Validator       →    mappings.json
@implements         Generator            validation-report.json
```

## 🔧 주요 도구

### 1. glossary-scanner-v2.js
**목적**: JSDoc 태그 추출 및 매핑 데이터 생성

**입력**: TypeScript/JavaScript 파일  
**출력**: `docs/implementations/_data/mappings.json`

**기능**:
- comment-parser를 통한 JSDoc 파싱
- `@implements`, `@memberof` 태그 추출
- 용어 정규화 (kebab-case 변환)

### 2. glossary-validator-v2.js
**목적**: 매핑 일관성 검증

**검증 항목**:
- 용어 존재성: 모든 매핑 용어가 용어집에 정의되어 있는가
- 카테고리 유효성: 유효한 카테고리인가
- 중복 매핑: 동일한 구현이 여러 용어에 매핑되었는가

### 3. missing-analysis.js
**목적**: 양방향 미구현 분석

**분석 방향**:
- 용어집 → 코드: 정의되었지만 미구현된 용어들
- 코드 → 용어집: 참조되지만 미정의된 용어들

### 4. implementation-dashboard.js
**목적**: 구현 현황 대시보드 생성

**출력**:
- `docs/implementations/dashboard.md` (마크다운 대시보드)
- `docs/implementations/_data/dashboard.json` (JSON 데이터)

## 📊 매핑 데이터 구조

```json
{
  "terms": {
    "action-handler": [
      {
        "file": "example/src/hooks/useActionGuard.ts",
        "name": "useActionGuard", 
        "type": "function",
        "line": 25,
        "description": "액션 가드 훅",
        "implements": ["action-handler"],
        "memberOf": ["core-concepts"],
        "since": "1.0.0",
        "lastModified": "2025-08-01T05:35:10.890Z"
      }
    ]
  },
  "statistics": {
    "totalTerms": 40,
    "mappedTerms": 3,
    "implementationRate": 8
  }
}
```

## 🚀 사용법

```bash
# 개별 실행
pnpm glossary:scan      # 스캔
pnpm glossary:validate  # 검증
pnpm glossary:missing   # 미구현 분석
pnpm glossary:dashboard # 대시보드 생성

# 통합 실행 (권장)
pnpm glossary:update    # 모든 도구 순차 실행
```