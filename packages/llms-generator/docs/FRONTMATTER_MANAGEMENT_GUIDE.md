# YAML 프론트매터 관리 시스템 가이드

Context-Action 프레임워크의 문서 작업 플로우를 위한 프론트매터 자동 관리 시스템입니다.

## 🎯 개요

이 시스템은 Git Hook(Husky)와 연동하여 문서 변경사항을 자동으로 감지하고 YAML 프론트매터를 업데이트합니다. **work-next** 명령어와 연동하여 문서 작업 상태를 정확하게 추적합니다.

## 📋 프론트매터 필드 정의

### 필수 메타데이터
```yaml
---
# 문서 식별
document_id: string              # 문서 고유 ID (예: guide--action-handlers)
category: string                 # 카테고리 (guide|api|concept|examples)
source_path: string              # 원본 문서 경로
character_limit: number          # 문자 제한 (100|300|1000|2000|5000)

# 시간 추적
last_update: ISO8601            # 마지막 업데이트 시간
source_last_modified: ISO8601  # 원본 문서 수정 시간
content_hash: string            # 원본 내용 해시

# 상태 관리
completion_status: enum         # 완료 상태
workflow_stage: enum           # 워크플로 단계
update_status: enum            # 업데이트 상태

# 품질 메트릭
priority_score: number          # 우선순위 점수 (0-100)
quality_score: number          # 품질 점수 (0-100)
content_length: number         # 실제 내용 길이

# 작업자 정보
last_editor: string            # 마지막 편집자
review_required: boolean       # 리뷰 필요 여부
---
```

## 🔄 완료 상태 (completion_status) 생명주기

### 상태 전환 다이어그램
```
template → draft → review → completed
    ↓        ↓       ↓        ↓
 (초기생성)  (작성중)  (검토중)  (완료)
```

### 각 상태 정의

#### 📋 `template` (템플릿)
- **조건**: Placeholder 텍스트 포함, 실제 내용 없음
- **특징**: 
  - `여기에 ... 작성하세요` 포함
  - `Provide comprehensive guidance on` 포함
  - 실제 요약 내용 30자 미만
- **work-next 표시**: 🔴 Missing Priority JSON 또는 🟡 Missing Template

#### ✏️ `draft` (초안)
- **조건**: 일부 placeholder 제거, 실제 내용 작성 시작
- **특징**:
  - 실제 내용 30자 이상
  - 일부 placeholder 여전히 존재 가능
  - 구조화되지 않은 텍스트
- **work-next 표시**: 🟠 Needs Content

#### 👀 `review` (검토)
- **조건**: 내용 작성 완료, 품질 검토 필요
- **특징**:
  - Placeholder 없음
  - 체계적인 구조 (제목, 목록 등)
  - 50단어 이상의 구조화된 내용
- **work-next 표시**: 🟠 Needs Content (검토 대기)

#### ✅ `completed` (완료)
- **조건**: 검토 완료, 최종 승인
- **특징**:
  - 모든 placeholder 제거
  - 높은 품질 점수 (80+ 권장)
  - 프레임워크 맥락 포함
- **work-next 표시**: ✅ Completed (작업 대기열에서 제외)

## 🔧 워크플로 단계 (workflow_stage)

1. **`template_generation`**: 템플릿 생성
2. **`content_drafting`**: 내용 초안 작성  
3. **`content_review`**: 내용 검토
4. **`quality_validation`**: 품질 검증
5. **`final_approval`**: 최종 승인
6. **`published`**: 게시 완료

## 🤖 자동 업데이트 규칙

### Git Hook 트리거 (Husky)

#### Pre-commit Hook
```bash
# 원본 문서 변경 감지
CHANGED_DOCS=$(git diff --cached --name-only | grep -E '^docs/.+\.md$')

# 템플릿 문서 변경 감지  
CHANGED_TEMPLATES=$(git diff --cached --name-only | grep -E '^data/.+\.md$')
```

#### 자동 업데이트 시나리오

**시나리오 1: 원본 문서 수정**
```bash
# 사용자가 docs/en/guide/action-handlers.md 수정
git add docs/en/guide/action-handlers.md
git commit -m "Update action handlers guide"

# 자동 실행:
# 1. 원본 문서 해시 계산
# 2. 모든 관련 템플릿의 프론트매터 업데이트:
#    - source_last_modified: 새로운 타임스탬프
#    - content_hash: 새로운 해시
#    - update_status: "source_updated"
```

**시나리오 2: 템플릿 내용 수정**
```bash
# 사용자가 template 내용 작성
git add data/en/guide--action-handlers/guide--action-handlers-100.md
git commit -m "Complete action handlers summary"

# 자동 실행:
# 1. 템플릿 내용 분석
# 2. Placeholder 존재 여부 확인
# 3. 품질 점수 계산
# 4. 프론트매터 업데이트:
#    - completion_status: "template" → "completed"
#    - workflow_stage: "template_generation" → "published"  
#    - quality_score: 85
#    - content_length: 98
```

### 품질 점수 계산 알고리즘

```typescript
function calculateQualityScore(content: string): number {
  let score = 0;
  
  // 길이 평가 (0-30점)
  if (content.length > 100) score += 30;
  else if (content.length > 50) score += 20;
  else if (content.length > 30) score += 10;
  
  // 구조 평가 (0-20점)
  if (content.includes(':')) score += 10; // 정의 구조
  if (content.includes('Context-Action')) score += 10; // 프레임워크 언급
  
  // 완성도 평가 (0-30점)
  const hasNoPlaceholders = !content.includes('여기에') && 
                           !content.includes('Provide comprehensive guidance');
  if (hasNoPlaceholders) score += 30;
  
  // 언어 일관성 (0-20점)
  const hasKorean = /[가-힣]/.test(content);
  const hasEnglish = /[a-zA-Z]/.test(content);
  if (hasKorean && hasEnglish) score += 20;
  
  return Math.min(score, 100);
}
```

