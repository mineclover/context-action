# 프로덕션 준비도

Context-Action은 패키지 경계와 운영 모델이 문제에 맞는 경우 프로덕션 React 애플리케이션 상태 관리에 사용할 수 있습니다. 이 문서는 포괄적인 성능 또는 exactly-once 보장을 주장하지 않고, 현재의 검증된 계약을 설명합니다.

## 결론

| 워크로드 | 판단 | 필요한 실천 |
| --- | --- | --- |
| 로컬 React UI·애플리케이션 상태 | 사용 가능 | `createStoreContext`, `useStoreValue`, 좁은 컨텍스트 경계를 사용합니다. |
| 타입 안전한 액션 조율 | 사용 가능 | 도메인 작업은 핸들러에 두고 취소·타임아웃 의미를 명시합니다. |
| React 19.2 SSR·하이드레이션 | 검증 버전에서 사용 가능 | 지원되는 React와 타입 패키지 버전을 릴리즈 코호트에 맞춥니다. |
| Undo/redo·고빈도 업데이트 | 앱 측정 후 사용 가능 | 워크로드에 맞게 히스토리·알림 설정을 선택하며 보편적 성능 배수에 의존하지 않습니다. |
| 탭·워커·서버 간 durable tool 호출 | 개발 트랙 | 별도 릴리즈 결정을 하기 전에 Durable 0.2 fence 마이그레이션과 실제 저장소 엔드포인트 검증을 완료합니다. |
| 외부 부작용의 exactly-once | 라이브러리만으로 보장하지 않음 | provider idempotency key, inbox/outbox 또는 동등한 계약, 도메인 reconciliation을 사용합니다. |

Store와 Action 계층은 상태 소유권, 구독, 액션 핸들링의 경계를 분명히 해야 할 때 적합합니다. 애플리케이션의 인가 모델, 외부 provider의 idempotency 계약, 운영 데이터베이스 소유권을 대체하지는 않습니다.

## 검증된 안정화 범위

보호된 릴리즈 사전 점검은 엄격한 소스·테스트 타입 검사, React 19.2 최소/현재 호환성 매트릭스, SSR/하이드레이션, 패킹된 ESM/CJS·NodeNext 소비자, 패키지 export, 예제, 워크플로·릴리즈 안전성, durable adapter 검증을 포함합니다. Redis와 PostgreSQL adapter도 CI 서비스 컨테이너에서 검증합니다.

이 근거는 후보 커밋의 라이브러리 계약을 뒷받침합니다. 프로덕션 배포 전에는 정확한 릴리즈 후보에서 같은 사전 점검을 실행하고, staging 또는 프로덕션과 동등한 Redis/PostgreSQL 엔드포인트에서 자격 증명, TLS, 마이그레이션, 보존, failover 동작을 검증해야 합니다.

## 상태 관리 중심의 배포 대상

즉시 배포 대상은 상태 관리 표면입니다.

| 패키지 | 버전 | 의미 |
| --- | --- | --- |
| `@context-action/core` | `1.1.0` | 안정화된 액션 lifecycle·observer 의미론 |
| `@context-action/react` | `2.0.0` | Store·Action API의 React lifecycle·SSR 계약 |

Durable Operations 0.2와 연계된 tool protocol 작업은 적극 개발 중이며, 일반 Store·Action·React 19.2·SSR 사용의 선행 조건이 아닙니다.

## 책임과 기능 계약

배포 경계는 의도적으로 좁게 잡았습니다. 애플리케이션을 설계할 때 아래 표를
선택 기준으로 사용하고, 한 패키지가 다음 행의 책임을 암묵적으로 떠안지 않게
하십시오.

| 관심사 | 소유자 | 기능 | 명시적으로 책임지지 않는 것 |
| --- | --- | --- | --- |
| 액션 실행 | `@context-action/core` | 핸들러 등록·실행 순서, 취소, 타임아웃, 결과, observer lifecycle을 제공합니다. | React 렌더링, 상태 영속화, tool schema, provider 호출, 인가 |
| React 상태·합성 | `@context-action/react` 2.0 | Store/Action context를 만들고 React 구독을 연결하며 검증된 React 19.2·SSR lifecycle 계약을 제공합니다. | DB 기반 작업, 프로세스 간 복구, provider/tool runtime |
| 애플리케이션 도메인 | 애플리케이션 | 상태 모양, 비즈니스 규칙, 인가, API client, 성공·실패의 의미를 정의합니다. | 일반 Store나 action registry에 비즈니스 정책을 위임하는 일 |
| Tool protocol — 개발 트랙 | `@context-action/tool-protocol` | provider 중립 tool schema, 직렬화, 승인, 관측 가능한 protocol metadata를 정의합니다. | React 상태 lifecycle이나 durable persistence |
| Durable mutation 복구 — 개발 트랙 | `@context-action/tool-durable-operations` | record, lease, full fence, 명시적 `unknown` 상태로 하나의 외부 mutation을 조율합니다. | 외부 provider의 exactly-once 보장, 애플리케이션 인가, 도메인 reconciliation 정책 |
| 영속성과 외부 부작용 | 애플리케이션 인프라·provider | atomic storage, migration, provider idempotency, 상태 조회, retention, 알림, rollback을 제공합니다. | 애매한 원격 mutation의 성공 여부를 클라이언트 라이브러리가 추론한다고 가정하는 일 |

