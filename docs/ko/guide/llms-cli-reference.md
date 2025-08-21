# LLMS Generator CLI 명령어 참조

다국어 문서 처리 기능을 포함한 LLMS Generator CLI 시스템의 완전한 명령어 참조서입니다.

## 핵심 명령어

### 문서 처리

#### `sync-docs`

변경된 문서 파일을 자동으로 처리하고 우선순위 메타데이터와 함께 템플릿을 생성합니다.

```bash
# 기본 사용법
pnpm llms:sync-docs --changed-files docs/en/guide/example.md

# 언어별 처리
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/example.md
pnpm llms:sync-docs:en --changed-files docs/en/guide/example.md

# 고급 언어 필터링
node cli.js sync-docs --languages ko,en --changed-files files...
node cli.js sync-docs --only-korean --changed-files files...
node cli.js sync-docs --no-korean --changed-files files...

# 미리보기 모드
pnpm llms:sync-docs:dry --changed-files files...
```

**옵션:**
- `--changed-files <files>`: 쉼표로 구분된 변경된 마크다운 파일 목록
- `--only-korean`: 한국어 문서만 처리 🇰🇷
- `--only-english`: 영어 문서만 처리 🇺🇸
- `--languages <langs>`: 쉼표로 구분된 특정 언어들 처리
- `--include-korean` / `--no-korean`: 한국어 문서 처리 제어
- `--dry-run`: 수정 없이 변경사항 미리보기
- `--force`: 최소 변경사항이라도 강제 업데이트
- `--quiet`: 상세 출력 억제

#### `generate-templates`

기존 문서에 대한 글자 수 제한 템플릿을 생성합니다.

```bash
pnpm llms:generate-templates [옵션]
```

**옵션:**
- `-l, --language <lang>`: 대상 언어 (en, ko)
- `--category <category>`: 특정 문서 카테고리
- `--character-limits <limits>`: 쉼표로 구분된 글자 수 제한
- `--overwrite`: 기존 템플릿 덮어쓰기
- `--dry-run`: 파일 생성 없이 미리보기
- `-v, --verbose`: 상세 출력

### 우선순위 관리

#### `priority-stats`

포괄적인 우선순위 분포 통계를 표시합니다.

```bash
pnpm llms:priority-stats [--quiet]
```

**출력 내용:**
- 총 문서 수 및 평균 우선순위 점수
- 우선순위 등급별 분포 (critical, high, medium, low)
- 카테고리 및 언어별 세분화
- 통계적 지표 (범위, 표준편차)

#### `priority-health`

우선순위 일관성을 평가하고 문제점을 식별합니다.

```bash
pnpm llms:priority-health [--quiet]
```

**건강도 점수:**
- **우수 (85-100)**: 균형 잡히고 일관된 우선순위
- **양호 (70-84)**: 경미한 불일치, 쉽게 해결 가능
- **보통 (50-69)**: 주목할 만한 문제, 개선 필요
- **불량 (0-49)**: 심각한 문제, 즉시 조치 필요

#### `priority-suggest`

현재 상태를 기반으로 실행 가능한 권고사항을 제공합니다.

```bash
pnpm llms:priority-suggest [--document-id <id>] [--quiet]
```

#### `priority-auto`

정의된 기준에 따라 우선순위를 자동으로 재계산합니다.

```bash
pnpm llms:priority-auto [--criteria <file>] [--force] [--quiet]
```

### 프로젝트 관리

#### `init`

새 프로젝트에서 LLMS Generator를 초기화합니다.

```bash
pnpm llms:init [옵션]
```

**옵션:**
- `--dry-run`: 변경 없이 초기화 미리보기
- `--overwrite`: 기존 설정 덮어쓰기
- `--quiet`: 출력 억제
- `--skip-priority`: 우선순위 파일 생성 건너뛰기
- `--skip-templates`: 템플릿 생성 건너뛰기
- `-l, --language <lang>`: 기본 언어 설정

#### `work-next`

우선순위를 기반으로 다음에 작업할 문서 항목을 찾습니다.

```bash
pnpm llms:work-next [옵션]
```

**옵션:**
- `-l, --language <lang>`: 언어별 필터링
- `--show-completed`: 완료된 항목 포함
- `-v, --verbose`: 상세 정보 표시

## 고급 기능

### 언어 처리 매트릭스

| 명령어 | 한국어 지원 | 영어 지원 | 다중언어 | 필터링 |
|---------|-------------|-----------|----------|--------|
| `sync-docs` | ✅ | ✅ | ✅ | ✅ |
| `generate-templates` | ✅ | ✅ | ✅ | ✅ |
| `priority-*` | ✅ | ✅ | ✅ | ❌ |
| `work-next` | ✅ | ✅ | ❌ | ✅ |

### 자동화 워크플로우

#### Post-commit 훅

문서 파일 변경 시 자동으로 실행됩니다:

```bash
# 자동 감지 및 처리
docs/en/guide/example.md → llmsData/en/guide/example-*.md + priority.json
docs/ko/guide/example.md → llmsData/ko/guide/example-*.md + priority.json
```

