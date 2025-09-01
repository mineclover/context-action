# LLMS CLI Setup Guide - 글로벌 설치 방법

이 가이드는 `llms` 명령어를 글로벌로 설치하여 어디서든 사용할 수 있도록 설정하는 방법을 설명합니다.

## 🚀 NPM 글로벌 설치 (권장)

```bash
# 전 세계 어디서든 설치 가능
npm i -g @context-action/llms-generator
# 또는
pnpm add -g @context-action/llms-generator

# 설치 완룈 - 바로 사용
llms --help
llms work-next --limit 5
llms priority-stats
```

## 🔧 로컬 개발 설치

### 방법 1: 로컬 패키지 글로벌 설치
```bash
cd packages/llms-generator
pnpm build
npm pack
npm i -g ./context-action-llms-generator-0.7.3.tgz
llms --help  # 바로 사용 가능
```

### 방법 2: npm link 사용 (개발용 - 반영 빠름) ⭐
```bash
cd packages/llms-generator
pnpm build
npm link

# 설치 완료 - 바로 사용
llms --help
llms priority-stats

# 수정 후 빌드만 하면 바로 반영
pnpm build
```

> 💡 **npm link의 장점**: 
> - 매번 .tgz 파일 생성할 필요 없음
> - 수정 후 빌드만 하면 바로 반영됨
> - PATH 설정 자동화 (대부분의 경우)
> - 제거도 간단 (`npm unlink`)

### 방법 3: pnpm link 사용 (개발용)
```bash
cd packages/llms-generator
pnpm build
pnpm link --global

# 환경변수 설정 (필요시)
export PNPM_HOME="/Users/$USER/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"

llms --help
```

> ⚠️ **pnpm link 주의사항**: 
> - 환경변수 수동 설정 필요
> - Claude Code 환경에서 동작 제약 가능성
> - npm link를 먼저 시도해볼 것을 추천

### 환경 변수 영구 설정 (pnpm link 사용 시)
```bash
# ~/.zshrc 또는 ~/.bashrc에 추가
export PNPM_HOME="/Users/$USER/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"

# 적용
source ~/.zshrc
```

## ✅ 설치 확인

### 명령어 테스트
```bash
# CLI 도움말 확인
llms --help

# 버전 확인
llms --version

# 실제 기능 테스트
llms priority-stats
llms work-next --limit 5
```

### 설치 위치 확인
```bash
# llms 명령어 위치 확인
which llms
# 출력 예시: /Users/username/Library/pnpm/llms

# pnpm 글로벌 디렉토리 확인
pnpm config get global-bin-dir
```

## 🎯 주요 사용법

### 기본 명령어
```bash
llms init                          # 프로젝트 초기화
llms work-next                     # 다음 작업 1개
llms work-next --limit 10          # 상위 10개 우선순위
llms priority-tasks                # 우선순위 작업 현황
llms priority-tasks --fix          # 우선순위 문제 자동 수정
llms generate-templates            # 템플릿 생성
llms clean-llms-generate --language en  # LLMS 파일 생성
```

### 고급 사용법
```bash
# 특정 언어 작업
llms work-next --language ko --limit 5

# 특정 카테고리 작업
llms work-next --category guide --limit 3

# 상세 출력
llms priority-tasks --verbose

# 미리보기 모드
llms generate-templates --dry-run
```

## 🗑️ CLI 제거

### NPM 글로벌 제거
```bash
npm uninstall -g @context-action/llms-generator
# 또는
pnpm remove -g @context-action/llms-generator
```

### npm link 제거
```bash
# 프로젝트 디렉토리에서
cd packages/llms-generator
npm unlink

# 또는 글로벌에서 제거
npm unlink -g @context-action/llms-generator
```

### pnpm link 제거
```bash
cd packages/llms-generator
pnpm unlink --global
```

### 직접 삭제
```bash
# 위 방법이 안 될 경우
rm -f $(which llms)
```

## 🔧 문제 해결

### "command not found: llms"
```bash
# NPM 글로벌 설치 시 - 보통 자동 해결
npm i -g @context-action/llms-generator

# pnpm link 사용 시 - PATH 설정
echo $PATH | grep pnpm
export PNPM_HOME="/Users/$USER/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"
```

### 권한 문제
```bash
# 파일 권한 확인
ls -la $(which llms)
chmod +x $(which llms)
```

### 완전 재설치
```bash
# 기존 제거
npm uninstall -g @context-action/llms-generator
# 또는
pnpm unlink --global

# 재설치
npm i -g @context-action/llms-generator
```

## 📚 추가 정보

### 관련 문서
- [README.md](./README.md) - 전체 프로젝트 개요
- [WORK_NEXT_COMMAND.md](./docs/WORK_NEXT_COMMAND.md) - work-next 명령어 상세 가이드
- [INIT_COMMAND.md](./docs/INIT_COMMAND.md) - init 명령어 상세 가이드
- [LLMS_GENERATE_COMMAND.md](./docs/LLMS_GENERATE_COMMAND.md) - LLMS 생성 명령어 가이드

### pnpm vs npm
이 프로젝트는 pnpm을 사용합니다:
- 더 빠른 설치 속도
- 디스크 공간 절약
- 엄격한 의존성 관리

### 개발 모드에서 사용
개발 중에는 다음과 같이 직접 실행할 수도 있습니다:
```bash
# 프로젝트 루트에서
node packages/llms-generator/dist/cli/index.js work-next --limit 10
```

---

**참고**: 설치 문제가 발생하면 [GitHub Issues](https://github.com/context-action/issues)에서 도움을 요청하세요.