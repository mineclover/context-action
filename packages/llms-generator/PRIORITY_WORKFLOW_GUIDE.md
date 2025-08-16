# Priority JSON 작업 현황 관리 가이드

## 🎯 개요

Priority JSON 파일들의 작업 현황을 체계적으로 관리하고, Git pre-commit hook을 통해 자동으로 검증하는 시스템입니다.

예를 들어, 100, 200, 300자 제한 중 200자만 누락된 경우나, 특정 문서의 Priority JSON이 완전히 비어있는 경우를 감지하고 관리할 수 있습니다.

## 🔍 작업 현황 파악 프로세스

### 1. 전체 현황 분석

```bash
# 전체 Priority JSON 파일들의 현황을 한눈에 파악
npx @context-action/llms-generator analyze-priority --format summary --detailed

# JSON 형식으로 상세 리포트 생성
npx @context-action/llms-generator analyze-priority --format json --output priority-report.json
```

**분석 내용:**
- 📁 총 파일 수 및 완성률
- 🌐 언어별 현황 (ko, en)
- 📂 카테고리별 완성률
- ⚠️ 문제가 있는 파일들 (빈 파일, 누락, 품질 문제)
- 💡 개선 권장사항

### 2. 개별 문서 작업 상태 확인

```bash
# 특정 문서의 작업 현황 확인
npx @context-action/llms-generator work-status ko guide-action-handlers --chars=100

# 작업이 필요한 문서들 목록 조회
npx @context-action/llms-generator work-list ko --chars=100 --missing
```

**확인 내용:**
- 각 문자 제한별 파일 존재 여부
- 업데이트 필요 여부 (소스 파일이 더 최신인지)
- 수동 편집 여부 vs 자동 생성
- 파일 크기 및 품질 평가

### 3. 누락 패턴 식별

**일반적인 누락 패턴:**
- **100자 우선 누락**: 기본 요약이 없는 경우 (가장 중요)
- **200자 선택적 누락**: 중간 길이 요약이 없는 경우
- **300자 이상 누락**: 상세 요약이 없는 경우
- **전체 누락**: Priority JSON 자체가 비어있는 경우

## 🔧 Husky Pre-commit 자동화 시스템

### 설정 방법

1. **Husky 설치** (이미 설정됨):
```bash
npm install --save-dev husky
npx husky install
```

2. **Pre-commit hook 활성화** (이미 설정됨):
```bash
npx husky add .husky/pre-commit "npx @context-action/llms-generator pre-commit-check"
```

### 검증 프로세스

```bash
# 수동으로 pre-commit 검증 실행
npx @context-action/llms-generator pre-commit-check \
  --data-dir ./data \
  --languages ko,en \
  --required-limits 100,200,300,1000,2000 \
  --critical-limits 100,200 \
  --max-missing 10 \
  --report pre-commit-report.json
```

**검증 단계:**
1. **🔍 Priority JSON 파일 스캔**: 모든 언어의 Priority JSON 파일 검사
2. **⚡ 중요 이슈 체크**: 100자, 200자 제한 누락 등 중요한 문제 확인
3. **🔧 자동 수정 시도**: 빈 파일에 기본 구조 자동 생성
4. **📊 작업 상태 분석**: WorkStatusManager를 통한 상세 분석
5. **✅ 커밋 허용/차단 결정**: 설정된 임계값에 따라 커밋 허용 여부 결정

### 커밋 차단 조건

**🚫 커밋 차단 (중요 이슈):**
- 100자 또는 200자 제한이 3개 이상 문서에서 누락
- 빈 Priority JSON 파일이 10개 이상
- 전체 완성률이 20% 미만

**⚠️ 경고 (커밋 허용):**
- 300자 이상 제한 누락
- 업데이트가 필요한 파일들
- 품질 점수가 낮은 파일들

## 📋 작업 관리 시나리오

### 시나리오 1: 200자 제한만 누락된 경우

```bash
# 1. 현황 파악
npx @context-action/llms-generator work-list ko --chars=200 --missing

# 2. 특정 문서 상세 확인
npx @context-action/llms-generator work-context ko guide-action-handlers --chars=200

# 3. 작업 후 상태 업데이트
npx @context-action/llms-generator work-status ko guide-action-handlers
```

