# CI/CD API Documentation Generation

Context Action의 CI/CD 파이프라인에서 API 문서 자동 생성이 어떻게 처리되는지 설명합니다.

## Overview

GitHub Actions 워크플로우에서 TypeDoc을 사용하여 API 문서를 자동으로 생성하고 배포합니다.

## Workflow

### 1. Trigger Conditions

문서 배포는 다음 조건에서 트리거됩니다:

```yaml
on:
  push:
    branches: [ main ]
    paths:
      - 'docs/**'
      - 'packages/*/src/**'
      - '.github/workflows/docs.yml'
      - 'typedoc.json'
      - 'package.json'
      - 'docs/.vitepress/config.ts'
```

### 2. Build Process

```yaml
- name: Generate API documentation
  run: |
    pnpm docs:api
    pnpm docs:sync
```

#### 단계별 설명

1. **`pnpm docs:api`**: TypeDoc으로 API 문서 생성
   - `docs/api/generated/` 경로에 원본 문서 생성
   - TypeScript 소스 코드를 분석하여 마크다운 문서 생성

2. **`pnpm docs:sync`**: 생성된 문서 동기화
   - `docs/en/api/` 및 `docs/ko/api/` 경로로 문서 복사
   - 사이드바 설정 자동 생성 (`docs/.vitepress/config/api-spec.ts`)

### 3. Build Documentation

```yaml
- name: Build documentation
  run: pnpm docs:build
```

VitePress를 사용하여 최종 문서 사이트를 빌드합니다.

## Git Ignore Strategy

### 자동 생성 파일들

다음 파일들은 `.gitignore`에 포함되어 Git에서 추적하지 않습니다:

```gitignore
# Auto-generated API documentation
docs/.vitepress/config/api-spec.ts
docs/en/api/
docs/ko/api/
docs/api/generated/
```

### 기존 커밋된 파일 처리

이미 Git에 커밋된 자동 생성 파일들은 특별히 처리해야 합니다:

```bash
# Git에서 자동 생성 파일들 제거 (추적 중단)
git rm --cached docs/.vitepress/config/api-spec.ts
git rm -r --cached docs/en/api/ docs/ko/api/

# 변경사항 커밋
git commit -m "Remove auto-generated API documentation from Git tracking"
```

이후부터는 `.gitignore`에 의해 자동으로 제외됩니다.

### 이유

1. **소스 코드 기반**: API 문서는 TypeScript 소스 코드에서 자동 생성
2. **CI/CD에서 생성**: 배포 시점에 항상 최신 상태로 생성
3. **충돌 방지**: 자동 생성 파일로 인한 Git 충돌 방지
4. **저장소 크기**: 불필요한 파일로 저장소 크기 증가 방지

## CI/CD 장점

### 1. 항상 최신 상태

- 코드 변경 시 자동으로 API 문서 업데이트
- 수동 관리 불필요
- 문서와 코드의 일관성 보장

### 2. 자동화된 배포

```yaml
- name: Deploy to GitHub Pages
  uses: actions/deploy-pages@v4
```

- GitHub Pages에 자동 배포
- 브랜치 기반 배포 (main 브랜치만)
- 환경별 배포 설정

### 3. 캐싱 최적화

```yaml
- name: Setup pnpm cache
  uses: actions/cache@v3
  with:
    path: ${{ env.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
```

- pnpm 저장소 캐싱으로 빌드 속도 향상
- 의존성 설치 시간 단축

## Vue 호환성 이슈

### 문제: TypeScript 제네릭 구문과 Vue 컴파일러 충돌

CI/CD 파이프라인에서 다음과 같은 Vue 빌드 오류가 발생할 수 있습니다:

```
[vite:vue] docs/en/api/react/src/functions/useStore.md (19:24): Element is missing end tag.
Error: Process completed with exit code 1.
```

