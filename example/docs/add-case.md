# sync fetch loading


- **비동기 연산 → store 업데이트 → notify → useSyncExternalStore 로 UI 업데이트** 구조
- " 로딩/에러 " 상태 관리, 병렬렌더 최적화, React 의 Suspense/Concurrent rendering 에서 처리하는 방식과 유사하게, state를 관리하고 폴백 UI로 대체하는 시나리오
- 이 방식은 전통적 Redux/Flux 스타일의 "store → notify → subscribe/render" 패턴과 거의 유사


# state store Registry , action registry 를 전부 활용하되 state 자체는 간단한 문자열로 구현 한 예시

view state store랑 action register 에 dispatch, 로 사용할 actions를 미리 정의하고
hooks 안에서 view , action 호출하는 훅을 data view 와 view trigger 컴포넌트 별로 따로 hooks 만든 후 조합해서 서비스 만들기



# state Registry , action registry 를 전부 활용하고 state 값을 객체로 구현 한 예시

view state store랑 action register 에 dispatch, 로 사용할 actions를 미리 정의하고
hooks 안에서 view , action 호출하는 훅을 data view 와 view trigger 컴포넌트 별로 따로 hooks 만든 후 조합해서 서비스 만들기

# registry 를 use hook 안에서 생성해서 컨텍스트 갯수만큼 늘어나는 예시


# registry 를 코드 모듈 단위에서 생성해서 코드 내에서 싱글톤으로 관리되는 예시


# action registry 에 넣을 때 우선순위 경합 시키는 예시

- 같은 우선순위로 넣을 때 어떻게 동작하는가에 대한 테스트임



# pipeline에 대한 기능들을 테스트 하는 예시

## 검증 로직으로써 넣는 방식으로 통과하지 못하면 다음 로직이 실행되지 않게 block 는 기능

## 특정 우선 순위로 이동

## payload 값을 수정

## 위에 행동들을 조건을 걸고 실행


# dispatch에서 실행 유형 결정하는 예시

- 병렬 : 동시 처리
- race : 모든 등록 콜백, 또는 같은 우선 순위(로직 상 안되면 우선 순위 값의 특정 범위) 코드를 한번에 실행하고 가장 먼저 도달하는 1개만 처리 ( 이 경우 내부적으로 사이드 이펙트가 없어야 하고 결과가 반영될 end callback이 따로 있어야 한다 )
- 순차처리 : 우선순위 순서대로 처리

