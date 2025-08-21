# LLMS Generator Documentation

Context-Action 프레임워크를 위한 LLM 최적화 문서 생성 시스템의 핵심 문서들입니다.

## 📚 문서 목록

### 🎯 전략 및 가이드라인
- **[adaptive-composition-strategy.md](./adaptive-composition-strategy.md)** - LLM 문서 조합 전략 완전 가이드
- **[extraction-guidelines.md](./extraction-guidelines.md)** - 문서 추출 가이드라인

### 🏗️ 시스템 구조
- **[data-structure.md](./data-structure.md)** - 최적화된 문서 구조 시스템

## 🚀 빠른 시작

1. **문서 생성 시작**: [adaptive-composition-strategy.md](./adaptive-composition-strategy.md)에서 LLM 문서 조합 전략 확인
2. **시스템 이해**: [data-structure.md](./data-structure.md)에서 전체 구조 파악
3. **문서 작성**: [extraction-guidelines.md](./extraction-guidelines.md)에서 추출 가이드라인 확인

## 🎯 주요 특징

- **적응형 조합**: 문자 제한에 따른 intelligent document composition
- **우선순위 기반**: priority.json을 활용한 체계적 문서 관리
- **다국어 지원**: 한국어/영어 동시 지원
- **템플릿 시스템**: 자동 생성된 개별 요약 문서 템플릿

## 📊 시스템 구조 요약

```
packages/llms-generator/
├── src/                 # TypeScript 소스 코드
├── data/               # Priority 파일 및 템플릿
│   ├── ko/            # 한국어 문서 (26개)
│   └── en/            # 영어 문서 (102개)
├── docs/              # 시스템 문서 (이 디렉토리)
└── llms-generator.config.json  # 설정 파일
```

## 🔧 CLI 설치 및 사용법

### 🚀 글로벌 CLI 설치 방법

**방법 1: NPM 글로벌 설치** (권장)
```bash
# 패키지 배포 후 사용 가능
npm i -g @context-action/llms-generator
# 또는
pnpm add -g @context-action/llms-generator

# 설치 완료 - 바로 사용
llms --help
llms work-next --limit 10
```

**방법 2: 로컬 패키지 글로벌 설치** (개발/테스트용)
```bash
# 1. llms-generator 디렉토리로 이동
cd packages/llms-generator

# 2. 빌드 및 패키징
pnpm build
npm pack

# 3. 글로벌 설치
npm i -g ./context-action-llms-generator-0.3.0.tgz

# 4. 설치 완료 - 바로 사용
llms --help
```

**방법 3: npm link 사용** (개발용 - 빠른 테스트)
```bash
# 1. llms-generator 디렉토리로 이동
cd packages/llms-generator

# 2. 빌드 및 글로벌 링크
pnpm build
npm link

# 3. 설치 완료 - 바로 사용
llms --help
llms priority-stats
```

**방법 4: 직접 실행** (개발용)
```bash
# 1. llms-generator 디렉토리로 이동
cd packages/llms-generator

# 2. 빌드
pnpm build

# 3. 직접 실행
node dist/cli/index.js --help
node dist/cli/index.js priority-stats
node dist/cli/index.js work-next --limit 10
```

### 🎯 사용 방법 (4가지)

#### 방법 1: llms 명령어 (글로벌 CLI - 권장) 🎆
```bash
# 어디서나 사용 가능
llms --help
llms init
llms work-next --limit 10
llms priority-tasks --fix  
llms generate-templates
llms clean-llms-generate --language ko
```

#### 방법 2: pnpm 스크립트 (프로젝트 루트에서)
```bash
# 워크플로우 관리
pnpm llms:work-next                     # 다음 작업 1개
pnpm llms:work-top10                    # 상위 10개 우선순위
pnpm llms:work-top20                    # 상위 20개 우선순위

# 우선순위 관리
pnpm llms:priority-stats                # 우선순위 통계
pnpm llms:priority-health               # 시스템 건강도 확인
pnpm llms:priority-tasks                # Priority.json 파일 관리
pnpm llms:priority-tasks:fix            # Priority 문제 자동 수정

# 문서 동기화
pnpm llms:sync-docs                     # 모든 언어
pnpm llms:sync-docs:ko                  # 한국어만
pnpm llms:sync-docs:en                  # 영어만

# 템플릿 생성
pnpm llms:generate-templates            # 모든 템플릿 생성

# LLMS 파일 생성
pnpm llms:docs                          # 모든 언어 LLMS 생성
pnpm llms:docs:en                       # 영어만
pnpm llms:docs:ko                       # 한국어만

# 프로젝트 초기화
pnpm llms:init                          # 완전한 프로젝트 설정
```

#### 방법 3: npm link (개발용 - 빠른 테스트)
```bash
# npm link 후 어디서나 사용 가능
llms --help
llms work-next --limit 10

# 수정 후 재빌드만 하면 바로 반영
cd packages/llms-generator && pnpm build
```

#### 방법 4: 직접 실행 (개발용)
```bash
# packages/llms-generator 디렉토리에서
node dist/cli/index.js --help
node dist/cli/index.js work-next --limit 10

# 또는 프로젝트 루트에서
node packages/llms-generator/dist/cli/index.js --help
```

### 🔄 전체 워크플로우 예시

**글로벌 CLI 방식 (권장)**
```bash
# 1. CLI 설치 (한 번만)
npm i -g @context-action/llms-generator

# 2. 프로젝트 초기화
llms init

# 3. 우선순위 작업 확인
llms priority-tasks

# 4. 상위 10개 작업 확인
llms work-next --limit 10

# 5. 템플릿 생성
llms generate-templates

# 6. LLMS 파일 생성
llms clean-llms-generate --language en
llms clean-llms-generate --language ko
```

**로컬 개발 방식**
```bash
# 1. 로컬 CLI 설치
cd packages/llms-generator
pnpm build && npm pack
npm i -g ./context-action-llms-generator-0.3.0.tgz

# 2. 어디서나 사용 가능
llms init
llms priority-tasks
llms work-next --limit 10
llms generate-templates
```

**npm link 방식**
```bash
# 1. npm link 설치
cd packages/llms-generator
pnpm build && npm link

# 2. 어디서나 사용 가능
llms init
llms priority-tasks
llms work-next --limit 10

# 수정 후 재빌드만 하면 바로 반영
pnpm build
```

**직접 실행 방식**
```bash
# 1. 빌드
cd packages/llms-generator && pnpm build

# 2. 직접 실행
node dist/cli/index.js init
node dist/cli/index.js priority-tasks
node dist/cli/index.js work-next --limit 10
```

### 🗑️ CLI 제거

**NPM 글로벌 제거**
```bash
# npm으로 설치한 경우
npm uninstall -g @context-action/llms-generator

# pnpm으로 설치한 경우
pnpm remove -g @context-action/llms-generator
```

**로컬 패키지 글로벌 제거**
```bash
# 로컬 .tgz로 설치한 경우
npm uninstall -g @context-action/llms-generator

# 또는 직접 삭제
rm -f $(which llms)
```

**npm link 제거**
```bash
# npm link로 설치한 경우
cd packages/llms-generator
npm unlink

# 또는 글로벌에서 제거
npm unlink -g @context-action/llms-generator
```

**직접 실행 방식**
```bash
# 제거할 것 없음 - 단순히 node 명령어 사용
# 필요시 dist/ 디렉토리만 삭제
rm -rf packages/llms-generator/dist/
```

---

> **참고**: 이 시스템은 Context-Action 프레임워크의 문서를 LLM에서 효율적으로 활용하기 위해 설계되었습니다.