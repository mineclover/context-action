# Context-Action Framework - Optimized Document Plan

## 📋 프로젝트 현황

### 완료된 작업
- ✅ **구조 설계**: 최적화된 폴더/파일 구조 설계 완료
- ✅ **스크립트 개발**: 문서 생성 및 상태 확인 스크립트 완료
- ✅ **폴더 생성**: 62개 문서 폴더와 558개 파일 생성 완료
- ✅ **메타데이터 시스템**: YAML 기반 메타데이터 시스템 구축
- ✅ **Origin 파일**: 원본 문서 자동 복사 완료
- ✅ **가이드라인**: 추출 가이드라인 문서화 완료
- ✅ **Priority 시스템**: 문서별 priority.json 기반 시스템 구축 완료
- ✅ **JSON 스키마**: priority-schema.json 검증 시스템 구축

### 현재 상태
- **총 문서**: 62개 (영어 44개, 한글 18개)
- **총 파일**: 620개 (558개 추출 파일 + 62개 priority.json)
- **파일 타입**: 9개 (minimum, origin, 100~4000자)
- **Priority 파일**: 62개 (100% 완성, 모든 파일 스키마 검증 통과)
- **완료율**: 구조 100%, 내용 0% (모든 추출 파일이 placeholder 상태)

## 🎯 파일 타입별 전략

### 1. Minimum Files (-minimum.txt)
**우선순위**: 가장 높음 (빠른 네비게이션과 경로 정보)

**목적**: 
- 문서 경로 및 네비게이션 정보 제공
- LLM이 관련 문서를 빠르게 찾을 수 있도록 지원
- **llms.txt 조합 시**: 경로/링크 참조 정보로 활용

**내용 구성**:
```
## Document Path & Navigation
- **Source**: `relative/path/to/source.md`
- **Document ID**: guide-concepts
- **Category**: Guide/API Reference/Examples/Concepts

## Quick Navigation
[2-3줄 빠른 설명]

## Related Documents
- Related: [관련 문서 링크들]
- Dependencies: [선행 문서들]
```

### 2. Origin Files (-origin.txt)
**우선순위**: 중간 (원본 문서 완전 보존)

**목적**: 
- 원본 마크다운 문서의 완전한 복사본 제공
- **llms.txt 조합 시**: 문서 그대로의 내용으로 활용

**내용**: 소스 파일의 전체 내용 그대로 복사 (수정 금지)

### 3. Character-Limited Files (100~4000자)
**우선순위**: 크기별 차등 (300, 1000, 2000이 핵심)

#### 100자 Files
- **목적**: 극도로 압축된 핵심만
- **내용**: 한 줄 개념 정의 수준
- **예시**: "Context-Action: Document-centric MVVM state management with Action/Store patterns"

#### 300자 Files (핵심 우선순위)
- **목적**: 핵심 개념과 간단한 설명
- **내용**: 
  - 핵심 개념 1-2개
  - 기본 사용법 1줄
  - 간단한 코드 예시 (선택적)

#### 1000자 Files (핵심 우선순위)
- **목적**: 실용적 정보 제공
- **내용**:
  - 주요 개념 설명
  - 기본 사용 예제
  - 핵심 API 1-2개

#### 2000자 Files (핵심 우선순위)
- **목적**: 포괄적 설명
- **내용**:
  - 완전한 개념 설명
  - 여러 사용 예제
  - 주요 API들
  - 기본 컨벤션

#### 3000-4000자 Files
- **목적**: 상세한 참조 자료
- **내용**: 거의 완전한 정보 + 고급 기능

## 📊 Priority 시스템 (새로운 문서별 시스템)

### Document-Based Priority System
각 문서 폴더의 `priority.json` 파일로 관리:

**Priority Tiers**:
- **Critical (90-100점)**: 7개 문서 - 프레임워크 핵심 개념
- **Essential (80-89점)**: 32개 문서 - 주요 가이드 및 API  
- **Important (60-79점)**: 11개 문서 - 중요 참조 문서
- **Reference (40-59점)**: 12개 문서 - 고급/참조용

### Priority JSON 구조
```json
{
  "document": { "id": "...", "title": "...", "category": "..." },
  "priority": { "score": 85, "tier": "essential" },
  "purpose": { "primary_goal": "...", "target_audience": [...] },
  "keywords": { "primary": [...], "technical": [...] },
  "extraction": { 
    "strategy": "concept-first",
    "character_limits": { /* 9가지 타입별 가이드라인 */ }
  }
}
```

