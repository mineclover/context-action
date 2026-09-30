# 연결 흐름 예시

## Web Component

```text
Host: element.items / element.selectedId / element.disabled
    → shell: parse·validate·normalize
    → controller: 유효 snapshot 보관
    → View: props 또는 읽기용 Signal binding
    → Preact: 위임된 DOM 갱신

사용자: 항목 실행
    → View.onRequestSelect(id)
    → controller: 현재 disabled/항목 존재/동일 선택 재확인
    → shell: selection-request 발행
    → Host: Domain 선택 command
    → Domain: 승인 후 상태 확정
    → Host: element.selectedId 입력
```

controller 재확인은 View의 과거 render snapshot만 믿지 않기 위해 필요하다. 프로그램 반영 경로가 다시 요청 이벤트를 발생시키지 않는다.

## Template island

```text
Host: template clone / 빈 root
    → mountPreact(root, LayerPanelView, viewInput)
    → instance.update(새로운 전체 viewInput)
    → 종료 시 instance.destroy()
```

mountPreact와 update는 작성자만 사용한다. 최종 소비자에게는 items/selectedId 입력과 selection 요청 callback 등 같은 의미의 facade를 제공한다. template helper를 사용하는 경우 정확히 하나의 빈 data-preact-root라는 기존 제약을 유지한다.

## Source/Signals binding을 추가하는 경우

```text
연결 세션
    → connectSourceSignal(외부 ReadableSource)
    → 내부 binding View가 connection.signal.value를 읽음
    → 일반 LayerPanelView props로 투영
    → disconnect: View unmount → connection.dispose()
```

Source 읽기를 연결했으면 같은 정본에 property 입력까지 무조정으로 병렬 연결하지 않는다. 주입형 component로 만들지, Host가 값을 입력하는 component로 만들지 공개 계약에서 결정한다. UI 요청의 Domain command 실행 경로도 한 곳만 둔다.

Signals binding은 내부 작성 방법의 선택이다. 이것을 도입해도 외부 property가 Signal 타입이 되거나 소비자가 .value를 직접 쓰는 API로 바뀌지는 않는다.
