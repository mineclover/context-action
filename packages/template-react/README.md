# @context-action/template-react

Standard Context-Action React Starter Template with Astryx Design System Theme Contract and State Tiering Governance.

Context-Action 프레임워크와 Astryx 디자인 시스템 테마, 그리고 TypeSpec Evidence 계약 거버넌스를 완벽히 결합한 React 프로젝트 시작 템플릿입니다.

---

## 🎯 특징

1. **Astryx 디자인 시스템 연동 (`src/theme/`)**:
   - `astryx-theme-extension-guide`의 Primitive $\to$ Semantic $\to$ CSS Variable 매핑 모델 탑재.
   - Context-Action 기반 `ThemeContext`를 통해 런타임 다크/라이트 모드 전환 지원.
2. **Context-Layered Architecture 표준 6-Layer**:
   - `contexts / business / handlers / actions / hooks / views`의 완벽한 관심사 분리.
3. **3단계 상태 계층화 (State Tiering) 준수**:
   - **Tier 1 (Durable Domain Contract)**: TypeSpec SSOT 연동 준비 완료 (`@evidenceReview` 주석 탑재).
   - **Tier 2 (Transient Application Logic)**: `business/` 내 순수 함수로 안전하게 격리.
   - **Tier 3 (Volatile Presentation State)**: 컴포넌트 로컬 상태(`useState`)로만 관리하여 거버넌스 피로도 원천 차단 (Presentation Waiver 준수).

---

## 🏗️ 폴더 구조

```text
src/
├── theme/                     # Astryx 디자인 시스템 테마
│   ├── primitives.ts          # Primitive Tokens (색상, 타이포, 반경, 모션)
│   ├── semantics.ts           # Semantic Tokens (Action, Surface, Content, Border, Status)
│   ├── astryx-mapping.ts      # toAstryxTokens 어댑터 (CSS 변수 생성)
│   ├── theme-contract.ts      # 테마 정의 계약
│   └── ThemeContext.tsx       # Context-Action Design Context
├── features/
│   └── order-workspace/       # Context-Layered 표준 워크스페이스
│       ├── contexts/          # Action & Store Contexts (Tier 1)
│       ├── business/          # Pure Functions (Validation, FSM, Policy Hopping)
│       ├── handlers/          # Handlers & Registry
│       ├── actions/           # View Dispatch Helpers
│       ├── hooks/             # Store Subscription & Derived Models
│       └── views/             # Astryx Token UI View (Tier 3 Local State)
└── styles/
    └── global.css             # Astryx CSS 변수 기반 전역 스타일
```

---

## 🚀 빠른 시작

```bash
# 개발 서버 시작
pnpm dev

# 타입 검증
pnpm type-check

# 프로덕션 빌드
pnpm build
```
