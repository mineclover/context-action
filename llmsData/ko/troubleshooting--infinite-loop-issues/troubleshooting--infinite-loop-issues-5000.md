---
document_id: troubleshooting--infinite-loop-issues
category: troubleshooting
source_path: ko/troubleshooting/infinite-loop-issues.md
character_limit: 5000
last_update: '2026-11-21T03:32:50.157Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
무한 루프 문제 해결

무한 루프 문제 해결 Context-Action 프레임워크에서 발생할 수 있는 대표적인 무한 루프 원인과 해결 패턴을 정리합니다. 🔄 개요 무한 루프는 상태 관리 시스템에서 가장 치명적인 장애 중 하나이며, 주로 액션 디스패치, 상태 업데이트, 사이드 이펙트 간의 순환 의존성 때문에 발생합니다. 이 문서에서는 주요 무한 루프 패턴과 예방 전략을 다룹니다. 🚨 ActionLogger + onDataChanged 순환 루프 문제 상황 증상: - 연속적인 사용자 인터랙션 직후 애플리케이션이 멈춤 - 콘솔에 동일한 액션 디스패치가 끝없이 출력됨 - 스택 오버플로 오류 또는 브라우저 응답 없음 상태 발생 - 메모리 사용량이 계속 증가함 원인 분석 하위 컴포넌트가 onDataChanged 액션을 디스패치할 때 상위 핸들러가 actionLogger.logAction()을 호출하면 순환 고리가 만들어집니다: 문제가 되는 코드 패턴 해결책 1: 단순 콘솔 로깅으로 분리 onDataChanged 핸들러 내부에서는 actionLogger 대신 순수 콘솔 출력이나 Store 직접 기록을 사용합니다: 해결책 2: LogMonitor 직접 연동 (권장) 범용 onDataChanged 중계 대신 LogMonitor의 전용 액션 인터페이스를 직접 호출합니다: 🍞 토스트 시스템 무한 루프 문제 상황 증상: - maxToasts 한도에 도달하는 순간 애플리케이션이 정지함 - 개발 환경에서 HMR/렌더링이 연속으로 재실행됨 - 45회 연속 액션 후 브라우저가 응답하지 않음 원인 분석 최대 개수 제한에 도달해 오래된 토스트를 제거하려고 removeToast 액션을 디스패치할 때, 토스트 추적 시스템이 그 제거 액션까지 감시해 새 토스트를 생성하면 루프가 형성됩니다: 해결책: 내부 정리는 Store 직접 업데이트 사용 예방 전략: 추적 대상에서 정리 액션 제외 ⚙️ 액션 핸들러 재등록 루프 문제 상황 렌더링마다 핸들러가 해제되고 다시 등록되면서 성능 저하 및 상태 불일치가 발생합니다. 원인 매 렌더링마다 바뀌는 값들이 useCallback / useEffect 의존성 배열에 포함되어 있습니다: 해결책: useActionHandler 또는 Ref 패턴으로 안정적 참조 유지 createActionContext가 제공하는 useActionHandler는 내부적으로 최신 핸들러를 ref에 보관하여 불필요한 재등록을 막습니다. 직접 수동 register를 쓰는 경우에도 ref를 통해 안정적인 콜백을 유지해야 합니다: ⏱️ 타이머 연쇄(Cascade) 루프 문제 상황 액션이 실행될 때마다 해제되지 않은 타이머가 누적되어 연쇄적인 부작용을 유발합니다. 해결책: 중앙 집중식 타이머 정리 🔄 Store 업데이트 루프 문제 상황 Store 구독 콜백이 같은 Store를 다시 갱신하는 액션을 무조건 디스패치하면 무한 루프에 빠집니다. 해결책: 상태 전이 조건 확인 및 플래그 초기화 🛡️ 예방 원칙 및 체크리스트 설계 원칙 1. 단방향 데이터 흐름: Action → Handler → Store 업데이트 → UI 반영 2. 순환 디스패치 금지: 핸들러 내부에서 자기 자신을 다시 깨우는 액션을 직접·간접으로 발행하지 않기 3. 내부 상태는 Store 직접 갱신: 로깅·토스트 정리 같은 부수 상태는 추적 파이프라인 밖에서 처리 4. 액션 필터링: 삭제/정리용 내부 액션은 추적 시스템에서 명시적으로 제외 코드 리뷰 체크리스트 - [ ] 순환적으로 다른 액션을 발행하는 핸들러가 없는가? - [ ] 토스트/로깅 시스템이 자신의 정리 액션을 다시 추적하지 않는가? - [ ] Store 구독 콜백이 동일한 Store를 무조건 재갱신하지 않는가? - [ ] 모든 setTimeout / setInterval이 정리(cleanup) 경로를 갖고 있는가? - [ ] 수동 등록 핸들러가 렌더링마다 재등록되지 않는가? 📚 관련 문서 - 성능 및 무한 루프 문제 - 메모리 관리, 리렌더 최적화, 성능 점검 - 액션 시스템 문제 - 액션 핸들러 상태 접근 및 등록 모범 사례 - 스토어 및 상태 문제 - Store 구독 및 불변성 관련 문제 해결

