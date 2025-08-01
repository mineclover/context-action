# {{categoryTitle}} - 구현 위치

> 🤖 자동 생성: {{lastUpdate}}

이 문서는 **{{categoryTitle}}** 카테고리의 용어집 용어들이 실제 코드에서 어떻게 구현되어 있는지를 보여줍니다.

## 📋 구현 현황

- **전체 용어**: {{totalTerms}}개
- **구현된 용어**: {{implementedTerms}}개 ({{implementationRate}}%)
- **총 구현 수**: {{totalImplementations}}개

---

{{#each implementations}}
## {{term}}

> [용어집에서 정의 보기](../glossary/{{category}}.md#{{slugify term}})

**정의**: {{definition}}

{{#if implementations}}
### 🔧 구현 위치

{{#each implementations}}
#### `{{method}}` {{#if type}}*({{type}})*{{/if}}

- **파일**: [`{{file}}:{{line}}`](../../{{file}}#L{{line}})
{{#if description}}
- **설명**: {{description}}
{{/if}}
{{#if signature}}
- **시그니처**: `{{signature}}`
{{/if}}

{{#if patterns}}
**적용된 패턴**:
{{#each patterns}}
- {{this}}
{{/each}}
{{/if}}

{{#if related}}
**관련 용어**:
{{#each related}}
- [{{this}}](../glossary/{{../../category}}.md#{{slugify this}})
{{/each}}
{{/if}}

{{/each}}

{{#if hasMultipleImplementations}}
> 💡 이 용어는 {{implementations.length}}개의 서로 다른 방식으로 구현되어 있습니다.
{{/if}}

{{else}}
### ⚠️ 구현이 매핑되지 않음

이 용어는 용어집에 정의되어 있지만 아직 코드에서 매핑되지 않았습니다.

{{#if suggestedFiles}}
**구현이 있을 것으로 예상되는 파일들**:
{{#each suggestedFiles}}
- `{{this}}`
{{/each}}
{{/if}}

> 💡 **개발자 가이드**: 이 용어를 구현하는 코드가 있다면 `@glossary: {{term}}` 태그를 추가해주세요.

{{/if}}

---

{{/each}}

## 📊 구현 통계

### 파일별 구현 수

{{#each fileStats}}
| 파일 | 구현 수 | 용어들 |
|------|---------|--------|
{{#each files}}
| [`{{file}}`](../../{{file}}) | {{count}} | {{join terms ", "}} |
{{/each}}
{{/each}}

### 구현 타입별 분포

{{#each typeStats}}
- **{{type}}**: {{count}}개 ({{percentage}}%)
{{/each}}

## 🔗 관련 링크

- [← 용어집: {{categoryTitle}}](../glossary/{{category}}.md)
- [← 구현 현황 대시보드](./index.md)
{{#if relatedCategories}}
- **관련 카테고리**:
{{#each relatedCategories}}
  - [{{title}}](./{{name}}.md)
{{/each}}
{{/if}}

## 🚀 기여 가이드

이 카테고리의 용어를 구현할 때 다음 가이드라인을 따라주세요:

{{#if categoryGuidelines}}
{{#each categoryGuidelines}}
- {{this}}
{{/each}}
{{else}}
- 함수/클래스 위에 `@glossary: 용어명` 주석 추가
- 가능하면 `@category: {{category}}` 태그도 함께 추가
- 명확하고 간단한 설명 포함
{{/if}}

---

*마지막 업데이트: {{lastUpdate}}*  
*이 문서는 자동으로 생성됩니다. 직접 편집하지 마세요.*