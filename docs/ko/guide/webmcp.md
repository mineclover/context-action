# WebMCP 브라우저 도구

`@context-action/webmcp`는 Chrome의 실험적 WebMCP imperative API를 통해
canonical Context-Action 도구 레지스트리의 명시적인 일부만 브라우저에
노출합니다. 별도의 레지스트리를 만들지 않으므로 검증, 인가, 승인,
idempotency, provenance, durable 실행은 계속 `ToolManagementInterface`를
경유합니다.

> WebMCP는 실험적 브라우저 기능입니다. 지원하지 않는 클라이언트에서도
> 동작할 UI 또는 서버 경로를 유지하고, 점진적 향상 기능으로 사용하세요.

## capability scope 등록

안정적인 세션 식별자를 지정하고 페이지가 노출할 모든 도구 이름을
명시합니다. 목록에 없는 도구가 암묵적으로 공개되지는 않습니다.

```ts
import { createWebMCPToolScope } from '@context-action/webmcp';

const scope = await createWebMCPToolScope(registry, {
  sessionId: 'shopping-page:42',
  toolNames: ['searchCatalog', 'addToCart'],
  exposedTo: ['https://agent.example'],
});

// 페이지 또는 기능 scope가 종료될 때 호출합니다.
scope.dispose();
```

등록된 각 WebMCP 호출에는 scope마다 고유한 도구 호출 ID가 생성되며
`registry.executeModelToolCall()`을 통해 실행됩니다. adapter는 canonical
context에 `source: 'model'`, `mode: 'agent'`,
`metadata.transport: 'webmcp'`를 기록합니다. WebMCP는 안정적인 native
retry identity를 제공하지 않으므로 idempotency는 기본적으로 비활성화됩니다.
워크플로에 domain 소유의 안정적인 재시도 키가 있을 때만
`getIdempotencyKey`를 제공하세요.

WebMCP callback에는 native `ModelContextClient`도 전달됩니다. 브라우저의
interaction gate가 필요한 도구는 canonical manager가 실행되기 전에
`beforeExecute(invocation, client)`에서
`client.requestUserInteraction()`을 페이지 승인 UI와 연결할 수 있습니다.
이 기능은 registry의 policy·authorization 검사를 대체하지 않습니다.

반환된 scope는 현재 문서가 WebMCP를 지원하는지 알려줍니다. SSR 또는 미지원
브라우저에서는 예외 대신 `supported: false`인 inert scope를 반환하므로,
기능 감지는 UI 경계에서 처리할 수 있습니다.

## React 수명 주기 통합

`@context-action/react/tools`는 컴포넌트 수명 주기에 맞춰 등록을 관리하는
훅을 제공합니다. `ToolContext`에서 canonical registry를 얻고, 관련 없는
렌더링에서 도구가 재등록되지 않도록 options 객체를 메모이즈하세요.

```tsx
import { useMemo } from 'react';
import { useWebMCPToolScope } from '@context-action/react/tools';

function ShoppingPageTools() {
  const registry = useShoppingToolsRegistry();
  const options = useMemo(() => ({
    sessionId: 'shopping-page:42',
    toolNames: ['searchCatalog', 'addToCart'],
    exposedTo: ['https://agent.example'],
  }), []);

  const { supported, activeTools, error } = useWebMCPToolScope(registry, options);

  if (error) throw error;
  return supported ? <p>Agent tools: {activeTools.join(', ')}</p> : null;
}
```

이 훅은 언마운트 시 scope를 해제합니다. 컴포넌트가 이미 언마운트된 뒤에
비동기 등록이 끝나는 경우도 함께 정리합니다.

## 브라우저 및 origin 요구 사항

WebMCP 등록에는 `document.modelContext`가 있는 표시 가능한 브라우저 또는
webview 컨텍스트가 필요합니다. `navigator.modelContext`는 지원 대상 API가
아닙니다. 프로덕션 페이지에는 cross-origin isolation과 `tools`
Permissions Policy가 필요합니다.

cross-origin 소비자를 지원하려면 다음을 모두 설정하세요.

- `exposedTo`에 정확한 소비자 origin을 등록합니다(HTTPS만 허용하며, 로컬
  개발에서는 `localhost`, `127.0.0.1`, `[::1]`에 한해 HTTP를 허용합니다).
- iframe을 사용한다면 embedding iframe에 `allow="tools"` 권한을 설정합니다.
- 소비자가 일치하는 `fromOrigins` 요청으로 도구를 검색하게 합니다.

WebMCP에서 도구가 보인다는 사실은 인가를 의미하지 않습니다. 파괴적 작업의
확인과 정책 규칙은 canonical 도구 레지스트리에 유지하고, 현재 페이지에
필요한 최소 도구 목록만 노출하세요.

최신 브라우저 지원 및 배포 요건은 Chrome의
[WebMCP 개요](https://developer.chrome.com/docs/ai/webmcp?hl=ko)와
[imperative API 가이드](https://developer.chrome.com/docs/ai/webmcp/imperative-api?hl=ko)를
참조하세요.
