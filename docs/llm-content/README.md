# Context-Action Framework - Optimized Document Structure

Context-Action 프레임워크를 위한 **최적화된 문서 구조 시스템**입니다. 실제 문서를 기반으로 폴더별로 구분하여 minimum, origin, 글자수별 버전으로 체계적으로 관리합니다.

## 📁 현재 구조

```
docs/llm-content/
├── README.md                           # 이 문서
├── EXTRACTION_GUIDELINES.md            # 추출 가이드라인
├── FINAL_STRUCTURE_ANALYSIS.md         # 구조 분석 보고서
│
├── en/                                 # 영어 문서
│   ├── guide-concepts/                 # 개념 가이드
│   │   ├── guide-concepts-minimum.txt     # 🔗 링크 + 간단 설명
│   │   ├── guide-concepts-origin.txt      # 📋 원본 문서 전체
│   │   ├── guide-concepts-100.txt         # 📝 100자 요약
│   │   ├── guide-concepts-300.txt         # 📝 300자 요약
│   │   ├── guide-concepts-500.txt         # 📝 500자 요약
│   │   ├── guide-concepts-1000.txt        # 📝 1K자 요약
│   │   ├── guide-concepts-2000.txt        # 📝 2K자 요약
│   │   ├── guide-concepts-3000.txt        # 📝 3K자 요약
│   │   └── guide-concepts-4000.txt        # 📝 4K자 요약
│   ├── api-action-registry/            # API 레지스트리
│   │   ├── api-action-registry-minimum.txt
│   │   ├── api-action-registry-origin.txt
│   │   └── ... (동일한 패턴)
│   └── ... (42개 문서 폴더)
│
└── ko/                                 # 한글 문서
    ├── guide-concepts/                 # 개념 가이드
    │   ├── guide-concepts-minimum.txt
    │   ├── guide-concepts-origin.txt
    │   └── ... (동일한 패턴)
    └── ... (17개 문서 폴더)
```

## 🎯 파일 타입별 용도

### 📄 Minimum Files (`-minimum.txt`)
- **목적**: 빠른 참조 및 문서 링크
- **내용**: 문서 링크 + 간단한 설명
- **우선순위**: 가장 높음 (빠른 탐색용)
- **예시**: `guide-concepts-minimum.txt`

### 📋 Origin Files (`-origin.txt`)
- **목적**: 완전한 원본 문서 백업
- **내용**: 소스 마크다운의 전체 내용
- **우선순위**: 낮음 (완전 참조용)
- **예시**: `guide-concepts-origin.txt`

### 📝 Character-Limited Files (`-[100|300|500|1000|2000|3000|4000].txt`)
- **목적**: 글자수 제한 내에서 요약된 내용
- **내용**: 추출 및 요약된 핵심 내용
- **우선순위**: 크기별 (300, 1000, 2000이 가장 높음)
- **예시**: `guide-concepts-300.txt`

## 🚀 사용 방법

### 1. 구조 생성 (이미 완료됨)

```bash
# 최적화된 구조 생성 (이미 실행됨)
node scripts/generate-final-document-structure.js

# 또는 package.json 스크립트로
pnpm docs:final
```

### 2. 문서 상태 확인

```bash
# 현재 구조 기반 상태 확인
node scripts/check-document-status-v2.js

# 또는 package.json 스크립트로
pnpm docs:status
```

### 3. 내용 추출 작업

1. **Origin 파일들은 이미 자동 복사됨**
2. **Minimum 파일에 링크와 설명 추가**
3. **글자수별 파일에 요약 내용 추가**
4. **YAML 상태를 "complete"로 업데이트**

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
- **총 문서**: 59개
- **파일 타입**: 9개 (minimum, origin, 100, 300, 500, 1000, 2000, 3000, 4000)
- **생성된 폴더**: 59개
- **생성된 파일**: 531개
- **높은 우선순위**: 168개 파일

### 다음 단계
1. **Minimum 파일 작성**: 문서 링크와 간단 설명 추가
2. **Origin 파일 검증**: 원본 복사 확인
3. **요약 추출**: 우선순위별 글자수 파일 작성
4. **상태 업데이트**: YAML `status` 필드 관리

## 🔍 품질 기준

1. **Minimum 파일**: 모든 관련 링크와 명확한 설명 포함
2. **Origin 파일**: 소스 마크다운의 정확한 복사
3. **글자수 제한**: 목표의 ±10% 범위 내
4. **정보 보존**: 핵심 의미 유지
5. **일관성**: 확립된 패턴 준수

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