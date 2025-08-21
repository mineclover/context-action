# LLMS Generator CLI - 종합 구현 참조서

LLMS Generator 시스템의 모든 구현된 CLI 명령어와 기능에 대한 완전한 문서입니다.

## 개요

LLMS Generator CLI는 다국어 문서 관리, 우선순위 시스템, 자동화된 템플릿 생성을 위한 종합적인 도구 모음을 제공합니다. 이 문서는 구현된 모든 기능, 명령어, 워크플로우를 다룹니다.

## 아키텍처

### 핵심 구성 요소
- **Command Router**: 중앙 명령 디스패치 시스템 (`/src/cli/index.ts`)
- **Command Implementations**: `/src/cli/commands/`의 개별 명령 클래스들
- **Configuration Management**: `EnhancedLLMSConfig`를 사용한 향상된 설정 시스템
- **Help System**: 대화형 도움말 표시 (`HelpDisplay.ts`)
- **Error Handling**: 중앙화된 오류 관리 (`ErrorHandler.ts`)
- **Argument Parsing**: 통합 인수 처리 (`ArgumentParser.ts`)

### 구현 통계
- **총 명령어 수**: 13개 핵심 명령어
- **NPM 스크립트**: 25+ 편의 스크립트
- **지원 언어**: 영어, 한국어
- **파일 처리**: Markdown → Priority JSON → Templates → LLMS
- **코드 축소**: ~2000줄에서 ~200줄 핵심 구현으로 최적화

## 전체 명령어 참조

### 프로젝트 초기화

#### `init` - 완전한 프로젝트 설정
전체 발견 및 설정과 함께 새 프로젝트에서 LLMS Generator를 초기화합니다.

**구현**: `InitCommand.ts`
**NPM 스크립트**: `pnpm llms:init`

```bash
# 완전한 초기화
pnpm llms:init

# 생성될 내용 미리보기
pnpm llms:init --dry-run

# 기존 파일 강제 덮어쓰기
pnpm llms:init --overwrite

# 특정 단계 건너뛰기
pnpm llms:init --skip-priority --skip-templates

# 기본 언어 설정
pnpm llms:init --language ko
```

**옵션:**
- `--dry-run`: 변경사항을 만들지 않고 초기화 미리보기
- `--overwrite`: 기존 설정 및 우선순위 파일 덮어쓰기
- `--quiet`: 상세 출력 억제
- `--skip-priority`: priority.json 파일 생성 건너뛰기
- `--skip-templates`: 템플릿 파일 생성 건너뛰기
- `-l, --language <lang>`: 기본 언어 설정 (en, ko)

**처리 단계:**
1. **문서 발견**: `docs/` 디렉토리에서 모든 `.md` 파일 스캔
2. **우선순위 생성**: 메타데이터 분석으로 `priority.json` 파일 생성
3. **템플릿 생성**: 모든 글자 수 제한에 대한 템플릿 파일 생성
4. **설정 구성**: `llms-generator.config.json` 생성 또는 업데이트

**출력 예시:**
```
🚀 LLMS Generator 초기화

📚 단계 1: 문서 발견
   영어 문서 24개 발견
   한국어 문서 18개 발견

📊 단계 2: 우선순위 생성  
   ✅ 생성됨: 42개 priority.json 파일
   ⚠️ 건너뜀: 0개 기존 파일

📝 단계 3: 템플릿 생성
   ✅ 템플릿 생성: 294개
   ⏭️ 템플릿 건너뜀: 0개

✅ 초기화 완료!
```

### 워크플로우 관리

#### `work-next` - 우선순위 기반 작업 큐
다음에 작업할 문서 항목을 찾거나 상위 N개 우선순위 문서를 표시합니다.

**구현**: `WorkNextCommand.ts`
**NPM 스크립트**: 
- `pnpm llms:work-next`
- `pnpm llms:work-top10`
- `pnpm llms:work-top20`

```bash
# 다음 단일 작업 항목
pnpm llms:work-next

# 상위 10개 우선순위 문서  
pnpm llms:work-next --limit 10
pnpm llms:work-top10

# 언어 및 카테고리별 필터링
pnpm llms:work-next --language ko --category guide --verbose

# 완료된 항목 표시
pnpm llms:work-next --show-completed --sort-by category

# 글자 수 제한별 필터링
pnpm llms:work-next --character-limit 300 --top 5
```

