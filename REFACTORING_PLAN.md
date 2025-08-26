# 📋 Context-Action Example 리팩토링 실행 계획

## 📊 현황 분석 (2025-08-26)

### 🚨 식별된 주요 문제점
1. **디렉토리 구조 불일치**: `domains/`, `features/`, `patterns/` vs `pages/` 역할 중복
2. **Import 경로 복잡성**: 7개 파일이 `../../domains/shared/templates` 참조
3. **코드 스타일 불일치**: 파일명 규칙, 컴포넌트 패턴, 타입 정의 위치 분산

### 📈 현재 코드베이스 메트릭
- **총 파일 수**: ~200개 (src/ 디렉토리 기준)
- **영향받는 파일**: 7개 (domains templates import)
- **복잡한 import 경로**: `../../domains/shared/templates`
- **일관성 없는 디렉토리**: 3개 (`domains/`, `features/`, `patterns/`)

## 🎯 목표 디렉토리 구조

```
src/
├── pages/                          # 모든 페이지 컴포넌트 통합
│   ├── conditional-patterns/       # ← features/conditional-patterns
│   ├── actionguard/               # 기존 유지
│   ├── demos/                     # 기존 유지
│   └── ... (기존 pages)
├── lib/                           # 라이브러리성 코드
│   ├── templates/                 # ← domains/shared/templates
│   ├── patterns/                  # ← patterns/object-context-manager
│   ├── hooks/                     # 공통 훅
│   ├── services/                  # 공통 서비스
│   └── utils/                     # 유틸리티
├── components/                    # 재사용 컴포넌트 (기존 유지)
├── types/                         # 전역 타입 정의
└── styles/                        # 스타일
```

## 🚀 4단계 실행 계획

### **Phase 1: 준비 작업** (소요시간: 30분)

#### 체크리스트:
- [ ] 작업 브랜치 생성: `git checkout -b refactor/code-consistency`
- [ ] 현재 상태 백업 커밋
- [ ] 스크립트 파일 생성 및 권한 설정
- [ ] 테스트 실행으로 기준 상태 확인

#### 실행 명령어:
```bash
# 1. 브랜치 생성 및 백업
git checkout -b refactor/code-consistency
git add . && git commit -m "backup: save current state before refactoring"

# 2. 스크립트 디렉토리 생성
mkdir -p scripts
chmod +x scripts/*.sh

# 3. 기준 상태 확인
pnpm type-check
pnpm lint
pnpm dev # 정상 실행 확인 후 종료
```

### **Phase 2: 디렉토리 구조 변경** (소요시간: 1-2시간)

#### 자동화 스크립트: `scripts/refactor-directories.sh`
```bash
#!/bin/bash
# 디렉토리 구조 변경 스크립트

echo "🚀 Starting directory restructure..."

# 1. 새 디렉토리 생성
mkdir -p src/lib/templates
mkdir -p src/lib/patterns  
mkdir -p src/lib/services
mkdir -p src/lib/hooks
mkdir -p src/pages/conditional-patterns

# 2. features → pages 이동
echo "📁 Moving features to pages..."
if [ -d "src/features/conditional-patterns" ]; then
  cp -r src/features/conditional-patterns/pages/* src/pages/conditional-patterns/ 2>/dev/null || true
  cp -r src/features/conditional-patterns/stores src/pages/conditional-patterns/ 2>/dev/null || true
  cp -r src/features/conditional-patterns/types src/pages/conditional-patterns/ 2>/dev/null || true
  cp -r src/features/conditional-patterns/utils src/pages/conditional-patterns/ 2>/dev/null || true
fi

# 3. domains → lib 이동
echo "📁 Moving domains to lib..."
if [ -d "src/domains/shared/templates" ]; then
  cp -r src/domains/shared/templates/* src/lib/templates/ 2>/dev/null || true
fi
if [ -d "src/domains/shared/services" ]; then
  cp -r src/domains/shared/services src/lib/ 2>/dev/null || true
fi
if [ -d "src/domains/shared/hooks" ]; then
  cp -r src/domains/shared/hooks src/lib/ 2>/dev/null || true
fi

# 4. patterns → lib 이동
echo "📁 Moving patterns to lib..."
if [ -d "src/patterns/object-context-manager" ]; then
  cp -r src/patterns/object-context-manager/* src/lib/patterns/ 2>/dev/null || true
fi

echo "✅ Directory restructure complete!"
echo "⚠️  Please verify moved files and remove old directories manually after testing"
```

#### 체크리스트:
- [ ] 스크립트 실행: `./scripts/refactor-directories.sh`
- [ ] 파일 이동 확인: 모든 파일이 올바른 위치에 있는지 검증
- [ ] 임시 커밋: `git add . && git commit -m "refactor: restructure directories"`
- [ ] 컴파일 테스트: `pnpm type-check` (에러 예상됨)

### **Phase 3: Import 경로 수정** (소요시간: 1-2시간)

