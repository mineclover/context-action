# 5. 검증과 변경 관리

## 5.1 정본을 역할로 분리한다

공통 컨벤션은 모든 컴포넌트가 따라야 할 경계·수명·공개 규칙을 관리한다. 개별 component.contract.md는 그 컴포넌트의 구체적인 입력·결과·시점·실패를 관리한다. public.ts는 타입 구조를 관리한다. 구현은 동작을 실현하고 테스트는 계약에 대한 실제 관측을 기록한다.

한 문서의 내용을 모든 파일에 복사하지 않는다. 예제와 generated declaration은 계약을 설명하거나 투영하는 자료이며 새로운 의미를 자동 승인하지 않는다. 문서·타입·구현이 충돌하면 영향과 원본 위치를 기록하고 합의된 기준에 맞춰 수정한다.

## 5.2 계약 중심 검증

| 검증 범주 | 최소 확인 |
|---|---|
| 공개 API | 소비자 entry에 VNode/writable Signal/내부 controller·selector 의존이 없는가 |
| 입력 | 기본값, 제거, 잘못된 타입·범위, 동일 값, pre-upgrade property |
| 권한 | 외부 제어형은 요청만 발생하는가, 승인 전 정본이 변하지 않는가 |
| 이벤트 | payload·발생 시점·전파·중복·프로그램 입력 echo 방지 |
| 수명 | 연결/해제 반복, 입력 보존, 구독 하나, borrowed 자원 보존 |
| 소유권 | Root/기존 sibling/slot 콘텐츠 보존, 중첩 제한, owner 내부 ref 사용 |
| 비동기 | 해제·재연결 후 늦은 결과 무시, 취소 권한 범위 |
| 접근성 | 키보드, 이름, focus, disabled, 공개 role과 실제 동작 |
| 배포 | ESM/CJS/선언, DOM 없는 import, 명시적 등록, tag 충돌 |

상태/명령 adapter의 작성자 entry에는 ReadonlySignal과 Preact 타입이 합법적으로 존재할 수 있다. 소비자용 entry 검사를 패키지 전체로 무차별 확장하지 않는다.

## 5.3 검증 수준을 구분한다

정적 검사: 타입·export·import·문서 링크·계약 누락을 확인한다.

단위/통합 검사: Controller 상태 전이, reflection guard, 요청과 확정 분리, cleanup 순서를 확인한다. 현재 Layer Panel 계약 테스트는 `../test/layer-panel.test.tsx`, SSR/hydration 계약 테스트는 `../test/ssr.test.tsx`에 있다.

실제 브라우저 검사: Shadow DOM, Custom Element upgrade/reconnect, slot, event path, focus, keyboard, accessible role/name, 외부 framework host 통합을 확인한다. 현재 Layer Panel과 vanilla standalone 검증은 `../test/browser-contract.test.mjs`에 있다. NodeDouble/jsdom 성공을 실제 브라우저 검증이라고 보고하지 않는다.

성능 검사: 대표적인 입력 빈도·데이터 크기·DOM 갱신 범위를 측정한다. Signals를 썼다는 사실을 성능 통과 증거로 쓰지 않는다.

접근성 검사는 대상 browser/보조기술 조합을 기록한다. ARIA 작성 예제만으로 제품의 접근성 검증이 끝난 것은 아니다. [R8](references.md#r8)

## 5.4 변경 영향

공개 property 이름뿐 아니라 기본값, parsing, event 의미·전파·시점, DOM 완료 의미, disconnect 보존 정책, CSS 변수/part/slot, focus/keyboard도 계약 변경 대상이다.

내부 라이브러리·Signals 분할·View 폴더 구조의 변경은 허용 범위 안에서 작성자가 판단한다. 다만 그 결과가 공개 타이밍이나 스타일 계약을 바꾸면 내부 수정만으로 취급하지 않는다.

```text
변경 제안 → 영향받는 계약 식별 → 타입·문서·구현 정렬
         → 계약/브라우저 검증 → 검토 → 기존 release 정책에 따른 반영
```

예제 수정·문서 통합·이 묶음의 저장은 승인이나 release를 의미하지 않는다. 기존 lockfile·package boundary·release gate를 완화하지 않는다.

## 5.5 컴포넌트 관리 원칙

이름이 같은 component, event, source라도 역할이나 버전이 다르면 같은 항목으로 합치지 않는다. 계약 문서 경로와 해당 revision/commit, 실제 export 경로, 테스트 위치로 추적한다. 새 API를 기존 counter의 과거 동작에 소급 적용하지 않는다.

구현·검증을 요청받은 작업에서 발견한 허용 범위의 결함은 수정까지 진행한다. 이번처럼 구조 정리 작업에서는 보강 요구와 실제 코드 반영을 구분해 남긴다.
