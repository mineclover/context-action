# CLI 리펙토링 계획서

## 🎯 목표
- 45개 명령어를 15개 핵심 명령어로 축소
- 단일 파일 1,886줄을 모듈화된 구조로 분리
- 사용성 개선 및 유지보수성 향상
- Husky + Frontmatter 연동 준비

## 📊 현재 vs 신규 명령어 매핑

### 🔧 1. Config 관련 (4개 → 1개 통합)
```bash
# 현재
config-init [preset]
config-show
config-validate  
config-limits

# 신규
init [preset] [--show] [--validate] [--limits]
```

### 📝 2. Generate 관련 (6개 → 1개 통합)
```bash
# 현재
minimum
origin
chars <limit> [lang]
batch [options]
generate-md [lang]
generate-all [options]

# 신규
generate <type> [options]
# type: minimum|origin|chars|batch|md|all
# generate chars 1000 ko
# generate md --lang=en,ko
# generate all --chars=100,500,1000
```

### 📋 3. Priority 관련 (14개 → 2개 통합)
```bash
# 현재 (과도함)
priority-generate, template-generate, priority-stats, discover
analyze-priority, check-priority-status, simple-check
simple-llms-generate, simple-llms-batch, simple-llms-stats
llms-generate, migrate-to-simple, pre-commit-check, sync-docs

# 신규
priority <action> [options]
# action: generate|stats|discover|check|analyze
# priority generate --lang=ko --dry-run
# priority stats --detailed
# priority check --fix

analyze <target> [options] 
# target: priority|work|docs|all
# analyze priority --format=table --cache
# analyze work --language=ko --detailed
```

### 💼 4. Work 관련 (6개 → 1개 통합)
```bash
# 현재
work-status, work-context, work-list, work-check
instruction-generate, instruction-batch, instruction-template

# 신규
work <action> [options]
# action: status|context|list|check|instruction
# work status ko --chars=100 --need-edit
# work context ko guide-action-handlers
# work instruction ko --template=default --batch
```

### 📄 5. Content 관련 (8개 → 2개 통합)
```bash
# 현재
extract, extract-all, compose, compose-batch, compose-stats
markdown-generate, markdown-all

# 신규
extract <scope> [options]
# scope: single|all|batch
# extract single ko --chars=100,300,1000
# extract all --dry-run

compose <mode> [options]
# mode: single|batch|stats|markdown
# compose single ko 1000 --no-toc
# compose markdown ko --chars=100,300,1000
```

### 📋 6. Summary 관련 (2개 → 1개 통합)
```bash
# 현재
generate-summaries <format> [lang]
improve-summaries [lang]

# 신규
summary <action> [options]
# action: generate|improve|validate
# summary generate minimum ko --chars=100,300
# summary improve ko --min-quality=80
```

### 🔧 7. Schema & Validation (4개 → 2개 통합)
```bash
# 현재
schema-generate, schema-info
config-validate, pre-commit-check

# 신규  
schema <action> [options]
# action: generate|info|validate
# schema generate --no-types --javascript

validate <target> [options]
# target: config|priority|frontmatter|all
# validate config
# validate priority --critical-limits=100,200
# validate frontmatter --fix
```

### 🔄 8. Sync & Migration (4개 → 1개 통합)
```bash
# 현재
sync-docs, migrate-to-simple, generate-files, sync-all

# 신규
sync <mode> [options]
# mode: docs|simple|files|all
# sync docs --changed-files=file1,file2
# sync simple --backup --dry-run
```

## 🏗️ 구현 전략

### Phase 1: 핵심 구조 생성
1. **새 CLI 엔트리 포인트 생성** (`src/cli/new-index.ts`)
2. **라우팅 시스템 구축** (`CLIRouter.ts`)
3. **명령어 베이스 클래스** (`BaseCommand.ts`)

### Phase 2: 명령어 통합 구현
1. **ConfigCommand** (init 통합)
2. **GenerateCommand** (generate 통합) 
3. **PriorityCommand** (priority 통합)
4. **WorkCommand** (work 통합)

### Phase 3: 고급 기능 구현
1. **ContentCommand** (extract, compose 통합)
2. **SummaryCommand** (summary 통합)
3. **SchemaCommand** (schema 통합)
4. **SyncCommand** (sync 통합)
5. **ValidateCommand** (validate 통합)

### Phase 4: 테스트 및 마이그레이션
1. **기존 명령어 호환성 테스트**
2. **새 명령어 통합 테스트**
3. **기존 CLI 대체**
4. **문서 업데이트**

## 🔄 Husky 연동 설계

### Git Hook 전용 명령어
```bash
# Pre-commit hook
validate all --fix --quiet
priority check --auto-fix
summary validate --fix

# Pre-push hook  
work check --comprehensive
analyze priority --critical

# Post-commit hook
sync docs --auto --quiet
```

### Frontmatter 자동 관리
```bash
# work-status 자동 업데이트
work sync --frontmatter-only
summary validate --work-status
validate frontmatter --auto-fix
```

## 📋 마이그레이션 로드맵

### Week 1: 구조 설계 및 핵심 구현
- [ ] 새 CLI 구조 생성
- [ ] ConfigCommand, GenerateCommand 구현
- [ ] 기본 라우팅 시스템 구축

### Week 2: 주요 기능 통합  
- [ ] PriorityCommand, WorkCommand 구현
- [ ] ContentCommand, SummaryCommand 구현
- [ ] 기존 기능 호환성 확보

### Week 3: 고급 기능 및 테스트
- [ ] SchemaCommand, SyncCommand, ValidateCommand 구현
- [ ] 통합 테스트 작성
- [ ] Husky 연동 준비

### Week 4: 마이그레이션 및 문서화
- [ ] 기존 CLI 대체
- [ ] 문서 업데이트  
- [ ] 사용자 가이드 작성

## 🎯 성공 지표

### 정량적 지표
- **명령어 수**: 45개 → 15개 (66% 감소)
- **코드 라인**: 1,886줄 → 800줄 예상 (57% 감소)
- **파일 수**: 1개 → 15개 모듈화

### 정성적 지표
- **사용성**: 직관적인 명령어 구조
- **유지보수성**: 모듈화된 구조
- **확장성**: 새 기능 추가 용이성
- **성능**: 빠른 명령어 실행

## ⚠️ 리스크 및 대응책

### 리스크
1. **기존 사용자 혼란**: 명령어 변경으로 인한 학습 곡선
2. **기능 누락**: 통합 과정에서 일부 기능 손실 가능
3. **호환성 문제**: 기존 스크립트 동작 불가

### 대응책
1. **점진적 마이그레이션**: 기존 명령어 병행 지원 (deprecated 경고)
2. **종합 테스트**: 모든 기존 기능 동작 검증
3. **마이그레이션 가이드**: 상세한 변경 사항 문서화
4. **Alias 지원**: 기존 명령어를 새 명령어로 자동 변환

## 📝 다음 단계

1. **새 CLI 구조 생성** 시작
2. **ConfigCommand 프로토타입** 구현
3. **라우팅 시스템** 기본 설계
4. **테스트 환경** 준비