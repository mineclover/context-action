# LLMstxt 생성 메인 워크플로우

## 🎯 메인 시나리오: 문서 전체 한번에 파싱

전체 문서를 일괄 처리하여 LLMstxt 형식으로 변환하는 것이 주요 사용 패턴입니다.

### 1단계: 전체 문서 발견 및 우선순위 생성

```bash
# 모든 언어의 문서 발견
npx @context-action/llms-generator discover ko
npx @context-action/llms-generator discover en

# 전체 문서에 대한 우선순위 파일 일괄 생성
npx @context-action/llms-generator priority-generate ko --overwrite
npx @context-action/llms-generator priority-generate en --overwrite
```

### 2단계: 전체 문서 요약 일괄 추출

```bash
# 모든 글자 수 제한으로 일괄 요약 생성
npx @context-action/llms-generator extract-all --lang=ko,en --overwrite

# 또는 특정 글자 수만 지정
npx @context-action/llms-generator extract ko --chars=100,200,300,400 --overwrite
npx @context-action/llms-generator extract en --chars=100,200,300,400 --overwrite
```

### 3단계: LLMstxt YAML 형식으로 변환

```bash
# YAML 형식으로 마크다운 생성 (VitePress 호환)
npx @context-action/llms-generator markdown-all --lang=ko,en --overwrite

# 특정 글자 수만 처리
npx @context-action/llms-generator markdown-generate ko --chars=100,200,300 --overwrite
```

### 4단계: 다양한 길이로 적응형 조합 테스트

```bash
# 여러 길이로 일괄 조합 테스트
npx @context-action/llms-generator compose-batch ko --chars=1000,3000,5000,10000
npx @context-action/llms-generator compose-batch en --chars=1000,3000,5000,10000

# 특정 우선순위 이상만 포함
npx @context-action/llms-generator compose ko 5000 --priority=80
```

## 🛠️ 보조 시나리오: 개별 문서 수정

전체 처리 후 특정 문서의 품질을 개선할 때 사용하는 패턴입니다.

### 수정이 필요한 문서 확인

```bash
# 편집이 필요한 문서들 확인
npx @context-action/llms-generator work-list ko --chars=100 --need-update
npx @context-action/llms-generator work-list ko --chars=100 --missing

# 전체 작업 상태 확인
npx @context-action/llms-generator work-status ko
```

### 개별 문서 편집 컨텍스트 확인

```bash
# 특정 문서의 편집 컨텍스트 보기
npx @context-action/llms-generator work-context ko guide-action-handlers --chars=100
npx @context-action/llms-generator work-context ko guide-action-pipeline --chars=200
```

### 수동 편집 후 상태 업데이트

```bash
# 편집 후 상태 재확인
npx @context-action/llms-generator work-status ko guide-action-handlers --chars=100

# 조합 결과 테스트
npx @context-action/llms-generator compose ko 5000
```

## 📊 YAML 템플릿 기반 LLMstxt 형식

### 표준 파일 구조

```
packages/llms-generator/data/
├── ko/
│   ├── guide-action-handlers/
│   │   ├── priority.json                           # 우선순위 메타데이터
│   │   ├── guide-action-handlers-100.yaml         # YAML 형식 요약
│   │   ├── guide-action-handlers-200.yaml
│   │   └── guide-action-handlers-300.yaml
│   └── guide-action-pipeline/
│       ├── priority.json
│       ├── guide-action-pipeline-100.yaml
│       └── guide-action-pipeline-200.yaml
└── en/
    └── ... (영어 문서들)
```

### YAML 템플릿 구조

```yaml
document:
  path: "ko/guide/action-handlers.md"     # 실제 파일 위치
  title: "액션 핸들러"                      # 문서 제목
  id: "guide-action-handlers"             # 고유 ID
  category: "guide"                       # 카테고리

priority:
  score: 90                               # 우선순위 점수
  tier: "essential"                       # 우선순위 티어

summary:
  character_limit: 100                    # 글자 수 제한
  focus: "핸들러 기본 개념"                 # 중점 내용
  strategy: "concept-first"               # 추출 전략
  language: "ko"                          # 언어

content: |
  실제 요약 내용이 여기에 들어갑니다...

work_status:
  created: "2025-08-14T21:14:34.753Z"
  modified: "2025-08-14T21:14:34.753Z" 
  edited: true
  needs_update: false
```

## 🚀 자동화 스크립트 예시

### 전체 파이프라인 스크립트

```bash
#!/bin/bash
# full-pipeline.sh - 전체 문서 LLMstxt 생성 파이프라인

echo "🔍 문서 발견 중..."
npx @context-action/llms-generator discover ko
npx @context-action/llms-generator discover en

echo "📋 우선순위 생성 중..."
npx @context-action/llms-generator priority-generate ko --overwrite
npx @context-action/llms-generator priority-generate en --overwrite

echo "📝 요약 추출 중..."
npx @context-action/llms-generator extract-all --lang=ko,en --overwrite

echo "📄 YAML 마크다운 생성 중..."
npx @context-action/llms-generator markdown-all --lang=ko,en --overwrite

echo "🎯 조합 테스트 중..."
npx @context-action/llms-generator compose-batch ko --chars=1000,3000,5000
npx @context-action/llms-generator compose-batch en --chars=1000,3000,5000

echo "✅ 전체 파이프라인 완료!"
```

### 품질 확인 스크립트

```bash
#!/bin/bash
# quality-check.sh - 생성된 콘텐츠 품질 확인

echo "📊 작업 상태 확인..."
npx @context-action/llms-generator work-status ko
npx @context-action/llms-generator work-status en

echo "📈 조합 통계 확인..."
npx @context-action/llms-generator compose-stats ko
npx @context-action/llms-generator compose-stats en

echo "🔍 편집 필요 문서 확인..."
npx @context-action/llms-generator work-list ko --chars=100 --need-update
npx @context-action/llms-generator work-list en --chars=100 --need-update
```

## 💡 사용 팁

### 효율적인 워크플로우

1. **초기 설정**: `full-pipeline.sh` 스크립트로 전체 파이프라인 실행
2. **품질 검토**: `quality-check.sh`로 결과 확인
3. **선택적 개선**: 필요한 문서만 수동 편집
4. **최종 검증**: 조합 테스트로 결과 확인

### 우선순위 설정 가이드

- **90-100점**: 핵심 API 문서, 필수 가이드
- **80-89점**: 중요한 개념 문서, 아키텍처 가이드  
- **70-79점**: 일반적인 가이드, 사용법 문서
- **60-69점**: 예시, 참조 문서
- **50점 이하**: 보조 자료, 부록

### 글자 수 전략

- **100자**: 목차용 핵심 개념 (TOC generation)
- **200자**: 빠른 개요 (Quick overview)
- **300자**: 상세 설명 (Detailed explanation)
- **400자+**: 완전한 가이드 (Complete guide)

---

**메인 시나리오**: 전체 문서 일괄 처리 → LLMstxt YAML 생성 → 적응형 조합  
**보조 시나리오**: 개별 문서 품질 개선 → 선택적 편집 → 재조합