**옵션:**
- `-l, --language <lang>`: 언어별 필터링 (en, ko)
- `--show-completed`: 결과에 완료된 항목 포함
- `-v, --verbose`: 우선순위 점수를 포함한 상세 정보 표시
- `-n, --limit <number>` / `--top <number>`: 상위 N개 우선순위 문서 표시
- `--sort-by <field>`: priority (기본값), category, status, modified로 정렬
- `--category <cat>`: 특정 카테고리별 필터링
- `-c, --character-limit <num>`: 글자 수 제한별 필터링

**출력 형식:**
```
🎯 상위 10개 우선순위 문서

📄 1. Context Store Pattern [우선순위: 98] 
   📁 카테고리: concept | 🌐 언어: en
   📝 상태: needs_content | 🔢 글자 수 제한: 100,300,500,1000,2000,5000
   📅 수정일: 2024-01-15 | 📊 완료율: 45%

📄 2. Action Pipeline System [우선순위: 95]
   📁 카테고리: concept | 🌐 언어: ko  
   📝 상태: in_progress | 🔢 글자 수 제한: 300,1000,5000
   📅 수정일: 2024-01-12 | 📊 완료율: 78%
```

### 우선순위 관리 시스템

#### `priority-stats` - 우선순위 분포 분석
모든 문서에 걸친 종합적인 우선순위 분포 통계를 표시합니다.

**구현**: `PriorityManagerCommand.ts`
**NPM 스크립트**: `pnpm priority`

```bash
# 전체 통계
pnpm llms:priority-stats

# 스크립팅을 위한 조용한 모드
pnpm llms:priority-stats --quiet
```

**출력 포함 사항:**
- 총 문서 수 및 평균 우선순위 점수
- 우선순위 등급별 분포 (Critical: 90-100, High: 75-89, Medium: 50-74, Low: 0-49)
- 카테고리 및 언어별 분석
- 통계적 지표 (범위, 표준편차, 사분위수)
- 건강 지표 및 추세 분석

**샘플 출력:**
```
📊 우선순위 분포 통계

📈 전체 지표:
   총 문서 수: 42개
   평균 우선순위: 73.5
   표준편차: 18.2
   범위: 45-98

🎯 우선순위 등급:
   🔴 Critical (90-100): 8개 문서 (19%)
   🟠 High (75-89): 15개 문서 (36%) 
   🟡 Medium (50-74): 14개 문서 (33%)
   🔵 Low (0-49): 5개 문서 (12%)

📁 카테고리별:
   concept: 평균 85.3 (12개 문서)
   guide: 평균 78.1 (18개 문서)
   api: 평균 68.9 (12개 문서)

🌐 언어별:
   en: 평균 75.2 (24개 문서)
   ko: 평균 71.1 (18개 문서)
```

#### `priority-health` - 우선순위 시스템 건강 점검
우선순위 일관성을 평가하고 시스템적 문제를 식별합니다.

**구현**: `PriorityManagerCommand.ts`
**NPM 스크립트**: `pnpm llms:priority-health`

```bash
# 건강 평가
pnpm llms:priority-health

# 조용한 모드
pnpm llms:priority-health --quiet
```

**건강 점수 시스템:**
- **우수 (85-100)**: 균형 잡히고 일관된 우선순위
- **양호 (70-84)**: 경미한 불일치, 쉽게 해결 가능  
- **보통 (50-69)**: 주목할 만한 문제, 주의 필요
- **불량 (0-49)**: 즉시 조치가 필요한 심각한 문제

**평가 요소:**
- 우선순위 분포 균형
- 카테고리 일관성
- 언어 균등성
- 이상치 탐지
- 시간적 일관성
- 콘텐츠-우선순위 정렬

#### `priority-suggest` - 지능형 권장사항
우선순위 시스템 개선을 위한 실행 가능한 권장사항을 제공합니다.

**구현**: `PriorityManagerCommand.ts`
**NPM 스크립트**: `pnpm llms:priority-suggest`

```bash
# 시스템 전반 제안
pnpm llms:priority-suggest

# 문서별 제안
pnpm llms:priority-suggest --document-id "en/concept/action-pipeline"

# 자동화를 위한 조용한 모드
pnpm llms:priority-suggest --quiet
```

**제안 카테고리:**
- 우선순위 재조정 권장사항
- 콘텐츠 격차 식별
- 카테고리 표준화 제안
- 언어 균등성 개선사항
- 템플릿 완료 우선순위

