# Enhanced API Documentation Sync Script

TypeDoc API 문서를 VitePress 형식으로 동기화하는 고도화된 스크립트입니다.

## 🚀 주요 기능

### ⚡ 스마트 캐싱 시스템
- **SHA256 해시 기반** 파일 변경 감지
- **24시간 TTL** 자동 만료
- **100% 캐시 히트시 67% 성능 향상**
- 소스/타겟 파일 이중 검증

### 🔄 병렬 처리 최적화
- 배치 크기 기반 병렬 처리 (기본: 10개 파일 단위)
- Promise.all 활용 비동기 처리
- 설정 가능한 최대 워커 수

### 🛡️ 에러 처리 & 복구
- 에러 코드별 맞춤 복구 전략
- 상세 에러 컨텍스트 및 스택 추적
- 경고와 에러 분리 관리

### ✨ 품질 검증 시스템
- 마크다운 문법 검증
- 내부 링크 무결성 체크
- 접근성 검사 (이미지 alt 텍스트, 제목 계층)

### 📊 메트릭스 & 모니터링
- 처리 시간, 캐시 히트율 추적
- 품질 이슈 자동 감지
- JSON 형태 상세 보고서 생성

## 📋 사용법

### 기본 실행
```bash
# 고도화된 스크립트 실행
node scripts/sync-api-docs-enhanced.js

# 기존 스크립트 (비교용)
node scripts/sync-api-docs.js
```

### package.json 스크립트 추가
```json
{
  "scripts": {
    "docs:sync": "node scripts/sync-api-docs.js",
    "docs:sync:enhanced": "node scripts/sync-api-docs-enhanced.js",
    "docs:full:enhanced": "pnpm docs:api && pnpm docs:sync:enhanced && pnpm docs:build"
  }
}
```

## ⚙️ 설정

스크립트 상단의 CONFIG 객체에서 모든 설정을 조정할 수 있습니다:

```javascript
const CONFIG = {
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
  
  // 캐싱 설정
  cache: {
    enabled: true,                    // 캐싱 활성화
    dir: './.api-docs-cache',        // 캐시 디렉토리
    hashAlgorithm: 'sha256',         // 해시 알고리즘
    ttl: 24 * 60 * 60 * 1000,       // TTL: 24시간
    manifestFile: '.api-docs-cache/cache-manifest.json'
  },
  
  // 병렬 처리 설정
  parallel: {
    enabled: true,                   // 병렬 처리 활성화
    maxWorkers: 4,                   // 최대 워커 수
    batchSize: 10                    // 배치 크기
  },
  
  // 품질 검증 설정
  quality: {
    validateLinks: true,             // 링크 검증
    validateMarkdown: true,          // 마크다운 검증
    checkAccessibility: true         // 접근성 검사
  },
  
  // 메트릭스 설정
  metrics: {
    enabled: true,                   // 메트릭스 수집
    outputFile: './reports/api-docs-metrics.json'
  }
};
```

## 📊 출력 예시

### 첫 번째 실행 (캐시 미스)
```bash
🚀 TypeDoc API 문서 동기화 시작 (고도화 버전)...

📁 캐시 디렉토리 생성: ./.api-docs-cache

📦 패키지 처리 중: core
📄 파일 처리: README.md
📄 파일 처리: ActionRegister.md
# ... 76개 파일 처리

============================================================
✅ API 문서 동기화 완료!
============================================================
📁 동기화 위치: ./docs/en/api
📄 처리된 파일: 76개
⏱️  처리 시간: 0.03초

📊 캐시 통계:
  - 히트율: 0.00%
  - 미스: 76회
```

### 두 번째 실행 (캐시 히트)
```bash
🚀 TypeDoc API 문서 동기화 시작 (고도화 버전)...

📋 캐시 매니페스트 로드됨: 76개 항목

📦 패키지 처리 중: core
✨ 캐시 히트: README.md
✨ 캐시 히트: ActionRegister.md
# ... 76개 파일 캐시 히트

============================================================
✅ API 문서 동기화 완료!
============================================================
📁 동기화 위치: ./docs/en/api
📄 처리된 파일: 76개
⏱️  처리 시간: 0.01초

📊 캐시 통계:
  - 히트율: 100.00%
  - 히트: 76회
```

