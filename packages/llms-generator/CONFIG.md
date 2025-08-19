# LLMS Generator Configuration Guide

## 개요

`llms-generator.config.json`은 LLMS Generator의 핵심 설정 파일로, 콘텐츠 생성의 모든 측면을 제어합니다.

## 파일 위치

프로젝트 루트에 `llms-generator.config.json` 파일을 배치합니다.

```
project-root/
├── llms-generator.config.json  # ← 메인 설정 파일
├── packages/
│   └── llms-generator/
│       └── data/
│           └── config-schema.json  # ← JSON 스키마
└── docs/
```

## 설정 구조

### 기본 구조

```json
{
  "$schema": "packages/llms-generator/data/config-schema.json",
  "paths": { ... },
  "generation": { ... },
  "quality": { ... },
  "categories": { ... },
  "tags": { ... },
  "extraction": { ... }
}
```

## 섹션별 상세 설명

### 1. 경로 설정 (`paths`)

시스템에서 사용할 디렉토리 경로를 지정합니다.

```json
{
  "paths": {
    "docsDir": "./docs",                           // 원본 문서 디렉토리
    "llmContentDir": "./packages/llms-generator/data",  // 생성된 데이터 저장소
    "outputDir": "./docs/llms",                    // 최종 출력 디렉토리
    "templatesDir": "./packages/llms-generator/templates",     // 템플릿 디렉토리
    "instructionsDir": "./packages/llms-generator/instructions" // 지침 디렉토리
  }
}
```

#### 필수 필드
- `docsDir`: 원본 문서가 위치한 디렉토리
- `outputDir`: 최종 생성물이 저장될 디렉토리

#### 선택 필드
- `llmContentDir`: Priority JSON 및 요약 템플릿이 저장되는 디렉토리
- `templatesDir`: 문서 템플릿들이 저장되는 디렉토리  
- `instructionsDir`: 생성 지침이 저장되는 디렉토리

### 2. 생성 설정 (`generation`)

콘텐츠 생성의 기본 파라미터를 설정합니다.

```json
{
  "generation": {
    "supportedLanguages": ["ko", "en"],           // 지원 언어
    "characterLimits": [100, 300, 1000, 2000],   // 문자 수 제한
    "defaultLanguage": "ko",                      // 기본 언어
    "outputFormat": "txt"                         // 출력 포맷
  }
}
```

#### 지원 언어
- `ko`: 한국어
- `en`: 영어
- `ja`: 일본어
- `zh`: 중국어
- `es`: 스페인어
- `fr`: 프랑스어
- `de`: 독일어

#### 문자 수 제한
각 문자 수 제한별로 요약 문서가 생성됩니다:
- `100`: 핵심 개념만
- `300`: 기본 설명 + 목적
- `1000`: 실용적 이해를 위한 상세 설명
- `2000`: 코드 예시 포함 종합 가이드

#### 출력 포맷
- `txt`: 일반 텍스트 (기본값)
- `md`: 마크다운
- `html`: HTML
- `json`: JSON

### 3. 품질 설정 (`quality`)

생성 품질 관련 임계값과 검증 옵션을 설정합니다.

```json
{
  "quality": {
    "minCompletenessThreshold": 0.8,  // 최소 완성도 (0.0-1.0)
    "enableValidation": true,          // 검증 활성화
    "strictMode": false                // 엄격 모드
  }
}
```

### 4. 카테고리 설정 (`categories`)

문서 카테고리별 특성과 우선순위를 정의합니다.

```json
{
  "categories": {
    "guide": {
      "name": "가이드",
      "description": "사용자 가이드 및 튜토리얼",
      "priority": 90,                              // 우선순위 (1-100)
      "defaultStrategy": "tutorial-first",         // 기본 전략
      "tags": ["beginner", "step-by-step", "practical"],
      "color": "#28a745",                          // 표시 색상
      "icon": "📖"                                 // 표시 아이콘
    }
  }
}
```

#### 내장 카테고리
- `guide`: 가이드 (우선순위: 90)
- `api`: API 참조 (우선순위: 85)
- `concept`: 개념 설명 (우선순위: 80)
- `example`: 예제 코드 (우선순위: 75)
- `reference`: 참조 자료 (우선순위: 70)

#### 추출 전략
- `tutorial-first`: 단계 → 예시 → 개념 → 참조
- `api-first`: 시그니처 → 파라미터 → 예시 → 개념
- `concept-first`: 정의 → 원리 → 예시 → 응용
- `example-first`: 코드 → 사용법 → 설명 → 개념
- `reference-first`: 완전한 정보 → 세부사항 → 예시 → 맥락

