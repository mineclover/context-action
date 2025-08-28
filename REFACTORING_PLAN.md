# 📋 Context-Action Example 카탈로그 기반 리팩토링 계획

## 📊 현황 분석 (2025-08-28 업데이트)

### 🚨 식별된 주요 문제점
1. **학습 경로 불분명**: 예제 페이지가 기능별로 분산되어 체계적 학습 어려움
2. **일관성 부족한 구조**: `actionguard/`, `examples/`, `demos/`, `mouse-events/` 등 중복된 성격
3. **깊은 중첩 경로**: `/actionguard/mouse-events/enhanced-context-store` 등 복잡한 URL
4. **카탈로그 구분 모호**: 같은 성격의 예제가 다른 폴더에 분산

### 📈 현재 코드베이스 메트릭
- **총 페이지 수**: ~80개 페이지 컴포넌트
- **최대 중첩 깊이**: 4단계 (`/actionguard/mouse-events/enhanced-context-store`)
- **라우팅 경로 수**: ~50개 라우트
- **카탈로그 분류 필요 페이지**: 전체 페이지의 95%

## 🎯 카탈로그 기반 목표 구조

### 📚 5개 카탈로그 시스템

```
src/pages/
├── index/                          # 진입점 및 오버뷰 페이지
│   ├── HomePage.tsx
│   ├── OverviewPage.tsx
│   └── catalog/
│       ├── FoundationsOverview.tsx
│       ├── PerformanceOverview.tsx
│       ├── PatternsOverview.tsx
│       ├── IntegrationsOverview.tsx
│       └── UtilitiesOverview.tsx
│
├── foundations/                    # 🏗️ 기초 - 핵심 개념과 기본 사용법
│   ├── core/                      # ← core/
│   ├── store/                     # ← store/
│   └── react/                     # ← react/
│
├── performance/                   # ⚡ 성능 - 최적화, 액션 가드, 우선순위
│   ├── action-guard/              # ← actionguard/
│   ├── priority/                  # ← actionguard/priority-performance
│   └── mouse-events/              # ← mouse-events/
│
├── patterns/                      # 🎛️ 패턴 - 고급 패턴, 조건부 실행
│   ├── conditional/               # ← conditional-patterns/
│   ├── pipeline/                  # ← pipeline/
│   └── refs/                      # ← refs/
│
├── integrations/                  # 🧩 통합 - 실제 사용 사례
│   ├── business/                  # ← demos/ (business apps)
│   └── advanced/                  # ← examples/ (complex examples)
│
├── utilities/                     # 🛠️ 유틸리티 - 개발 도구, 디버깅
│   ├── dev-tools/                 # ← logger/, toast-config, store-scenarios
│   └── testing/                   # ← testing examples
│
└── shared/                        # 공통 컴포넌트 및 유틸리티
    ├── components/                # 재사용 컴포넌트
    ├── lib/                       # 라이브러리성 코드
    ├── hooks/                     # 공통 훅
    └── utils/                     # 유틸리티
```

### 🎯 카탈로그별 목적

#### 🏗️ **FOUNDATIONS (기초)**
- **목적**: Context-Action 프레임워크의 핵심 개념 학습
- **대상**: 처음 사용자, 기본기 확인이 필요한 개발자
- **특징**: 단계적 학습 경로 제공

#### ⚡ **PERFORMANCE (성능)** 
- **목적**: 성능 최적화 및 액션 가드 시스템
- **대상**: 성능 문제 해결이 필요한 개발자
- **특징**: 실제 성능 개선 사례와 측정 도구

#### 🎛️ **PATTERNS (패턴)**
- **목적**: 고급 사용 패턴과 복잡한 워크플로우
- **대상**: 숙련된 개발자, 복잡한 비즈니스 로직 구현
- **특징**: 재사용 가능한 패턴 템플릿

