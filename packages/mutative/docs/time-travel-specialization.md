# Context-Action Time Travel은 무엇에 특화되어 있는가

## 결론

현행 구현의 핵심은 새로운 undo/redo 알고리즘이 아니라 **Action으로 발생한 변경을
Store·React·다중 Store 작업 단위의 계약에 연결하는 것**입니다. 따라서 최신
Travels를 사용하더라도 이 연결 계층의 책임은 남습니다.

현행 `TimeTravel`은 Travels에서 영감을 받은 로컬 구현이며, 외부 `travels`를
직접 사용하는 래퍼가 아닙니다. draft/patch 엔진은 유지보수 중인
`@context-action/mutative-core`이고, upstream 호환 기준은 Mutative 1.3.0입니다.
출처·동기화 정책은 [UPSTREAM.md](../../mutative-core/UPSTREAM.md)를 참고하세요.

이번 [Travels 3.0.1 + Mutative 2.0.0 실험](../examples/travels-v3/README.md)은
기본 구현을 교체하지 않습니다. 의존성도 개발용으로만 추가하며, 공개 export,
runtime dependencies, 패키지 버전과 fork baseline은 유지합니다.

## 책임 분리

```text
Action / 사용자 작업
  └─ 명시적인 mutation metadata
      └─ Store / TransactionCoordinator
          └─ StateBackend → TimelineBackend → TransactionBackend
              └─ TimeTravel / draft·patch 엔진

React는 Store snapshot과 patch 채널을 구독
```

계약은 [store-core](../../store-core/src/index.ts)에 정의됩니다. 기본 상태,
시간 이동, 다중 Store 조정 능력을 구분하므로, 단일 timeline만 지원하는 backend를
다중 Store 트랜잭션용으로 가장할 필요가 없습니다. 엔진 자체에 React를 넣거나
기본 Action/Store/Context/Ref 소비자에게 실험 의존성을 강제하지도 않습니다.

## 현행 구현의 특화점

### 1. cursor 위치가 아니라 retained entry의 정체성

`getHistoryEntryId()`, `hasHistoryEntry()`, `goToHistoryEntry()`는 숫자 위치와
별개의 ID로 보관 중인 상태를 식별합니다. history 앞부분이 잘리면 같은 위치가
다른 상태를 뜻할 수 있고, undo 후 분기하면 redo 대상이 사라질 수 있습니다.

Coordinator는 before/after ID를 기록하고, 더 이상 보관하지 않는 대상이나 외부
변경과 충돌하는 현재 상태를 확인합니다. 단순히 저장한 cursor로 이동하는 것보다
잘못된 다중 Store undo를 방지하는 데 적합합니다. ID는 분산 전역 ID나 영속적
문서 식별자가 아닙니다.

근거: [TimeTravel history API](../src/time-travel.ts),
[Coordinator의 retained ID·충돌 검사](../../react/src/stores/core/StoreTransactionCoordinator.ts).
실험도 [별도의 retained-entry index](../examples/travels-v3/retained-entry-index.ts)를
구현해야 했습니다. upstream cursor/revision만 연결하면 해결되는 계약은 아닙니다.

### 2. 다중 Store의 commit과 알림 공개를 분리

`TransactionBackend`는 `beginBatch/endBatch/cancelBatch`뿐 아니라
`resumeNotifications/flushNotifications`를 요구합니다. Coordinator는 모든
참여 Store를 준비하고 변경을 마친 뒤 알림 hold를 해제합니다. undo/redo도 이
절차를 사용하므로 정상 경로의 구독자는 일부 Store만 이동한 중간 상태 대신
함께 이동한 결과를 읽을 수 있습니다.

이는 **프로세스 내 Store 구독 공개 경계**이지 DB 분산 트랜잭션이 아닙니다.
네트워크 부작용이나 임의의 backend가 commit 도중 실패한 경우까지 자동으로
되돌리는 보장은 아닙니다. callback 안의 직접 읽기에 격리 수준을 부여하지도
않습니다. 사용자 정의 backend 역시 해당 계약을 올바르게 구현해야 합니다.

근거: [backend의 notification hold](../src/backend.ts),
[Coordinator의 begin/commit/rollback와 applyPositions](../../react/src/stores/core/StoreTransactionCoordinator.ts).

Travels 3의 단일 인스턴스 `transaction()`은 이 외부 prepare/commit/hold 프로토콜과
같지 않습니다. 첫 state-owning 실험은 `TimelineBackend`까지만 구현합니다.
후속 [controlled journal 경로](../examples/travels-v3/journal-backend.ts)는 어댑터가
상태를 stage하고 외부 begin/end/cancel·알림 hold를 구현하는 실제 `TransactionBackend`입니다.
기존 Coordinator의 async commit·undo·redo·rollback에 source 테스트로 연결했습니다.
upstream의 동기 transaction을 비동기인 것처럼 포장한 것은 아닙니다.