#### `priority-auto` - 자동화된 우선순위 재계산
설정 가능한 기준에 따라 우선순위를 자동으로 재계산합니다.

**구현**: `PriorityManagerCommand.ts`
**NPM 스크립트**: `pnpm llms:priority-auto`

```bash
# 기본값으로 자동 재계산
pnpm llms:priority-auto

# 최근 파일이라도 강제 재계산
pnpm llms:priority-auto --force

# 사용자 정의 기준 파일 사용
pnpm llms:priority-auto --criteria custom-criteria.json

# 조용한 모드
pnpm llms:priority-auto --quiet
```

**기본 기준 가중치:**
- 문서 크기: 40%
- 카테고리 중요도: 30%
- 키워드 밀도: 20%
- 관계 복잡성: 10%

#### `priority-tasks` - 우선순위 파일 관리
priority.json 파일 자체를 관리하고 분석 - 누락되거나 오래되거나 잘못된 우선순위 파일을 찾습니다.

**구현**: `PriorityTasksCommand.ts`
**NPM 스크립트**: 
- `pnpm llms:priority-tasks`
- `pnpm llms:priority-tasks:fix`

```bash
# 모든 priority.json 문제 검사
pnpm llms:priority-tasks

# 상세 정보 표시
pnpm llms:priority-tasks --verbose --limit 10

# 특정 문제 유형 수정
pnpm llms:priority-tasks --task-type missing --fix
pnpm llms:priority-tasks --task-type outdated --fix

# 적용하지 않고 수정사항 미리보기
pnpm llms:priority-tasks --fix --dry-run

# 언어 또는 카테고리별 필터링
pnpm llms:priority-tasks --language ko --category guide
```

**작업 유형:**
- 🔴 **missing**: 문서에 대한 priority.json 파일이 누락됨
- ❌ **invalid**: JSON 구문 오류 또는 필수 필드 누락
- 🟡 **outdated**: priority.json 이후에 소스 문서가 수정됨
- 🟠 **needs_review**: 우선순위 점수가 카테고리 기준과 맞지 않음  
- 🔵 **needs_update**: 메타데이터가 불완전하거나 개선이 필요함

**옵션:**
- `-l, --language <lang>`: 언어별 필터링
- `--category <cat>`: 카테고리별 필터링
- `--task-type <type>`: 특정 작업 유형별 필터링
- `-n, --limit <num>`: 결과 수 제한
- `-v, --verbose`: 상세 정보 표시
- `--fix`: 감지된 문제 자동 수정
- `--dry-run`: 변경사항을 만들지 않고 미리보기

**자동 수정 기능:**
- **누락된 파일**: 계산된 점수로 priority.json 생성
- **잘못된 JSON**: 구문 오류 수정, 누락된 필수 필드 추가
- **오래된 파일**: 타임스탬프 및 메타데이터 업데이트
- **검토 문제**: 우선순위 점수 조정 제안
- **업데이트 작업**: 메타데이터 완성도 향상

### 문서 처리

#### `sync-docs` - 문서 동기화
변경된 문서 파일을 자동으로 처리하고 우선순위 메타데이터와 함께 템플릿을 생성합니다.

**구현**: `SyncDocsCommand.ts`
**NPM 스크립트**: 
- `pnpm llms:sync-docs`
- `pnpm llms:sync-docs:ko`
- `pnpm llms:sync-docs:en`  
- `pnpm llms:sync-docs:dry`

```bash
# 기본 동기화
pnpm llms:sync-docs --changed-files docs/en/guide/example.md

# 언어별 처리
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/example.md
pnpm llms:sync-docs:en --changed-files docs/en/guide/example.md

# 여러 파일
pnpm llms:sync-docs --changed-files "docs/en/guide/example.md,docs/ko/concept/overview.md"

# 고급 언어 필터링
node cli.js sync-docs --languages ko,en --changed-files files...
node cli.js sync-docs --only-korean --changed-files files...
node cli.js sync-docs --no-korean --changed-files files...

# 드라이 런 미리보기
pnpm llms:sync-docs:dry --changed-files files...

# 최소 변경사항도 강제 처리
pnpm llms:sync-docs --force --changed-files files...
```

