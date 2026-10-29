# Vue·Svelte·Angular 타입 기반 호스트 패턴

[English](element-host-patterns.en.md) · [공통 수명 계약](element-interop.md)

상태: `packages/core/examples/element-hosts/`의 복사 가능한 참조 구현입니다.
공개 package export가 아니며 배포 tarball에도 포함하지 않습니다. Core에 프레임워크
런타임·peer·컴파일러 의존성을 추가하지 않았습니다. 기존 Core/UI 배포 버전 승인 조건도 유지합니다.

## 공통 경계

counter 참조 구현은 `CounterProps`, `CounterInput`, 의미 중심 `CounterHandle`,
이벤트 이름과 property map을 공유합니다. Handle에는 DOM·렌더러 상태를 노출하지 않습니다.
요청 이벤트는 입력 확정이 아니며 호스트가 새 snapshot을 넣어야 확정됩니다.
잘못된 counter 입력은 이전 유효 값을 보존합니다.

선택한 어댑터와 `shared/connect-binding.ts`를 애플리케이션으로 함께 복사하고,
counter 계약·태그를 실제 컴포넌트의 공개 계약으로 교체합니다. Core는 `/element`
공개 경로로만 가져옵니다. 예제 복사가 새 export를 포함한 Core 배포 버전 승인을
대체하지는 않습니다.

`connectBinding`은 최초 update 실패 시 먼저 연결한 listener를 해제합니다.
이미 실행된 setter 부작용을 rollback하지는 않습니다. Vue/Angular는 update 전에
cleanup 참조를 등록하여 동기 setter 이벤트 중 호스트가 해제되어도 정리합니다.
참조 어댑터는 기본적으로
대입 오류를 throw하며, 기존 Lit wrapper의 best-effort 정책은 바꾸지 않습니다.
입력은 전체 snapshot이고 변경 시 새 객체를 제공합니다. 자동 deep watch·Store
구독·업무 handler는 추가하지 않습니다.

## Vue

`vue/element-directive.ts`의 `createElementDirective<Props>()`는 실제 Vue의
`ObjectDirective<HTMLElement, Props>` 타입을 사용합니다. config·오류 정책은
생성 시 캡처하고 WeakMap으로 DOM node마다 binding을 분리합니다. `updated`에서
동기화하고 `beforeUnmount`에서 해제합니다. factory의 Vue import는 타입 전용입니다.

`vue/Host.vue`는 `<script setup>`의 `vElement`와 `v-element="snapshot"` 사용법을
보입니다. 태그의 `isCustomElement`는 runtime app 설정뿐 아니라 **SFC 빌드 컴파일러**에
설정해야 합니다. 게이트는 실제 SFC를 `vue-tsc`로 검사한 후 이 설정으로 컴파일합니다.

## Svelte

`svelte/element-action.ts`의 `createElementAction<Props>()`는 실제 Svelte의
`Action<HTMLElement, Props>` 타입으로 검사합니다. 전체 snapshot이 필수이며
undefined 인자는 throw합니다. action의 update/destroy는 binding에 위임합니다.

`svelte/Host.svelte`는 타입이 지정된 readable source와 action을 연결합니다.
source는 호스트 소유이며 Store 읽기 계약의 통합을 의미하지 않습니다. 같은 컴포넌트를
`svelte-check`로 검사하고 client/server 용으로 컴파일합니다.

## Angular

`angular/element-binding.directive.ts`는 실제 decorator를 사용하는 standalone
directive이며 runtime decorator factory가 아닙니다. `angular/host.component.ts`는
타입이 검사되는 템플릿에서 directive와 native tag용 `CUSTOM_ELEMENTS_SCHEMA`를 사용합니다.

- 필수 `caElementBinding`은 mount 후 고정입니다. 새 config 참조를 넣으면 throw하며,
  기존 property 소유권을 조용히 버리는 대신 호스트를 다시 mount해야 합니다.
- 필수 `caElementInput`은 전체 snapshot입니다. 새 Input 참조는 `ngOnChanges`에서
  적용하고 최초 binding은 `ngAfterViewInit`에서 시작합니다.
- cleanup은 `DestroyRef`가 소유하며 renderer를 dispose하지 않습니다.
- `isPlatformBrowser(PLATFORM_ID)`로 서버에서 native DOM binding을 생략합니다.