후속 scoped 경로는 writer token을 시작 전에 예약하고, Coordinator의 선택적
`batchControl`에 lifecycle 권한을 전달합니다. 임시 facade가 아닌 실제 Store를
참여시키므로 만료된 scope를 history identity로 보관하지 않습니다. 시작 observer부터
최종 알림까지 직접 쓰기를 막고 callback에는 해당 작업 전용 writer만 전달합니다.

### 3. Action·작업 의미를 명시적 metadata로 전달

`StateMutationMeta`의 `actionId`, `transactionId`, `label`, `origin`은 단순 값 변경에
작업의 문맥을 붙입니다. Coordinator는 묶음 작업 metadata를 참여 Store에 전달하고,
undo/redo에는 해당 origin을 붙일 수 있습니다.

Action dispatch를 모두 자동 추적하는 시스템은 아닙니다. handler나 orchestration에서
metadata를 명시적으로 전달해야 하며, 이 값은 권한 증명이나 영속 감사 로그가 아닙니다.
실험 역시 이를 upstream update/transaction metadata와 backend의 마지막 transition
metadata에 연결합니다.

근거: [StateMutationMeta](../../store-core/src/index.ts),
[backend의 mutateWithMetadata](../src/backend.ts),
[Coordinator metadata](../../react/src/stores/core/StoreTransactionCoordinator.ts).

### 4. React가 소비할 snapshot과 경로별 patch 채널

Backend는 안정적인 `getSnapshot()` 참조와 version을 제공하고, React의
`createBackendStore`와 `useStoreValue`가 이를 소비합니다. 경로 훅에는 이번
전이의 patch를 전달하여 관련 없는 경로 변경의 렌더링을 줄입니다. undo/redo와
Store 교체도 선택값·metadata가 갱신되는 별도 계약입니다.

최초 실험에서는 `useStorePath` 타입이 scoped Mutative의 mutable patch 배열에
결합되어 upstream readonly patch를 복사하는 view가 필요했습니다. 후속 개선에서
`PatchAwareStore` / `StorePathPatch`를 엔진 중립적인 readonly 관찰 계약으로 바꿔
이 view를 제거했습니다. 배열 경로·JSON Pointer와 move의 source도 공통으로
처리합니다. 엔진 교체 가능성과 모든 React API의 완전한 엔진 중립성은 여전히
다른 문제입니다.

또한 현행 로컬 `TimeTravel.notify()`는 기존 positional listener 계약을 위해
전체 `getPatches()`도 제공합니다. 전이 patch가 있다는 이유만으로 전체 알림 경로의
비용이 항상 O(delta)라고 할 수 없습니다. `getHistoryLength()`의 O(1) 조회와 실제
`getHistory()`의 재구성 비용 역시 구분해야 합니다.

근거: [backend snapshot·patch 처리](../src/backend.ts),
[BackendStore](../../react/src/stores/core/BackendStore.ts),
[useStorePath](../../react/src/stores/hooks/useStorePath.ts),
[현행 API 검증 범위](../../react/docs/api-functional-validation.md).

### 5. 수명과 데이터 소유권

safe read, 입력 clone, freeze, listener 오류 격리와 dispose는 draft 엔진만의
책임이 아닙니다. `BackendStore`의 shared/owned 옵션은 wrapper를 해제할 때 외부
backend까지 해제할지 구분합니다. dispose 뒤 예약된 알림이나 늦은 updater가
상태를 다시 바꾸지 않는 것도 연결 계층의 계약입니다.

모든 JS 값을 완전히 격리한다는 뜻은 아닙니다. 현행 safe snapshot은 지원되는
collection의 mutator를 막지만 DOM·함수·Promise 같은 비복제 host 값은 호출자
소유 참조로 남을 수 있습니다. read/clone/freeze 정책에 따른 비용과 제약이 있습니다.

근거: [backend 정책과 dispose](../src/backend.ts),
[immutable 도우미](../src/immutable.ts),
[BackendStore ownership](../../react/src/stores/core/BackendStore.ts).

### 6. 비동기 batch와 collection 호환 범위

현행 `TimeTravel.batch()`는 Promise가 끝날 때 commit하고 실패하면 batch frame으로
rollback할 수 있습니다. `StoreTransactionCoordinator.run()`도 비동기 callback을
받습니다. UI의 다단계 작업에 유용하지만 대기 중 임의의 외부 쓰기를 자동 격리하거나
이미 발생한 API 요청을 취소하지는 않습니다. 긴 batch의 사용 규율이 필요합니다.

현행 계층에는 Map/Set patch 처리, Set 삽입 순서를 보존하는 replace 전략,
Date/RegExp를 보존하는 clone 등 기존 소비자를 위한 확장도 있습니다. 이는 모든
JS 객체가 time travel·JSON 영속화에 안전하다는 뜻은 아닙니다.

