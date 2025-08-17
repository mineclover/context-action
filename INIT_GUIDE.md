# LLMs Generator Init Command - 프로젝트 문서 초기화 가이드

## 🚀 빠른 시작

Context-Action 프로젝트의 문서 관리를 위한 완전 자동화된 초기화 도구입니다.

```bash
# 프로젝트 루트에서 실행
npx @context-action/llms-generator init
```

단 하나의 명령어로 전체 프로젝트 문서가 구조화되고 템플릿이 생성됩니다.

## 📋 init 명령어란?

`init` 명령어는 기존의 여러 단계를 하나로 통합한 **올인원 초기화 도구**입니다:

### 기존 방식 (4-5단계)
```bash
# 😓 번거로운 기존 방식
npx @context-action/llms-generator discover en
npx @context-action/llms-generator discover ko  
npx @context-action/llms-generator priority-generate en --overwrite
npx @context-action/llms-generator priority-generate ko --overwrite
npx @context-action/llms-generator template-generate
```

### 새로운 방식 (1단계)
```bash
# ✨ 간단한 새로운 방식
npx @context-action/llms-generator init
```

## 🎯 무엇을 하나요?

### 1. 📚 Document Discovery
- `docs/` 디렉토리의 모든 마크다운 파일 스캔
- 카테고리별 자동 분류 (guide, api, concept, examples)
- 언어별 문서 개수 집계

```
🔍 Step 1: Document Discovery
  📚 Discovering en documents...
     Found 102 documents
     - api: 87 docs
     - concept: 5 docs
     - example: 4 docs
     - guide: 6 docs
```

### 2. 📊 Priority JSON 생성
- 각 문서마다 우선순위 메타데이터 생성
- 카테고리 기반 점수 할당
- 문자 제한별 추출 전략 설정

```
📊 Step 2: Priority JSON Generation
  🏷️  Generating priority files for en...
📝 Generating priority for: api--action-only
✅ Generated: /data/en/api--action-only/priority.json
     Generated: 102
     Skipped: 0
```

### 3. 📝 Template 생성
- 7가지 문자 제한별 템플릿 생성 (100, 200, 300, 500, 1000, 2000, 5000)
- 작성 가이드라인 포함
- 키워드 및 메타데이터 제공

```
📝 Step 3: Template Generation
  📋 Generating individual summary templates...
✅ Generated templates for /data/en/api--action-only/priority.json
   ✅ Template generation completed
```

## 📁 결과물

`init` 실행 후 생성되는 구조:

```
data/
├── en/                           # 영어 문서 (102개)
│   ├── api--action-only/
│   │   ├── priority.json         # 우선순위 및 메타데이터
│   │   ├── api--action-only-100.md   # 100자 템플릿
│   │   ├── api--action-only-200.md   # 200자 템플릿
│   │   ├── api--action-only-300.md   # 300자 템플릿
│   │   ├── api--action-only-500.md   # 500자 템플릿
│   │   ├── api--action-only-1000.md  # 1000자 템플릿
│   │   ├── api--action-only-2000.md  # 2000자 템플릿
│   │   └── api--action-only-5000.md  # 5000자 템플릿
│   └── ... (101개 더)
└── ko/                           # 한국어 문서 (26개)
    └── ... (동일한 구조)
```

**총 생성 파일**: 1,024개
- Priority JSON: 128개 (102 + 26)
- 템플릿 파일: 896개 (128 × 7)

## 🛠️ 사용 옵션

### 기본 사용법
```bash
# 전체 초기화
npx @context-action/llms-generator init

# 미리보기 (파일 생성 없음)
npx @context-action/llms-generator init --dry-run

# 조용한 모드
npx @context-action/llms-generator init --quiet

# 기존 파일 덮어쓰기
npx @context-action/llms-generator init --overwrite
```

### 단계별 제어
```bash
# Discovery 건너뛰기
npx @context-action/llms-generator init --skip-discovery

# Priority 생성 건너뛰기  
npx @context-action/llms-generator init --skip-priority

# Template 생성 건너뛰기
npx @context-action/llms-generator init --skip-templates

# 조합 사용
npx @context-action/llms-generator init --skip-discovery --quiet
```

## ⚙️ Config 기반 동작

`llms-generator.config.json` 설정을 자동으로 읽어서 실행:

```json
{
  "paths": {
    "docsDir": "./docs",           # 문서 위치
    "llmContentDir": "./data",     # 결과 출력 위치
    "outputDir": "./docs/llms"     # 최종 LLMS 파일 위치
  },
  "generation": {
    "supportedLanguages": ["en", "ko"],                    # 지원 언어
    "characterLimits": [100, 200, 300, 500, 1000, 2000, 5000], # 문자 제한
    "defaultLanguage": "en"
  },
  "categories": {
    "guide": { "priority": 95 },     # 가이드 문서 우선순위
    "api": { "priority": 90 },       # API 문서 우선순위
    "concept": { "priority": 85 },   # 개념 문서 우선순위
    "examples": { "priority": 80 }   # 예제 문서 우선순위
  }
}
```

## 🎯 다음 단계

### 1. 템플릿 편집
생성된 템플릿 파일의 내용 작성:

```markdown
## 템플릿 내용 (100자 이내)

```markdown
<!-- 여기에 100자 이내의 요약 내용을 작성하세요 -->

Action Only Pattern은 순수 액션 디스패칭을 위한 패턴으로, 상태 관리 없이 이벤트 처리에 특화된 Context-Action 기능입니다.
```
```

### 2. 최종 LLMS 파일 생성
```bash
# 모든 템플릿을 통합하여 최종 LLMS 파일 생성
npx @context-action/llms-generator simple-llms-batch

# 결과 확인
ls docs/llms/
# ├── llms-100chars-en.txt
# ├── llms-100chars-ko.txt
# ├── llms-200chars-en.txt
# ├── llms-200chars-ko.txt
# └── ... (총 14개 파일)
```

### 3. 작업 상태 추적
```bash
# 전체 작업 상태 확인
npx @context-action/llms-generator work-check

# 편집이 필요한 문서 목록
npx @context-action/llms-generator work-list en --missing
```

## 💡 주요 장점

### ✅ 통합성
- 4-5개 명령어 → 1개 명령어로 단순화
- 설정 기반 자동 실행
- 단계별 진행 상황 표시

### ✅ 안정성  
- Dry-run 모드로 안전한 미리보기
- 단계별 건너뛰기로 유연한 제어
- 오류 시 명확한 피드백

### ✅ 효율성
- Config 기반 자동 설정
- 병렬 처리로 빠른 실행
- 메모리 최적화된 처리

### ✅ 사용자 친화성
- 명확한 진행 상황 표시
- 다음 단계 안내
- 문제 해결 도움말

## 🔧 문제 해결

### 일반적인 이슈

**스키마 파일 오류:**
```bash
❌ Priority schema not found
```
→ 첫 실행 시 자동 생성됨, 재실행하면 해결

**권한 오류:**
```bash
❌ EACCES: permission denied
```
→ 프로젝트 루트에서 실행하거나 권한 확인

**Config 파일 없음:**
```bash
📋 Loading legacy config  
```
→ `llms-generator.config.json` 파일 생성 필요

### 부분적 재실행

특정 단계만 다시 실행:
```bash
# Priority JSON만 재생성
npx @context-action/llms-generator priority-generate en --overwrite

# 템플릿만 재생성  
npx @context-action/llms-generator template-generate
```

## 📊 성능 정보

### 실행 시간
- **작은 프로젝트** (<50 문서): ~30초
- **중간 프로젝트** (50-200 문서): ~2분
- **큰 프로젝트** (200+ 문서): ~5분

### 메모리 사용량
- **작은 프로젝트**: ~100MB
- **중간 프로젝트**: ~300MB  
- **큰 프로젝트**: ~500MB+

## 🎉 결론

`init` 명령어는 Context-Action 프로젝트의 문서 관리를 혁신적으로 단순화합니다:

- **하나의 명령어**로 전체 프로젝트 초기화
- **Config 기반**으로 자동 설정 적용  
- **구조화된 템플릿**으로 일관된 문서 품질
- **단계별 제어**로 유연한 워크플로

이제 복잡한 문서 설정 과정 없이, 바로 콘텐츠 작성에 집중할 수 있습니다!

---

> **💡 팁**: `init --dry-run`으로 먼저 미리보기한 후, `init --overwrite`로 실제 실행하는 것을 권장합니다.