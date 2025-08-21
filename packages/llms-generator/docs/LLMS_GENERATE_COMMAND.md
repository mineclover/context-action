# Clean LLMS Generation Command Documentation - 2024 Updated

> **⚠️ 중요**: 이 문서는 2024년 최신 구현을 기준으로 작성되었습니다. 기존 npx 방식이 아닌 CLI 빌드 후 실행 방식을 사용합니다.

`clean-llms-generate` 명령어는 프론트매터 없이 순수한 내용만을 담은 LLMS-TXT 파일을 생성합니다. LLM 학습/추론에 최적화된 형태로, 다중 생성과 다양한 패턴 옵션을 제공합니다.

## 📋 목차

- [개요](#개요)
- [기본 사용법](#기본-사용법)
- [다중 생성 모드](#다중-생성-모드)
- [출력 패턴](#출력-패턴)
- [명령어 옵션](#명령어-옵션)
- [사용 예시](#사용-예시)
- [출력 구조](#출력-구조)
- [성능 및 최적화](#성능-및-최적화)
- [문제 해결](#문제-해결)

## 개요

`clean-llms-generate` 명령어는 Context-Action 프레임워크 문서를 기반으로 LLM 학습에 최적화된 텍스트 파일을 생성합니다. 기본적으로 다중 생성 모드로 동작하여 3가지 주요 형태의 파일을 자동 생성합니다.

### 주요 특징

- **다중 생성**: origin, minimal, 기본 문자 제한 파일을 한번에 생성
- **깔끔한 형식**: 프론트매터 없는 순수 내용
- **문서 구분자**: 명확한 문서 경계 표시
- **언어별 디렉토리**: 체계적인 파일 조직
- **중복 제거**: 고유 문서만 선별

## 기본 사용법

### CLI 설치 및 실행

**방법 1: NPM 글로벌 설치 (권장)**
```bash
# 전 세계 어디서든 설치 가능
npm i -g @context-action/llms-generator

# 실행
llms clean-llms-generate [character-limit] [options]
```

**방법 2: pnpm 스크립트 (프로젝트 루트에서)**
```bash
pnpm llms:generate:en  # 영어 다중 생성
pnpm llms:generate:ko  # 한국어 다중 생성
```

**방법 3: 직접 실행 (개발용)**
```bash
node packages/llms-generator/dist/cli/index.js clean-llms-generate [options]
```

### 기본 동작 (다중 생성)

```bash
# 기본 3종 파일 자동 생성
llms clean-llms-generate --language en

# 또는 pnpm 스크립트 사용
pnpm llms:generate:en
```

**자동 생성 파일**:
- `llms-origin.txt` - 전체 내용 (문자 제한 없음)  
- `llms-minimal.txt` - 모든 문서의 링크 네비게이션
- `llms-500chars.txt` - 기본 500자 제한 문서

### 개별 생성

```bash
# 특정 문자 제한
llms clean-llms-generate 300 --language en

# 특정 패턴
llms clean-llms-generate --pattern minimal --language en

# 특정 카테고리
llms clean-llms-generate --category guide --language en
```

## 다중 생성 모드

기본 동작으로 가장 유용한 3가지 형태의 LLMS 파일을 자동 생성합니다:

### 1. Origin Pattern
- **파일**: `llms-origin.txt`
- **내용**: 모든 문서의 전체 내용
- **특징**: 문자 제한 없음, 문서 구분자 포함
- **용도**: 완전한 참조 자료, 컨텍스트 검색

### 2. Minimal Pattern  
- **파일**: `llms-minimal.txt`
- **내용**: 모든 문서의 링크 네비게이션 (102개)
- **특징**: 표준 링크 포맷, 카테고리별 정렬
- **용도**: 빠른 문서 탐색, 네비게이션

### 3. Default Character Limit
- **파일**: `llms-{limit}chars.txt` (예: `llms-500chars.txt`)
- **내용**: 기본 문자 제한의 완료된 문서
- **특징**: 설정파일 기준 제한 (일반적으로 500자)
- **용도**: 요약된 내용, 효율적 학습

### 생성 결과 예시

```
📊 Generation Summary:
✅ Successful: 3
📁 Language: en

📄 Generated Files:
   Origin (full content): llms-origin.txt
   Minimum (link navigation): llms-minimal.txt  
   Default (500 chars): llms-500chars.txt
```

## 출력 패턴

### 1. `clean` (기본)
문서 구분자와 함께 깔끔한 형태로 출력

```
===================[ DOC: en/guide/action-handlers.md ]===================
# guide--action-handlers

Action Handlers

Action handlers contain the business logic of your application...
```

### 2. `minimal` 
모든 문서의 링크 네비게이션 (표준 포맷 유지)

```
1. **[Action Only](en/api/action-only.md)** (api) - Priority: 75
2. **[Action Registry](en/api/action-registry.md)** (api) - Priority: 75
3. **[Action Register](en/api/core-action-register.md)** (api) - Priority: 75
...
102. **[Hooks](en/guide/hooks.md)** (guide) - Priority: 80
```

### 3. `origin`
전체 문서 내용 (문자 제한 없음, 문서 구분자 포함)

```
===================[ DOC: en/guide/action-handlers.md ]===================
# guide--action-handlers

[전체 문서 내용...]
```

### 4. `raw`
순수 내용만 (구분자, 메타데이터 없음)

```
Action Handlers

Action handlers contain the business logic...

Action Pipeline System

The Action Pipeline System is the core...
```

## 명령어 옵션

### 인수 (Arguments)
- `[character-limit]` - 문자 제한 필터 (예: 100, 300, 1000)
  - 지정하지 않으면 자동으로 다중 생성 모드 실행

### 옵션 (Options)

| 옵션 | 설명 | 기본값 | 예시 |
|------|------|--------|------|
| `-l, --language <lang>` | 대상 언어 (ko, en, ja) | `ko` | `--language en` |
| `-c, --category <cat>` | 카테고리 필터 | 없음 | `--category guide` |
| `-p, --pattern <pattern>` | 출력 패턴 | 없음 | `--pattern minimal` |
| `--generate-all` | 강제 다중 생성 | `false` | `--generate-all` |
| `-o, --output-dir <dir>` | 출력 디렉토리 | `docs` | `-o ./custom/output` |
| `--dry-run` | 실제 생성 없이 미리보기 | `false` | `--dry-run` |
| `-v, --verbose` | 상세 출력 | `false` | `--verbose` |

### 다중 생성 제어

**자동 다중 생성 조건**:
- 문자 제한 없음 AND 패턴 지정 없음
- 또는 `--generate-all` 플래그 사용

**개별 생성 방법**:
- 문자 제한 지정: `pnpm cli clean-llms-generate 300`
- 특정 패턴 지정: `--pattern minimal`
- 특정 카테고리 지정: `--category guide`

## 사용 예시

### 1. 기본 다중 생성
```bash
llms clean-llms-generate --language en
# 또는: pnpm llms:generate:en
```
**결과**: origin, minimal, 500chars 파일 3개 생성

### 2. 특정 문자 제한 생성
```bash
llms clean-llms-generate 100 --language en
```
**결과**: `llms-100chars.txt` 파일 생성 (102개 문서, ~21K characters)

### 3. 카테고리별 생성
```bash
llms clean-llms-generate 300 --category guide --language en
```
**결과**: 가이드 카테고리만 포함한 300자 제한 파일 생성

### 4. 미리보기 (Dry Run)
```bash
llms clean-llms-generate --language en --dry-run --verbose
```
**결과**: 실제 파일 생성 없이 상세한 생성 계획 표시

### 5. 강제 다중 생성
```bash
llms clean-llms-generate --generate-all --language ko
```
**결과**: 인수가 있어도 다중 생성 모드 실행

### 6. 다국어 배치 생성
```bash
pnpm llms:generate:en
pnpm llms:generate:ko
# 또는
llms clean-llms-generate --language en
llms clean-llms-generate --language ko
```

## 출력 구조

### 파일 위치
```
docs/
├── en/
│   └── llms/
│       ├── llms-origin.txt
│       ├── llms-minimal.txt
│       ├── llms-100chars.txt
│       ├── llms-300chars.txt
│       └── llms-500chars.txt
└── ko/
    └── llms/
        ├── llms-origin.txt
        └── llms-minimal.txt
```

### 파일명 규칙
- 기본: `llms.txt`
- 문자 제한: `llms-{limit}chars.txt` (예: `llms-300chars.txt`)
- 패턴: `llms-{pattern}.txt` (예: `llms-minimal.txt`)
- 카테고리: `llms-{limit}chars-{category}.txt` (예: `llms-500chars-guide.txt`)

### 내용 구조

#### Clean/Origin 패턴
```
===================[ DOC: en/guide/action-handlers.md ]===================
# guide--action-handlers

Action Handlers

Action handlers contain the business logic of your application...

===================[ DOC: en/guide/action-pipeline.md ]===================
# guide--action-pipeline

Action Pipeline System
...
```

#### Minimal 패턴
```
1. **[Action Only](en/api/action-only.md)** (api) - Priority: 75
2. **[Action Registry](en/api/action-registry.md)** (api) - Priority: 75
...
102. **[Hooks](en/guide/hooks.md)** (guide) - Priority: 80
```

#### Raw 패턴
```
Action Handlers

Action handlers contain the business logic...

Action Pipeline System

The Action Pipeline System is the core...
```

## 성능 및 최적화

### 성능 지표 (영어 기준)
- **총 문서**: 714개 → 중복 제거 후 102개 고유 문서
- **Minimal 패턴**: ~9K characters (평균 13 chars/document)
- **100자 제한**: ~21K characters (평균 206 chars/document)
- **Origin 패턴**: ~237K characters (전체 내용)

### 최적화 팁
1. **특정 카테고리만 필요한 경우** `--category` 옵션 사용
2. **미리보기 확인** `--dry-run` 옵션으로 사전 검토
3. **불필요한 문자 제한 파일** 생성 방지로 디스크 용량 절약

## 문제 해결

### 일반적인 오류와 해결방법

#### 1. 문서를 찾을 수 없음
```
❌ No completed documents found matching the specified criteria
```
**해결**: 언어나 문자 제한 조건 확인, 템플릿 생성 여부 확인

#### 2. 유효하지 않은 문자 제한
```
❌ Invalid character limit: abc
```
**해결**: 숫자로 된 문자 제한 값 입력

#### 3. 출력 디렉토리 권한 오류
**해결**: 출력 디렉토리 권한 확인 또는 다른 경로 지정

### 고급 사용법

#### 1. 설정 파일 사용자화
`llms-generator.config.json`에서 기본값 변경:
```json
{
  "generation": {
    "defaultLanguage": "en",
    "characterLimits": [100, 300, 500, 1000, 2000]
  }
}
```

#### 2. 카스텀 출력 디렉토리
```bash
llms clean-llms-generate --output-dir ./custom/llms --language en
```

#### 3. 배치 생성 (여러 언어)
```bash
# pnpm 스크립트 사용 (권장)
pnpm llms:generate:en
pnpm llms:generate:ko

# 또는 직접 실행
llms clean-llms-generate --language en
llms clean-llms-generate --language ko
```

## 관련 명령어

### 현재 사용 가능한 명령어
```bash
# 템플릿 생성
llms generate-templates
# 또는: pnpm llms:generate-templates

# 작업 진행 상황 확인
llms work-next
# 또는: pnpm llms:work-next

# 우선순위 작업 확인
llms priority-tasks
# 또는: pnpm llms:priority-tasks

# 프로젝트 초기화
llms init
# 또는: pnpm llms:init
```

### 현재 pnpm 스크립트
```bash
pnpm llms:init                   # 프로젝트 초기화
pnpm llms:generate-templates     # 템플릿 생성
pnpm llms:generate:en           # 영어 LLMS 생성
pnpm llms:generate:ko           # 한국어 LLMS 생성
pnpm llms:work-next             # 다음 작업
pnpm llms:work-top10            # 상위 10개 우선순위
pnpm llms:priority-tasks        # 우선순위 작업 관리
pnpm llms:priority-tasks:fix    # 우선순위 문제 자동 수정
```

## 문의 및 지원

문제가 발생하거나 개선 사항이 있으시면 프로젝트 이슈 페이지에 제보해 주세요.