게이트는 `strictTemplates`·`strictInjectionParameters`를 켠 Angular full compiler를
실행합니다. Angular 20 컴파일러는 TypeScript <6을 요구하므로 **격리 consumer만**
TypeScript 5.9.3을 사용합니다. workspace TypeScript는 변경하지 않습니다.

## 근거와 제한

패턴을 바꾼 뒤 `pnpm verify:element-hosts`를 실행합니다. 로컬 Core tarball의 공개
경로와 Vue 3.5.44 / Svelte 5.57.2 / Angular 20.3.34, vue-tsc 3.3.13,
svelte-check 4.7.7 고정 버전으로 다음을 확인합니다.

- 유효한 typed template과 각 템플릿 컴파일러의 잘못된 숫자 payload 거부,
  Handle·property map의 음성 타입 검사
- native 기본값·객체 identity·요청/확정 분리·handler 교체/제거·해제·detach·재마운트
- node별 격리·config 캡처·최초 입력 실패 후 listener cleanup
- Angular의 고정 config·server DOM 접근 방지·DestroyRef cleanup
- 브라우저 전역을 주입하지 않은 별도 Node 프로세스의 비활성 서버 호스트 마크업
  (Angular allowed host는 wildcard가 아닌 정확한 호스트 사용)

client lifecycle은 JSDOM/native probe 근거입니다. 서버 근거는 호스트 shell만
대상으로 하며 Preact/Lit 내부 렌더링·인터랙티브 property 상태 직렬화·hydration을
보장하지 않습니다. 실제 브라우저 FACE·모든 프레임워크 버전·렌더러 조합·공개
production 어댑터 패키지는 범위 밖입니다. 이 컴파일러 게이트는 별도 명령이며
기본 Core 타입 검사가 호스트 의존성을 자동 설치하지 않습니다.

## 실제 브라우저 게이트

`pnpm verify:element-host-browser`는 typed/JSDOM/server 검증 뒤 **같은 컴파일된
참조 템플릿**을 임시 loopback 페이지로 번들링합니다. 연결된 `ego-browser` 런타임이
필요하며 workspace 프레임워크 의존성·공개 export는 추가하지 않습니다. Angular는
TestBed가 아닌 실제 `createApplication` / `createComponent` / attach/destroy 수명을
사용합니다. 검증 번들에는 compiler/dev 런타임이 들어가므로 production 배포 산출물은 아닙니다.

driver는 각 호스트에서 실제 trusted Shadow DOM 버튼 클릭을 한 번씩 실행한 뒤
17개 항목을 검사합니다. 기본값·property identity·의미 중심 Handle·trusted 요청·
요청/확정 분리·입력 거부·명령 이벤트·listener 안정성·no echo·handler 교체·object
receiver·제거·소유권 반환·unmount·detach·remount·최종 cleanup입니다. 미처리 브라우저
오류는 허용하지 않으며 종료 시 모든 호스트를 unmount합니다.

무작위 `127.0.0.1` 포트에서 `/`와 번들 `/app.js`만 제공합니다. workspace 전체를
file server로 열지 않습니다. 성공 시 driver가 자기 브라우저 공간을 닫고, 게이트는
실패 시에도 자기 서버를 종료합니다. 브라우저 실패 시에는 진단용 공간을 유지하며,
막혔거나 사용자 제어 중인 페이지를 우회하려고 새 공간을 만들지 않습니다.

출력되는 임시 디렉터리에 browser user-agent·고정 프레임워크 버전·항목별 결과·driver
로그·제공한 번들의 SHA-256을 기록합니다. `CONTEXT_ACTION_BROWSER_EVIDENCE_DIR`로 새
저장 경로를 지정할 수 있습니다. 이전 영수증과 섞이지 않도록 비어 있지 않은
디렉터리는 거부합니다. 복구한 driver 로그는 해당 실행의 근거이지 새로운 실행·릴리스 영수증이
아니며, 잃어버린 산출물 hash를 만들어 넣지 않습니다.

`pnpm test:element-host-browser`는 브라우저 없이 수집 코드를 검사합니다. stdout와
stderr를 모두 받되 결과 누락·중복·부분 통과·버전 변경·untrusted 클릭·브라우저 오류는 거부합니다.

이번 근거는 **현재 ego Chromium + native Shadow DOM probe**에 한정합니다.
Firefox/WebKit·FACE·렌더러 조합·hydration 검증 완료를 의미하지 않습니다.
