# Optimized Document Structure Strategy

## 최적화된 문서 구조 전략 (Priority 시스템 기반)

Context-Action 프레임워크를 위한 **문서별 Priority JSON 기반 콘텐츠 전략**입니다. 각 문서가 독립된 우선순위와 추출 가이드라인을 가지고 체계적으로 관리됩니다.

## 📁 구조 철학

### Document-Based Priority System
각 문서가 독립된 폴더를 가지고, priority.json으로 우선순위와 추출 전략을 관리합니다.

```
documentId/
├── priority.json             # 🎯 우선순위 & 추출 가이드라인
├── documentId-minimum.txt    # 🔗 경로/네비게이션 정보
├── documentId-origin.txt     # 📄 완전한 원본 (수정 금지)
├── documentId-100.txt        # 📝 극압축 (개념 정의)
├── documentId-300.txt        # 📝 핵심 요약
├── documentId-1000.txt       # 📝 실용적 정보
├── documentId-2000.txt       # 📝 포괄적 설명
└── ...
```

## 🎯 파일 타입별 전략

### 🔗 Minimum Files (경로/네비게이션)
**llms.txt 조합 규칙**: 경로/링크 참조 정보로 활용

**Priority.json 기반 콘텐츠 전략**:
- **Focus**: "빠른 네비게이션과 경로 정보"  
- **Must Include**: ["source link", "brief purpose", "related docs"]
- **Structure**: "Document links + 간단한 설명 + 관련 문서"
- **Avoid**: ["detailed explanations", "code examples"]

**작성 방법**:
1. 각 문서의 priority.json → extraction.character_limits.minimum 확인
2. source_path, document ID, category 정보 포함
3. 관련 문서 매핑 및 링크 구조 제공

### 📄 Origin Files (문서 그대로)
**llms.txt 조합 규칙**: 문서 그대로의 내용으로 활용

**Priority.json 기반 콘텐츠 전략**:
- **Focus**: "완전한 원본 내용 보존"
- **Must Include**: ["complete original content"]  
- **Avoid**: ["modifications", "truncations"]
- **수정 금지**: 소스 파일의 완전한 복사본 유지

### 📝 Character-Limited Files

#### 100자 (극압축)
**목적**: 한 줄 개념 정의
**콘텐츠**: 핵심 개념만, 예제나 설명 없음
**예시**: "Context-Action: MVVM state management with Action/Store separation"

#### 300자 (핵심 요약) ⭐ 최우선
**Score Boost**: +15점
**목적**: 핵심 개념과 기본 설명
**콘텐츠**:
- 메인 개념 1-2개
- 기본 용법 설명
- 필수 키워드 포함

#### 1000자 (실용적 정보) ⭐ 고우선
**Score Boost**: +15점  
**목적**: 실제 사용에 필요한 정보
**콘텐츠**:
- 완전한 개념 설명
- 기본 코드 예제 1-2개
- 핵심 API 메서드들
- 기본 사용 패턴

#### 2000자 (포괄적 설명) ⭐ 고우선
**Score Boost**: +15점
**목적**: 종합적 이해 제공
**콘텐츠**:
- 상세 개념 설명
- 여러 사용 예제
- 주요 API 전체
- 컨벤션과 베스트 프랙티스
- 일반적인 사용 패턴들

#### 3000-4000자 (상세 참조)
**목적**: 거의 완전한 정보
**콘텐츠**:
- 모든 관련 개념
- 고급 사용 사례
- 전체 API 레퍼런스
- 에러 핸들링
- 성능 최적화

## 📊 Priority 시스템 기반 문서 관리

### Document-Based Priority Tiers (실제 데이터)
```bash
# 실시간 priority 상태 확인
pnpm docs:priority:status
```

**Priority Tier 분포**:
- **Critical (90-100점)**: 7개 문서 - 프레임워크 핵심
- **Essential (80-89점)**: 32개 문서 - 주요 가이드 및 API
- **Important (60-79점)**: 11개 문서 - 중요 참조 문서  
- **Reference (40-59점)**: 12개 문서 - 고급/참조용

### Priority JSON 구조 기반 관리
각 문서의 우선순위와 추출 전략이 다음 요소로 결정:

```json
{
  "priority": { "score": 85, "tier": "essential", "rationale": "..." },
  "purpose": { "primary_goal": "...", "target_audience": [...] },
  "keywords": { "primary": [...], "technical": [...], "avoid": [...] },
  "extraction": { 
    "strategy": "concept-first|api-first|example-first",
    "character_limits": { /* 각 크기별 상세 가이드라인 */ }
  }
}
```

### 새로운 관리 도구
```bash
pnpm docs:priority:critical      # Critical tier 문서 목록
pnpm docs:priority:essential     # Essential tier 문서 목록  
pnpm docs:priority:worklist      # 점수순 작업 목록
pnpm docs:priority info [doc-id] # 특정 문서 상세 정보
pnpm docs:priority:validate      # 모든 priority.json 검증
```

## 🚀 작성 전략 로드맵

### Phase 1: Critical Minimum Files (1주)
**목표**: 경로/네비게이션 시스템 구축
```bash
# Critical tier 문서 확인 후 작업
pnpm docs:priority:critical
```
- **작업 방법**: 각 문서의 priority.json → minimum 추출 가이드라인 확인
- **focus**: "빠른 네비게이션과 경로 정보"
- **must_include**: source link, brief purpose, related docs

### Phase 2: Essential/Critical 300자 Files (1주)  
**목표**: 핵심 개념 요약 완성
```bash
# Essential + Critical tier 문서 대상
pnpm docs:priority:essential
```
- **작업 방법**: priority.json → extraction.character_limits["300"] 확인
- **strategy 활용**: concept-first/api-first/example-first 접근법

### Phase 3: Essential 1000-char Files (1-2주)
**목표**: 실용적 정보 제공
```
Priority >= 70인 문서들의 1000자 파일:
- 실제 사용에 필요한 핵심 가이드들
```

### Phase 4: Comprehensive 2000-char Files (2주)
**목표**: 포괄적 설명 완성
```
주요 가이드들의 2000자 파일:
- 거의 완전한 사용 가이드 수준
```

### Phase 5: Complete Coverage (지속적)
**목표**: 모든 크기 완성

## 🔧 콘텐츠 최적화 원칙

### 1. **Link-First for Minimum**
Minimum 파일은 콘텐츠보다 탐색에 중점
- 명확한 문서 링크 구조
- 관련 문서 매핑
- 빠른 참조 가능한 형태

### 2. **Code-Heavy for Mid-Range**
1000-2000자 파일은 실행 가능한 예제 중심
- TypeScript 네이티브 코드
- 실용적 패턴 중심
- 복사-붙여넣기 가능한 예제

### 3. **Pattern-Focused**  
모든 크기에서 구체적 구현 패턴 제시
- Action Only Pattern
- Store Only Pattern  
- Pattern Composition
- Integration Patterns

### 4. **Convention-Heavy**
네이밍과 구조 규칙 강조
- 파일 구조 컨벤션
- 네이밍 패턴
- Import/Export 규칙

### 5. **Error-Prevention**
흔한 실수와 해결책 포함
- Anti-patterns 설명
- 일반적 함정들
- 해결 방법 제시

## 📈 성공 측정

### 완료율 추적
```bash
pnpm docs:status  # 전체 진행 상황 확인
```

### 품질 지표
1. **링크 유효성**: Minimum 파일의 모든 링크 작동
2. **글자수 정확도**: 목표 ±10% 범위 준수
3. **내용 일관성**: 동일한 용어와 패턴 사용
4. **실용성**: 복사-붙여넣기 가능한 예제

### 단계별 목표
- **1주차**: Minimum 파일 20개 완성
- **2주차**: 300자 파일 15개 + Minimum 전체 완성
- **4주차**: 1000자 핵심 파일 20개 완성
- **8주차**: 전체 구조 80% 완성

---

**Strategy Version**: 3.0 (Priority JSON System)  
**Updated**: 2025-08-14  
**Focus**: Document-based priority.json with llms.txt 조합 규칙 (minimum=경로, origin=문서)  
**Priority System**: 62개 priority.json files with JSON schema validation  
**Management Tools**: pnpm docs:priority:* commands  
**Next Review**: Critical minimum files 완료 후