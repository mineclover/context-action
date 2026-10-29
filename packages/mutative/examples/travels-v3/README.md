# Travels 3 / Mutative 2 실험용 backend

**상태: workspace 전용 prototype. 기존 엔진 교체나 공개 배포 승인이 아닙니다.**

- 엔진: `travels@3.0.1` + peer `mutative@2.0.0`을 정확한 버전으로 고정합니다.
- 두 의존성은 이 패키지의 **devDependencies**에만 추가합니다.
- 기존 runtime dependencies, `src/index.ts`, package exports, build entry와
  `mutative@1.3.0` fork baseline은 유지합니다.
- 이 디렉터리와 실험 API는 package tarball에 포함하지 않습니다.

## 두 가지 실험 경로

| 경로 | 상태 소유자 | 연결 계약 | batch |
| --- | --- | --- | --- |
| `backend.ts` | upstream state-owning Travels + 소유권 어댑터 | `TimelineBackend` | upstream 동기 transaction만 |
| `journal-backend.ts` | Context-Action 실험 어댑터, history는 upstream controlled journal | `TransactionBackend` | 어댑터 staged sync/async + 다중 Store hold |

두 번째 경로는 첫 경로가 지원하지 못했던 외부 begin/end/cancel·알림 hold를
실제로 구현합니다. upstream의 동기 transaction을 비동기라고 포장한 것이 아닙니다.

## 실행

저장소 루트에서:

```sh
pnpm install --frozen-lockfile
pnpm --filter @context-action/mutative test:travels-v3
pnpm --filter @context-action/mutative test
pnpm --filter @context-action/mutative lint
pnpm --filter @context-action/react exec jest --runInBand \
  __tests__/stores/core/travels-v3-backend.experimental.test.tsx \
  __tests__/stores/core/travels-v3-journal.experimental.test.tsx
```

Node 24와 native `structuredClone`을 기준으로 합니다. 브라우저도 해당 기능이
필요합니다. jsdom 테스트의 JSON fixture용 clone 대체 함수는 production
polyfill이 아닙니다.

## 사용 예: workspace 내부에서만

```ts
import { createTravelsV3Backend, restoreTravelsV3Backend } from './backend';

const backend = createTravelsV3Backend('document', { title: 'Draft', count: 0 });
backend.subscribe(() => console.log(backend.getSnapshot()));
backend.batch(() => {
  backend.update(draft => { draft.count += 1; return undefined; });
  backend.update(draft => { draft.title = 'Reviewed'; return undefined; });
}, { transactionId: 'edit-1', label: 'Review document' });
backend.undo();
backend.redo();
const saved = backend.serialize();
const restored = restoreTravelsV3Backend('restored', saved);
backend.dispose();
restored.dispose();
```

공개 import `@context-action/mutative/travels-v3`를 추가한 것은 아닙니다.
공개 패키지에서 이 prototype을 import할 수 없습니다.

## Controlled journal 경로

```ts
import { createTravelsV3JournalBackend } from './journal-backend';

const backend = createTravelsV3JournalBackend('document', { count: 0 });
await backend.batch(async () => {
  backend.update(draft => { draft.count += 1; return undefined; });
  await Promise.resolve();
  backend.update(draft => { draft.count += 1; return undefined; });
}, { label: 'two-step edit' });
backend.undo(); // 0: 하나의 retained entry로 되돌림
backend.dispose();
```

React integration host에서는 기존 `StoreTransactionCoordinator.run(participants,
callback, meta)`에 journal backend를 직접 참여시킬 수 있습니다. callback 중에는
staged 상태만 바뀌며 공개 snapshot은 유지합니다. 모든 참여자의 commit이 끝난 뒤
hold를 해제하므로 commit·undo·redo 알림에서 다른 참여자의 최종 snapshot도 읽습니다.
callback 실패는 미공개 staged 상태를 버리고 원래 오류를 전달합니다.

구현 책임은 `owned-json.ts`(검증·분리된 delta), `journal-batches.ts`(savepoint),
`transition-notifications.ts`(알림 hold), `journal-backend.ts`(조합)로 나눕니다.
retained history 전체를 복사하여 savepoint를 만들지는 않습니다.

### Journal 경로의 제약

