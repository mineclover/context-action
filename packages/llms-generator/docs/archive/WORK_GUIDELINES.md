# LLMs Generator 작업 지침서

**목적**: 기존 markdown 문서들을 미러링하여 사용자가 각 문서의 요약 버전들을 체계적으로 관리하고, 제한된 문자 수 내에서 카테고리와 의존성을 고려한 최적의 문서 조합을 생성하는 시스템

## 🎯 시스템 목표

### 핵심 목적
1. **문서 미러링**: 원본 markdown 문서의 구조화된 요약 버전 생성 및 관리
2. **적응형 콘텐츠 선택**: 제한된 문자 수 내에서 카테고리, 태그, 의존성을 고려한 최적 문서 조합
3. **체계적 관리**: 태그/카테고리 기반의 문서 분류 및 우선순위 관리
4. **자동화 워크플로우**: Git 통합을 통한 자동 업데이트 및 상태 관리

### "적절히"의 정의
- **카테고리 기반**: 동일 카테고리 내 문서들의 우선순위 고려
- **의존성 고려**: 문서 간 참조 관계를 반영한 선택
- **태그 연관성**: 공통 태그를 가진 문서들의 조합 우선 선택
- **사용자 맥락**: 설정된 목표 글자 수와 품질 기준에 따른 동적 선택

## 📋 태그/카테고리 시스템 설계

### 1. 설정 파일 구조 (llms-generator.config.json)

```json
{
  "characterLimits": [100, 300, 1000, 2000],
  "languages": ["ko", "en"],
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./packages/llms-generator/data",
    "outputDir": "./docs/llms"
  },
  "categories": {
    "guide": {
      "name": "가이드",
      "description": "사용자 가이드 및 튜토리얼",
      "priority": 90,
      "defaultStrategy": "tutorial-first",
      "tags": ["beginner", "step-by-step", "practical"]
    },
    "api": {
      "name": "API 참조",
      "description": "API 문서 및 참조 자료",
      "priority": 85,
      "defaultStrategy": "api-first",
      "tags": ["reference", "technical", "developer"]
    },
    "concept": {
      "name": "개념 설명",
      "description": "핵심 개념 및 아키텍처",
      "priority": 80,
      "defaultStrategy": "concept-first",
      "tags": ["theory", "architecture", "design"]
    },
    "example": {
      "name": "예제 코드",
      "description": "실용적인 예제 및 샘플",
      "priority": 75,
      "defaultStrategy": "example-first",
      "tags": ["practical", "code", "sample"]
    },
    "reference": {
      "name": "참조 자료",
      "description": "상세 참조 문서",
      "priority": 70,
      "defaultStrategy": "reference-first",
      "tags": ["detailed", "comprehensive", "lookup"]
    }
  },
  "tags": {
    "beginner": {
      "name": "초보자",
      "description": "초보자를 위한 콘텐츠",
      "weight": 1.2,
      "compatibleWith": ["step-by-step", "practical", "tutorial"]
    },
    "advanced": {
      "name": "고급",
      "description": "고급 사용자를 위한 콘텐츠",
      "weight": 0.9,
      "compatibleWith": ["technical", "architecture", "optimization"]
    },
    "core": {
      "name": "핵심",
      "description": "핵심 기능 및 개념",
      "weight": 1.5,
      "compatibleWith": ["essential", "fundamental", "architecture"]
    },
    "optional": {
      "name": "선택사항",
      "description": "선택적 기능 및 확장",
      "weight": 0.7,
      "compatibleWith": ["advanced", "extension", "plugin"]
    }
  },
  "dependencies": {
    "rules": {
      "prerequisite": {
        "description": "선행 학습이 필요한 문서",
        "weight": 1.3,
        "autoInclude": true
      },
      "reference": {
        "description": "참조 관계의 문서",
        "weight": 1.1,
        "autoInclude": false
      },
      "followup": {
        "description": "후속 학습 권장 문서",
        "weight": 0.8,
        "autoInclude": false
      }
    }
  },
  "composition": {
    "strategies": {
      "balanced": {
        "categoryWeight": 0.4,
        "tagWeight": 0.3,
        "dependencyWeight": 0.2,
        "priorityWeight": 0.1
      },
      "category-focused": {
        "categoryWeight": 0.6,
        "tagWeight": 0.2,
        "dependencyWeight": 0.1,
        "priorityWeight": 0.1
      },
      "dependency-driven": {
        "categoryWeight": 0.2,
        "tagWeight": 0.2,
        "dependencyWeight": 0.5,
        "priorityWeight": 0.1
      }
    },
    "defaultStrategy": "balanced",
    "minCategoryRepresentation": 2,
    "maxDocumentsPerCategory": 10
  }
}
```

