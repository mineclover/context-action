---
document_id: guide--register-delegation
category: guide
source_path: ko/guide/patterns/action/register-delegation.md
character_limit: 500
last_update: '2025-08-26T00:34:27.374Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
등록 위임 패턴

외부 함수와 useActionRegister() 훅을 사용해 별도 모듈에서 액션 핸들러를 구성하는 고급 패턴입니다. Import

기능
- ✅ 모듈식 핸들러 구성
- ✅ 외부 함수 위임
- ✅ 팀 기반 개발 지원
- ✅ 플러그인 아키텍처 활성화
- ✅ 정리 관리

필수 조건

🎯 스펙 재사용: 타입 정의, 컨텍스트 생성, 프로바이더 구성을 포함한 완전한 설정 지침은 기본 액션 설정을 참조하세요. 📖 이 문서의 모든 예제는 아래 설정 스펙을 재사용합니다:
- 🎯 액션 타입 → EventActions 패턴
- 🎯 컨텍스트 생성 → 단일 도메인 컨텍스트
- 🎯 프로바이더 설정 → 단일 프로바이더 설정

💡 일관된 학습: 설정 가이드를 먼저 읽으면 이 문서의 모든 예제를 즉시 이해할 수 있습니다. 개요

등록 위임은 핸들러 로직을 외부 모듈로 분리하여 모듈식 핸들러 구성을 가능하게 합니다.
