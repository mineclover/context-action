# @context-action/llms-generator

LLM을 위한 적응형 콘텐츠 생성 시스템입니다. 문서의 우선순위와 글자 수 제한에 따라 최적의 콘텐츠를 조합하여 제공합니다.

## 🎯 주요 기능

- **적응형 조합**: 요청된 글자 수에 맞춰 우선순위 기반으로 최적 콘텐츠 조합
- **우선순위 관리**: 문서별 중요도와 추출 전략 관리
- **다중 글자 수 지원**: 100자, 300자, 1000자 등 다양한 길이의 요약 지원
- **목차 자동 생성**: 100자 요약을 활용한 자동 목차 생성
- **CLI 도구**: 추출, 조합, 통계 등 완전한 관리 도구

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