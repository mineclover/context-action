# Context-Layered 컨벤션 정합성 계획

**상태:** 방향 확정, 마이그레이션 시작 전  
**최근 검토:** 2026-07-13

이 문서는 기존 예제와 문서를 Context-Layered 구조에 맞추기 위한 저장소 단위 결정을 기록합니다. 구현 표준 문서와 같은 위치에서 현재 상태 분류, Provider 중첩 순서, 컨벤션을 강제하기 위한 완료 조건을 관리합니다.

## 확정 사항

### 1. 신규 구현의 단일 표준은 Context-Layered

새 시나리오는 다음 레이어를 사용합니다.

```text
contexts/  -> 경계와 Provider
business/  -> 순수 도메인 로직
handlers/  -> orchestration과 의존성 주입
actions/   -> dispatch helper와 callback
hooks/     -> 반응형 store 구독
views/     -> 렌더링과 사용자 이벤트
```

strict MVVM 자료는 마이그레이션 참고 자료로 유지하지만, 신규 implementation-playbook의 두 번째 표준으로 취급하지 않습니다.

### 2. 모든 handler는 Handler Registry에서 등록

기능 규모에 따른 예외를 두지 않습니다.

- Context 파일은 경계와 Provider를 정의·조합하며 handler를 등록하지 않습니다.
- 모든 도메인은 `*HandlerRegistry` 또는 동등한 Registry 컴포넌트를 제공합니다.
- 모든 `use*ActionHandler` 호출은 Registry 또는 그 하위 handler 모듈에 둡니다.
- Page와 View는 Registry를 마운트만 하며 handler를 직접 등록하지 않습니다.

단일 handler 예제도 이 규칙을 따릅니다. 등록, 정리, priority, 의존성 주입을 한 곳에서 검토할 수 있게 하는 것이 목적입니다.

### 3. Provider 중첩 순서 고정

canonical 중첩 순서는 다음과 같습니다.

```tsx
<DomainActionProvider>
  <DomainStoreProvider>
    <DomainRefProvider>
      <DomainHandlerRegistry>
        <DomainView />
      </DomainHandlerRegistry>
    </DomainRefProvider>
  </DomainStoreProvider>
</DomainActionProvider>
```

이는 런타임의 필수 순서라는 뜻이 아니라 저장소 컨벤션입니다. 모든 Registry가 필요한 action, store, ref 경계 아래에 위치하도록 보장합니다.

## 현재 상태 분류

다음 분류를 마이그레이션 기준선으로 사용합니다.

| 분류 | 현재 표면 | 처리 기준 |
| --- | --- | --- |
| Canonical | `example/src/pages/patterns/implementation-playbook/**`, playbook 예제, `contexts/business/handlers/actions/hooks/views` | 기준 구현으로 유지 |
| Transitional | strict MVVM 문서, `business-logic` 예제, Context/Page 직접 handler 등록, 혼재된 Provider 순서 | canonical 구조로 이동 |
| Advanced/isolated | time-travel store, performance 예제, 직접 `ActionRegister` 사용, 저수준 통합 테스트 | 고급 자료로 유지하고 기본 구조로 제시하지 않음 |
| Compatibility | legacy object 형식 Context 생성과 이전 hook alias | 호환성 유지, migration/reference 문서에서만 설명 |

### 2026-07-13 기준 근거

- `CanonicalOrderHandlers.tsx`는 이미 Action Provider, Store Provider, Ref Provider, Handler Registry를 조합합니다.
- `LogMonitor/context.tsx`는 여러 handler를 직접 등록하고 반대 Provider 순서를 사용하므로 마이그레이션 대상입니다.
- `docs/en/concept/conventions.md`는 strict MVVM을 설명하므로 병렬 표준이 아니라 migration/legacy 안내로 연결해야 합니다.
- 기존 문서와 예제에는 두 Provider 순서가 모두 존재합니다. 저장소 검색 결과 action-then-store 19건, store-then-action 20건이 확인되었으며, 이는 런타임 실패가 아닌 구조 인벤토리입니다.

## 마이그레이션 순서

1. 영어·한국어 컨벤션 인덱스에 이 결정을 추가합니다.
2. LogMonitor와 business-logic 등 직접 handler를 등록하는 도메인부터 Handler Registry로 이동합니다.
3. 모든 Provider 예제를 고정된 중첩 순서로 통일합니다.
4. public hook 명명을 정리하고 legacy API 예제는 migration guide로 이동합니다.
5. Registry 위치, Provider 순서, 레이어 경로, 명명을 검사하는 `convention:check`를 추가합니다.
6. type-check, 테스트, example build, docs build, package verification을 실행합니다.

## 완료 조건

- Handler Registry 외부에 handler 등록이 없습니다.
- canonical 문서와 예제가 하나의 Provider 순서를 사용합니다.
- 신규 개발에 권장되는 구조가 Context-Layered 하나로 정리됩니다.
- legacy/MVVM 자료가 migration 또는 compatibility 안내로 명시됩니다.
- 영어·한국어 컨벤션 문서가 동일한 규칙을 설명합니다.
- 구조적 drift가 발생하면 CI가 실패합니다.

