# @context-action/llms-generator - 최신 문서 템플릿

## 📋 패키지 개요

LLM을 위한 적응형 콘텐츠 생성 시스템입니다. 문서의 우선순위와 글자 수 제한에 따라 최적의 콘텐츠를 조합하여 제공하는 AI 친화적 문서 관리 도구입니다.

### 핵심 가치 제안
- **간소화된 설정 시스템**: 3가지 핵심 설정만으로 완전 자동화
- **적응형 지능**: 요청 길이에 맞춰 최적의 문서 조합 제공
- **다국어 지원**: 한국어, 영어, 일본어, 중국어, 인도네시아어 등
- **CLI 완전 자동화**: 발견부터 조합까지 원클릭 워크플로우

## 🎯 최신 기능 하이라이트

### v1.1.0 주요 개선사항
- **사용자 설정 중심 설계**: 복잡한 내부 설정을 숨기고 사용자 친화적 구성
- **프리셋 시스템**: 사용 사례별 최적화된 글자 수 프리셋
- **작업 상태 관리**: 실시간 편집 진행 상황 추적 시스템
- **적응형 조합 엔진**: 99%+ 공간 활용률의 지능형 콘텐츠 조합

### 최신 프리셋 (v1.1.0)
```json
{
  "minimal": [100, 500],
  "standard": [100, 300, 1000, 2000],
  "extended": [50, 100, 300, 500, 1000, 2000, 4000],
  "blog": [200, 500, 1500],
  "documentation": [150, 400, 1000]
}
```

## ⚙️ 빠른 시작 (2025 최신)

### 1. 설정 파일 생성
```bash
# 최신 설정 파일 생성 (수동)
cat > llms-generator.config.json << EOF
{
  "characterLimits": [100, 300, 1000, 2000],
  "languages": ["ko", "en"],
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./packages/llms-generator/data",
    "outputDir": "./docs/llms"
  }
}
EOF
```

### 2. 문서 발견 및 우선순위 생성
```bash
# 한국어 문서 발견
npx @context-action/llms-generator discover ko

# 우선순위 파일 생성 (미리보기)
npx @context-action/llms-generator priority-generate ko --dry-run

# 실제 우선순위 파일 생성
npx @context-action/llms-generator priority-generate ko --overwrite
```

### 3. 작업 상태 확인 (New in v1.1.0)
```bash
# 전체 작업 상태 확인
npx @context-action/llms-generator work-status ko

# 100자 편집이 필요한 문서들 확인
npx @context-action/llms-generator work-list ko --chars=100 --need-update

# 특정 문서의 편집 컨텍스트 보기
npx @context-action/llms-generator work-context ko guide-action-handlers --chars=100
```

## 🚀 실전 워크플로우

### 시나리오 1: 100자 요약 작업 완전 가이드
```bash
# 1. 문서 발견
npx @context-action/llms-generator discover ko

# 2. 우선순위 생성
npx @context-action/llms-generator priority-generate ko --overwrite

# 3. 작업 대상 확인
npx @context-action/llms-generator work-list ko --chars=100 --need-update

# 4. 개별 문서 편집 컨텍스트 확인
npx @context-action/llms-generator work-context ko [document-id] --chars=100

# 5. 파일 직접 편집
# data/ko/[document-id]/[document-id]-100.txt

# 6. 편집 후 상태 재확인
npx @context-action/llms-generator work-status ko [document-id] --chars=100

# 7. 조합 테스트
npx @context-action/llms-generator compose ko 5000 --priority=70
```

### 시나리오 2: 프로덕션 콘텐츠 조합
```bash
# 1. 기본 콘텐츠 추출 (자동 요약)
npx @context-action/llms-generator extract ko --chars=100,300,1000 --overwrite

# 2. 수동/LLM으로 품질 향상 (필수)
# data/ko/*/document-*.txt 파일들을 고품질 요약으로 대체

# 3. 다양한 길이로 조합 테스트
npx @context-action/llms-generator compose-batch ko --chars=1000,3000,5000,10000

# 4. 조합 통계 확인
npx @context-action/llms-generator compose-stats ko

# 5. 최종 콘텐츠 생성
npx @context-action/llms-generator compose ko 5000
```

