# FACE 예외 진단 playground

이 fixture는 `ElementInternals` 구현이 `setFormValue()`와 `setValidity()` 쓰기를
거부하는 상황을 재현합니다. 화면에서 다음 네 가지를 순서대로 확인할 수 있습니다.

1. 컴포넌트가 폼 값 `demo-value`와 필수값 오류 상태를 요청합니다.
2. 가짜 네이티브 내부 객체가 두 쓰기를 거부합니다.
3. 컴포넌트 내부 fallback 값은 유지되지만 네이티브 유효성은 그대로 남습니다.
4. `form-internals-error` 이벤트가 실패한 작업 이름을 진단 데이터로 내보냅니다.

화면의 카드 영역은 사람이 읽기 쉬운 요약이고, 아래 **원시 진단 데이터(JSON)**는
`fallbackFormValue`, `nativeFormValue`, 유효성 상태, 진단 작업 목록을 그대로 보여줍니다.
JSON 키와 이벤트 작업 이름은 실제 API 계약을 확인할 수 있도록 영어를 유지합니다.

## 실행 방법

examples Vite 서버를 실행합니다.

```bash
pnpm --filter @context-action/lit-ui exec vite --config examples/vite.config.ts
```

브라우저에서 `/face-exception.html`을 열고 `원시 진단 데이터(개발자용)`와 카드형 실험 결과를 확인합니다.
