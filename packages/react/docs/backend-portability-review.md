# Time Travel backend 가독성·이식성 평가

## 결론

엔진 교체를 막는 모든 책임이 draft 엔진 안에 있는 것은 아닙니다. 이번 평가에서
**경로 구독의 Mutative 타입 결합과 patch 해석 오류는 Context-Action 자체에서
개선할 수 있는 문제**였으므로 수정했습니다. 기존 엔진 교체·버전 변경·배포는
범위에 포함하지 않습니다.

평가 대상은 현행 Store/Timeline 계약, React 연결 경계와 workspace Travels 3
prototype입니다. 아래 평가는 특정 benchmark 점수나 모든 외부 엔진의 호환 인증이
아닙니다.

## 평가와 반영

| 영역 | 발견 | 처리 |
| --- | --- | --- |
| 역할 분리 | State/Timeline/Transaction 계약 구분은 읽기 쉽고 엔진 교체 범위도 명확함 | 유지. 후속 controlled journal 경로가 실제 staged transaction/hold를 구현 |
| patch 관찰 타입 | readonly upstream patch를 hook에 연결하려고 배열/path 복사 wrapper가 필요했음 | 엔진 중립적인 `StorePathPatch`로 일반화, wrapper 제거 |
| patch 해석 | 문자열 path를 배열로 단언해 읽었고 move의 source와 copy 삽입 이동을 놓쳤음 | JSON Pointer 해석·source/destination 분리, unsafe cast 제거 |
| const 입력 | hook 입력이 mutable 배열만 요구해 읽기 전용 도메인 상수 연결이 불편했음 | path·dependsOn에 readonly 배열 허용, 기존 mutable `StorePath` alias 유지 |
| snapshot 의미 | `snapshot.value ?? getValue()`가 의도적인 null/undefined를 오래된 값으로 바꿀 수 있었음 | snapshot 유무로만 fallback 판단, 반복 읽기를 작은 helper로 통합 |
| notification 구조 | BackendStore는 patch-first/regular-first·재진입·누락 이벤트를 조정하므로 복잡함 | 이번에 무리하게 축약하지 않음. 기존 lifecycle 회귀 계약을 유지 |
| prototype 책임 | history ID, snapshot, clone/freeze, metadata, dispose 책임이 엔진 옆에 남음 | 책임을 문서화. 엔진 고유 API를 View로 누출하지 않음 |
| writer 격리 | ambient batch는 await 중 독립 writer를 구분하지 못하고, 시작 이벤트 뒤 잠금도 늦음 | 명시적 scoped writer와 시작 전 예약 추가. stable identity와 lifecycle 제어권 분리 |
| Action metadata | bridge가 선택 필드에 명시적인 undefined를 넣어 durable backend의 begin을 실패시킬 수 있었음 | 없는 optional 필드는 생략. 기본 공개 계약과 journal 연결에서 검증 |

## 사용 형태: 변환 wrapper 없이 연결

```tsx
import { useStorePath, useStoreSelectorWithPaths } from '@context-action/react';
import type { PatchAwareStore, StorePathPatch } from '@context-action/react';
import { createBackendStore } from '@context-action/react/backend';
import type { StateBackend } from '@context-action/react/backend';

type Document = { title: string };
const titlePath = ['title'] as const;
const titleDependencies = [titlePath] as const;

// 실제 구현은 snapshot 안정성·상태 소유권·알림 계약을 책임집니다.
function connect(backend: StateBackend<Document, StorePathPatch>) {
  return createBackendStore('document', backend);
}

function Title({ store }: { store: PatchAwareStore<Document> }) {
  const title = useStorePath<Document, string>(store, titlePath);
  const length = useStoreSelectorWithPaths(store, state => state.title.length, {
    dependsOn: titleDependencies,
  });
  return <span>{title} ({length})</span>;
}
```

`StorePathPatch`는 `op/path/from/value`의 readonly 구조만 설명합니다. JSON Patch
라이브러리를 의존성으로 추가하거나, 데이터를 적용/변환하는 새 엔진을 만들지
않습니다. 기존 `Patches` export와 Store/TimeTravelStore 입력도 유지합니다.

## 정확성과 최적화의 경계

- 배열 경로와 RFC 6901 JSON Pointer를 지원합니다. dot path나 URI fragment
  pointer는 자동 추정하지 않고 전체 무효화로 처리합니다.
- move는 source와 destination, copy는 destination의 구조적 이동을 확인합니다.
  array length·add/remove도 하위 index 구독을 보수적으로 갱신합니다.
- 숫자 `1`과 문자열 `'1'`은 실제 JS property 접근과 같게 비교합니다. `'01'`을
  숫자로 변환하지는 않습니다. 경로 상수의 cache signature 규칙은 유지합니다.
- 해석 불가능한 경로·operation·opaque collection key는 전체 무효화합니다.
  잘못된 patch를 승인하거나 적용하는 검증기는 아닙니다. 안전한 해석을 못 하면
  추가 읽기를 허용하여 구독 갱신 누락을 피합니다.
- 훅은 `getValueAtPath`의 일반 property 접근을 유지합니다. Map/Set 객체의 원소
  탐색까지 지원한다고 주장하지 않습니다. 비표준 엔진은 patch를 명시적으로
  변환하거나 알 수 없는 변경에 `null`을 보내야 합니다.

## 공통 인터페이스 후속 정리

- 소유권(`StateBackend` / `TimelineBackend` / `TransactionBackend`)과 조정 참여
  역할(`TransactionParticipantBackend`)을 구분했습니다. Coordinator는 쓰기·전체
  history·개별 undo/redo 없이도 필요한 retained-entry 이동과 batch 제어만 받습니다.
