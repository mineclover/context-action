# @context-action/llms-generator

LLM을 위한 적응형 콘텐츠 생성 시스템입니다. 문서의 우선순위와 글자 수 제한에 따라 최적의 콘텐츠를 조합하여 제공합니다.

## 🎯 주요 기능

- **간소화된 설정 시스템**: `characterLimits`, `languages`, `paths`만으로 구성된 단순 설정
- **적응형 조합**: 요청된 글자 수에 맞춰 우선순위 기반으로 최적 콘텐츠 조합
- **우선순위 관리**: 문서별 중요도와 추출 전략 관리
- **다중 글자 수 지원**: 설정 가능한 다양한 길이의 요약 지원
- **다국어 지원**: 한국어, 영어, 일본어, 중국어, 인도네시아어 등
- **목차 자동 생성**: 100자 요약을 활용한 자동 목차 생성
- **CLI 도구**: 설정, 추출, 조합, 통계 등 완전한 관리 도구

## ⚙️ 빠른 시작

### 1. 설정 파일 생성

```bash
# 표준 설정으로 초기화
npx @context-action/llms-generator config-init standard

# 다른 프리셋 사용
npx @context-action/llms-generator config-init minimal    # [100, 500]
npx @context-action/llms-generator config-init extended   # [50, 100, 300, 500, 1000, 2000, 4000]
npx @context-action/llms-generator config-init blog       # [200, 500, 1500]
```

### 2. 설정 확인 및 검증

```bash
# 현재 설정 확인
npx @context-action/llms-generator config-show

# 설정 검증
npx @context-action/llms-generator config-validate

# 글자 수 제한 확인
npx @context-action/llms-generator config-limits
```

## 📋 설정 파일 (`llms-generator.config.json`)

```json
{
  "characterLimits": [100, 300, 1000, 2000],
  "languages": ["ko", "en", "ja"],
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./packages/llms-generator/data",
    "outputDir": "./docs/llms"
  }
}
```

## 🚀 사용 시나리오

### 시나리오 1: 초기 설정 및 우선순위 생성

```bash
# 1. 문서 발견 및 우선순위 파일 생성
npx @context-action/llms-generator priority-generate ko --dry-run
npx @context-action/llms-generator priority-generate ko --overwrite

# 2. 생성된 우선순위 확인
npx @context-action/llms-generator priority-stats ko

# 3. 발견된 문서 목록 확인
npx @context-action/llms-generator discover ko
```

### 시나리오 2: 콘텐츠 요약 추출

```bash
# 1. 기본 글자 수 제한으로 요약 추출
npx @context-action/llms-generator extract ko --chars=100,300,1000

# 2. 모든 언어에 대해 일괄 추출
npx @context-action/llms-generator extract-all --lang=en,ko --overwrite

# 3. 추출 결과 확인
npx @context-action/llms-generator compose-stats ko
```

### 시나리오 3: 적응형 콘텐츠 조합

```bash
# 1. 5000자 콘텐츠 조합 (목차 포함)
npx @context-action/llms-generator compose ko 5000

# 2. 고우선순위 문서만으로 3000자 조합
npx @context-action/llms-generator compose ko 3000 --priority=85

# 3. 목차 없이 10000자 조합
npx @context-action/llms-generator compose ko 10000 --no-toc

# 4. 여러 글자 수 일괄 조합
npx @context-action/llms-generator compose-batch ko --chars=1000,3000,5000,10000
```

### 시나리오 4: 프로덕션 워크플로우

```bash
# 1. 새 문서 추가 후 우선순위 업데이트
npx @context-action/llms-generator priority-generate ko --overwrite

# 2. 콘텐츠 추출 (실제 요약은 수동/LLM으로 진행)
npx @context-action/llms-generator extract ko --overwrite

# 3. 수동/LLM으로 data/ko/*/document-*.txt 파일들을 고품질 요약으로 대체

# 4. 최종 조합 테스트
npx @context-action/llms-generator compose ko 5000 --priority=70

# 5. 조합 결과를 llms.txt 또는 API 응답으로 사용
```

## 📁 디렉토리 구조

```
packages/llms-generator/
├── src/
│   ├── core/
│   │   ├── AdaptiveComposer.ts      # 적응형 조합 엔진
│   │   ├── ContentExtractor.ts      # 콘텐츠 추출기
│   │   ├── PriorityGenerator.ts     # 우선순위 생성기
│   │   └── PriorityManager.ts       # 우선순위 관리자
│   ├── cli/
│   │   └── index.ts                 # CLI 인터페이스
│   └── types/                       # 타입 정의
├── data/                            # 생성된 데이터 (git 제외)
│   ├── priority-schema.json         # 우선순위 스키마
│   ├── ko/                         # 한국어 콘텐츠
│   │   ├── guide-action-handlers/
│   │   │   ├── priority.json       # 우선순위 메타데이터
│   │   │   ├── guide-action-handlers-100.txt
│   │   │   ├── guide-action-handlers-300.txt
│   │   │   └── guide-action-handlers-1000.txt
│   │   └── ...
│   └── en/                         # 영어 콘텐츠
│       └── ...
└── scripts/                        # 유틸리티 스크립트
    └── simplify-priorities.js      # 우선순위 간소화
```

## 🛠️ 데이터 관리

### 우선순위 메타데이터 (priority.json)

```json
{
  "document": {
    "id": "guide-action-handlers",
    "title": "액션 핸들러",
    "source_path": "guide/action-handlers.md",
    "category": "guide"
  },
  "priority": {
    "score": 80,
    "tier": "essential"
  },
  "extraction": {
    "strategy": "concept-first",
    "character_limits": {
      "100": { "focus": "핸들러 기본 개념" },
      "300": { "focus": "핸들러 구조와 패턴" },
      "1000": { "focus": "완전한 핸들러 구현과 예제" }
    }
  }
}
```

