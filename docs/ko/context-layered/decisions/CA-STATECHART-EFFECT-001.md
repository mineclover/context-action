# CA-STATECHART-EFFECT-001: `@context-action/xstate` 어댑터 경계 분리 및 핵심 통합 철학

**상태:** 구현 채택, 배포 버전 조합 미승인  
**소유자:** Framework Core & Runtime Integration  
**관련 이슈/스펙:** CA-STATECHART-EFFECT-001 (`packages/xstate/docs/xstate-effect-integration.md`, [CA-ELEMENT-INTEROP-001](./CA-ELEMENT-INTEROP-001.md), [CA-SPEC-EVIDENCE-001](./CA-SPEC-EVIDENCE-001.md))

## 맥락

XState v5, XState v6(`xstate@beta`), Effect v4 및 `@xstate/effect` 연동은 오케스트레이션 평면(`ActionRegister`, `SyncActionPipeline`)과 상태 관찰·트랜잭션 경계(`StateReader`, `TransactionCoordinatorPort`)를 모두 가로지릅니다. 이를 `@context-action/core`와 `@context-action/store-core` 내부에 두면 두 코어 패키지가 서로를 import할 수 없는 경계 규칙 때문에 구조적 포트를 중복 선언해야 하고, `./element`의 0ms DOM 전달 계층에 Effect Scope 개념이 섞이며, `xstate@^5`와 `@xstate/effect`(`xstate@^6.0.0-alpha` 요구) 간 npm/pnpm 피어 의존성 다이아몬드 충돌이 발생합니다.

## 검토한 선택지

- **`@context-action/core/element`와 `@context-action/store-core`에 분산 유지**: 7개 이상의 구조적 인터페이스가 중복되고 DOM 계층에 Effect Scope 수명이 혼입되며, 메인 `ActionRegister`와 `store-core`를 직접 연결할 수 없어 제외했습니다.
- **초기부터 `@context-action/xstate`와 `@context-action/effect` 2개 패키지로 완전 분리**: 상태 머신과 무관한 Effect 전용 기능이 커질 경우의 향후 분리안으로 남기고, 현재는 공통 액터·가드·트랜잭션 계약 공유와 배포 복잡도 절감을 위해 보류했습니다.
- **옵션 1 (채택): `.` 및 `./effect` 서브패스를 가진 단일 선택적 패키지 `@context-action/xstate`**: 코어 두 패키지의 Zero-Dependency 순수성을 유지하면서 구조적 포트 위에서 동기·비동기 액션, 스토어, 상태 머신, 스키마, Effect 계약을 표준화합니다.

## 결정

XState v5/v6 및 Effect v4 / `@xstate/effect` 어댑터 일체를 별도 패키지 `@context-action/xstate`(`packages/xstate/`)로 분리하고 두 개의 서브패스를 제공합니다.

- **`@context-action/xstate` (`.`)**: `bindActor`, `bindActorToActionRegister`, `bindActorToSyncPipeline` (`bindStatechartToSyncPipeline`), `bindActorEmissions`, `waitForActorSnapshot`, `createActorStateReader`, `createActorActionEmitter`, `enqueueSyncCommand`
- **`@context-action/xstate/effect` (`./effect`)**: `fromStandardSchema`, `registerStandardSchemaGuard`, `registerEffectGuard`, `registerEffectHandler`, `bindEffectActorToActionRegister`, `runInTransactionScope`, 프레임워크 비의존 `bindActionDispatchTransactions`

런타임 의존성은 `@context-action/core`와 `@context-action/store-core`만 선언하며, 상호 배타적인 `xstate`/`@xstate/effect` 메이저/프리릴리즈 버전을 피어로 잠그지 않습니다.

## 결과와 invariant

저장소 내 모든 XState 및 Effect 통합은 다음 **5대 핵심 철학 불변 조건(Invariants)** 을 따릅니다.

1. **Zero-Dependency Core 순수성**: `@context-action/core`와 `@context-action/store-core`는 외부 런타임 의존성이 없는 최하단 계층으로 남으며 XState, Effect, Standard Schema, `@context-action/xstate`를 절대 import하지 않습니다.
2. **단일 의도 진입점 & 단일 투영 출구**: UI 호스트와 외부 호출자는 모든 의도를 Context-Action(`ActionRegister` / `SyncActionPipeline`)으로만 전달하고, 상태 구독은 단조 증가하는 `version`을 가진 `StateReader<TSelected>`(`select` + `equals` 및 `subscribe()` 이전에도 stale이 없는 `createActorStateReader`)로만 읽습니다.
3. **열린 Store vs 닫힌 상태 머신 권위**: `StateStore<T>`가 외부 `setValue()`/`update()`를 허용하는 열린 저장소인 반면, `ActorRefLike`는 외부 덮어쓰기가 차단된 닫힌 전이 저장소입니다. 상태 전이는 Guard(`snapshot.can(event)`) → Handler(`actor.send(event)`) 파이프라인으로만 일어나며, 머신 외부 방출(`enqueue` / `actor.on` via `bindActorEmissions`)은 `createActorActionEmitter`를 통해 Context-Action 의도로만 환원됩니다.
4. **협력적 수명주기 및 스코프 중단**: `controller.signal` 취소가 `waitForActorSnapshot`, `registerEffectHandler`, `registerEffectGuard`, `runInTransactionScope`까지 관통하고, `bindActionDispatchTransactions` / `runInTransactionScope`는 명시된 참가자 간 단일 실행 `commit()` / `rollback()`을 보장하며, 모든 바인딩은 호출 가능한 통합 핸들(`BoundActorHandle` / `BoundEffectActorHandle`)을 반환해 `dispose()` 시 핸들러 해제 · Effect `Scope` 종료 · 활성 액터 `stop()`을 일관되게 수행합니다.
5. **3단계 상태 계층화 정합성 ([CA-SPEC-EVIDENCE-001](./CA-SPEC-EVIDENCE-001.md))**: Tier 1 영속 도메인 전이·검증 계약은 Standard Schema(`fromStandardSchema` + `ActionRegister` + XState 액터)에, Tier 2 화면 파생 상태는 `createActorStateReader` 프로젝션에, Tier 3 휘발성 0ms DOM 인터랙션은 `@context-action/core/element`의 `SyncActionPipeline`(`bindActorToSyncPipeline`)에 배치합니다.

## 검증 증거

- 권위 설계 명세: [XState / Effect 통합 설계 문서](../../../../packages/xstate/docs/xstate-effect-integration.md)
- 구현 소스: `packages/xstate/src/` (`contracts.ts`, `actor-state-reader.ts`, `pipeline-binding.ts`, `index.ts`, `effect.ts`)
- 실행 검증 (유닛 및 실제 `xstate@5.33.4`, `effect@4.1.4`, `zod@4.6.6` E2E 통합 테스트): `packages/xstate/test/xstate-effect.test.mjs`, `packages/xstate/test/real-runtime-integration.test.mjs` (`pnpm --dir packages/xstate test`)
- 저장소 경계·패키징 검증 게이트: `pnpm package-boundary:check`, `pnpm verify:package-exports`, `pnpm verify:package-tarballs`, `pnpm convention:check`

## 되돌림 또는 migration 조건

XState 없이 Effect 전용(`Schema`, `EffectRunnerPort`, `TransactionCoordinatorPort`) 소비자만으로 독립 릴리스 주기 또는 별도 의존성 계약이 요구되는 시점에 `@context-action/xstate/effect`를 `@context-action/effect` 패키지로 분리합니다. 이 결정 자체는 기존 패키지의 버전 변경을 승인하지 않습니다.
