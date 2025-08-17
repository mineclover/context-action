# LLM 문서 조합 전략 완전 가이드 (2025 업데이트)

Context-Action 프레임워크의 문서를 LLM에서 효율적으로 활용하기 위한 **통합 적응형 조합 전략**입니다. 최신 CLI 도구와 워크플로우 통합을 반영하여 업데이트되었습니다.

## 🚀 새로운 통합 워크플로우 (2025)

### 1. work-next 기반 문서 상태 관리
```bash
# 1. 다음 작업할 문서 자동 식별
npx @context-action/llms-generator work-next

# 2. 우선순위 및 상태별 필터링
npx @context-action/llms-generator work-next --category=api --chars=100

# 3. 완료된 문서만 확인
npx @context-action/llms-generator work-next --show-completed
```

### 2. llms-generate 기반 지능형 조합
```bash
# 문자 제한 + 카테고리 필터링
npx @context-action/llms-generator llms-generate --chars=100 --category=api

# 다양한 패턴 지원
npx @context-action/llms-generator llms-generate --pattern=minimum --lang=ko
npx @context-action/llms-generator llms-generate --pattern=standard --chars=300
npx @context-action/llms-generator llms-generate --pattern=origin --category=guide
```

### 3. 자동화된 품질 관리
```bash
# Frontmatter 기반 상태 추적
npx @context-action/llms-generator frontmatter status

# 문서 동기화 및 검증
npx @context-action/llms-generator frontmatter sync
npx @context-action/llms-generator frontmatter validate
```

## 🎯 현대화된 핵심 원칙

### 1. YAML Frontmatter 기반 메타데이터 관리
```yaml
---
document_id: "guide--action-handlers"      # 문서 고유 ID
category: "guide"                          # 카테고리 분류
source_path: "en/guide/action-handlers.md" # 원본 경로
character_limit: 100                       # 문자 제한
completion_status: "completed"             # 완료 상태
workflow_stage: "published"               # 워크플로 단계
priority_score: 90                         # 우선순위 점수
quality_score: 85                          # 품질 점수
last_update: "2025-08-17T10:30:00Z"       # 최종 업데이트
---

실제 콘텐츠만 카운팅 대상                    # ← YAML 제외하고 계산
Context-Action 프레임워크의 액션 핸들러는...
```

### 2. 지능형 우선순위 시스템
```typescript
// 우선순위 계산 알고리즘 (2025 업데이트)
interface WorkItem {
  documentId: string;
  category: string;
  priority: number;           // config 기반 우선순위
  status: CompletionStatus;   // 완료 상태
  qualityScore: number;       // 품질 점수
  lastModified: string;       // 수정 시간
}

// 우선순위 순서:
// 1. completion_status = "completed" 문서만 포함
// 2. category 우선순위 (guide: 90, api: 85, concept: 80, example: 75)
// 3. quality_score 고려 (80점 이상 권장)
// 4. 문서 크기 및 완전성 검증
```

### 3. 다단계 필터링 및 조합 전략
```bash
# 단계별 필터링 예시
# Level 1: 완료된 문서만 선택
completed_docs = documents.filter(doc => doc.completion_status === "completed")

# Level 2: 문자 제한 필터링
if (chars_filter) {
  docs = docs.filter(doc => doc.character_limit === chars_filter)
}

# Level 3: 카테고리 필터링  
if (category_filter) {
  docs = docs.filter(doc => doc.category === category_filter)
}

# Level 4: 우선순위 정렬 및 조합
docs = docs.sort((a, b) => b.priority - a.priority)
```

## 🔄 현대화된 조합 알고리즘 (2025)

### llms-generate 기반 조합 절차

#### 1단계: 완료된 문서 필터링
```bash
# 완료 상태 확인
npx @context-action/llms-generator work-next --show-completed

# 결과 예시:
✅ 완료된 문서들:
├─ guide--action-handlers (가이드, 100자) - Quality: 85
├─ api--action-only (API, 100자) - Quality: 90  
├─ concept--architecture-guide (개념, 300자) - Quality: 88
└─ ... (총 15개 완료 문서)
```

