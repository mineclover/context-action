# 06. SSR과 Hydration Entry

이 문서는 `@context-action/lit-ui/ssr`과 `@context-action/lit-ui/hydrate`의 공개 계약을 정의합니다.
Lit의 declarative shadow DOM(DSD), `part`/`data-*` 계약, 반사된 reactive property, light DOM slot projection을
서버와 클라이언트에서 동일하게 유지하는 것이 목표입니다.

## 1. Entry 분리

| Entry | 역할 | 서버 renderer 포함 |
| --- | --- | --- |
| `@context-action/lit-ui/ssr` | SSR render + `hydrateLit` re-export | 예 |
| `@context-action/lit-ui/hydrate` | client hydration 전용 | 아니오 |

클라이언트 번들 크기를 줄이려면 hydration만 필요한 코드는 반드시 `./hydrate`를 사용합니다.

```ts
// Server
import { renderLitElement, renderLitTemplate } from '@context-action/lit-ui/ssr';

// Client — Lit element 정의보다 먼저 import
import { hydrateLit } from '@context-action/lit-ui/hydrate';
```

`./hydrate`는 `@lit-labs/ssr-client/lit-element-hydrate-support.js`를 자동으로 로드합니다.
Lit hydration support는 **LitElement 정의 전에 로드되어야** 하므로, 클라이언트 entry의 첫 import로 두는 것을 권장합니다.

## 2. SSR API

```ts
renderLitElement(element: LitElement, options?: RenderLitElementOptions): string
renderLitTemplate(template: TemplateResult): string
renderLitElementAsync(element: LitElement, options?: RenderLitElementOptions): Promise<string>
renderLitTemplateAsync(template: TemplateResult): Promise<string>
```

`RenderLitElementOptions`:

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `properties` | `static elementProperties` | SSR에 property binding으로 전달할 reactive property 목록 |
| `includeAttributes` | `true` | element의 현재 HTML attribute를 host markup에 포함 |
| `includeLightDom` | `true` | light DOM children을 host 내부에 직렬화해 `<slot>` projection 유지 |

### 2-1. Element SSR

`renderLitElement`는 element instance를 그대로 Lit SSR에 넘기지 않습니다.
Lit은 raw instance를 문자열화하므로, reactive property를 `.property=${value}` binding으로 재구성한
TemplateResult를 Lit ElementRenderer에 전달합니다.

- `part`, `data-*`, adopted styles, declarative shadow root가 유지됩니다.
- 복합 객체는 attribute로 직렬화되지 않습니다.
- `reflect: true` property는 host attribute로 합성됩니다.
  - Boolean `true` → `disabled=""`
  - Boolean `false` → attribute 생략
  - Number/String → `String(value)`
  - custom `converter.toAttribute` 지원
- element는 `customElements.define()`으로 등록되어 있어야 합니다.

### 2-2. Light DOM과 Slot

```ts
const element = new TimelineElement();
element.innerHTML = '<span slot="suffix">Server suffix</span>';

const markup = renderLitElement(element);
```

`includeLightDom: false`로 명시적으로 제외할 수 있습니다.
light DOM은 서버 신뢰 입력으로 취급하며, nested custom element의 복합 property는 별도 SSR 경로가 필요합니다.

## 3. Hydration API

```ts
hydrateLit(root: Element | ShadowRoot, element: LitElement): void
```

지원 모드:

1. `root`에 `renderLitTemplate`의 lit-part marker가 있는 경우
   - `hydrate(element.render(), root)`로 기존 DOM을 채택합니다.
   - 같은 root를 두 번 hydrate하면 live part를 감지해 `requestUpdate()`만 수행합니다.
2. `root` 안에 같은 tag의 server-rendered host가 있는 경우
   - Lit hydration support가 있으면 첫 update에서 DSD를 채택합니다.
   - support가 없으면 수동으로 기존 shadow root를 hydrate합니다.
   - 기존 `_$litPart$`가 있으면 재hydrate하지 않습니다.
3. element 자신의 shadow root를 직접 넘기는 경우
   - 기존 server tree를 manual hydrate하고 hydration support flag를 해제해 double hydration을 막습니다.
4. `root`가 비어 있는 경우
   - element를 mount하고 일반 client render를 수행합니다.

### Import 순서

```ts
import { hydrateLit } from '@context-action/lit-ui/hydrate';
import { TimelineElement } from './timeline-element.js';

const host = document.getElementById('timeline-host')!;
hydrateLit(host, new TimelineElement());
```

LitElement가 이미 로드된 뒤 `hydrate` entry를 import하면 hydration support가 자동 적용되지 않을 수 있습니다.
이 경우 `hydrateLit`은 manual hydration fallback을 사용하지만, 최상의 DSD 채택을 위해 entry를 먼저 import합니다.

## 4. 계약과 검증

보장하는 계약:

- server markup과 client hydration 사이에 `part`, `data-*`가 유지됩니다.
- DSD shadow root를 재사용하며 중복 shadow root를 만들지 않습니다.
- hydration 후 이벤트와 ReactiveController가 client에서 연결됩니다.
- reflected host attribute로 초기 상태가 유지됩니다.
- light DOM slot projection이 유지됩니다.
- SSR entry는 `window`/`document` 없이 Node/Edge/Worker에서 evaluate됩니다.
- ESM/CJS 양쪽에서 import됩니다.

검증 명령:

```sh
pnpm --filter @context-action/lit-ui test
pnpm --filter @context-action/lit-ui test:edge
pnpm --filter @context-action/lit-ui test:browser
pnpm verify:package-exports
pnpm verify:package-tarballs
pnpm verify:lit-packed-consumer
```

`test:browser`는 Chromium에서 실제 DSD markup을 hydrate하고 controller/event/slot/part/data 계약을 확인합니다.

## 5. 제약

- `renderLitTemplate`의 동기 버전은 Promise가 포함된 renderer chunk를 지원하지 않습니다. 이 경우 async variant를 사용합니다.
- `renderLitElement`는 Lit 내부 TemplateResult 표현을 사용합니다. Lit major 업그레이드 시 SSR unit/browser contract가 fail-fast 안전장치입니다.
- streaming SSR은 현재 제공하지 않습니다.
- light DOM의 nested custom element 복합 property는 자동 직렬화되지 않습니다.
