# Work Next Command Guide

LLMs Generator의 `work-next` 명령어는 다음에 작업할 문서를 자동으로 식별하고 구체적인 작업 방향을 제시하는 지능형 워크플로 도구입니다.

## 개요

`work-next` 명령어는 프로젝트의 모든 문서 상태를 분석하여 다음과 같은 정보를 제공합니다:

1. **우선순위 기반 다음 작업**: 가장 중요하고 시급한 작업 항목 식별
2. **작업 상태 분석**: 각 문서의 현재 상태와 필요한 작업 유형 분석
3. **구체적인 액션 가이드**: 다음 단계를 위한 명확한 명령어와 파일 경로 제공
4. **전체 현황 통계**: 프로젝트 전체의 작업 진행 상황 요약

## 기본 사용법

### 단순 실행
```bash
# 다음 작업 항목 확인
npx @context-action/llms-generator work-next

# 다음 3개 작업 항목 확인
npx @context-action/llms-generator work-next --limit=3
```

### 언어별 필터링
```bash
# 영어 문서만 확인
npx @context-action/llms-generator work-next --language=en
npx @context-action/llms-generator work-next --lang=en

# 한국어 문서만 확인
npx @context-action/llms-generator work-next --language=ko
```

### 문자 제한별 필터링
```bash
# 100자 요약 작업만 확인
npx @context-action/llms-generator work-next --chars=100

# 특정 문자 제한 조합
npx @context-action/llms-generator work-next --character-limit=300
```

### 카테고리별 필터링
```bash
# API 문서만 확인
npx @context-action/llms-generator work-next --category=api

# 가이드 문서만 확인
npx @context-action/llms-generator work-next --category=guide

# 개념 설명 문서만 확인
npx @context-action/llms-generator work-next --category=concept

# 예제 문서만 확인
npx @context-action/llms-generator work-next --category=examples
```

## 고급 옵션

### 정렬 방식 선택
```bash
# 우선순위 순 (기본값)
npx @context-action/llms-generator work-next --sort-by=priority

# 카테고리 순
npx @context-action/llms-generator work-next --sort-by=category

# 작업 상태 순
npx @context-action/llms-generator work-next --sort-by=status

# 수정된 날짜 순
npx @context-action/llms-generator work-next --sort-by=modified
```

### 완료된 항목 포함
```bash
# 완료된 항목도 표시
npx @context-action/llms-generator work-next --show-completed

# 완료된 항목만 표시 (상태 확인용)
npx @context-action/llms-generator work-next --show-completed --sort-by=status
```

### 조합 사용 예시
```bash
# 한국어 API 문서의 100자 요약 작업 상위 5개
npx @context-action/llms-generator work-next --lang=ko --category=api --chars=100 --limit=5

# 최근 수정된 가이드 문서들 확인
npx @context-action/llms-generator work-next --category=guide --sort-by=modified --limit=10

# 모든 완료된 작업 확인 (품질 검토용)
npx @context-action/llms-generator work-next --show-completed --sort-by=category
```

## 작업 상태 유형

`work-next`는 다음 4가지 상태로 문서를 분류합니다:

### 🔴 Missing Priority JSON
**상태**: `missing_priority`
**의미**: Priority JSON 파일이 없어서 문서 메타데이터 생성이 필요한 상태

**표시 예시**:
```
📊 Status: 🔴 Missing Priority JSON
```

**권장 액션**:
```bash
# Priority JSON 생성
npx @context-action/llms-generator priority-generate en --document-id guide--getting-started
```

### 🟡 Missing Template
**상태**: `missing_template`
**의미**: Priority JSON은 있지만 템플릿 파일이 생성되지 않은 상태

**표시 예시**:
```
📊 Status: 🟡 Missing Template
```

**권장 액션**:
```bash
# 템플릿 파일 생성
npx @context-action/llms-generator template-generate --document-id guide--getting-started --character-limit 100
```

### 🟠 Needs Content
**상태**: `needs_content`
**의미**: 템플릿 파일은 있지만 실제 요약 내용이 작성되지 않은 상태

**표시 예시**:
```
📊 Status: 🟠 Needs Content
```

**권장 액션**:
```bash
# 1. 원본 문서 읽기
cat "/path/to/source/document.md"

# 2. 템플릿 파일 편집
code "/path/to/template/document-100.md"

# 3. "템플릿 내용" 섹션에 실제 요약 작성
```

### ✅ Completed
**상태**: `completed`
**의미**: 모든 작업이 완료되어 실제 요약 내용이 작성된 상태