- 외부 `beginBatch/endBatch/cancelBatch`는 LIFO savepoint입니다. 각각 요청한 hold는
  cancel 여부와 무관하게 `resumeNotifications()`로 짝을 맞춘 뒤 flush해야 합니다.
- managed `batch(callback)` 실행 중에는 중첩 batch·외부 end/cancel을 거절합니다.
  외부 batch 안에 managed batch를 중첩하지도 않습니다. 비동기 callback의 lifecycle을
  다른 호출자가 먼저 닫거나 바꾸지 못하게 하는 제한입니다.
- 기존 `batch()` / Coordinator `run()`은 **동시 writer 격리가 아닙니다.** await 중
  같은 backend에 직접 쓰면 열린 batch에 포함됩니다. 호환성을 위해 이 동작을 유지하며,
  격리가 필요한 작업은 아래 명시적 scoped 경로를 사용합니다.
- navigation-only batch는 coordinated undo/redo에 사용합니다. 같은 batch의 write와
  navigation 혼합, batch 중 reset/rebase/serialize는 거절합니다.
- dispose는 staged 상태와 알림을 버립니다. 이미 대기 중인 callback이 나중에 끝나면
  commit은 실패하고 늦은 write는 무시합니다. callback 자체를 강제 중단하지 않습니다.
- 정상 경로의 프로세스 내 알림 공개 계약입니다. DB 분산 transaction이나 임의의
  참여 backend가 commit 도중 실패한 뒤의 완전한 복구를 보장하지 않습니다.
- batch는 중간 forward patch를 연결하고 inverse를 역순으로 연결합니다. net-zero는
  상태 비교로 제거하지만 일반 batch의 모든 중간 patch를 최소 delta로 압축하지는 않습니다.

## 격리된 writer 경로

```ts
const isolated = createTravelsV3JournalBackend('isolated', { count: 0 });
await isolated.batchIsolated(async writer => {
  writer.update(draft => { draft.count += 1; return undefined; });
  await Promise.resolve();
  // writer는 read-your-writes, 공개 snapshot은 commit 전 값을 유지합니다.
  const next = writer.getValue().count + 1;
  writer.setValue({ count: next });
});
isolated.dispose();
```

다중 Store integration host에서는 workspace의 `isolated-transactions.ts`가 제공하는
`runIsolatedJournalTransaction`에 기존 Coordinator를 전달합니다. 이 helper는 React
런타임을 import하지 않고 구조적 Coordinator port를 사용합니다.

공통 `TransactionCoordinatorPort` / `TransactionMeta` / `TransactionOptions`는
`@context-action/store-core`가 소유합니다. 기존 실험용
`JournalTransactionCoordinator` / `JournalTransactionMeta` 이름은 호환 type alias로
남깁니다. helper는 구체적인 `TravelsV3JournalBackend` 클래스 대신
`ScopedTransactionParticipant<T>` 구조적 계약을 받고, 각 참여자의 상태 타입을
writer에 유지합니다. 이 예약 계약은 아직 workspace 실험 API이며 공개 core 계약이
아닙니다. 두 엔진 경로가 공유하는 patch·옵션 타입은 실험 `contracts.ts`에 모았습니다.

```ts
// integration host: createTravelsV3JournalBackend / runIsolatedJournalTransaction은
// 이 workspace 디렉터리에서 import하며 공개 package subpath는 아닙니다.
const coordinator = new StoreTransactionCoordinator();
const document = createTravelsV3JournalBackend('document', { title: 'Draft' });
const counter = createTravelsV3JournalBackend('counter', { count: 0 });
await runIsolatedJournalTransaction(coordinator, { document, counter }, async writers => {
  writers.document.update(draft => { draft.title = 'Reviewed'; return undefined; });
  await Promise.resolve();
  writers.counter.update(draft => { draft.count += 1; return undefined; });
}, { label: 'isolated edit' });
coordinator.undo(); // 실제 backend identity를 유지하므로 scope 종료 뒤에도 이동 가능
document.dispose();
counter.dispose();
```

- 시작 전에 모든 backend의 writer를 예약하여 `started` observer의 직접 쓰기도
  거절합니다. 기존 batch나 미해제 notification hold가 있으면 시작하지 않습니다.
