# 구현 현황 대시보드

> 🤖 자동 생성: {{lastUpdate}}

## 📊 전체 통계

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">

<div style="border: 1px solid #e1e5e9; border-radius: 8px; padding: 1rem;">
<h3 style="margin: 0 0 0.5rem 0; color: #0969da;">📚 전체 용어</h3>
<p style="font-size: 2rem; font-weight: bold; margin: 0; color: #1f2328;">{{statistics.totalTerms}}</p>
</div>

<div style="border: 1px solid #e1e5e9; border-radius: 8px; padding: 1rem;">
<h3 style="margin: 0 0 0.5rem 0; color: #1a7f37;">✅ 매핑된 용어</h3>
<p style="font-size: 2rem; font-weight: bold; margin: 0; color: #1f2328;">{{statistics.mappedTerms}}</p>
<small style="color: #656d76;">{{implementationRate}}%</small>
</div>

<div style="border: 1px solid #e1e5e9; border-radius: 8px; padding: 1rem;">
<h3 style="margin: 0 0 0.5rem 0; color: #cf222e;">❌ 미매핑 용어</h3>
<p style="font-size: 2rem; font-weight: bold; margin: 0; color: #1f2328;">{{statistics.unmappedTerms}}</p>
</div>

<div style="border: 1px solid #e1e5e9; border-radius: 8px; padding: 1rem;">
<h3 style="margin: 0 0 0.5rem 0; color: #8250df;">📁 구현 파일</h3>
<p style="font-size: 2rem; font-weight: bold; margin: 0; color: #1f2328;">{{statistics.taggedFiles}}</p>
<small style="color: #656d76;">/ {{statistics.totalFiles}} 파일</small>
</div>

</div>

## 🎯 카테고리별 구현 현황

{{#each categoryStats}}
### {{name}}

**구현률**: {{rate}}% ({{mapped}}/{{total}})

<div style="background: #f6f8fa; border-radius: 4px; overflow: hidden; margin: 0.5rem 0;">
  <div style="background: #1a7f37; height: 8px; width: {{rate}}%;"></div>
</div>

{{#if topTerms}}
**주요 구현 용어**:
{{#each topTerms}}
- [{{term}}](./{{../category}}.md#{{slugify term}}) ({{count}}개 구현)
{{/each}}
{{/if}}

{{/each}}

## 🏆 가장 많이 구현된 용어

{{#each topImplementedTerms}}
| 순위 | 용어 | 구현 수 | 카테고리 |
|------|------|---------|----------|
{{#each items}}
| {{@index}} | [{{term}}](./{{category}}.md#{{slugify term}}) | {{count}} | {{category}} |
{{/each}}
{{/each}}

## 📈 최근 변경사항

{{#if recentChanges}}
{{#each recentChanges}}
### {{date}}
{{#each files}}
- **{{file}}**: {{terms.length}}개 용어 업데이트
  {{#each terms}}
  - `{{this}}`
  {{/each}}
{{/each}}

{{/each}}
{{else}}
*최근 변경사항이 없습니다.*
{{/if}}

## 🚨 매핑이 필요한 용어들

{{#if unmappedTerms}}
다음 용어들은 용어집에 정의되어 있지만 아직 구현이 매핑되지 않았습니다:

{{#each unmappedTerms}}
### {{category}}
{{#each terms}}
- [{{term}}](../glossary/{{../category}}.md#{{slugify term}}) - {{definition}}
{{/each}}

{{/each}}

> 💡 **개발자 가이드**: 해당 용어를 구현하는 코드에 `@glossary: {{term}}` 태그를 추가해주세요.
{{else}}
🎉 **모든 용어가 매핑되었습니다!**
{{/if}}

## 🔗 바로가기

- [용어집 메인](../glossary/index.md)
- [태그 사용 가이드](../GLOSSARY_TAGGING_GUIDE.md)
- [매핑 시스템 개요](../GLOSSARY_MAPPING_SYSTEM.md)

### 카테고리별 구현 문서

{{#each categories}}
- [{{title}}](./{{name}}.md) ({{termCount}}개 용어, {{implementationCount}}개 구현)
{{/each}}

---

*마지막 업데이트: {{lastUpdate}}*  
*이 문서는 자동으로 생성됩니다. 직접 편집하지 마세요.*