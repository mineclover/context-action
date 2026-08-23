# Integration Profile

Integration Profile은 외부 도메인이 Context-Action을 사용할 때 따르는 버전 있는
컨벤션입니다. `@context-action/core`에 도메인 타입이나 업무 규칙을 넣지 않고,
lifecycle·상태 소유권·호환성·증빙 조건을 catalog로 공급합니다.

## Lifecycle

`draft → registered → verified → supported → deprecated`

- **draft**: 제안만 있고 consumer 계약은 아직 없습니다.
- **registered**: action/state 소유권 manifest와 consumer가 정해졌습니다.
- **verified**: 필요한 consumer lifecycle 증빙이 통과했습니다.
- **supported**: 호환성·릴리즈 증빙에 포함됩니다.
- **deprecated**: 대체 profile과 migration 경로를 기록합니다.

## Interface Intent runtime profile

[`interface-intent-runtime`](../../../catalog/integration-profiles/interface-intent-runtime.v1.json)은
현재 **registered** 상태입니다. `scope.select`, `scene.select`, `compile.run`,
`evaluate.run` 네 typed action을 공급하며, document ref·revision cancellation·순수
compiler/evaluator 경계를 요구합니다. 원본 Interface Intent 문서는 외부 authority로
남고 runtime에는 ref·선택·실행 상태·파생 evidence만 둡니다.

`CapabilityDocument.publicPorts`는 명시적인 typed binding으로 연결합니다. catalog의
문자열을 자동으로 공개 TypeScript command로 만들면 안 됩니다.

## 검증

```bash
pnpm integration-profile:check
node scripts/verify-context-action-conventions.mjs
```

외부 consumer는 소비하는 profile과 자체 adapter·lifecycle·route 증빙을 선언합니다.
두 쪽 증빙이 모두 기록되어야 profile을 `verified`로 올립니다.
