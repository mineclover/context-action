# LLMS Generator Documentation

Context-Action 프레임워크를 위한 LLM 최적화 문서 생성 시스템의 핵심 문서들입니다.

## 📚 문서 목록

### 🎯 전략 및 가이드라인
- **[adaptive-composition-strategy.md](./adaptive-composition-strategy.md)** - LLM 문서 조합 전략 완전 가이드
- **[extraction-guidelines.md](./extraction-guidelines.md)** - 문서 추출 가이드라인

### 🏗️ 시스템 구조
- **[data-structure.md](./data-structure.md)** - 최적화된 문서 구조 시스템

## 🚀 빠른 시작

1. **문서 생성 시작**: [adaptive-composition-strategy.md](./adaptive-composition-strategy.md)에서 LLM 문서 조합 전략 확인
2. **시스템 이해**: [data-structure.md](./data-structure.md)에서 전체 구조 파악
3. **문서 작성**: [extraction-guidelines.md](./extraction-guidelines.md)에서 추출 가이드라인 확인

## 🎯 주요 특징

- **적응형 조합**: 문자 제한에 따른 intelligent document composition
- **우선순위 기반**: priority.json을 활용한 체계적 문서 관리
- **다국어 지원**: 한국어/영어 동시 지원
- **템플릿 시스템**: 자동 생성된 개별 요약 문서 템플릿

## 📊 시스템 구조 요약

```
packages/llms-generator/
├── src/                 # TypeScript 소스 코드
├── data/               # Priority 파일 및 템플릿
│   ├── ko/            # 한국어 문서 (26개)
│   └── en/            # 영어 문서 (102개)
├── docs/              # 시스템 문서 (이 디렉토리)
└── llms-generator.config.json  # 설정 파일
```

## 🔧 CLI 명령어 (2025 최적화됨)

```bash
# 워크플로우 관리
npx @context-action/llms-generator work-next --language ko
npx @context-action/llms-generator work-next --show-completed

# Clean LLMS 생성 (LLM 훈련용, 권장)
npx @context-action/llms-generator clean-llms-generate 200 --language ko --pattern clean
npx @context-action/llms-generator clean-llms-generate --category guide --pattern minimal

# 표준 LLMS 생성 (메타데이터 포함)
npx @context-action/llms-generator llms-generate --character-limit 200 --language ko
npx @context-action/llms-generator llms-generate --category guide --pattern minimum
```

---

> **참고**: 이 시스템은 Context-Action 프레임워크의 문서를 LLM에서 효율적으로 활용하기 위해 설계되었습니다.