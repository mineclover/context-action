---
document_id: context-layered--next-work
category: context-layered
source_path: ko/context-layered/next-work.md
character_limit: 5000
last_update: '2026-07-20T18:05:45.088Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
다음 작업과 문서 소유권

다음 작업과 문서 소유권 이 페이지는 Context-Action 아키텍처와 tool-calling 작업의 유지되는 짧은 backlog다. 의미 계약 문서, 운영 runbook, package README, 생성 API 문서가 서로 다른 TODO 목록을 갖지 않도록 한 곳에서 다음 작업을 관리한다. 문서 소유권 | 관심사 | 기준 문서 | 이 문서에 넣지 않는 것 | | --- | --- | --- | | tool 실행 의미, timeout, abort-drain, idempotency, durable recovery | Tool-calling Editor Architecture | 배포 명령과 장애 대응 | | Redis 배포, retention, rollback, 운영 절차 | Durable Operation Runbook | 새로운 protocol 의미 | | package API와 consumer quickstart | package README.md | 두 번째 state-machine 명세 | | 공개 TypeScript signature | TypeDoc 출력과 typedoc-vitepress-sync | 손으로 작성한 동작 주장 | | 심볼/문서 work context | @context-action/sem-doc report와 경계 가이드 | architecture gate 정책 | | architecture evidence, snapshot, history, ContextScope | Architecture Governance | 운영 work-context binding | | 짧은 요약 | llmsData/와 llms-generator | 수동 backlog 결정 | 계약이 바뀌면 먼저 소유 문서를 수정하고, 그 다음 영문/국문 문서와 생성 artifact를 갱신한다. Package README는 전체 계약을 복사하지 말고 소유 문서로 링크한다. 완료된 기반 - durable operation record에 lease 기반 claim/replay/complete/fail/unknown 전이와 revision 검증 reconciliation이 구현되어 있다. - IndexedDB·Redis reference backend, 선택적 Redis client bridge, bounded keyset cleanup, Redis 7 integration 검증이 있다. - Live Code Editor recovery는 editor.saveFile과 editor.saveAll을 모두 지원한다. 다중 파일은 제한된 digest/길이 manifest만 저장하고 mismatch면 mutation을 다시 실행하지 않고 unknown으로 남긴다. - TOOLEXECUTIONUNKNOWN 진단 결과는 정제 후 durable record에 보존되어 resolver가 확인할 수 있으며 source text는 저장하지 않는다. - sem-doc은 operational Symbol Context SSOT이고 Architecture Governance는 실험적 authored-evidence/control-plane package로 분리되어 있다. - complete symbol snapshot, commit history, context intersection, 명시적 one-hop nodemodules surface 정책이 서로 다른 계약으로 문서화되어 있다. 우선순위 backlog P0 — 배포 검증 현재 Redis smoke와 integration 검증을 대상 staging/production 배포 endpoint에서 실행한다. endpoint 설정, lease/retention schedule, alert, fail-closed 동작, rollback 절차와 담당자를 기록한다. 운영 작업이며 두 번째 persistence abstraction을 만들지 않는다. 완료 기준: 배포 endpoint가 atomic claim, replay, unknown diagnostic retention, recovery, retention-prune 검증을 통과하고 runbook에 담당자와 rollback 판단이 있다. 현재 증거: 로컬 Redis 7 컨테이너에서 smoke와 전체 integration suite가 통과했다. 보호된 endpoint와 operator record가 제공되기 전까지 대상 staging/production endpoint는 unverified 상태다. P1 — 외부 side-effect 경계 (runner·HTTP·queue bridge 구현 완료) @context-action/tool-protocol의 framework-neutral createDurableSideEffectRunner() 계약을 구현했다. 기존 durable operation key와 fingerprint를 재사용하고 completed/failed/unknown outcome을 명시하며, draining handler보다 cancellation이 먼저 오면 즉시 반환하고 domain 소유 recovery를 지원한다. standalone Bolt-style editor는 이제 전용 IndexedDB durable store를 사용해 연결된 폴더의 파일 write/delete마다 이 계약을 채택한다. 같은 runner를 감싸는 runHttpSideEffect()와 runQueueSideEffect()도 제공하며 ambiguous record는 runner의 기존 recover()를 사용한다. 두 bridge는 application 소유 response/acknowledgement classifier를 요구하며 non-2xx 응답이나 queue

Key points:
• durable operation record에 lease 기반 claim/replay/complete/fail/unknown 전이와
• IndexedDB·Redis reference backend, 선택적 Redis client bridge, bounded keyset
• Live Code Editor recovery는 `editor.saveFile`과 `editor.saveAll`을 모두 지원한다.
• `TOOL_EXECUTION_UNKNOWN` 진단 결과는 정제 후 durable record에 보존되어
• `sem-doc`은 operational Symbol Context SSOT이고 Architecture Governance는
• complete symbol snapshot, commit history, context intersection, 명시적 one-hop
• LSP 수준의 정확한 reference 위치, unsaved overlay, CodeAction.
• `@samchon/graph`, `@ttsc/graph` 같은 compiler-resolved graph provider.
• ContextScope 시각화용 renderer/bubble editor. 먼저 직렬화 scope와 결정적 집합
• provider 자체 idempotency 또는 inbox/outbox 계약 없이 provider exactly-once 보장.
• [ ] 수정 전에 소유 package와 기준 문서를 정한다.
• [ ] ownership table이 요구하는 교차 링크 외에는 의미 문서 또는 runbook 한 곳만 수정한다.
• [ ] focused test와 contract/fixture version을 추가한다.
• [ ] 문서가 안정된 뒤 영문/국문과 LLMS artifact를 생성한다.
• [ ] `pnpm docs:management`, package focused check, `pnpm docs:build`를 실행한다.