#### 2단계: 필터 적용 및 문서 선택
```typescript
// llms-generate 내부 로직
interface FilterOptions {
  characterLimit?: number;     // --chars=100
  category?: string;          // --category=api
  pattern: 'standard' | 'minimum' | 'origin';
  language: 'ko' | 'en';
}

// 실제 필터링 과정
const eligibleDocs = completedDocs
  .filter(doc => doc.completion_status === 'completed')
  .filter(doc => doc.quality_score >= 80)
  .filter(doc => chars ? doc.character_limit === chars : true)
  .filter(doc => category ? doc.category === category : true)
  .sort((a, b) => b.priority_score - a.priority_score);
```

#### 3단계: 패턴별 조합 전략
```bash
# Standard 패턴: 순서대로 나열
npx @context-action/llms-generator llms-generate --pattern=standard --chars=100
# → 100자 문서들을 우선순위순으로 조합

# Minimum 패턴: 네비게이션 형태
npx @context-action/llms-generator llms-generate --pattern=minimum --category=guide
# → 문서 링크와 간략한 설명으로 조합

# Origin 패턴: 원본 내용 포함
npx @context-action/llms-generator llms-generate --pattern=origin --category=api
# → API 문서의 완전한 내용 포함
```

#### 4단계: 자동 품질 검증
```yaml
# 생성된 LLMS 파일 메타데이터
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
---
```

## 📊 실제 사용 시나리오 (2025 업데이트)

### 새로운 CLI 기반 워크플로우

| 시나리오 | 명령어 | 결과 |
|----------|--------|------|
| **API 100자 요약** | `llms-generate --chars=100 --category=api` | API 문서들의 100자 요약만 조합 |
| **가이드 전체** | `llms-generate --category=guide --pattern=origin` | 가이드 문서들의 원본 내용 포함 |
| **네비게이션 생성** | `llms-generate --pattern=minimum --lang=ko` | 한국어 문서 네비게이션 링크 생성 |
| **균형잡힌 조합** | `llms-generate --pattern=standard` | 모든 완료 문서를 우선순위순 조합 |
| **특정 언어만** | `llms-generate --lang=en --chars=300` | 영어 300자 문서만 조합 |

## 🎛️ 조합 품질 관리

### 내용 일관성 검증
```
1. 용어 통일성 검사
   ├─ Context-Action (O) vs context-action (X)
   ├─ ActionRegister (O) vs Action Register (X)
   └─ useActionDispatch (O) vs useActionDispatcher (X)

2. 패턴 일치성 검사  
   ├─ API 문서: 동일한 구조 (Import → Usage → Example)
   ├─ 가이드 문서: 동일한 구조 (Concept → Implementation → Best Practice)
   └─ 예제 문서: 동일한 구조 (Setup → Code → Explanation)

3. 링크 연결성 검사
   ├─ 내부 링크: 실제 존재하는 문서만 참조
   ├─ API 참조: 정확한 API 문서 링크
   └─ 관련 문서: 논리적으로 연결된 문서만 추천
```

### 중복 제거 전략
```
1. 개념 중복
   ├─ Action Pipeline: guide-concepts에서만 상세 설명
   ├─ MVVM Architecture: concept-architecture-guide에서만 상세 설명
   └─ 기타 문서: 간략한 언급만

2. 예제 중복
   ├─ Basic Setup: examples-basic-setup에서만 상세
   ├─ 기타 문서: 핵심 코드만 포함
   └─ 유사 예제: 차별화된 관점으로 설명

3. API 중복
   ├─ createActionContext: api-action-only에서만 상세
   ├─ useActionDispatch: api-react-action-context에서만 상세  
   └─ 기타 문서: 사용법 위주 간략 설명
```

## 🚀 2025 구현 현황

