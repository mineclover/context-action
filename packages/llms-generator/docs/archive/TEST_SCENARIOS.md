# Test Scenarios for YAML Frontmatter Summary Generation

YAML frontmatter 기반 요약 생성 기능에 대한 사용자 시나리오 테스트 가이드입니다.

## 📋 Overview

이 문서는 Context Action Framework의 llms-generator에 새로 추가된 YAML frontmatter 요약 생성 기능의 실제 사용 시나리오를 테스트 케이스로 정리한 것입니다.

## 🎯 테스트 목표

1. **기능 검증**: 모든 핵심 기능이 예상대로 작동하는지 확인
2. **오류 처리**: 다양한 오류 상황에서 적절한 처리가 되는지 검증
3. **사용성**: 실제 사용자 워크플로우에서 편의성 확인
4. **품질**: 생성된 요약의 품질과 메타데이터 정확성 검증

## 📚 Test Scenarios

### 🚀 Scenario 1: 첫 사용자 - 기본 설정 및 초기 생성

**사용자 프로필**: 프로젝트에 처음 참여한 개발자

**목표**: 기본 설정으로 한국어 minimum 포맷 기반 요약 생성

#### Test Case 1.1: 기본 환경 확인
```bash
# 1. 프로젝트 구조 확인
ls -la /Users/junwoobang/project/context-action/packages/llms-generator/

# 2. 설정 상태 확인
cd /Users/junwoobang/project/context-action
pnpm --filter @context-action/llms-generator cli config-show

# 3. 도움말 확인
pnpm --filter @context-action/llms-generator cli --help
```

**예상 결과**:
- 프로젝트 구조가 올바르게 표시됨
- 설정 파일이 로드되고 경로들이 올바르게 설정됨
- 도움말에 `generate-summaries` 명령어가 표시됨

#### Test Case 1.2: Dry-run으로 미리보기
```bash
cd /Users/junwoobang/project/context-action
pnpm --filter @context-action/llms-generator cli generate-summaries minimum ko --dry-run
```

**예상 결과**:
```
📝 [DRY RUN] Generating YAML frontmatter summaries
📊 Source: minimum format
🌐 Language: ko
📏 Character limits: 100, 300, 1000
🎯 Quality threshold: 70%
⚙️ Default strategy: concept-first
🔄 Overwrite existing: No

🧪 [DRY RUN] Would generate summaries but not save to files

📄 Documents to process: X
📊 Total summaries to generate: X * 3
📁 Output format: .md files with YAML frontmatter
  - guide-action-handlers (3 variants)
  - api-action-provider (3 variants)
  ...

💡 Remove --dry-run to execute the generation
```

#### Test Case 1.3: 실제 생성 실행
```bash
cd /Users/junwoobang/project/context-action
pnpm --filter @context-action/llms-generator cli generate-summaries minimum ko
```

**예상 결과**:
- DI container 초기화 성공
- minimum 포맷 소스 컨텐츠 생성
- 각 문서별로 100, 300, 1000자 요약 생성
- 생성 통계 표시 (성공률, 품질 점수 등)
- `.md` 파일들이 적절한 디렉토리에 생성됨

#### Test Case 1.4: 생성된 파일 검증
```bash
# 1. 생성된 파일 구조 확인
find /Users/junwoobang/project/context-action/packages/llms-generator/data/ko -name "*.md" | head -5

# 2. 샘플 파일 내용 확인
cat /Users/junwoobang/project/context-action/packages/llms-generator/data/ko/guide-action-handlers/guide-action-handlers-100.md
```

**예상 결과**:
```yaml
---
title: "액션 핸들러 가이드"
path: "guide/action-handlers"
priority: 90
tier: "critical"
language: "ko"
character_limit: 100
extraction_method: "concept-first"
quality_score: 85
generated_at: "2025-01-15T10:30:00Z"
source_type: "minimum"
document_id: "guide-action-handlers"
---

# 액션 핸들러 가이드

액션 핸들러는 Context-Action 프레임워크의 핵심 구성 요소입니다...
```

### 🔧 Scenario 2: 고급 사용자 - 커스텀 설정 및 Origin 포맷

**사용자 프로필**: 프레임워크에 익숙한 개발자, 세밀한 제어 필요

**목표**: Origin 포맷 기반으로 특정 문자 제한과 전략으로 요약 생성

#### Test Case 2.1: 커스텀 설정으로 생성
```bash
cd /Users/junwoobang/project/context-action
pnpm --filter @context-action/llms-generator cli generate-summaries origin ko \
  --chars=200,500 \
  --strategy=api-first \
  --quality=80 \
  --overwrite
```

**예상 결과**:
- Origin 포맷 소스 컨텐츠 생성 (더 상세한 내용)
- API 우선 추출 전략 사용
- 높은 품질 임계값(80%) 적용
- 기존 파일들 덮어쓰기
- 200자, 500자 요약만 생성