- transaction metadata·participant·handle·begin-only port는 store-core로 통합하고,
  Action bridge와 실험 helper가 같은 구조적 port를 사용합니다. Coordinator 내부의
  heterogeneous `any` 저장소도 제거했습니다.
- 기존 React snapshot의 선택적 version과 metadata의 고정 필드, 기존 편의 메서드는
  호환 facade로 남겼습니다. strict backend snapshot의 version 필수 조건은 유지합니다.
- 실험 엔진의 공통 patch·옵션은 별도 contracts로 분리했습니다. scoped 예약은 여전히
  workspace 전용 계약이며, 공개 runtime이나 core에 엔진 클래스를 넣지 않았습니다.
- source/installed-CJS 최소 참여자 테스트와 strict ESM/CJS consumer가 이 경계를
  확인합니다. 새 shared type의 배포에는 별도 버전 조합·dependency floor 승인이 필요합니다.

## 아직 남는 이식성 한계

1. **다중 Store 원자적 공개**: 후속 `journal-backend.ts`가 staged begin/end/cancel과
   hold를 구현해 기존 Coordinator의 async commit·undo·redo·rollback에 연결됩니다.
   정상 경로의 프로세스 내 공개 계약이지, DB transaction이나 임의의 참여자가
   commit 도중 실패했을 때 완전한 복구를 보장하는 것은 아닙니다.
2. **async batch·collection**: state-owning 경로는 동기만, journal 경로는 어댑터의
   staged async grouping을 지원합니다. 기존 ambient API는 writer 직렬화가 필요하지만,
   `batchIsolated()` / `runIsolatedJournalTransaction()`은 명시적 writer token으로 독립
   쓰기를 거절합니다. callback을 강제 중단하거나 외부 부작용을 취소하는 기능은 아닙니다.
   JSON·Map/Set 제한은 유지합니다.
3. **소유권**: 두 경로 모두 auto-freeze 없는 produce → patch 값 분리 → 적용으로
   빌린 객체의 freeze/이력 alias 문제를 수정했습니다. callback이 직접 실행한 외부
   부작용을 sandbox처럼 차단하거나 rollback하는 것은 아닙니다.
4. **runtime**: prototype은 modern `structuredClone`을 요구합니다. jsdom 대체
   함수는 JSON fixture용이며 production polyfill이나 구형 브라우저 지원이 아닙니다.
5. **성능**: wrapper의 patch 복사는 제거했지만 path 해석과 보수적 무효화 비용은
   있습니다. prototype의 상태 검증·clone/freeze 비용도 남습니다. 엔진 간 성능
   우위를 측정하지 않았습니다.

### Collection 채택 판단

Map/Set을 JSON으로 자동 변환하는 범용 호환 계층은 추가하지 않습니다. Map의 객체
key identity, Set의 동등성·삽입 순서는 단순 직렬화만으로 보존되는 계약이 아니기
때문입니다. 기존 collection 기반 사용처는 maintained backend를 유지합니다.

JSON 모델로 이식할 사용처는 도메인에서 명시적으로 결정해야 합니다. 예를 들어
string-key Map은 순서를 보존하는 `entries: Array<[string, Value]>`, string Set은
중복을 검증하는 `items: string[]`로 모델링할 수 있습니다. 객체 key라면 stable ID
정책이 먼저 필요합니다. 이는 모델 migration 예시이지 새 public codec API나
투명한 Map/Set 호환성 보장이 아닙니다.

## 검증 근거

- `__tests__/stores/utils/patch-affects-path.test.ts`: readonly·pointer escape·숫자
  index·root·move/copy·불명확한 경로의 순수 함수 계약.
- `__tests__/stores/hooks/path-subscription-portability.contract.test.tsx`:
  외부 엔진 없는 backend fixture, 직접 hook 연결, 불필요한 렌더 방지, 이동 후
  선택값, nullish snapshot·구독 해제의 공개 API 계약.
- `__tests__/stores/core/travels-v3-backend.experimental.test.tsx`:
  upstream readonly patch의 직접 연결. workspace source 테스트이며 prototype의
  공개 패키지 검증은 아닙니다.
- `__tests__/stores/core/travels-v3-journal.experimental.test.tsx`:
  async 다중 Store 공개·rollback·history 충돌·trim·Action 연결의 source 계약.
- `__tests__/stores/core/action-transaction-metadata.contract.test.ts`:
  absent optional 필드를 생략하고 explicit trace는 유지하는 기본 공개 계약.
- `__tests__/stores/core/transaction-batch-control.contract.test.ts`:
  lifecycle 제어와 identity 분리, 만료된 control을 history에서 재사용하지 않는 공개 계약.
- `__tests__/stores/core/transaction-participant.contract.test.ts`:
  version 없는 최소 참여자의 commit·rollback·retained-entry 이동, begin-only Action bridge.
- `scripts/verify-react-compatibility.mjs`: 새 공개 타입·readonly 연결을 strict
  ESM/CJS 소비자에서 검사하고, portable hook 계약을 설치된 production CJS에
  대해서도 실행합니다. 이 경로는 integration peer 설치 전에 실행됩니다.

가독성 개선은 책임을 숨기는 단축보다 **필요한 최소 계약을 명시하고 변환 wrapper와
unsafe cast를 없애는 방향**에 집중했습니다. 전체 BackendStore 재설계나 구현 파일의
기계적인 분리는 이번에 하지 않았습니다.
