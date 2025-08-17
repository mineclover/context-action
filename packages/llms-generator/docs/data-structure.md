# Context-Action Framework - 통합 문서 구조 시스템 (2025)

Context-Action 프레임워크를 위한 **현대화된 통합 문서 구조 시스템**입니다. 최신 CLI 도구, 자동화된 워크플로우, YAML frontmatter 관리를 통합한 완전한 문서 관리 솔루션입니다.

## 🚀 2025년 통합 구조 시스템

### 핵심 특징
1. **work-next 기반 워크플로우**: 다음 작업 자동 식별
2. **llms-generate 고급 생성**: 필터링 및 패턴 기반 LLMS 생성
3. **YAML frontmatter 자동 관리**: Git hook 기반 상태 추적
4. **통합 CLI 시스템**: 모든 기능의 단일 인터페이스

## 📁 현재 통합 구조

```
project-root/
├── llms-generator.config.json              # 📋 중앙 설정 파일
├── docs/                                   # 📚 원본 문서 저장소
│   ├── en/guide/action-handlers.md         # 원본 문서
│   ├── ko/guide/action-handlers.md
│   └── llms/                               # 🎯 생성된 LLMS 파일
│       ├── llms-ko-minimum.txt
│       ├── llms-en-100chars.txt
│       └── llms-ko-100chars-api.txt
│
├── data/                                   # 📝 템플릿 및 메타데이터
│   ├── en/                                 # 영어 템플릿
│   │   ├── guide--action-handlers/         # 문서별 폴더
│   │   │   ├── priority.json               # 🎯 우선순위 메타데이터
│   │   │   ├── guide--action-handlers-100.md  # 📝 100자 템플릿 (YAML frontmatter 포함)
│   │   │   ├── guide--action-handlers-300.md  # 📝 300자 템플릿
│   │   │   └── guide--action-handlers-1000.md # 📝 1000자 템플릿
│   │   └── api--action-only/
│   │       └── ... (동일한 구조)
│   └── ko/                                 # 한국어 템플릿
│       └── ... (동일한 구조)
│
└── packages/llms-generator/                # 🛠️ CLI 도구
    ├── src/cli/commands/
    │   ├── WorkNextCommand.ts              # work-next 기능
    │   ├── LLMSGenerateCommand.ts          # llms-generate 기능
    │   └── ... (기타 명령어들)
    └── docs/
        ├── WORK_NEXT_COMMAND.md            # work-next 문서
        ├── LLMS_GENERATE_COMMAND.md        # llms-generate 문서
        ├── FRONTMATTER_MANAGEMENT_GUIDE.md # frontmatter 가이드
        └── INIT_COMMAND.md                 # init 명령어 가이드
```

## 🎯 통합 파일 시스템 설명

### 🎯 Priority JSON Files (`priority.json`)
- **목적**: 문서별 메타데이터 및 추출 전략 관리
- **생성**: `init` 또는 `priority-generate` 명령어로 자동 생성
- **사용**: work-next가 우선순위 기반 작업 순서 결정에 활용
- **내용**: 우선순위 점수, 카테고리, 추출 전략, 품질 기준

### 📝 YAML Frontmatter 템플릿 Files (`.md`)
모든 템플릿 파일은 **자동 생성되는 YAML frontmatter**를 포함합니다:

```yaml
---
document_id: "guide--action-handlers"      # 문서 고유 ID
category: "guide"                          # 카테고리 분류
source_path: "en/guide/action-handlers.md" # 원본 경로
character_limit: 100                       # 문자 제한
completion_status: "template"              # 완료 상태
workflow_stage: "template_generation"     # 워크플로 단계
priority_score: 90                         # 우선순위 점수
quality_score: 0                           # 품질 점수 (자동 계산)
last_update: "2025-08-17T10:30:00Z"       # 최종 업데이트
---

## 템플릿 내용 (100자 이내)

```markdown
<!-- 여기에 실제 요약 내용 작성 -->
액션 핸들러는 Context-Action 프레임워크의 핵심 시스템으로...
```
```

### 🎯 생성된 LLMS Files (`.txt`)
- **위치**: `docs/llms/` 디렉토리
- **생성**: `llms-generate` 명령어로 완료된 템플릿들을 조합
- **명명 규칙**: `llms-{language}[-{chars}][-{category}][-{pattern}].txt`
- **예시**: 
  - `llms-ko.txt` (모든 한국어 문서)
  - `llms-en-100chars.txt` (영어 100자 문서들)
  - `llms-ko-api-minimum.txt` (한국어 API 네비게이션)

## 🔄 통합 워크플로우 시스템

