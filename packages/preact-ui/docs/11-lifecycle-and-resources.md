# 4. 생명주기와 자원

## 4.1 두 수명을 구분한다

```text
Element instance
├─ 공개 입력의 마지막 유효 값
├─ 보존하기로 한 내부 상태
└─ Connection session (0 또는 1개)
   ├─ Preact mount
   ├─ source 연결·effect
   ├─ listener·observer·timer
   └─ 해당 세션의 비동기 작업
```

Element는 disconnected 후 다시 connected될 수 있다. 연결 세션을 끝내는 것과 인스턴스 의미를 영구 종료하는 것은 다르다. 브라우저의 연결 callback은 반복될 수 있으므로 이를 전제로 작성한다. [R0](references.md#r0)

## 4.2 상태별 동작

| 상태 | 입력·읽기 | 렌더링·자원 | 명령 |
|---|---|---|---|
| 생성됐지만 미연결 | 유효 입력 보존, getter 사용 | 외부 구독/DOM 의존 작업 시작 안 함 | 데이터 명령은 개별 계약, DOM 명령은 실패/미실행 결과 |
| 연결 중 | 최신 유효 입력 복원 | 세션 하나 생성·mount | mount 완료 전 호출 정책 명시 |
| 연결됨 | 정상 반영 | 구독과 렌더링 | 공개 계약대로 실행 |
| 연결 해제 | 입력·보존 상태 유지 | UI 자원 종료 | DOM 명령은 실패/미실행 결과 |
| 재연결 | 유지 값 + 최신 외부 snapshot | 새로운 세션 생성 | 성공적인 mount 이후 실행 |

수동 mount가 반환하는 MountInstance는 별도 수명이다. destroy 후 해당 instance.update는 실패하며, 다시 쓰려면 빈 Root에 새로운 instance를 만든다. destroy 자체는 idempotent다.

모든 Custom Element에 영구 destroy 메서드를 강제하지 않는다. 그런 기능이 필요하면 terminal 상태, 향후 setter/명령/재연결 동작을 함께 정의한다. disconnectedCallback에서 borrowed Domain을 destroy하지 않는다.

## 4.3 상태 보존 범위

재연결 시 공개 입력과 인스턴스에 저장한 상태만 기본 보존한다. View의 useState/useSignal, DOM selection, focus, scroll이 mount 해제 후 자동으로 유지된다고 약속하지 않는다. 보존이 필요하면 인스턴스 상태와 복원 계약을 추가한다.

동일 노드를 재배치해도 일반 disconnect/connect 경로를 탈 수 있다. 기본은 이 경로가 안전하도록 만드는 것이다. `moveBefore`/`connectedMoveCallback`은 대상 환경과 이동 방식이 확인될 때 선택적으로 적용하고, 기존 API의 append 이동까지 모두 보존된다고 확대하지 않는다. 문서가 달라지는 adoption에서는 ownerDocument/window에 결합된 자원을 다시 연결한다. [R0](references.md#r0)

## 4.4 생성과 정리 순서

```text
연결: 자원 scope → source 연결 → view input 구성 → mount → observer 시작
해제: 새 작업 차단 → observer 종료 → unmount → source 연결 해제 → scope 종료
```

구체적 순서는 의존 관계의 역순이다. provider를 먼저 등록하고 consumer를 나중에 등록하면 createDisposalScope의 LIFO 해제로 정렬할 수 있다. 각 자원의 단일 cleanup 경로를 정해 중복 해제를 피한다.

원본 모델/dispatcher/source는 빌린 자원이다. 소유한 것은 그 source에 대해 자신이 만든 구독 연결이다. 구독을 종료하는 것과 제공자를 파괴하는 것을 구분한다.

수동 Host는 root를 제거하기 전에 instance.destroy()를 호출한다. mountPreact는 root 자체를 제거하지 않는다. mountTemplate은 위임된 tree를 먼저 해제하고 자신이 복제한 shell만 제거한다.

## 4.5 비동기 작업과 늦은 결과

connection session마다 AbortController 또는 세대 식별자를 두어 종료된 세션의 응답이 새 View를 갱신하지 못하게 한다. 취소 신호를 지원하지 않는 작업에는 세대 확인으로 늦은 적용을 막는다.

취소할 수 있는 것은 세션이 소유한 작업이다. 이미 Domain에 위임된 저장·업무 명령을 컴포넌트가 사라졌다는 이유만으로 취소하지 않는다. 취소 권한과 결과는 의존 command 계약에 따른다.

disconnect 후에는 이전 UI에 대한 DOM 반영이나 사용자 완료 이벤트를 재발행하지 않는다. 업무 결과가 Domain에서 계속 확정되면 재연결 시 최신 snapshot으로 관측한다.

## 4.6 실패 처리

초기 mount 실패는 만들어진 UI 자원을 정리하고 빌린 Host/Domain 상태를 보존한다. 한 cleanup이 실패해도 나머지를 시도하고 오류를 모아 보고한다. cleanup을 호출했다는 사실과 cleanup 성공을 구분한다.

기존 mount의 동기 render/update 실패 처리를 유지한다. 이후 Signal scheduling, effect, event handler, 비동기 작업에서 발생한 모든 오류를 mount 호출의 try/catch가 처리한다고 가정하지 않는다. 오류 경계·명령 rejection·scope cleanup의 책임을 각각 정한다.

공개 오류는 안정적인 오류 범주와 허용된 설명만 포함한다. 내부 stack이나 원본 민감 payload를 모든 CustomEvent에 싣지 않는다. 개발 진단은 별도 경로로 제공한다.