#### Test Case 2.2: 영어 버전 생성
```bash
cd /Users/junwoobang/project/context-action
pnpm --filter @context-action/llms-generator cli generate-summaries minimum en \
  --chars=150,400,800 \
  --strategy=comprehensive
```

**예상 결과**:
- 영어 문서들 기반 요약 생성
- 커스텀 문자 제한 적용
- comprehensive 전략으로 더 포괄적인 요약
- 영어 특화 메타데이터

### 🚨 Scenario 3: 오류 처리 - 다양한 오류 상황 대응

**사용자 프로필**: 다양한 환경에서 사용하는 개발자

**목표**: 오류 상황에서 적절한 안내 및 복구 방법 확인

#### Test Case 3.1: 잘못된 입력 처리
```bash
cd /Users/junwoobang/project/context-action

# 1. 소스 타입 누락
pnpm --filter @context-action/llms-generator cli generate-summaries

# 2. 잘못된 소스 타입
pnpm --filter @context-action/llms-generator cli generate-summaries invalid ko

# 3. 잘못된 문자 제한
pnpm --filter @context-action/llms-generator cli generate-summaries minimum ko --chars=0,20000
```

**예상 결과**:
```
❌ Error: Source type is required for generate-summaries command
   Usage: pnpm cli generate-summaries <source-type>
   Valid source types: minimum, origin

❌ Error: Invalid source type "invalid"
   Valid source types: minimum, origin

❌ Error: Invalid character limits: 0, 20000
   Character limits must be between 1 and 10,000
```

#### Test Case 3.2: 파일 시스템 오류 시뮬레이션
```bash
cd /Users/junwoobang/project/context-action

# 1. 읽기 전용 디렉토리 생성 (권한 오류 시뮬레이션)
mkdir -p /tmp/readonly-test
chmod 444 /tmp/readonly-test

# 2. 잘못된 경로로 테스트 (설정 파일 수정 없이 임시 테스트)
# 실제로는 권한 문제가 발생할 수 있는 상황 확인
ls -la /Users/junwoobang/project/context-action/packages/llms-generator/data/
```

**예상 결과**:
- 파일 권한 문제 시 적절한 오류 메시지
- 해결 방법 가이드 제공
- 스택 트레이스 (개발 모드에서)

#### Test Case 3.3: DI Container 초기화 실패
```bash
cd /Users/junwoobang/project/context-action

# Dependencies 일시적 이동 (복원 필요)
mv node_modules/gray-matter node_modules/gray-matter.bak 2>/dev/null || true
pnpm --filter @context-action/llms-generator cli generate-summaries minimum ko
mv node_modules/gray-matter.bak node_modules/gray-matter 2>/dev/null || true
```

**예상 결과**:
```
❌ DI container not initialized. This feature requires proper configuration.

🧪 Troubleshooting:
   - Ensure the generator is properly initialized
   - Check that all dependencies are installed
   - Try running: pnpm install
```

### 🔄 Scenario 4: 반복 사용자 - 개선 및 최적화

**사용자 프로필**: 정기적으로 문서를 업데이트하는 유지보수 담당자

**목표**: 기존 요약 개선 및 품질 관리

#### Test Case 4.1: 품질 분석
```bash
cd /Users/junwoobang/project/context-action

# 1. 현재 생성된 요약 확인
find /Users/junwoobang/project/context-action/packages/llms-generator/data/ko -name "*-100.md" | wc -l

# 2. 품질 개선 기능 테스트 (현재는 플레이스홀더)
pnpm --filter @context-action/llms-generator cli improve-summaries ko --min-quality=80 --dry-run
```

**예상 결과**:
```
🔧 [DRY RUN] Improving existing summaries
🌐 Language: ko
🎯 Minimum quality threshold: 80%

🧪 [DRY RUN] Would analyze and improve summaries but not save changes
💡 Remove --dry-run to execute the improvements
```

#### Test Case 4.2: 덮어쓰기 및 업데이트
```bash
cd /Users/junwoobang/project/context-action

# 1. 기존 파일의 수정 시간 확인
stat /Users/junwoobang/project/context-action/packages/llms-generator/data/ko/guide-action-handlers/guide-action-handlers-100.md

# 2. 덮어쓰기로 재생성
pnpm --filter @context-action/llms-generator cli generate-summaries minimum ko --chars=100 --overwrite

# 3. 수정 시간 변경 확인
stat /Users/junwoobang/project/context-action/packages/llms-generator/data/ko/guide-action-handlers/guide-action-handlers-100.md
```

**예상 결과**:
- 파일 수정 시간이 업데이트됨
- 메타데이터의 `generated_at` 필드 업데이트
- 품질 점수 재계산

### 🔍 Scenario 5: 통합 테스트 - 전체 워크플로우

