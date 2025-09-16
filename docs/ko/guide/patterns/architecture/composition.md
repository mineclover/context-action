# 패턴 컴포지션 전략

Context-Action 프레임워크를 사용하여 복잡하고 확장 가능한 애플리케이션을 구축하기 위한 고급 패턴 컴포지션 기법입니다.

## 전제 조건

컴포지션 전략을 구현하기 전에 기본적인 설정을 완료했는지 확인하세요:

- **[멀티 컨텍스트 설정](../setup/multi-context-setup.md)** - 완전한 MVVM 및 도메인 컨텍스트 아키텍처 설정 패턴
- **[프로바이더 컴포지션 설정](../setup/provider-composition-setup.md)** - 고급 프로바이더 컴포지션 유틸리티 및 패턴
- **[기본 액션 설정](../setup/basic-action-setup.md)** - 단일 액션 컨텍스트 패턴
- **[기본 스토어 설정](../setup/basic-store-setup.md)** - 단일 스토어 컨텍스트 패턴

이러한 설정 가이드는 이 문서 전체에서 사용되는 컨텍스트 정의, 프로바이더 구성 및 컴포지션 유틸리티를 제공합니다.

## 컴포지션 개요

패턴 컴포지션을 통해 애플리케이션의 특정 요구사항에 따라 서로 다른 아키텍처 접근 방식을 결합할 수 있습니다:

- **단일 도메인 컴포지션**: 하나의 도메인 내에서 Action + Store + Ref 패턴 결합
- **멀티 도메인 컴포지션**: 계층화된 패턴을 가진 도메인 컨텍스트
- **엔터프라이즈 컴포지션**: MVVM 및 도메인 아키텍처의 결합
- **하이브리드 컴포지션**: 애플리케이션의 서로 다른 영역에 대한 혼합 접근법

## 컴포지션 전략

### 전략 1: 단일 도메인 컴포지션

핵심 패턴과 고급 패턴이 필요한 복잡한 단일 도메인 애플리케이션에 완벽합니다.

```typescript
// 멀티 컨텍스트 설정 패턴을 사용한 완전한 단일 도메인 설정
// 참조: multi-context-setup.md - UserModelProvider, UserViewModelProvider, UserPerformanceProvider

import { 
  UserModelProvider,
  UserViewModelProvider as UserActionProvider,
  UserPerformanceProvider
} from '../setup/contexts/UserDomain';

function SingleDomainApp() {
  return (
    {/* 상태 관리 레이어 - 멀티 컨텍스트 설정에서 */}
    <UserModelProvider>
      
      {/* 비즈니스 로직 레이어 - 멀티 컨텍스트 설정에서 */}
      <UserActionProvider>
        
        {/* 성능 레이어 - 멀티 컨텍스트 설정에서 */}
        <UserPerformanceProvider>
          
          {/* 애플리케이션 컴포넌트 */}
          <UserDashboard />
          <UserProfile />
          <UserSettings />
          
        </UserPerformanceProvider>
      </UserActionProvider>
    </UserModelProvider>
  );
}
```

**사용 사례:**
- 전자상거래 제품 관리
- 금융 대시보드 애플리케이션
- 콘텐츠 관리 시스템
- 게임 애플리케이션

### 전략 2: 멀티 도메인 컴포지션

서로 다른 비즈니스 도메인을 가지며, 각각 다른 패턴 조합이 필요한 애플리케이션에 이상적입니다.

