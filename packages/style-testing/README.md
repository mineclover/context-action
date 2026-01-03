# @context-action/style-testing

자동화된 스타일 테스팅 도구 - 코드에서 기대하는 스타일과 실제 적용된 스타일을 비교합니다.

## 기능

1. **정적 분석**: 소스 코드에서 className을 파싱하여 예상 스타일 추출
2. **런타임 검증**: Playwright로 실제 페이지에서 적용된 스타일 추출
3. **자동 비교**: 예상 vs 실제 스타일을 프로그래밍적으로 비교
4. **자동 식별자**: Babel 플러그인으로 data-style-test 속성 자동 주입

## 설치

```bash
pnpm add -D @context-action/style-testing
```

## 사용법

### 1. Babel 플러그인 설정

`vite.config.ts`에 플러그인 추가:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import styleTestPlugin from '@context-action/style-testing/babel-plugin';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          process.env.NODE_ENV === 'development' ? styleTestPlugin : null,
        ].filter(Boolean),
      },
    }),
  ],
});
```

이제 개발 모드에서 자동으로 `data-style-test` 속성이 주입됩니다:

```tsx
// 원본
<nav className="fixed left-0 top-0">

// 자동 변환 (개발 모드)
<nav className="fixed left-0 top-0" data-style-test="Layout:nav:334">
```

### 2. 스타일 테스트 실행

```bash
# 특정 페이지 테스트
pnpm style-test test --url http://localhost:4000

# 소스 디렉토리 지정
pnpm style-test test --url http://localhost:4000 --source ./src

# 상세 출력
pnpm style-test test --url http://localhost:4000 --verbose

# JSON 출력
pnpm style-test test --url http://localhost:4000 --output json

# Markdown 리포트
pnpm style-test test --url http://localhost:4000 --output markdown
```

### 3. 스냅샷 생성

현재 상태를 정답으로 저장:

```bash
pnpm style-test snapshot --url http://localhost:4000
```

## 출력 예시

```
🧪 Starting style tests...

📝 Extracting expected styles from source code...
   Found 15 elements with style tests

🌐 Launching browser...
   Navigated to http://localhost:4000

🎨 Extracting actual styles from page...
   Extracted styles for 15 elements

🔍 Comparing expected vs actual styles...

=== Style Testing Results ===

✗ 2 elements with style mismatches:

  ✗ Layout:nav:334
    File: src/components/Layout.tsx:334
    position:
      Expected: fixed
      Actual:   static
    left:
      Expected: 0px
      Actual:   auto

  ✗ Layout:main:738
    File: src/components/Layout.tsx:738
    marginLeft:
      Expected: 18rem
      Actual:   0px

=== Summary ===
Total: 15
Passed: 13
Failed: 2
Pass Rate: 86.7%
```

## 프로그래밍 API

```typescript
import { BrowserRunner, StyleExtractor, DiffEngine, Reporter } from '@context-action/style-testing';

const browser = new BrowserRunner();
const extractor = new StyleExtractor();
const diffEngine = new DiffEngine({ normalize: true });
const reporter = new Reporter({ verbose: true });

// 1. 소스 코드에서 예상 스타일 추출
extractor.addSourceDirectory('./src');
const expectedElements = extractor.extractExpectedStyles();

// 2. 브라우저에서 실제 스타일 추출
await browser.launch();
await browser.navigateTo('http://localhost:4000');
const actualStyles = await browser.extractAllStyles();

// 3. 비교
const results = [];
for (const expected of expectedElements) {
  const actual = actualStyles.get(expected.testId);
  if (actual) {
    const result = diffEngine.compare(
      expected.expectedStyles,
      actual,
      expected.testId
    );
    results.push(result);
  }
}

// 4. 리포트
reporter.report(results);

await browser.close();
```

## 설정

`style-test.config.ts` 파일을 만들어 설정 가능 (향후 추가 예정):

```typescript
export default {
  // 비교할 CSS 속성만 지정
  criticalProperties: [
    'position', 'display', 'width', 'height',
    'margin', 'padding', 'flex', 'grid',
  ],

  // 허용 오차
  tolerance: 1, // 1px

  // 정규화 옵션
  normalize: true,
};
```

## 제한사항

- 현재 Tailwind CSS 클래스만 지원 (Panda CSS는 향후 추가)
- 동적 className (cn() 함수 등)은 부분 지원
- 복잡한 조건부 스타일은 수동 검증 필요

## 라이선스

MIT
