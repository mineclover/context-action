# Init Command Guide

LLMs Generator의 `init` 명령어는 프로젝트 문서 초기화를 위한 통합 워크플로를 제공합니다. 하나의 명령어로 전체 프로젝트를 설정하고 문서 템플릿을 생성할 수 있습니다.

## 개요

`init` 명령어는 다음 3단계를 자동으로 실행합니다:

1. **📚 Document Discovery**: 프로젝트의 모든 마크다운 문서 검색
2. **📊 Priority JSON Generation**: 각 문서의 우선순위 및 메타데이터 생성
3. **📝 Template Creation**: 문자 제한별 요약 템플릿 생성

## 기본 사용법

```bash
# 기본 실행 (전체 초기화)
npx @context-action/llms-generator init

# 미리보기 (실제 파일 생성 없음)
npx @context-action/llms-generator init --dry-run

# 조용한 모드 (최소 출력)
npx @context-action/llms-generator init --quiet

# 기존 파일 덮어쓰기
npx @context-action/llms-generator init --overwrite
```

## Config 기반 동작

`init` 명령어는 `llms-generator.config.json` 파일의 설정을 자동으로 읽어서 실행됩니다:

```json
{
  "paths": {
    "docsDir": "./docs",
    "llmContentDir": "./data",
    "outputDir": "./docs/llms"
  },
  "generation": {
    "supportedLanguages": ["en", "ko"],
    "characterLimits": [100, 200, 300, 500, 1000, 2000, 5000],
    "defaultLanguage": "en"
  },
  "categories": {
    "guide": { "priority": 95 },
    "api": { "priority": 90 },
    "concept": { "priority": 85 },
    "examples": { "priority": 80 }
  }
}
```

## 실행 단계별 상세

### 1단계: Document Discovery 📚

```bash
🔍 Step 1: Document Discovery
  📚 Discovering en documents...
     Found 102 documents
     - api: 87 docs
     - concept: 5 docs
     - example: 4 docs
     - guide: 6 docs
  📚 Discovering ko documents...
     Found 26 documents
     - api: 11 docs
     - concept: 5 docs
     - example: 4 docs
     - guide: 6 docs
   ✅ Discovery completed
```

**수행 작업:**
- `docsDir`에서 모든 `.md` 파일 스캔
- 카테고리별 분류 (guide, api, concept, examples)
- 언어별 문서 개수 집계
- 파일 크기 및 메타데이터 수집

### 2단계: Priority JSON Generation 📊

```bash
📊 Step 2: Priority JSON Generation
  🏷️  Generating priority files for en...
📝 Generating priority for: api--action-only
✅ Generated: /path/to/data/en/api--action-only/priority.json
     Generated: 102
     Skipped: 0
```

**수행 작업:**
- 각 문서마다 `priority.json` 파일 생성
- 카테고리 기반 우선순위 점수 할당
- 문서 메타데이터 및 키워드 추출
- 문자 제한별 추출 전략 설정

**생성되는 Priority JSON 구조:**
```json
{
  "document": {
    "id": "api--action-only",
    "title": "Action Only Methods",
    "source_path": "en/api/action-only.md",
    "category": "api"
  },
  "priority": {
    "score": 90,
    "tier": "high",
    "rationale": "API documentation with high user value"
  },
  "extraction": {
    "strategy": "api-first",
    "character_limits": {
      "100": { "focus": "Primary functionality" },
      "300": { "focus": "Practical understanding" },
      "1000": { "focus": "Comprehensive coverage" }
    }
  }
}
```

### 3단계: Template Creation 📝

```bash
📝 Step 3: Template Generation
  📋 Generating individual summary templates...
✅ Generated templates for /path/to/data/en/api--action-only/priority.json
   ✅ Template generation completed
```

**수행 작업:**
- 각 문서의 `priority.json` 기반으로 템플릿 생성
- `characterLimits` 설정에 따라 다중 버전 생성
- 작성 가이드라인 및 키워드 정보 포함

**생성되는 템플릿 파일 예시:**
```
data/en/api--action-only/
├── priority.json
├── api--action-only-100.md    # 100자 요약 템플릿
├── api--action-only-200.md    # 200자 요약 템플릿
├── api--action-only-300.md    # 300자 요약 템플릿
├── api--action-only-500.md    # 500자 요약 템플릿
├── api--action-only-1000.md   # 1000자 요약 템플릿
├── api--action-only-2000.md   # 2000자 요약 템플릿
└── api--action-only-5000.md   # 5000자 요약 템플릿
```

## 고급 옵션

### 단계별 건너뛰기

```bash
# Discovery 단계 건너뛰기
npx @context-action/llms-generator init --skip-discovery

# Priority 생성 건너뛰기  
npx @context-action/llms-generator init --skip-priority

# Template 생성 건너뛰기
npx @context-action/llms-generator init --skip-templates

# 여러 단계 조합
npx @context-action/llms-generator init --skip-discovery --skip-priority
```

### 출력 제어

```bash
# 자세한 출력 (기본값)
npx @context-action/llms-generator init

# 최소 출력
npx @context-action/llms-generator init --quiet

# 미리보기 모드
npx @context-action/llms-generator init --dry-run

# 미리보기 + 조용한 모드
npx @context-action/llms-generator init --dry-run --quiet
```

## 생성되는 파일 구조

완전한 `init` 실행 후 생성되는 구조:

