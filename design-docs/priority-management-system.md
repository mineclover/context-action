# Priority Management System Design

## 목표 및 구현 현황 ✅

### ✅ 구현 완료된 기능들
- ✅ **자동화된 Priority 계산**: `priority-auto` 명령어로 구현 완료
- ✅ **일관성 있는 Priority 관리**: 건강도 점수 시스템으로 구현 완료
- ✅ **다국어 문서 처리**: 한국어/영어 자동 감지 및 처리 완료
- ✅ **자동화 워크플로우**: Post-commit 훅으로 완전 자동화 완료

### 🚧 계획된 기능들
- 🚧 **팀 작업 현황 추적**: WorkStatusCommand 설계 완료, 구현 예정
- 🚧 **외부 서버 연동**: API 설계 완료, 구현 예정

## 핵심 컴포넌트

### 1. PriorityManagerCommand
```typescript
interface PriorityManagerOptions {
  mode: 'stats' | 'health' | 'sync' | 'auto-calc' | 'suggest';
  server?: string;
  criteria?: string;
  documentId?: string;
  force?: boolean;
}

class PriorityManagerCommand {
  async execute(options: PriorityManagerOptions): Promise<void> {
    switch (options.mode) {
      case 'stats': return this.showPriorityStats();
      case 'health': return this.checkPriorityHealth();
      case 'sync': return this.syncWithServer(options.server);
      case 'auto-calc': return this.autoCalculatePriorities(options.criteria);
      case 'suggest': return this.suggestPriorities();
    }
  }
}
```

### 2. WorkStatusCommand
```typescript
interface WorkStatusOptions {
  action: 'claim' | 'update' | 'release' | 'status';
  documentId: string;
  status?: 'working' | 'review' | 'blocked' | 'completed';
  assignee?: string;
  notes?: string;
}

class WorkStatusCommand {
  async execute(options: WorkStatusOptions): Promise<void> {
    // 작업 현황 관리
  }
}
```

### 3. 외부 서버 연동 API
```typescript
interface PriorityServerAPI {
  // Priority 동기화
  GET /api/priorities
  POST /api/priorities/sync
  PUT /api/priorities/{documentId}
  
  // 작업 현황
  GET /api/work-status
  POST /api/work-status/claim
  PUT /api/work-status/{documentId}
  DELETE /api/work-status/{documentId}
  
  // 팀 현황
  GET /api/team/progress
  GET /api/team/workload
}
```

## 자동 Priority 계산 기준

### 기본 요소 (가중치)
- **문서 크기**: 40% (큰 문서 = 높은 우선순위)
- **카테고리**: 30% (guide > concept > examples)
- **키워드 밀도**: 20% (핵심 키워드 포함도)
- **연관성**: 10% (다른 문서와의 참조 관계)

### 동적 요소
- **최근 수정**: +10점 (1주일 내)
- **사용자 피드백**: +5점 (GitHub Issues)
- **완성도**: -20점 (이미 완성된 경우)

### 팀 협업 요소
- **작업자 할당**: 현재 작업 중인 경우 우선순위 조정
- **의존성**: 다른 작업의 선행 조건인 경우 +15점
- **전문성 매칭**: 작업자 전문 분야와 매칭 시 +5점

## 구현 단계 및 진행 현황

### ✅ Phase 1: 로컬 Priority 관리 (완료)
1. ✅ **PriorityManagerCommand 구현**: 5가지 모드로 완전 구현
   - `stats`: 통계 분석 및 분포 확인
   - `health`: 0-100 건강도 점수 시스템
   - `suggest`: 데이터 기반 권고사항 제공
   - `auto-calc`: 설정 가능한 기준 기반 자동 계산
   - `sync`: 외부 서버 연동 준비 (API 설계 완료)

2. ✅ **자동 Priority 계산 로직**: 완전 구현
   - 문서 크기, 카테고리, 키워드 밀도, 상호 참조 기반
   - 사용자 정의 기준 파일 지원
   - 강제 업데이트 및 임계값 기반 선택적 업데이트

3. ✅ **다국어 문서 처리**: 고급 기능으로 확장 구현
   - 한국어/영어 자동 감지 및 처리
   - 언어별 필터링 옵션 (`--only-korean`, `--only-english`, `--languages`)
   - Post-commit 훅 자동화

