---
document_id: context-layered--next-work
category: context-layered
source_path: ko/context-layered/next-work.md
character_limit: 5000
last_update: '2026-07-30T23:07:59.034Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
다음 작업과 문서 소유권

다음 작업과 문서 소유권 이 페이지는 Context-Action 아키텍처와 tool-calling 작업의 유지되는 짧은 backlog다. 의미 계약 문서, 운영 runbook, package README, 생성 API 문서가 서로 다른 TODO 목록을 갖지 않도록 한 곳에서 다음 작업을 관리한다. 문서 소유권 | 관심사 | 기준 문서 | 이 문서에 넣지 않는 것 | | --- | --- | --- | | tool 실행 의미, timeout, abort-drain, idempotency, durable recovery | Tool-calling Editor Architecture | 배포 명령과 장애 대응 | | Redis 배포, retention, rollback, 운영 절차 | Durable Operation Runbook | 새로운 protocol 의미 | | package API와 consumer quickstart | package README.md | 두 번째 state-machine 명세 | | Durable mutation 실행, side-effect adapter, backend 운영 | @context-action/tool-durable-operations와 Durable Operation Runbook | provider-neutral tool schema 또는 domain outbox 정책 | | 공개 TypeScript signature | TypeDoc 출력과 typedoc-vitepress-sync | 손으로 작성한 동작 주장 | | 짧은 요약 | llmsData/와 llms-generator | 수동 backlog 결정 | 계약이 바뀌면 먼저 소유 문서를 수정하고, 그 다음 영문/국문 문서와 생성 artifact를 갱신한다. Package README는 전체 계약을 복사하지 말고 소유 문서로 링크한다. mutation 대상 인벤토리 다음 side-effect 도입 후보를 저장소 안에서 다시 분류한 결과는 다음과 같다. | 표면 | 분류 | durable mutation 판단 | | --- | --- | --- | | OpenRouter /models와 chat-completions 호출 | provider discovery/model inference이며 Context-Action domain mutation이 아님 | durable side-effect runner로 감싸지 않는다. provider retry/timeout은 provider adapter가 소유한다. | | Live Code Editor 연결 폴더 save/delete | 로컬 filesystem mutation | standalone Bolt-style editor와 example editor의 reference runner 경계가 이미 적용되어 있다. | | Performance useApiRequest demo | idempotency 또는 inbox/outbox 계약이 없는 일반 GET/POST playground | request cache/timeout 예제로 유지하고 production mutation 대상으로 취급하지 않는다. | | Queue publisher | 이 저장소가 소유한 queue SDK/publisher가 없음 | 가짜 adapter를 추가하지 않는다. 실제 provider를 선택하고 acknowledgement/idempotency 계약을 먼저 문서화한다. | 이 인벤토리는 provider read, model inference, demo 요청을 production mutation으로 잘못 분류해 중복 구현하는 일을 막는다. 따라서 다음 외부 adapter 작업은 애플리케이션 담당자, 실제 endpoint 또는 queue, provider 소유 idempotency/inbox-outbox 계약이 확정된 뒤에만 이 저장소에 코드를 추가한다. 완료된 기반 - durable operation record에 lease 기반 claim/replay/complete/fail/unknown 전이와 revision 검증 reconciliation이 구현되어 있다. - IndexedDB·Redis·PostgreSQL reference backend, 선택적 Redis client bridge, bounded keyset cleanup, Redis 7 integration 검증과 PostgreSQL 16 CI smoke가 있다. Deployment preflight는 credential을 노출하지 않고 endpoint scheme을 검증한다. - Live Code Editor recovery는 editor.saveFile과 editor.saveAll을 모두 지원한다. 다중 파일은 제한된 digest/길이 manifest만 저장하고 mismatch면 mutation을 다시 실행하지 않고 unknown으로 남긴다. - TOOLEXECUTIONUNKNOWN 진단 결과는 정제 후 durable record에 보존되어 resolver가 확인할 수 있으며 source text는 저장하지 않는다. - repository CI workflow가 Redis 7과 PostgreSQL 16 service container에서 persistence smoke/integration을 실행하며, GitHub Environment 배포 gate는 이 저장소의 CI/CD 범위에서 의도적으로 제외한다. - 로컬 tarball consumer smoke가 아직 공개되지 않은 tool package를 packed artifact로 설치해 CJS export를 확인하며, registry consumer 검증은 publish workflow ga

Key points:
• durable operation record에 lease 기반 claim/replay/complete/fail/unknown 전이와
• IndexedDB·Redis·PostgreSQL reference backend, 선택적 Redis client bridge,
• Live Code Editor recovery는 `editor.saveFile`과 `editor.saveAll`을 모두 지원한다.
• `TOOL_EXECUTION_UNKNOWN` 진단 결과는 정제 후 durable record에 보존되어
• repository CI workflow가 Redis 7과 PostgreSQL 16 service container에서
• 로컬 tarball consumer smoke가 아직 공개되지 않은 tool package를 packed
• LSP 수준의 정확한 reference 위치, unsaved overlay, CodeAction.
• `@samchon/graph`, `@ttsc/graph` 같은 compiler-resolved graph provider.
• ContextScope 시각화용 renderer/bubble editor. 먼저 직렬화 scope와 결정적 집합
• provider 자체 idempotency 또는 inbox/outbox 계약 없이 provider exactly-once 보장.
• [ ] 수정 전에 소유 package와 기준 문서를 정한다.
• [ ] ownership table이 요구하는 교차 링크 외에는 의미 문서 또는 runbook 한 곳만 수정한다.
• [ ] focused test와 contract/fixture version을 추가한다.
• [ ] 문서가 안정된 뒤 영문/국문과 LLMS artifact를 생성한다.
• [ ] `pnpm docs:management`, package focused check, `pnpm docs:build`를 실행한다.