# LLMS-Generator Documentation Index

## 📚 문서별 목적 및 사용 가이드

이 인덱스는 LLMS-Generator 패키지의 모든 문서를 목적별로 분류하여 개발자가 필요한 문서를 쉽게 찾을 수 있도록 합니다.

---

## 🏗️ 시스템 아키텍처 문서

### 📖 [ENHANCED_ARCHITECTURE.md](./ENHANCED_ARCHITECTURE.md)
**목적**: Enhanced LLMS-Generator 시스템의 전체 아키텍처 가이드  
**대상**: 시스템 설계자, 백엔드 개발자, 아키텍트  
**내용**:
- 5계층 시스템 아키텍처 설명
- 카테고리/태그/의존성 기반 지능형 선택 시스템
- 데이터 플로우 및 통합 포인트
- 성능 특성 및 확장성 한계

**언제 사용**: Enhanced 시스템의 내부 동작 원리를 이해하고자 할 때

---

## 🔧 개발 및 구현 문서

### 📋 [WORK_GUIDELINES.md](./WORK_GUIDELINES.md)
**목적**: Enhanced LLMS-Generator 시스템 개발 작업 지침서  
**대상**: 시스템 개발자, 기여자  
**내용**:
- 4단계 구현 로드맵 (태그/카테고리 → 의존성 → 적응형 선택 → 품질 평가)
- 시스템 목표 및 요구사항 정의
- 개발 우선순위 및 작업 순서

**언제 사용**: Enhanced 시스템을 개발하거나 확장할 때

### 📊 [ALGORITHM_DESIGN.md](./ALGORITHM_DESIGN.md)
**목적**: Enhanced 시스템의 핵심 알고리즘 설계 명세서  
**대상**: 알고리즘 개발자, 성능 최적화 담당자  
**내용**:
- 다중 선택 알고리즘 (Knapsack, Greedy, TOPSIS, Hybrid)
- 의존성 해결 및 충돌 감지 알고리즘
- 품질 평가 메트릭 계산 방식

**언제 사용**: 알고리즘 구현 세부사항이나 성능 최적화가 필요할 때

---

## 📚 API 및 사용 가이드

### 🔗 [API_REFERENCE.md](./API_REFERENCE.md)
**목적**: Enhanced LLMS-Generator API 완전 참조 가이드  
**대상**: 라이브러리 사용자, 통합 개발자  
**내용**:
- 모든 클래스/메서드의 상세 API 문서
- TypeScript 인터페이스 및 타입 정의
- 코드 예제 및 에러 처리 방법
- 성능 가이드라인

**언제 사용**: Enhanced 시스템을 프로그래밍 방식으로 사용할 때

### 👤 [USER_GUIDE.md](./USER_GUIDE.md)
**목적**: Enhanced LLMS-Generator 종합 사용자 가이드  
**대상**: 최종 사용자, 콘텐츠 관리자  
**내용**:
- 빠른 시작 가이드 및 설정 방법
- CLI 명령어 완전 참조
- 선택 전략 및 품질 평가 사용법
- 문제 해결 및 모범 사례

**언제 사용**: Enhanced 시스템을 실제로 사용하여 문서를 선택하고자 할 때

---

## 🧪 테스트 문서

### 📋 [TEST_COVERAGE_PLAN.md](./TEST_COVERAGE_PLAN.md)
**목적**: Enhanced LLMS-Generator 시스템의 포괄적 테스트 구현 계획  
**대상**: 테스트 엔지니어, QA 담당자, 개발자  
**내용**:
- 6주간 95% 코버리지 목표 테스트 계획
- 단위/통합/성능/E2E 테스트 전략
- Phase별 구현 로드맵 및 성공 기준
- 테스트 데이터 및 픽스처 설계

**언제 사용**: Enhanced 시스템의 테스트를 구현하거나 품질을 검증할 때

### 🎯 [TEST_SCENARIOS.md](./TEST_SCENARIOS.md)
**목적**: 기존 YAML frontmatter 요약 생성 기능의 사용자 시나리오 테스트  
**대상**: 기능 테스터, 사용성 검증자  
**내용**:
- 실제 CLI 명령어 테스트 케이스
- 사용자 워크플로우 시나리오 (첫 사용자 → 고급 사용자)
- 오류 처리 및 통합 테스트 시나리오
- 성능 벤치마크 및 품질 검증