**옵션:**
- `--changed-files <files>`: 쉼표로 구분된 변경된 마크다운 파일 목록
- `--only-korean`: 한국어 문서만 처리 🇰🇷
- `--only-english`: 영어 문서만 처리 🇺🇸
- `--languages <langs>`: 특정 쉼표로 구분된 언어 처리
- `--include-korean` / `--no-korean`: 한국어 문서 처리 제어
- `--dry-run`: 수정하지 않고 변경사항 미리보기
- `--force`: 최소 변경사항이 감지되어도 강제 업데이트
- `--quiet`: 자동화를 위한 상세 출력 억제

**처리 워크플로우:**
1. **파일 분석**: 파일 경로 패턴에서 언어 감지
2. **변경 감지**: 기존 priority.json 타임스탬프와 비교
3. **우선순위 계산**: 우선순위 점수를 위한 콘텐츠 분석
4. **템플릿 생성**: 글자 수 제한 템플릿 생성
5. **메타데이터 업데이트**: 새로운 정보로 priority.json 업데이트

#### `generate-templates` - 템플릿 생성 시스템
기존 문서에 대한 글자 수 제한 템플릿을 생성합니다.

**구현**: `GenerateTemplatesCommand.ts`
**NPM 스크립트**: `pnpm llms:generate-templates`

```bash
# 모든 템플릿 생성
pnpm llms:generate-templates

# 언어별 생성
pnpm llms:generate-templates --language ko

# 카테고리 필터링
pnpm llms:generate-templates --category guide --verbose

# 사용자 정의 글자 수 제한
pnpm llms:generate-templates --character-limits 100,300,500,1000

# 기존 템플릿 덮어쓰기
pnpm llms:generate-templates --overwrite

# 생성 미리보기
pnpm llms:generate-templates --dry-run
```

**옵션:**
- `-l, --language <lang>`: 대상 언어 (en, ko)
- `--category <category>`: 특정 문서 카테고리
- `--character-limits <limits>`: 쉼표로 구분된 글자 수 제한
- `--overwrite`: 기존 템플릿 덮어쓰기
- `--dry-run`: 파일 생성 없이 미리보기
- `-v, --verbose`: 파일 경로가 포함된 상세 출력

**템플릿 유형:**
- **표준 템플릿**: 100, 200, 300, 500, 1000, 2000, 5000 글자 수 제한
- **사용자 정의 제한**: 사용자 구성 가능한 글자 수 제한
- **콘텐츠 보존**: 소스 형식 및 구조 유지
- **메타데이터 통합**: 우선순위 및 카테고리 정보 포함

### LLMS 생성

#### `llms-generate` - 표준 LLMS 파일 생성
학습 목적을 위해 메타데이터가 포함된 표준 LLMS 파일을 생성합니다.

**구현**: `LLMSGenerateCommand.ts`
**NPM 스크립트**: `pnpm llms:generate`

```bash
# 모든 LLMS 파일 생성
pnpm llms:generate

# 글자 수 제한 생성
pnpm llms:generate --character-limit 300

# 언어 및 카테고리 필터링
pnpm llms:generate --language ko --category guide

# 다양한 패턴
pnpm llms:generate --pattern standard  # 기본값
pnpm llms:generate --pattern minimum   # 최소 메타데이터
pnpm llms:generate --pattern origin    # 원본 형식

# 생성 미리보기
pnpm llms:generate --dry-run --verbose
```

**옵션:**
- `-c, --character-limit <num>`: 특정 글자 수 제한
- `--category <cat>`: 문서 카테고리별 필터링
- `-l, --language <lang>`: 대상 언어 (en, ko)
- `-p, --pattern <type>`: 생성 패턴 (standard, minimum, origin)
- `--dry-run`: 파일 생성 없이 미리보기
- `-v, --verbose`: 상세 출력

#### `clean-llms-generate` - 클린 LLMS 생성
직접 LLM 학습을 위해 메타데이터 없는 클린 LLMS 파일을 생성합니다.

**구현**: `clean-llms-generate.ts`
**NPM 스크립트**: `pnpm llms:clean`

```bash
# 글자 수 제한으로 클린 생성
pnpm llms:clean 300 --language ko

# 패턴 기반 생성
pnpm llms:clean --pattern clean     # 메타데이터 없음
pnpm llms:clean --pattern minimal   # 최소 구조
pnpm llms:clean --pattern raw       # 원시 콘텐츠만

# 카테고리별 생성
pnpm llms:clean --category guide --pattern clean

# 미리보기 모드
pnpm llms:clean 100 --pattern raw --dry-run
```