```typescript
// 선택적 패턴 사용이 있는 멀티 도메인
// 참조: multi-context-setup.md - 도메인별 프로바이더 패턴

import {
  UserModelProvider,
  UserViewModelProvider as UserActionProvider,
  UserPerformanceProvider,
  ProductModelProvider,
  ProductViewModelProvider as ProductActionProvider,
  // Order 도메인은 Store Only 패턴 사용 - 참조: basic-store-setup.md
  OrderModelProvider,
  // Analytics는 Action Only 패턴 사용 - 참조: basic-action-setup.md
  AnalyticsActionProvider
} from '../setup/contexts';

function MultiDomainApp() {
  return (
    {/* 사용자 도메인 - 멀티 컨텍스트 설정의 전체 MVVM */}
    <UserModelProvider>
      <UserActionProvider>
        <UserPerformanceProvider>
          
          {/* 제품 도메인 - 멀티 컨텍스트 설정의 Store + Action */}
          <ProductModelProvider>
            <ProductActionProvider>
              
              {/* 주문 도메인 - Store Only 패턴 */}
              <OrderModelProvider>
                
                {/* 분석 도메인 - Action Only 패턴 */}
                <AnalyticsActionProvider>
                  
                  <ECommerceApp />
                  
                </AnalyticsActionProvider>
              </OrderModelProvider>
            </ProductActionProvider>
          </ProductModelProvider>
        </UserPerformanceProvider>
      </UserActionProvider>
    </UserModelProvider>
  );
}
```

**도메인별 패턴 선택:**

| 도메인 | 사용된 패턴 | 근거 |
|--------|-------------|------|
| User | Store + Action + Ref | 복잡한 상호작용, 애니메이션 필요 |
| Product | Store + Action | 데이터 관리가 포함된 비즈니스 로직 |
| Order | Store Only | 단순한 데이터 관리, 복잡한 로직 없음 |
| Analytics | Action Only | 이벤트 추적, 영구 상태 없음 |

### 전략 3: 엔터프라이즈 컴포지션

MVVM 레이어와 도메인 컨텍스트를 결합한 대규모 애플리케이션입니다.

```typescript
// 도메인 컨텍스트 아키텍처 설정을 사용한 엔터프라이즈 규모 컴포지션
// 참조: multi-context-setup.md - 도메인 컨텍스트 아키텍처 설정

import {
  // 도메인 컨텍스트 아키텍처 설정의 비즈니스 도메인
  BusinessModelProvider,
  BusinessViewModelProvider as BusinessActionProvider,
  // MVVM 아키텍처 설정의 UI 도메인
  UIModelProvider,
  UIViewModelProvider as UIActionProvider,
  UserPerformanceProvider as UIPerformanceProvider,
  // 도메인 컨텍스트 아키텍처 설정의 검증 도메인
  ValidationModelProvider,
  ValidationViewModelProvider as ValidationActionProvider,
  // 도메인 컨텍스트 아키텍처 설정의 디자인 시스템 컨텍스트
  DesignModelProvider
} from '../setup/contexts';

function EnterpriseApp() {
  return (
    {/* 도메인 컨텍스트 아키텍처 설정의 비즈니스 도메인 MVVM */}
    <BusinessModelProvider>
      <BusinessActionProvider>
        <BusinessPerformanceProvider>
          
          {/* MVVM 아키텍처 설정의 UI 도메인 MVVM */}
          <UIModelProvider>
            <UIActionProvider>
              <UIPerformanceProvider>
                
                {/* 도메인 컨텍스트 아키텍처 설정의 검증 도메인 */}
                <ValidationModelProvider>
                  <ValidationActionProvider>
                    
                    {/* 디자인 시스템 컨텍스트 설정의 디자인 도메인 */}
                    <DesignModelProvider>
                      
                      <EnterpriseApplication />
                      
                    </DesignModelProvider>
                  </ValidationActionProvider>
                </ValidationModelProvider>
              </UIPerformanceProvider>
            </UIActionProvider>
          </UIModelProvider>
        </BusinessPerformanceProvider>
      </BusinessActionProvider>
    </BusinessModelProvider>
  );
}
```

### 전략 4: 하이브리드 컴포지션

애플리케이션의 서로 다른 영역이 서로 다른 아키텍처 접근 방식을 사용합니다.