**언제 사용**: 기존 기본 기능의 사용자 경험을 테스트할 때

---

## ⚙️ 설정 및 스키마

### 📄 [llms-generator.config.json](../../../llms-generator.config.json)
**목적**: Enhanced 시스템 설정 파일 예제  
**대상**: 시스템 관리자, 설정 담당자  
**내용**:
- 카테고리, 태그, 의존성 규칙 정의
- 선택 전략 및 품질 임계값 설정
- 다국어 및 UI 설정

**언제 사용**: Enhanced 시스템 설정을 구성할 때

### 📋 [priority-schema-enhanced.json](./priority-schema-enhanced.json)
**목적**: Enhanced 우선순위 메타데이터 JSON 스키마  
**대상**: 스키마 개발자, 검증 담당자  
**내용**:
- Enhanced 우선순위 파일의 JSON 스키마 정의
- 태그, 의존성, 조합 메타데이터 검증 규칙

**언제 사용**: Enhanced 우선순위 파일의 형식을 정의하거나 검증할 때

---

## 🔄 시스템 타입별 분류

### 🎯 Enhanced System (지능형 문서 선택)
- **아키텍처**: [ENHANCED_ARCHITECTURE.md](./ENHANCED_ARCHITECTURE.md)
- **개발**: [WORK_GUIDELINES.md](./WORK_GUIDELINES.md), [ALGORITHM_DESIGN.md](./ALGORITHM_DESIGN.md)
- **사용**: [API_REFERENCE.md](./API_REFERENCE.md), [USER_GUIDE.md](./USER_GUIDE.md)
- **테스트**: [TEST_COVERAGE_PLAN.md](./TEST_COVERAGE_PLAN.md)
- **설정**: [llms-generator.config.json](../../../llms-generator.config.json), [priority-schema-enhanced.json](./priority-schema-enhanced.json)

### 🏃‍♂️ Basic System (기존 YAML 요약 생성)
- **테스트**: [TEST_SCENARIOS.md](./TEST_SCENARIOS.md)
- **설정**: 기존 config 파일들

---

## 📖 독서 순서 권장사항

### 🆕 처음 접하는 개발자
1. **ENHANCED_ARCHITECTURE.md** - 전체 시스템 이해
2. **USER_GUIDE.md** - 사용법 학습
3. **API_REFERENCE.md** - 프로그래밍 인터페이스 학습

### 🔨 시스템 개발자
1. **WORK_GUIDELINES.md** - 개발 지침 이해
2. **ALGORITHM_DESIGN.md** - 알고리즘 설계 파악
3. **ENHANCED_ARCHITECTURE.md** - 아키텍처 세부사항
4. **TEST_COVERAGE_PLAN.md** - 테스트 계획 수립

### 👥 사용자 및 관리자
1. **USER_GUIDE.md** - 기본 사용법
2. **llms-generator.config.json** - 설정 방법
3. **TEST_SCENARIOS.md** - 사용 시나리오 참고

### 🧪 테스트 엔지니어
1. **TEST_COVERAGE_PLAN.md** - Enhanced 시스템 테스트
2. **TEST_SCENARIOS.md** - 기존 기능 테스트
3. **API_REFERENCE.md** - API 테스트 참조

---

## 🔍 문서 상태

| 문서 | 상태 | 최종 업데이트 | 비고 |
|------|------|---------------|------|
| ENHANCED_ARCHITECTURE.md | ✅ 완료 | 2024-01-15 | Enhanced 시스템 완전 구현 |
| API_REFERENCE.md | ✅ 완료 | 2024-01-15 | 모든 API 문서화 완료 |
| USER_GUIDE.md | ✅ 완료 | 2024-01-15 | 종합 사용자 가이드 |
| TEST_COVERAGE_PLAN.md | ✅ 완료 | 2024-01-15 | 6주 테스트 계획 |
| WORK_GUIDELINES.md | ✅ 완료 | 2024-01-15 | 개발 지침서 |
| ALGORITHM_DESIGN.md | ✅ 완료 | 2024-01-15 | 알고리즘 설계 명세 |
| TEST_SCENARIOS.md | ✅ 완료 | 기존 | 기본 기능 테스트 시나리오 |

---

이 문서 인덱스를 통해 각 문서의 목적과 대상을 명확히 파악하고, 필요에 따라 적절한 문서를 선택하여 참조할 수 있습니다.