**표시 예시**:
```
📊 Status: ✅ Completed
```

## 출력 정보 설명

### 기본 정보
```
🎯 Next Work Item

📄 Document: guide--action-handlers          # 문서 ID
📁 Category: guide                           # 카테고리
🌐 Language: en                              # 언어
📏 Character Limit: 100                      # 문자 제한
⭐ Priority: 95                              # 우선순위 점수
📊 Status: 🟠 Needs Content                  # 현재 상태
📖 Source Size: 11.6 KB                     # 원본 문서 크기
```

### 파일 경로 정보
```
📂 File Paths:
   📄 Source: /path/to/docs/en/guide/action-handlers.md
   🏷️  Priority: /path/to/data/en/guide--action-handlers/priority.json
   📝 Template: /path/to/data/en/guide--action-handlers/guide--action-handlers-100.md
```

### 권장 액션
```
🔧 Recommended Actions:
   1. Read the source document:
      # Source document (11.6 KB)
      cat "/path/to/source/document.md"
   2. Edit the template file:
      # Template file
      code "/path/to/template/file.md"
   3. Write a concise summary in the "템플릿 내용" section
   4. Keep it under 100 characters
```

### 작업 대기열
```
📋 Work Queue (Next 4 items)

2. 🟠 guide--action-handlers (en/200)
   Priority: 95 | Category: guide
3. 🟠 api--action-only (en/100)
   Priority: 90 | Category: api
4. 🟠 concept--architecture (ko/100)
   Priority: 85 | Category: concept
5. 🟠 examples--basic-usage (en/300)
   Priority: 80 | Category: examples
```

### 통계 정보
```
📊 Summary Statistics

Total Items: 301                            # 전체 작업 항목 수

By Status:                                   # 상태별 분류
  🔴 Missing Priority JSON: 12
  🟡 Missing Template: 45
  🟠 Needs Content: 230
  ✅ Completed: 14

By Language:                                 # 언어별 분류
  🌐 en: 154
  🌐 ko: 147

By Category:                                 # 카테고리별 분류
  📁 guide: 84
  📁 api: 91
  📁 concept: 70
  📁 examples: 56
```

## 우선순위 시스템

### 우선순위 점수 계산
1. **Config 기반 카테고리 우선순위**:
   - guide: 95점 (최고 우선순위)
   - api: 90점
   - concept: 85점
   - examples: 80점

2. **Priority JSON 기반 점수**: 개별 문서의 priority.json에 설정된 점수

3. **상태별 우선순위**:
   - Missing Priority JSON: 1순위 (가장 기본적인 작업)
   - Missing Template: 2순위
   - Needs Content: 3순위
   - Completed: 4순위

### 정렬 알고리즘
```
1차: 우선순위 점수 (높은 점수 우선)
2차: 작업 상태 (Missing Priority > Missing Template > Needs Content > Completed)
3차: 카테고리 이름 (알파벳 순)
4차: 문서 ID (알파벳 순)
```

## 실전 워크플로 예시

### 1. 프로젝트 초기화 후 첫 작업
```bash
# 1. 전체 상황 파악
npx @context-action/llms-generator work-next --limit=10

# 2. Priority JSON이 없는 문서부터 처리
npx @context-action/llms-generator work-next --sort-by=status

# 3. 높은 우선순위 가이드 문서부터 시작
npx @context-action/llms-generator work-next --category=guide --limit=5
```

### 2. 특정 언어 집중 작업
```bash
# 1. 한국어 문서 현황 확인
npx @context-action/llms-generator work-next --lang=ko

# 2. 한국어 가이드 문서 우선 작업
npx @context-action/llms-generator work-next --lang=ko --category=guide

# 3. 100자 요약부터 순차적으로 작업
npx @context-action/llms-generator work-next --lang=ko --chars=100 --limit=5
```

### 3. 카테고리별 완성도 관리
```bash
# 1. API 문서 완성도 확인
npx @context-action/llms-generator work-next --category=api --show-completed

# 2. 미완성 API 문서만 보기
npx @context-action/llms-generator work-next --category=api

# 3. API 문서 우선순위별 작업
npx @context-action/llms-generator work-next --category=api --sort-by=priority --limit=10
```

### 4. 품질 관리 및 검토
```bash
# 1. 완료된 작업 품질 검토
npx @context-action/llms-generator work-next --show-completed --sort-by=modified

# 2. 최근 수정된 문서 확인
npx @context-action/llms-generator work-next --sort-by=modified --limit=20

# 3. 카테고리별 완성도 현황
npx @context-action/llms-generator work-next --show-completed --sort-by=category
```