```typescript
// 영역별 패턴이 있는 하이브리드 접근법
function HybridApp() {
  return (
    <AppRouter>
      {/* 관리자 영역 - 완전한 MVVM */}
      <Route path="/admin/*">
        <AdminModelProvider>
          <AdminActionProvider>
            <AdminPerformanceProvider>
              <AdminDashboard />
            </AdminPerformanceProvider>
          </AdminActionProvider>
        </AdminModelProvider>
      </Route>
      
      {/* 고객 영역 - 도메인 컨텍스트 */}
      <Route path="/customer/*">
        <CustomerBusinessProvider>
          <CustomerUIProvider>
            <CustomerValidationProvider>
              <CustomerPortal />
            </CustomerValidationProvider>
          </CustomerUIProvider>
        </CustomerBusinessProvider>
      </Route>
      
      {/* 공개 영역 - 단순한 Store Only */}
      <Route path="/public/*">
        <PublicModelProvider>
          <PublicWebsite />
        </PublicModelProvider>
      </Route>
    </AppRouter>
  );
}
```

## 고급 컴포지션 패턴

### 도메인 간 통합

```typescript
// 도메인 간 통신을 위한 통합 레이어
// 참조: multi-context-setup.md - 컨텍스트 간 통신 설정

import {
  useBusinessStoreManager,
  useUIStoreManager,
  useValidationStoreManager,
  useBusinessActionHandler,
  useContextBridge  // 컨텍스트 간 통신 유틸리티
} from '../setup/contexts';

export function useIntegrationLayer() {
  // 멀티 컨텍스트 설정의 컨텍스트 브리지 패턴 사용
  const contextBridge = useContextBridge();
  
  // 대안: 직접 매니저 접근
  const businessManager = useBusinessStoreManager();
  const uiManager = useUIStoreManager();
  const validationManager = useValidationStoreManager();
  
  const integratedWorkflow = useCallback(async (payload, controller) => {
    // 컨텍스트 브리지를 사용한 여러 도메인 간 조정
    const validationResult = await contextBridge.validation.actions('validateAcrossDomains', payload);
    const businessResult = await contextBridge.business.actions('processBusinessLogic', payload);
    const uiUpdate = await contextBridge.ui.actions('updateUserInterface', businessResult);
    
    return { validationResult, businessResult, uiUpdate };
  }, [contextBridge, businessManager, uiManager, validationManager]);
  
  // 적절한 액션 컨텍스트에 등록
  useBusinessActionHandler('integratedWorkflow', integratedWorkflow);
}
```

### 선택적 프로바이더 사용

```typescript
// 기능에 따른 조건부 프로바이더 컴포지션
// 참조: multi-context-setup.md - 조건부 멀티 컨텍스트 설정

import {
  ValidationModelProvider,
  ValidationViewModelProvider as ValidationActionProvider,
  UserPerformanceProvider as PerformanceProvider,
  EventBusProvider as IntegrationActionProvider  // 컨텍스트 간 통신 설정에서
} from '../setup/contexts';

interface AppConfig {
  enablePerformanceOptimizations: boolean;
  enableAdvancedValidation: boolean;
  enableCrossDomainFeatures: boolean;
}

// 멀티 컨텍스트 설정의 엔터프라이즈 구성 패턴 따르기
function ConfigurableApp({ config }: { config: AppConfig }) {
  let app = <CoreApp />;
  
  // 활성화된 경우 성능 레이어로 래핑 - 멀티 컨텍스트 설정 RefContext 패턴에서
  if (config.enablePerformanceOptimizations) {
    app = (
      <PerformanceProvider>
        {app}
      </PerformanceProvider>
    );
  }
  
  // 활성화된 경우 검증 레이어 추가 - 도메인 컨텍스트 아키텍처 설정에서
  if (config.enableAdvancedValidation) {
    app = (
      <ValidationModelProvider>
        <ValidationActionProvider>
          {app}
        </ValidationActionProvider>
      </ValidationModelProvider>
    );
  }
  
  // 활성화된 경우 도메인 간 기능 추가 - 컨텍스트 간 통신 설정에서
  if (config.enableCrossDomainFeatures) {
    app = (
      <IntegrationActionProvider>
        {app}
      </IntegrationActionProvider>
    );
  }
  
  return app;
}
```

### 동적 컴포지션

