# 디버그 패턴

Context-Action 프레임워크 애플리케이션을 위한 프로덕션 디버깅 패턴 및 설정 기법입니다.

## 📋 전제 조건 및 설정

**필수 지식**: Context-Action 프레임워크 패턴과 React 개발에 대한 기본 이해
**설정 요구사항**: 
- Context-Action 프레임워크 설치 - [시작하기 가이드](../../getting-started/index.md) 참조
- TypeScript 구성 - [설정 구성](../../setup/index.md) 참조
- 디버깅 기능을 갖춘 개발 환경

**핵심 설정 의존성**:
- `@context-action/react` 디버깅 훅용
- `@context-action/core` 액션 파이프라인 모니터링용
- Browser DevTools 또는 Node.js 디버깅 환경

## Setup 참조

디버그 패턴은 다음 Setup 가이드의 구성 요소를 사용합니다:

- **[Basic Action Setup](../setup/basic-action-setup.md)** - 기본 액션 컨텍스트 설정
- **[Basic Store Setup](../setup/basic-store-setup.md)** - 기본 스토어 컨텍스트 설정

## 🎯 디버그 패턴

### 프로덕션 디버깅
- **[Production Debugging](./production-debugging.md)** - 프로덕션 환경 디버깅
  - 상태 모니터링 및 오류 추적
  - 복구 패턴 및 재시도 로직
  - 성능 모니터링 유틸리티

## 📚 관련 문서

- [Real-time State Access](../async/real-time-state-access.md)
- [Advanced Action Patterns](../action/advanced-patterns.md)  
- [Timeout Protection](../async/timeout-protection.md)