**원인:** TypeDoc이 생성한 마크다운의 TypeScript 제네릭 구문(`<T>`, `Snapshot<T>`)을 Vue 컴파일러가 HTML 태그로 잘못 해석

### 해결 방법

#### 1. JSDoc 구문 규칙 준수

모든 TypeScript 파일에서 다음 규칙을 따라야 합니다:

```typescript
// ❌ CI/CD에서 빌드 실패 원인
/**
 * @template T - Store value type
 */

// ✅ 올바른 패턴
/**
 * @template T Store value type
 */
```

#### 2. 자동 후처리 적용

`scripts/sync-api-docs.js`에서 Vue 호환성을 위한 후처리가 자동으로 적용됩니다:

- 제네릭 패턴: `Snapshot<T>` → `Snapshot&lt;T&gt;`
- 타입 파라미터: `` `T` `` → `**T**`
- 헤더 안전화: `### T` → `### Generic type T`

#### 3. CI/CD 워크플로우 업데이트

```yaml
- name: Generate API documentation
  run: |
    pnpm docs:api
    pnpm docs:sync  # Vue 호환성 후처리 포함

- name: Build documentation
  run: pnpm docs:build  # Vue 컴파일러 호환 빌드
```

## Troubleshooting

### 1. Vue 빌드 오류 해결

Vue 컴파일러 오류가 발생하는 경우:

```bash
# 로컬 테스트로 문제 확인
pnpm docs:api
pnpm docs:sync
pnpm docs:build

# 문제 파일 확인
grep -r "<[A-Z]>" docs/en/api/
```

**체크리스트:**
- [ ] JSDoc `@template` 구문에 대시(-) 사용 안 함
- [ ] 제네릭 타입이 HTML 엔티티로 변환됨
- [ ] 타이틀 헤더에 단일 문자 사용 안 함

### 2. 빌드 실패 시

```bash
# 로컬에서 테스트
pnpm docs:api
pnpm docs:sync
pnpm docs:build
```

### 3. 문서가 업데이트되지 않는 경우

```bash
# 캐시 클리어
rm -rf docs/.vitepress/cache/
rm -rf docs/en/api/
rm -rf docs/ko/api/
pnpm docs:full
```

### 4. TypeDoc 경고 해결

TypeDoc 경고는 대부분 JSDoc 태그 관련입니다:

```typescript
// 올바른 JSDoc 태그 사용
/**
 * @param payload - Input data
 * @returns Processed result
 * @template T Store value type (대시 없이)
 */
```

### 5. GitHub Actions 디버깅

빌드 로그에서 Vue 오류 패턴 확인:

```bash
# 로그에서 찾을 오류 패턴
"Element is missing end tag"
"[vite:vue]"
"SyntaxError: [plugin vite:vue]"
```

## Security Considerations

### 1. 권한 설정

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

- 최소 권한 원칙 적용
- GitHub Pages 배포에 필요한 권한만 부여

### 2. 동시성 제어

```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```

- 동시 배포 방지
- 진행 중인 배포는 완료까지 허용

## Monitoring

### 1. 빌드 상태 확인

GitHub Actions 탭에서 다음을 확인:

- ✅ Build job 성공
- ✅ Deploy job 성공
- 📊 빌드 시간 및 성능

### 2. 배포 확인

- GitHub Pages 설정에서 배포 상태 확인
- 사이트 접근 테스트
- API 문서 페이지 로드 확인

## Future Enhancements

### 1. 성능 최적화

- 빌드 시간 단축을 위한 캐싱 전략
- 병렬 처리 도입

### 2. 품질 관리

- 문서 품질 검사 자동화
- 링크 유효성 검사
- 스펠링 체크

### 3. 알림 시스템

- 배포 성공/실패 알림
- 문서 변경 사항 요약

---

이 시스템을 통해 Context Action의 API 문서는 CI/CD 파이프라인을 통해 자동으로 생성, 배포되며, 항상 최신 상태를 유지합니다. 