## 템플릿 내용 작성 가이드

### 100자 요약 작성 팁
```markdown
## 템플릿 내용 (100자 이내)

```markdown
Context-Action의 Action Handler: 비즈니스 로직을 컴포넌트에서 분리하여 우선순위 기반으로 실행되는 핸들러 시스템입니다.
```
```

**주의사항**:
- 정확히 100자 이내로 작성 (한글 기준)
- 핵심 개념과 프레임워크 맥락 포함
- 구체적이고 명확한 설명
- 템플릿 placeholder 텍스트 완전 제거

### 200자 요약 작성 팁
```markdown
## 템플릿 내용 (200자 이내)

```markdown
Context-Action Action Handler는 React 컴포넌트에서 비즈니스 로직을 완전히 분리하는 핸들러 시스템입니다. useActionHandler 훅을 통해 등록되며, 우선순위 기반으로 순차 실행됩니다. payload와 controller를 통해 데이터 처리와 파이프라인 제어가 가능하며, 에러 처리와 결과 공유 메커니즘을 제공합니다.
```
```

### 300자 이상 요약 작성 팁
- 개념 정의 + 주요 기능 + 사용 방법 + 핵심 장점
- 코드 예시 포함 가능
- 관련 패턴이나 다른 기능과의 연관성 설명
- 실용적인 사용 사례 제시

## 다음 단계 통합 워크플로

### work-next → 작업 → 검증
```bash
# 1. 다음 작업 확인
npx @context-action/llms-generator work-next

# 2. 권장 액션 수행 (예: 100자 요약 작성)
code "/path/to/template/file-100.md"

# 3. 작업 완료 후 다음 항목 확인
npx @context-action/llms-generator work-next

# 4. 특정 문서의 모든 문자 제한 작업 완료 확인
npx @context-action/llms-generator work-next --document-id=guide--action-handlers --show-completed
```

### 배치 작업 모드
```bash
# 1. 같은 카테고리 10개 항목 확인
npx @context-action/llms-generator work-next --category=guide --limit=10

# 2. 같은 문자 제한으로 여러 문서 작업
npx @context-action/llms-generator work-next --chars=100 --limit=5

# 3. 완료 후 진행상황 확인
npx @context-action/llms-generator work-next --category=guide --show-completed
```

## 성능 및 최적화

### 대용량 프로젝트 처리
- **파일 스캔 최적화**: 필요한 언어/카테고리만 선택적 스캔
- **메모리 효율성**: 대용량 프로젝트에서도 빠른 응답 시간
- **캐싱 없음**: 항상 최신 상태 반영

### 권장 실행 환경
- **작은 프로젝트** (<100 문서): ~1초
- **중간 프로젝트** (100-500 문서): ~3초
- **큰 프로젝트** (500+ 문서): ~5초

### 메모리 사용량
- **파일 스캔**: ~50MB
- **상태 분석**: ~100MB
- **통계 생성**: ~150MB

## 문제 해결

### 일반적인 이슈

**No pending work items found**
```bash
📋 No pending work items found!
   All documents are completed or no documents match your criteria.
```
- **원인**: 모든 작업이 완료되었거나 필터 조건이 너무 제한적
- **해결**: `--show-completed` 옵션으로 완료된 항목 확인하거나 필터 조건 완화

**Source document not found**
```bash
⚠️ Warning: Source document not found for api--action-only
```
- **원인**: Priority JSON은 있지만 원본 문서가 없거나 경로가 잘못됨
- **해결**: 원본 문서 경로 확인 또는 Priority JSON의 source_path 수정

**Priority JSON parsing error**
```bash
⚠️ Error: Cannot parse priority.json for guide--getting-started
```
- **원인**: Priority JSON 파일이 손상되었거나 형식이 잘못됨
- **해결**: Priority JSON 재생성 또는 수동 수정

### 템플릿 콘텐츠 검증 이슈

**Template marked as "needs content" despite having text**
- **원인**: 템플릿에 placeholder 텍스트가 남아있음
- **해결**: 다음 텍스트들을 실제 내용으로 교체
  - "여기에 ... 작성하세요"
  - "Provide comprehensive guidance on"
  - "의 핵심 개념과 Context-Action 프레임워크에서의 역할을 간단히 설명"

### 파일 권한 문제
```bash
❌ Error: EACCES: permission denied
```
- **해결**: 파일 권한 확인 및 수정
```bash
chmod -R 755 /path/to/project/data
```

