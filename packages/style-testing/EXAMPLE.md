# Style Testing - 사용 예시

## 1. Babel 플러그인 설정

`example/vite.config.ts`에 플러그인 추가:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import styleTestPlugin from '@context-action/style-testing/babel-plugin';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            target: '19',
            compilationMode: 'infer',
          }],
          // 개발 모드에서만 data-style-test 주입
          process.env.STYLE_TEST === 'true' ? styleTestPlugin : null,
        ].filter(Boolean),
      },
    })
  ],
  // ... rest of config
});
```

## 2. 개발 서버 실행 (스타일 테스트 모드)

```bash
# data-style-test 속성 주입 활성화
STYLE_TEST=true pnpm dev
```

이렇게 하면 모든 `className`이 있는 요소에 자동으로 `data-style-test` 속성이 추가됩니다:

```tsx
// 원본 코드
<nav className="fixed left-0 top-0 z-40 hidden md:block w-64 md:w-72">
  <div className="p-6 border-b border-gray-200">

// 자동 변환 (STYLE_TEST=true)
<nav className="fixed left-0 top-0 z-40 hidden md:block w-64 md:w-72"
     data-style-test="Layout:nav:334">
  <div className="p-6 border-b border-gray-200"
       data-style-test="Layout:div:350">
```

## 3. 스타일 테스트 실행

```bash
# 기본 테스트
pnpm style-test

# 상세 출력
pnpm style-test:verbose

# JSON 출력
pnpm style-test --output json

# Markdown 리포트
pnpm style-test --output markdown > style-report.md
```

## 4. 예상 결과

```
🧪 Starting style tests...

📝 Extracting expected styles from source code...
   Found 47 elements with style tests

🌐 Launching browser...
   Navigated to http://localhost:4000

🎨 Extracting actual styles from page...
   Extracted styles for 47 elements

🔍 Comparing expected vs actual styles...

=== Style Testing Results ===

✓ 45 elements passed

✗ 2 elements with style mismatches:

  ✗ Layout:nav:334
    File: example/src/components/Layout.tsx:334
    display:
      Expected: block
      Actual:   none
    width:
      Expected: 18rem
      Actual:   0px

  ✗ HomePage:div:25
    File: example/src/pages/HomePage.tsx:25
    marginLeft:
      Expected: 18rem
      Actual:   0px

=== Summary ===
Total: 47
Passed: 45
Failed: 2
Pass Rate: 95.7%
```

## 5. 스냅샷 기능

현재 상태를 정답으로 저장:

```bash
pnpm style-test:snapshot
```

이후 변경사항 비교:

```bash
# 향후 구현 예정
pnpm style-test:compare --baseline ./style-snapshot.json
```

## 6. CI/CD 통합

`.github/workflows/style-test.yml`:

```yaml
name: Style Testing

on: [push, pull_request]

jobs:
  style-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm build

      - name: Build example (with style test)
        run: STYLE_TEST=true pnpm example:build

      - name: Start dev server
        run: pnpm dev &

      - name: Wait for server
        run: sleep 5

      - name: Run style tests
        run: pnpm style-test --output json > style-test-results.json

      - name: Upload results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: style-test-results
          path: style-test-results.json
```

## 7. 제한사항 및 개선 방향

### 현재 제한사항:
1. Tailwind CSS만 지원 (Panda CSS는 미지원)
2. 동적 className (cn() 함수) 부분 지원
3. 조건부 렌더링된 요소는 감지 못함

### 개선 계획:
1. Panda CSS 지원 추가
2. cn() 함수 등 동적 className 완전 지원
3. 베이스라인 비교 기능
4. 시각적 회귀 테스트 (스크린샷 비교)
5. 설정 파일 지원 (`style-test.config.ts`)
