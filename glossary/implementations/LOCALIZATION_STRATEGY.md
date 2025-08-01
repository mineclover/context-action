# Localization Strategy

용어집 시스템의 다국어 지원 전략과 워크플로우입니다.

## 🌍 로컬라이제이션 아키텍처

### 구조 개요
```
glossary/terms/          📚 Master Glossary (Source of Truth)
     ↓ translation
docs/en/glossary/        📖 English User Documentation  
docs/ko/glossary/        📖 Korean User Documentation
docs/{lang}/glossary/    📖 Other Language Documentation
     ↑ implementation tracking
JSDoc @implements        🔗 Language-neutral Implementation Links
```

## 🎯 설계 원칙

### Single Source of Truth
- **마스터 용어집**: `glossary/terms/` (영어 기준)
- **기술적 정의**: 구현 추적의 기준점
- **언어 중립적**: JSDoc 태그는 영어 용어명 기준

### Documentation Separation
- **기술 문서**: `glossary/terms/` (추상적, 구현 중립적)
- **사용자 문서**: `docs/{lang}/glossary/` (실용적, 예시 포함)
- **구현 추적**: 마스터 용어집 기준으로 언어 무관하게 동작

### Cultural Adaptation
- **기술 용어**: 언어 간 일관성 유지
- **설명 방식**: 각 언어 문화에 맞게 적응
- **예시 코드**: 언어별 개발자 관습 반영

## 📂 파일 구조

### 마스터 용어집 (Master Glossary)
```
glossary/terms/
├── index.md                 # 영어 기준 용어집 개요
├── core-concepts.md         # 핵심 개념 (기술적 정의)
├── architecture-terms.md    # 아키텍처 용어
├── api-terms.md            # API 용어  
└── naming-conventions.md    # 네이밍 규칙
```

**특징**:
- 영어로 작성된 기술적, 추상적 정의
- 코드 예시 없음 (구현 중립적)
- JSDoc 태그 매핑의 기준점

### 사용자 문서 (User Documentation)
```
docs/en/glossary/
├── overview.md             # 영어 사용자를 위한 개요
├── core-concepts/          # 실용적 가이드
│   ├── action-handler.md   # 상세 설명 + 예시
│   └── ...
└── guides/                 # 사용법 가이드

docs/ko/glossary/  
├── overview.md             # 한국어 사용자를 위한 개요
├── core-concepts/          # 실용적 가이드
│   ├── action-handler.md   # 한국어 설명 + 한국 개발자 관습
│   └── ...
└── guides/                 # 한국어 사용법 가이드
```

**특징**:
- 각 언어 사용자를 위한 친화적 설명
- 실제 코드 예시와 사용법 포함
- 문화적 맥락과 개발 관습 반영

## 🔄 워크플로우

### 1. 마스터 용어 정의 (Master Term Definition)
```bash
# 1. 새 용어 추가 또는 기존 용어 수정
vim glossary/terms/core-concepts.md

# 2. 구현 추적 업데이트 (자동)
pnpm glossary:update
```

### 2. 구현 연결 (Implementation Linking)
```typescript
/**
 * Action handler implementation
 * @implements action-handler    // 영어 용어명 기준
 * @memberof core-concepts
 */
interface ActionHandler<T> {
  // implementation
}
```

### 3. 사용자 문서 번역 (User Documentation Translation)
```bash
# 영어 문서 작성/업데이트
vim docs/en/glossary/core-concepts/action-handler.md

# 한국어 번역 및 현지화
vim docs/ko/glossary/core-concepts/action-handler.md
```

### 4. 일관성 검증 (Consistency Validation)
```bash
# 구현 추적 결과 확인
cat glossary/implementations/dashboard.md

# 다국어 문서 크로스 체크
diff docs/en/glossary/core-concepts/ docs/ko/glossary/core-concepts/
```

## 📝 번역 가이드라인

### 기술 용어 처리
```markdown
<!-- ✅ 권장: 기술 용어는 영어 유지 -->
## Action Handler
액션 핸들러는 특정 액션을 처리하는 함수입니다.

<!-- ❌ 비권장: 무리한 번역 -->
## 액션 처리기
액션 처리기는...
```

### 용어명 매핑
- **JSDoc 태그**: `@implements action-handler` (영어, 변경 금지)
- **마스터 용어집**: `Action Handler` (영어)
- **한국어 문서**: `액션 핸들러 (Action Handler)` (병기)

### 예시 코드 현지화
```typescript
// 영어 문서
const userAction = useActionHandler('updateUser', async (payload) => {
  // Handle user update
});

// 한국어 문서  
const 사용자액션 = useActionHandler('updateUser', async (payload) => {
  // 사용자 정보 업데이트 처리
});
```

## 🔧 도구 지원

### 자동화된 번역 추적
```bash
# 마스터 용어집 변경 감지
git diff --name-only glossary/terms/

# 번역 필요 문서 식별
find docs/ -name "*.md" -newer glossary/terms/core-concepts.md
```

### 일관성 검증 도구
```bash
# 용어 사용 일관성 검사
grep -r "Action Handler" docs/en/
grep -r "액션 핸들러" docs/ko/

# 구현 추적 결과와 문서 일치 확인
pnpm glossary:validate
```

## 🎯 품질 관리

### 번역 품질 기준
1. **기술 정확성**: 마스터 용어집과 개념적 일치
2. **문화적 적합성**: 해당 언어권 개발자 관습 반영
3. **일관성**: 동일 용어의 일관된 번역
4. **완전성**: 모든 핵심 용어의 번역 제공

### 리뷰 프로세스
1. **마스터 용어집 변경** → 번역 필요 알림
2. **번역자 리뷰** → 기술적 정확성 확인
3. **네이티브 리뷰** → 언어적 자연스러움 확인
4. **개발자 리뷰** → 실용성과 유용성 확인

### 버전 관리
- **마스터 용어집**: 구현 추적 기준, 엄격한 버전 관리
- **사용자 문서**: 유연한 업데이트, 언어별 독립적 버전

## 🚀 확장 계획

### 지원 언어 확대
```
현재: en (마스터), ko
계획: ja, zh-cn, zh-tw, es, fr, de
```

### 자동화 개선
- **번역 변경 감지**: Git hooks로 번역 필요 알림
- **용어 일관성 검사**: CI/CD 파이프라인 통합
- **번역 완성도 추적**: 언어별 번역 진행률 대시보드

### 커뮤니티 기여
- **번역 가이드**: 기여자를 위한 상세 가이드
- **리뷰 프로세스**: 커뮤니티 번역 리뷰 시스템
- **인센티브**: 번역 기여자 인정 시스템

---

*이 전략은 기술적 일관성을 유지하면서도 다양한 언어 사용자에게 친화적인 문서를 제공하기 위한 포괄적 접근법입니다.*