- 임시 Store facade 대신 **실제 Store + token-checked `batchControl`**을 참여시킵니다.
  현재 작업의 lifecycle은 scoped control로 제어하고 history에는 실제 Store만 남깁니다.
- await·commit·알림 공개 중 직접 `backend.setValue/update`와 lifecycle/navigation은
  거절합니다. callback에 전달한 writer만 해당 batch를 변경할 수 있습니다.
- writer는 commit/rollback 전 seal되고 종료·dispose 후에는 영구 만료됩니다. 저장한
  writer의 read/write는 나중에 새 작업이 시작되어도 거절하며 updater도 실행하지 않습니다.
- `writer.getValue()`는 빌린 immutable staged 상태, `getSafeValue()`는 방어적 복사입니다.
  writer에는 navigation·lifecycle·dispose 권한이 없고 React Store 대신 사용하지 않습니다.
- 충돌을 queue/retry하지 않고 거절합니다. callback Promise는 끝까지 await해야 합니다.
  아직 settle하지 않은 callback이나 외부 네트워크 작업을 강제 취소하는 sandbox/timeout은
  아닙니다. 만료 후 실행된, 기다리지 않은 작업의 write 오류도 호출자가 처리해야 합니다.
- 같은 작업을 ambient Action transaction bridge와 scoped helper로 이중으로 감싸지
  않습니다. 이미 열린 batch가 있으면 scoped admission은 거절됩니다.
- scope 확보·admission·callback 실패 시 확보한 권한을 해제합니다. rollback도 실패하면
  `IsolatedJournalRollbackError.errors`에 두 오류를 함께 보존합니다. 임의의 controller가
  실제 commit 뒤 오류를 던진 것을 분산 rollback으로 되돌린다고 주장하지 않습니다.

## 공통 연결 계약

| 항목 | prototype의 처리 |
| --- | --- |
| `TimelineBackend` | snapshot, 구독, 쓰기, undo/redo/goTo/reset, retained entry ID 구현 |
| 버전 | upstream `getRevision()` → `snapshot.version`. 같은 버전은 같은 snapshot 참조 |
| 상태 소유권 | 초기값·setValue와 updater의 대입/root replacement를 격리. caller 객체를 freeze하지 않고 변경 경로 밖 구조 공유 유지 |
| patch 구독 | event-local delta만 분리·freeze. 전체 history의 `getPatches()`를 알림에 사용하지 않음 |
| history size | upstream transition 수 + 1을 retained 상태 수로 변환해 O(1) 조회 |
| entry ID | cursor와 별개인 ID를 어댑터에서 발급하고 trim/branch 후 오래된 ID 무효화 |
| batch | state-owning은 동기만, journal은 staged sync/async와 외부 batch/hold 지원 |
| 영속화 | strict serialize + semantic deserialize/restore. instance-local entry ID는 저장하지 않음 |
| 해제 | 구독 해제, listener 오류 격리, dispose 후 쓰기 차단 |

entry ID, snapshot, dispose, metadata 연결은 **Context-Action 측 어댑터 처리**입니다.
Travels가 동일한 framework 계약을 그대로 제공한다는 뜻은 아닙니다.

## 명시적인 제한

- prototype은 **durable JSON 상태로 제한**합니다. Map/Set, Date, 함수, undefined,
  비유한 수, 공유·순환 참조, 희소 배열 등을 거절합니다. 일반 `createTravels()`의
  모든 in-memory 허용 범위와 같지는 않으며, 실험에서 선택한 안전 정책입니다.
- mutation metadata도 durable JSON이어야 합니다. 없는 optional 필드는 생략합니다.
  Context-Action의 Action bridge도 이 규칙에 맞게 absent 필드를 생략하도록 수정했습니다.
- 매 update에서 상태를 검증하므로 O(state) 순회 비용이 있습니다. 입력 분리와
  freeze 비용도 포함하므로, delta 알림을 사용한다고 기존보다 빠르다고 주장하지 않습니다.