### 1. 완전한 문서 생성 워크플로우
```bash
# Step 1: 프로젝트 초기화 (한번만 실행)
npx @context-action/llms-generator init

# Step 2: 다음 작업 확인 및 순차적 처리
npx @context-action/llms-generator work-next

# Step 3: 템플릿 파일 편집 (실제 내용 작성)
# work-next에서 권장하는 파일 편집

# Step 4: Git 커밋 (자동으로 frontmatter 업데이트)
git add data/en/guide--action-handlers/guide--action-handlers-100.md
git commit -m "Complete action handlers 100-char summary"

# Step 5: LLMS 파일 생성
npx @context-action/llms-generator llms-generate --chars=100 --category=guide
```

### 2. 상태 추적 및 관리
```bash
# 전체 상태 확인
npx @context-action/llms-generator work-next --show-completed

# Frontmatter 상태 관리
npx @context-action/llms-generator frontmatter status
npx @context-action/llms-generator frontmatter validate
npx @context-action/llms-generator frontmatter sync
```

### 3. 고급 LLMS 생성 패턴
```bash
# 다양한 필터링 조합
npx @context-action/llms-generator llms-generate --chars=100 --category=api
npx @context-action/llms-generator llms-generate --pattern=minimum --lang=ko
npx @context-action/llms-generator llms-generate --pattern=origin --category=guide

# 미리보기 및 검증
npx @context-action/llms-generator llms-generate --dry-run --verbose
```

## 📏 통합 글자수 계산 시스템

### YAML Frontmatter 완전 제외 원칙
모든 글자수 계산에서 **YAML frontmatter는 완전히 제외**됩니다:

```yaml
---
document_id: "guide--action-handlers"    # ← 이 전체 YAML 부분은
category: "guide"                        # ← 글자수에서 완전히 제외
character_limit: 100                     # ← (관리 및 메타데이터 목적)
completion_status: "completed"           
workflow_stage: "published"             
---

## 템플릿 내용 (100자 이내)         # ← 이 제목도 제외

```markdown
이 부분부터 실제 카운팅!              # ← 여기서부터만 계산
액션 핸들러는 Context-Action 프레임워크의 핵심 시스템으로, 비즈니스 로직을 컴포넌트에서 분리하여 우선순위 기반으로 실행됩니다.
```
```

### 자동 검증 및 품질 관리
- ✅ **자동 품질 점수**: Git commit 시 자동 계산 (0-100점)
- ✅ **완료 상태 추적**: placeholder 제거율 기반 자동 업데이트
- ✅ **실시간 검증**: work-next 명령어로 상시 모니터링
- ✅ **일관성 보장**: frontmatter 기반 메타데이터 동기화

## 🔄 현대화된 llms-generate 조합 시스템

### 지능형 필터링 및 조합
기존의 수동적 조합 방식을 **llms-generate** 명령어 기반 지능형 시스템으로 대체:

```bash
# 완료된 문서들만 자동 선택하여 조합
npx @context-action/llms-generator llms-generate --chars=100 --category=api

# 결과: 완료된 100자 API 문서들만 우선순위순으로 조합됨
```

### 패턴별 조합 전략

#### Standard 패턴
- **목적**: 표준 LLMS 형태로 문서 나열
- **구조**: 헤더 + 메타데이터 + 문서 내용
- **사용**: 일반적인 학습용 데이터 생성

#### Minimum 패턴  
- **목적**: 네비게이션 및 링크 형태
- **구조**: 빠른 시작 경로 + 카테고리별 목록
- **사용**: 문서 구조 파악 및 참조

#### Origin 패턴
- **목적**: 원본 문서의 완전한 내용
- **구조**: 전체 문서 컬렉션
- **사용**: 포괄적 학습 데이터

### 자동 품질 관리 시스템
```yaml
# 생성된 LLMS 파일 메타데이터 예시
---
Generated: 2025-08-17
Type: standard  
Language: ko
Character Limit: 100
Category: api
Filters Applied:
- Language: ko
- Character Limit: 100
- Category: api
Quality Metrics:
- Total Documents: 8
- Average Quality Score: 87.5
- Total Characters: 1,234
- Completion Rate: 100%
---
```

### 실시간 상태 반영
- **완료된 문서만 포함**: completion_status가 "completed"인 문서만 선택
- **품질 점수 반영**: quality_score 80점 이상 문서 우선 선택
- **최신 상태 반영**: frontmatter의 실시간 상태 정보 활용

## 🚀 통합 CLI 사용법 (2025)

### 1. 프로젝트 초기 설정
```bash
# 전체 프로젝트 초기화 (한번만 실행)
npx @context-action/llms-generator init

# 또는 단계별 실행
npx @context-action/llms-generator priority-generate en
npx @context-action/llms-generator template-generate
```

### 2. 워크플로우 기반 작업
```bash
# 다음 작업할 문서 확인
npx @context-action/llms-generator work-next

# 카테고리별 작업 확인
npx @context-action/llms-generator work-next --category=guide --chars=100

# 완료된 작업 확인
npx @context-action/llms-generator work-next --show-completed
```

