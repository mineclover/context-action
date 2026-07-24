---
document_id: guide--patterns--action--dispatch-access
category: guide
source_path: ko/guide/patterns/action/dispatch-access.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.406Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
디스패치 접근 패턴

디스패치 접근 패턴 Context-Action 프레임워크에서 액션 디스패치 기능에 접근하는 두 가지 주요 방법: 등록 기반 접근과 훅 기반 접근입니다. Import 필수 조건 타입 정의, 컨텍스트 생성, 프로바이더 구성을 포함한 완전한 설정 지침은 기본 액션 설정을 참조하세요. 이 문서는 설정 가이드의 AppActions 패턴을 사용합니다: - 타입 정의 → 확장 액션 인터페이스 - 컨텍스트 생성 → 단일 도메인 컨텍스트 - 프로바이더 설정 → 단일 프로바이더 설정 예제들은 다음과 같이 구성된 컨텍스트가 있다고 가정합니다: 훅 기반 디스패치 (권장) React 애플리케이션에서 컴포넌트 내 디스패치 기능에 액세스하기 위해 createActionContext의 React 훅을 사용하세요. 이것이 React 애플리케이션에서 권장되는 방법입니다. 기본 훅 사용법 결과 수집이 있는 훅 완전한 컴포넌트 구현 등록 기반 디스패치 React 애플리케이션 내에서 고급 사용 사례를 위해 React 컨텍스트를 통해 ActionRegister 인스턴스에 액세스합니다. 등록 접근을 사용한 고급 디스패치 등록 접근을 사용한 React 통합 필요할 때 React 컴포넌트 내에서 기본 등록 인스턴스에 액세스합니다. 컨텍스트 생성 useActionRegister 훅 사용 등록 정보 접근 비교: 훅 vs 등록 훅 기반 디스패치 (권장) 장점: - 자동 컨텍스트 관리를 갖춘 React에 최적화 - 보일러플레이트가 적은 더 깔끔한 컴포넌트 코드 - 자동 프로바이더 의존성 주입 - 우수한 TypeScript 통합으로 타입 안전 - React 패턴과 규칙을 따름 단점: - React 전용, React 컴포넌트 외부에서 사용 불가 - 고급 디스패치 옵션에 대한 제어 제한 - React 컨텍스트 설정 필요 사용 사례: - 표준 React 컴포넌트 상호작용 - 폼 제출 및 사용자 이벤트 - 컴포넌트 레벨 비즈니스 로직 - 대부분의 React 애플리케이션 시나리오 등록 기반 디스패치 장점:

Key points:
• 타입 정의 → [확장 액션 인터페이스](../setup/basic-action-setup.md#extended-action-interface)
• 컨텍스트 생성 → [단일 도메인 컨텍스트](../setup/basic-action-setup.md#single-domain-context)
• 프로바이더 설정 → [단일 프로바이더 설정](../setup/basic-action-setup.md#single-provider-setup)
• 자동 컨텍스트 관리를 갖춘 React에 최적화
• 보일러플레이트가 적은 더 깔끔한 컴포넌트 코드
• 자동 프로바이더 의존성 주입
• 우수한 TypeScript 통합으로 타입 안전
• React 패턴과 규칙을 따름
• React 전용, React 컴포넌트 외부에서 사용 불가
• 고급 디스패치 옵션에 대한 제어 제한
• React 컨텍스트 설정 필요
• 표준 React 컴포넌트 상호작용
• 폼 제출 및 사용자 이벤트
• 컴포넌트 레벨 비즈니스 로직
• 대부분의 React 애플리케이션 시나리오
• 프레임워크에 구애받지 않음, 모든 JavaScript 환경에서 작동