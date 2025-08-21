# Init Command Guide - 2024 Updated

> **⚠️ 중요**: 이 문서는 2024년 최신 구현을 기준으로 작성되었습니다. 기존 npx 방식이 아닌 CLI 빌드 후 실행 방식을 사용합니다.

LLMs Generator의 `init` 명령어는 프로젝트 문서 초기화를 위한 통합 워크플로를 제공합니다. 하나의 명령어로 전체 프로젝트를 설정하고 문서 템플릿을 생성할 수 있습니다.

## 개요

`init` 명령어는 다음 2단계를 자동으로 실행합니다:

1. **📊 Priority JSON Generation**: 각 문서의 우선순위 및 메타데이터 생성
2. **📝 Template Creation**: 문자 제한별 요약 템플릿 생성

## 기본 사용법

### CLI 설치 및 실행

**방법 1: NPM 글로벌 설치 (권장)**
```bash
# 전 세계 어디서든 설치 가능
npm i -g @context-action/llms-generator

# 실행
llms init
```

**방법 2: 로컬 개발**
```bash
# 1. 빌드 및 설치
cd packages/llms-generator
pnpm build
npm pack
npm i -g ./context-action-llms-generator-0.3.0.tgz

# 2. 실행
llms init
```

**방법 3: pnpm 스크립트 (프로젝트 루트에서)**
```bash
pnpm llms:init
```

**방법 4: 직접 실행 (개발용)**
```bash
node packages/llms-generator/dist/cli/index.js init
```

### 기본 옵션
```bash
# 미리보기 (실제 파일 생성 없음)
llms init --dry-run

# 조용한 모드 (최소 출력)
llms init --quiet

# 기존 파일 덮어쓰기
llms init --overwrite

# 특정 언어만
llms init --language en
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

### 1단계: Priority JSON Generation 📊

```bash
📊 Step 1: Creating priority.json files for all documents
   ✅ Created: 102 priority.json files
   ⏭️  Skipped: 0 (already exist)
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

### 2단계: Template Creation 📝

```bash
📝 Step 2: Generating templates from priority.json files
   ✅ Templates created: 714
   ⏭️  Templates skipped: 0
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
# Priority 생성 건너뛰기
llms init --skip-priority

# Template 생성 건너뛰기
llms init --skip-templates

# 특정 언어만 처리
llms init --language en
```

### 출력 제어

```bash
# 자세한 출력 (기본값)
llms init

# 최소 출력
llms init --quiet

# 미리보기 모드
llms init --dry-run

# 미리보기 + 조용한 모드
llms init --dry-run --quiet
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
📊 Initialization Summary:
   📋 Priority files: 102
   📝 Template files: 714

✨ Project initialization completed!

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
# 다중 LLMS 파일 생성 (origin, minimal, 500chars)
llms clean-llms-generate --language en

# 또는 pnpm 스크립트 사용
pnpm llms:generate:en
pnpm llms:generate:ko

# 특정 문자 제한만
llms clean-llms-generate 1000 --language en
```

### 3. 작업 상태 추적
진행 상황 모니터링:

```bash
# 우선순위 기반 다음 작업 확인
llms work-next --language en

# 상위 10개 우선순위 작업 확인
llms work-next --limit 10 --language en

# 또는 pnpm 스크립트 사용
pnpm llms:work-next
pnpm llms:work-top10
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
# 템플릿만 다시 생성
llms generate-templates --language en --overwrite

# 또는 pnpm 스크립트 사용
pnpm llms:generate-templates
```

## 성능 최적화

### 대용량 프로젝트

문서가 많은 프로젝트의 경우:

```bash
# 단계별 실행으로 메모리 절약
llms init --skip-templates
llms generate-templates

# 언어별 분할 실행
llms init --language en
llms init --language ko
```

### 메모리 사용량

- **작은 프로젝트** (<50 문서): ~100MB
- **중간 프로젝트** (50-200 문서): ~300MB  
- **큰 프로젝트** (200+ 문서): ~500MB+

## 통합 워크플로

전체 문서 생성 워크플로:

```bash
# 1. CLI 빌드
pnpm build:llms-generator

# 2. 프로젝트 초기화
llms init
# 또는: pnpm llms:init

# 3. 템플릿 편집 (수동 작업)
# - llmsData/{lang}/{doc-id}/*.md 파일들 편집

# 4. 최종 LLMS 생성
llms clean-llms-generate --language en
llms clean-llms-generate --language ko
# 또는: pnpm llms:generate:en && pnpm llms:generate:ko

# 5. 결과 확인
ls docs/en/llms/
# ├── llms-origin.txt
# ├── llms-minimal.txt
# ├── llms-500chars.txt
# └── ...
```

이로써 단일 `init` 명령어로 전체 프로젝트를 완전히 초기화하고, 구조화된 문서 작업 환경을 구축할 수 있습니다.