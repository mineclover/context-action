# Code Structure Guide

## 일관된 코드 구조 표준

### 페이지 구조 패턴

#### 기본 페이지 구조
```
pages/
├── [domain]/
│   ├── [PageName]Page.tsx           # 메인 페이지 컴포넌트
│   ├── components/                  # 페이지별 컴포넌트
│   │   ├── [ComponentName].tsx
│   │   └── index.ts                # 배럴 export
│   ├── hooks/                       # 페이지별 커스텀 훅
│   │   ├── use[HookName].ts
│   │   └── index.ts
│   ├── contexts/                    # 페이지별 컨텍스트
│   │   ├── [ContextName]Context.tsx
│   │   └── index.ts
│   └── types/                       # 페이지별 타입
│       ├── [TypeName].ts
│       └── index.ts
```

### 명명 규칙

#### 파일 명명
- **페이지**: `[PageName]Page.tsx` (PascalCase + Page 접미사)
- **컴포넌트**: `[ComponentName].tsx` (PascalCase)
- **훅**: `use[HookName].ts` (camelCase + use 접두사)
- **컨텍스트**: `[ContextName]Context.tsx` (PascalCase + Context 접미사)
- **타입**: `[TypeName].ts` (PascalCase)

#### 디렉토리 명명
- **도메인 디렉토리**: kebab-case (예: `action-guard`, `store-patterns`)
- **기능별 디렉토리**: 복수형 사용 (`components`, `hooks`, `contexts`, `types`)

### 컴포넌트 구조 표준

#### 페이지 컴포넌트 템플릿
```typescript
/**
 * [PageName] Page
 * [페이지 설명]
 */

import React from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  DomainLayout,
  Section,
  DemoCard,
  CodeExample
} from '../../domains/shared/components';

// 로컬 컴포넌트 import
import { LocalComponent1, LocalComponent2 } from './components';

// 페이지별 훅 import
import { usePageLogic, usePageData } from './hooks';

function [PageName]PageContent() {
  const logger = useActionLoggerWithToast();
  const { data, actions } = usePageLogic();
  
  return (
    <DomainLayout
      title="[Page Title]"
      description="[Page Description]"
    >
      <div className="space-y-8">
        <Section title="Section 1">
          <LocalComponent1 />
        </Section>
        
        <Section title="Section 2">
          <LocalComponent2 />
        </Section>
      </div>
    </DomainLayout>
  );
}

function [PageName]Page() {
  return (
    <PageWithLogMonitor>
      <[PageName]PageContent />
    </PageWithLogMonitor>
  );
}

export default [PageName]Page;
```

### Import 순서 표준

```typescript
// 1. React 및 라이브러리
import React, { useCallback, useEffect, useState } from 'react';

// 2. Context-Action 프레임워크
import {
  createActionContext,
  createStoreContext,
  useStoreValue
} from '@context-action/react';

// 3. 공통 컴포넌트 (상위 → 하위)
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';

// 4. 도메인 shared 컴포넌트
import {
  DomainLayout,
  Section,
  DemoCard
} from '../../domains/shared/components';

// 5. 페이지 로컬 컴포넌트
import { LocalComponent } from './components';

// 6. 훅 및 유틸리티
import { usePageLogic } from './hooks';

// 7. 타입
import type { PageProps, ComponentState } from './types';
```

### 코드 스타일 가이드

#### 컴포넌트 선언
```typescript
// ✅ 권장: function declaration
function ComponentName({ prop1, prop2 }: Props) {
  return <div>...</div>;
}

// ❌ 비권장: arrow function for components
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  return <div>...</div>;
};
```

#### Props 인터페이스
```typescript
// ✅ 권장: Props 접미사
interface ComponentNameProps {
  data: DataType;
  onAction: (value: string) => void;
  className?: string;
}

// ❌ 비권장: IProps 접두사
interface IComponentNameProps {
  // ...
}
```

#### State 타입 정의
```typescript
// ✅ 권장: State 접미사로 명확한 타입 정의
interface ComponentState {
  isLoading: boolean;
  error: string | null;
  data: DataType[];
}

const [state, setState] = useState<ComponentState>({
  isLoading: false,
  error: null,
  data: []
});
```

### 디렉토리 정리 계획

#### 현재 문제점
1. 일관성 없는 명명 규칙 (PascalCase, camelCase, kebab-case 혼재)
2. 깊은 중첩 구조 (예: priority-performance, mouse-events)
3. 중복된 기능과 컴포넌트들
4. 페이지별 구조 차이

#### 정리 순서
1. **도메인별 그룹화**: 관련 페이지들을 도메인별로 묶기
2. **구조 표준화**: 모든 페이지에 동일한 디렉토리 구조 적용
3. **명명 규칙 통일**: 파일 및 디렉토리 명명 규칙 일관성 확보
4. **중복 제거**: 공통 기능을 shared 도메인으로 이동
5. **Navigation 업데이트**: 새로운 구조에 맞게 라우팅 정리

### 마이그레이션 체크리스트

- [ ] 페이지별 구조 표준화
- [ ] 명명 규칙 통일 
- [ ] Import 순서 정리
- [ ] 공통 컴포넌트 추출
- [ ] 타입 정의 개선
- [ ] 코드 스타일 통일
- [ ] Navigation 구조 정리
- [ ] 문서화 업데이트