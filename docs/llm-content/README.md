# Context-Action Framework - Optimized Document Structure

Context-Action 프레임워크를 위한 **최적화된 문서 구조 시스템**입니다. 실제 문서를 기반으로 폴더별로 구분하여 minimum, origin, 글자수별 버전으로 체계적으로 관리합니다.

## 📁 현재 구조

```
docs/llm-content/
├── README.md                           # 이 문서
├── EXTRACTION_GUIDELINES.md            # 추출 가이드라인
├── FINAL_STRUCTURE_ANALYSIS.md         # 구조 분석 보고서
├── priority-schema.json                # JSON 스키마 정의
│
├── en/                                 # 영어 문서 (44개)
│   ├── guide-concepts/                 # 개념 가이드
│   │   ├── priority.json                   # 🎯 문서별 우선순위 & 추출 가이드
│   │   ├── guide-concepts-100.txt          # 📝 100자 요약
│   │   ├── guide-concepts-300.txt          # 📝 300자 요약
│   │   ├── guide-concepts-500.txt          # 📝 500자 요약
│   │   ├── guide-concepts-1000.txt         # 📝 1K자 요약
│   │   ├── guide-concepts-2000.txt         # 📝 2K자 요약
│   │   ├── guide-concepts-3000.txt         # 📝 3K자 요약
│   │   └── guide-concepts-4000.txt         # 📝 4K자 요약
│   ├── api-action-only/                # API 문서
│   │   ├── priority.json                   # 🎯 문서별 우선순위 & 추출 가이드
│   │   └── ... (7개 크기별 추출 파일)
│   └── ... (총 44개 문서 폴더)
│
└── ko/                                 # 한글 문서 (18개)
    ├── guide-concepts/                 # 개념 가이드
    │   ├── priority.json                   # 🎯 문서별 우선순위 & 추출 가이드
    │   └── ... (7개 크기별 추출 파일)
    └── ... (총 18개 문서 폴더)
```

## 🎯 파일 타입별 용도

### 🎯 Priority Files (`priority.json`)
- **목적**: 문서별 우선순위 및 추출 가이드라인 관리
- **내용**: 우선순위 점수, 핵심 키워드, 문자수별 추출 전략, 품질 기준
- **스키마**: `priority-schema.json`으로 구조 검증
- **예시**: 각 문서 폴더의 `priority.json`

### 📝 Extraction Files (9가지 타입)

#### 🔗 Minimum Files (`-minimum.txt`)
- **목적**: 빠른 네비게이션과 경로 정보
- **내용**: 문서 링크 + 간단한 설명 + 관련 문서
- **llms.txt 조합 시**: 경로/링크 참조 정보로 활용

#### 📄 Origin Files (`-origin.txt`)
- **목적**: 원본 문서 완전 보존
- **내용**: 소스 마크다운 파일의 완전한 복사본
- **llms.txt 조합 시**: 문서 그대로의 내용으로 활용

#### 📝 Character-Limited Files (`-[100|300|500|1000|2000|3000|4000].txt`)
- **목적**: 글자수 제한 내에서 요약된 내용
- **내용**: priority.json 가이드라인에 따라 추출된 핵심 내용
- **우선순위**: 300, 1000, 2000자가 가장 중요
- **예시**: `guide-concepts-300.txt`

## 🚀 사용 방법

### 1. Priority 시스템 관리

```bash
# 전체 상태 확인
pnpm docs:priority:status

# 우선순위별 작업 목록
pnpm docs:priority:critical     # Critical tier (7개 문서)
pnpm docs:priority:essential    # Essential tier (32개 문서)
pnpm docs:priority:worklist     # 모든 문서 작업 목록

# 특정 문서 정보
pnpm docs:priority info guide-concepts

# 스키마 검증
pnpm docs:priority:validate

# 누락된 priority.json 파일 생성
pnpm docs:priority:generate
```

### 2. 문서 추출 작업 프로세스

1. **Priority.json 확인**: 해당 문서의 추출 가이드라인 검토
2. **키워드 파악**: primary, technical, patterns 키워드 숙지
3. **전략 확인**: extraction.strategy에 따른 접근 방식
4. **글자수별 작업**: 300자 → 1000자 → 2000자 순으로 진행
5. **품질 검증**: completeness_threshold 및 consistency_checks 확인

## 📊 YAML 메타데이터 구조

각 파일은 다음과 같은 YAML 메타데이터를 포함합니다:

```yaml
---
source: "guide/concepts.md"                # 원본 파일 경로
title: "Core Concepts"                     # 문서 제목
document_id: "guide-concepts"              # 문서 식별자
file_type: "minimum"                       # 파일 타입
priority: 95                               # 우선순위 (10-100)
original_size: 10496                       # 원본 크기
status: "placeholder"                      # 상태값
created: "2025-08-14"                      # 생성날짜
language: "en"                             # 언어
---
```

## 🔧 상태 관리

### 상태 값
- `placeholder`: 아직 작성되지 않음
- `draft`: 내용 추가됨, 검토 필요
- `complete`: 내용 완성, 글자수 범위 내
- `review`: 글자수 또는 품질 검토 필요

### 글자수 제한 가이드라인

- **100자**: 핵심 개념만
- **300자**: 주요 개념 + 간단한 설명
- **500-1000자**: 주요 개념 + 예제
- **2000+자**: 포괄적 내용 + 상세 예제

## 📈 현재 상태

### 생성된 구조
- **언어**: 2개 (영어, 한글)
- **총 문서**: 62개 (영어 44개, 한글 18개)
- **Priority 파일**: 62개 (100% 완성)
- **추출 파일**: 434개 (7개 크기 × 62개 문서)
- **평균 우선순위**: 75/100점
- **스키마 검증**: 모든 파일 유효

### 우선순위 분포
- **Critical (7개)**: guide-concepts, guide-overview, guide-getting-started 등
- **Essential (32개)**: 대부분의 가이드 문서들
- **Important (11개)**: API 참조 문서들  
- **Reference (12개)**: 고급/참조용 문서들

### 다음 단계
1. **Critical 문서 우선 작업**: 7개 핵심 문서부터 시작
2. **300자 추출**: 빠른 이해를 위한 핵심 요약
3. **1000자 확장**: 실용적 정보 포함
4. **2000자 완성**: 종합적 이해 제공

## 🔍 품질 기준

1. **Minimum 파일**: 문서 경로, 관련 링크, 네비게이션 정보 포함
2. **Origin 파일**: 소스 마크다운의 완전한 복사본 (수정 금지)
3. **글자수 제한**: 목표의 ±10% 범위 내
4. **정보 보존**: 핵심 의미 유지
5. **일관성**: 확립된 패턴 준수
6. **llms.txt 조합**: minimum (경로), origin (문서), 글자수별 (요약) 역할 구분

## 🛠️ 관련 스크립트

```bash
# 문서 상태 확인
pnpm docs:status

# 구조 분석
pnpm docs:analyze

# 완전한 문서 빌드
pnpm docs:full
```

## 📋 추출 가이드라인

자세한 추출 가이드라인은 `EXTRACTION_GUIDELINES.md`를 참조하세요.

---

**System Type**: Optimized Document Structure with Minimum/Origin Types  
**Generated**: 2025-08-14  
**Total Documents**: 59  
**Total Files**: 531  
**Status**: Structure Created, Content Extraction In Progress