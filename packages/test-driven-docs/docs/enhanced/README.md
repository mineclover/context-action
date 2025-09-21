# Enhanced API Documentation

> 🔄 **자동 생성**: 테스트 코드에서 추출된 향상된 API 문서

이 문서들은 실제 테스트 코드에서 자동으로 추출되어 항상 최신 상태를 유지합니다.

## 📚 API 목록

- [Create Action Context](./createActionContext.enhanced.md) (2개 예제)

## 🔧 사용 방법

### 1. 문서 업데이트
```bash
# 테스트에서 문서 추출
npx @context-action/test-driven-docs generate --enhanced

# 특정 패키지만
npx @context-action/test-driven-docs generate --packages react --enhanced
```

### 2. 새 예제 추가
테스트 파일에 어노테이션을 추가:

```typescript
// @doc-extract: example-name
// @doc-category: basic-usage
// @doc-priority: high
// @doc-description: 기본 사용법 예제
it('should demonstrate basic usage', () => {
  // 예제 코드
});
```

### 3. 문서 검증
```bash
# 모든 문서 예제 검증
npx @context-action/test-driven-docs validate

# 일관성 검사
npx @context-action/test-driven-docs validate --consistency
```

## 📊 통계

- **총 API**: 1개
- **총 예제**: 2개
- **최종 업데이트**: 2025-09-20

---

*📝 이 문서는 [@context-action/test-driven-docs](https://www.npmjs.com/package/@context-action/test-driven-docs)에 의해 자동 생성됩니다.*
