# Optimized Document Structure Strategy

## 최적화된 문서 구조 전략

Context-Action 프레임워크를 위한 **문서별 타입 기반 콘텐츠 전략**입니다. 실제 문서를 기반으로 minimum, origin, 글자수별 버전으로 체계적으로 관리합니다.

## 📁 구조 철학

### Document-Centric Organization
각 문서가 독립된 폴더를 가지고, 그 안에서 다양한 타입의 파일들을 관리합니다.

```
documentId/
├── documentId-minimum.txt    # 🔗 빠른 참조
├── documentId-origin.txt     # 📋 완전한 원본  
├── documentId-100.txt        # 📝 극압축
├── documentId-300.txt        # 📝 핵심 요약
├── documentId-1000.txt       # 📝 실용적 정보
├── documentId-2000.txt       # 📝 포괄적 설명
└── ...
```

## 🎯 파일 타입별 전략

### 📄 Minimum Files (최우선)
**Score Boost**: +25점 (빠른 탐색을 위한 최우선)

**콘텐츠 전략**:
1. **Document Links**: 원본 파일 경로와 관련 문서들
2. **Brief Description**: 2-3줄의 핵심 설명
3. **Document Type**: Guide/API/Examples/Concepts 분류
4. **Quick Navigation**: 관련 minimum 파일들 링크

**작성 우선순위**:
1. Overview/Getting Started (100점)
2. Core Concepts (95점)  
3. Main Patterns (90점)
4. Essential APIs (85점)

### 📋 Origin Files (백업/참조)
**Score Boost**: +5점 (완전한 정보 제공)

**콘텐츠 전략**:
- 원본 마크다운의 완전한 복사본 유지
- 수정 없이 전체 정보 보존
- 상세 참조가 필요할 때 사용

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

## 📊 문서별 우선순위 매트릭스

### Tier 1: 필수 핵심 (85-100점)
- **guide-overview** (95점): 프레임워크 전체 개요
- **guide-concepts** (95점): 핵심 개념 설명
- **guide-getting-started** (90점): 시작 가이드
- **guide-quick-start** (90점): 빠른 시작
- **concept-pattern-guide** (85점): 패턴 가이드

### Tier 2: 실용적 핵심 (70-84점)
- **API References** (75-85점): 주요 API들
- **guide-best-practices** (80점): 베스트 프랙티스
- **guide-action-handlers** (75점): 액션 핸들러
- **guide-store-management** (75점): 스토어 관리
- **examples-basic-setup** (70점): 기본 설정 예제

### Tier 3: 고급 활용 (55-69점)
- **guide-error-handling** (65점): 에러 핸들링
- **guide-performance** (60점): 성능 최적화  
- **concept-architecture-guide** (60점): 아키텍처 가이드
- **examples-pattern-composition** (55점): 패턴 조합

### Tier 4: 참조용 상세 (40-54점)
- **Detailed API docs** (45-50점)
- **Advanced examples** (40-45점)
- **concept-conventions** (40점): 상세 컨벤션

### Tier 5: 부가 정보 (25-39점)
- **llms-* documents** (30점): LLM 관련 문서들
- **Migration guides** (25점)

## 🚀 작성 전략 로드맵

### Phase 1: Critical Minimum Files (1주)
**목표**: 빠른 탐색 시스템 구축
```
Priority >= 85인 문서들의 minimum 파일:
- guide-overview-minimum.txt
- guide-concepts-minimum.txt  
- guide-getting-started-minimum.txt
- guide-quick-start-minimum.txt
- concept-pattern-guide-minimum.txt
```

### Phase 2: Core 300-char Files (1주)
**목표**: 핵심 개념 요약 완성
```
Priority >= 80인 문서들의 300자 파일:
- 위 minimum 파일들 + guide-best-practices, 주요 API들
```

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

**Strategy Version**: 2.0 (Optimized Structure)  
**Updated**: 2025-08-14  
**Focus**: Document-based minimum/origin + character-limited approach  
**Next Review**: Phase 1 완료 후