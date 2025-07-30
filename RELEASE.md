# 📦 Release Guide

## 🚀 Quick Release

### 1️⃣ npm 로그인 확인
```bash
npm whoami  # 로그인 상태 확인
# 로그인 안 되어 있다면: npm login
```

### 2️⃣ 원클릭 배포
```bash
# 패치 버전 (0.0.1 → 0.0.2)
pnpm release:patch

# 마이너 버전 (0.0.1 → 0.1.0)  
pnpm release:minor

# 메이저 버전 (0.0.1 → 1.0.0)
pnpm release:major
```

## 📋 상세 배포 과정

### 수동 단계별 배포

#### 1. 버전 업데이트
```bash
# 모든 패키지 패치 버전 업데이트
pnpm version:patch

# 또는 개별 패키지
cd packages/core && npm version patch
cd packages/react && npm version patch
```

#### 2. 빌드 및 검증
```bash
# 전체 빌드
pnpm build:all

# 린팅 및 타입 체크
pnpm lint
pnpm type-check

# 테스트 (선택사항)
pnpm test:all
```

#### 3. 배포
```bash
# 의존성 순서대로 배포 (core → react → jotai)
pnpm publish:all

# 또는 개별 배포
pnpm publish:core
pnpm publish:react
pnpm publish:jotai
```

#### 4. Git 태그 및 푸시
```bash
git push origin main --tags
```

## 🔧 사용 가능한 스크립트

### 버전 관리
- `pnpm version:patch` - 패치 버전 업데이트 (0.0.1 → 0.0.2)
- `pnpm version:minor` - 마이너 버전 업데이트 (0.0.1 → 0.1.0)
- `pnpm version:major` - 메이저 버전 업데이트 (0.0.1 → 1.0.0)

### 빌드 & 테스트
- `pnpm build:all` - 모든 패키지 빌드
- `pnpm build:core` - Core 패키지만 빌드
- `pnpm build:react` - React 패키지만 빌드
- `pnpm build:jotai` - Jotai 패키지만 빌드
- `pnpm prerelease` - 빌드 + 린팅 + 타입체크 (배포 전 검증)
- `pnpm test:all` - 모든 패키지 테스트

### 배포
- `pnpm publish:core` - Core 패키지만 배포
- `pnpm publish:react` - React 패키지만 배포  
- `pnpm publish:jotai` - Jotai 패키지만 배포
- `pnpm publish:all` - 모든 패키지 배포 (의존성 순서)

### 원클릭 배포
- `pnpm release:patch` - 패치 버전 업데이트 + 빌드 + 배포
- `pnpm release:minor` - 마이너 버전 업데이트 + 빌드 + 배포
- `pnpm release:major` - 메이저 버전 업데이트 + 빌드 + 배포

## 🔄 배포 자동화 흐름

`pnpm release:patch` 실행 시:

1. **버전 업데이트**: 모든 패키지 버전 패치 증가
2. **빌드**: `pnpm build:all`
3. **품질 체크**: `pnpm lint && pnpm type-check`  
4. **배포**: Core → React → Jotai 순서로 npm 배포
5. **Git**: 태그 생성 및 원격 저장소 푸시

## ⚠️ 주의사항

### 배포 순서
- **Core 먼저**: `@context-action/core` 패키지를 먼저 배포
- **React 두 번째**: `@context-action/react`는 core에 의존하므로 두 번째
- **Jotai 마지막**: `@context-action/jotai`는 독립적이므로 마지막

### 버전 동기화
- 모든 패키지의 버전을 항상 동일하게 유지
- `pnpm version:*` 명령어를 사용하면 자동으로 동기화됨

### 실패 시 대응
```bash
# 배포 실패 시 수동으로 개별 배포
pnpm publish:core   # Core 패키지만
pnpm publish:react  # React 패키지만
pnpm publish:jotai  # Jotai 패키지만

# 버전 되돌리기 (배포 전)
git reset --hard HEAD~1  # 마지막 커밋 취소
```

## 📊 배포 확인

배포 후 다음 링크에서 확인:
- [@context-action/core](https://www.npmjs.com/package/@context-action/core)
- [@context-action/react](https://www.npmjs.com/package/@context-action/react)
- [@context-action/jotai](https://www.npmjs.com/package/@context-action/jotai)

## 🏷️ 버전 정책

- **Patch (0.0.X)**: 버그 수정, 문서 업데이트
- **Minor (0.X.0)**: 새로운 기능 추가 (하위 호환)
- **Major (X.0.0)**: Breaking changes, API 변경