```
project-root/
├── llms-generator.config.json          # 설정 파일
└── data/                               # llmContentDir
    ├── en/                             # supportedLanguages[0]
    │   ├── guide--getting-started/
    │   │   ├── priority.json
    │   │   ├── guide--getting-started-100.md
    │   │   ├── guide--getting-started-200.md
    │   │   ├── guide--getting-started-300.md
    │   │   ├── guide--getting-started-500.md
    │   │   ├── guide--getting-started-1000.md
    │   │   ├── guide--getting-started-2000.md
    │   │   └── guide--getting-started-5000.md
    │   ├── api--action-only/
    │   │   └── ... (동일한 구조)
    │   └── ... (기타 문서들)
    └── ko/                             # supportedLanguages[1]
        └── ... (한국어 문서 구조)
```

## 통계 정보

실제 프로젝트에서의 `init` 실행 결과:

```bash
🎉 Project initialization completed successfully!
📋 Summary:
┌─────────────────────────────────────────┐
│  Component           Status              │
├─────────────────────────────────────────┤
│  📚 Document Discovery   ✅ Completed     │
│  📊 Priority Generation  ✅ Completed     │
│  📝 Template Creation    ✅ Completed     │
└─────────────────────────────────────────┘

📁 Output Structure:
data/
├── en/                 # 102개 문서
│   ├── document-id/
│   │   ├── priority.json
│   │   ├── 100chars.md
│   │   └── ... (7개 템플릿)
└── ko/                 # 26개 문서
    └── (동일한 구조)

🚀 Next Steps:
  1. Review generated priority.json files
  2. Edit summary templates (*.md files) as needed
  3. Run `simple-llms-batch` to generate final LLMS files
  4. Use work-status commands to track progress
```

**생성된 파일 개수:**
- Priority JSON: 128개 (102 + 26)
- 템플릿 파일: 896개 (128 × 7)
- **총 1,024개 파일 생성**

## 다음 단계

`init` 명령어 완료 후 수행할 작업:

### 1. 템플릿 편집
각 템플릿 파일의 내용을 실제 요약으로 작성:

```markdown
## 템플릿 내용 (100자 이내)

```markdown
<!-- 여기에 100자 이내의 요약 내용을 작성하세요 -->

Action Only Pattern은 순수 액션 디스패칭을 위한 패턴으로, 상태 관리 없이 이벤트 처리에 특화된 Context-Action 기능입니다.
```
```

### 2. 최종 LLMS 파일 생성
편집이 완료된 템플릿들을 통합:

```bash
# 모든 언어와 문자 제한으로 LLMS 파일 생성
npx @context-action/llms-generator simple-llms-batch

# 특정 언어만
npx @context-action/llms-generator simple-llms-batch --language en

# 특정 문자 제한만  
npx @context-action/llms-generator simple-llms-batch --character-limits 100,300,1000
```

### 3. 작업 상태 추적
진행 상황 모니터링:

```bash
# 전체 작업 상태 확인
npx @context-action/llms-generator work-check

# 특정 언어의 작업 상태
npx @context-action/llms-generator work-status ko

# 편집이 필요한 문서 목록
npx @context-action/llms-generator work-list en --missing
```

## 문제 해결

### 일반적인 이슈

**스키마 파일 찾을 수 없음:**
```bash
❌ Priority schema not found: /path/to/priority-schema-enhanced.json
```
**해결책:** 스키마 파일이 올바른 위치에 있는지 확인하거나 `--skip-priority`로 우회

**권한 오류:**
```bash
❌ EACCES: permission denied, mkdir '/path/to/data'
```
**해결책:** 출력 디렉토리에 대한 쓰기 권한 확인

**Config 파일 문제:**
```bash
📋 Loading legacy config
```
**해결책:** `llms-generator.config.json` 파일이 프로젝트 루트에 있는지 확인

### 부분적 실행

특정 단계만 다시 실행하려면:

```bash
# Priority JSON만 다시 생성
npx @context-action/llms-generator priority-generate en --overwrite

# 템플릿만 다시 생성
npx @context-action/llms-generator template-generate
```

## 성능 최적화

### 대용량 프로젝트

문서가 많은 프로젝트의 경우:

```bash
# 단계별 실행으로 메모리 절약
npx @context-action/llms-generator init --skip-templates
npx @context-action/llms-generator template-generate

# 언어별 분할 실행
npx @context-action/llms-generator priority-generate en
npx @context-action/llms-generator priority-generate ko
```

### 메모리 사용량

- **작은 프로젝트** (<50 문서): ~100MB
- **중간 프로젝트** (50-200 문서): ~300MB  
- **큰 프로젝트** (200+ 문서): ~500MB+

## 통합 워크플로

전체 문서 생성 워크플로:

```bash
# 1. 프로젝트 초기화
npx @context-action/llms-generator init

# 2. 템플릿 편집 (수동 작업)
# - data/{lang}/{doc-id}/*.md 파일들 편집

# 3. 최종 LLMS 생성
npx @context-action/llms-generator simple-llms-batch

# 4. 결과 확인
ls docs/llms/
# ├── llms-100chars-en.txt
# ├── llms-100chars-ko.txt
# ├── llms-200chars-en.txt
# └── ...
```

이로써 단일 `init` 명령어로 전체 프로젝트를 완전히 초기화하고, 구조화된 문서 작업 환경을 구축할 수 있습니다.