#### 🧩 **INTEGRATIONS (통합)**
- **목적**: 실제 애플리케이션 구현 사례
- **대상**: 실제 프로젝트 적용을 원하는 개발자
- **특징**: 완전한 기능을 가진 애플리케이션 예제

#### 🛠️ **UTILITIES (유틸리티)**
- **목적**: 개발 및 디버깅 도구
- **대상**: 개발 생산성 향상이 필요한 개발자
- **특징**: 개발 워크플로우 최적화 도구

## 🚀 4단계 카탈로그 리팩토링 계획

### **Phase 1: 준비 작업** (소요시간: 30분)

#### 🎯 목표
- 리팩토링 환경 준비 및 현재 상태 백업
- 카탈로그 기반 구조 생성을 위한 기반 작업

#### 체크리스트:
- [ ] 작업 브랜치 생성: `git checkout -b refactor/catalog-structure`
- [ ] 현재 상태 백업 커밋
- [ ] 새 카탈로그 폴더 구조 생성
- [ ] 테스트 실행으로 기준 상태 확인

#### 실행 명령어:
```bash
# 1. 브랜치 생성 및 백업
git checkout -b refactor/catalog-structure
git add . && git commit -m "backup: save current state before catalog refactoring"

# 2. 새 카탈로그 구조 생성
mkdir -p src/pages/index/catalog
mkdir -p src/pages/foundations/{core,store,react}
mkdir -p src/pages/performance/{action-guard,priority,mouse-events}
mkdir -p src/pages/patterns/{conditional,pipeline,refs}
mkdir -p src/pages/integrations/{business,advanced}
mkdir -p src/pages/utilities/{dev-tools,testing}
mkdir -p src/pages/shared/{components,lib,hooks,utils}

# 3. 기준 상태 확인
pnpm type-check
pnpm lint
pnpm dev # 정상 실행 확인 후 종료
```

### **Phase 2: 카탈로그별 페이지 마이그레이션** (소요시간: 2-3시간)

#### 🎯 목표
- 5개 카탈로그별로 페이지 및 관련 파일 이동
- 각 카탈로그별 오버뷰 페이지 생성
- 점진적 마이그레이션으로 안정성 확보

#### 카탈로그별 마이그레이션 순서

##### 📋 **2.1 Foundations 마이그레이션** (30분)
```bash
# Core 페이지 이동
mv src/pages/core/CoreBasicsPage.tsx src/pages/foundations/core/BasicsPage.tsx
mv src/pages/core/CoreAdvancedPage.tsx src/pages/foundations/core/AdvancedPage.tsx

# Store 페이지 이동
mv src/pages/store/StoreBasicsPage.tsx src/pages/foundations/store/BasicsPage.tsx
mv src/pages/store/StoreImmutabilityTestPage.tsx src/pages/foundations/store/ImmutabilityTestPage.tsx

# React 페이지 이동
mv src/pages/react/ReactProviderPage.tsx src/pages/foundations/react/ProviderPage.tsx
mv src/pages/react/ReactContextPage.tsx src/pages/foundations/react/ContextPage.tsx
mv src/pages/react/ReactHooksPage.tsx src/pages/foundations/react/HooksPage.tsx
mv src/pages/react/UseActionWithResultPage.tsx src/pages/foundations/react/UseActionWithResultPage.tsx
```