### Config 설정 문제
```bash
⚠️ Warning: Categories configuration not found
```
- **해결**: `llms-generator.config.json`에서 categories 섹션 확인
```json
{
  "categories": {
    "guide": { "priority": 95 },
    "api": { "priority": 90 },
    "concept": { "priority": 85 },
    "examples": { "priority": 80 }
  }
}
```

## 관련 명령어 연계

### init → work-next 워크플로
```bash
# 1. 프로젝트 초기화
npx @context-action/llms-generator init

# 2. 다음 작업 확인
npx @context-action/llms-generator work-next

# 3. 작업 진행...
```

### work-next → simple-llms-batch 워크플로
```bash
# 1. 완료 상태 확인
npx @context-action/llms-generator work-next --show-completed

# 2. 모든 작업 완료 후 LLMS 생성
npx @context-action/llms-generator simple-llms-batch

# 3. 결과 확인
ls docs/llms/
```

### 기타 유용한 조합
```bash
# Priority JSON 일괄 생성 후 다음 작업 확인
npx @context-action/llms-generator priority-generate en
npx @context-action/llms-generator work-next --lang=en

# Template 일괄 생성 후 다음 작업 확인
npx @context-action/llms-generator template-generate
npx @context-action/llms-generator work-next

# 작업 상태 확인 후 다음 작업으로 이동
npx @context-action/llms-generator work-check
npx @context-action/llms-generator work-next
```

## 완료 상태 관리 시스템 (YAML 프론트매터)

`work-next` 명령어는 YAML 프론트매터 자동 관리 시스템과 연동하여 문서 상태를 정확하게 추적합니다.

### 🔄 완료 상태 생명주기

#### 상태 전환 다이어그램
```
template → draft → review → completed
    ↓        ↓       ↓        ↓
 (초기생성)  (작성중)  (검토중)  (완료)
```

#### work-next에서 "✅ Completed"로 표시되려면

**1. 템플릿 파일에 실제 요약 내용 작성**
```markdown
## 템플릿 내용 (100자 이내)

```markdown
<!-- ❌ 이런 Placeholder 텍스트 제거 -->
<!-- 여기에 100자 이내의 요약 내용을 작성하세요 -->
<!-- Action Handlers: Provide comprehensive guidance on... -->

<!-- ✅ 실제 요약 내용으로 교체 -->
액션 핸들러: 비즈니스 로직을 컴포넌트에서 분리하여 우선순위 기반으로 실행되는 Context-Action 프레임워크의 핵심 시스템
```
```

**2. 자동 상태 업데이트 (Git 커밋 시)**
```bash
# 템플릿 내용 작성 후 커밋
git add data/ko/guide--action-handlers/guide--action-handlers-100.md
git commit -m "Complete action handlers summary"

# 🤖 Husky Hook이 자동으로 프론트매터 업데이트:
# completion_status: template → completed
# workflow_stage: template_generation → published
# quality_score: 85 (자동 계산)
# last_update: 현재 시간
```

**3. 제거해야 하는 Placeholder 텍스트들**
- `여기에` (한국어 placeholder)
- `작성하세요` (한국어 placeholder)  
- `Provide comprehensive guidance on` (영어 placeholder)
- `의 핵심 개념과 Context-Action 프레임워크에서의 역할을 간단히 설명` (자동생성 텍스트)

### 🤖 자동 상태 감지 시스템

#### Git Hook 자동화 (Husky)
```bash
# Pre-commit Hook이 자동으로:
# 1. 템플릿 내용 분석
# 2. Placeholder 존재 여부 확인  
# 3. 품질 점수 계산 (0-100점)
# 4. completion_status 자동 업데이트
# 5. work-next 상태 즉시 반영
```

#### 품질 점수 계산 기준
- **길이 평가** (30점): 100자 이상 만점
- **구조 평가** (20점): 정의 구조 + 프레임워크 언급
- **완성도 평가** (30점): Placeholder 완전 제거
- **언어 일관성** (20점): 한글/영어 적절한 조합

### 🔧 프론트매터 관리 명령어

#### 상태 확인 및 검증
```bash
# 프론트매터 상태 보고서
npx @context-action/llms-generator frontmatter status

# 프론트매터 일관성 검증
npx @context-action/llms-generator frontmatter validate

# 특정 언어/카테고리 상태 확인
npx @context-action/llms-generator frontmatter status --language=ko --category=guide
```

#### 프론트매터 수정 및 동기화
```bash
# 프론트매터 자동 업데이트
npx @context-action/llms-generator frontmatter update

# 원본 문서와 동기화
npx @context-action/llms-generator frontmatter sync

# 오류 자동 수정
npx @context-action/llms-generator frontmatter repair
```