## 📊 최신 CLI 명령어 참조

### 우선순위 관리
```bash
priority-generate [lang] [--dry-run] [--overwrite]  # 우선순위 파일 생성
priority-stats [lang]                               # 우선순위 통계
discover [lang]                                     # 문서 발견
```

### 콘텐츠 추출
```bash
extract [lang] [--chars=100,300,1000] [--dry-run] [--overwrite]  # 요약 추출
extract-all [--lang=en,ko] [--dry-run] [--overwrite]             # 일괄 추출
```

### 적응형 조합 (핵심 기능)
```bash
compose [lang] [chars] [--no-toc] [--priority=50] [--dry-run]     # 단일 조합
compose-batch [lang] [--chars=1000,3000,5000] [--dry-run]        # 배치 조합
compose-stats [lang]                                              # 조합 통계
```

### 작업 상태 관리 (New in v1.1.0)
```bash
work-status [lang] [document-id] [--chars=100] [--need-edit]      # 작업 상태 확인
work-context <lang> <document-id> [--chars=100]                  # 편집 컨텍스트
work-list [lang] [--chars=100] [--missing] [--need-update]       # 작업 목록
```

### 마크다운 생성 (VitePress 호환)
```bash
markdown-generate [lang] [--chars=100,300,1000] [--dry-run] [--overwrite]
markdown-all [--lang=en,ko] [--dry-run] [--overwrite]
```

## 🏗️ 아키텍처 및 구조

### 핵심 컴포넌트
- **AdaptiveComposer**: 적응형 콘텐츠 조합 엔진
- **PriorityManager**: 문서 우선순위 관리 시스템
- **ContentExtractor**: 자동 콘텐츠 추출기
- **WorkStatusManager**: 작업 진행 상황 추적 (v1.1.0)

### 데이터 구조
```
packages/llms-generator/data/
├── priority-schema-enhanced.json     # 강화된 우선순위 스키마 (git 포함)
├── ko/                              # 생성 데이터 (git 제외)
│   ├── guide-action-handlers/
│   │   ├── priority.json            # 우선순위 + 작업상태
│   │   ├── guide-action-handlers-100.txt
│   │   ├── guide-action-handlers-300.txt
│   │   └── guide-action-handlers-1000.txt
│   └── ...
└── en/                              # 영어 콘텐츠
    └── ...
```

### 우선순위 메타데이터 구조
```json
{
  "document": {
    "id": "guide-action-handlers",
    "title": "액션 핸들러",
    "source_path": "guide/action-handlers.md",
    "category": "guide"
  },
  "priority": {
    "score": 80,
    "tier": "essential"
  },
  "extraction": {
    "strategy": "concept-first",
    "character_limits": {
      "100": { "focus": "핸들러 기본 개념" },
      "300": { "focus": "핸들러 구조와 패턴" },
      "1000": { "focus": "완전한 핸들러 구현과 예제" }
    }
  }
}
```

## 🎛️ 고급 옵션 및 최적화

### 성능 옵션
- `--dry-run`: 실제 실행 없이 미리보기
- `--overwrite`: 기존 파일 덮어쓰기 허용
- `--priority=N`: 우선순위 임계값 설정
- `--no-toc`: 목차 생성 비활성화

### 작업 상태 필터링 (New in v1.1.0)
- `--need-edit`: 수동 편집이 필요한 문서
- `--outdated`: 오래된 파일들
- `--missing`: 누락된 파일들
- `--need-update`: 업데이트가 필요한 파일들

### 배치 처리 옵션
```bash
# 다국어 배치 처리
npx @context-action/llms-generator extract-all --lang=ko,en,ja --overwrite

# 다중 글자 수 배치 조합
npx @context-action/llms-generator compose-batch ko --chars=1000,3000,5000,10000
```