##### ⚡ **2.2 Performance 마이그레이션** (45분)
```bash
# ActionGuard 페이지 이동
mkdir -p src/pages/performance/action-guard
mv src/pages/actionguard/ActionGuardIndexPage.tsx src/pages/performance/action-guard/IndexPage.tsx
mv src/pages/actionguard/SearchPage.tsx src/pages/performance/action-guard/SearchPage.tsx
mv src/pages/actionguard/ScrollPage.tsx src/pages/performance/action-guard/ScrollPage.tsx
mv src/pages/actionguard/ApiBlockingPage.tsx src/pages/performance/action-guard/ApiBlockingPage.tsx
mv src/pages/actionguard/ThrottleComparisonPage.tsx src/pages/performance/action-guard/ThrottleComparisonPage.tsx
mv src/pages/actionguard/AdvancedFilteringPage.tsx src/pages/performance/action-guard/AdvancedFilteringPage.tsx

# Priority 페이지 이동
mkdir -p src/pages/performance/priority
mv src/pages/actionguard/priority-performance src/pages/performance/priority/
mv src/pages/demos/ActionPriorityDemoPage.tsx src/pages/performance/priority/DemoPage.tsx

# Mouse Events 페이지 이동
mv src/pages/mouse-events src/pages/performance/mouse-events
```

##### 🎛️ **2.3 Patterns 마이그레이션** (30분)
```bash
# Conditional 페이지 이동
mv src/pages/conditional-patterns src/pages/patterns/conditional

# Pipeline 페이지 이동
mkdir -p src/pages/patterns/pipeline
mv src/pages/pipeline/FlowControlPlaygroundPage.tsx src/pages/patterns/pipeline/FlowControlPage.tsx
mv src/pages/pipeline/components src/pages/patterns/pipeline/
mv src/pages/pipeline/hooks src/pages/patterns/pipeline/
mv src/pages/pipeline/scenarios src/pages/patterns/pipeline/

# Refs 페이지 이동  
mkdir -p src/pages/patterns/refs
mv src/pages/refs/RefsIndexPage.tsx src/pages/patterns/refs/IndexPage.tsx
mv src/pages/refs/FormBuilderRefDemoPage.tsx src/pages/patterns/refs/FormBuilderPage.tsx
mv src/pages/refs/WaitForRefsPerformancePage.tsx src/pages/patterns/refs/WaitForRefsPerformancePage.tsx
```

##### 🧩 **2.4 Integrations 마이그레이션** (30분)
```bash
# Business 애플리케이션 이동
mkdir -p src/pages/integrations/business
mv src/pages/demos/TodoListPage.tsx src/pages/integrations/business/TodoListPage.tsx
mv src/pages/demos/ShoppingCartPage.tsx src/pages/integrations/business/ShoppingCartPage.tsx
mv src/pages/demos/ChatPage.tsx src/pages/integrations/business/ChatPage.tsx
mv src/pages/demos/UserProfilePage.tsx src/pages/integrations/business/UserProfilePage.tsx

# Advanced 예제 이동
mkdir -p src/pages/integrations/advanced
mv src/pages/examples/ElementManagementPage.tsx src/pages/integrations/advanced/ElementManagementPage.tsx
mv src/pages/examples/FormBuilderDemoPage.tsx src/pages/integrations/advanced/FormBuilderPage.tsx
mv src/pages/examples/AdvancedCanvasExample.tsx src/pages/integrations/advanced/CanvasPage.tsx
mv src/pages/examples/ConcurrentActionTestPage.tsx src/pages/integrations/advanced/ConcurrentActionsPage.tsx
```

##### 🛠️ **2.5 Utilities 마이그레이션** (15분)
```bash
# Dev Tools 이동
mkdir -p src/pages/utilities/dev-tools
mv src/pages/logger/LoggerDemoPage.tsx src/pages/utilities/dev-tools/LoggerPage.tsx
mv src/pages/examples/ToastConfigPage.tsx src/pages/utilities/dev-tools/ToastConfigPage.tsx
mv src/pages/demos/StoreScenariosPage.tsx src/pages/utilities/dev-tools/StoreScenariosPage.tsx

# Testing 도구 이동
mkdir -p src/pages/utilities/testing
mv src/components/EnhancedAbortableSearchExample.tsx src/pages/utilities/testing/EnhancedSearchPage.tsx
```