**패턴:**
- **clean**: 메타데이터 없음, 구조화된 콘텐츠만
- **minimal**: 최소 구조 보존
- **raw**: 원시 콘텐츠 추출만

### 고급 명령어

#### `priority-sync` - 우선순위 동기화
서로 다른 시스템 간 우선순위 데이터를 동기화합니다 (구현 방식 다양).

**구현**: `PriorityManagerCommand.ts`
**NPM 스크립트**: `pnpm llms:priority-sync`

```bash
# 우선순위 데이터 동기화
pnpm llms:priority-sync

# 동기화 서버 지정
pnpm llms:priority-sync --server production

# 조용한 모드
pnpm llms:priority-sync --quiet
```

## NPM 스크립트 참조

### 핵심 워크플로우 스크립트
```bash
# 프로젝트 설정
pnpm llms:init                    # 완전한 초기화

# 우선순위 관리
pnpm priority                     # 우선순위 통계 (별칭)
pnpm llms:priority-stats         # 전체 우선순위 통계
pnpm llms:priority-health        # 건강 평가  
pnpm llms:priority-suggest       # 권장사항 얻기
pnpm llms:priority-auto          # 우선순위 자동 재계산
pnpm llms:priority-tasks         # priority.json 파일 관리
pnpm llms:priority-tasks:fix     # 우선순위 문제 자동 수정

# 작업 큐 관리
pnpm llms:work-next              # 다음 작업 항목
pnpm llms:work-top10             # 상위 10개 우선순위
pnpm llms:work-top20             # 상위 20개 우선순위

# 문서 처리
pnpm llms:sync-docs              # 모든 언어 동기화
pnpm llms:sync-docs:ko           # 한국어 문서만
pnpm llms:sync-docs:en           # 영어 문서만
pnpm llms:sync-docs:dry          # 드라이 런 미리보기

# 템플릿 생성
pnpm llms:generate-templates     # 모든 템플릿 생성

# LLMS 파일 생성
pnpm llms:generate               # 표준 LLMS 생성
pnpm llms:clean                  # 클린 LLMS 생성
```

### 레거시/호환성 스크립트
```bash
# 레거시 명령 지원 (폐기 예정일 수 있음)
pnpm llms:minimum                # 최소 생성
pnpm llms:origin                 # 원본 형식 생성
pnpm llms:chars                  # 글자 기반 처리
pnpm llms:batch                  # 배치 처리
pnpm llms:docs                   # 문서 생성
pnpm llms:docs:en                # 영어 문서 생성
pnpm llms:docs:ko                # 한국어 문서 생성
pnpm llms:check                  # 작업 확인
pnpm llms:check:outdated         # 오래된 항목 확인
```

## 설정 시스템

### 향상된 설정 (`llms-generator.config.json`)
```json
{
  "paths": {
    "docsDir": "./docs",
    "llmContentDir": "./llmsData", 
    "outputDir": "./output",
    "templatesDir": "./templates",
    "instructionsDir": "./instructions"
  },
  "generation": {
    "supportedLanguages": ["en", "ko"],
    "characterLimits": [100, 200, 300, 500, 1000, 2000, 5000],
    "defaultLanguage": "en",
    "outputFormat": "txt"
  },
  "categories": {
    "guide": { "priority": 90, "description": "사용자 가이드" },
    "concept": { "priority": 85, "description": "개념 문서" },
    "api": { "priority": 80, "description": "API 문서" },
    "examples": { "priority": 75, "description": "예제 및 튜토리얼" }
  },
  "quality": {
    "minContentLength": 100,
    "maxContentLength": 10000,
    "requiredSections": ["introduction", "examples"]
  }
}
```

### 사용자 정의 우선순위 기준
자동화된 우선순위 계산을 위한 `custom-criteria.json` 생성:

```json
{
  "documentSize": { 
    "weight": 0.4, 
    "method": "linear",
    "min": 100,
    "max": 5000
  },
  "category": { 
    "weight": 0.3, 
    "values": { 
      "guide": 95, 
      "concept": 85, 
      "api": 90,
      "examples": 75 
    }
  },
  "keywordDensity": { 
    "weight": 0.2, 
    "method": "logarithmic",
    "keywords": ["action", "store", "context", "component"]
  },
  "relationships": { 
    "weight": 0.1, 
    "method": "network",
    "linkWeight": 5,
    "referenceWeight": 3
  }
}
```

