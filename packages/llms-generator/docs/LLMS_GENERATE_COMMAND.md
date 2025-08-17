# LLMS-TXT 생성 시스템 (llms-generate)

LLMS-TXT 생성 시스템은 완료된 문서들을 기반으로 다양한 필터링 옵션과 패턴을 사용하여 LLM 학습용 텍스트 파일을 생성하는 포괄적인 CLI 도구입니다.

## 📋 목차

- [개요](#개요)
- [기본 사용법](#기본-사용법)
- [필터링 옵션](#필터링-옵션)
- [생성 패턴](#생성-패턴)
- [고급 옵션](#고급-옵션)
- [실제 사용 예시](#실제-사용-예시)
- [출력 파일 구조](#출력-파일-구조)
- [문제 해결](#문제-해결)

## 개요

LLMS-TXT 생성 시스템은 Context-Action 프레임워크의 문서화 워크플로우에서 마지막 단계로, 완료된 요약 문서들을 수집하고 필터링하여 다양한 형태의 LLMS 학습용 텍스트 파일을 생성합니다.

### 주요 기능

- **문자 제한 필터링**: 특정 문자 수로 제한된 요약 문서만 선택
- **카테고리 필터링**: 특정 카테고리(guide, api, concept 등)의 문서만 선택
- **결합 필터링**: 문자 제한과 카테고리를 동시에 적용
- **다양한 생성 패턴**: standard, minimum, origin 패턴 지원
- **정렬 옵션**: 우선순위, 카테고리, 알파벳 순으로 정렬
- **미리보기 모드**: 실제 파일 생성 없이 결과 확인

## 기본 사용법

### 명령어 구문

```bash
npx @context-action/llms-generator llms-generate [options]
```

### 기본 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--chars=<number>` | 문자 제한 필터링 | 모든 문자 제한 |
| `--category=<name>` | 카테고리 필터링 | 모든 카테고리 |
| `--lang=<language>` | 언어 선택 | 설정의 기본 언어 |
| `--pattern=<type>` | 생성 패턴 | standard |
| `--sort-by=<method>` | 정렬 방법 | priority |
| `--output-dir=<path>` | 출력 디렉토리 | 설정의 출력 디렉토리 |
| `--no-metadata` | 메타데이터 제외 | false |
| `--dry-run` | 미리보기 모드 | false |
| `--verbose` | 상세 정보 출력 | false |

## 필터링 옵션

### 문자 제한 필터링

특정 문자 수로 제한된 요약 문서만 선택합니다.

```bash
# 100자 요약 문서만 포함
npx @context-action/llms-generator llms-generate --chars=100

# 300자 요약 문서만 포함
npx @context-action/llms-generator llms-generate --chars=300
```

### 카테고리 필터링

특정 카테고리의 문서만 선택합니다.

```bash
# API 문서만 포함
npx @context-action/llms-generator llms-generate --category=api

# 가이드 문서만 포함
npx @context-action/llms-generator llms-generate --category=guide

# 개념 설명 문서만 포함
npx @context-action/llms-generator llms-generate --category=concept
```

### 결합 필터링

문자 제한과 카테고리를 동시에 적용할 수 있습니다.

```bash
# 100자 API 문서만 포함
npx @context-action/llms-generator llms-generate --chars=100 --category=api

# 300자 가이드 문서만 포함
npx @context-action/llms-generator llms-generate --chars=300 --category=guide
```

## 생성 패턴

### Standard 패턴 (기본)

표준 LLMS 형태로 문서들을 순서대로 나열합니다.

```bash
npx @context-action/llms-generator llms-generate --pattern=standard
```

**출력 구조:**
- 헤더 정보
- 문서 컬렉션 메타데이터
- 개별 문서들의 제목과 내용
- 각 문서의 카테고리, 우선순위, 길이 정보

### Minimum 패턴

네비게이션 링크 형태로 문서 목록을 제공합니다.

```bash
npx @context-action/llms-generator llms-generate --pattern=minimum
```

**출력 구조:**
- 문서 네비게이션 헤더
- 빠른 시작 경로 (우선순위 높은 문서 4개)
- 카테고리별 문서 목록
- 각 문서의 간략한 설명

### Origin 패턴

완전한 문서 내용을 포함합니다.

```bash
npx @context-action/llms-generator llms-generate --pattern=origin
```

**출력 구조:**
- 완전한 문서 컬렉션 헤더
- 각 문서의 전체 내용
- 우선순위 및 카테고리 정보

## 고급 옵션

### 정렬 방법

문서의 정렬 순서를 지정할 수 있습니다.

```bash
# 우선순위 순으로 정렬 (기본)
npx @context-action/llms-generator llms-generate --sort-by=priority

# 카테고리별로 정렬
npx @context-action/llms-generator llms-generate --sort-by=category

# 알파벳 순으로 정렬
npx @context-action/llms-generator llms-generate --sort-by=alphabetical
```

### 언어 선택

특정 언어의 문서만 처리합니다.

```bash
# 한국어 문서
npx @context-action/llms-generator llms-generate --lang=ko

# 영어 문서
npx @context-action/llms-generator llms-generate --lang=en
```

### 출력 제어

```bash
# 사용자 지정 출력 디렉토리
npx @context-action/llms-generator llms-generate --output-dir=./custom-output

# 메타데이터 제외
npx @context-action/llms-generator llms-generate --no-metadata

# 상세 정보와 함께 미리보기
npx @context-action/llms-generator llms-generate --dry-run --verbose
```

## 실제 사용 예시

### 시나리오 1: API 문서 100자 요약 생성

```bash
# 100자 API 문서들의 네비게이션 형태 LLMS 생성
npx @context-action/llms-generator llms-generate \
  --chars=100 \
  --category=api \
  --pattern=minimum \
  --lang=ko
```

**출력 파일:** `llms-ko-100chars-api-minimum.txt`

### 시나리오 2: 전체 가이드 문서의 완전한 내용

```bash
# 모든 가이드 문서의 완전한 내용 생성
npx @context-action/llms-generator llms-generate \
  --category=guide \
  --pattern=origin \
  --sort-by=priority \
  --lang=ko
```

**출력 파일:** `llms-ko-guide-origin.txt`

### 시나리오 3: 다국어 표준 LLMS 생성

```bash
# 영어 300자 문서들의 표준 형태 생성
npx @context-action/llms-generator llms-generate \
  --chars=300 \
  --lang=en \
  --pattern=standard \
  --verbose

# 한국어 300자 문서들의 표준 형태 생성
npx @context-action/llms-generator llms-generate \
  --chars=300 \
  --lang=ko \
  --pattern=standard \
  --verbose
```

### 시나리오 4: 미리보기 및 검증

```bash
# 생성 예정 내용 미리보기
npx @context-action/llms-generator llms-generate \
  --chars=100 \
  --category=concept \
  --dry-run \
  --verbose
```

**출력 예시:**
```
📊 Dry Run Summary:
   Would generate LLMS file with:
   • 5 documents
   • 1,234 total characters
   • Pattern: standard
   • Language: ko
   • Character Limit: 100
   • Category: concept
```

## 출력 파일 구조

### 파일명 규칙

생성되는 파일명은 다음 패턴을 따릅니다:

```
llms-{language}[-{characterLimit}chars][-{category}][-{pattern}].txt
```

**예시:**
- `llms-ko.txt` - 한국어 표준 LLMS
- `llms-en-100chars.txt` - 영어 100자 제한 LLMS
- `llms-ko-api.txt` - 한국어 API 카테고리 LLMS
- `llms-en-300chars-guide-minimum.txt` - 영어 300자 가이드 네비게이션 LLMS

### 파일 내용 구조

#### 헤더 섹션
```
# Context-Action Framework - {타이틀}

Generated: 2025-08-17
Type: {패턴 타입}
Language: {언어}

{설명}
```

#### 메타데이터 섹션 (--no-metadata가 아닌 경우)
```
## Document Collection Metadata

**Total Documents**: 15
**Categories**: guide, api, concept
**Character Limits**: 100, 300
**Total Characters**: 4,567
**Average Quality Score**: 85.2

**Filters Applied**:
- Language: ko
- Character Limit: 100
- Category: api
```

#### 콘텐츠 섹션
패턴에 따라 다른 구조로 제공됩니다.

#### 푸터
```
---

*Generated automatically on 2025-08-17*
```

## 문제 해결

### 문서를 찾을 수 없는 경우

```bash
❌ No documents found matching the specified criteria

📋 Filter Criteria:
   Language: ko
   Character Limit: 100
   Category: nonexistent
   Pattern: standard

💡 Try adjusting your filters or check if documents exist with these criteria.
```

**해결 방법:**
1. 필터 조건 확인
2. 문서 상태 확인 (`work-next` 명령어 사용)
3. 완료되지 않은 문서가 있는지 확인

### 지원되지 않는 언어

```bash
❌ Unsupported language: unsupported. Supported: ko, en
```

**해결 방법:**
1. `llms-generator.config.json`에서 지원 언어 확인
2. 올바른 언어 코드 사용

### 권한 오류

```bash
❌ Error: EACCES: permission denied, mkdir '/output'
```

**해결 방법:**
1. 출력 디렉토리 권한 확인
2. `--output-dir` 옵션으로 다른 디렉토리 지정
3. 상대 경로 사용

### 빈 파일 생성

완료되지 않은 문서들은 자동으로 제외됩니다. 다음을 확인하세요:

1. **템플릿 상태**: 플레이스홀더 텍스트가 있는 문서는 제외
2. **콘텐츠 길이**: 30자 미만의 내용은 불완전으로 간주
3. **완료 상태**: frontmatter의 `completion_status`가 `completed`인지 확인

### 성능 최적화

대량의 문서 처리 시:

```bash
# 메타데이터 제외로 속도 향상
npx @context-action/llms-generator llms-generate --no-metadata

# 특정 필터로 범위 축소
npx @context-action/llms-generator llms-generate --chars=100 --category=api
```

## 모니터링 및 통계

### 생성 과정 모니터링

```bash
# 상세 정보와 함께 실행
npx @context-action/llms-generator llms-generate --verbose

# 미리보기로 예상 결과 확인
npx @context-action/llms-generator llms-generate --dry-run --verbose
```

### 문서 상태 확인

LLMS 생성 전에 문서 상태를 확인하는 것이 좋습니다:

```bash
# 다음 작업할 문서 확인
npx @context-action/llms-generator work-next

# 특정 카테고리의 완료 상태 확인
npx @context-action/llms-generator work-next --category=api --show-completed
```

## 관련 명령어

### 워크플로우 연계

1. **문서 상태 확인**: `work-next`
2. **우선순위 생성**: `priority-generate`
3. **템플릿 생성**: `template-generate`
4. **LLMS 생성**: `llms-generate` ← 현재 명령어

### 기존 LLMS 생성 도구와의 차이점

| 명령어 | 용도 | 필터링 | 패턴 |
|--------|------|--------|------|
| `llms-generate` | 포괄적 LLMS 생성 | 문자수 + 카테고리 | 3가지 패턴 |
| `simple-llms-generate` | 단순 결합 | 문자수만 | 1가지 패턴 |
| `minimum`/`origin` | 기본 생성 | 없음 | 고정 패턴 |

## 통합 워크플로우 예시

완전한 LLMS 생성 워크플로우:

```bash
# 1. 프로젝트 상태 확인
npx @context-action/llms-generator work-next

# 2. 필요시 우선순위 및 템플릿 생성
npx @context-action/llms-generator init

# 3. 미리보기로 생성 계획 확인
npx @context-action/llms-generator llms-generate --dry-run --verbose

# 4. 실제 LLMS 파일 생성
npx @context-action/llms-generator llms-generate --chars=100 --pattern=minimum

# 5. 다른 패턴으로 추가 생성
npx @context-action/llms-generator llms-generate --category=api --pattern=origin
```

이 문서화를 통해 LLMS-TXT 생성 시스템의 모든 기능을 효과적으로 활용할 수 있습니다.