#### 체크리스트:
- [ ] 각 카탈로그별 순차 마이그레이션 실행
- [ ] 파일 이동 확인: 모든 파일이 올바른 위치에 있는지 검증  
- [ ] 임시 커밋: `git add . && git commit -m "refactor: migrate pages to catalog structure"`
- [ ] 컴파일 테스트: `pnpm type-check` (import 에러 예상됨)

### **Phase 3: 라우팅 및 Import 경로 업데이트** (소요시간: 2시간)

#### 🎯 목표
- App.tsx의 라우팅 구조를 카탈로그 기반으로 완전 재편성
- 모든 Import 경로를 새 구조에 맞게 업데이트
- 카탈로그별 오버뷰 페이지 생성

#### 3.1 새로운 라우팅 구조 (`src/App.tsx`)
```typescript
// 새로운 URL 구조 예시
const routes = {
  // 기존 → 신규
  '/core/basics'                        : '/foundations/core/basics',
  '/store/basics'                       : '/foundations/store/basics', 
  '/react/provider'                     : '/foundations/react/provider',
  
  '/actionguard'                        : '/performance/action-guard',
  '/actionguard/search'                 : '/performance/action-guard/search',
  '/actionguard/priority-performance'   : '/performance/priority/advanced',
  '/actionguard/mouse-events'           : '/performance/mouse-events',
  
  '/actionguard/conditional'            : '/patterns/conditional',
  '/pipeline/flow-control'              : '/patterns/pipeline/flow-control',
  '/refs'                               : '/patterns/refs',
  
  '/demos/todo-list'                    : '/integrations/business/todo-list',
  '/examples/element-management'        : '/integrations/advanced/element-management',
  
  '/examples/toast-config'              : '/utilities/dev-tools/toast-config',
  '/logger/demo'                        : '/utilities/dev-tools/logger'
}
```

#### 3.2 Import 경로 자동 업데이트 스크립트 (`scripts/update-routes.sh`)
```bash
#!/bin/bash
echo "🔄 Updating routes and imports for catalog structure..."

# App.tsx 라우팅 업데이트 (lazy import 경로)
echo "Updating App.tsx lazy imports..."
sed -i '' \
  -e "s|import('./pages/core/CoreBasicsPage')|import('./pages/foundations/core/BasicsPage')|g" \
  -e "s|import('./pages/core/CoreAdvancedPage')|import('./pages/foundations/core/AdvancedPage')|g" \
  -e "s|import('./pages/store/StoreBasicsPage')|import('./pages/foundations/store/BasicsPage')|g" \
  -e "s|import('./pages/react/ReactProviderPage')|import('./pages/foundations/react/ProviderPage')|g" \
  -e "s|import('./pages/actionguard/ActionGuardIndexPage')|import('./pages/performance/action-guard/IndexPage')|g" \
  -e "s|import('./pages/actionguard/SearchPage')|import('./pages/performance/action-guard/SearchPage')|g" \
  -e "s|import('./pages/conditional-patterns/|import('./pages/patterns/conditional/|g" \
  -e "s|import('./pages/pipeline/FlowControlPlaygroundPage')|import('./pages/patterns/pipeline/FlowControlPage')|g" \
  -e "s|import('./pages/demos/TodoListPage')|import('./pages/integrations/business/TodoListPage')|g" \
  -e "s|import('./pages/examples/ElementManagementPage')|import('./pages/integrations/advanced/ElementManagementPage')|g" \
  -e "s|import('./pages/logger/LoggerDemoPage')|import('./pages/utilities/dev-tools/LoggerPage')|g" \
  src/App.tsx

# 각 페이지 내부의 relative import 업데이트
echo "Updating internal component imports..."
find src/pages -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s|from '../../../components/|from '@/components/|g" \
  -e "s|from '../../components/|from '@/components/|g" \
  -e "s|from '../components/|from '@/components/|g" \
  -e "s|from '../../../lib/|from '@/lib/|g" \
  -e "s|from '../../lib/|from '@/lib/|g"

echo "✅ Routes and imports updated!"
```