**기능:**
- `docs/(en|ko)/**/*.md` 패턴의 변경사항 감지
- 7개 글자 수 제한 템플릿 생성 (100, 200, 300, 500, 1000, 2000, 5000)
- 메타데이터가 포함된 priority.json 생성
- 소스 변경사항과 별도로 LLMS 파일 커밋
- 향상된 디버깅 및 오류 처리

#### NPM 스크립트

```bash
# 문서 처리
pnpm llms:sync-docs              # 모든 언어 처리
pnpm llms:sync-docs:ko           # 한국어만
pnpm llms:sync-docs:en           # 영어만
pnpm llms:sync-docs:dry          # 미리보기 모드

# 우선순위 관리
pnpm llms:priority-stats         # 통계
pnpm llms:priority-health        # 건강도 확인
pnpm llms:priority-auto          # 자동 계산
pnpm llms:priority-suggest       # 권고사항

# 템플릿 생성
pnpm llms:generate-templates     # 모든 템플릿 생성
pnpm llms:init                   # 프로젝트 초기화

# 유틸리티
pnpm llms:work-next             # 다음 작업 항목 찾기
```

## 설정

### 환경 설정

시스템은 사용자 정의 동작을 위한 설정 파일을 준수합니다:

```json
{
  "paths": {
    "llmContentDir": "./llmsData",
    "docsDir": "./docs"
  },
  "generation": {
    "supportedLanguages": ["en", "ko"],
    "characterLimits": [100, 200, 300, 500, 1000, 2000, 5000],
    "defaultLanguage": "en"
  }
}
```

### 사용자 정의 우선순위 기준

자동 우선순위 계산을 위한 사용자 정의 기준 파일 생성:

```json
{
  "documentSize": { "weight": 0.4, "method": "linear" },
  "category": { 
    "weight": 0.3, 
    "values": { "guide": 90, "concept": 80, "examples": 70 }
  },
  "keywordDensity": { "weight": 0.2, "method": "logarithmic" },
  "relationships": { "weight": 0.1, "method": "network" }
}
```

## 모범 사례

### 언어별 워크플로우

**한국어 문서:**
```bash
# 한국어 문서 생성
vim docs/ko/guide/new-feature.md

# 한국어만 처리
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/new-feature.md

# 한국어 우선순위 확인
pnpm llms:work-next --language ko
```

**영어 문서:**
```bash
# 영어 문서 생성
vim docs/en/guide/new-feature.md

# 영어만 처리
pnpm llms:sync-docs:en --changed-files docs/en/guide/new-feature.md

# 영어 우선순위 확인
pnpm llms:work-next --language en
```

### 팀 협업

**일일 워크플로우:**
```bash
# 1. 시스템 건강도 확인
pnpm llms:priority-health

# 2. 다음 작업 항목 찾기
pnpm llms:work-next --verbose

# 3. 작업 완료 후 필요시 동기화
pnpm llms:sync-docs --changed-files docs/path/to/modified.md
```

**주간 유지보수:**
```bash
# 1. 전체 시스템 분석
pnpm llms:priority-stats

# 2. 건강도 확인 및 제안사항
pnpm llms:priority-health
pnpm llms:priority-suggest

# 3. 필요시 자동 재계산
pnpm llms:priority-auto --force
```

## 오류 처리

### 일반적인 문제

**언어 처리 오류:**
- 파일 경로가 `docs/(en|ko)/**/*.md` 패턴과 일치하는지 확인
- 언어 필터링 옵션이 올바르게 지정되었는지 확인
- `pnpm build:llms-generator`로 LLMS Generator가 빌드되었는지 확인

**우선순위 불일치:**
- `pnpm llms:priority-health`를 실행하여 문제 식별
- 대량 재계산을 위해 `pnpm llms:priority-auto --force` 사용
- 사용자 정의 기준 파일의 올바른 JSON 형식 검토

**템플릿 생성 실패:**
- 소스 문서 형식 및 구조 확인
- 글자 수 제한에 충분한 내용 확인
- `llmsData/` 생성을 위한 디렉토리 권한 확인

### 디버그 모드

상세한 디버깅 출력 활성화:

```bash
# 모든 명령어에 대한 상세 출력
node cli.js <command> --verbose

# 변경사항 미리보기를 위한 드라이 런
node cli.js sync-docs --dry-run --changed-files files...

# 자동화 스크립트를 위한 조용한 모드
node cli.js <command> --quiet
```

---

::: tip 다음 단계
- post-commit 훅으로 자동화 워크플로우 설정
- 팀을 위한 언어별 처리 구성
- 정기적인 우선순위 건강도 모니터링 수립
- 문서 품질 게이트를 위한 CI/CD 파이프라인 통합
:::

::: warning 중요 사항
- 언어 필터링은 항상 `--dry-run`으로 먼저 테스트
- 대량 변경 후 우선순위 건강도 점수 모니터링
- 팀 구성원과 언어 처리 설정 조율
- 최신 기능을 위해 LLMS Generator 빌드를 최신 상태로 유지
:::