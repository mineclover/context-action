# 설정 및 구성

Context-Action 프레임워크를 위한 공유 설정 패턴과 구성입니다.

## 개요

이 섹션은 모든 패턴 문서에서 참조할 수 있는 재사용 가능한 설정 패턴을 제공합니다. 모든 문서에서 설정 코드를 중복하는 대신, 이러한 공유 구성이 모든 Context-Action 구현의 기초 역할을 합니다.

## 사용 가능한 설정 가이드

### 핵심 설정 패턴

- **[기본 액션 설정](./basic-action-setup.md)** - 액션 컨텍스트 설정 패턴 및 타입 정의
- **[기본 스토어 설정](./basic-store-setup.md)** - 스토어 컨텍스트 설정 패턴 및 구성  
- **[다중 컨텍스트 설정](./multi-context-setup.md)** - 대규모 애플리케이션을 위한 복잡한 아키텍처 설정

### 설정 가이드 사용법

각 설정 가이드는 다음을 제공합니다:

1. **타입 정의** - 일반적인 패턴을 위한 재사용 가능한 인터페이스 정의
2. **컨텍스트 생성** - 네이밍 컨벤션을 가진 표준 컨텍스트 생성 패턴
3. **프로바이더 설정** - 프로바이더 구성 및 조직 패턴
4. **내보내기 패턴** - 컨텍스트와 훅 내보내기를 위한 모범 사례
5. **구성 옵션** - 다양한 시나리오를 위한 고급 구성

## 설정 가이드 사용 방법

### 1. 패턴 문서에서 참조
패턴 문서는 구성 코드를 중복하는 대신 이러한 설정 가이드를 참조합니다:

```markdown
## 전제 조건
액션 컨텍스트 구성은 [기본 액션 설정](../setup/basic-action-setup.md)을 참조하세요.
```

### 2. 복사 및 사용자 정의
제공된 패턴을 시작점으로 사용하고 특정 도메인에 맞게 사용자 정의하세요:

```typescript
// 기본 액션 설정에서 - 도메인에 맞게 사용자 정의
interface MyDomainActions {
  // 기본 패턴을 복사하고 수정
  createItem: { data: MyDomainData };
  updateItem: { id: string; data: Partial<MyDomainData> };
  deleteItem: { id: string };
}
```

### 3. 공유 타입 임포트
공유 타입 정의를 임포트하고 확장하세요:

```typescript
import { CRUDActions, UserActions } from '../setup/basic-action-setup';

interface MyAppActions extends CRUDActions, UserActions {
  customAction: { payload: any };
}
```

## 설정 패턴 카테고리

### 단일 컨텍스트 패턴
하나의 컨텍스트 타입을 사용하는 애플리케이션용:
- 간단한 액션 디스패칭 → **[기본 액션 설정](./basic-action-setup.md)**
- 기본 상태 관리 → **[기본 스토어 설정](./basic-store-setup.md)**

