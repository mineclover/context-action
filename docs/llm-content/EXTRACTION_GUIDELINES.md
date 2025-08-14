# Document Extraction Guidelines

## General Instructions

1. **Extract content** from the source document specified in YAML metadata
2. **Stay within character limit** (±10% tolerance) - **YAML 메타데이터 제외하고 계산**
3. **Preserve document structure** and key information
4. **Update status** in YAML front matter when complete

## 📏 글자수 계산 중요사항

### YAML 제외 원칙
모든 글자수 계산에서 **YAML 메타데이터는 완전히 제외**됩니다:

```yaml
---
source: "guide/concepts.md"     # ← 이 YAML 부분은
title: "Core Concepts"          # ← 글자수에서 제외
document_id: "guide-concepts"
char_limit: 300
status: "draft"
---

이 부분부터 실제 콘텐츠로 카운팅 시작     # ← 여기서부터 계산
Context-Action 프레임워크는 혁신적인...
(300자 목표 시 이 부분만 300자로 계산)
```

### 글자수 검증 방법
1. **작성 완료 후**: YAML 부분을 제외하고 실제 콘텐츠만 선택
2. **글자수 확인**: 목표 글자수의 ±10% 범위 내 확인  
3. **예시**: 300자 목표 → 270-330자 범위 (YAML 제외)
4. **도구 활용**: `pnpm docs:status` 스크립트로 자동 검증 가능

## Character Limit Guidelines

### 100 Characters
- Core concept only
- Single sentence explanations
- Remove all examples and code blocks
- Minimal technical detail

### 300 Characters  
- Main concepts and key points
- One simple example maximum
- Essential technical details only
- Brief explanations

### 500-1000 Characters
- Cover main concepts with explanation
- Include 2-3 key examples
- Important technical details
- Moderate explanations

### 2000+ Characters
- Comprehensive coverage of topic
- Multiple examples and use cases
- Full technical details and edge cases
- Complete explanations

## Status Values

- `placeholder`: Not yet written
- `draft`: Content added but needs review
- `complete`: Content finalized and within character limit
- `review`: Needs character count or quality review

## File Naming Convention

- Folder: `documentId/`
- File: `documentId-charLimit.txt`
- Example: `guide-concepts/guide-concepts-300.txt`

## Quality Standards

1. **Character Count**: Stay within ±10% of target
2. **Information Preservation**: Maintain essential meaning
3. **Readability**: Clear and well-structured content
4. **Consistency**: Follow established patterns

---
Generated: 2025-08-14