### 2. Priority.json 구조 확장

```json
{
  "document": {
    "id": "guide-getting-started",
    "title": "시작하기 가이드",
    "source_path": "guide/getting-started.md",
    "category": "guide",
    "subcategory": "basics"
  },
  "priority": {
    "score": 90,
    "tier": "essential"
  },
  "tags": {
    "primary": ["beginner", "core", "step-by-step"],
    "secondary": ["practical", "tutorial", "fundamental"],
    "audience": ["framework-users", "beginners"],
    "complexity": "basic",
    "estimated_reading_time": "10분"
  },
  "dependencies": {
    "prerequisites": [],
    "references": ["concept-architecture", "api-core-methods"],
    "followups": ["guide-advanced-patterns", "example-basic-usage"],
    "conflicts": [],
    "complements": ["guide-troubleshooting"]
  },
  "composition": {
    "categoryAffinity": {
      "guide": 1.0,
      "concept": 0.8,
      "api": 0.6,
      "example": 0.9
    },
    "tagAffinity": {
      "beginner": 1.0,
      "core": 0.9,
      "practical": 0.8
    },
    "contextualRelevance": {
      "onboarding": 1.0,
      "troubleshooting": 0.7,
      "advanced_usage": 0.3
    }
  }
}
```

## 🔄 작업 워크플로우

### 1. 문서 발견 및 분석 단계

```bash
# 1단계: 문서 발견 및 카테고리 자동 분류
npx llms-generator discover ko --auto-categorize --extract-tags

# 2단계: 의존성 분석
npx llms-generator analyze-dependencies ko --extract-references

# 3단계: 우선순위 생성 (카테고리/태그 기반)
npx llms-generator priority-generate ko --use-category-rules --extract-tags
```

### 2. 태그 기반 콘텐츠 추출

```bash
# 특정 태그 조합으로 추출
npx llms-generator extract ko --tags=beginner,core --chars=300,1000

# 카테고리별 우선순위 추출
npx llms-generator extract ko --category=guide --priority-min=80

# 의존성 고려 추출
npx llms-generator extract ko --include-dependencies --chars=1000,2000
```

### 3. 적응형 콘텐츠 조합

```bash
# 균형잡힌 조합 (카테고리+태그+의존성)
npx llms-generator compose ko 5000 --strategy=balanced --min-categories=3

# 초보자 중심 조합
npx llms-generator compose ko 3000 --tags=beginner,core --include-prerequisites

# 카테고리 중심 조합
npx llms-generator compose ko 2000 --category=guide --strategy=category-focused

# 의존성 기반 조합
npx llms-generator compose ko 4000 --strategy=dependency-driven --include-followups
```

## 📊 적응형 선택 알고리즘

### 1. 문서 선택 점수 계산

```typescript
interface SelectionScore {
  categoryScore: number;      // 카테고리 우선순위 점수
  tagAffinityScore: number;   // 태그 연관성 점수
  dependencyScore: number;    // 의존성 가중치 점수
  priorityScore: number;      // 기본 우선순위 점수
  contextualScore: number;    // 맥락적 연관성 점수
  finalScore: number;         // 최종 가중 점수
}

function calculateSelectionScore(
  document: DocumentMetadata,
  targetTags: string[],
  targetCategory: string,
  compositionStrategy: CompositionStrategy
): SelectionScore {
  const weights = compositionStrategy.weights;
  
  // 카테고리 점수
  const categoryScore = document.category === targetCategory ? 1.0 : 
    document.composition.categoryAffinity[targetCategory] || 0.5;
  
  // 태그 연관성 점수
  const tagAffinityScore = calculateTagAffinity(document.tags, targetTags);
  
  // 의존성 점수
  const dependencyScore = calculateDependencyScore(document.dependencies);
  
  // 우선순위 점수 (정규화)
  const priorityScore = document.priority.score / 100;
  
  // 최종 가중 점수
  const finalScore = (
    categoryScore * weights.categoryWeight +
    tagAffinityScore * weights.tagWeight +
    dependencyScore * weights.dependencyWeight +
    priorityScore * weights.priorityWeight
  );
  
  return {
    categoryScore,
    tagAffinityScore,
    dependencyScore,
    priorityScore,
    contextualScore: document.composition.contextualRelevance[context] || 0.5,
    finalScore
  };
}
```

### 2. 의존성 해결 알고리즘

