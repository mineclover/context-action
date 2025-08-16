# Priority.json 완성 가이드

이 문서는 자동 생성된 빈 priority.json 파일들을 수동으로 완성할 때 사용할 수 있는 모든 enum 값들과 작성 가이드를 제공합니다.

## 🎯 완성해야 할 필수 필드들

### 1. priority.tier (우선순위 등급)
```json
"tier": "essential"  // 선택 가능한 값들
```

**가능한 값들**:
- `"critical"` - 시스템 작동에 필수적인 핵심 문서
- `"essential"` - 프레임워크 사용에 필수적인 문서  
- `"important"` - 중요하지만 선택적인 문서
- `"reference"` - 참조용 문서
- `"supplementary"` - 보조적인 문서

**권장 사용법**:
- `critical`: 설치 가이드, 핵심 개념
- `essential`: 시작하기 가이드, 기본 API
- `important`: 고급 기능, 패턴 가이드
- `reference`: API 상세 스펙, 설정 옵션
- `supplementary`: 팁, 트러블슈팅

### 2. purpose.target_audience (대상 독자)
```json
"target_audience": ["beginners", "framework-users"]
```

**가능한 값들**:
- `"beginners"` - 초보자
- `"intermediate"` - 중급 사용자
- `"advanced"` - 고급 사용자
- `"framework-users"` - 프레임워크 사용자
- `"contributors"` - 기여자/개발자
- `"llms"` - LLM/AI 시스템

**조합 예시**:
- `["beginners", "framework-users"]` - 프레임워크를 처음 배우는 사용자
- `["intermediate", "advanced"]` - 경험 있는 사용자
- `["contributors"]` - 프레임워크 개발에 참여하는 개발자

### 3. tags.primary (주요 태그)
```json
"primary": ["tutorial", "step-by-step", "practical"]
```

**가능한 값들**:
- `"beginner"` - 초보자용
- `"intermediate"` - 중급
- `"advanced"` - 고급
- `"core"` - 핵심 기능
- `"optional"` - 선택적 기능
- `"quick-start"` - 빠른 시작
- `"troubleshooting"` - 문제 해결
- `"step-by-step"` - 단계별 가이드
- `"practical"` - 실용적
- `"tutorial"` - 튜토리얼
- `"reference"` - 참조
- `"technical"` - 기술적
- `"developer"` - 개발자용
- `"theory"` - 이론
- `"architecture"` - 아키텍처
- `"design"` - 설계
- `"code"` - 코드
- `"sample"` - 샘플

### 4. tags.audience (독자 태그)
```json
"audience": ["framework-users", "beginners"]
```

**가능한 값들**:
- `"framework-users"` - 프레임워크 사용자
- `"beginners"` - 초보자
- `"intermediate"` - 중급자
- `"advanced"` - 고급자
- `"contributors"` - 기여자
- `"new-users"` - 신규 사용자
- `"experienced-users"` - 경험 있는 사용자
- `"experts"` - 전문가
- `"all-users"` - 모든 사용자

### 5. tags.complexity (복잡도)
```json
"complexity": "basic"
```

**가능한 값들**:
- `"basic"` - 기본
- `"intermediate"` - 중급
- `"advanced"` - 고급
- `"expert"` - 전문가

### 6. extraction.strategy (추출 전략)
```json
"strategy": "concept-first"
```

**가능한 값들**:
- `"concept-first"` - 개념 우선 (이론적 설명 → 실제 적용)
- `"example-first"` - 예제 우선 (코드 예제 → 개념 설명)
- `"api-first"` - API 우선 (API 사용법 → 상세 설명)
- `"tutorial-first"` - 튜토리얼 우선 (단계별 진행 → 심화 내용)
- `"reference-first"` - 참조 우선 (상세 스펙 → 사용 예시)

**카테고리별 권장 전략**:
- `guide`: `tutorial-first`
- `api`: `api-first`
- `concept`: `concept-first`
- `examples`: `example-first`
- `reference`: `reference-first`

### 7. dependencies 관계 타입들

#### dependencies.prerequisites.importance
```json
"importance": "required"
```
- `"required"` - 필수
- `"recommended"` - 권장
- `"optional"` - 선택

#### dependencies.references.type
```json
"type": "concept"
```
- `"concept"` - 개념 참조
- `"example"` - 예제 참조
- `"api"` - API 참조
- `"implementation"` - 구현 참조

#### dependencies.followups.timing
```json
"timing": "immediate"
```
- `"immediate"` - 즉시
- `"after-practice"` - 연습 후
- `"advanced-stage"` - 고급 단계

#### dependencies.conflicts.severity
```json
"severity": "minor"
```
- `"minor"` - 경미
- `"moderate"` - 보통
- `"major"` - 심각

#### dependencies.complements.relationship
```json
"relationship": "alternative-approach"
```
- `"alternative-approach"` - 대안적 접근
- `"deeper-dive"` - 심화 내용
- `"practical-example"` - 실용적 예제
- `"related-concept"` - 관련 개념

### 8. composition.userJourneyStage (사용자 여정 단계)
```json
"userJourneyStage": "onboarding"
```

**가능한 값들**:
- `"discovery"` - 발견 (프레임워크 탐색)
- `"onboarding"` - 온보딩 (시작하기)
- `"implementation"` - 구현 (실제 사용)
- `"mastery"` - 숙련 (고급 활용)
- `"troubleshooting"` - 문제 해결

### 9. quality.consistency_checks (품질 검사 항목)
```json
"consistency_checks": ["terminology", "pattern_usage"]
```