Key points:
• 연속적인 사용자 인터랙션 직후 애플리케이션이 멈춤
• 콘솔에 동일한 액션 디스패치가 끝없이 출력됨
• 스택 오버플로 오류 또는 브라우저 응답 없음 상태 발생
• 메모리 사용량이 계속 증가함
• `maxToasts` 한도에 도달하는 순간 애플리케이션이 정지함
• 개발 환경에서 HMR/렌더링이 연속으로 재실행됨
• 4~5회 연속 액션 후 브라우저가 응답하지 않음
• [ ] 순환적으로 다른 액션을 발행하는 핸들러가 없는가?
• [ ] 토스트/로깅 시스템이 자신의 정리 액션을 다시 추적하지 않는가?
• [ ] Store 구독 콜백이 동일한 Store를 무조건 재갱신하지 않는가?
• [ ] 모든 `setTimeout` / `setInterval`이 정리(cleanup) 경로를 갖고 있는가?
• [ ] 수동 등록 핸들러가 렌더링마다 재등록되지 않는가?
• [성능 및 무한 루프 문제](./performance-issues.md) - 메모리 관리, 리렌더 최적화, 성능 점검
• [액션 시스템 문제](./action-issues.md) - 액션 핸들러 상태 접근 및 등록 모범 사례
• [스토어 및 상태 문제](./store-issues.md) - Store 구독 및 불변성 관련 문제 해결
• 하위 컴포넌트가 onDataChanged 디스패치 → 상위 핸들러 실행
• 상위 핸들러가 actionLogger.logAction() 호출 → 내부적으로 addLog() 실행
• addLog()가 LogMonitor 상태를 변경 → 추가 액션 디스패치를 유발할 수 있음
• 추가 액션이 다시 onDataChanged 이벤트를 발생시킴 → 1단계로 회귀...
• 새 토스트 추가 → currentToasts.length >= maxToasts
• removeToast 액션 디스패치 → setupSelectiveActionToast가 이를 감지
• "removeToast 시작됨" 토스트 생성 → 다시 maxToasts 초과
• 또 다른 removeToast 디스패치 → 2단계로 회귀...
• **단방향 데이터 흐름**: Action → Handler → Store 업데이트 → UI 반영
• **순환 디스패치 금지**: 핸들러 내부에서 자기 자신을 다시 깨우는 액션을 직접·간접으로 발행하지 않기
• **내부 상태는 Store 직접 갱신**: 로깅·토스트 정리 같은 부수 상태는 추적 파이프라인 밖에서 처리
• **액션 필터링**: 삭제/정리용 내부 액션은 추적 시스템에서 명시적으로 제외