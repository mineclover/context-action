# Glossary Management System

용어집 관리의 중심 디렉토리입니다.

## 📁 구조

### `terms/`
용어집 정의 파일들 (Markdown 형식)
- `core-concepts.md` - 핵심 개념
- `architecture-terms.md` - 아키텍처 용어
- `api-terms.md` - API 관련 용어
- `naming-conventions.md` - 네이밍 규칙

### `tools/`
용어집 관리 도구들
- `glossary-scanner-v2.js` - 코드 스캔 도구
- `glossary-validator-v2.js` - 매핑 검증 도구
- `missing-analysis.js` - 미구현 분석 도구
- `implementation-dashboard.js` - 대시보드 생성 도구

### `implementations/`
구현 현황 및 분석 결과
- `_data/` - JSON 데이터 파일들
- `dashboard.md` - 구현 현황 대시보드

## 🚀 사용법

```bash
# 전체 업데이트 (권장)
pnpm glossary:update

# 개별 명령어
pnpm glossary:scan      # 코드 스캔
pnpm glossary:validate  # 검증
pnpm glossary:missing   # 미구현 분석
pnpm glossary:dashboard # 대시보드 생성
```

## ⚙️ 설정

설정은 root의 `glossary.config.js`에서 관리됩니다.