### 다중 컨텍스트 패턴  
여러 컨텍스트를 사용하는 애플리케이션용:
- MVVM 아키텍처 → **[다중 컨텍스트 설정](./multi-context-setup.md#mvvm-architecture-setup)**
- 도메인 주도 설계 → **[다중 컨텍스트 설정](./multi-context-setup.md#domain-context-architecture-setup)**
- 엔터프라이즈 애플리케이션 → **[다중 컨텍스트 설정](./multi-context-setup.md#conditional-multi-context-setup)**

### 고급 패턴
복잡한 애플리케이션용:
- 컨텍스트 간 통신 → **[다중 컨텍스트 설정](./multi-context-setup.md#cross-context-communication-setup)**
- 성능 최적화 → **[다중 컨텍스트 설정](./multi-context-setup.md#mvvm-architecture-setup)** (RefContext)
- 프로바이더 구성 → 모든 설정 가이드에 구성 패턴 포함

## 구성 모범 사례

### 타입 조직
1. **도메인 주도**: 비즈니스 도메인별로 타입 조직화
2. **재사용성**: 일반적인 작업을 위한 재사용 가능한 타입 패턴 생성
3. **일관성**: 도메인 전반에서 일관된 네이밍 컨벤션 사용
4. **확장성**: 향후 확장 및 수정을 위한 타입 설계

### 컨텍스트 관리
1. **명확한 네이밍**: 컨텍스트와 훅에 설명적인 이름 사용
2. **도메인 분리**: 비즈니스 또는 기술 도메인별로 컨텍스트 분리  
3. **프로바이더 구성**: 깔끔한 프로바이더 조직을 위해 유틸리티 사용
4. **성능**: 컨텍스트 구조의 리렌더링 영향 고려

### 설정 문서화
1. **우선 참조**: 코드를 중복하기 전에 항상 설정 가이드 참조
2. **적절한 사용자 정의**: 특정 요구에 맞게 패턴 수정
3. **일관성 유지**: 애플리케이션 전반에서 확립된 패턴 따르기
4. **중앙 업데이트**: 패턴이 발전할 때 설정 가이드 업데이트

## 빠른 참조 매트릭스

| 사용 사례 | 액션 컨텍스트 | 스토어 컨텍스트 | Ref 컨텍스트 | 설정 가이드 |
|----------|----------------|---------------|-------------|-------------|
| 간단한 UI 이벤트 | ✅ | ❌ | ❌ | [기본 액션](./basic-action-setup.md) |
| 기본 상태 관리 | ❌ | ✅ | ❌ | [기본 스토어](./basic-store-setup.md) |
| 폼 처리 | ✅ | ✅ | ❌ | 두 기본 가이드 |
| 성능 최적화 | ✅ | ✅ | ✅ | [다중 컨텍스트](./multi-context-setup.md) |
| MVVM 아키텍처 | ✅ | ✅ | ✅ | [다중 컨텍스트 MVVM](./multi-context-setup.md#mvvm-architecture-setup) |
| 도메인 분리 | ✅ | ✅ | 선택사항 | [다중 컨텍스트 도메인](./multi-context-setup.md#domain-context-architecture-setup) |
| 엔터프라이즈 애플리케이션 | ✅ | ✅ | ✅ | [다중 컨텍스트 엔터프라이즈](./multi-context-setup.md#conditional-multi-context-setup) |

## 패턴 문서와의 통합

이러한 설정 가이드는 패턴 문서와 다음과 같이 통합됩니다:

### 액션 패턴
- **[액션 기본 사용법](../action/basic-usage.md)** → [기본 액션 설정](./basic-action-setup.md) 사용
- **[디스패치 액세스 패턴](../action/dispatch-access.md)** → [기본 액션 설정](./basic-action-setup.md) 사용
- **[고급 액션 패턴](../action/advanced-patterns.md)** → [다중 컨텍스트 설정](./multi-context-setup.md) 사용

### 스토어 패턴
- **[스토어 기본 사용법](../store/basic-usage.md)** → [기본 스토어 설정](./basic-store-setup.md) 사용
- **[스토어 성능 패턴](../store/performance-patterns.md)** → [기본 스토어 설정](./basic-store-setup.md) 사용
- **[스토어 매니저 API](../store/useStoreManager-api.md)** → [기본 스토어 설정](./basic-store-setup.md) 사용

### 아키텍처 패턴
- **[MVVM 아키텍처](../architecture/mvvm.md)** → [다중 컨텍스트 설정](./multi-context-setup.md#mvvm-architecture-setup) 사용
- **[도메인 컨텍스트 아키텍처](../architecture/domain-context.md)** → [다중 컨텍스트 설정](./multi-context-setup.md#domain-context-architecture-setup) 사용
- **[컨텍스트 분할 패턴](../architecture/context-splitting.md)** → [다중 컨텍스트 설정](./multi-context-setup.md) 사용

### Ref 패턴
- **[Ref 기본 사용법](../ref/basic-usage.md)** → [RefContext 설정](./ref-context-setup.md) 사용
- **[캔버스 최적화](../ref/canvas-optimization.md)** → [RefContext 설정](./ref-context-setup.md) 사용
- **[메모리 최적화](../ref/memory-optimization.md)** → [RefContext 설정](./ref-context-setup.md) 사용

### 성능 패턴
- **[최적화 기법](../performance/optimization-techniques.md)** → 모든 설정 가이드 사용

### 프로바이더 관리
- **[withProvider 패턴](../store/withProvider-pattern.md)** → [프로바이더 구성 설정](./provider-composition-setup.md) 사용

## 관련 가이드

- **[패턴 선택 가이드](../index.md)** - 사용 사례에 적합한 패턴 선택
- **[모범 사례](../../conventions.md)** - 일반적인 프레임워크 모범 사례
- **[아키텍처 가이드](../../concept/architecture-guide.md)** - 전반적인 아키텍처 개념