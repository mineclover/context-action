# Simple LLMS Generator 사용 가이드

Context-Action Framework의 Simple LLMS Generator를 사용하여 동일한 character limit의 모든 개별 .md 파일들을 단순 결합하는 방법을 설명합니다.

## 📋 목차

1. [개요](#개요)
2. [설치 및 설정](#설치-및-설정)
3. [기본 사용법](#기본-사용법)
4. [고급 사용법](#고급-사용법)
5. [설정 파일 가이드](#설정-파일-가이드)
6. [문제 해결](#문제-해결)

## 🎯 개요

Simple LLMS Generator는 같은 character limit을 가진 모든 markdown 파일들을 자동으로 수집하여 하나의 LLMS 파일로 결합하는 도구입니다.

### 주요 특징
- ✅ **자동 디렉토리 생성**: data 디렉토리가 없으면 자동 생성
- ✅ **스마트 심볼릭 링크**: 개발 환경에서 자동으로 심볼릭 링크 생성
- ✅ **다국어 지원**: 한국어(ko), 영어(en) 지원
- ✅ **배치 처리**: 여러 character limit을 한 번에 처리
- ✅ **정렬 옵션**: alphabetical, priority, category 정렬 지원
- ✅ **통계 정보**: 파일 수, 문자 수 등 상세 통계 제공

## 🚀 설치 및 설정

### 1. 프로젝트 루트에 설정 파일 생성

`llms-generator.config.json` 파일을 프로젝트 루트에 생성:

```json
{
  "$schema": "packages/llms-generator/data/config-schema.json",
  "paths": {
    "docsDir": "./docs",
    "llmContentDir": "./data",
    "outputDir": "./docs/llms"
  },
  "generation": {
    "supportedLanguages": ["ko", "en"],
    "characterLimits": [100, 300, 1000, 2000],
    "defaultLanguage": "ko",
    "outputFormat": "txt"
  },
  "quality": {
    "minCompletenessThreshold": 0.8,
    "enableValidation": true,
    "strictMode": false
  }
}
```

### 2. 데이터 디렉토리 구조

CLI를 실행하면 자동으로 다음 구조가 생성됩니다:

```
project-root/
├── llms-generator.config.json
├── data/                          # 자동 생성 (심볼릭 링크 또는 디렉토리)
│   ├── en/                        # 영어 문서
│   │   ├── document-id-1/
│   │   │   ├── document-id-1-100.md
│   │   │   ├── document-id-1-300.md
│   │   │   └── document-id-1-1000.md
│   │   └── document-id-2/
│   │       ├── document-id-2-100.md
│   │       └── document-id-2-300.md
│   └── ko/                        # 한국어 문서
│       └── ...
└── docs/
    └── llms/                      # 생성된 LLMS 파일
        ├── en/
        │   ├── llms-simple-100chars.txt
        │   ├── llms-simple-300chars.txt
        │   └── llms-simple-1000chars.txt
        └── ko/
            └── ...
```

## 📖 기본 사용법

### 1. 통계 확인

현재 사용 가능한 문서와 character limit을 확인:

```bash
# 영어 문서 통계
node packages/llms-generator/dist/cli/index.js simple-llms-stats --language en

# 한국어 문서 통계  
node packages/llms-generator/dist/cli/index.js simple-llms-stats --language ko

# 특정 character limit 상세 통계
node packages/llms-generator/dist/cli/index.js simple-llms-stats --language en --character-limit 100
```

### 2. 단일 LLMS 생성

특정 character limit의 LLMS 파일 생성:

```bash
# 100자 제한 영어 LLMS 생성
node packages/llms-generator/dist/cli/index.js simple-llms-generate 100 --language en

# 300자 제한 한국어 LLMS 생성  
node packages/llms-generator/dist/cli/index.js simple-llms-generate 300 --language ko
```

### 3. 배치 LLMS 생성

여러 character limit을 한 번에 생성:

```bash
# 모든 character limit 생성 (config 기본값 사용)
node packages/llms-generator/dist/cli/index.js simple-llms-batch --language en

# 특정 character limit들만 생성
node packages/llms-generator/dist/cli/index.js simple-llms-batch \
  --language en \
  --character-limits 100,300,1000
```

## 🔧 고급 사용법

### 정렬 옵션

다양한 정렬 방식으로 LLMS 생성:

```bash
# 알파벳 순 정렬 (기본값)
node packages/llms-generator/dist/cli/index.js simple-llms-batch \
  --language en \
  --sort-by alphabetical

# 우선순위 순 정렬
node packages/llms-generator/dist/cli/index.js simple-llms-batch \
  --language en \
  --sort-by priority

# 카테고리별 정렬
node packages/llms-generator/dist/cli/index.js simple-llms-batch \
  --language en \
  --sort-by category
```

### 출력 옵션

```bash
# 사용자 정의 출력 디렉토리
node packages/llms-generator/dist/cli/index.js simple-llms-batch \
  --language en \
  --output-dir ./custom-output

# 메타데이터 제외
node packages/llms-generator/dist/cli/index.js simple-llms-batch \
  --language en \
  --no-metadata

# Dry run (실제 파일 생성 없이 미리보기)
node packages/llms-generator/dist/cli/index.js simple-llms-batch \
  --language en \
  --dry-run

# 상세 로그 출력
node packages/llms-generator/dist/cli/index.js simple-llms-batch \
  --language en \
  --verbose
```

## ⚙️ 설정 파일 가이드

### 경로 설정 (paths)

```json
{
  "paths": {
    "docsDir": "./docs",           // 문서 루트 디렉토리
    "llmContentDir": "./data",     // 마크다운 파일 위치
    "outputDir": "./docs/llms"     // LLMS 출력 디렉토리
  }
}
```

### 생성 설정 (generation)

```json
{
  "generation": {
    "supportedLanguages": ["ko", "en"],      // 지원 언어
    "characterLimits": [100, 300, 1000],     // 지원 문자 제한
    "defaultLanguage": "ko",                 // 기본 언어
    "outputFormat": "txt"                    // 출력 형식
  }
}
```

### 품질 설정 (quality)

```json
{
  "quality": {
    "minCompletenessThreshold": 0.8,    // 최소 완성도 (0.0-1.0)
    "enableValidation": true,           // 유효성 검사 활성화
    "strictMode": false                 // 엄격 모드
  }
}
```

## 📊 생성되는 LLMS 파일 구조

```markdown
# Context-Action Framework - Simple LLMS (100 chars)

Generated: 2025-08-17
Type: Simple Combination
Language: EN
Character Limit: 100
Total Documents: 104

This document contains all individual 100-character summaries combined in simple sequential order.

---

# Document Title 1

**Document ID**: `document-id-1`  
**Category**: api  
**Characters**: 98  

[Document content here...]

---

# Document Title 2

**Document ID**: `document-id-2`  
**Category**: guide  
**Characters**: 102  

[Document content here...]

---

## Document Collection Summary

**Total Documents**: 104
**Total Characters**: 143,041
**Average Characters**: 1,214

**Generation Date**: 2025-08-17
**Content Type**: Simple Combined Summaries
**Processing**: Direct concatenation of individual character-limited files

*Generated automatically by SimpleLLMSComposer*
```

## 🔍 문제 해결

### 1. "No character-limited files found" 오류

**원인**: data 디렉토리에 해당 언어의 문서가 없음

**해결책**:
```bash
# 1. 통계로 확인
node packages/llms-generator/dist/cli/index.js simple-llms-stats --language en

# 2. 디렉토리 구조 확인
ls -la data/en/

# 3. 샘플 문서 추가
mkdir -p data/en/sample-doc
echo "---
title: Sample Document
category: guide
---

# Sample Document

This is a sample document for testing." > data/en/sample-doc/sample-doc-100.md
```

### 2. 권한 오류

**원인**: 디렉토리 생성 권한 부족

**해결책**:
```bash
# 현재 사용자에게 쓰기 권한 부여
chmod 755 .
```

### 3. 심볼릭 링크 생성 실패

**원인**: 운영체제에서 심볼릭 링크를 지원하지 않음 (Windows 등)

**해결책**: CLI가 자동으로 일반 디렉토리를 생성합니다.

```
⚠️  Symlink failed, creating directory instead: [error details]
✅ Directory created instead of symlink
```

### 4. 설정 파일 문제

**원인**: JSON 형식 오류 또는 경로 문제

**해결책**:
```bash
# JSON 유효성 검사
cat llms-generator.config.json | jq .

# 스키마 검증 (설정된 경우)
node packages/llms-generator/dist/cli/index.js config-validate
```

## 📝 실용적인 예제

### 완전한 워크플로우 예제

```bash
# 1. 프로젝트 초기화
echo '{
  "paths": {
    "docsDir": "./docs",
    "llmContentDir": "./data", 
    "outputDir": "./docs/llms"
  },
  "generation": {
    "supportedLanguages": ["en", "ko"],
    "characterLimits": [100, 300, 1000, 2000],
    "defaultLanguage": "en"
  }
}' > llms-generator.config.json

# 2. 통계 확인 (자동으로 디렉토리 생성됨)
node packages/llms-generator/dist/cli/index.js simple-llms-stats --language en

# 3. 영어 문서 전체 배치 생성
node packages/llms-generator/dist/cli/index.js simple-llms-batch \
  --language en \
  --sort-by category \
  --verbose

# 4. 한국어 문서 배치 생성
node packages/llms-generator/dist/cli/index.js simple-llms-batch \
  --language ko \
  --sort-by priority \
  --verbose

# 5. 결과 확인
ls -la docs/llms/*/
```

### CI/CD 파이프라인 예제

```yaml
# .github/workflows/llms-generation.yml
name: Generate LLMS Files

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  generate-llms:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Generate LLMS files
        run: |
          node packages/llms-generator/dist/cli/index.js simple-llms-batch \
            --language en \
            --verbose
          node packages/llms-generator/dist/cli/index.js simple-llms-batch \
            --language ko \
            --verbose
            
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: llms-files
          path: docs/llms/
```

## 🎯 팁과 모범 사례

1. **정기적인 생성**: 문서 업데이트 후 LLMS 재생성
2. **버전 관리**: 생성된 LLMS 파일도 git에 포함
3. **품질 검증**: `--dry-run`으로 미리 확인
4. **성능 최적화**: 큰 프로젝트는 특정 character limit만 선택적 생성
5. **자동화**: CI/CD 파이프라인에 통합하여 자동 생성

---

이 가이드를 통해 Simple LLMS Generator를 효과적으로 활용하여 프로젝트의 문서를 체계적으로 관리하고 LLMS 파일을 생성할 수 있습니다.