### 새로운 우선순위 관리 도구
```bash
pnpm docs:priority:status        # 전체 상태 확인
pnpm docs:priority:critical      # Critical 문서 목록
pnpm docs:priority:worklist      # 작업 목록 (점수순)
pnpm docs:priority info [doc-id] # 특정 문서 정보
```

## 🚀 작업 계획

### Phase 1: Critical 문서 Minimum 파일 작성 (1-2일)
**대상**: Critical tier (90-100점) 7개 문서의 minimum 파일

**Priority 기반 작업 순서**:
```bash
# Critical tier 문서 확인
pnpm docs:priority:critical
```

**작업 방법**:
- 각 문서의 priority.json에서 extraction 가이드라인 확인
- minimum 타입의 focus: "빠른 네비게이션과 경로 정보"
- must_include: ["source link", "brief purpose", "related docs"]
- 문서 경로, 카테고리, 관련 문서 링크 중심으로 작성

### Phase 2: Essential/Critical 300자 파일 작성 (2-3일)
**대상**: Essential + Critical tier 문서들의 300자 파일

**Priority 기반 접근**:
```bash
# Essential tier 문서 확인
pnpm docs:priority:essential
```

**작업 방법**:
- 각 문서의 priority.json → extraction.character_limits["300"] 확인
- strategy 따라 concept-first/api-first/example-first 접근
- must_include keywords 우선 포함
- avoid keywords 제외하여 작성

### Phase 3: 1000자 파일 작성 (3-4일)
**대상**: 주요 가이드 및 API 문서들

**작업 방법**:
- 실용적인 사용 방법 포함
- 기본 코드 예제 1-2개
- 900-1100자 범위

### Phase 4: 2000자 파일 작성 (4-5일)
**대상**: 포괄적 가이드가 필요한 문서들

**작업 방법**:
- 완전한 설명과 여러 예제
- 1800-2200자 범위
- 실무에 필요한 대부분 정보

### Phase 5: 나머지 크기 완성 (지속적)
**대상**: 100, 500, 3000, 4000자 파일들

## 🔧 자동화 도구 활용

### 현재 사용 가능한 스크립트
```bash
# 문서 상태 확인
pnpm docs:status-v2

# 구조 분석  
pnpm docs:analyze

# 새로운 최적화 구조 생성 (필요시)
node scripts/generate-optimized-document-structure.js
```

### 앞으로 필요한 스크립트
1. **내용 검증 스크립트**: 글자수 범위 자동 확인
2. **진행률 추적 스크립트**: phase별 완료율 모니터링
3. **품질 검증 스크립트**: minimum 파일의 링크 유효성 확인
4. **최종 조합 스크립트**: 완성된 파일들을 하나의 llms.txt로 조합

## 📈 성공 지표

### 단기 목표 (1주일)
- [ ] 핵심 minimum 파일 20개 완성
- [ ] 주요 300자 파일 15개 완성
- [ ] 문서 상태 추적 시스템 완성

### 중기 목표 (2주일)  
- [ ] 모든 minimum 파일 완성 (59개)
- [ ] 핵심 300자 파일 완성 (30개)
- [ ] 주요 1000자 파일 완성 (20개)

### 장기 목표 (1개월)
- [ ] 모든 파일 타입 80% 이상 완성
- [ ] 자동 조합 시스템 완성
- [ ] 품질 검증 시스템 완성

## 🎯 품질 관리

### 내용 품질 기준
1. **정확성**: 원본 문서 내용과 일치
2. **완전성**: 해당 글자수에 맞는 적절한 정보량
3. **실용성**: 실제 사용에 도움이 되는 내용
4. **일관성**: 동일한 패턴과 용어 사용

### 글자수 관리
- **허용 범위**: 목표 ±10%
- **측정 방법**: YAML 메타데이터 제외한 실제 콘텐츠
- **조정 방법**: 단계적 내용 추가/제거

### 상태 관리
- **placeholder → draft**: 내용 초안 작성 완료
- **draft → review**: 글자수 및 품질 검토 필요  
- **review → complete**: 최종 검증 완료

---

**Plan Version**: 1.0  
**Created**: 2025-08-14  
**Status**: Structure Complete, Content Extraction Phase  
**Next Milestone**: Core Minimum Files (Phase 1)