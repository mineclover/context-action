# 아키텍처 패턴

Context-Action 프레임워크를 사용하여 확장 가능한 애플리케이션을 구축하기 위한 포괄적인 아키텍처 및 디자인 패턴입니다. 적절한 구성과 초기화를 우선시하는 **Setup-First 아키텍처**를 중심으로 합니다.

## 전제 조건

아키텍처 패턴을 구현하기 전에 적절한 설정 구성을 확인하세요:

- **[멀티 컨텍스트 설정 가이드](../setup/multi-context-setup.md)** - MVVM, 도메인 컨텍스트, 엔터프라이즈 구성을 포함한 복잡한 아키텍처의 완전한 설정 패턴
- **[기본 액션 설정](../setup/basic-action-setup.md)** - 모든 패턴을 위한 기본 액션 컨텍스트 설정
- **[기본 스토어 설정](../setup/basic-store-setup.md)** - 모든 패턴을 위한 기본 스토어 컨텍스트 설정
- **[프로바이더 컴포지션 설정](../setup/provider-composition-setup.md)** - 고급 프로바이더 구성 패턴

## 사용 가능한 아키텍처 패턴

### MVVM 아키텍처
- **[MVVM 패턴](./mvvm.md)** - 완벽한 레이어 분리를 가진 Model-View-ViewModel 아키텍처
  - **설정 가이드**: [MVVM 아키텍처 설정](../setup/multi-context-setup.md#mvvm-architecture-setup)
  - 모델 레이어: Store Only 패턴을 사용한 타입 안전한 상태 관리
  - 뷰모델 레이어: Action Only 패턴을 사용한 비즈니스 로직  
  - 성능 레이어: RefContext 패턴을 사용한 직접 DOM 조작
  - 뷰 레이어: 프레젠테이션을 위한 순수 React 컴포넌트

### 도메인 컨텍스트 아키텍처
- **[도메인 컨텍스트 패턴](./domain-context.md)** - 멀티 도메인 앱을 위한 문서 중심 도메인 분리
  - **설정 가이드**: [도메인 컨텍스트 아키텍처 설정](../setup/multi-context-setup.md#domain-context-architecture-setup)
  - 비즈니스 컨텍스트: 핵심 비즈니스 로직과 도메인 규칙
  - UI 컨텍스트: 화면 상태와 사용자 상호작용
  - 검증 컨텍스트: 데이터 검증과 오류 처리
  - 디자인 컨텍스트: 테마 관리와 시각적 상태
  - 아키텍처 컨텍스트: 시스템 구성과 기술적 결정

### 패턴 컴포지션
- **[컴포지션 전략](./composition.md)** - 복잡한 애플리케이션을 위한 고급 패턴 컴포지션
  - **설정 가이드**: [프로바이더 컴포지션 패턴](../setup/multi-context-setup.md#provider-composition-patterns)
  - 단일 도메인 컴포지션: 액션 + 스토어 + Ref 패턴
  - 멀티 도메인 컴포지션: 패턴 레이어를 가진 도메인 컨텍스트
  - 엔터프라이즈 규모: 결합된 아키텍처 접근 방식

### 컨텍스트 관리
- **[컨텍스트 분할 패턴](./context-splitting.md)** - 대규모 컨텍스트를 관리하고 분할하는 전략
  - **설정 가이드**: [교차 컨텍스트 통신 설정](../setup/multi-context-setup.md#cross-context-communication-setup)
  - 도메인 기반, 레이어 기반, 기능 기반 분할 전략
  - 점진적 마이그레이션 패턴과 교차 컨텍스트 통신
  - 성능 최적화와 컨텍스트 관리 모범 사례

## 아키텍처 결정 매트릭스

### 설정 기반 결정 프레임워크

**설정 복잡성**과 **애플리케이션 규모**에 따라 아키텍처를 선택하세요:

| 설정 요구사항 | 단일 도메인 | 멀티 도메인 | 엔터프라이즈 규모 |
|--------------|-------------|-------------|-------------------|
| **기본 설정** | [액션](../setup/basic-action-setup.md) 또는 [스토어](../setup/basic-store-setup.md) 전용 | 권장하지 않음 | 권장하지 않음 |
| **멀티 컨텍스트 설정** | [MVVM 아키텍처 설정](../setup/multi-context-setup.md#mvvm-architecture-setup) | [도메인 컨텍스트 설정](../setup/multi-context-setup.md#domain-context-architecture-setup) | [엔터프라이즈 설정](../setup/multi-context-setup.md#conditional-multi-context-setup) |
| **고급 설정** | [중첩 MVVM](../setup/multi-context-setup.md#nested-domain-composition) | [이벤트 버스 통합](../setup/multi-context-setup.md#event-bus-pattern) | [컨텍스트 브릿지](../setup/multi-context-setup.md#context-bridge-setup) |

### MVVM 아키텍처를 사용해야 하는 경우
- ✅ 명확한 레이어 분리가 필요한 복잡한 단일 도메인 애플리케이션
- ✅ 기술 레이어(Model, ViewModel, View)별 팀 전문화
- ✅ 구조화된 접근 방식이 필요한 복잡한 비즈니스 로직을 가진 애플리케이션
- ✅ RefContext 최적화가 필요한 성능 중심 애플리케이션
- **필요한 설정**: [MVVM 아키텍처 설정](../setup/multi-context-setup.md#mvvm-architecture-setup)

### 도메인 컨텍스트 아키텍처를 사용해야 하는 경우  
- ✅ 서로 다른 비즈니스 영역을 가진 멀티 도메인 비즈니스 애플리케이션
- ✅ 비즈니스 도메인(사용자, 제품, 주문 도메인)에 맞춰진 팀 경계
- ✅ 도메인 분리가 필요한 마이크로서비스 아키텍처 정렬
- ✅ 도메인별 컨텍스트를 가진 문서 중심 워크플로우 관리
- **필요한 설정**: [도메인 컨텍스트 아키텍처 설정](../setup/multi-context-setup.md#domain-context-architecture-setup)

### 결합 접근 방식을 사용해야 하는 경우
- ✅ 도메인과 기술적 분리가 모두 필요한 엔터프라이즈 규모 애플리케이션
- ✅ 복잡한 기술적 요구사항을 가진 다수의 비즈니스 도메인
- ✅ 도메인과 기술적 전문화가 모두 있는 대규모 팀
- ✅ 점진적 복잡성과 증분적 아키텍처 진화가 필요한 애플리케이션
- **필요한 설정**: [엔터프라이즈 멀티 컨텍스트 설정](../setup/multi-context-setup.md#conditional-multi-context-setup)

## Setup-First 빠른 시작 가이드

### 1. 설정 구성 완료
**패턴 구현 전에**, 적절한 설정을 확립하세요:

```typescript
// 주요 설정 접근 방식 선택
import { 
  // MVVM용: 레이어 기반 설정
  createStoreContext,    // 모델 레이어
  createActionContext,              // 뷰모델 레이어
  createRefContext,                 // 성능 레이어

  // 도메인 컨텍스트용: 도메인 기반 설정
  composeProviders,                 // 프로바이더 컴포지션
  
  // 엔터프라이즈용: 고급 설정
  // 멀티 컨텍스트 설정 가이드 참조
} from '@context-action/react';
```

### 2. 아키텍처 구현 경로

#### 경로 A: MVVM 아키텍처 (기술 레이어 분리)
1. **설정**: [MVVM 아키텍처 설정](../setup/multi-context-setup.md#mvvm-architecture-setup) 따라하기
2. **구현**: [MVVM 패턴](./mvvm.md) 가이드라인 적용
3. **최적화**: 성능을 위해 [컨텍스트 분할](./context-splitting.md) 사용
4. **고급**: 복잡한 시나리오를 위한 [컴포지션 전략](./composition.md) 구현

#### 경로 B: 도메인 컨텍스트 아키텍처 (비즈니스 도메인 분리)
1. **설정**: [도메인 컨텍스트 아키텍처 설정](../setup/multi-context-setup.md#domain-context-architecture-setup) 따라하기
2. **구현**: [도메인 컨텍스트 패턴](./domain-context.md) 가이드라인 적용
3. **통신**: [교차 컨텍스트 통신](../setup/multi-context-setup.md#cross-context-communication-setup) 구현
4. **확장**: [엔터프라이즈 설정 패턴](../setup/multi-context-setup.md#conditional-multi-context-setup) 사용

#### 경로 C: 결합 엔터프라이즈 아키텍처
1. **설정**: [엔터프라이즈 멀티 컨텍스트 설정](../setup/multi-context-setup.md#conditional-multi-context-setup) 따라하기
2. **기반**: [컨텍스트 브릿지](../setup/multi-context-setup.md#context-bridge-setup) 패턴 확립
3. **구현**: 필요에 따라 MVVM과 도메인 패턴을 결합
4. **관리**: [중첩 도메인 컴포지션](../setup/multi-context-setup.md#nested-domain-composition) 사용

### 3. 설정 검증 체크리스트

✅ **전제 조건 충족**: 모든 필수 설정 가이드가 따라졌습니다  
✅ **타입 안전성**: 모든 컨텍스트에 적절한 TypeScript 구성이 있습니다  
✅ **프로바이더 컴포지션**: 프로바이더가 `composeProviders`를 사용하여 구성되었습니다  
✅ **성능 최적화**: 성능 중심 경로에 RefContext가 구성되었습니다  
✅ **교차 컨텍스트 통신**: 필요한 경우 이벤트 버스 또는 컨텍스트 브릿지가 구성되었습니다  
✅ **내보내기 전략**: 적절한 배럴 내보내기와 도메인 번들이 확립되었습니다  

## 빠른 아키텍처 비교

| 아키텍처 | 설정 복잡성 | 최적 용도 | 설정 가이드 |
|----------|-------------|-----------|-------------|
| **MVVM** | 보통 | 단일 도메인, 기술 팀 | [MVVM 설정](../setup/multi-context-setup.md#mvvm-architecture-setup) |
| **도메인 컨텍스트** | 보통에서 높음 | 멀티 도메인, 비즈니스 팀 | [도메인 설정](../setup/multi-context-setup.md#domain-context-architecture-setup) |  
| **결합 엔터프라이즈** | 높음 | 대규모, 복잡한 요구사항 | [엔터프라이즈 설정](../setup/multi-context-setup.md#conditional-multi-context-setup) |

## 프레임워크 패턴과의 통합

모든 아키텍처 패턴은 Context-Action 프레임워크의 핵심 패턴과 원활하게 통합됩니다:

### 액션 통합
- **액션 패턴**: [액션 패턴 문서](../action/index.md) 참조
- **설정 기반**: [기본 액션 설정](../setup/basic-action-setup.md)을 기반으로 사용

### 스토어 통합  
- **스토어 패턴**: [스토어 패턴 문서](../store/index.md) 참조
- **설정 기반**: [기본 스토어 설정](../setup/basic-store-setup.md)을 기반으로 사용

### Ref 통합
- **Ref 패턴**: [Ref 패턴 문서](../ref/index.md) 참조
- **설정 기반**: 성능 최적화를 위한 [Ref 컨텍스트 설정](../setup/ref-context-setup.md) 사용