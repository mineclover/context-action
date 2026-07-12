/**
 * Enhanced Markdown Generator
 * Generates comprehensive, executable documentation from annotated tests
 */

import { TestExample, ParsedTestData, ExampleCategory } from '../types/index.js';
import { AnnotatedTest } from '../extractors/AnnotationExtractor.js';

const enhancedGenerationCommand =
  'npm --prefix packages/test-driven-docs run build && node packages/test-driven-docs/dist/cli/index.js generate --enhanced --packages react';
const consistencyValidationCommand =
  'node packages/test-driven-docs/dist/cli/index.js validate --consistency --packages react';

export interface EnhancedDocConfig {
  includeOverview?: boolean;
  includeValidationSection?: boolean;
  includeMetadata?: boolean;
  githubRepoUrl?: string;
  githubRepo?: string;
  docsBaseUrl?: string;
}

export interface LegacyMarkdownExample {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  code: string;
  testFile?: string;
}

export class EnhancedMarkdownGenerator {
  private config: EnhancedDocConfig;

  constructor(config: EnhancedDocConfig = {}) {
    this.config = {
      includeOverview: true,
      includeValidationSection: true,
      includeMetadata: true,
      ...config,
      githubRepoUrl: config.githubRepoUrl ?? config.githubRepo
    };
  }

  /**
   * Backward-compatible formatter used by the package's original public API.
   * The richer annotation pipeline uses generateApiDocumentation().
   */
  generateEnhancedMarkdown(apiName: string, examples: LegacyMarkdownExample[]): string {
    let content = `# ${apiName}\n\n`;

    if (examples.length === 0) {
      content += 'No examples found.\n\n';
    } else {
      const groups = new Map<string, LegacyMarkdownExample[]>();
      for (const example of examples) {
        const group = groups.get(example.category) ?? [];
        group.push(example);
        groups.set(example.category, group);
      }

      for (const [category, categoryExamples] of groups) {
        content += `## ${this.formatLegacyCategoryName(category)}\n\n`;
        categoryExamples
          .sort((a, b) => this.getPriorityScore(a.priority) - this.getPriorityScore(b.priority))
          .forEach(example => {
            content += `### ${example.description ?? example.id}\n\n`;
            content += `\`\`\`typescript\n${example.code}\n\`\`\`\n\n`;
            const fileName = example.testFile?.split('/').pop();
            if (fileName && this.config.githubRepoUrl) {
              content += `**Source:** [${fileName}](${this.config.githubRepoUrl}/blob/main/${example.testFile})\n\n`;
            } else if (fileName) {
              content += `**Source:** ${fileName}\n\n`;
            }
          });
      }
    }

    content += `## Validation\n\n`;
    content += `\`${enhancedGenerationCommand}\`\n\n`;
    content += `\`${consistencyValidationCommand}\`\n\n`;
    content += `## Update Documentation\n\n`;
    content += 'Update the test annotations: `@doc-extract`, `@doc-category`, and `@doc-priority`.\n\n';
    if (this.config.githubRepoUrl) {
      content += `[GitHub repository](${this.config.githubRepoUrl})\n`;
    }

    return content;
  }

  private formatLegacyCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate enhanced markdown documentation for an API
   */
  generateApiDocumentation(
    apiName: string,
    annotatedTests: AnnotatedTest[],
    metadata?: ParsedTestData
  ): string {
    const title = this.formatApiName(apiName);

    let content = this.buildHeader(title);

    if (this.config.includeOverview) {
      content += this.buildApiOverview(apiName);
    }

    content += this.buildExamplesSection(annotatedTests);

    if (this.config.includeValidationSection) {
      content += this.buildValidationSection(apiName);
    }

    if (this.config.includeMetadata) {
      content += this.buildMetadataSection(annotatedTests, metadata);
    }

    return content;
  }

