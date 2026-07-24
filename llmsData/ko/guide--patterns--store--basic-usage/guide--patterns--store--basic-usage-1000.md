---
document_id: guide--patterns--store--basic-usage
category: guide
source_path: ko/guide/patterns/store/basic-usage.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.411Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
스토어 기본 사용법

스토어 기본 사용법 뛰어난 타입 추론과 간단한 API를 제공하는 기본 스토어 전용 패턴. 가져오기 주요 기능 - ✅ 수동 타입 어노테이션 없이 뛰어난 타입 추론 - ✅ 스토어 관리에 집중된 간단한 API - ✅ 직접 값 또는 설정 객체 지원 - ✅ 별도의 createStore 호출 불필요 사전 요구사항 스토어 정의, 컨텍스트 생성, 프로바이더 설정을 포함한 완전한 설정 지침은 기본 스토어 설정 을 참조하세요. 이 문서는 스토어 설정을 사용한 사용 패턴을 보여줍니다: - 스토어 정의 → 타입 추론 설정 - 컨텍스트 생성 → 단일 도메인 스토어 컨텍스트 - 프로바이더 설정 → 단일 프로바이더 설정 사용 패턴 기본 스토어 접근 패턴 명시적 제네릭 타입 패턴 프로바이더 설정 컴포넌트 사용법 사용 가능한 훅 -

Key points:
• ✅ 수동 타입 어노테이션 없이 뛰어난 타입 추론
• ✅ 스토어 관리에 집중된 간단한 API
• ✅ 직접 값 또는 설정 객체 지원
• ✅ 별도의 `createStore` 호출 불필요
• 스토어 정의 → [타입 추론 설정](../setup/basic-store-setup.md#type-inference-configurations)
• 컨텍스트 생성 → [단일 도메인 스토어...