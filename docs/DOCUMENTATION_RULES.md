# Documentation Management Rules

Context-Action 프레임워크 문서 관리를 위한 종합적인 규칙과 가이드라인입니다.

## 🎯 핵심 철학: **Setup 스펙 재사용 중심 문서화**

**"Setup 가이드의 스펙을 정의하고, 모든 패턴 문서에서 재사용한다"**

### 🌟 핵심 가치

- **통합된 이해**: 모든 문서가 동일한 스펙 사용으로 일관된 학습 경험
- **개발 생산성**: Setup 스펙 기반 예제로 Copy-paste 시 바로 동작하는 코드
- **유지보수 효율성**: Setup 가이드 한 곳만 수정하면 모든 관련 문서 자동 일관성 유지
- **Zero Duplication**: 단일 정보원으로 문서 간 불일치 완전 제거

## 📋 목차

1. [Setup 스펙 정의 시스템](#setup-스펙-정의-시스템)
2. [스펙 재사용 패턴 문서](#스펙-재사용-패턴-문서)
3. [스펙 기반 코드 예제](#스펙-기반-코드-예제)
4. [스펙 재사용 Import 규칙](#스펙-재사용-import-규칙)
5. [스펙 참조 시스템](#스펙-참조-시스템)
6. [스펙 기반 유지보수](#스펙-기반-유지보수)

---

## Setup 스펙 정의 시스템

### 🏗️ Setup = 스펙 정의소 (Specification Definition)

Setup 가이드는 **재사용 가능한 표준 스펙**을 정의하는 핵심 문서입니다.

#### 스펙 정의 원칙
- **표준 스펙 정의**: 모든 타입, 네이밍, 패턴의 **공식 스펙** 정의
- **재사용 중심 설계**: 패턴 문서에서 **바로 사용 가능한** 스펙 제공
- **단일 정보원**: 하나의 개념은 **오직 한 곳**에서만 정의
- **스펙 완결성**: 실제 프로젝트에서 **바로 적용 가능한** 완전한 스펙

#### 스펙 재사용 플로우
```
Setup 가이드 (스펙 정의)  →  패턴 문서 (스펙 재사용)  →  실제 프로젝트 (스펙 적용)

1. Setup에서 표준 스펙 정의
   ↓
2. 패턴 문서에서 스펙 참조 및 재사용
   ↓  
3. 개발자가 스펙 기반으로 구현
```

### 📁 Setup 스펙 디렉토리 구조
```
docs/en/guide/patterns/setup/          # 🏗️ 스펙 정의소
├── index.md                          # 스펙 가이드 개요 및 재사용 매뉴얼
├── basic-action-setup.md            # Action Context 표준 스펙
├── basic-store-setup.md             # Store Context 표준 스펙  
├── ref-context-setup.md             # RefContext 표준 스펙
├── provider-composition-setup.md    # Provider 조합 표준 스펙
└── multi-context-setup.md           # 복합 아키텍처 표준 스펙

docs/en/guide/patterns/store/         # 📚 스펙 재사용소
├── basic-usage.md                   # ← basic-store-setup.md 스펙 재사용
├── store-configuration.md           # ← basic-store-setup.md 스펙 재사용
└── useStoreManager-api.md           # ← basic-store-setup.md 스펙 재사용

docs/en/guide/patterns/action/        # 📚 스펙 재사용소  
├── basic-usage.md                   # ← basic-action-setup.md 스펙 재사용
├── dispatch-access.md               # ← basic-action-setup.md 스펙 재사용
└── type-system.md                   # ← basic-action-setup.md 스펙 재사용
```

### 스펙 정의 작성 규칙

#### 스펙 정의 핵심 규칙

```typescript
// ✅ Setup 스펙 정의 → 모든 패턴 문서에서 재사용
interface UserStores {
  profile: { id: string; name: string; email: string; role: 'admin' | 'user' | 'guest' };
  preferences: { theme: 'light' | 'dark'; language: string; notifications: boolean };
}

// ✅ 표준 리네이밍 패턴
const {
  Provider: UserStoreProvider,      // {Domain}StoreProvider
  useStore: useUserStore,          // use{Domain}Store
  useStoreManager: useUserStoreManager  // use{Domain}StoreManager
} = createStoreContext('User', userStoreConfig);

// ❌ 패턴 문서에서 새로운 타입 정의 금지
// basic-usage.md: interface MyStores { ... }  ← 금지
// store-config.md: interface AppStores { ... } ← 금지
```

---

## 스펙 재사용 패턴 문서

### 📚 **스펙 재사용소** 표준 문서 구조

패턴 문서는 Setup 가이드의 **표준 스펙을 재사용**하여 사용법을 설명합니다.

```markdown
# Pattern Name

Brief description using setup spec terminology.

## Import
```typescript
// Framework import
import { useStoreValue } from '@context-action/react';
// 🎯 Setup 스펙 재사용: 가상의 setup 참조로 스펙 통일성 보장
import { useUserStore, UserStoreProvider } from '../setup/stores';
```

## Key Features  
- ✅ Features explained using setup spec concepts

## Prerequisites  
🔗 **스펙 재사용 참조**: Setup 가이드에서 정의한 스펙 참조

## Usage Patterns
🎯 **스펙 기반 예제**: Setup 스펙을 재사용한 실제 사용 예제들

## Best Practices
💡 **스펙 일관된** 권장 사항들

## Real-World Examples  
🌐 실제 코드베이스 링크 (스펙 기반)
```

#### 🎯 **스펙 재사용 원칙**
- **No New Specs**: 패턴 문서에서 새로운 타입이나 네이밍 정의 **절대 금지**
- **Reference Only**: Setup 가이드에서 정의한 스펙만 **참조하여 재사용**
- **Consistent Usage**: 모든 예제는 Setup 스펙과 **100% 일치**

#### 🔄 **새로운 스펙이 필요한 경우: 제안 → 검토 → 마이그레이션**

기존 Setup 스펙으로 설명하기 어려운 기능이 있을 때의 체계적 접근법:

##### 1️⃣ **제안 문서 생성** (`docs/en/guide/patterns/proposals/` 디렉토리)
```markdown
# 새로운 기능 설명을 위한 임시 타입 정의

## 제안 배경
기존 UserStores 스펙으로는 [특정 기능]을 명확히 설명하기 어려워 새로운 타입 제안

## 임시 타입 정의 (제안용)
```typescript
// 🚧 임시 제안 타입 - 향후 setup 가이드로 마이그레이션 예정
interface ProposedAdvancedStores {
  realTimeData: {
    stream: EventSource;
    buffer: DataBuffer;
    connectionState: 'connected' | 'disconnecting' | 'reconnecting';
  };
  // ... 새로운 기능 설명용 타입들
}
```

## 사용 예제
[새로운 기능을 설명하는 예제들]

## 마이그레이션 계획
- [ ] Setup 가이드 리뷰 및 승인
- [ ] basic-store-setup.md에 새 타입 추가
- [ ] 관련 패턴 문서들 업데이트
- [ ] 제안 문서 아카이브
```

##### 2️⃣ **마이그레이션 프로세스**
```
1. proposals/new-feature-types.md 생성
   ↓
2. 임시 타입으로 기능 설명
   ↓  
3. 리뷰 및 승인 과정
   ↓
4. setup/basic-store-setup.md에 공식 스펙 추가
   ↓
5. 관련 패턴 문서들에서 새 스펙 참조
   ↓
6. proposals/ 문서 아카이브
```

##### 3️⃣ **제안 문서 템플릿**
```markdown
# [Feature] Type Proposal

## 🎯 제안 목적
현재 Setup 스펙으로 설명 불가능한 [구체적 기능] 설명을 위한 임시 타입 제안

## 🚧 임시 타입 정의
```typescript
// ⚠️ 임시 제안 타입 - 공식 스펙 아님
// 향후 setup/[target-setup].md로 마이그레이션 예정
interface Proposed[Domain]Types {
  // 새로운 기능 설명용 타입들
}
```

## 📝 기능 설명 예제
// 임시 타입을 사용한 기능 설명

## 🔄 마이그레이션 체크리스트
- [ ] Setup 가이드 리뷰
- [ ] 공식 스펙 추가: setup/[target].md
- [ ] 패턴 문서 업데이트
- [ ] 제안 문서 아카이브

## ⚠️ 주의사항
이 문서의 타입은 **임시 제안용**이며, 실제 프로젝트에서는 공식 Setup 스펙 사용을 권장합니다.
```

##### 4️⃣ **디렉토리 구조** 
```
docs/en/guide/patterns/
├── setup/                    # 🏗️ 공식 스펙 정의소
│   ├── basic-store-setup.md
│   ├── basic-action-setup.md
│   ├── ref-context-setup.md
│   └── multi-context-setup.md
├── proposals/                # 🚧 임시 제안 문서 (현재 존재)
│   └── debug-store-types.md  # 실제 예시
├── store/                    # 📚 Store 패턴들 (스펙 재사용)
│   ├── basic-usage.md        # ← basic-store-setup 스펙 재사용 ✅
│   ├── store-configuration.md
│   └── useStoreManager-api.md
├── action/                   # 📚 Action 패턴들 (스펙 재사용)
│   ├── basic-usage.md        # ← basic-action-setup 스펙 재사용 필요
│   ├── dispatch-access.md
│   └── type-system.md
└── archived-proposals/       # 📦 마이그레이션 완료된 제안들
    └── ...
```

### 🔗 **스펙 재사용 참조** Prerequisites 섹션 규칙
```markdown
## Prerequisites

🎯 **스펙 재사용**: For complete setup instructions including [specific setup aspects], see **[Setup Guide Name](../setup/setup-file.md)**.

This document demonstrates usage patterns using the [domain] setup:
- Type definitions → [Specific Section](../setup/setup-file.md#section-anchor)
- Context creation → [Specific Section](../setup/setup-file.md#section-anchor)  
- Provider setup → [Specific Section](../setup/setup-file.md#section-anchor)
```

#### 📚 **통합된 이해를 위한** Prerequisites 작성법
```markdown
## Prerequisites

🏗️ **Setup 스펙 재사용**: For complete store setup patterns, see **[Basic Store Setup](../setup/basic-store-setup.md)**.

📖 **이 문서의 모든 예제**는 아래 setup 스펙을 재사용합니다:
- 🎯 Store types → [UserStores Interface](../setup/basic-store-setup.md#user-domain-stores)
- 🎯 Hook naming → [useUserStore Pattern](../setup/basic-store-setup.md#single-domain-store-context)
- 🎯 Provider setup → [UserStoreProvider Usage](../setup/basic-store-setup.md#single-provider-setup)

💡 **일관된 학습**: Setup 가이드를 먼저 읽으면 이 문서의 모든 예제를 **즉시 이해**할 수 있습니다.
```

---

## 스펙 기반 코드 예제

### 핵심 원칙
- **필수**: 모든 예제는 Setup 스펙만 사용
- **금지**: 패턴 문서에서 새로운 타입 정의 절대 금지
- **완전한 예제**: Import부터 사용까지 모든 구문 포함

### 예제 패턴
```typescript
// ✅ Setup 스펙 재사용
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../setup/stores';

function UserProfile() {
  const profileStore = useUserStore('profile');  // Setup 스펙 사용
  const profile: UserStores['profile'] = useStoreValue(profileStore);
  return <div>{profile.name}</div>;
}

// ❌ 금지 패턴
const store = useAppStore('user');  // 비표준 네이밍
const profile: any = { name: 'John' };  // any 타입 사용
```

---

## 네이밍 규칙

### Import 패턴
```typescript
// Framework imports
import { useStoreValue } from '@context-action/react';
// Setup imports
import { useUserStore, UserStoreProvider } from '../setup/stores';
```

### 도메인 네이밍 컨벤션
- **Store**: `{Domain}Stores`, `use{Domain}Store`, `{Domain}StoreProvider`
- **Action**: `{Domain}Actions`, `use{Domain}Action`, `{Domain}ActionProvider`
- **RefContext**: `{Domain}Refs`, `use{Domain}Ref`, `{Domain}RefProvider`

### 변수명 규칙
```typescript
// ✅ 명확한 네이밍
const profileStore = useUserStore('profile');
const userPreferences = useStoreValue(preferencesStore);

// ❌ 모호한 네이밍  
const store = useStore('data');
const value = useStoreValue(store);
```

---

## 상호 참조 시스템

### Setup 가이드 참조 패턴
```markdown
For complete setup instructions, see **[Basic Store Setup](../setup/basic-store-setup.md)**.

This document uses the following setup specs:
- Store types → [UserStores Interface](../setup/basic-store-setup.md#user-domain-stores)
- Hook naming → [useUserStore Pattern](../setup/basic-store-setup.md#context-creation)
```

### 관련 문서 참조
- **Related Patterns**: 다른 패턴 문서 링크
- **Real-World Examples**: GitHub 코드베이스 실제 사용 예제 링크
- **앵커 링크**: kebab-case 사용, 의미 명확한 이름

---

## 유지보수 가이드라인

### 문서 업데이트 프로세스

#### Setup 스펙 변경 시
1. Setup 가이드 수정
2. 참조하는 모든 패턴 문서 식별 및 업데이트
3. 모든 예제가 새 스펙과 일치하는지 검증

#### 패턴 문서 변경 시  
1. Setup 스펙 준수 확인
2. 타입 및 Import 구문 검증
3. 새로운 타입 정의 금지 확인

#### 새로운 기능 설명 시 (제안-마이그레이션)
```
proposals/[feature].md 생성 → 임시 타입 정의 → 리뷰 → Setup에 공식 추가 → 패턴 문서 업데이트 → 아카이브
```

### 품질 체크리스트

#### Setup 가이드 (공식 스펙)
- [ ] 타입 정의 명확하고 구체적
- [ ] 리네이밍 패턴 일관성
- [ ] 다른 문서에서 재사용 적합

#### 패턴 문서 (스펙 재사용)  
- [ ] Setup 가이드 올바른 참조
- [ ] Setup 스펙만 사용 (새 타입 정의 금지)
- [ ] Import 구문 완전하고 정확
- [ ] Prerequisites 섹션 정확

#### 제안 문서 (임시 타입)
- [ ] 🚧 임시 타입 표시
- [ ] 마이그레이션 계획 구체적
- [ ] 공식 스펙 사용 권장 포함

### 자동화 검증
- **링크 검증**: Setup 참조 링크, 앵커 링크, GitHub 링크 유효성
- **타입 일관성**: 패턴 문서가 Setup 스펙과 일치하는지 확인
- **네이밍 검증**: 컨벤션 일관성 확인

### 문서 작성 워크플로우

#### 패턴 문서 작성
1. Setup 가이드 검토 및 스펙 적합성 평가
2. Setup 스펙 재사용하여 패턴 문서 작성  
3. 상호 참조 링크 업데이트

#### 새로운 기능 설명 시
1. `proposals/[feature].md` 생성하여 임시 타입 정의
2. 리뷰 및 승인 후 Setup 가이드에 공식 추가
3. 패턴 문서 업데이트 후 제안 문서 아카이브

#### 제안-마이그레이션 플로우
```
기능 설명 필요 → Setup 스펙으로 가능? → (No) → proposals/ 생성 → 리뷰 → Setup 추가 → 아카이브
```

---

## 템플릿

### Setup 가이드 템플릿
```markdown
# [Domain] Setup

## Type Definitions
interface [Domain]Stores { ... }

## Context Creation  
const { Provider, useStore, useStoreManager } = createStoreContext('[Domain]', config);
```

### 패턴 문서 템플릿
```markdown
# Pattern Name

## Import
import { useStoreValue } from '@context-action/react';
import { use[Domain]Store } from '../setup/[setup-file]';

## Prerequisites
For complete setup, see **[Setup Guide](../setup/[setup-file].md)**.

## Usage Patterns
// Setup 스펙 기반 예제들
```

### 제안 문서 템플릿
```markdown
# [Feature] Type Proposal

🚧 **임시 제안** - 현재 Setup 스펙으로 설명 불가능한 [기능명] 설명용

## 임시 타입 정의
```typescript
// ⚠️ 임시 제안 타입 - 공식 스펙 아님
interface Proposed[Domain]Types { [newFeature]: { ... }; }
```

## 마이그레이션 계획
- [ ] 리뷰 및 검증
- [ ] setup/[target].md에 공식 스펙 추가  
- [ ] 패턴 문서 업데이트 후 아카이브

⚠️ **주의**: 실제 프로젝트에서는 공식 Setup 스펙 사용 권장
```

---

## 🎯 **성공 사례 검증**

### ✅ **현재 구현 성공 사례**
1. **[Store Basic Usage](../docs/en/guide/patterns/store/basic-usage.md)**: 완벽한 스펙 재사용 구현
   - Setup 스펙 정확한 Import: `import { useUserStore } from '../setup/stores'`
   - Prerequisites 섹션: Setup 가이드 올바른 참조
   - 예제 일관성: UserStores 타입만 사용, 새 타입 정의 없음

### 🔄 **개선 중인 사례**
2. **Action 패턴 문서들**: Setup 스펙 재사용으로 마이그레이션 중
   - `action/basic-usage.md` → `basic-action-setup.md` 스펙 재사용 적용
   - `action/dispatch-access.md` → 일관된 EventActions 패턴 사용

### 📊 **스펙 재사용 효과**
- **학습 효율성**: Setup 1번 학습 → 모든 패턴 문서 즉시 이해
- **개발 생산성**: Copy-paste 시 바로 동작하는 코드 예제
- **유지보수성**: Setup 가이드 1곳 수정 → 전체 문서 자동 일관성 유지

---

## 결론

이 **Setup 스펙 재사용 중심 문서화**를 통해 Context-Action 프레임워크는:

- **학습자 중심**: 최소 노력으로 최대 이해를 얻는 문서 구조
- **개발자 친화적**: 문서 예제를 바로 프로젝트에 적용 가능
- **장기적 지속성**: 유지보수 부담 최소화와 품질 지속성 보장

업계 최고 수준의 **통합되고 일관된** 문서화 경험을 제공합니다.