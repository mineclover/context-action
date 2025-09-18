# 테스트 기반 문서화 시스템 명세서

## 개요

이 명세서는 테스트 코드로부터 직접 API 문서를 생성하는 포괄적인 시스템을 정의합니다. 문서가 실제 구현과 동기화되고 실제 동작하는 예제를 제공하도록 보장합니다.

## 현재 상태 (1단계) ✅

### 구현된 기능
- 4개 핵심 API에 대한 기본 테스트-문서 추출
- 78개 테스트 파일에서 실제 사용 예제 추출
- `pnpm docs:api-generate`를 통한 자동 생성
- 문서 파일 45% 감소 (423→232개)
- 검색 성능 24% 향상

### 생성된 API
1. **ActionRegister** - 포괄적 테스트에서 49개 예제
2. **createActionContext** - React 통합 예제
3. **createStoreContext** - 스토어 패턴 예제
4. **useStoreValue** - 훅 사용 패턴

## 2단계: 향상된 테스트 추출 🚧

### 목표
- 코드 예제 품질 및 완성도 향상
- 지능적 테스트 분류 추가
- 더 나은 문서 템플릿 생성
- 다중 예제 형식 지원

### 기술적 개선사항

#### 1. 스마트 코드 추출
```javascript
// 컨텍스트 인식을 통한 향상된 추출
function extractExamplesFromTest(testFilePath) {
  return {
    setup: extractSetupCode(),      // beforeEach, imports, interfaces
    examples: extractTestCases(),   // it/test 블록의 정리된 코드
    assertions: extractValidation(), // 검증 문서로서의 expect 문
    metadata: extractTestMetadata() // describe 블록, 파일 정보
  };
}
```

#### 2. 예제 카테고리
- **기본 사용법** - 간단하고 일반적인 사용 사례
- **고급 패턴** - 복잡한 시나리오와 엣지 케이스
- **에러 처리** - 오류 조건과 복구
- **성능** - 최적화 예제
- **통합** - API 간 사용 패턴

#### 3. 다중 형식 출력
```markdown
## 사용 예제

### 인터랙티브 예제
<!-- 실행 가능한 라이브 코드 예제 -->

### 복사-붙여넣기 준비
<!-- 빠른 사용을 위한 깔끔하고 최소한의 예제 -->

### 완전한 애플리케이션
<!-- 컨텍스트가 포함된 완전 동작 예제 -->
```

## 3단계: 테스트-문서 양방향 동기화 🔄

### 문서 기반 테스트 생성
문서에서 테스트로 커버되지 않는 기능을 설명할 때:

```javascript
// 문서에서 테스트 스텁 자동 생성
function generateTestFromDoc(docContent) {
  const examples = parseCodeBlocks(docContent);
  return examples.map(example => ({
    testName: `should ${inferTestName(example)}`,
    testCode: generateTestCode(example),
    status: 'stub' // 수동 구현 필요
  }));
}
```

### 테스트 커버리지 분석
```javascript
// 문서화 격차 식별
function analyzeDocCoverage() {
  return {
    undocumentedAPIs: findUndocumentedAPIs(),
    missingExamples: findMissingExampleTypes(),
    outdatedDocs: findOutdatedDocumentation(),
    testGaps: findUntesttedFeatures()
  };
}
```

## 4단계: 고급 문서화 기능 📚

### 1. API 진화 추적
- **변경로그 생성** - 자동 API diff 감지
- **호환성 변경** - 비호환 변경사항 강조
- **마이그레이션 가이드** - 자동 업그레이드 지침 생성

### 2. 인터랙티브 예제
- **실행 가능한 코드** - 브라우저 내 실행 환경
- **매개변수 탐색기** - 인터랙티브 API 매개변수 테스트
- **시각적 플로우** - 테스트 시퀀스에서 다이어그램 생성

### 3. 성능 문서화
```javascript
// 테스트에서 성능 특성 추출
function extractPerformanceMetrics(testFiles) {
  return {
    benchmarks: extractBenchmarkData(),
    memoryUsage: extractMemoryProfiles(),
    executionTimes: extractTimingData(),
    scalingLimits: extractLimitTests()
  };
}
```

## 5단계: 품질 보증 시스템 🎯

### 1. 문서화 품질 메트릭
- **완성도 점수** - 예제가 있는 API의 비율
- **신선도 점수** - 예제가 검증된 최근 정도
- **명확성 점수** - 가독성과 포괄성
- **정확성 점수** - 예제의 테스트 통과율