### 5. 태그 설정 (`tags`)

콘텐츠 분류를 위한 태그 시스템을 정의합니다.

```json
{
  "tags": {
    "beginner": {
      "name": "초보자",
      "description": "초보자를 위한 콘텐츠", 
      "weight": 1.2,                              // 가중치 (0.1-3.0)
      "compatibleWith": ["step-by-step", "practical", "tutorial"],
      "audience": ["new-users", "learners"]       // 대상 독자
    }
  }
}
```

#### 내장 태그
- `beginner`: 초보자용 (가중치: 1.2)
- `intermediate`: 중급자용 (가중치: 1.0)
- `advanced`: 고급자용 (가중치: 0.9)
- `core`: 핵심 기능 (가중치: 1.5)
- `optional`: 선택사항 (가중치: 0.7)
- `quick-start`: 빠른 시작 (가중치: 1.3)
- `troubleshooting`: 문제 해결 (가중치: 1.1)

#### 대상 독자
- `new-users`: 신규 사용자
- `learners`: 학습자
- `experienced-users`: 숙련된 사용자
- `experts`: 전문가
- `contributors`: 기여자
- `all-users`: 모든 사용자

### 6. 추출 설정 (`extraction`)

콘텐츠 추출 방식과 품질 기준을 설정합니다.

```json
{
  "extraction": {
    "defaultQualityThreshold": 0.8,   // 기본 품질 임계값
    "strategies": {
      "tutorial-first": {
        "focusOrder": ["steps", "examples", "concepts", "references"]
      }
    }
  }
}
```

## 사용 예제

### 최소 설정

```json
{
  "$schema": "packages/llms-generator/data/config-schema.json",
  "paths": {
    "docsDir": "./docs",
    "outputDir": "./docs/llms"
  },
  "generation": {
    "supportedLanguages": ["en"],
    "characterLimits": [300, 1000]
  }
}
```

### 다국어 프로젝트 설정

```json
{
  "$schema": "packages/llms-generator/data/config-schema.json",
  "paths": {
    "docsDir": "./docs",
    "llmContentDir": "./data/llms",
    "outputDir": "./dist/llms"
  },
  "generation": {
    "supportedLanguages": ["ko", "en", "ja"],
    "characterLimits": [100, 300, 1000, 2000],
    "defaultLanguage": "en"
  },
  "quality": {
    "minCompletenessThreshold": 0.9,
    "strictMode": true
  }
}
```

## CLI 연동

### 설정 검증

```bash
# 현재 설정 확인
npx llms-generator config-show

# 설정 유효성 검사
npx llms-generator config-validate
```

### 설정 초기화

```bash
# 표준 설정으로 초기화
npx llms-generator config-init standard

# 최소 설정으로 초기화  
npx llms-generator config-init minimal

# 확장 설정으로 초기화
npx llms-generator config-init extended
```

## 스키마 검증

JSON 스키마를 통한 자동 검증이 지원됩니다:

```json
{
  "$schema": "packages/llms-generator/data/config-schema.json"
}
```

IDE에서 자동 완성과 유효성 검사를 제공합니다.

## 마이그레이션 가이드

### v0.1.x → v0.2.x

1. **구조 변경**: `characterLimits`와 `languages`가 `generation` 섹션으로 이동
2. **경로 변경**: `dataDir` → `llmContentDir`로 변경
3. **새로운 필드**: `templatesDir`, `instructionsDir` 추가

```bash
# 기존 설정 백업
cp llms-generator.config.json llms-generator.config.json.bak

# 새 설정으로 초기화
npx llms-generator config-init standard

# 기존 설정값 수동 복사
```

## 문제 해결

### 자주 발생하는 오류

1. **"Property llmContentDir is not allowed"**
   - 스키마가 최신 버전인지 확인
   - `$schema` 필드가 올바른 경로를 가리키는지 확인

2. **"Configuration is invalid"**
   - `npx llms-generator config-validate` 실행
   - 필수 필드가 누락되었는지 확인

3. **경로 관련 오류**
   - 모든 경로가 프로젝트 루트에서 상대 경로로 올바르게 설정되었는지 확인
   - 디렉토리가 실제로 존재하는지 확인

### 디버깅

```bash
# 설정 파일 검증
npx llms-generator config-validate

# 상세한 설정 정보 확인
npx llms-generator config-show

# 스키마 정보 확인  
npx llms-generator help config
```

## 참고 자료

- [JSON Schema 공식 문서](https://json-schema.org/)
- [LLMS Generator CLI 참조](./CLI.md)
- [API 문서](./API.md)