# FACE 예외 진단 playground

이 fixture는 `ElementInternals` 구현이 `setFormValue()`와 `setValidity()` 쓰기를
거부하는 상황을 재현합니다. 화면에서 다음 네 가지를 순서대로 확인할 수 있습니다.

1. 컴포넌트가 폼 값 `demo-value`와 필수값 오류 상태를 요청합니다.
2. 가짜 네이티브 내부 객체가 두 쓰기를 거부합니다.
3. 기본 시나리오에서는 컴포넌트 내부 fallback 값은 유지되지만 네이티브 유효성은 그대로 남습니다. 아래 토글로 이 차이를 바꿔 비교할 수 있습니다.
4. `form-internals-error` 이벤트가 실패한 작업 이름을 진단 데이터로 내보냅니다.

화면의 카드 영역은 사람이 읽기 쉬운 요약이고, 아래 **원시 진단 데이터(JSON)**는
`fallbackFormValue`, `nativeFormValue`, 유효성 상태, 진단 작업 목록을 그대로 보여줍니다.
JSON 키와 이벤트 작업 이름은 실제 API 계약을 확인할 수 있도록 영어를 유지합니다.

## 실행 방법

examples Vite 서버를 실행합니다.

```bash
pnpm --filter @context-action/lit-ui exec vite --config examples/vite.config.ts
```

브라우저에서 `/face-exception.html`을 열고 `직접 조작해보기`에서 조건을 바꿔 봅니다.

- 폼 값을 입력하거나 무효 상태 요청을 바꾸면 즉시 결과가 갱신됩니다.
- `setFormValue`와 `setValidity`의 native 거부 토글을 바꾸는 순간 카드형 실험 결과와 진단 건수가 갱신됩니다.
- `기본 시나리오로 초기화`를 누르면 두 쓰기 모두 거부되는 기본 재현으로 돌아갑니다.

별도 실행 버튼을 두지 않은 이유는 이 playground의 변경이 외부 저장이나 파괴적
작업이 아닌, 되돌릴 수 있는 로컬 실험이기 때문입니다. 입력 변경 자체를 트리거로
삼고 reset을 복구 경로로 두어 조작 단계와 결과 사이의 거리를 줄였습니다.

아래 `원시 진단 데이터(개발자용)`에서는 자동화/API 검증에 쓰는 JSON 원본을 확인할 수 있습니다.
