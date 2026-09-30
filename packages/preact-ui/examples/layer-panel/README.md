# Layer Panel reference component

이 예제는 하나의 외부 계약을 template island와 Custom Element에 재사용하는 작성 패턴을 보여준다. `internal/controller.ts`는 Preact와 DOM을 모르는 입력 검증·snapshot 정본이며, `internal/session.ts`는 연결 세션의 mount·구독·focus ref를 소유한다. View는 작성자용 props만 받고, host adapter는 `selection-request`만 발행한다.

```text
public contract → controller → connection session → View → delegated root
```

`selectedId`는 외부/Domain이 확정한다. 사용자가 다른 항목을 실행하면 `selection-request`가 한 번 발생하고, controller가 먼저 선택을 변경하지 않는다. Host가 승인한 뒤 `selectedId`를 다시 입력해야 표시가 바뀐다.

이 예제는 공통 factory가 컴포넌트 의미를 추론하지 않아도 되는 범용 컨벤션을 검증하기 위한 reference fixture다.