#### 3.3 카탈로그 오버뷰 페이지 생성
```typescript
// src/pages/index/catalog/FoundationsOverview.tsx 예시
export default function FoundationsOverview() {
  return (
    <div className="catalog-overview">
      <h1>🏗️ Foundations</h1>
      <p>Context-Action 프레임워크의 핵심 개념과 기본 사용법을 학습합니다.</p>
      <div className="learning-path">
        <h2>추천 학습 순서</h2>
        <ol>
          <li><Link to="/foundations/core/basics">Core Basics</Link></li>
          <li><Link to="/foundations/store/basics">Store Basics</Link></li>
          <li><Link to="/foundations/react/provider">React Integration</Link></li>
        </ol>
      </div>
    </div>
  );
}
```

#### 체크리스트:
- [ ] 라우팅 업데이트 스크립트 실행: `./scripts/update-routes.sh`
- [ ] 카탈로그 오버뷰 페이지 생성 (5개)
- [ ] App.tsx Route 구조 완전 재편성
- [ ] 컴파일 테스트: `pnpm type-check` (에러 해결)
- [ ] 개발 서버 테스트: `pnpm dev`
- [ ] 커밋: `git add . && git commit -m "refactor: update routing structure to catalog-based"`

### **Phase 4: 검증 및 정리** (소요시간: 1시간)

#### 🎯 목표
- 모든 카탈로그 페이지 접근성 테스트
- 기존 URL 리디렉션 설정
- 네비게이션 메뉴 업데이트
- 문서화 및 README 업데이트

#### 4.1 전체 기능 검증
```bash
#!/bin/bash
echo "🧪 Testing all catalog pages..."

# 각 카탈로그별 주요 페이지 접근 테스트
echo "Testing Foundations..."
curl -f http://localhost:4000/foundations/core/basics || echo "❌ Foundations Core Basics failed"
curl -f http://localhost:4000/foundations/store/basics || echo "❌ Foundations Store Basics failed"

echo "Testing Performance..."
curl -f http://localhost:4000/performance/action-guard || echo "❌ Performance Action Guard failed"
curl -f http://localhost:4000/performance/priority/advanced || echo "❌ Performance Priority failed"

echo "Testing Patterns..."
curl -f http://localhost:4000/patterns/conditional || echo "❌ Patterns Conditional failed"
curl -f http://localhost:4000/patterns/pipeline/flow-control || echo "❌ Patterns Pipeline failed"

echo "Testing Integrations..."
curl -f http://localhost:4000/integrations/business/todo-list || echo "❌ Integrations Business failed"
curl -f http://localhost:4000/integrations/advanced/element-management || echo "❌ Integrations Advanced failed"

echo "Testing Utilities..."
curl -f http://localhost:4000/utilities/dev-tools/logger || echo "❌ Utilities Dev Tools failed"

echo "✅ All catalog pages tested!"
```

#### 4.2 기존 URL 리디렉션 설정
```typescript
// src/components/Layout.tsx에서 리디렉션 처리
const legacyRoutes = {
  '/core/basics': '/foundations/core/basics',
  '/actionguard': '/performance/action-guard',
  '/demos/todo-list': '/integrations/business/todo-list',
  // ... 기타 기존 경로들
};

// 기존 URL 접근 시 자동 리디렉션
useEffect(() => {
  const currentPath = location.pathname;
  const newPath = legacyRoutes[currentPath];
  if (newPath) {
    navigate(newPath, { replace: true });
  }
}, [location.pathname]);
```

