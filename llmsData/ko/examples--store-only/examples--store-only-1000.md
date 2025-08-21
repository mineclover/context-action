---
document_id: examples--store-only
category: examples
source_path: ko/examples/store-only.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.393Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Store Only 패턴 예제

순수 상태 관리를 위한 Store Only 패턴의 실제 사용 예제입니다. 액션 디스패치 없이 데이터 레이어, 애플리케이션 상태, 반응형 데이터 플로우에 이상적인 패턴입니다. 사용 사례

- 애플리케이션 상태 관리
- 폼 상태 및 UI 상태
- 데이터 캐싱 및 지속성
- 파생 상태 및 계산된 값
- 컴포넌트 레벨 상태 관리

완전한 예제

1. 스토어 설정 정의

2. 스토어 패턴 생성

3. 프로필 관리 컴포넌트

4. 설정 컴포넌트

5. 애널리틱스 대시보드

6. 연락처 폼 컴포넌트

7. HOC 패턴을 사용한 메인 애플리케이션

고급 스토어 패턴

상태 지속성

계산된 상태 컴포넌트

실제 통합

폼 검증 패턴

서버 동기화

주요 특징

✅ 타입 안전성: 수동 타입 주석 없이 자동 타입 추론  
✅ 반응형 업데이트: 상태 변경 시 컴포넌트 자동 재렌더링  
✅ 파생 상태: 기본 상태가 변경될 때 계산된 속성 자동 업데이트  
✅ 검증: 커스텀 검증 함수가 있는 내장 검증 지원  
✅ HOC 패턴: withProvider()를 사용한 깔끔한 프로바이더 통합  
✅ 스토어 매니저: 재설정, 내보내기, 벌크 작업을 위한 중앙화된 관리

베스트 프랙티스

1. 직접 값: 단순한 타입에는 직접 값 설정 사용
2. 설정 객체: 복잡한 검증과 파생 상태에 사용
3. HOC 패턴: 자동 프로바이더 감싸기를 위해 withProvider() 선호
4. 반응형 구독: 컴포넌트 업데이트를 위해 항상 useStoreValue() 사용
5. 벌크 작업: 재설정과 벌크 작업에 스토어 매니저 사용
6. 상태 구조: 관련된 상태를 논리적 그룹으로 함께 유지

관련 자료

- Action Only 패턴 - 순수 액션 디스패치 패턴
- 패턴 조합 - Action 패턴과 결합하기
- 기본 설정 - 두 패턴을 모두 사용한 기본 설정.