## 🛠️ CLI 명령어 사용법

### 프론트매터 검증
```bash
# 모든 템플릿 검증
npx llms-generator frontmatter validate

# 특정 언어만 검증
npx llms-generator frontmatter validate --language=ko

# 특정 카테고리만 검증  
npx llms-generator frontmatter validate --category=guide
```

### 프론트매터 업데이트
```bash
# 모든 프론트매터 업데이트
npx llms-generator frontmatter update

# 드라이런으로 확인
npx llms-generator frontmatter update --dry-run

# 특정 문서만 업데이트
npx llms-generator frontmatter update --document-id=guide--action-handlers
```

### 원본 문서와 동기화
```bash
# 모든 원본 문서와 동기화
npx llms-generator frontmatter sync

# 특정 언어만 동기화
npx llms-generator frontmatter sync --language=en
```

### 상태 보고서
```bash
# 전체 프론트매터 현황
npx llms-generator frontmatter status

# 카테고리별 현황
npx llms-generator frontmatter status --category=api
```

### 문제 수정
```bash
# 프론트매터 오류 자동 수정
npx llms-generator frontmatter repair

# 드라이런으로 수정 내용 확인
npx llms-generator frontmatter repair --dry-run
```

## 🔗 work-next 명령어와의 연동

### 완료 상태 확인
```bash
# 다음 작업 항목 확인
npx llms-generator work-next

# 완료된 항목도 함께 보기
npx llms-generator work-next --show-completed

# 특정 상태만 확인
npx llms-generator work-next --language=ko --category=guide
```

### 실제 작업 플로우
```bash
# 1. 다음 작업 확인
npx llms-generator work-next

# 2. 권장된 템플릿 파일 편집
code "/path/to/template/file.md"

# 3. 실제 요약 내용 작성 (placeholder 제거)

# 4. Git 커밋 (자동으로 프론트매터 업데이트됨)
git add data/ko/guide--action-handlers/guide--action-handlers-100.md
git commit -m "Complete action handlers 100-char summary"

# 5. 상태 확인
npx llms-generator work-next --show-completed
```

## 📊 프론트매터 상태 보고서 예시

```bash
$ npx llms-generator frontmatter status

📊 Frontmatter Status Report

Total Templates: 172

📋 By Completion Status:
   🟠 template: 140 (81.4%)
   ✏️  draft: 25 (14.5%)
   👀 review: 5 (2.9%)
   ✅ completed: 2 (1.2%)

🔄 By Workflow Stage:
   📍 template_generation: 140 (81.4%)
   📍 content_drafting: 25 (14.5%)
   📍 content_review: 5 (2.9%)
   📍 published: 2 (1.2%)

⚠️  Issues:
   Needs Update: 8
   Errors: 0

💡 Recommendations:
   Run: npx llms-generator frontmatter update --dry-run
   Then: npx llms-generator frontmatter update
```

## 🚨 문제 해결

### 일반적인 문제들

**프론트매터 필드 누락**
```bash
❌ Missing required field: completion_status

# 해결:
npx llms-generator frontmatter repair
```

**상태와 내용 불일치**
```bash
❌ Status is "completed" but content still contains placeholders

# 해결: 템플릿 내용에서 placeholder 텍스트 제거
```

**소스 파일 경로 오류**
```bash
⚠️  Source file not found: en/guide/action-handlers.md

# 해결: 원본 파일 존재 확인 또는 source_path 수정
```

### Husky Hook 문제

**Hook 실행 실패**
```bash
# Hook 권한 확인
chmod +x .husky/pre-commit

# 의존성 설치 확인
npm install gray-matter glob
```

**TypeScript 컴파일 오류**
```bash
# TypeScript 경로 확인
npx tsx packages/llms-generator/src/cli/hooks/update-frontmatter.ts --help
```

## 📈 성능 및 확장성

### 최적화 기능
- **증분 업데이트**: 변경된 파일만 처리
- **병렬 처리**: 여러 템플릿 동시 처리
- **캐싱**: 해시 기반 변경 감지
- **배치 처리**: 대량 파일 효율적 처리

### 확장 가능성
- **새로운 상태 추가**: enum 값 확장 가능
- **커스텀 품질 메트릭**: 계산 알고리즘 확장
- **다국어 지원**: 언어별 검증 규칙
- **외부 도구 연동**: CI/CD 파이프라인 통합

## 🎯 베스트 프랙티스

### 개발자 워크플로
1. **커밋 전**: 항상 `work-next`로 현재 상태 확인
2. **내용 작성**: Placeholder 완전 제거 후 실제 요약 작성
3. **품질 확인**: 프레임워크 맥락과 핵심 개념 포함
4. **검증**: `frontmatter validate`로 일관성 확인
5. **커밋**: Git hook이 자동으로 메타데이터 업데이트

### 팀 협업
- **상태 공유**: `frontmatter status`로 팀 진행 상황 공유
- **리뷰 프로세스**: `review` 상태에서 팀 검토 진행
- **품질 기준**: 80점 이상 품질 점수 목표
- **일관성 유지**: 정기적인 `validate` 실행

이 시스템을 통해 문서 작업의 생산성을 크게 향상시키고, 일관된 품질의 문서를 유지할 수 있습니다!