### 2. 자동 검증
```javascript
// 문서 예제의 지속적 검증
async function validateDocExamples() {
  const results = await Promise.all([
    validateCodeSyntax(),
    validateAPIUsage(),
    validateTypeChecking(),
    validateExecutability()
  ]);

  return generateQualityReport(results);
}
```

### 3. 커뮤니티 피드백 통합
- **예제 투표** - 커뮤니티가 예제 유용성 평가
- **누락된 예제** - 사용자가 특정 시나리오 요청 가능
- **기여 추적** - 문서에서 테스트 작성자 크레딧

## 구현 로드맵

### 2단계 (다음 2주)
1. **향상된 코드 추출**
   - 더 깔끔한 코드를 위한 정규식 패턴 개선
   - 컨텍스트 감지 추가 (setup, teardown, imports)
   - 다중 테스트 프레임워크 지원

2. **더 나은 템플릿**
   - 카테고리 기반 조직화
   - 향상된 형식과 구조
   - 상호 참조 생성

3. **품질 향상**
   - 테스트 아티팩트 제거 (expect, mock 등)
   - 현실적인 예제 생성
   - 적절한 설명과 해설 추가

### 3단계 (2개월차)
1. **양방향 동기화**
   - 문서 → 테스트 스텁 생성
   - 테스트 커버리지 분석
   - 누락된 문서 감지

2. **고급 추출**
   - 성능 벤치마크 통합
   - 에러 처리 예제
   - 통합 패턴 감지

### 4단계 (3개월차)
1. **인터랙티브 기능**
   - 실행 가능한 예제
   - 매개변수 탐색
   - 시각적 문서화

2. **진화 추적**
   - API 변경 감지
   - 자동 마이그레이션 가이드
   - 호환성 변경 알림

## 기술 아키텍처

### 핵심 컴포넌트
```
scripts/
├── generate-api-docs.js        # 메인 생성기 (현재)
├── extract/
│   ├── test-parser.js         # 향상된 테스트 파싱
│   ├── code-cleaner.js        # 코드 예제 정리
│   └── example-categorizer.js # 스마트 분류
├── templates/
│   ├── api-doc.template.js    # 향상된 템플릿
│   ├── example.template.js    # 예제 형식화
│   └── interactive.template.js # 인터랙티브 예제
└── validation/
    ├── syntax-validator.js    # 코드 문법 검사
    ├── api-validator.js       # API 사용 검증
    └── quality-metrics.js     # 문서화 품질 점수
```

### 통합 지점
- **빌드 프로세스** - `pnpm docs:full`에 테스트-문서 생성 포함
- **CI/CD** - 자동 검증 및 품질 검사
- **개발** - 문서 변경사항에 대한 핫 리로드
- **테스팅** - 추가 테스트 케이스로서의 문서 예제

## 성공 메트릭

### 정량적 목표
- **API 커버리지**: 공개 API의 95%가 예제와 함께 문서화
- **예제 품질**: 예제의 90%가 수정 없이 실행 가능
- **신선도**: 예제의 100%가 지난 30일 내에 검증됨
- **성능**: 문서 생성 시간 30초 미만

### 정성적 목표
- **개발자 경험**: API 사용법 이해 시간 단축
- **유지보수 부담**: 수동 문서 업데이트 최소화
- **정확성**: 문서-코드 불일치 제거
- **발견가능성**: 예제를 통한 API 기능 발견 개선

## 위험 완화

### 기술적 위험
- **테스트 코드 품질** - 코드 정리 및 표준화 구현
- **추출 정확성** - 검증 및 인간 검토 프로세스 추가
- **성능 영향** - 생성 및 캐싱 최적화
- **호환성 변경** - 버전 인식 문서 생성

### 프로세스 위험
- **개발자 채택** - 명확한 마이그레이션 가이드와 이점 제공
- **품질 관리** - 검토 프로세스 및 품질 게이트 구현
- **유지보수 오버헤드** - 가능한 한 자동화

## 결론

이 테스트 기반 문서화 시스템은 수동 문서화에서 자동화된 테스트 검증 예제로의 패러다임 전환을 나타냅니다. 5단계 완료 시점에는 다음을 갖게 됩니다:

1. **100% 정확한 문서화** - 항상 코드와 동기화
2. **풍부한 예제 라이브러리** - 모든 사용 패턴과 엣지 케이스 포함
3. **인터랙티브 학습** - 실습 기반 API 탐색
4. **품질 보증** - 지속적 검증 및 개선
5. **커뮤니티 통합** - 협업적 문서 개선

이 시스템은 문서화가 좋은 테스팅 관행의 자연스러운 부산물이 되도록 보장하여 유지보수 부담을 줄이면서 품질과 정확성을 향상시킵니다.