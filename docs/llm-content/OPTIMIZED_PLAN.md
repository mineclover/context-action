# Context-Action Framework - Optimized Document Plan

## 📋 프로젝트 현황

### 완료된 작업
- ✅ **구조 설계**: 최적화된 폴더/파일 구조 설계 완료
- ✅ **스크립트 개발**: 문서 생성 및 상태 확인 스크립트 완료
- ✅ **폴더 생성**: 59개 문서 폴더와 531개 파일 생성 완료
- ✅ **메타데이터 시스템**: YAML 기반 메타데이터 시스템 구축
- ✅ **Origin 파일**: 원본 문서 자동 복사 완료
- ✅ **가이드라인**: 추출 가이드라인 문서화 완료

### 현재 상태
- **총 문서**: 59개 (영어 42개, 한글 17개)
- **총 파일**: 531개
- **파일 타입**: 9개 (minimum, origin, 100~4000자)
- **완료율**: 구조 100%, 내용 0% (모든 파일이 placeholder 상태)

## 🎯 파일 타입별 전략

### 1. Minimum Files (-minimum.txt)
**우선순위**: 가장 높음 (빠른 참조 및 탐색)

**목적**: 
- 문서의 핵심 링크와 간단한 설명 제공
- LLM이 필요한 문서를 빠르게 찾을 수 있도록 지원

**내용 구성**:
```
## Document Link
- **Source**: `relative/path/to/source.md`
- **Type**: Guide/API Reference/Examples/Concepts
- **Priority**: XX/100

## Brief Description
[2-3줄 설명]

## Key Links
- Main documentation: `source.md`
- Related documents: [관련 문서들]
```

### 2. Origin Files (-origin.txt)
**우선순위**: 중간 (완전한 참조 제공)

**목적**: 
- 원본 마크다운 문서의 전체 내용 보존
- 수정 없이 완전한 정보 제공

**내용**: 소스 파일의 전체 내용 그대로 복사 (이미 완료)

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

## 📊 우선순위 시스템

### 문서별 기본 우선순위
1. **Overview/Getting Started**: 90-100점
2. **Core Concepts**: 85-95점  
3. **Main API References**: 80-90점
4. **Pattern Guides**: 75-85점
5. **Advanced Features**: 60-75점
6. **Examples**: 70-80점
7. **Detailed API**: 50-70점

### 파일 타입별 우선순위 보정
- **Minimum**: +25점 (빠른 참조)
- **Origin**: +5점 (완전한 정보)
- **300자**: +15점 (핵심 크기)
- **1000자**: +15점 (실용적 크기)  
- **2000자**: +15점 (포괄적 크기)
- **기타**: 기본값

## 🚀 작업 계획

### Phase 1: 핵심 Minimum 파일 작성 (1-2일)
**대상**: 우선순위 80점 이상 문서들의 minimum 파일

1. **guide-getting-started-minimum.txt**
2. **guide-concepts-minimum.txt**  
3. **guide-overview-minimum.txt**
4. **guide-quick-start-minimum.txt**
5. **concept-pattern-guide-minimum.txt**

**작업 방법**:
- 각 문서의 원본을 읽고 핵심 링크 정리
- 2-3줄 간단 설명 작성
- 관련 문서 링크 추가

### Phase 2: 핵심 300자 파일 작성 (2-3일)
**대상**: 우선순위 75점 이상 문서들의 300자 파일

**작업 방법**:
- Origin 파일 내용 기반으로 핵심 개념 추출
- 270-330자 범위 내에서 요약
- 가장 중요한 1-2개 개념만 포함

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