## 📈 성능 지표 및 품질 기준

### 성능 목표
- **공간 활용률**: 99%+ (요청 글자 수 대비)
- **조합 속도**: < 100ms (1000개 문서 기준)
- **우선순위 준수**: 높은 우선순위 문서 우선 선택
- **품질 일관성**: 수동 편집 후 95%+ 품질 유지

### 품질 관리 워크플로우
1. **자동 추출**: ContentExtractor로 기본 골격 생성
2. **수동 개선**: 실제 요약은 수동/LLM으로 고품질화
3. **품질 검증**: work-status로 편집 진행 상황 추적
4. **조합 테스트**: 다양한 길이로 조합 결과 검증

## 🔧 개발 환경 설정

### 패키지 빌드 및 테스트
```bash
# 패키지 빌드
pnpm build:llms-generator

# 테스트 실행
pnpm test:llms-generator

# CLI 도움말 확인
npx @context-action/llms-generator help
```

### 스크립트 활용 (고급)
```bash
# 우선순위 간소화
node packages/llms-generator/scripts/simplify-priorities.js

# 작업 상태 스크립트
node packages/llms-generator/scripts/work-status.js status ko [document-id] [chars]
node packages/llms-generator/scripts/work-status.js context ko [document-id] [chars]
```

## 🎯 사용 팁 및 베스트 프랙티스

### 우선순위 설정 가이드
- **핵심 문서**: 90점 이상 (essential tier)
- **중요 문서**: 70-80점 (important tier)
- **일반 문서**: 50-60점 (standard tier)
- **참조 문서**: 30-40점 (reference tier)

### 글자 수 전략
- **100자**: 목차용 핵심 개념 (TOC generation)
- **300자**: 개요용 구조 설명 (Quick overview)
- **1000자**: 상세 구현 가이드 (Detailed guide)
- **2000자+**: 완전한 튜토리얼 (Complete tutorial)

### 정기 유지보수
```bash
# 주간 업데이트 루틴
npx @context-action/llms-generator discover ko
npx @context-action/llms-generator priority-generate ko --overwrite
npx @context-action/llms-generator work-list ko --chars=100 --need-update
```

## 🚨 주의사항 및 제한사항

### 중요 고려사항
- `data/` 디렉토리는 git에서 제외됨 (생성된 콘텐츠)
- 우선순위 점수는 0-100 범위에서 설정
- 요약 파일은 UTF-8 인코딩으로 저장
- CLI 명령어는 프로젝트 루트에서 실행 권장

### 알려진 제한사항
- ContentExtractor는 기본 골격만 제공 (수동 개선 필요)
- 대용량 문서 처리 시 메모리 사용량 증가
- 다국어 번역 자동화 미지원

## 🚀 향후 로드맵

### v1.2.0 계획
- [ ] AI 기반 자동 요약 품질 향상
- [ ] 실시간 문서 변경 감지 및 자동 업데이트
- [ ] 웹 대시보드 인터페이스
- [ ] API 엔드포인트 제공

### v1.3.0 계획
- [ ] 플러그인 시스템 도입
- [ ] 커스텀 추출 전략 지원
- [ ] 대용량 문서 스트리밍 처리
- [ ] 클라우드 동기화 기능

---

## 📞 지원 및 기여

이 시스템은 Context-Action 프레임워크 문서를 LLM이 효율적으로 활용할 수 있도록 최적화된 형태로 제공합니다.

### 기여 방법
1. 새로운 추출 전략 추가
2. 조합 알고리즘 개선
3. 다국어 지원 확장
4. 성능 최적화
5. 문서 품질 향상

### 문제 해결
- GitHub Issues: 버그 리포트 및 기능 제안
- Documentation: 사용법 개선 제안
- Performance: 성능 최적화 아이디어

**마지막 업데이트**: 2025-01-15 (v1.1.0 기준)