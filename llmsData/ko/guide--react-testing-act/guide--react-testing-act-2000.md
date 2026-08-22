---
document_id: guide--react-testing-act
category: guide
source_path: ko/guide/react-testing-act.md
character_limit: 2000
last_update: '2026-08-22T10:53:40.864Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
`act`를 활용한 React UI 테스트

act를 활용한 React UI 테스트 이 컨벤션은 React 컴포넌트를 렌더링하는 Context-Action 예제와 애플리케이션 통합에 적용한다. assertion 전에 대기 중인 React 작업을 반영해, 겉으로만 통과하고 업데이트를 남기는 테스트를 막는다. React는 렌더링과 비동기 경계를 넘을 수 있는 상호작용에 await act(async () => { ... }) 형태를 권장한다. React Testing Library의 렌더링·상호작용 helper는 이미 act로 감싸지만, 직접 store를 변경하거나, action을 dispatch하거나, timer·외부 promise를 처리할 때는 명시적인 경계가 필요하다. 자세한 규칙은 공식 React act 문서를 따른다. 필수 테스트 환경 예제 앱은 example/src/test/setup.ts에서 ISREACTACTENVIRONMENT를 설정하고 실제 미완료 업데이트를 뜻하는 “not wrapped in act” diagnostic을 테스트 실패로 바꾼다. 새 React 예제의 테스트 설정에도 같은 보호 장치를 둔다. 전역 console.error mock으로 React act 경고를 숨기지 않는다. 테스트의 경계를 고쳐야 한다. 의도적으로 오류 경로를 검증할 때만 좁은 범위의 spy를 만들고 그 오류를 명시적으로 assertion한다. 작업별 경계 선택 | 테스트 대상 | 컨벤션 | | --- | --- | | 순수 business rule 또는 schema | act 없이 함수를 직접 테스트한다. | | React Testing Library의 render, userEvent, findBy, waitFor | helper를 그대로 사용하고 비동기 helper는 모두 await한다. | | 렌더된 컴포넌트에 영향을 주는 직접 Context-Action store 변경 또는 action dispatch | 변경과 그 promise를 await act(async () => { ... })로 감싼다. | | timer,

Key points:
• React `act` diagnostic이나 uncaught browser error 없이 렌더링된다.
• 주요 키보드·포인터·dispatch 상호작용 하나가 보이는 UI를 변경한다.
• 비동기 완료 또는 오류 상태 하나를 관찰할 수 있다.
• cleanup 뒤 pending timer, subscription, request가 남지 않는다.