### ✅ 완료된 기능들 (Phase 1-3)
1. **work-next Command**: 다음 작업 문서 자동 식별
2. **llms-generate Command**: 고급 필터링 및 패턴 지원
3. **Frontmatter System**: YAML 기반 문서 상태 추적
4. **CLI 통합**: 모든 기능의 통합 커맨드라인 인터페이스
5. **자동 품질 관리**: Git hook 기반 자동 업데이트

### 🔄 최신 기능 활용 가이드
```bash
# 1. 프로젝트 상태 확인
npx @context-action/llms-generator work-next

# 2. 필요한 문서 작업 완료
# (work-next에서 권장하는 템플릿 파일 편집)

# 3. 고급 LLMS 생성
npx @context-action/llms-generator llms-generate --chars=100 --category=api

# 4. 품질 검증 및 관리
npx @context-action/llms-generator frontmatter status
```

### 🎯 차세대 기능 계획 (Phase 4)
1. **AI 기반 문서 품질 평가**: LLM을 활용한 자동 품질 점수 계산
2. **다국어 번역 자동화**: 영어↔한국어 자동 번역 시스템
3. **실시간 문서 동기화**: 원본 문서 변경 시 즉시 반영
4. **웹 대시보드**: 브라우저 기반 문서 관리 인터페이스

## 📋 실제 구현 예시

### `generate-adaptive-llms.js` 스크립트 구조
```javascript
class AdaptiveLLMComposer {
  constructor(documentsPath, prioritiesPath) {
    this.documents = this.loadDocuments(documentsPath);
    this.priorities = this.loadPriorities(prioritiesPath);
  }

  compose(targetChars) {
    // 1단계: 기본 목차 생성
    const baseContent = this.generateBaseContent(100);
    
    // 2단계: 여유분 계산  
    const remaining = targetChars - this.countCharsExcludingYAML(baseContent);
    
    // 3단계: 우선순위별 확장
    const expanded = this.expandByPriority(baseContent, remaining);
    
    // 4단계: 동적 조정
    return this.adjustToTarget(expanded, targetChars);
  }

  countCharsExcludingYAML(content) {
    return content.replace(/^---\n[\s\S]*?\n---\n/gm, '').length;
  }

  expandByPriority(baseContent, remainingChars) {
    // 우선순위별 확장 로직
  }

  adjustToTarget(content, targetChars) {
    // 동적 조정 로직
  }
}
```

### 실제 사용 예시 (2025 업데이트)
```bash
# 완료된 100자 API 문서들로 LLMS 생성
npx @context-action/llms-generator llms-generate --chars=100 --category=api --pattern=standard

# 한국어 가이드 문서들의 네비게이션 생성
npx @context-action/llms-generator llms-generate --pattern=minimum --category=guide --lang=ko

# 모든 완료 문서의 원본 내용 포함
npx @context-action/llms-generator llms-generate --pattern=origin --verbose

# 미리보기 모드로 결과 확인
npx @context-action/llms-generator llms-generate --chars=300 --dry-run --verbose
```

## 🎯 성공 지표

### 품질 지표
- **완성도**: 목표 글자수 달성률 95% 이상
- **균형성**: 문서 카테고리별 적절한 비율 유지
- **일관성**: 용어, 패턴, 링크 연결 정확도 98% 이상
- **실용성**: 실제 개발에 필요한 정보 포함도 90% 이상

### 성능 지표  
- **처리 속도**: 10,000자 조합을 5초 이내 생성
- **메모리 효율**: 최대 100MB 메모리 사용
- **확장성**: 100,000자 조합까지 안정적 처리
- **정확성**: 글자수 계산 오차 ±1% 이내

---

**Strategy Version**: 2.0 (2025 Edition)  
**Updated**: 2025-08-17  
**Purpose**: Modernized adaptive LLM document composition with integrated CLI workflow  
**Status**: Implementation Complete, Active Production Use  
**New Features**: work-next, llms-generate, frontmatter management, CLI integration