**사용자 프로필**: CI/CD 파이프라인에서 자동화 사용

**목표**: 전체 문서 생성 파이프라인 테스트

#### Test Case 5.1: 다국어 전체 생성
```bash
cd /Users/junwoobang/project/context-action

# 1. 한국어 minimum 기반 생성
pnpm --filter @context-action/llms-generator cli generate-summaries minimum ko --chars=100,300,1000

# 2. 영어 origin 기반 생성 (있다면)
pnpm --filter @context-action/llms-generator cli generate-summaries origin en --chars=100,300,1000

# 3. 생성 결과 종합 확인
find /Users/junwoobang/project/context-action/packages/llms-generator/data -name "*.md" | wc -l
```

#### Test Case 5.2: 기존 시스템과의 호환성
```bash
cd /Users/junwoobang/project/context-action

# 1. 기존 .txt 파일 생성
pnpm --filter @context-action/llms-generator cli extract ko --chars=100,300

# 2. 새로운 .md 파일 생성
pnpm --filter @context-action/llms-generator cli generate-summaries minimum ko --chars=100,300

# 3. 두 형식 공존 확인
ls -la /Users/junwoobang/project/context-action/packages/llms-generator/data/ko/guide-action-handlers/
```

**예상 결과**:
```
guide-action-handlers-100.txt  (기존 형식)
guide-action-handlers-100.md   (새로운 형식)
guide-action-handlers-300.txt
guide-action-handlers-300.md
```

## 📊 성능 및 품질 검증

### Performance Benchmarks
```bash
cd /Users/junwoobang/project/context-action

# 시간 측정을 포함한 생성
time pnpm --filter @context-action/llms-generator cli generate-summaries minimum ko --chars=100
```

### Quality Metrics 검증
생성된 파일에서 다음 메트릭 확인:
- `quality_score`: 70 이상
- `character_limit`: 지정된 제한과 일치
- `extraction_method`: 올바른 전략 적용
- YAML frontmatter 구문 오류 없음

### Content Validation
```bash
# YAML frontmatter 구문 검증
cd /Users/junwoobang/project/context-action
find packages/llms-generator/data -name "*.md" -exec node -e "
  const fs = require('fs');
  const matter = require('gray-matter');
  try {
    const content = fs.readFileSync('{}', 'utf8');
    const parsed = matter(content);
    console.log('✅ {}');
  } catch (e) {
    console.log('❌ {}: ' + e.message);
  }
" \;
```

## 🎯 성공 기준

### 기능적 성공 기준
- [ ] 모든 명령어가 오류 없이 실행됨
- [ ] YAML frontmatter가 올바른 구문으로 생성됨
- [ ] 지정된 문자 제한을 준수함
- [ ] 메타데이터가 정확히 포함됨
- [ ] 품질 점수가 임계값 이상

### 사용성 성공 기준
- [ ] 오류 메시지가 명확하고 해결책을 제시함
- [ ] Dry-run 모드가 정확한 미리보기 제공
- [ ] 도움말이 충분히 상세함
- [ ] 진행 상황이 명확히 표시됨

### 성능 성공 기준
- [ ] 문서당 생성 시간 < 500ms
- [ ] 메모리 사용량 < 100MB
- [ ] 품질 점수 평균 > 75
- [ ] 성공률 > 90%

## 🐛 알려진 이슈 및 제한사항

1. **improve-summaries 기능**: 현재 플레이스홀더 상태
2. **의존성 요구사항**: gray-matter 라이브러리 필수
3. **DI Container**: 초기화 실패 시 기능 사용 불가
4. **파일 권한**: 출력 디렉토리 쓰기 권한 필요

## 📝 테스트 체크리스트

### 사전 준비
- [ ] 프로젝트 의존성 설치 완료
- [ ] 설정 파일 확인
- [ ] 테스트 데이터 준비

### 기본 기능 테스트
- [ ] generate-summaries minimum 성공
- [ ] generate-summaries origin 성공  
- [ ] Dry-run 모드 정상 작동
- [ ] 다양한 문자 제한 처리
- [ ] 다양한 전략 적용

### 오류 처리 테스트
- [ ] 잘못된 입력 처리
- [ ] 파일 시스템 오류 처리
- [ ] DI Container 오류 처리
- [ ] 의존성 오류 처리

### 품질 검증 테스트
- [ ] YAML frontmatter 구문 검증
- [ ] 메타데이터 정확성 확인
- [ ] 컨텐츠 품질 평가
- [ ] 문자 제한 준수 확인

### 통합 테스트
- [ ] 기존 시스템과 호환성
- [ ] 다국어 지원
- [ ] 전체 워크플로우 검증
- [ ] 성능 벤치마크

---

이 테스트 시나리오를 통해 YAML frontmatter 요약 생성 기능의 모든 측면을 체계적으로 검증할 수 있습니다.