반면 Travels 3은 Map/Set을 지원하지 않으며 transaction callback은 동기입니다.
journal 경로는 외부 staged 상태를 소유하여 어댑터에서 async grouping을 제공합니다.
실험은 여전히 durable JSON만 허용하므로 기존 collection 모델의 drop-in 대체는
아닙니다. 기존 ambient batch는 writer 직렬화가 필요합니다. 명시적 `batchIsolated()`와
다중 Store scoped helper는 token 기반으로 독립 쓰기를 거절하고 작업 종료 전에
writer를 만료시킵니다. callback이나 외부 네트워크 부작용을 강제 중단하는 것은 아닙니다.

근거: [TimeTravel.batch](../src/time-travel.ts), [produce/clone 정책](../README.md),
[upstream migration guide](https://github.com/mutativejs/travels/blob/v3.0.1/docs/migration-guide.md).

## 최신 엔진 실험이 가져오는 것과 남기는 것

| 항목 | 현행 maintained 구현 | v3 state-owning | v3 controlled journal |
| --- | --- | --- | --- |
| draft 엔진 | scoped Mutative, upstream 1.3.0 기준 | upstream Mutative 2.0.0 | upstream Mutative 2.0.0 |
| timeline | 로컬 TimeTravel | upstream Travels 3.0.1 | upstream Travels 3.0.1 journal |
| 연결 계약 | State/Timeline/Transaction | Timeline만 | Transaction |
| retained ID | 로컬 timeline이 관리 | 어댑터 관리 | 어댑터 관리 |
| batch | sync/async, 외부 begin/end/cancel | upstream sync transaction | adapter staged sync/async, savepoint·hold |
| 상태 범위 | collection 등 기존 정책 | durable JSON | durable JSON |
| 알림 | positional history + transition patch | revision + event-local patch | revision + event-local patch + hold |
| 영속화 | 기존 API·소유권 계약 | strict serialize + semantic restore | strict serialize + semantic journal restore |
| React | 기존 공개 API | backend·path hook 연결 | backend·path hook·Coordinator·Action bridge 연결 |

Upstream v3의 factories/capability 분리, revision, event-local patches, snapshot API,
semantic restore와 journal은 검토할 가치가 있습니다. 특히 history 전체가 필요
없는 observer 계약은 기존 알림 비용을 줄이는 설계 참고가 됩니다. 3.0.1의 CJS
선언 수정도 있습니다. 하지만 기존 생성자·옵션·구독 형태의 단순 버전 교체는 아닙니다.

실험은 매 update에 JSON 적합성을 검사하고 입력/patch를 분리·freeze합니다.
후속 소유권 개선은 auto-freeze 없는 produce 후 patch 값을 분리해서 적용하여
updater의 외부 객체 대입도 caller freeze와 이력 alias 없이 처리합니다. 그러나
상태 순회·delta 복사·추가 적용 비용이 있고, 성능 우위는 측정하지 않았습니다. 현행 구현도
batch frame의 상태·patch clone, history 재구성, fork 동기화와 회귀 검증 비용을
부담합니다. 어느 쪽도 비용 없이 더 안전한 선택은 아닙니다.

별도 탐색에서는 희소 배열의 현행 inverse replay 문제와 upstream forward의
hole topology 정규화 차이도 관찰했습니다. 이번 prototype은 희소 배열을 거절하며,
이를 전체 upstream의 정확성 우위 또는 현행 배열 전반의 실패로 일반화하지 않습니다.

## 채택 판단과 검증 범위

1. **지금은 기존 엔진 유지 + workspace prototype 병행**이 적절합니다. 기본
   undo/redo·snapshot·ID·React 연결 가능성을 확인하는 것이 이번 작업의 범위입니다.
2. controlled journal로 기본 다중 Store·async 연결은 검증했지만, 본 채택 전에는
   commit 중 임의의 참여자 실패·격리 API 채택 정책·collection·비표준 patch 관찰·기존
   TimeTravel API migration을 각각 결정해야 합니다.
3. 크기별 상태, 긴 history, 작은 delta, batch, 메모리, clone/freeze 비용을 포함한
   동일 조건 benchmark가 필요합니다. 이번 테스트는 benchmark가 아닙니다.
4. prototype 테스트는 workspace source 단위입니다. 기본 패키지의 artifact 검증을
   실행해도 prototype의 packed consumer·실브라우저 검증이 되지는 않습니다.

실행 방법·제한과 비교 테스트 위치는 [실험 README](../examples/travels-v3/README.md)에
정리합니다. 이 문서와 prototype 추가 자체는 공개 API·버전 변경이나 배포 승인이 아닙니다.
