# Debug Patterns

Production debugging patterns and setup techniques for Context-Action framework applications.

## 📋 Prerequisites & Setup

**Required Knowledge**: Basic understanding of Context-Action framework patterns and React development
**Setup Requirements**: 
- Context-Action framework installation - see [Getting Started Guide](../../getting-started/index.md)
- TypeScript configuration - see [Setup Configuration](../../setup/index.md)
- Development environment with debugging capabilities

**Core Setup Dependencies**:
- `@context-action/react` for debugging hooks
- `@context-action/core` for action pipeline monitoring
- Browser DevTools or Node.js debugging environment

## Setup 참조

Debug 패턴은 다음 Setup 가이드의 구성 요소를 사용합니다:

- **[Basic Action Setup](../setup/basic-action-setup.md)** - 기본 액션 컨텍스트 설정
- **[Basic Store Setup](../setup/basic-store-setup.md)** - 기본 스토어 컨텍스트 설정

## 🎯 Debug Patterns

### Production Debugging
- **[Production Debugging](./production-debugging.md)** - 프로덕션 환경 디버깅
  - State monitoring and error tracking
  - Recovery patterns and retry logic
  - Performance monitoring utilities

## 📚 Related Documentation

- [Real-time State Access](../async/real-time-state-access.md)
- [Advanced Action Patterns](../action/advanced-patterns.md)  
- [Timeout Protection](../async/timeout-protection.md)