```typescript
// 사용자 역할이나 기능에 따른 런타임 컴포지션
// 참조: provider-composition-setup.md - 동적 프로바이더 컴포지션

import { composeProviders } from '@context-action/react';  // 프로바이더 컴포지션 설정에서
import {
  UIModelProvider as CoreModelProvider,
  UIViewModelProvider as CoreActionProvider,
  // 관리자 프로바이더는 다중 컨텍스트 설정에서 정의됨
  AdminModelProvider,
  AdminActionProvider,
  UserPerformanceProvider as PerformanceProvider,
  ValidationModelProvider,
  ValidationViewModelProvider as ValidationActionProvider
} from '../setup/contexts';

function DynamicApp({ userRole, features }: { 
  userRole: 'admin' | 'user' | 'guest';
  features: string[];
}) {
  const providers: React.ComponentType<any>[] = [];
  
  // 모든 사용자를 위한 기본 프로바이더 - 멀티 컨텍스트 설정에서
  providers.push(CoreModelProvider, CoreActionProvider);
  
  // 관리자별 프로바이더 추가 - 멀티 컨텍스트 설정 엔터프라이즈 설정에서
  if (userRole === 'admin') {
    providers.push(AdminModelProvider, AdminActionProvider);
  }
  
  // 특정 기능에 대한 성능 프로바이더 추가 - 멀티 컨텍스트 설정 성능 레이어에서
  if (features.includes('animations')) {
    providers.push(PerformanceProvider);
  }
  
  // 폼을 위한 검증 프로바이더 추가 - 도메인 컨텍스트 아키텍처 설정에서
  if (features.includes('forms')) {
    providers.push(ValidationModelProvider, ValidationActionProvider);
  }
  
  // 프로바이더 컴포지션 설정의 composeProviders 유틸리티 사용
  const DynamicProviders = composeProviders(providers);
  
  return (
    <DynamicProviders>
      <AppContent />
    </DynamicProviders>
  );
}
```

## 컴포지션 가이드라인

### ✅ 모범 사례

1. **레이어 순서**
   - Model 프로바이더를 가장 바깥쪽 레벨에
   - Action 프로바이더가 Model 프로바이더를 래핑
   - Performance 프로바이더가 Action 프로바이더를 래핑
   - Ref 프로바이더를 가장 안쪽 레벨에

2. **도메인 격리**
   - 도메인 컨텍스트를 분리하여 유지
   - 명시적인 도메인 간 통신 사용
   - 깊은 프로바이더 중첩 피하기
   - 도메인 경계 문서화

3. **성능 고려사항**
   - 필요한 프로바이더만 포함
   - 기능에 대해 선택적 컴포지션 사용
   - 프로바이더 트리 깊이 모니터링
   - 복잡한 도메인에 대해 지연 로딩 구현

4. **타입 안전성**
   - 컴포지션 전체에서 타입 안전성 유지
   - 타입이 지정된 통합 패턴 사용
   - 도메인 간 인터페이스 문서화
   - 빌드 타임에 컴포지션 검증

### ❌ 일반적인 함정

1. **과도한 컴포지션**
   - 기본적으로 모든 패턴을 포함하지 말 것
   - 불필요한 프로바이더 중첩 피하기
   - 순환 종속성 생성하지 말 것
   - 호환되지 않는 패턴 혼합하지 말 것

2. **성능 문제**
   - 깊은 프로바이더 중첨은 성능에 영향을 줌
   - 너무 많은 컨텍스트는 오버헤드를 생성
   - 잘못된 컴포지션으로 인한 불필요한 리렌더링
   - 부적절한 정리로 인한 메모리 누수

3. **유지보수 문제**
   - 복잡한 컴포지션은 디버그하기 어려움
   - 도메인 간 불분명한 데이터 흐름
   - 격리된 테스트가 어려움
   - 요구사항이 변경될 때 리팩터링하기 어려움

## 컴포지션 결정 매트릭스