## 통합 워크플로우

### 포스트 커밋 훅 통합
문서 파일이 변경될 때 자동 처리:

```bash
#!/bin/sh
# .git/hooks/post-commit

# 변경된 파일 감지
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD | grep "docs/.*\.md$" | tr '\n' ',' | sed 's/,$//')

if [ ! -z "$CHANGED_FILES" ]; then
    echo "📚 문서 변경사항 처리 중..."
    pnpm llms:sync-docs --changed-files "$CHANGED_FILES" --quiet
    
    # 생성된 파일들을 별도로 커밋
    git add llmsData/
    git commit -m "📝 문서 변경사항에 대한 LLMS 파일 자동 업데이트

생성 대상: $CHANGED_FILES"
fi
```

### CI/CD 파이프라인 통합
```yaml
# .github/workflows/docs-quality.yml
name: 문서 품질 게이트

on:
  pull_request:
    paths: ['docs/**/*.md']

jobs:
  docs-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: 의존성 설치
        run: pnpm install
      
      - name: LLMS Generator 빌드
        run: pnpm build:llms-generator
      
      - name: 우선순위 건강 확인
        run: pnpm llms:priority-health
      
      - name: 문서 변경사항 검증
        run: |
          CHANGED_FILES=$(gh pr diff --name-only | grep "docs/.*\.md$" | tr '\n' ',' | sed 's/,$//')
          if [ ! -z "$CHANGED_FILES" ]; then
            pnpm llms:sync-docs --changed-files "$CHANGED_FILES" --dry-run
          fi
      
      - name: 우선순위 작업 확인
        run: pnpm llms:priority-tasks --verbose
```

## 오류 처리 및 디버깅

### 일반적인 문제 및 해결책

**언어 처리 오류:**
```bash
# 문제: 파일 경로가 예상 패턴과 맞지 않음
# 해결: 파일이 docs/(en|ko)/**/*.md 패턴을 따르는지 확인
ls docs/en/guide/example.md  # ✅ 올바름
ls guides/en/example.md      # ❌ 잘못된 패턴

# 문제: 언어 필터링이 작동하지 않음
# 해결: 언어 필터링 옵션 확인
pnpm llms:sync-docs --only-korean --changed-files files...  # ✅ 올바름
pnpm llms:sync-docs --korean --changed-files files...       # ❌ 잘못된 옵션
```

**우선순위 시스템 문제:**
```bash
# 문제: 우선순위 불일치
# 해결: 건강 점검 및 자동 재계산 실행
pnpm llms:priority-health
pnpm llms:priority-auto --force

# 문제: priority.json 파일 누락  
# 해결: 수정 옵션으로 priority-tasks 사용
pnpm llms:priority-tasks --task-type missing --fix
```

**템플릿 생성 실패:**
```bash
# 문제: 글자 수 제한에 대한 콘텐츠 부족
# 해결: 소스 문서 길이 및 품질 확인
pnpm llms:generate-templates --dry-run --verbose

# 문제: llmsData/ 생성 권한 오류
# 해결: 디렉토리 권한 확인
mkdir -p llmsData
chmod 755 llmsData
```

### 디버그 모드 사용법
```bash
# 문제 해결을 위한 자세한 출력 활성화
node packages/llms-generator/dist/cli/index.js <command> --verbose

# 수정 없이 변경사항 미리보기
node packages/llms-generator/dist/cli/index.js sync-docs --dry-run --changed-files files...

# 자동화 스크립트를 위한 조용한 모드
node packages/llms-generator/dist/cli/index.js <command> --quiet
```

### 성능 모니터링
```bash
# 시간에 따른 우선순위 시스템 건강 모니터링
pnpm llms:priority-health > health-$(date +%Y%m%d).log

# 우선순위 작업 추세 추적
pnpm llms:priority-tasks --verbose > tasks-$(date +%Y%m%d).log

# 생성 성능 벤치마크
time pnpm llms:generate-templates --dry-run
```

## 모범 사례