### 📊 완료 상태 확인 예시

#### 작업 전 (Needs Content)
```bash
$ npx @context-action/llms-generator work-next --limit=1

🎯 Next Work Item
📄 Document: guide--action-handlers
📊 Status: 🟠 Needs Content
```

#### 작업 후 (Completed)
```bash
$ npx @context-action/llms-generator work-next --show-completed

📊 Summary Statistics
By Status:
  🟠 Needs Content: 171
  ✅ Completed: 1

# 완료된 문서는 작업 대기열에서 자동 제외
```

### 🎯 완료를 위한 체크리스트

**작업 완료 필수 조건**:
- [ ] 템플릿의 "템플릿 내용" 섹션에 실제 요약 작성
- [ ] 모든 Placeholder 텍스트 제거 (`여기에`, `작성하세요`, `Provide comprehensive guidance on` 등)
- [ ] 지정된 문자 제한 준수 (100자, 300자, 1000자, 2000자)
- [ ] Context-Action 프레임워크 맥락 포함
- [ ] Git 커밋으로 자동 상태 업데이트 확인

**품질 향상 권장사항**:
- [ ] 명확한 정의 구조 사용 (":"를 활용한 정의문)
- [ ] 핵심 개념과 실용적 활용법 균형
- [ ] 한글/영어 용어의 자연스러운 조합
- [ ] 80점 이상 품질 점수 달성

## 통합 워크플로 예시

### 완전한 문서 작업 플로우
```bash
# 1. 현재 작업 상태 확인
npx @context-action/llms-generator work-next

# 2. 권장된 템플릿 파일 편집
code "/path/to/template/file.md"

# 3. 실제 요약 내용 작성
# 🚫 Before: "Action Handlers: Provide comprehensive guidance on..."
# ✅ After:  "액션 핸들러: 비즈니스 로직을 컴포넌트에서 분리하여..."

# 4. Git 커밋 (프론트매터 자동 업데이트)
git add data/ko/guide--action-handlers/guide--action-handlers-100.md  
git commit -m "Complete action handlers 100-char summary"

# 🤖 Husky Hook 자동 실행:
# ✅ 내용 분석 → Placeholder 제거 확인 → completion_status: completed

# 5. 완료 상태 확인
npx @context-action/llms-generator work-next --show-completed

# 6. 다음 작업으로 이동
npx @context-action/llms-generator work-next
```

### 배치 작업 및 품질 관리
```bash
# 여러 문서 연속 작업
for i in {1..5}; do
  npx @context-action/llms-generator work-next --limit=1
  # 템플릿 편집...
  git add . && git commit -m "Complete summary $i"
done

# 전체 진행 상황 및 품질 확인
npx @context-action/llms-generator frontmatter status
npx @context-action/llms-generator frontmatter validate

# 완료된 작업 품질 검토
npx @context-action/llms-generator work-next --show-completed --sort-by=modified
```

## 결론

`work-next` 명령어는 **YAML 프론트매터 자동 관리 시스템**과 **Git Hook 자동화**가 결합된 LLMs Generator의 핵심 생산성 도구입니다. 

### 🎯 주요 장점
- **🤖 완전 자동화**: Git 커밋만으로 상태 자동 업데이트
- **🎯 명확한 완료 기준**: Placeholder 제거 = 완료 상태
- **📊 실시간 추적**: 작업 즉시 work-next 상태 반영
- **🔧 지능형 분석**: 내용 품질 자동 평가 및 점수화
- **⚡ 효율적인 워크플로**: 메타데이터 관리 부담 완전 제거

### 🔄 권장 사용 패턴
1. **매일 작업 시작**: `work-next`로 우선순위 작업 확인
2. **실제 내용 작성**: Placeholder 제거하고 의미있는 요약 작성
3. **자동 상태 업데이트**: Git 커밋으로 completion_status 자동 변경
4. **진행 상황 확인**: `--show-completed`로 성과 추적
5. **품질 관리**: `frontmatter status`로 전체 현황 모니터링

이제 개발자는 **실제 요약 내용 작성에만 집중**하면 되며, 모든 메타데이터 관리와 상태 추적은 시스템이 자동으로 처리합니다! 🎉

### 🔗 관련 문서
- [프론트매터 관리 시스템 상세 가이드](./FRONTMATTER_MANAGEMENT_GUIDE.md)
- [Git Hook 설정 및 문제해결](./FRONTMATTER_MANAGEMENT_GUIDE.md#-문제-해결)