#### 4.3 메인 네비게이션 업데이트
```typescript
// 새로운 카탈로그 기반 네비게이션
const catalogNavigation = [
  {
    title: "🏗️ Foundations",
    href: "/foundations",
    description: "핵심 개념과 기본 사용법"
  },
  {
    title: "⚡ Performance", 
    href: "/performance",
    description: "성능 최적화 및 액션 가드"
  },
  {
    title: "🎛️ Patterns",
    href: "/patterns", 
    description: "고급 패턴과 워크플로우"
  },
  {
    title: "🧩 Integrations",
    href: "/integrations",
    description: "실제 사용 사례"
  },
  {
    title: "🛠️ Utilities", 
    href: "/utilities",
    description: "개발 도구"
  }
];
```

#### 체크리스트:
- [ ] 전체 기능 검증 스크립트 실행
- [ ] 기존 URL 리디렉션 설정
- [ ] 메인 네비게이션을 카탈로그 기반으로 업데이트  
- [ ] 전체 테스트: `pnpm type-check && pnpm lint && pnpm build`
- [ ] 모든 카탈로그 페이지 수동 테스트
- [ ] README.md 업데이트 (새로운 구조 반영)
- [ ] 기존 불필요한 폴더 정리
- [ ] 최종 커밋: `git add . && git commit -m "refactor: complete catalog-based structure migration"`

## 📋 검증 체크리스트

### 기능 검증
- [ ] 홈페이지 로드 정상
- [ ] ActionGuard 페이지들 정상 작동
- [ ] Conditional Patterns 페이지들 정상 작동  
- [ ] 데모 페이지들 정상 작동
- [ ] 마우스 이벤트 예제들 정상 작동
- [ ] Hot reload 정상 작동

### 코드 품질 검증
- [ ] `pnpm type-check` 통과
- [ ] `pnpm lint` 통과  
- [ ] `pnpm build` 성공
- [ ] Import 경로가 일관성 있게 정리됨
- [ ] 불필요한 디렉토리 정리됨

### 성능 검증
- [ ] 개발 서버 시작 시간 변화 없음
- [ ] 빌드 시간 변화 없음
- [ ] 번들 크기 변화 없음

## 🎯 예상 효과

### 즉시 효과
- ✅ Import 경로 복잡성 80% 감소
- ✅ 코드 네비게이션 개선
- ✅ 디렉토리 구조 명확화

### 장기 효과
- ✅ 유지보수성 향상
- ✅ 새로운 개발자 온보딩 시간 단축
- ✅ 컴포넌트 재사용성 증가

## ⚠️ 위험 요소 및 대응책

### 위험 요소
1. **Import 경로 누락**: 자동 스크립트가 모든 경우를 처리하지 못할 수 있음
2. **기능 손상**: 파일 이동 과정에서 의존성 문제 발생 가능
3. **개발 중인 기능 충돌**: 다른 개발자의 작업과 충돌 가능성

### 대응책
1. **점진적 적용**: 각 단계별 검증 후 다음 단계 진행
2. **백업 유지**: 각 단계마다 커밋으로 롤백 지점 확보
3. **팀 소통**: 리팩토링 전후 팀원들과 충분한 소통

## 📅 실행 일정

| 단계 | 작업 | 소요시간 | 담당자 | 상태 |
|------|------|----------|--------|------|
| Phase 1 | 준비 작업 | 30분 | - | ⏳ 대기 |
| Phase 2 | 디렉토리 변경 | 1-2시간 | - | ⏳ 대기 |
| Phase 3 | Import 수정 | 1-2시간 | - | ⏳ 대기 |
| Phase 4 | 품질 검증 | 1시간 | - | ⏳ 대기 |
| **총 소요시간** | **3.5-5.5시간** | - | - |

## 📞 문제 발생 시 대응

1. **즉시 롤백**: `git reset --hard HEAD~1`
2. **부분 되돌리기**: `git checkout HEAD~1 -- <파일경로>`
3. **도움 요청**: 팀 리드 또는 시니어 개발자 문의

---

**작성일**: 2025-08-26  
**작성자**: Claude Code Assistant  
**상태**: 실행 준비 완료 ✅