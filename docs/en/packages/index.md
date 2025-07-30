# 패키지 개요

Context Action은 모듈화된 구조로 설계된 TypeScript 라이브러리입니다. 필요에 따라 개별 패키지를 선택적으로 설치할 수 있습니다.

## 📦 패키지 구조

### @context-action/core
핵심 액션 관리 시스템을 제공합니다.

- **용도**: 기본 액션 등록 및 실행
- **의존성**: 없음 (순수 TypeScript)
- **번들 크기**: ~15KB (gzipped)

```bash
npm install @context-action/core
```

### @context-action/react
React 앱에서 Context Action을 사용하기 위한 통합 패키지입니다.

- **용도**: React Context, Hooks, 컴포넌트 통합
- **의존성**: `@context-action/core`, `react`
- **번들 크기**: ~8KB (gzipped)

```bash
npm install @context-action/react
```

### @context-action/jotai
Jotai 상태 관리와의 통합을 제공합니다.

- **용도**: Jotai 아톰과 액션 연동
- **의존성**: `@context-action/core`, `jotai`
- **번들 크기**: ~12KB (gzipped)

```bash
npm install @context-action/jotai
```

## 🎯 설치 시나리오

### 기본 사용
순수 TypeScript/JavaScript 프로젝트에서 사용:

```bash
npm install @context-action/core
```

### React 프로젝트
React 앱에서 사용:

```bash
npm install @context-action/core @context-action/react
```

### React + Jotai 프로젝트
Jotai 상태 관리를 함께 사용:

```bash
npm install @context-action/core @context-action/react @context-action/jotai
```

### Jotai 전용
React 없이 Jotai만 사용:

```bash
npm install @context-action/core @context-action/jotai
```

## 🏗️ 아키텍처

```
┌─────────────────────┐
│   @context-action   │
│       /react        │
├─────────────────────┤
│   @context-action   │
│       /jotai        │
├─────────────────────┤
│   @context-action   │
│       /core         │
└─────────────────────┘
```

- **Core**: 모든 패키지의 기반이 되는 핵심 라이브러리
- **React**: Core 위에 구축된 React 전용 기능
- **Jotai**: Core 위에 구축된 Jotai 통합 기능

## 🔧 호환성

### TypeScript
- **최소 버전**: 4.5+
- **권장 버전**: 5.0+

### Node.js
- **최소 버전**: 16+
- **권장 버전**: 18+

### React
- **최소 버전**: 18.0+
- **지원**: Hooks, Concurrent Features

### Jotai
- **최소 버전**: 2.0+
- **지원**: 모든 공식 기능

## 📋 기능 비교

| 기능 | Core | React | Jotai |
|------|:----:|:-----:|:-----:|
| 액션 등록 | ✅ | ✅ | ✅ |
| 타입 안전성 | ✅ | ✅ | ✅ |
| 에러 처리 | ✅ | ✅ | ✅ |
| React Context | ❌ | ✅ | ❌ |
| React Hooks | ❌ | ✅ | ❌ |
| 상태 관리 | ❌ | ❌ | ✅ |
| 아톰 통합 | ❌ | ❌ | ✅ |
| SSR 지원 | ✅ | ✅ | ✅ |

## 🚀 시작하기

각 패키지별 자세한 가이드:

- [Core 패키지](/packages/core/) - 기본 설치 및 설정
- [React 패키지](/packages/react/) - React 앱에서의 사용법
- [Jotai 패키지](/packages/jotai/) - Jotai와의 통합 방법

## 🤝 기여하기

Context Action은 오픈소스 프로젝트입니다. 기여를 환영합니다!

- [GitHub 저장소](https://github.com/mineclover/context-action)
- [이슈 제출](https://github.com/mineclover/context-action/issues)
- [풀 리퀘스트](https://github.com/mineclover/context-action/pulls)