```typescript
interface DependencyResolution {
  requiredDocuments: string[];     // 필수 선행 문서
  recommendedDocuments: string[];  // 권장 문서
  conflictingDocuments: string[];  // 충돌 문서 (제외)
  complementaryDocuments: string[]; // 보완 문서
}

function resolveDependencies(
  selectedDocuments: DocumentMetadata[],
  availableCharacters: number
): DependencyResolution {
  const resolution: DependencyResolution = {
    requiredDocuments: [],
    recommendedDocuments: [],
    conflictingDocuments: [],
    complementaryDocuments: []
  };
  
  for (const doc of selectedDocuments) {
    // 선행 문서 확인 및 추가
    for (const prerequisite of doc.dependencies.prerequisites) {
      if (!selectedDocuments.some(d => d.document.id === prerequisite)) {
        resolution.requiredDocuments.push(prerequisite);
      }
    }
    
    // 충돌 문서 확인
    resolution.conflictingDocuments.push(...doc.dependencies.conflicts);
    
    // 보완 문서 추가 (공간이 허용하는 경우)
    if (hasRemainingSpace(availableCharacters)) {
      resolution.complementaryDocuments.push(...doc.dependencies.complements);
    }
  }
  
  return resolution;
}
```

## 🎨 사용 시나리오

### 시나리오 1: 초보자를 위한 가이드 조합

```bash
# 목표: 3000자 내에서 초보자가 Context-Action을 시작할 수 있는 필수 정보 제공

npx llms-generator compose ko 3000 \
  --tags=beginner,core,step-by-step \
  --category=guide \
  --include-prerequisites \
  --strategy=balanced \
  --min-categories=2 \
  --output=beginner-guide.txt
```

**예상 결과**:
- guide-getting-started (90점, beginner+core 태그)
- concept-action-patterns (85점, core 태그, guide의 prerequisite)
- example-basic-usage (80점, beginner+practical 태그, getting-started의 complement)

### 시나리오 2: API 참조 중심 조합

```bash
# 목표: 5000자 내에서 개발자가 필요한 API 정보 제공

npx llms-generator compose ko 5000 \
  --category=api \
  --tags=reference,technical \
  --include-dependencies \
  --strategy=dependency-driven \
  --priority-min=75 \
  --output=api-reference.txt
```

**예상 결과**:
- api-core-methods (90점, reference+technical 태그)
- api-action-handlers (85점, api-core-methods의 dependency)
- api-store-integration (80점, 의존성 체인)
- guide-quick-start (85점, API 사용을 위한 prerequisite)

### 시나리오 3: 컨텍스트 기반 조합

```bash
# 목표: 특정 문제 해결을 위한 맞춤형 조합

npx llms-generator compose ko 4000 \
  --context=troubleshooting \
  --tags=practical,solution \
  --include-followups \
  --strategy=balanced \
  --output=troubleshooting-guide.txt
```

## 🔧 구현 우선순위

### Phase 1: 기본 태그/카테고리 시스템
1. ✅ 설정 파일 구조 확장
2. ✅ Priority.json 스키마 업데이트
3. ✅ 카테고리별 기본 전략 구현
4. ✅ 태그 기반 필터링 구현

### Phase 2: 의존성 시스템
1. 🔄 문서 간 참조 관계 자동 추출
2. 🔄 의존성 해결 알고리즘 구현
3. 🔄 순환 참조 감지 및 처리
4. 🔄 의존성 기반 점수 계산

### Phase 3: 적응형 선택 알고리즘
1. ⏳ 다중 기준 점수 계산 시스템
2. ⏳ 전략별 가중치 적용
3. ⏳ 동적 문서 조합 최적화
4. ⏳ 공간 활용률 최적화

### Phase 4: 고급 기능
1. ⏳ 컨텍스트 인식 조합
2. ⏳ A/B 테스팅 지원
3. ⏳ 조합 품질 메트릭
4. ⏳ 자동 태그 추출 및 분류

## 📈 품질 지표

### 조합 품질 메트릭
- **공간 활용률**: 95% 이상
- **카테고리 다양성**: 최소 2개 카테고리 포함
- **의존성 완전성**: 필수 선행 문서 100% 포함
- **태그 연관성**: 목표 태그와 80% 이상 일치
- **사용자 만족도**: 컨텍스트 적합성 평가

### 성능 지표
- **선택 속도**: 100개 문서 기준 <100ms
- **메모리 사용량**: 선형 증가 (O(n))
- **설정 유연성**: 실시간 전략 변경 지원

이 지침서는 llms-generator가 단순한 문서 요약 도구를 넘어서 지능적인 콘텐츠 큐레이션 시스템으로 발전할 수 있는 로드맵을 제시합니다.