# 사용법 예제 - 간단한 시나리오 가이드

## 🎯 -100 글자 작업 완전 가이드

### 1단계: 문서 발견 및 우선순위 생성

```bash
# 한국어 문서들 발견
npx @context-action/llms-generator discover ko

# 우선순위 파일 생성 (미리 보기)
npx @context-action/llms-generator priority-generate ko --dry-run

# 실제 우선순위 파일 생성
npx @context-action/llms-generator priority-generate ko --overwrite
```

### 2단계: 작업 상태 확인

```bash
# 전체 작업 상태 업데이트 및 확인
npx @context-action/llms-generator work-status ko

# 100자 작업이 필요한 문서들만 조회
npx @context-action/llms-generator work-list ko --chars=100 --need-update
```

### 3단계: 개별 문서 작업

```bash
# 특정 문서의 완전한 편집 컨텍스트 확인
npx @context-action/llms-generator work-context ko guide-action-handlers --chars=100

# 출력 예시:
# ================================================================================
# SOURCE CONTENT:
# ================================================================================
# (원본 문서 내용 2000자까지)
# 
# ================================================================================
# CURRENT SUMMARY (100 chars):
# ================================================================================
# (현재 요약 또는 "❌ No summary exists yet")
#
# Focus: 핸들러 기본 개념
# Priority: 80 (essential)
```

### 4단계: 요약 파일 편집

```bash
# 생성된 파일 위치에서 직접 편집
vim /Users/junwoobang/project/context-action/packages/llms-generator/data/ko/guide-action-handlers/guide-action-handlers-100.txt
```

### 5단계: 편집 후 상태 확인

```bash
# 편집된 문서 상태 재확인
npx @context-action/llms-generator work-status ko guide-action-handlers --chars=100

# 편집 완료된 문서들로 5000자 조합 테스트
npx @context-action/llms-generator compose ko 5000 --priority=70
```

## 🔧 스크립트 사용법 (더 간단함)

```bash
# 스크립트로 작업 상태 확인
node packages/llms-generator/scripts/work-status.js status ko guide-action-handlers 100

# 스크립트로 편집 컨텍스트 확인
node packages/llms-generator/scripts/work-status.js context ko guide-action-handlers 100
```

## 📊 품질 확인

### 조합 결과 검증

```bash
# 다양한 글자 수로 조합 테스트
npx @context-action/llms-generator compose-batch ko --chars=1000,3000,5000,10000

# 조합 통계 확인
npx @context-action/llms-generator compose-stats ko
```

## 🎯 핵심 파일 구조

```
packages/llms-generator/data/
├── priority-schema.json           # 스키마 (git 포함)
├── ko/                           # 생성 데이터 (git 제외)
│   ├── guide-action-handlers/
│   │   ├── priority.json         # 우선순위 + 작업상태
│   │   ├── guide-action-handlers-100.txt
│   │   ├── guide-action-handlers-300.txt
│   │   └── guide-action-handlers-1000.txt
│   └── api-action-only/
│       ├── priority.json
│       └── api-action-only-*.txt
└── en/                           # 생성 데이터 (git 제외)
    └── ...
```

## ⚡ 빠른 워크플로우

```bash
# 1. 전체 상태 확인
npx @context-action/llms-generator work-list ko --chars=100

# 2. 특정 문서 편집 컨텍스트
npx @context-action/llms-generator work-context ko [document-id] --chars=100

# 3. 편집 후 조합 테스트
npx @context-action/llms-generator compose ko 5000

# 4. 최종 결과 확인
npx @context-action/llms-generator compose-stats ko
```

## 🔍 문제 해결

### 문서가 발견되지 않는 경우
```bash
npx @context-action/llms-generator discover ko
```

### 우선순위 파일이 없는 경우
```bash
npx @context-action/llms-generator priority-generate ko --overwrite
```

### 요약 파일이 생성되지 않는 경우
```bash
npx @context-action/llms-generator extract ko --chars=100 --overwrite
```

### 조합 결과가 이상한 경우
```bash
npx @context-action/llms-generator work-status ko
npx @context-action/llms-generator compose-stats ko
```

---

이 가이드를 따르면 -100 글자 요약 작업을 체계적으로 관리할 수 있습니다.