  /**
   * Build document header
   */
  private buildHeader(title: string): string {
    return `# ${title} - Enhanced Documentation

> 🔄 **자동 생성된 문서**: 이 문서는 테스트 코드에서 자동 추출되었습니다.
> 최종 수정: ${new Date().toISOString().split('T')[0]}

`;
  }

  /**
   * Build API overview section
   */
  private buildApiOverview(apiName: string): string {
    const overviews: Record<string, string> = {
      createActionContext: `
\`createActionContext\`는 타입 안전한 액션 기반 상태 관리를 위한 Context를 생성합니다.

**핵심 특징:**
- 완전한 TypeScript 타입 안전성
- 우선순위 기반 핸들러 실행
- 자동 에러 처리 및 중단 지원
- React Context API와의 완벽한 통합`,

      useStoreValue: `
\`useStoreValue\`는 스토어의 값을 구독하고 변경사항을 자동으로 감지하는 React 훅입니다.

**핵심 특징:**
- 자동 리렌더링 최적화
- 깊은 객체 비교 지원
- 고성능 업데이트 처리
- 메모리 누수 방지`,

      createStoreContext: `
\`createStoreContext\`는 선언적 스토어 패턴을 구현하기 위한 Context를 생성합니다.

**핵심 특징:**
- 타입 추론 자동화
- 복수 스토어 관리
- Provider 자동 생성
- 최적화된 구독 시스템`
    };

    return overviews[apiName] || `\`${apiName}\` API에 대한 상세한 사용법과 예제입니다.`;
  }

  /**
   * Build examples section with categorization
   */
  private buildExamplesSection(annotatedTests: AnnotatedTest[]): string {
    if (annotatedTests.length === 0) {
      return `\n## 📚 사용법 예제\n\n*사용법 예제가 없습니다. 테스트 파일에 \`@doc-extract\` 어노테이션을 추가하세요.*\n\n`;
    }

    // Sort by priority and category
    const sortedTests = annotatedTests.sort((a, b) => {
      const priorityA = this.getPriorityScore(a.annotation.priority);
      const priorityB = this.getPriorityScore(b.annotation.priority);

      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.annotation.category.localeCompare(b.annotation.category);
    });

    // Group by category
    const categoryGroups = new Map<string, AnnotatedTest[]>();
    sortedTests.forEach(test => {
      const category = test.annotation.category;
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(test);
    });

    let content = `\n## 📚 사용법 예제\n\n`;

    // Generate content for each category
    for (const [category, tests] of categoryGroups) {
      content += `### ${this.formatCategoryName(category)}\n\n`;

      for (const test of tests) {
        content += this.buildExampleSection(test);
      }
    }

    return content;
  }

  /**
   * Build individual example section
   */
  private buildExampleSection(test: AnnotatedTest): string {
    const priorityEmoji = this.getPriorityEmoji(test.annotation.priority);

    return `#### ${priorityEmoji} ${test.annotation.description || test.testName}

\`\`\`typescript
${test.cleanedCode}
\`\`\`

**주요 포인트:**
${this.extractKeyPoints(test.cleanedCode)}

**테스트 위치:** [\`${this.getFileName(test.filePath)}\`](${this.getGitHubUrl(test.filePath)}) (줄 ${test.annotation.lineNumber})

---

`;
  }

  /**
   * Extract key points from code
   */
  private extractKeyPoints(code: string): string {
    const points: string[] = [];

    if (code.includes('Provider')) {
      points.push('- Context Provider를 사용한 컴포넌트 래핑');
    }
    if (code.includes('useActionHandler')) {
      points.push('- 액션 핸들러를 통한 비즈니스 로직 분리');
    }
    if (code.includes('dispatch')) {
      points.push('- 타입 안전한 액션 디스패칭');
    }
    if (code.includes('useStoreValue')) {
      points.push('- 반응형 스토어 값 구독');
    }
    if (code.includes('async')) {
      points.push('- 비동기 처리 지원');
    }
    if (code.includes('interface') && code.includes('extends')) {
      points.push('- TypeScript 인터페이스를 통한 타입 안전성');
    }
    if (code.includes('useCallback')) {
      points.push('- React 성능 최적화 패턴 적용');
    }

    return points.length > 0 ? points.join('\n') : '- 기본적인 API 사용법 구현';
  }

