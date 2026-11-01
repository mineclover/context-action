---
document_id: context-layered--interaction-intent-contract
category: context-layered
source_path: ko/context-layered/interaction-intent-contract.md
character_limit: 5000
last_update: '2026-11-01T11:30:48.926Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
상호작용 의도 계약(IIC) 컨벤션

상호작용 의도 계약(IIC) 컨벤션 상태: Active 최근 검토: 2026-11-01 범위: interactive example, 공개 UI, 데모, workflow view 이 컨벤션에서 말하는 접근성은 스크린 리더 대응만을 뜻하지 않습니다. 디자인을 만든 사람이 아니어도 왜 버튼이나 설명을 줄였는지, 어떤 직관적 반응을 약속했는지, 그 선택을 어떻게 되돌리고 검증하는지 다시 이해할 수 있어야 한다는 뜻입니다. 이를 설계 접근성으로 부릅니다. 화면 기술 접근성(키보드, 스크린 리더, 대비 등)은 필요할 때 같은 기록의 후속 검증으로 연결하되, UX 의도와 혼동하지 않습니다. 사용할 때 다음 중 하나라도 추가하거나 변경하면 사용합니다. - 자동 실행, live update, debounce, background feedback - 새 control, 상태, 오류, reset, recovery 경로 - 버튼·설명·확인 단계처럼 기존 affordance를 제거하거나 축약하는 선택 - 사용자가 서로 다르게 해석할 수 있는 시각 상태 - 확인 단계를 줄이는 대신 발견 가능성이 낮아지는 UX 선택 단순한 시각 변경은 별도 기록이 없어도 되지만, 소유 specification이나 PR에 영향을 받는 설계 의도와 기술 접근성 불변 조건은 남깁니다. 문서 부담을 조절하기 위해 영향도를 나눕니다. - Lite IIC: 로컬·가역적이고 외부 저장이나 비용 있는 effect가 없는 변경 - Full IIC: 자동 실행, 비동기·비용 있는 작업, persistence, 외부 effect, 파괴적 동작, 또는 복구·rollback이 필요한 변경 Full IIC는 pending, failure, cancel, rollback 기준까지 기록합니다. 암묵적 합의 기록 암묵적 합의는 구현을 읽지 않아도 사용자가 예상해야 하는 동작입니다. 예를 들어 “checkbox를 바꾸면 실험이 실행된다”, “최신 결과가 기준이다”, “reset은 재현 가능한 실패 상태로 돌아간다”가 있습니다. 버튼이나 설명을 제거해 사용자의 추론에 의존하게 만드는 경우에는 구현 전에 기록합니다. feature specification, decision record, 또는 PR 본문에 다음 형식을 사용합니다. 리뷰어가 왜 이 단축이 필요한지, 무엇을 제거했는지, 무엇이 대체 신호인지, 어떤 상태를 기준으로 삼는지, 잘못 이해했을 때 어떻게 복구하는지를 답할 수 있어야 기록이 완료됩니다. 화면 기술 접근성을 적용하는 기능이라면 키보드와 보조기술 사용자가 같은 변화를 어떻게 발견하는지도 후속 검증에 포함합니다. 설계 규칙 1. UX 단축은 의도를 드러내고 복구 가능하게 만든다 자동 동작은 트리거 가까이에 의도와 결과를 둡니다. 어떤 버튼이나 설명을 제거했는지, 그 대신 무엇으로 발견 가능성을 보장하는지 씁니다. 이미 자동으로 실행되는 동작을 반복하기 위한 submit 또는 confirm을 추가하지 않습니다. 비용이 크거나 비동기이거나 파괴적인 작업은 debounce, cancel, pending, failure 상태를 함께 정의합니다. “즉시”는 사용자 관점에서 상호작용 계약이 즉시라는 뜻이며, 모든 key 입력이 제한 없이 네트워크 요청을 시작한다는 뜻은 아닙니다. 2. 상태 변경마다 알림 출처를 하나만 둔다 같은 결과를 control 상태, result panel, toast에서 모두 읽어주지 않습니다. 간단한 상태 변경은 하나의 live region으로 알리고, 자세한 내용은 결과 화면에 둡니다. live region은 polite 또는 assertive와 갱신 조건을 명시합니다. 입력 빈도가 높은 control은 매 글자마다 긴 알림을 내지 않습니다. 완료, 오류, 또는 의미 있는 임계값만 알립니다. 3. 화면 기술 접근성은 별도 계약으로 검증한다 가능하면 ARIA role보다 native button, input, label, fieldset, legend, output을 사용합니다. 모든 control에는 accessible name과 보이는 label이 있어야 합니다. 시각적 toggle은 native value 또는 적절한 ARIA 상태로 같은 상태를 노출합니다. 4. 비포인터 경로를 동등하게 보장한다 모든 pointer 동작에는 keyboard 경로가 있어야 합니다. drag, hover, 색상, timing만 으로 현재 상태를 발견하게 하지 않습니다. focus는 보이게 유지하고, 계약상 필요할 때만 자동 이동합니다. 자동 focus에는 이유와 복구 경로를 기록합니다. 5. 상태를 색상만으로 표현하지 않는다 색상과 함께 텍스트, label, accessible name이 있는 icon, 또는 구조를 사용합니다. 오류·경고·대기·성공·변경 없음 상태는 monochrome과 high contrast에서도 이해되어야 합니다. 6. 사용자 요약과 진단 증거를 분리한다 주 화면은 사용자 언어로 결과를 설명합니다. raw JSON, operation name, trace, test identifier는 개발자용 surface로 명확히 표시합니다. 외부 테스트나 자동화가 소비하는 machine-readable key는 안정적으로 유지합니다. 7. reset과 recovery를 명시한다 control이 시나리오를 바꾸면 기본 상태를 문서화하고 reset 또는 cancel 경로를 제공합니다. reset은 보이는 control과 실제 source of truth를 함께 복구해야 합니다. 리뷰 체크리스트 - [ ] 설계 의도와 암묵적 합의를 한 문장으로 쓰고 소유자를 정했다. - [ ] 제거·축약한 affordance와 대체 신호를 기록했다.

