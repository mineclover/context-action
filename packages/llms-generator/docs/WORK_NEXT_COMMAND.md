# Work Next Command Guide - 2024 Updated

> **⚠️ 중요**: 이 문서는 2024년 최신 구현을 기준으로 작성되었습니다. 기존 npx 방식이 아닌 CLI 빌드 후 실행 방식을 사용합니다.

LLMS Generator의 `work-next` 명령어는 우선순위 기반 작업 관리와 상위 N개 문서 표시 기능을 제공하는 지능형 워크플로 도구입니다.

## CLI 설치 및 준비

### 방법 1: 자동 설치 (권장) 🎆
```bash
# llms-generator 디렉토리에서 실행
cd packages/llms-generator
./install-cli.sh

# 설치 후 도움말 확인
llms --help
llms work-next --help
```

### 방법 2: 수동 설치
```bash
# 1. CLI 빌드
pnpm build:llms-generator

# 2. 글로벌 링크  
cd packages/llms-generator
pnpm link --global

# 3. 도움말 확인
llms --help
llms work-next --help
```

## 사용 방법

### 방법 1: llms 명령어 (권장) 🎆
```bash
# 어디서나 사용 가능
llms work-next [options]

# 예시
llms work-next --limit 10
llms work-next --language ko --limit 5
```

### 방법 2: pnpm 스크립트 (프로젝트 루트에서)
```bash
pnpm llms:work-next              # 다음 작업 1개
pnpm llms:work-top10            # 상위 10개 우선순위
pnpm llms:work-top20            # 상위 20개 우선순위
```

### 방법 3: 직접 실행 (개발용)
```bash
# 프로젝트 루트에서
node packages/llms-generator/dist/cli/index.js work-next [options]
```

## 개요

`work-next` 명령어는 프로젝트의 모든 문서 상태를 분석하여 다음과 같은 정보를 제공합니다:

1. **우선순위 기반 다음 작업**: 가장 중요하고 시급한 작업 항목 식별
2. **Top N 우선순위 리스트**: 상위 N개 우선순위 작업을 한번에 표시 (2024 신기능)
3. **작업 상태 분석**: 각 문서의 현재 상태와 필요한 작업 유형 분석
4. **구체적인 액션 가이드**: 다음 단계를 위한 명확한 명령어와 파일 경로 제공
5. **전체 현황 통계**: 프로젝트 전체의 작업 진행 상황 요약

## 기본 사용법

### 단순 실행 (2024 최신)
```bash
# 다음 단일 작업 항목 확인 (기본값)
llms work-next
# 또는: pnpm llms:work-next

# 상위 10개 우선순위 문서 표시
llms work-next --limit 10
# 또는: pnpm llms:work-top10
```

### 언어별 필터링 (2024 최신)
```bash
# 영어 문서만 확인
llms work-next --language en
# 또는: pnpm llms:work-next --language en

# 한국어 문서만 확인  
llms work-next --language ko
# 또는: pnpm llms:work-next --language ko

# 상위 5개 한국어 문서
llms work-next --language ko --limit 5
```

### 문자 제한별 필터링
```bash
# 특정 문자 제한 작업만 확인
llms work-next --character-limit 300

# 특정 문자 제한과 언어 조합
llms work-next --character-limit 500 --language en
```

### 카테고리별 필터링
```bash
# API 문서만 확인
llms work-next --category api

# 가이드 문서만 확인
llms work-next --category guide

# 개념 설명 문서만 확인
llms work-next --category concept

# 예제 문서만 확인
llms work-next --category examples
```

## 고급 옵션

### 정렬 방식 선택
```bash
# 우선순위 순 (기본값)
llms work-next --sort-by priority

# 카테고리 순
llms work-next --sort-by category

# 작업 상태 순
llms work-next --sort-by status

# 수정된 날짜 순
llms work-next --sort-by modified
```

### 완료된 항목 포함
```bash
# 완료된 항목도 표시
llms work-next --show-completed

# 완료된 항목만 표시 (상태 확인용)
llms work-next --show-completed --sort-by status
```

### 조합 사용 예시
```bash
# 한국어 API 문서의 300자 작업 상위 5개
llms work-next --language ko --category api --character-limit 300 --limit 5

# 최근 수정된 가이드 문서들 확인
llms work-next --category guide --sort-by modified --limit 10

# 모든 완료된 작업 확인 (품질 검토용)
llms work-next --show-completed --sort-by category
```

## 2024 최신 기능: Top N 우선순위 리스트

기존의 단일 작업 표시 외에, 이제 `--limit` 옵션을 통해 상위 N개의 우선순위 작업을 한번에 볼 수 있습니다.

### Top N 우선순위 표시
```bash
# 상위 10개 우선순위 작업 표시
llms work-next --limit 10
# 또는: pnpm llms:work-top10

# 상위 5개 우선순위 작업 (특정 언어)
llms work-next --limit 5 --language en

# 모든 가능한 우선순위 작업 표시
llms work-next --limit 50
```

### 문서 그룹화 (중복 제거)
시스템은 동일한 문서가 여러 문자 제한에서 중복 표시되는 것을 방지합니다:

```bash
# 예시 출력
📋 Top 10 Priority Documents (Grouped):

1. 🔴 guide--getting-started (ko) - Priority: 100
   Character limits needed: 100, 300, 500, 1000, 2000

2. 🔴 api--action-only (en) - Priority: 95  
   Character limits needed: 100, 300, 500

3. 🟡 concept--architecture (en) - Priority: 90
   Character limits needed: 300, 1000
```

## 명령어 옵션 전체 목록