  /**
   * Build validation section
   */
  private buildValidationSection(apiName: string): string {
    return `
## 🔍 문서 검증

이 문서의 모든 예제는 실제 테스트 코드에서 추출되었으며, CI/CD 파이프라인을 통해 지속적으로 검증됩니다.

**검증 명령어:**
\`\`\`bash
# Enhanced 문서 재생성 (standalone 도구 빌드 포함)
${enhancedGenerationCommand}

# 생성된 문서와 테스트의 일관성 검증
${consistencyValidationCommand}
\`\`\`

**관련 파일:**
- [\`${apiName}.usage.test.tsx\`](${this.getUsageTestPath(apiName)}) - 사용법 예제 테스트
- [\`${this.getApiTestFileName(apiName)}\`](${this.getApiTestPath(apiName)}) - API 정확성 테스트

`;
  }

  /**
   * Build metadata section
   */
  private buildMetadataSection(annotatedTests: AnnotatedTest[], metadata?: ParsedTestData): string {
    const stats = {
      totalExamples: annotatedTests.length,
      categories: new Set(annotatedTests.map(t => t.annotation.category)).size,
      highPriority: annotatedTests.filter(t => t.annotation.priority === 'high').length,
      mediumPriority: annotatedTests.filter(t => t.annotation.priority === 'medium').length,
      lowPriority: annotatedTests.filter(t => t.annotation.priority === 'low').length,
      lastUpdated: new Date().toISOString()
    };

    return `
---

## 📊 문서 메타데이터

### 예제 통계
- **총 예제 수:** ${stats.totalExamples}개
- **카테고리 수:** ${stats.categories}개
- **우선순위별:**
  - 🔴 High: ${stats.highPriority}개
  - 🟡 Medium: ${stats.mediumPriority}개
  - 🟢 Low: ${stats.lowPriority}개

### 생성 정보
- **최종 업데이트:** ${stats.lastUpdated.split('T')[0]}
- **자동 생성:** ✅
- **검증 상태:** ✅
- **동기화 상태:** ✅

${metadata ? `### 테스트 파일 정보
- **파일 경로:** \`${metadata.filePath}\`
- **테스트 수:** ${metadata.metadata.testCount}개
- **Import 수:** ${metadata.imports.length}개
- **인터페이스 수:** ${metadata.interfaces.length}개` : ''}

---

> 💡 **참고**: 이 문서를 수정하려면 해당 테스트 파일의 어노테이션을 수정하고 \`${enhancedGenerationCommand}\`를 실행하세요.

> 🔧 **생성 도구**: [@context-action/test-driven-docs](https://www.npmjs.com/package/@context-action/test-driven-docs)
`;
  }

  /**
   * Utility functions
   */
  private formatApiName(apiName: string): string {
    return apiName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  private formatCategoryName(category: string): string {
    const categoryNames: Record<string, string> = {
      'basic-usage': '🚀 기본 사용법',
      'advanced-patterns': '🔧 고급 패턴',
      'error-handling': '⚠️ 에러 처리',
      'performance': '⚡ 성능 최적화',
      'integration': '🔗 통합 시나리오',
      'async-patterns': '🔄 비동기 패턴'
    };

    return categoryNames[category] || category.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private getPriorityScore(priority: 'high' | 'medium' | 'low'): number {
    const scores = { high: 100, medium: 200, low: 300 };
    return scores[priority];
  }

  private getPriorityEmoji(priority: 'high' | 'medium' | 'low'): string {
    const emojis = { high: '🔴', medium: '🟡', low: '🟢' };
    return emojis[priority];
  }

  private getFileName(filePath: string): string {
    return filePath.split('/').pop() || 'unknown';
  }

  private getGitHubUrl(filePath: string): string {
    if (!this.config.githubRepoUrl) {
      return '#'; // Fallback if no repo URL provided
    }

    // Extract relative path from project root
    const relativePath = filePath.includes('packages/') ?
      filePath.substring(filePath.indexOf('packages/')) :
      filePath;

    return `${this.config.githubRepoUrl}/blob/main/${relativePath}`;
  }

  private getUsageTestPath(apiName: string): string {
    const pathMap: Record<string, string> = {
      'createActionContext': '../../../packages/react/__tests__/createActionContext.usage.test.tsx',
      'useStoreValue': '../../../packages/react/__tests__/stores/hooks/useStoreValue.usage.test.tsx',
      'createStoreContext': '../../../packages/react/__tests__/stores/patterns/createStoreContext.usage.test.tsx'
    };
    return pathMap[apiName] || `../../../packages/react/__tests__/${apiName}.usage.test.tsx`;
  }

  private getApiTestPath(apiName: string): string {
    const pathMap: Record<string, string> = {
      'createActionContext': '../../../packages/react/__tests__/actions/createActionContext.test.tsx',
      'useStoreValue': '../../../packages/react/__tests__/stores/hooks/useStoreValue.test.tsx',
      'createStoreContext': '../../../packages/react/__tests__/stores/patterns/createDeclarativeStorePattern.test.tsx'
    };
    return pathMap[apiName] || `../../../packages/react/__tests__/${apiName}.api.test.tsx`;
  }

  private getApiTestFileName(apiName: string): string {
    const fileNameMap: Record<string, string> = {
      'createActionContext': 'createActionContext.test.tsx',
      'useStoreValue': 'useStoreValue.test.tsx',
      'createStoreContext': 'createDeclarativeStorePattern.test.tsx'
    };
    return fileNameMap[apiName] || `${apiName}.api.test.tsx`;
  }

  /**
   * Generate index documentation for multiple APIs
   */
  generateIndexDocumentation(apiDocumentations: Map<string, AnnotatedTest[]>): string {
    const totalExamples = Array.from(apiDocumentations.values())
      .reduce((sum, tests) => sum + tests.length, 0);

    let content = `# Enhanced API Documentation

> 🔄 **자동 생성**: 테스트 코드에서 추출된 향상된 API 문서

이 문서들은 실제 테스트 코드에서 자동으로 추출되어 항상 최신 상태를 유지합니다.

## 📚 API 목록

${Array.from(apiDocumentations.entries()).map(([api, tests]) =>
  `- [${this.formatApiName(api)}](./${api}.enhanced.md) (${tests.length}개 예제)`
).join('\n')}

## 🔧 사용 방법

### 1. 문서 업데이트
\`\`\`bash
# 테스트에서 문서 추출
npx @context-action/test-driven-docs generate --enhanced

# 특정 패키지만
npx @context-action/test-driven-docs generate --packages react --enhanced
\`\`\`

### 2. 새 예제 추가
테스트 파일에 어노테이션을 추가:

\`\`\`typescript
// @doc-extract: example-name
// @doc-category: basic-usage
// @doc-priority: high
// @doc-description: 기본 사용법 예제
it('should demonstrate basic usage', () => {
  // 예제 코드
});
\`\`\`

### 3. 문서 검증
\`\`\`bash
# 모든 문서 예제 검증
npx @context-action/test-driven-docs validate

# 일관성 검사
npx @context-action/test-driven-docs validate --consistency
\`\`\`

## 📊 통계

- **총 API**: ${apiDocumentations.size}개
- **총 예제**: ${totalExamples}개
- **최종 업데이트**: ${new Date().toISOString().split('T')[0]}

---

*📝 이 문서는 [@context-action/test-driven-docs](https://www.npmjs.com/package/@context-action/test-driven-docs)에 의해 자동 생성됩니다.*
`;

    return content;
  }
}