Key points:
• 자동 실행, live update, debounce, background feedback
• 새 control, 상태, 오류, reset, recovery 경로
• 버튼·설명·확인 단계처럼 기존 affordance를 제거하거나 축약하는 선택
• 사용자가 서로 다르게 해석할 수 있는 시각 상태
• 확인 단계를 줄이는 대신 발견 가능성이 낮아지는 UX 선택
• **Lite IIC:** 로컬·가역적이고 외부 저장이나 비용 있는 effect가 없는 변경
• **Full IIC:** 자동 실행, 비동기·비용 있는 작업, persistence, 외부 effect,
• 다른 구현자가 재현해야 하는 핵심 논리:
• 문서·UI·테스트에서 유지해야 하는 문장:
• semantic control과 accessible name:
• keyboard와 비포인터 경로:
• focus 동작:
• 상태/값/오류 알림:
• 색상·모션·대비·텍스트 대체:
• UX 이점:
• 접근성 위험:
• 선택한 해결:
• 배제한 대안과 이유:
• 구현 anchor:
• 동작 테스트:
• 처음 보는 사용자의 trigger·복구 설명 시나리오:
• 접근성 또는 keyboard 테스트:
• 필요 시 수동 시나리오/스크린샷:
• 문서 링크:
• [ ] 설계 의도와 암묵적 합의를 한 문장으로 쓰고 소유자를 정했다.
• [ ] 제거·축약한 affordance와 대체 신호를 기록했다.
• [ ] 처음 보는 사용자가 놓칠 수 있는 발견 가능성 위험을 기록했다.
• [ ] 트리거, 결과, source of truth, reset/recovery를 이름 붙였다.
• [ ] semantic source of truth와 runtime owner를 분리했다.
• [ ] status, owner, reviewer, review due, impact, reversibility를 기록했다.
• [ ] supersedes/supersededBy와 migration 영향을 확인했다.
• [ ] 발생하면 안 되는 동작과 rollback 기준을 기록했다.
• [ ] 주 control이 native semantic, visible label, keyboard 경로를 갖는다.
• [ ] focus 동작이 의도적이고 계속 보인다.
• [ ] live region의 범위와 politeness가 명시됐고 중복 알림을 제거했다.
• [ ] 상태 의미가 색상·hover·motion·pointer 정밀도에만 의존하지 않는다.
• [ ] UX 속도/편의의 이점과 설계 접근성 위험을 기록했다.
• [ ] 기본 상태와 변경 상태 하나 이상을 동작 테스트로 고정했다.
• [ ] 같은 경로의 keyboard 또는 접근성 검증을 남겼다.
• [ ] 사용자 문서와 raw diagnostic evidence를 따로 연결했다.
• [ ] 구현이 IIC와 다르면 코드보다 IIC를 먼저 갱신했다.
• **사용자 목표:** 거부 조건을 바꿔 fallback과 native 상태 차이를 즉시 비교한다.
• **상태:** implemented · **impact:** lite · **reversibility:** fully reversible
• **owner/reviewer:** Lit UI maintainers · **reviewDue:** 다음 release review
• **암묵적 합의:** 입력이나 체크를 바꾸면 현재 설정으로 실험이 다시 실행된다.
• **semantic source of truth:** 실험 결과 카드와 원시 JSON · **runtime owner:** probe element state