### 시나리오 2: 전체 Priority JSON이 비어있는 경우

```bash
# 1. 빈 파일들 식별
npx @context-action/llms-generator analyze-priority --format table

# 2. 자동 수정 시도 (기본 구조 생성)
npx @context-action/llms-generator pre-commit-check --no-block

# 3. 수동으로 Priority 데이터 추가
npx @context-action/llms-generator priority-generate ko --overwrite
```

### 시나리오 3: 대량 업데이트 필요한 경우

```bash
# 1. 업데이트가 필요한 모든 파일 확인
npx @context-action/llms-generator work-check ko --show-outdated

# 2. 배치 작업으로 요약 재생성
npx @context-action/llms-generator extract-all --lang=ko --overwrite

# 3. 작업 상태 전체 업데이트
npx @context-action/llms-generator work-status ko
```

## 🎛️ 설정 옵션

### Pre-commit Check 옵션

```bash
npx @context-action/llms-generator pre-commit-check --help
```

**주요 옵션:**
- `--required-limits`: 필수 문자 제한 (기본: 100,200,300)
- `--critical-limits`: 중요 문자 제한 (기본: 100,200)
- `--max-missing`: 허용 가능한 최대 누락 파일 수 (기본: 5)
- `--no-auto-fix`: 자동 수정 비활성화
- `--no-block`: 중요 이슈에도 커밋 허용
- `--strict`: 엄격 모드 (모든 경고를 에러로 처리)
- `--quiet`: 간단한 출력만 표시

### 커스터마이징

**.husky/pre-commit 파일 수정:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 커스텀 설정으로 검증
npx @context-action/llms-generator pre-commit-check \
  --critical-limits 100,200 \
  --max-missing 3 \
  --strict \
  --report .husky/pre-commit-report.json
```

## 📊 리포트 및 모니터링

### 자동 생성 리포트

**Pre-commit 리포트** (`.husky/pre-commit-report.json`):
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "result": {
    "success": true,
    "canCommit": true,
    "summary": {
      "totalChecked": 128,
      "missingFiles": 2,
      "outdatedFiles": 5,
      "autoFixed": 1,
      "criticalIssues": 0
    },
    "details": {
      "blockers": [],
      "warnings": ["ko: 300자 제한 파일 2개 누락"],
      "autoFixed": ["기본 Priority 구조 생성: api-guide/priority.json"],
      "recommendations": ["ko 언어의 300자 제한 파일 2개를 생성하세요"]
    }
  }
}
```

### 정기적 모니터링

**일일 상태 체크:**
```bash
# 매일 아침 실행하여 전체 현황 파악
npx @context-action/llms-generator analyze-priority --format summary
```

**주간 상세 리포트:**
```bash
# 주간 상세 리포트 생성
npx @context-action/llms-generator analyze-priority \
  --format json \
  --detailed \
  --output weekly-priority-report.json
```

## 🚀 베스트 프랙티스

### 1. 단계적 접근

1. **100자 → 200자 → 300자** 순서로 작업
2. **중요 문서부터** 우선 처리 (API 가이드 → 개념 가이드 → 예제)
3. **언어별 완성도** 균형 맞추기

### 2. 품질 관리

- **자동 생성된 내용**은 반드시 수동 검토
- **템플릿 표현** 제거 ("개요를 제공합니다" 등)
- **구체적인 내용**으로 수정

### 3. 팀 협업

- **Pre-commit hook**으로 품질 게이트 유지
- **정기적인 리포트**로 진행 상황 공유
- **우선순위 기반** 작업 분배

## 🛠️ 문제 해결

### 자주 발생하는 이슈

**1. Pre-commit hook이 실행되지 않는 경우:**
```bash
# Hook 권한 확인
chmod +x .husky/pre-commit

# Husky 재설치
npx husky install
```

**2. 대량의 누락 파일로 인한 커밋 차단:**
```bash
# 임시로 제한 완화
npx @context-action/llms-generator pre-commit-check --max-missing 50 --no-block
```

**3. 자동 수정이 작동하지 않는 경우:**
```bash
# 수동으로 기본 구조 생성
npx @context-action/llms-generator priority-generate ko --dry-run
```

이 가이드를 통해 Priority JSON 작업 현황을 체계적으로 관리하고, 품질을 지속적으로 개선할 수 있습니다!