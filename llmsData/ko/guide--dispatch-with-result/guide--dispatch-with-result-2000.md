---
document_id: guide--dispatch-with-result
category: guide
source_path: ko/guide/patterns/action/dispatch-with-result.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.356Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
결과와 함께 디스패치 패턴

Context-Action 프레임워크를 위한 고급 결과 수집 및 처리 패턴입니다. 필수 조건

타입 정의, 컨텍스트 생성, 프로바이더 구성을 포함한 완전한 설정 지침은 기본 액션 설정을 참조하세요. 이 문서는 설정 가이드의 다음 패턴을 사용합니다:
- 타입 정의 → 이벤트 액션 패턴  
- 컨텍스트 생성 → 단일 도메인 컨텍스트
- 프로바이더 설정 → 단일 프로바이더 설정

사용된 설정 컨텍스트 훅

기본 결과 수집

액션 디스패치에서 실행 결과와 메타데이터를 수집합니다. 결과 수집 전략

병합 전략

배열 전략

커스텀 전략

실행 메타데이터

자세한 실행 정보에 액세스합니다. 기본 메타데이터

핸들러 레벨 메타데이터

성능 모니터링

타이밍 분석

성공률 추적

비즈니스 로직 패턴

검증 파이프라인

데이터 처리 파이프라인

집계 패턴

에러 결과 처리

부분 성공 처리

결과와 함께 재시도

관련 패턴

- 디스패치 패턴 - 기본 디스패칭 패턴
- 등록 패턴 - 핸들러 등록 패턴
- 타입 시스템 - TypeScript 통합
- 액션 기본 사용법 - 기본 패턴.