일반적인 React 상태 관리 앱에서는 첫 세 행이 완전한 경로입니다. Store는 소유한
상태에, Action handler는 상태 전이나 orchestration 경계에, 애플리케이션 service는
I/O와 인가에 사용하십시오. provider-tool 상호운용성이나 프로세스 경계를 넘는
복구가 실제로 필요할 때만 protocol·Durable 트랙을 추가합니다.

### Durable을 개발하는 이유와 분리하는 이유

메모리 안의 Promise나 idempotency map만으로는 브라우저 탭, 워커, 프로세스 재시작, provider 응답 유실을 넘는 mutation을 안전하게 조율할 수 없습니다. Durable Operations는 이런 경우에 애플리케이션이 소유하는 record, lease, full incarnation/revision fence, 명시적인 `unknown` 복구 경로를 제공하기 위해 개발되었습니다.

이 문제는 클라이언트 상태 관리와 다른 운영 경계를 가집니다. 실제 persistence service, provider·도메인 상태 조회, 명확한 reconciliation 정책이 필요합니다. 이를 개발 트랙에 두면 데이터베이스와 provider 복구 계약이 core 상태 관리 배포의 우발적인 요구 사항이 되는 일을 막을 수 있습니다.

소스에는 개발용 `@context-action/react/tools`가 남아 있지만, Durable 0.2를 보류하는 동안 React 3 artifact에서는 이 subpath를 의도적으로 제외합니다. 일반 React root entry는 이 개발 트랙과 독립적입니다.

## Durable operation의 운영 경계

Durable operation은 claim에서 얻은 full fence로 오래된 owner를 막습니다.

```ts
const claim = await store.claim(key, fingerprint, ownerId);

if (claim.status === 'owner') {
  await store.complete(key, ownerId, result, claim.fence);
}
```

모든 terminal·reconciliation 전이는 그 결정을 시작하기 전에 관찰한 fence를 사용해야 합니다. 마이그레이션 중에는 pre-fencing writer와 fenced writer를 같은 mutation 경로에서 함께 실행하지 마십시오. 호출이 `unknown`이 되면 애매한 외부 부작용을 자동 재실행하지 말고 provider 또는 도메인 시스템을 먼저 조회한 후, 캡처한 fence로 reconciliation 하십시오.

전체 복구·마이그레이션 규칙은 [durable operation runbook](/ko/context-layered/architecture/durable-operation-operations)과 [tool-calling architecture](/ko/concept/tool-calling-editor-architecture)를 참고하십시오.

## 프로덕션 도입 체크리스트

- Core 1.1 / React 3 코호트를 함께 고정하고 테스트합니다.
- 정확한 후보 커밋에서 `pnpm release:check`를 실행합니다.
- workspace 테스트만이 아니라 패킹 소비자·React 호환성 검사를 릴리즈 게이트로 사용합니다.
- Core 1.1 / React 3은 일반적인 애플리케이션 canary·rollback 절차로 점진 배포합니다.

별도 Durable 트랙을 선택했다면 추가로 애플리케이션이 소유한 staging 환경에서
Redis/PostgreSQL을 검증하고, durable key·owner ID·retention·prune·알림·reconciliation
정책을 정해야 합니다. 외부에 보이는 mutation에는 provider idempotency key와 도메인
source of truth를 함께 사용하십시오.

## 권고

명시적인 context 경계가 필요한 팀이라면, 타입 안전한 React 상태와 액션 조율에 Context-Action을 지금 사용해도 좋습니다. Durable side-effect 기능은 별도 운영 체크리스트와 릴리즈 결정을 마칠 때까지 개발 트랙에 두십시오. 이는 강하게 검증된 상태 관리 기반이며, 임의의 원격 provider가 exactly-once가 되거나 모든 워크로드에서 동일한 성능을 낸다는 약속은 아닙니다.
