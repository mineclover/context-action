# Work Queue CLI - 작업 대상 순차 관리 도구

Priority.json 파일들의 수동 완성 작업을 체계적으로 관리하기 위한 CLI 도구입니다.

## 🎯 목적

Enhanced LLMS Generator 시스템에서 생성된 priority.json 템플릿들을 효율적으로 완성하기 위해:

1. **작업 우선순위**: 작업 필요도와 중요도에 따른 자동 정렬
2. **진행 상황 추적**: 완료/건너뛰기/남은 작업 상태 관리  
3. **작업 연속성**: 중단된 작업을 이어서 수행 가능
4. **다국어 지원**: 언어별 독립적인 작업 큐 관리

## 📋 주요 기능

### 작업 우선순위 계산
```javascript
// 작업 필요도 점수 계산 (최대 43점)
- Missing priority score: +10점
- Missing priority tier: +8점  
- Missing extraction strategy: +7점
- Missing primary goal: +6점
- No primary keywords: +5점
- Missing complexity tag: +4점
- No dependencies defined: +3점
```

### 자동 정렬 기준
1. **작업 필요도 점수** (높은 순)
2. **우선순위 점수** (높은 순)  
3. **카테고리 순서** (guide → concept → api → examples)
4. **알파벳 순**

## 🚀 사용법

### 기본 CLI
```bash
# 도움말
node work-queue-cli.cjs

# 다음 작업 대상 가져오기
node work-queue-cli.cjs next en

# 작업 상태 확인
node work-queue-cli.cjs status en

# 작업 목록 보기
node work-queue-cli.cjs list ko

# 작업 완료 처리
node work-queue-cli.cjs complete guide-action-handlers en

# 작업 건너뛰기
node work-queue-cli.cjs skip api-complex-item en

# 작업 큐 초기화
node work-queue-cli.cjs reset en
```

### 간편 래퍼 스크립트 (./wq)
```bash
# 다음 작업 (기본: 영어)
./wq n
./wq n ko

# 상태 확인
./wq s
./wq s ko

# 목록 보기 
./wq l
./wq l ko --all

# 작업 완료
./wq c guide-action-handlers
./wq c guide-action-handlers ko

# 빠른 상태 체크
./wq quick

# 작업 모드 (에디터 열기)
./wq work en
```

## 📊 작업 상태 관리

### 상태 파일: `work-queue-state.json`
```json
{
  "currentIndex": {},
  "completed": {
    "en": ["guide-action-handlers", "guide-action-pipeline"],
    "ko": ["guide-action-handlers"]
  },
  "skipped": {
    "en": ["api-very-complex-item"]
  },
  "lastUpdated": "2025-08-16T01:48:55.940Z"
}
```

### 작업 상태 표시
- `👉` 현재 작업 대상
- `✅` 완료된 작업
- `⏭️` 건너뛴 작업  
- `⏳` 대기 중인 작업

## 🎯 권장 워크플로우

### 1. 현재 상태 확인
```bash
./wq quick
# 📊 Quick Status:
#   en: 2/100
#   ko: 0/26
```

### 2. 다음 작업 대상 확인
```bash
./wq n en
# 👉 Next work target:
# 📌 ID: guide-architecture
# 📖 Title: Guide Architecture
# 🔧 Work needed (Score: 43):
#    • Missing priority score
#    • Missing priority tier
#    ...
```

### 3. Priority.json 파일 편집
```bash
# 자동으로 에디터 열기
./wq work en

# 또는 수동으로
code /path/to/priority.json
```

### 4. 작업 완료 처리
```bash
./wq c guide-architecture en
# ✅ Marked guide-architecture as completed
# ✨ Use './wq n en' to get next work target
```

### 5. 진행 상황 확인
```bash
./wq s en
# 📊 Work Queue Status (EN)
# 📈 Progress:
#    Total Targets: 102
#    ✅ Completed: 3 (2.9%)
#    ⏳ Remaining: 99 (97.1%)
```

## 🛠️ 고급 사용법

### 환경 변수 설정
```bash
# 기본 언어 설정
export WQ_DEFAULT_LANG=ko
./wq n  # ko 언어로 다음 작업 대상 조회
```

### 작업 건너뛰기 사용 사례
- 매우 복잡해서 나중에 처리할 항목
- 현재 정보가 부족한 항목
- 우선순위가 낮은 항목

### 카테고리별 진행 상황
```bash
./wq s en
# 📁 By Category:
#    guide: 3/6 (50.0%) - 3 remaining
#    concept: 0/5 (0.0%) - 5 remaining  
#    api: 0/87 (0.0%) - 87 remaining
#    examples: 0/4 (0.0%) - 4 remaining
```

## 🔧 트러블슈팅

### 작업 큐 초기화
```bash
# 특정 언어만 초기화
./wq r en

# 전체 초기화  
./wq r
```

### 상태 파일 수동 편집
```bash
# 상태 파일 위치
packages/llms-generator/work-queue-state.json

# 백업 후 편집
cp work-queue-state.json work-queue-state.json.backup
```

### 작업 대상 재스캔
작업 큐는 매번 실행시 현재 파일 시스템 상태를 스캔하므로, 새로 추가된 priority.json 파일들은 자동으로 감지됩니다.

## 📈 통계 및 분석

### 작업 필요도 분석
- **평균 작업 점수**: 미완료 항목들의 평균 작업 필요도
- **작업 필요 항목 수**: 점수가 0보다 큰 항목들의 개수
- **카테고리별 진행률**: 각 카테고리별 완성도

### 진행률 계산
```
완성률 = (완료 + 건너뛰기) / 전체 * 100%
실제 작업률 = 완료 / 전체 * 100%
```

## 🎨 커스터마이징

### 작업 우선순위 조정
`work-queue-cli.cjs`의 `assessWorkNeeded()` 함수에서 점수 가중치 조정 가능

### 정렬 기준 변경  
`sortByWorkPriority()` 함수에서 정렬 로직 커스터마이징 가능

### 추가 명령어 구현
래퍼 스크립트 `wq`에 새로운 단축 명령어 추가 가능

---

이 도구를 사용하여 102개(영어) + 26개(한국어) = 총 128개의 priority.json 파일을 체계적으로 완성할 수 있습니다.