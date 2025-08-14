# LLM 문서 조합 전략 완전 가이드

Context-Action 프레임워크의 문서를 LLM에서 효율적으로 활용하기 위한 **적응형 조합 전략** 완전 가이드입니다.

## 🎯 핵심 원칙

### 1. YAML 제외 카운팅
```yaml
---
source: "guide/concepts.md"     # ← 이 부분은 글자수에서 제외
title: "Core Concepts"
document_id: "guide-concepts"
char_limit: 300
---

실제 콘텐츠만 카운팅            # ← 이 부분만 글자수 계산 대상
Context-Action은 혁신적인...
```

### 2. 우선순위 기반 선택
- **Critical (90-100점)**: 7개 문서 - 항상 우선 포함
- **Essential (80-89점)**: 32개 문서 - 글자수 여유 시 포함
- **Important (60-79점)**: 11개 문서 - 충분한 여유 시 포함
- **Reference (40-59점)**: 12개 문서 - 대용량 요청 시만 포함

### 3. 단계적 확장
```
100자 기본 → 300자 확장 → 500자 확장 → 1000자 확장 → 2000자+ 확장
```

## 🔄 적응형 조합 알고리즘

### 10,000자 요청 시 상세 절차

#### 1단계: 기본 목차 생성
```
총 62개 문서의 100자 요약을 우선순위 순서로 조합:

Critical (7개) × 100자 = 700자
Essential (32개) × 100자 = 3,200자  
Important (11개) × 100자 = 1,100자
Reference (12개) × 100자 = 1,200자
─────────────────────────────────
총 기본 목차: 6,200자 (YAML 제외)
```

#### 2단계: 여유분 계산
```
목표: 10,000자
기본: 6,200자
여유분: 3,800자
```

#### 3단계: 우선순위별 확장 배분
```
3,800자 여유분 배분 전략:

Option A: Critical 집중 전략
├─ Critical 7개 문서: 100자 → 1000자 (900자 × 7 = 6,300자 필요)
├─ 실제 적용: 4개 문서만 1000자로 확장 (3,600자 사용)
└─ 남은 200자: Essential 1-2개 문서 300자 확장

Option B: 균형 전략
├─ Critical 7개: 100자 → 500자 (400자 × 7 = 2,800자)
├─ Essential 5개: 100자 → 300자 (200자 × 5 = 1,000자)
└─ 총 사용: 3,800자 (정확히 맞춤)
```

#### 4단계: 동적 조정
```
실제 글자수 검증 후:
- 9,500자 이하: 추가 문서 300자 확장
- 10,500자 이상: 낮은 우선순위 문서 축소
- 목표: 9,500-10,500자 범위 (±5%)
```

## 📊 다양한 글자수별 전략 매트릭스

| 요청 글자수 | 기본 전략 | Critical | Essential | Important | Reference |
|------------|----------|----------|-----------|-----------|-----------|
| **3,000자** | 선별적 포함 | 300자 | 100자 선별 | 제외 | 제외 |
| **5,000자** | Critical 우선 | 500자 | 100자 | 제외 | 제외 |
| **10,000자** | 균형 확장 | 1000자 | 300자 선별 | 100자 | 제외 |
| **15,000자** | 체계적 확장 | 1000자 | 500자 | 300자 | 100자 |
| **20,000자** | 포괄적 확장 | 2000자 | 1000자 | 500자 | 300자 |
| **30,000자+** | 최대 확장 | 3000자+ | 2000자 | 1000자 | 500자 |

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

## 🚀 구현 우선순위

### Phase 1: 핵심 알고리즘 구현
1. **YAML 제외 글자수 계산 함수**
2. **우선순위 기반 문서 정렬 함수**
3. **기본 목차 생성 함수** (100자 조합)
4. **여유분 계산 함수**

### Phase 2: 확장 로직 구현
1. **단계적 확장 함수** (100→300→500→1000자)
2. **동적 조정 함수** (목표 글자수 미세 조정)
3. **품질 검증 함수** (일관성, 중복 검사)
4. **최적화 함수** (성능, 정확도 향상)

### Phase 3: 자동화 시스템 구현
1. **CLI 인터페이스** (`pnpm docs:compose --chars 10000`)
2. **웹 인터페이스** (글자수 입력 → 즉시 조합)
3. **API 엔드포인트** (외부 시스템 연동)
4. **품질 리포트** (조합 결과 분석 및 추천)

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

### 사용 예시
```bash
# 10,000자 조합 생성
node scripts/generate-adaptive-llms.js --chars 10000 --output llms-10k.txt

# 15,000자 조합 생성 (품질 검증 포함)
node scripts/generate-adaptive-llms.js --chars 15000 --validate --output llms-15k.txt

# 커스텀 전략으로 조합
node scripts/generate-adaptive-llms.js --chars 8000 --strategy critical-focus --output llms-custom.txt
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

**Strategy Version**: 1.0  
**Created**: 2025-08-14  
**Purpose**: Complete implementation guide for adaptive LLM document composition  
**Status**: Documentation Complete, Implementation Pending