- updater는 auto-freeze를 끈 별도 produce 단계에서 patch를 만들고, patch 값을
  분리한 뒤 적용합니다. 직접 대입한 외부 객체는 freeze하지 않으며, 나중의 외부
  변경도 snapshot·redo 이력으로 새지 않습니다. 단, callback이 직접 외부 참조를
  수정하거나 부작용을 실행한 것까지 되돌리는 sandbox는 아닙니다.
- `mutable` / `autoArchive` / read policy를 자유롭게 바꾸는 호환 래퍼가 아닙니다.
  immutable·auto archive로 고정합니다.
- **state-owning 경로**의 `batch(async ...)`, batch 안의 navigation/dispose는 거절합니다. 타입 검사도
  Promise callback을 거절합니다.
- 일반 함수가 Promise를 반환하면 그 시점까지의 동기 변경은 rollback하지만,
  이미 예약된 비동기 continuation이나 외부 부작용까지 취소하지는 못합니다.
- state-owning 경로는 외부 batch/hold를 제공하지 않는 `TimelineBackend`입니다.
  해당 capability가 필요하면 실제 `TransactionBackend`를 구현한 journal 경로를 사용합니다.
- state-owning upstream transaction 실패는 원래 예외 자체 대신 `TRANSACTION_FAILED` 코드와
  `cause`로 관찰합니다.
- observer 안의 동기 재진입 쓰기는 upstream에 따라 거절합니다.
- semantic restore는 이력의 재생 정합성을 검사합니다. 발신자 신원·권한까지
  증명하지는 않으므로 외부 데이터에는 별도 신뢰 경계가 필요합니다.

## React 연결에서 확인한 차이

기존 `createBackendStore(..., backend)` + `useStoreValue()`에 연결해 write,
batch, undo/redo와 shared/owned disposal을 테스트합니다.

최초 실험에서는 `useStorePath`가 scoped Mutative의 mutable patch 배열에 결합돼
명시적인 patch view가 필요했습니다. 후속 이식성 개선으로 경로 구독을 구조적
readonly `StorePathPatch` 계약으로 바꿔, 현재는 `useStorePath(store, ['count'])`에
직접 연결합니다. 배열/path 복사나 호환성 cast는 필요하지 않습니다. 기존 Mutative
patch와 공개 `Patches` export도 유지합니다.

후속 journal 실험은 다중 Store transaction·async grouping·소유권과 명시적 scoped
writer 격리를 검증합니다. collection·실제 브라우저·외부 부작용 취소까지 해결한 것은 아닙니다.
[가독성·이식성 평가](../../../react/docs/backend-portability-review.md)를 참고하세요.

## 비교 결과의 범위

- `__tests__/travels-v3-backend.test.ts`에서 maintained backend와 두 prototype에
  동일한 기본 `TimelineBackend` 계약을 적용하고 prototype 고유 제한도 검증합니다.
- `packages/react/__tests__/stores/core/travels-v3-backend.experimental.test.tsx`는
  workspace source 사이의 연결 검사입니다. prototype의 packed consumer 또는
  실제 브라우저 검증은 아닙니다.
- `__tests__/travels-v3-journal-backend.test.ts`는 ownership·staged batch·async
  rollback·hold·restore를, React의 `travels-v3-journal.experimental.test.tsx`는 기존
  Coordinator·Action bridge·React hook과의 source 연결을 확인합니다.
- `__tests__/travels-v3-isolation.test.ts`와 React journal source 테스트는 scope의
  만료·독립 writer 충돌·시작 observer·부분 확보 실패·공개 중 재진입·dispose를 검증합니다.
- 기본 export·의존성 경계를 유지했다는 사실이 전체 기능 호환이나 성능 우위를
  증명하지는 않습니다.

현행 구현의 특화점과 채택 판단은
[Time Travel의 Context-Action 특화](../../docs/time-travel-specialization.md)를 참고하세요.

## Upstream 참고

- [Travels 3.0.0](https://github.com/mutativejs/travels/releases/tag/v3.0.0)
- [Travels 3.0.1 CJS 선언 수정](https://github.com/mutativejs/travels/releases/tag/v3.0.1)
- [Travels migration guide](https://github.com/mutativejs/travels/blob/v3.0.1/docs/migration-guide.md)
- [Mutative 2.0.0](https://github.com/unadlib/mutative/releases/tag/v2.0.0)