**가능한 값들**:
- `"terminology"` - 용어 일관성
- `"code_style"` - 코드 스타일
- `"naming_conventions"` - 명명 규칙
- `"pattern_usage"` - 패턴 사용법
- `"api_signatures"` - API 시그니처
- `"tag_consistency"` - 태그 일관성
- `"dependency_validity"` - 의존성 유효성

### 10. metadata.reviewCycle (검토 주기)
```json
"reviewCycle": "monthly"
```

**가능한 값들**:
- `"weekly"` - 주간
- `"monthly"` - 월간
- `"quarterly"` - 분기별
- `"yearly"` - 연간
- `"as-needed"` - 필요시

## 📝 작성 예시

### API 문서 예시 (api-action-only)
```json
{
  "priority": {
    "score": 85,
    "tier": "important",
    "rationale": "Action Only 패턴은 프레임워크의 핵심 패턴 중 하나로 대부분의 사용자가 알아야 함"
  },
  "purpose": {
    "primary_goal": "Action Only 패턴의 사용법과 언제 사용해야 하는지 설명",
    "target_audience": ["framework-users", "intermediate"],
    "use_cases": [
      "이벤트 처리가 주된 목적인 컴포넌트",
      "상태 관리 없이 액션만 필요한 경우",
      "Command 패턴 구현"
    ],
    "learning_objectives": [
      "Action Only 패턴의 개념 이해",
      "createActionContext 사용법 습득",
      "Store 패턴과의 차이점 파악"
    ]
  },
  "keywords": {
    "primary": ["Action Only", "createActionContext", "패턴", "이벤트"],
    "technical": ["ActionContext", "useActionDispatch", "useActionHandler", "TypeScript"],
    "patterns": ["Action Only Pattern", "Command Pattern"],
    "avoid": ["복잡한 상태 관리", "Store 패턴 세부사항"]
  },
  "tags": {
    "primary": ["reference", "technical", "developer"],
    "secondary": ["api", "pattern", "intermediate"],
    "audience": ["framework-users", "intermediate"],
    "complexity": "intermediate"
  },
  "dependencies": {
    "prerequisites": [
      {
        "documentId": "concept-action-pipeline-guide",
        "importance": "recommended", 
        "reason": "액션 파이프라인 개념을 먼저 이해하면 도움됨"
      }
    ],
    "references": [
      {
        "documentId": "api-react-action-context",
        "type": "api",
        "relevance": 0.9
      }
    ],
    "complements": [
      {
        "documentId": "api-store-only",
        "relationship": "alternative-approach",
        "strength": 0.8
      }
    ]
  },
  "extraction": {
    "strategy": "api-first",
    "character_limits": {
      "100": {
        "focus": "Action Only 패턴 정의",
        "structure": "패턴명 + 핵심 용도",
        "must_include": ["Action Only", "createActionContext"],
        "avoid": ["복잡한 예제", "Store 패턴 비교"]
      },
      "300": {
        "focus": "패턴 정의 + 기본 사용법",
        "structure": "정의 + 주요 API + 사용 시점",
        "must_include": ["패턴 정의", "createActionContext", "사용 시점"],
        "avoid": ["상세한 코드", "고급 옵션"]
      }
    }
  },
  "quality": {
    "completeness_threshold": 0.8,
    "code_examples_required": true,
    "consistency_checks": ["terminology", "api_signatures", "pattern_usage"]
  },
  "metadata": {
    "maintainer": "프레임워크 팀",
    "reviewCycle": "quarterly"
  }
}
```

### Guide 문서 예시 (guide-getting-started)
```json
{
  "priority": {
    "score": 95,
    "tier": "essential",
    "rationale": "프레임워크 사용을 위한 첫 번째 단계로 모든 사용자가 읽어야 함"
  },
  "purpose": {
    "primary_goal": "Context-Action 프레임워크를 처음 사용하는 개발자가 기본 설정과 사용법을 익힐 수 있도록 안내",
    "target_audience": ["beginners", "framework-users"],
    "use_cases": [
      "프레임워크 첫 설치 및 설정",
      "첫 번째 컴포넌트 만들기",
      "기본 패턴 이해하기"
    ]
  },
  "tags": {
    "primary": ["tutorial", "step-by-step", "beginner"],
    "audience": ["beginners", "framework-users"],
    "complexity": "basic"
  },
  "extraction": {
    "strategy": "tutorial-first"
  },
  "composition": {
    "userJourneyStage": "onboarding"
  }
}
```

## 🛠️ 작업 체크리스트

각 priority.json 파일을 완성할 때 다음 항목들을 확인하세요:

### 필수 완성 항목
- [ ] `priority.score` (1-100)
- [ ] `priority.tier` (enum 값)
- [ ] `priority.rationale` (우선순위 이유)
- [ ] `purpose.primary_goal` (문서의 주 목적)
- [ ] `purpose.target_audience` (enum 배열)
- [ ] `tags.primary` (최소 1개, 최대 5개)
- [ ] `tags.complexity` (enum 값)
- [ ] `extraction.strategy` (enum 값)

### 권장 완성 항목
- [ ] `purpose.use_cases` (구체적인 사용 사례들)
- [ ] `keywords.primary` (최대 5개)
- [ ] `keywords.technical` (기술 용어들)
- [ ] `dependencies` (문서 간 관계)
- [ ] `extraction.character_limits` (각 제한별 가이드라인)

### 고급 완성 항목
- [ ] `composition.userJourneyStage`
- [ ] `quality.consistency_checks`
- [ ] `metadata.reviewCycle`

이 가이드를 참조하여 각 문서의 특성에 맞게 priority.json을 완성하면 정확한 메타데이터를 기반으로 한 문서 생성이 가능합니다.