| 옵션 | 단축형 | 설명 | 기본값 | 예시 |
|------|--------|------|--------|------|
| `--language` | `-l` | 대상 언어 (ko, en) | 모든 언어 | `--language ko` |
| `--limit` | `-n` | 표시할 최대 항목 수 | 1 | `--limit 10` |
| `--top` | | limit와 동일 (별칭) | 1 | `--top 5` |
| `--category` | | 카테고리 필터 | 모든 카테고리 | `--category guide` |
| `--character-limit` | `-c` | 문자 제한 필터 | 모든 제한 | `--character-limit 300` |
| `--sort-by` | | 정렬 기준 | priority | `--sort-by modified` |
| `--show-completed` | | 완료된 항목도 표시 | false | `--show-completed` |
| `--verbose` | `-v` | 상세 출력 | false | `--verbose` |

## 출력 예시

### 단일 작업 표시 (기본)
```bash
$ pnpm llms:work-next

🔍 Analyzing document work status...

📄 Next Priority Document: guide--getting-started (ko)
📊 Status: 🔴 Missing Priority JSON
🎯 Priority: 100 (High Priority)
💡 Issue: priority.json file is missing
🛠️  Recommendation: Generate priority.json file first

🚀 Next Action:
   llms init --language ko
```

### 상위 N개 우선순위 표시 (--limit 사용)
```bash
$ pnpm llms:work-top10

🔍 Analyzing document work status...

📋 Top 10 Priority Documents (Grouped):

1. 🔴 guide--getting-started (ko) - Priority: 100
   Issue: Missing priority.json file
   Character limits needed: 100, 300, 500, 1000, 2000, 5000
   Action: llms init --language ko

2. 🔴 api--action-only (en) - Priority: 95
   Issue: Missing priority.json file  
   Character limits needed: 100, 300, 500, 1000, 2000, 5000
   Action: llms init --language en

3. 🟡 concept--architecture (en) - Priority: 90
   Issue: Missing template files
   Character limits needed: 300, 1000
   Action: llms generate-templates

... (continues for remaining documents)

📊 Summary:
   Total documents analyzed: 128
   Missing priority files: 115
   Missing templates: 8
   Ready for content: 5
```

## 작업 상태 유형

`work-next`는 다음과 같은 상태로 문서를 분류합니다:

### 🔴 Missing Priority JSON
**상태**: `missing_priority`
**의미**: Priority JSON 파일이 없어서 문서 메타데이터 생성이 필요한 상태

**권장 액션**:
```bash
# Priority JSON 생성
llms init
```

### 🟡 Missing Template
**상태**: `missing_template`
**의미**: Priority JSON은 있지만 템플릿 파일이 생성되지 않은 상태

**권장 액션**:
```bash
# 템플릿 파일 생성
llms generate-templates
```

### 🟠 Needs Content
**상태**: `needs_content`
**의미**: 템플릿 파일은 있지만 실제 요약 내용이 작성되지 않은 상태

**권장 액션**: 해당 템플릿 파일을 직접 편집하여 내용 작성

### 🟢 Completed
**상태**: `completed`
**의미**: 모든 작업이 완료된 상태

## 실용적인 워크플로

### 1. 초기 프로젝트 설정
```bash
# 1. CLI 빌드
pnpm build:llms-generator

# 2. 전체 상황 파악
pnpm llms:priority-tasks

# 3. 상위 우선순위 작업 확인
pnpm llms:work-top10

# 4. 프로젝트 초기화
pnpm llms:init
```

### 2. 일일 작업 관리
```bash
# 오늘 할 일 확인
pnpm llms:work-top10

# 특정 언어 작업 집중
pnpm llms:work-next --language ko --limit 5

# 카테고리별 작업 관리
pnpm llms:work-next --category guide --limit 3
```

### 3. 진행 상황 모니터링
```bash
# 전체 진행 상황
pnpm llms:priority-tasks

# 완료된 작업 검토
llms work-next --show-completed --limit 20
```

## 문제 해결

### 일반적인 오류와 해결방법

#### 1. "No pending work items found"
```
🎉 No pending work items found!
```
**의미**: 모든 작업이 완료되었거나 조건에 맞는 작업이 없음
**해결**: `--show-completed` 옵션으로 완료된 작업 확인

#### 2. CLI 파일 찾을 수 없음
```
Error: Cannot find module
```
**해결**: CLI 빌드 실행
```bash
pnpm build:llms-generator
```

#### 3. pnpm 스크립트 작동하지 않음
**해결**: 프로젝트 루트에서 실행하는지 확인
```bash
cd /path/to/context-action  # 프로젝트 루트로 이동
pnpm llms:work-next
```

## 관련 명령어

### 우선순위 관리
```bash
# 우선순위 작업 관리
pnpm llms:priority-tasks                # 현재 우선순위 작업 현황
pnpm llms:priority-tasks:fix            # 우선순위 문제 자동 수정
pnpm llms:priority-health               # 시스템 건강도 확인
pnpm llms:priority-stats                # 우선순위 통계
```

### 프로젝트 관리
```bash
# 프로젝트 초기화 및 템플릿
pnpm llms:init                          # 전체 프로젝트 초기화
pnpm llms:generate-templates            # 템플릿 파일 생성
```

### LLMS 파일 생성
```bash
# 문서 생성
pnpm llms:docs:en                       # 영어 LLMS 파일 생성
pnpm llms:docs:ko                       # 한국어 LLMS 파일 생성
```

---

**참고**: `work-next` 명령어는 LLMS Generator의 핵심 워크플로 도구로, 효율적인 문서 작업 관리를 위해 설계되었습니다. 2024년 업데이트로 Top N 우선순위 표시 기능이 추가되어 더욱 효율적인 작업 계획 수립이 가능합니다.