# Document Extraction Guidelines (2025 Edition)

Context-Action 프레임워크의 **통합 문서 추출 시스템** 가이드입니다. 최신 CLI 도구와 자동화된 워크플로우를 반영하여 업데이트되었습니다.

## 🚀 현대화된 추출 워크플로우

### 1. work-next 기반 작업 식별
```bash
# 다음 작업할 문서 자동 식별
npx @context-action/llms-generator work-next

# 결과 예시:
🔴 Missing Priority JSON: guide--action-handlers
   📂 Source: docs/en/guide/action-handlers.md  
   📂 Priority JSON: data/en/guide--action-handlers/priority.json
   ▶️  Next: npx @context-action/llms-generator priority-generate en

🟠 Needs Content: api--action-only (100 chars)
   📂 Source: docs/en/api/action-only.md
   📂 Template: data/en/api--action-only/api--action-only-100.md  
   ▶️  Next: Edit template file with actual content
```

### 2. Frontmatter 기반 상태 관리
모든 템플릿 파일은 **자동 생성되는 YAML frontmatter**를 포함합니다:

```yaml
---
document_id: "guide--action-handlers"      # 문서 고유 ID
category: "guide"                          # 카테고리
source_path: "en/guide/action-handlers.md" # 원본 경로
character_limit: 100                       # 문자 제한
completion_status: "template"              # 완료 상태
workflow_stage: "template_generation"     # 워크플로 단계
priority_score: 90                         # 우선순위 점수
quality_score: 0                           # 품질 점수 (0-100)
last_update: "2025-08-17T10:30:00Z"       # 최종 업데이트
source_last_modified: "2025-08-17T09:15:00Z" # 원본 수정 시간
content_hash: "abc123..."                 # 원본 내용 해시
last_editor: "system"                     # 최종 편집자
review_required: false                    # 리뷰 필요 여부
---

## 템플릿 내용 (100자 이내)

```markdown
<!-- 여기에 100자 이내의 요약 내용을 작성하세요 -->

Provide comprehensive guidance on action handlers, focusing on Context-Action framework integration and core concepts with practical examples for effective implementation.
```
```

### 3. 자동 품질 검증 시스템
Git commit 시 **자동으로 frontmatter가 업데이트**됩니다:

```bash
# 템플릿 파일 편집 후 커밋
git add data/en/guide--action-handlers/guide--action-handlers-100.md
git commit -m "Complete action handlers 100-char summary"

# 자동 실행됩니다:
# 1. 내용 분석 (placeholder 검출)
# 2. 품질 점수 계산
# 3. completion_status 업데이트 (template → completed)
# 4. workflow_stage 업데이트 (template_generation → published)
```

## 📏 현대화된 글자수 계산 원칙

### YAML Frontmatter 제외 규칙
모든 글자수 계산에서 **YAML frontmatter는 완전히 제외**됩니다:

```yaml
---
document_id: "guide--action-handlers"    # ← 이 전체 YAML 부분은
category: "guide"                        # ← 글자수에서 완전히 제외
character_limit: 100                     # ← (관리 목적으로만 사용)
completion_status: "completed"           
---

## 템플릿 내용 (100자 이내)         # ← 이 부분도 제외

```markdown
이 부분부터 실제 카운팅 시작!          # ← 여기서부터만 계산
액션 핸들러는 Context-Action 프레임워크의 핵심 시스템으로, 비즈니스 로직을 컴포넌트에서 분리하여 우선순위 기반으로 실행됩니다.
```
```

### 자동 검증 도구
```bash
# 모든 문서의 글자수 자동 검증
npx @context-action/llms-generator work-next --show-completed

# frontmatter 상태 확인
npx @context-action/llms-generator frontmatter status

# 특정 카테고리만 확인
npx @context-action/llms-generator work-next --category=guide --chars=100
```

## 📝 현대화된 문자 제한 가이드라인

### 100자 (초간략 요약)
- **목적**: 핵심 개념만 포함
- **구조**: 단일 문장 또는 2개 짧은 문장
- **내용**: 프레임워크 명칭 + 핵심 기능 설명
- **예시**: "액션 핸들러는 Context-Action 프레임워크의 핵심 시스템으로, 비즈니스 로직을 컴포넌트에서 분리합니다."

### 300자 (요약형)
- **목적**: 주요 개념과 기본 사용법
- **구조**: 2-3개 문장으로 구성
- **내용**: 핵심 개념 + 간단한 사용 예시 + 주요 장점
- **예시**: 개념 설명 + "사용법은 useActionHandler() 훅으로..." + "이를 통해 컴포넌트 분리가 가능합니다."