4. ✅ **자동화 워크플로우**: Post-commit 훅으로 완전 자동화
   - `docs/(en|ko)/**/*.md` 변경사항 자동 감지
   - 7개 글자 수 제한 템플릿 자동 생성 (100-5000자)
   - `priority.json` 메타데이터 자동 생성
   - 별도 커밋으로 깔끔한 히스토리 관리

### 🚧 Phase 2: 팀 협업 기능 (설계 완료, 구현 대기)
1. 🚧 **WorkStatusCommand 구현**: 인터페이스 설계 완료
2. 🚧 **팀 현황 대시보드**: 웹 기반 인터페이스 계획
3. 🚧 **충돌 방지 메커니즘**: 동시 작업 감지 로직 설계

### 🚧 Phase 3: 외부 서버 연동 (API 설계 완료, 구현 대기)
1. 🚧 **API 서버 구현**: RESTful API 설계 완료
2. 🚧 **실시간 동기화**: WebSocket 기반 실시간 업데이트
3. 🚧 **웹 대시보드**: React 기반 관리 인터페이스

### ✅ Phase 4: 문서화 및 CLI 도구 (완료)
1. ✅ **완전한 CLI 참조 문서**: 영어/한국어 버전
2. ✅ **Priority Management 가이드**: 포괄적인 사용자 가이드
3. ✅ **npm 스크립트 통합**: 편리한 명령어 단축키
4. ✅ **오류 처리 및 디버깅**: 견고한 오류 처리 시스템

## 실제 사용 시나리오 (구현 완료)

### ✅ 시나리오 1: 일일 작업 계획 (현재 구현됨)
```bash
# 1. 현재 Priority 상태 확인
pnpm llms:priority-stats

# 2. 시스템 건강도 확인
pnpm llms:priority-health

# 3. 다음 작업 선택 (언어별 가능)
pnpm llms:work-next --language ko
pnpm llms:work-next --language en

# 4. 문서 작업 후 자동 처리됨 (Post-commit 훅)
# - 변경된 docs/(en|ko)/**/*.md 파일 자동 감지
# - 템플릿 및 priority.json 자동 생성
# - 별도 커밋으로 LLMS 파일 업데이트
```

### ✅ 시나리오 2: 다국어 문서 처리 (현재 구현됨)
```bash
# 1. 한국어 문서만 처리
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/example.md

# 2. 영어 문서만 처리
pnpm llms:sync-docs:en --changed-files docs/en/guide/example.md

# 3. 특정 언어들만 처리
node cli.js sync-docs --languages ko,en --changed-files files...

# 4. 미리보기 모드
pnpm llms:sync-docs:dry --changed-files files...
```

### ✅ 시나리오 3: Priority 관리 및 최적화 (현재 구현됨)
```bash
# 1. Priority 일관성 체크 (0-100 점수)
pnpm llms:priority-health

# 2. 데이터 기반 개선 제안
pnpm llms:priority-suggest

# 3. 자동 재계산 (사용자 정의 기준 지원)
pnpm llms:priority-auto --criteria ./custom-criteria.json --force

# 4. 통계 분석
pnpm llms:priority-stats
```

### 🚧 시나리오 4: 팀 협업 (계획됨)
```bash
# 1. 작업 착수 선언 (구현 예정)
pnpm llms:work-claim guide--hooks

# 2. 작업 완료 후 해제 (구현 예정)
pnpm llms:work-release guide--hooks --status completed

# 3. 외부 서버와 동기화 (구현 예정)
pnpm llms:priority-sync --server https://team-priorities.example.com
```

## 메트릭 추적

### Priority 품질 지표
- Priority 분산도 (표준편차)
- 작업 완료 예측 정확도
- 팀원간 Priority 일치도

### 작업 효율성 지표
- 평균 작업 완료 시간
- 작업 전환 빈도
- 우선순위 변경 빈도

## 확장 가능성

### AI 기반 Priority 추천
- 문서 내용 분석으로 자동 Priority 계산
- 사용자 행동 패턴 학습
- 계절성/트렌드 반영

### 워크플로우 자동화
- GitHub Issues 연동
- Slack 알림 통합
- 자동 작업 할당

### 분석 대시보드
- 팀 생산성 분석
- Priority 패턴 분석
- 작업 병목 지점 식별