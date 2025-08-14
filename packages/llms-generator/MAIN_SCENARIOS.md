# 메인 사용 시나리오 - LLMS Generator

LLMS Generator의 핵심 사용 시나리오를 정의합니다.

## 🎯 설정 시스템 개요 (2024년 8월 업데이트)

### 간소화된 설정 구조
기존의 복잡한 중첩 구조에서 단순한 3개 필드로 간소화:

```json
{
  "characterLimits": [100, 200, 300, 400],
  "languages": ["ko", "en", "id"], 
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./packages/llms-generator/data",
    "outputDir": "./docs/llms"
  }
}
```

### 지원하는 프리셋
- **minimal**: `[100, 500]` - 최소한의 구성
- **standard**: `[100, 300, 1000, 2000]` - 표준 권장 구성 
- **extended**: `[50, 100, 300, 500, 1000, 2000, 4000]` - 확장 구성
- **blog**: `[200, 500, 1500]` - 블로그용 구성
- **documentation**: `[150, 400, 1000]` - 문서용 구성

## 시나리오 1: 신규 프로젝트 설정 및 초기 생성 (Primary Setup)

**목적**: 새로운 프로젝트에서 LLMS Generator를 설정하고 첫 번째 컨텐츠 생성

**시나리오 흐름**:
1. 프로젝트 루트에서 설정 초기화
2. 문서 발견 및 우선순위 생성
3. 기본 컨텐츠 추출
4. 작업 상태 확인

**사용자 커맨드**:
```bash
# 1. 표준 설정으로 초기화
npx @context-action/llms-generator config-init standard

# 2. 설정 확인
npx @context-action/llms-generator config-show

# 3. 문서 발견
npx @context-action/llms-generator discover ko

# 4. 우선순위 파일 생성
npx @context-action/llms-generator priority-generate ko --overwrite

# 5. 모든 컨텐츠 추출
npx @context-action/llms-generator extract-all --lang=ko --overwrite

# 6. 작업 상태 확인
npx @context-action/llms-generator work-status ko
```

**기대 결과**:
- llms-generator.config.json 파일 생성
- 모든 한국어 문서에 대한 priority.json 생성
- 100, 300, 1000, 2000 글자 요약 파일 생성
- 작업 상태에서 모든 파일이 "up to date" 상태

## 시나리오 2: 100글자 요약 작업 워크플로우 (Daily Work)

**목적**: 100글자 요약에 집중한 일상적인 작업 워크플로우

**시나리오 흐름**:
1. 100글자 요약이 필요한 문서 확인
2. 특정 문서의 작업 컨텍스트 조회
3. 요약 작업 후 상태 업데이트 확인

**사용자 커맨드**:
```bash
# 1. 100글자 요약이 필요한 문서 리스트
npx @context-action/llms-generator work-list ko --chars=100 --need-update

# 2. 특정 문서의 작업 컨텍스트 확인
npx @context-action/llms-generator work-context ko guide-action-handlers --chars=100

# 3. 100글자 요약 재생성 (수정된 소스 반영)
npx @context-action/llms-generator extract ko --chars=100 --overwrite

# 4. 작업 완료 상태 확인
npx @context-action/llms-generator work-status ko guide-action-handlers
```

**기대 결과**:
- 업데이트가 필요한 문서 리스트 표시
- 특정 문서의 소스 내용, 현재 요약, 작업 상태 정보 제공
- 100글자 요약 파일 업데이트
- 작업 상태가 "up to date"로 변경

## 시나리오 3: 블로그용 커스텀 설정 (Custom Configuration)

**목적**: 블로그 컨텐츠에 최적화된 커스텀 설정으로 작업

**시나리오 흐름**:
1. 블로그 프리셋으로 설정 생성
2. 커스텀 글자 수로 컨텐츠 추출
3. 컴포지션 생성

**사용자 커맨드**:
```bash
# 1. 블로그 프리셋으로 설정 초기화
npx @context-action/llms-generator config-init blog

# 2. 설정된 글자 수 확인
npx @context-action/llms-generator config-limits

# 3. 블로그 최적화 컨텐츠 추출
npx @context-action/llms-generator extract ko

# 4. SEO용 컴포지션 생성 (3000글자)
npx @context-action/llms-generator compose ko 3000 --priority=50
```

**기대 결과**:
- 200, 500, 1500 글자 제한이 설정된 config 파일
- 해당 글자 수로 모든 컨텐츠 추출
- 3000글자 SEO 최적화된 컴포지션 생성

## 시나리오 4: 문서 업데이트 및 동기화 (Content Sync)

**목적**: 소스 문서가 변경된 후 동기화 작업

**시나리오 흐름**:
1. 전체 작업 상태 업데이트
2. 변경된 문서 식별
3. 선택적 컨텐츠 재생성
4. 마크다운 파일 생성

**사용자 커맨드**:
```bash
# 1. 전체 작업 상태 업데이트
npx @context-action/llms-generator work-status ko

# 2. 오래된 파일들 확인
npx @context-action/llms-generator work-list ko --outdated

# 3. 변경된 컨텐츠만 재추출
npx @context-action/llms-generator extract ko --overwrite

# 4. VitePress용 마크다운 생성
npx @context-action/llms-generator markdown-generate ko --overwrite
```

**기대 결과**:
- 모든 문서의 작업 상태 업데이트
- 변경된 문서 식별 및 리스트 표시
- 필요한 파일만 재생성
- 최신 마크다운 파일 생성

## 시나리오 5: 배치 처리 및 품질 관리 (Batch Quality)

**목적**: 대량 컨텐츠 처리 및 품질 검증

**시나리오 흐름**:
1. 전체 배치 생성
2. 컴포지션 통계 확인
3. 다중 글자 수 컴포지션 생성
4. 최종 검증

**사용자 커맨드**:
```bash
# 1. 전체 배치 생성 (모든 언어, 모든 포맷)
npx @context-action/llms-generator batch --lang=en,ko

# 2. 컴포지션 통계 확인
npx @context-action/llms-generator compose-stats ko

# 3. 다중 글자 수 컴포지션 배치 생성
npx @context-action/llms-generator compose-batch ko --chars=1000,3000,5000

# 4. 설정 검증
npx @context-action/llms-generator config-validate

# 5. 전체 상태 최종 확인
npx @context-action/llms-generator work-list ko
```

**기대 결과**:
- 모든 언어/포맷으로 완전한 컨텐츠 생성
- 컴포지션 통계 정보 제공
- 여러 글자 수의 최적화된 컴포지션
- 설정 유효성 확인
- 모든 작업이 완료된 상태 확인

## 핵심 테스트 포인트

각 시나리오에서 검증해야 할 핵심 포인트:

### 1. 파일 생성 검증
- 예상된 위치에 파일 생성 확인
- 파일 크기 및 내용 유효성 검사
- 설정에 따른 글자 수 제한 준수

### 2. 설정 시스템 검증
- 설정 파일 로드 및 적용 확인
- 프리셋 설정의 정확한 적용
- 글자 수 제한 enable/disable 동작

### 3. 작업 상태 관리 검증
- 파일 수정 시간 비교 정확성
- 작업 필요 여부 판단 로직
- 상태 업데이트 후 일관성

### 4. 에러 처리 검증
- 존재하지 않는 문서 처리
- 잘못된 설정 처리
- 권한 오류 등 예외 상황 처리

### 5. 성능 검증
- 대량 파일 처리 시간
- 메모리 사용량
- 동시성 처리 안정성

이러한 시나리오들은 실제 사용자의 일반적인 워크플로우를 반영하며, 각각 독립적으로 또는 연속적으로 실행될 수 있습니다.