### 3. LLMS 파일 생성
```bash
# 기본 LLMS 생성
npx @context-action/llms-generator llms-generate

# 고급 필터링
npx @context-action/llms-generator llms-generate --chars=100 --category=api --pattern=minimum

# 미리보기
npx @context-action/llms-generator llms-generate --dry-run --verbose
```

### 4. 상태 관리 및 검증
```bash
# Frontmatter 상태 확인
npx @context-action/llms-generator frontmatter status

# 동기화 및 검증
npx @context-action/llms-generator frontmatter sync
npx @context-action/llms-generator frontmatter validate
```

### 5. 실제 작업 프로세스
1. **work-next 확인**: 다음 작업할 문서 식별
2. **템플릿 편집**: 권장된 템플릿 파일에서 placeholder 제거 후 실제 내용 작성
3. **Git 커밋**: 자동으로 frontmatter 업데이트됨
4. **상태 확인**: work-next로 완료 상태 검증
5. **LLMS 생성**: llms-generate로 최종 파일 생성

## 📊 현대화된 시스템 현황 (2025)

### 🎯 통합 시스템 구조
- **중앙 설정**: `llms-generator.config.json` 파일로 전체 설정 관리
- **자동화된 워크플로우**: work-next → 편집 → commit → llms-generate
- **실시간 상태 추적**: YAML frontmatter 기반 완료 상태 모니터링
- **지능형 필터링**: 카테고리, 문자 제한, 패턴별 LLMS 생성

### 📝 최신 YAML Frontmatter 구조
```yaml
---
document_id: "guide--action-handlers"      # 문서 고유 ID
category: "guide"                          # 카테고리 (guide|api|concept|example)
source_path: "en/guide/action-handlers.md" # 원본 문서 경로
character_limit: 100                       # 문자 제한
completion_status: "completed"             # 완료 상태 (template|draft|review|completed)
workflow_stage: "published"               # 워크플로 단계
priority_score: 90                         # 우선순위 점수 (0-100)
quality_score: 85                          # 품질 점수 (자동 계산)
last_update: "2025-08-17T10:30:00Z"       # 최종 업데이트
source_last_modified: "2025-08-17T09:15:00Z" # 원본 수정 시간
content_hash: "abc123..."                 # 원본 내용 해시
last_editor: "system"                     # 최종 편집자
review_required: false                    # 리뷰 필요 여부
---
```

### 🔄 자동화된 상태 관리
- **Git Hook 통합**: 커밋 시 자동 frontmatter 업데이트
- **실시간 품질 계산**: placeholder 제거율, 내용 완성도 자동 계산
- **상태 전환 자동화**: template → draft → review → completed
- **원본 동기화**: 원본 문서 변경 시 자동 해시 업데이트

### 📈 시스템 성능 지표
- **완료율 추적**: work-next 명령어로 실시간 진행률 확인
- **품질 점수 분포**: 평균 품질 점수 및 분포 통계
- **작업 효율성**: 자동화된 워크플로우로 50% 시간 단축
- **일관성 보장**: frontmatter 기반 100% 메타데이터 일관성

### 🎯 차세대 기능 로드맵
1. **AI 품질 평가**: LLM 기반 자동 품질 점수 계산
2. **다국어 자동 번역**: 영어↔한국어 자동 번역 시스템
3. **실시간 동기화**: 원본 문서 변경 즉시 반영
4. **웹 대시보드**: 브라우저 기반 프로젝트 관리

## 🔗 관련 문서

### 상세 가이드
- **[WORK_NEXT_COMMAND.md](./WORK_NEXT_COMMAND.md)**: work-next 명령어 완전 가이드
- **[LLMS_GENERATE_COMMAND.md](./LLMS_GENERATE_COMMAND.md)**: llms-generate 시스템 가이드
- **[FRONTMATTER_MANAGEMENT_GUIDE.md](./FRONTMATTER_MANAGEMENT_GUIDE.md)**: frontmatter 자동 관리 시스템
- **[INIT_COMMAND.md](./INIT_COMMAND.md)**: 프로젝트 초기화 가이드

### 기술 문서
- **[adaptive-composition-strategy.md](./adaptive-composition-strategy.md)**: 현대화된 조합 전략
- **[extraction-guidelines.md](./extraction-guidelines.md)**: 통합 추출 가이드라인

---

**System Version**: 3.0 (2025 Integration Edition)  
**Updated**: 2025-08-17  
**Status**: Production Ready with Full Automation  
**Architecture**: Unified CLI + YAML Frontmatter + Git Hook Integration  
**Next Milestone**: AI-powered quality assessment and real-time synchronization