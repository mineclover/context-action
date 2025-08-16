# Git Hooks 자동 워크플로우

이 디렉토리는 llms-generator를 위한 Git 훅들을 포함합니다.

## 🔄 자동화된 워크플로우

### 1. **pre-commit** - 커밋 전 검증
```bash
🔍 Priority JSON 파일들을 검증합니다...
```
- **목적**: 커밋 전 Priority JSON 파일들의 완성도 검증
- **설정**: `llms-generator.config.json`의 `preCommit` 섹션에서 관리
- **동작**: Config 기반으로 자동 검증, 문제 발견 시 커밋 차단

### 2. **post-commit** - 커밋 후 동기화
```bash
🔄 커밋 후 문서 동기화를 시작합니다...
```
- **목적**: 커밋된 문서들의 자동 동기화
- **동작**: 
  - 요약 문서 변경 → 관련 Priority JSON 업데이트
  - 실제 문서 변경 → 요약 문서 프론트매터 업데이트

### 3. **post-merge** - Merge 후 동기화
```bash
🔀 Merge 후 문서 동기화를 확인합니다...
```
- **목적**: Pull이나 Merge 후 문서 동기화
- **동작**: 변경된 문서들만 선택적으로 동기화

## 📋 문서 동기화 시스템

### 양방향 동기화
1. **요약 문서 → 실제 문서**
   - `docs/llms/*.txt` 파일 변경 감지
   - 관련 `data/*/documentId.json` 프론트매터 업데이트
   - `lastSummaryUpdate` 타임스탬프 기록

2. **실제 문서 → 요약 문서**
   - `docs/**/*.md` 파일 변경 감지  
   - 관련 요약 문서 헤더 업데이트
   - `needsUpdate: true` 플래그 설정

### 자동 감지 패턴
- **요약 문서**: `/llms/` 폴더의 `.txt` 파일들
- **실제 문서**: `/docs/` 하위의 `.md` 파일들 (llms 폴더 제외)

## 🛠️ 수동 실행

필요시 수동으로 문서 동기화를 실행할 수 있습니다:

```bash
# 기본 동기화 (변경된 파일 자동 감지)
npx @context-action/llms-generator sync-docs

# 특정 파일들만 동기화
npx @context-action/llms-generator sync-docs --changed-files "docs/guide.md,docs/api.md"

# 드라이런 (실제 변경 없이 분석만)
npx @context-action/llms-generator sync-docs --dry-run

# 요약→실제 방향만
npx @context-action/llms-generator sync-docs --mode summary-to-source

# 실제→요약 방향만  
npx @context-action/llms-generator sync-docs --mode source-to-summary
```

## ⚙️ 설정

모든 설정은 `llms-generator.config.json`에서 관리됩니다:

```json
{
  "preCommit": {
    "enabled": true,
    "validation": {
      "requiredLimits": [100, 200, 300, 1000, 2000],
      "criticalLimits": [100, 200],
      "maxMissingDocuments": 10,
      "reportPath": ".husky/pre-commit-report.json",
      "autoFix": true
    }
  }
}
```

## 🔧 Husky 관리

### 훅 활성화/비활성화
```bash
# 모든 훅 비활성화
echo "exit 0" > .husky/pre-commit
echo "exit 0" > .husky/post-commit
echo "exit 0" > .husky/post-merge

# 훅 재활성화 (이 파일들을 복원)
git checkout .husky/
```

### 문제 해결
```bash
# 훅 권한 확인
ls -la .husky/

# 실행 권한 부여
chmod +x .husky/*

# 훅 테스트
./.husky/pre-commit
./.husky/post-commit
```

## 📊 리포트 파일

- **`.husky/pre-commit-report.json`**: Pre-commit 검증 상세 결과
- 커밋 차단 시 이 파일을 확인하여 문제점 파악 가능