### 요약 파일 명명 규칙

- `{document-id}-{character-limit}.txt`
- 예: `guide-action-handlers-100.txt`, `guide-action-handlers-300.txt`

## 🎯 적응형 조합 알고리즘

1. **목차 생성**: 100자 요약을 우선순위 순으로 배열하여 기본 목차 생성
2. **공간 계산**: 전체 글자 수에서 목차 글자 수를 제외한 콘텐츠 공간 계산  
3. **최적 선택**: 우선순위 높은 순서로 남은 공간에 맞는 최대 길이 요약 선택
4. **공간 활용**: 99%+ 공간 활용률을 목표로 최적 조합

## 📊 성능 지표

- **공간 활용률**: 목표 글자 수의 95% 이상 활용
- **우선순위 준수**: 높은 우선순위 문서 우선 선택
- **조합 속도**: 1000개 문서 기준 < 100ms

## 🔧 개발 명령어

```bash
# 패키지 빌드
pnpm build:llms-generator

# 테스트 실행  
pnpm test:llms-generator

# CLI 도움말
npx @context-action/llms-generator help
```

## 🎛️ CLI 옵션 가이드

### 핵심 옵션들

#### `--overwrite` 
**의미**: 기존 파일이 있을 때 덮어쓰기 허용  
**사용 명령어**: `priority-generate`, `schema-generate`, `markdown-generate`, `extract`, `extract-all`

```bash
# 기존 priority.json 파일들을 덮어씀
npx @context-action/llms-generator priority-generate ko --overwrite

# 기존 요약 파일들을 덮어씀  
npx @context-action/llms-generator extract ko --chars=100,300 --overwrite
```

#### `--dry-run`
**의미**: 실제로 실행하지 않고 미리보기만 수행

```bash
# 어떤 파일들이 생성될지 미리 확인
npx @context-action/llms-generator priority-generate ko --dry-run
npx @context-action/llms-generator extract ko --dry-run
```

#### `--path=<경로>`
**의미**: 설정 파일 경로 지정

```bash
# 커스텀 경로에 설정 파일 생성
npx @context-action/llms-generator config-init standard --path=my-config.json
```

#### `--lang=<언어목록>`
**의미**: 처리할 언어들을 명시적으로 지정

```bash
# 여러 언어로 배치 작업
npx @context-action/llms-generator batch --lang=ko,en,ja
npx @context-action/llms-generator markdown-all --lang=ko,en
```

#### `--chars=<글자수목록>`
**의미**: 처리할 글자 수 제한 지정

```bash
# 특정 글자 수로만 생성
npx @context-action/llms-generator extract ko --chars=100,300,1000
npx @context-action/llms-generator batch --chars=300,1000,2000
```

### 고급 옵션들

#### 콘텐츠 조합 옵션
- `--no-toc`: 목차(Table of Contents) 생성 비활성화
- `--priority=<숫자>`: 우선순위 임계값 설정

```bash
# 목차 없이 콘텐츠 구성
npx @context-action/llms-generator compose ko 5000 --no-toc

# 우선순위 50 이상인 문서만 포함
npx @context-action/llms-generator compose ko 5000 --priority=50
```

#### 스키마 관련 옵션
- `--no-types`: TypeScript 타입 생성 생략
- `--no-validators`: 검증기 생성 생략  
- `--javascript`: TypeScript 대신 JavaScript 생성
- `--cjs`: CommonJS 형식으로 생성 (기본값: ESM)

#### 작업 상태 관리 옵션
- `--need-edit`: 수동 편집이 필요한 문서만 표시
- `--outdated`: 오래된 파일들만 표시
- `--missing`: 누락된 파일들만 표시
- `--need-update`: 업데이트가 필요한 파일들만 표시

```bash
# 수동 편집이 필요한 문서 확인
npx @context-action/llms-generator work-status ko --need-edit

# 누락된 파일 확인
npx @context-action/llms-generator work-list ko --chars=100 --missing
```

### 옵션 조합 예시

```bash
# 안전한 테스트: dry-run으로 미리보기
npx @context-action/llms-generator priority-generate ko --dry-run

# 기존 파일 덮어쓰며 특정 글자수로만 콘텐츠 추출
npx @context-action/llms-generator extract ko --chars=100,300 --overwrite

# 모든 언어에 대해 마크다운 생성 (기존 파일 덮어쓰기)
npx @context-action/llms-generator markdown-all --lang=ko,en --overwrite

# 높은 우선순위만으로 목차 없이 콘텐츠 구성
npx @context-action/llms-generator compose ko 3000 --no-toc --priority=70
```

## 📝 사용 팁

1. **우선순위 설정**: 핵심 문서는 90점 이상, 일반 문서는 70-80점으로 설정
2. **요약 품질**: ContentExtractor는 기본 골격만 제공하므로 실제 요약은 수동/LLM으로 개선
3. **글자 수 전략**: 100자(목차용), 300자(개요용), 1000자(상세용)로 구분하여 작성
4. **정기 업데이트**: 문서 변경시 우선순위와 요약을 함께 업데이트

## 🚨 주의사항

- `data/` 디렉토리는 git에서 제외됨 (생성된 콘텐츠)
- 우선순위 점수는 0-100 범위에서 설정
- 요약 파일은 UTF-8 인코딩으로 저장
- CLI 명령어는 프로젝트 루트에서 실행 권장

## 🤝 기여하기

1. 새로운 추출 전략 추가
2. 조합 알고리즘 개선
3. 다국어 지원 확장
4. 성능 최적화

---

이 시스템은 Context-Action 프레임워크 문서를 LLM이 효율적으로 활용할 수 있도록 최적화된 형태로 제공합니다.