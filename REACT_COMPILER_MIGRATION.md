# React Compiler 마이그레이션 완료

이 문서는 context-action 프로젝트의 React Compiler 호환성 마이그레이션을 설명합니다.

## 🎯 마이그레이션 목표

- React Compiler를 통한 자동 메모이제이션 최적화
- 라이브러리 사용자에게 즉시 성능 향상 제공
- React 17+ 호환성 유지

## 📦 설치된 의존성

### 루트 프로젝트
```json
{
  "devDependencies": {
    "babel-plugin-react-compiler": "1.0.0",
    "rolldown": "1.0.0-beta.43"
  }
}
```

### React 패키지
```json
{
  "dependencies": {
    "react-compiler-runtime": "1.0.0"
  }
}
```

## ⚙️ 설정 파일

### 1. Babel 설정 (`babel.config.js`)
```javascript
module.exports = {
  plugins: [
    'babel-plugin-react-compiler',
  ],
  env: {
    production: {
      plugins: [
        ['babel-plugin-react-compiler', {
          target: '17', // 최소 지원 React 버전
        }],
      ],
    },
    development: {
      plugins: [
        ['babel-plugin-react-compiler', {
          target: '17',
          logger: console,
        }],
      ],
    },
  },
};
```

### 2. React 패키지 Babel 설정 (`packages/react/babel.config.js`)
```javascript
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      target: '17',
      compilationMode: 'annotation', // "use memo" 지시어 기반 컴파일
    }],
  ],
  // ... 환경별 설정
};
```

### 3. tsdown 설정 업데이트 (`packages/react/tsdown.config.ts`)
```typescript
export default defineConfig({
  // ... 기존 설정
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'react-compiler-runtime', // React Compiler runtime 추가
    'immer'
  ],
  babel: {
    plugins: [
      ['babel-plugin-react-compiler', {
        target: '17',
        compilationMode: 'annotation',
      }],
    ],
  },
})
```

### 4. Vite 설정 업데이트 (`example/vite.config.ts`)
```typescript
react({
  babel: {
    plugins: [
      ['babel-plugin-react-compiler', {
        target: '17',
        compilationMode: 'annotation',
      }],
    ],
  },
})
```

## 🚀 React Compiler 지시어 적용

주요 훅에 "use memo" 지시어를 추가하여 자동 메모이제이션 최적화:

### useStoreValue 훅
```typescript
export function useStoreValue<T, R>(
  store: Store<T> | undefined | null,
  selectorOrOptions?: ((value: T) => R) | StoreValueOptions<T>,
  options?: StoreValueOptions<R>
): T | R | undefined {
  "use memo"; // React Compiler 최적화
  // ... 구현
}
```

### useStoreSelector 훅
```typescript
export function useStoreSelector<T, R>(
  store: Store<T>,
  selector: (value: T) => R,
  equalityFn: (a: R, b: R) => boolean = defaultEqualityFn
): R {
  "use memo"; // React Compiler 최적화
  // ... 구현
}
```

## ✅ 검증 완료

- [x] React 패키지 빌드 성공
- [x] Example 앱 빌드 성공
- [x] React Compiler 지시어 적용 확인
- [x] 컴파일된 코드에서 "use memo" 지시어 확인

## 🔧 빌드 명령어

```bash
# React 패키지 빌드
pnpm build:react

# 전체 프로젝트 빌드
pnpm build

# Example 앱 빌드
cd example && pnpm build
```

## 📈 성능 향상

React Compiler를 통해 다음 최적화가 자동으로 적용됩니다:

1. **자동 메모이제이션**: 컴포넌트와 훅의 불필요한 재계산 방지
2. **의존성 최적화**: useEffect, useMemo, useCallback의 의존성 배열 자동 최적화
3. **렌더링 최적화**: 불필요한 리렌더링 방지

## 🎯 사용자 혜택

- **즉시 성능 향상**: 라이브러리 사용자가 별도 설정 없이 성능 향상
- **자동 최적화**: React Compiler가 자동으로 최적화 적용
- **호환성**: React 17+ 버전과 완전 호환

## 📚 참고 자료

- [React Compiler 공식 문서](https://react.dev/reference/react-compiler/compiling-libraries)
- [Babel Plugin React Compiler](https://www.npmjs.com/package/babel-plugin-react-compiler)
- [React Compiler Runtime](https://www.npmjs.com/package/react-compiler-runtime)