| 애플리케이션 타입 | 권장 컴포지션 | 근거 |
|------------------|-------------|------|
| **단순 앱** | Store Only | 최소한의 오버헤드, 이해하기 쉬움 |
| **상호작용 앱** | Store + Action | 비즈니스 로직 분리 필요 |
| **성능 앱** | Store + Action + Ref | 애니메이션 및 실시간 상호작용 |
| **복잡한 단일 도메인** | MVVM 아키텍처 | 복잡한 로직을 위한 명확한 레이어 분리 |
| **멀티 도메인 앱** | 도메인 컨텍스트 아키텍처 | 비즈니스 도메인 분리 |
| **엔터프라이즈 앱** | MVVM + 도메인 결합 | 기술적 및 비즈니스적 분리 모두 |

## 마이그레이션 전략

### 단순함에서 복잡함으로

```typescript
// 단계 1: Store Only로 시작
<StoreProvider>
  <SimpleApp />
</StoreProvider>

// 단계 2: 비즈니스 로직이 증가하면 Actions 추가
<StoreProvider>
  <ActionProvider>
    <SimpleApp />
  </ActionProvider>
</StoreProvider>

// 단계 3: 애니메이션을 위해 Performance 추가
<StoreProvider>
  <ActionProvider>
    <PerformanceProvider>
      <SimpleApp />
    </PerformanceProvider>
  </ActionProvider>
</StoreProvider>

// 단계 4: 복잡성이 증가하면 도메인으로 분할
<BusinessProvider>
  <UIProvider>
    <ValidationProvider>
      <ComplexApp />
    </ValidationProvider>
  </UIProvider>
</BusinessProvider>
```

### 리팩토링 가이드라인

1. **점진적 마이그레이션**
   - 패턴을 점진적으로 추가
   - 각 컴포지션 단계 테스트
   - 후진 호환성 유지
   - 마이그레이션 단계 문서화

2. **패턴 추출**
   - 공통 패턴을 재사용 가능한 컴포지션으로 추출
   - 컴포지션 유틸리티 생성
   - 컴포지션 템플릿 구축
   - 컴포지션 표준 확립

3. **성능 모니터링**
   - 렌더링 성능 모니터링
   - 프로바이더 트리 깊이 추적
   - 메모리 사용량 측정
   - 복잡한 컴포지션 프로파일링

## 설정 가이드와의 통합

이 컴포지션 가이드는 여러 설정 문서를 기반으로 합니다:

### 기본 설정 가이드
- **[멀티 컨텍스트 설정](../setup/multi-context-setup.md)** - 모든 예제에서 사용되는 완전한 MVVM 및 도메인 컨텍스트 설정 패턴
- **[프로바이더 컴포지션 설정](../setup/provider-composition-setup.md)** - `composeProviders` 유틸리티 및 컴포지션 패턴
- **[기본 액션 설정](../setup/basic-action-setup.md)** - Action Only 도메인용 단일 액션 컨텍스트 설정
- **[기본 스토어 설정](../setup/basic-store-setup.md)** - Store Only 도메인용 단일 스토어 컨텍스트 설정

### 아키텍처 통합
- **[MVVM 아키텍처](./mvvm.md)** - 멀티 컨텍스트 설정의 완전한 MVVM 설정 사용
- **[도메인 컨텍스트 아키텍처](./domain-context.md)** - 멀티 컨텍스트 설정의 도메인 분리 사용
- **[컨텍스트 분할 패턴](./context-splitting.md)** - 프로바이더 컴포지션 설정의 프로바이더 컴포지션 사용

## 관련 패턴

- **[MVVM 아키텍처](./mvvm.md)** - 구조화된 레이어 기반 컴포지션
- **[도메인 컨텍스트 아키텍처](./domain-context.md)** - 비즈니스 도메인 기반 컴포지션
- **[Store Only 패턴](../store/basic-usage.md)** - 데이터 중심 컴포지션의 기초
- **[Action Only 패턴](../action/basic-usage.md)** - 로직 중심 컴포지션의 기초
- **[RefContext 패턴](../ref/basic-usage.md)** - 성능 중심 컴포지션의 기초