## 📁 생성되는 파일들

### 캐시 파일
```
.api-docs-cache/
├── cache-manifest.json         # 캐시 메타데이터
```

### 보고서 파일
```
reports/
├── api-docs-metrics.json       # 성능 메트릭스
```

### 메트릭스 예시
```json
{
  "filesProcessed": 76,
  "filesSkipped": 0,
  "errors": 0,
  "warnings": 2,
  "totalSize": 1048576,
  "processingTime": 30,
  "cache": {
    "hits": 76,
    "misses": 0,
    "expired": 0,
    "total": 76,
    "hitRate": "100.00%"
  },
  "quality": {
    "totalIssues": 11,
    "files": [
      {
        "file": "./docs/en/api/react/src/functions/useStore.md",
        "issues": ["Empty link found"]
      }
    ]
  }
}
```

## 🔧 고급 사용법

### 캐시 초기화
```bash
# 캐시 디렉토리 삭제
rm -rf .api-docs-cache

# 또는 만료된 캐시만 정리 (자동 실행됨)
# 스크립트가 24시간 이상된 캐시를 자동 정리
```

### 특정 설정으로 실행
스크립트 파일을 복사하여 설정을 수정하거나, 환경변수로 제어할 수 있습니다:

```bash
# 캐시 비활성화
DISABLE_CACHE=true node scripts/sync-api-docs-enhanced.js

# 병렬 처리 비활성화
DISABLE_PARALLEL=true node scripts/sync-api-docs-enhanced.js
```

## 🚨 문제 해결

### 권한 오류 (EACCES)
```bash
# 스크립트가 자동으로 권한 관련 팁을 제공합니다
🔧 복구 시도: 권한 부족
💡 팁: sudo 권한으로 실행하거나 파일 권한을 확인하세요.
```

### 디스크 공간 부족 (ENOSPC)
```bash
# 스크립트가 자동으로 디스크 공간 관련 팁을 제공합니다
🔧 복구 시도: 디스크 공간 부족
💡 팁: 디스크 공간을 확보한 후 다시 시도하세요.
```

### 품질 이슈 확인
```bash
# 메트릭스 파일에서 상세 품질 이슈 확인
cat reports/api-docs-metrics.json | jq '.quality'
```

## 📈 성능 비교

| 항목 | 기존 스크립트 | 고도화 스크립트 | 향상도 |
|------|---------------|-----------------|--------|
| **첫 실행** | 0.03초 | 0.03초 | 동일 |
| **재실행** | 0.03초 | 0.01초 | **67% 향상** |
| **캐시 시스템** | 수정시간 기반 | 해시 기반 | **정확성 향상** |
| **에러 처리** | 기본 | 전략적 복구 | **안정성 향상** |
| **품질 검증** | 없음 | 자동 감지 | **품질 보장** |
| **모니터링** | 없음 | 상세 메트릭스 | **가시성 향상** |

## 🔗 관련 명령어

```bash
# TypeDoc 문서 생성
pnpm docs:api

# 고도화된 동기화
node scripts/sync-api-docs-enhanced.js

# 전체 문서 빌드 파이프라인
pnpm docs:api && node scripts/sync-api-docs-enhanced.js && pnpm docs:build
```

## 📝 주의사항

1. **첫 실행시 캐시 디렉토리 생성**: `.api-docs-cache` 디렉토리가 자동 생성됩니다.
2. **Git 무시 설정**: 캐시 디렉토리를 `.gitignore`에 추가하는 것을 권장합니다.
3. **메트릭스 파일**: `reports/` 디렉토리가 자동 생성되며, 메트릭스 파일이 저장됩니다.
4. **병렬 처리**: 시스템 리소스에 따라 `maxWorkers` 설정을 조정하세요.
5. **TTL 설정**: 개발 환경에서는 TTL을 짧게, 프로덕션에서는 길게 설정하는 것을 권장합니다.