### 일일 워크플로우
```bash
# 1. 시스템 건강 확인
pnpm llms:priority-health

# 2. 고우선순위 작업 식별
pnpm llms:work-top10 --verbose

# 3. 변경된 문서 처리
pnpm llms:sync-docs --changed-files "$(git diff --name-only HEAD~1 | grep 'docs/.*\.md$' | tr '\n' ',')"

# 4. 우선순위 작업 검증
pnpm llms:priority-tasks --limit 5
```

### 주간 유지보수
```bash
# 1. 전체 시스템 분석
pnpm llms:priority-stats

# 2. 권장사항이 포함된 건강 평가
pnpm llms:priority-health
pnpm llms:priority-suggest

# 3. 우선순위 문제 수정
pnpm llms:priority-tasks:fix

# 4. 필요시 자동 재계산
pnpm llms:priority-auto --force
```

### 팀 협력
```bash
# 언어별 워크플로우
# 한국어 팀원:
pnpm llms:work-next --language ko --top 5
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/new-feature.md

# 영어 팀원:
pnpm llms:work-next --language en --category guide --top 5
pnpm llms:sync-docs:en --changed-files docs/en/guide/new-feature.md

# 프로젝트 관리자:
pnpm llms:priority-health
pnpm llms:priority-stats --quiet | tail -5
```

## 구현 참고사항

### 코드 아키텍처
- **모듈형 명령 시스템**: 각 명령은 일관된 인터페이스를 가진 별도 클래스
- **통합 설정**: 레거시 및 향상된 기능을 모두 지원하는 단일 설정 시스템
- **오류 복원력**: 사용자 친화적인 메시지와 포괄적인 오류 처리
- **성능 최적화**: 기능을 유지하면서 핵심 구현을 90% 축소

### 의존성
- **핵심 의존성**: Node.js 18+, TypeScript 5+
- **CLI 프레임워크**: ArgumentParser를 사용한 사용자 정의 구현
- **파일 처리**: async/await를 사용한 네이티브 Node.js fs 모듈
- **JSON 처리**: 검증을 포함한 네이티브 JSON
- **언어 감지**: 경로 기반 언어 식별

### 테스트 전략
```bash
# 개별 명령어 테스트
pnpm llms:priority-stats --dry-run
pnpm llms:work-next --verbose --limit 3

# 언어 필터링 테스트
pnpm llms:sync-docs:dry --changed-files docs/test/example.md

# 오류 처리 테스트
pnpm llms:priority-tasks --task-type invalid --dry-run
```

### 마이그레이션 참고사항
- **레거시 CLI에서**: 모든 핵심 기능 보존, 인터페이스 단순화
- **설정 마이그레이션**: 향상된 설정은 레거시와 하위 호환
- **스크립트 마이그레이션**: 팀 연속성을 위해 NPM 스크립트 유지
- **데이터 마이그레이션**: priority.json 형식 변경 없음, 향상된 메타데이터는 선택사항

---

## 빠른 명령어 참조

| 명령어 | 목적 | 주요 옵션 |
|---------|---------|-------------|
| `init` | 프로젝트 설정 | `--dry-run`, `--overwrite`, `--skip-*` |
| `work-next` | 작업 항목 찾기 | `--limit`, `--language`, `--category` |
| `priority-stats` | 통계 보기 | `--quiet` |
| `priority-health` | 건강 점검 | `--quiet` |
| `priority-suggest` | 권장사항 얻기 | `--document-id` |
| `priority-auto` | 자동 재계산 | `--force`, `--criteria` |
| `priority-tasks` | 우선순위 파일 관리 | `--fix`, `--task-type`, `--dry-run` |
| `sync-docs` | 변경사항 처리 | `--changed-files`, `--only-*`, `--dry-run` |
| `generate-templates` | 템플릿 생성 | `--language`, `--category`, `--overwrite` |
| `llms-generate` | LLMS 생성 | `--character-limit`, `--pattern` |
| `clean-llms-generate` | 클린 LLMS | `--pattern`, `--category` |

---

**다음 단계:**
- 포스트 커밋 훅으로 자동화된 워크플로우 설정
- 팀별 언어 처리 설정
- 정기적인 우선순위 건강 모니터링 수립
- 문서 품질 게이트를 위한 CI/CD 파이프라인과 통합

**중요 사항:**
- 대량 작업 전에는 항상 `--dry-run`으로 테스트
- 대규모 변경 후 우선순위 건강 점수 모니터링
- 팀원들과 언어 처리 설정 조율
- 최신 기능을 위해 LLMS Generator 빌드를 최신 상태로 유지