### 500-1000자 (표준형)
- **목적**: 실용적 이해를 위한 포괄적 설명
- **구조**: 개념 + 예제 + 베스트 프랙티스
- **내용**: 상세 설명 + 2-3개 코드 예시 + 주의사항
- **코드**: 간단한 TypeScript/JavaScript 예제 포함

### 2000자+ (완전형)
- **목적**: 종합적 이해와 마스터리
- **구조**: 완전한 문서 형태
- **내용**: 상세 개념 + 다양한 예제 + 고급 사용법 + 문제해결
- **코드**: 완전한 구현 예제와 실제 사용 시나리오

## 🔄 자동화된 상태 관리 시스템

### 새로운 완료 상태 (completion_status)
- **`template`**: 초기 생성된 템플릿 (placeholder 포함)
- **`draft`**: 일부 내용 작성됨 (일부 placeholder 잔존)
- **`review`**: 내용 완성, 검토 대기 중
- **`completed`**: 최종 완성, LLMS 생성 가능

### 워크플로우 단계 (workflow_stage)
- **`template_generation`**: 템플릿 생성 단계
- **`content_drafting`**: 내용 초안 작성
- **`content_review`**: 내용 검토 중
- **`quality_validation`**: 품질 검증 중
- **`final_approval`**: 최종 승인 대기
- **`published`**: 게시 완료 (LLMS 생성 가능)

## 📁 통합 파일 구조

### 디렉토리 구조
```
data/
├── en/                                    # 영어 문서
│   ├── guide--action-handlers/            # 문서별 폴더
│   │   ├── priority.json                  # 우선순위 메타데이터
│   │   ├── guide--action-handlers-100.md  # 100자 템플릿
│   │   ├── guide--action-handlers-300.md  # 300자 템플릿
│   │   └── guide--action-handlers-1000.md # 1000자 템플릿
│   └── api--action-only/
│       └── ... (동일한 구조)
└── ko/                                    # 한국어 문서
    └── ... (동일한 구조)
```

### 파일명 규칙 (업데이트됨)
- **폴더**: `{category}--{document-name}/`
- **파일**: `{document-id}-{charLimit}.md`
- **예시**: `guide--action-handlers/guide--action-handlers-300.md`

## 🎯 현대화된 품질 기준

### 1. 자동 품질 점수 (0-100점)
```typescript
// 자동 계산되는 품질 점수
quality_score = (
  content_length_score * 0.3 +      // 적절한 길이
  structure_score * 0.2 +           // 구조화된 내용
  completeness_score * 0.3 +        // placeholder 제거율
  framework_relevance_score * 0.2   // 프레임워크 연관성
)
```

### 2. 완전성 검증
- **Placeholder 제거**: 모든 `여기에...`, `Provide comprehensive...` 제거
- **실제 내용**: Context-Action 프레임워크 관련 구체적 설명
- **문자 제한**: 목표의 ±10% 범위 (YAML 제외)
- **언어 일관성**: 한국어 문서는 한국어로, 영어 문서는 영어로

### 3. 통합 워크플로우 준수
- **work-next 활용**: 우선순위에 따른 순차적 작업
- **Git Hook 활용**: 자동 frontmatter 업데이트
- **품질 검증**: frontmatter status로 지속적 모니터링

## 🛠️ 실제 작업 프로세스

### 완전한 워크플로우 예시
```bash
# 1. 다음 작업 확인
npx @context-action/llms-generator work-next

# 2. 권장된 템플릿 파일 편집
code "data/en/guide--action-handlers/guide--action-handlers-100.md"

# 3. placeholder 텍스트를 실제 내용으로 교체
# Before: "<!-- 여기에 100자 이내의 요약 내용을 작성하세요 -->"
# After: "액션 핸들러는 Context-Action 프레임워크의 핵심 시스템으로..."

# 4. Git 커밋 (자동으로 frontmatter 업데이트됨)
git add data/en/guide--action-handlers/guide--action-handlers-100.md
git commit -m "Complete action handlers 100-char summary"

# 5. 완료 상태 확인
npx @context-action/llms-generator work-next --show-completed

# 6. LLMS 파일 생성
npx @context-action/llms-generator llms-generate --chars=100 --category=guide
```

---
**Version**: 2.0 (2025 Edition)  
**Updated**: 2025-08-17  
**Status**: Active Production Guidelines  
**Integration**: work-next, llms-generate, frontmatter management