#### 자동화 스크립트: `scripts/update-imports.sh`
```bash
#!/bin/bash
# Import 경로 자동 수정 스크립트

echo "🔄 Updating import paths..."

# 1. domains/shared/templates → @/lib/templates
echo "Updating domains template imports..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s|from '../../domains/shared/templates'|from '@/lib/templates'|g" \
  -e "s|from '../../../domains/shared/templates'|from '@/lib/templates'|g" \
  -e "s|from '../../../../domains/shared/templates'|from '@/lib/templates'|g"

# 2. features → @/pages
echo "Updating features imports..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s|from './features/conditional-patterns|from '@/pages/conditional-patterns'|g" \
  -e "s|from '../features/conditional-patterns|from '@/pages/conditional-patterns'|g" \
  -e "s|from '../../features/conditional-patterns|from '@/pages/conditional-patterns'|g"

# 3. patterns → @/lib/patterns  
echo "Updating patterns imports..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s|from './patterns/object-context-manager|from '@/lib/patterns'|g" \
  -e "s|from '../patterns/object-context-manager|from '@/lib/patterns'|g"

# 4. domains/shared/services → @/lib/services
echo "Updating services imports..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s|from '../../domains/shared/services'|from '@/lib/services'|g" \
  -e "s|from '../../../domains/shared/services'|from '@/lib/services'|g"

echo "✅ Import paths updated!"
```

#### Vite 설정 업데이트: `vite.config.ts`
```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
});
```

#### TypeScript 설정 업데이트: `tsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/lib/*": ["src/lib/*"],
      "@/pages/*": ["src/pages/*"],
      "@/components/*": ["src/components/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

#### 체크리스트:
- [ ] Import 경로 수정 스크립트 실행: `./scripts/update-imports.sh`
- [ ] Vite 설정 업데이트
- [ ] TypeScript 설정 업데이트
- [ ] 컴파일 테스트: `pnpm type-check` (에러 해결)
- [ ] 개발 서버 테스트: `pnpm dev`
- [ ] 커밋: `git add . && git commit -m "refactor: update import paths with path mapping"`

### **Phase 4: 코드 품질 및 검증** (소요시간: 1시간)

#### ESLint 규칙 강화: `.eslintrc.js`
```javascript
module.exports = {
  rules: {
    // Import 순서 강제
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [
          { pattern: '@/**', group: 'internal', position: 'before' }
        ],
        'newlines-between': 'always'
      }
    ],
    // 상대 경로 제한
    'import/no-relative-parent-imports': 'error'
  }
};
```

#### 자동 포맷팅 스크립트: `scripts/format-code.sh`
```bash
#!/bin/bash
echo "🎨 Formatting code..."

# Prettier 포맷팅
pnpm prettier --write "src/**/*.{ts,tsx,js,jsx}"

# ESLint 자동 수정
pnpm eslint --fix "src/**/*.{ts,tsx,js,jsx}"

echo "✅ Code formatting complete!"
```

#### 체크리스트:
- [ ] ESLint 규칙 업데이트
- [ ] 코드 포맷팅: `./scripts/format-code.sh`
- [ ] 전체 테스트: `pnpm type-check && pnpm lint`
- [ ] 빌드 테스트: `pnpm build`
- [ ] 모든 페이지 수동 테스트 (주요 경로)
- [ ] 최종 커밋: `git add . && git commit -m "refactor: apply code quality improvements and formatting"`

## 📋 검증 체크리스트

### 기능 검증
- [ ] 홈페이지 로드 정상
- [ ] ActionGuard 페이지들 정상 작동
- [ ] Conditional Patterns 페이지들 정상 작동  
- [ ] 데모 페이지들 정상 작동
- [ ] 마우스 이벤트 예제들 정상 작동
- [ ] Hot reload 정상 작동

### 코드 품질 검증
- [ ] `pnpm type-check` 통과
- [ ] `pnpm lint` 통과  
- [ ] `pnpm build` 성공
- [ ] Import 경로가 일관성 있게 정리됨
- [ ] 불필요한 디렉토리 정리됨

### 성능 검증
- [ ] 개발 서버 시작 시간 변화 없음
- [ ] 빌드 시간 변화 없음
- [ ] 번들 크기 변화 없음

## 🎯 예상 효과

### 즉시 효과
- ✅ Import 경로 복잡성 80% 감소
- ✅ 코드 네비게이션 개선
- ✅ 디렉토리 구조 명확화

### 장기 효과
- ✅ 유지보수성 향상
- ✅ 새로운 개발자 온보딩 시간 단축
- ✅ 컴포넌트 재사용성 증가

## ⚠️ 위험 요소 및 대응책

### 위험 요소
1. **Import 경로 누락**: 자동 스크립트가 모든 경우를 처리하지 못할 수 있음
2. **기능 손상**: 파일 이동 과정에서 의존성 문제 발생 가능
3. **개발 중인 기능 충돌**: 다른 개발자의 작업과 충돌 가능성

### 대응책
1. **점진적 적용**: 각 단계별 검증 후 다음 단계 진행
2. **백업 유지**: 각 단계마다 커밋으로 롤백 지점 확보
3. **팀 소통**: 리팩토링 전후 팀원들과 충분한 소통

## 📅 실행 일정

| 단계 | 작업 | 소요시간 | 담당자 | 상태 |
|------|------|----------|--------|------|
| Phase 1 | 준비 작업 | 30분 | - | ⏳ 대기 |
| Phase 2 | 디렉토리 변경 | 1-2시간 | - | ⏳ 대기 |
| Phase 3 | Import 수정 | 1-2시간 | - | ⏳ 대기 |
| Phase 4 | 품질 검증 | 1시간 | - | ⏳ 대기 |
| **총 소요시간** | **3.5-5.5시간** | - | - |

## 📞 문제 발생 시 대응

1. **즉시 롤백**: `git reset --hard HEAD~1`
2. **부분 되돌리기**: `git checkout HEAD~1 -- <파일경로>`
3. **도움 요청**: 팀 리드 또는 시니어 개발자 문의

---

**작성일**: 2025-08-26  
**작성자**: Claude Code Assistant  
**상태**: 실행 준비 완료 ✅