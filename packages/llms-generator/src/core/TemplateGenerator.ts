/**
 * TemplateGenerator - 개별 요약 문서 템플릿 생성기
 * 
 * priority.json 파일을 기반으로 characterLimit에 따른 
 * 개별 요약 문서 템플릿을 자동 생성합니다.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { LLMSConfig } from '../types/index.js';

interface PriorityData {
  document: {
    id: string;
    title: string;
    source_path: string;
    category: string;
  };
  priority: {
    score: number;
    tier: string;
    rationale: string;
  };
  purpose: {
    primary_goal: string;
    target_audience: string[];
    use_cases: string[];
  };
  keywords: {
    primary: string[];
    technical: string[];
    patterns: string[];
  };
  extraction: {
    characterLimit: {
      [key: string]: {
        focus: string;
        structure: string;
        must_include: string[];
        avoid: string[];
        example_structure: string;
      };
    };
  };
  metadata: {
    created: string;
    version: string;
    original_size: number;
  };
}

export class TemplateGenerator {
  constructor(private config: LLMSConfig) {}

  /**
   * 모든 priority.json 파일을 스캔하여 개별 요약 문서 템플릿 생성
   */
  async generateAllTemplates(): Promise<void> {
    const priorityFiles = this.findAllPriorityFiles();
    
    console.log(`📋 Found ${priorityFiles.length} priority files`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const priorityFile of priorityFiles) {
      try {
        await this.generateTemplatesForPriority(priorityFile);
        successCount++;
        console.log(`✅ Generated templates for ${priorityFile}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error generating templates for ${priorityFile}:`, error);
      }
    }

    console.log(`\n📊 Template generation summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📁 Total: ${priorityFiles.length}`);
  }

  /**
   * 특정 priority.json 파일에 대해 개별 요약 문서 템플릿 생성
   */
  async generateTemplatesForPriority(priorityFilePath: string): Promise<void> {
    const priorityData = this.loadPriorityData(priorityFilePath);
    const baseDir = dirname(priorityFilePath);
    
    // characterLimit에서 숫자 키만 추출 (200, 500, 1000)
    const characterLimits = Object.keys(priorityData.extraction.characterLimit)
      .filter(key => /^\d+$/.test(key))
      .map(key => parseInt(key))
      .sort((a, b) => a - b);

    for (const limit of characterLimits) {
      const templateContent = this.generateTemplateContent(priorityData, limit);
      const templatePath = join(baseDir, `${priorityData.document.id}-${limit}.md`);
      
      // 디렉토리가 존재하지 않으면 생성
      const templateDir = dirname(templatePath);
      if (!existsSync(templateDir)) {
        mkdirSync(templateDir, { recursive: true });
      }

      writeFileSync(templatePath, templateContent, 'utf-8');
    }
  }

  /**
   * priority.json 데이터 로드
   */
  private loadPriorityData(priorityFilePath: string): PriorityData {
    try {
      const content = readFileSync(priorityFilePath, 'utf-8');
      return JSON.parse(content) as PriorityData;
    } catch (error) {
      throw new Error(`Failed to load priority data from ${priorityFilePath}: ${error}`);
    }
  }

  /**
   * 특정 문자 제한에 대한 템플릿 내용 생성
   */
  private generateTemplateContent(priorityData: PriorityData, characterLimit: number): string {
    const limitData = priorityData.extraction.characterLimit[characterLimit.toString()];
    const { document, purpose, keywords } = priorityData;

    const template = `# ${document.title} (${characterLimit}자)

## 문서 정보
- **문서 ID**: ${document.id}
- **카테고리**: ${document.category}
- **원본 경로**: ${document.source_path}
- **문자 제한**: ${characterLimit}자

## 생성 가이드라인

### 목표
${limitData.focus}

### 구조
${limitData.structure}

### 반드시 포함해야 할 내용
${limitData.must_include.map(item => `- ${item}`).join('\n')}

### 피해야 할 내용  
${limitData.avoid.map(item => `- ${item}`).join('\n')}

### 예시 구조
\`\`\`
${limitData.example_structure}
\`\`\`

## 키워드 참조

### 주요 키워드
${keywords.primary.map(keyword => `- ${keyword}`).join('\n')}

### 기술 키워드
${keywords.technical.slice(0, 8).map(keyword => `- ${keyword}`).join('\n')}

### 패턴
${keywords.patterns.map(pattern => `- ${pattern}`).join('\n')}

## 대상 독자
${purpose.target_audience.map(audience => `- ${audience}`).join('\n')}

## 주요 용도
${purpose.use_cases.map(useCase => `- ${useCase}`).join('\n')}

---

## 템플릿 내용 (${characterLimit}자 이내)

\`\`\`markdown
<!-- 여기에 ${characterLimit}자 이내의 요약 내용을 작성하세요 -->

${this.generateSampleContent(priorityData, characterLimit)}
\`\`\`

---

> **참고**: 이 템플릿은 ${priorityData.metadata.created}에 생성되었으며, 
> 원본 문서 크기는 ${priorityData.metadata.original_size}자입니다.
`;

    return template;
  }

  /**
   * 문자 제한에 따른 샘플 내용 생성
   */
  private generateSampleContent(priorityData: PriorityData, characterLimit: number): string {
    const { document, purpose } = priorityData;
    
    if (characterLimit <= 200) {
      return `${document.title}: ${purpose.primary_goal}의 핵심 개념과 Context-Action 프레임워크에서의 역할을 간단히 설명.`;
    } else if (characterLimit <= 500) {
      return `# ${document.title}

${purpose.primary_goal}

## 주요 특징
- Context-Action 프레임워크의 핵심 구성요소
- ${purpose.use_cases[0] || '기본 사용법'}을 지원
- ${purpose.target_audience.join(', ')}을 위한 설계

간단한 사용 예시와 주요 이점을 포함하여 전체적인 개념을 이해할 수 있도록 구성.`;
    } else {
      return `# ${document.title}

${purpose.primary_goal}

## 개요
Context-Action 프레임워크에서 ${document.title}는 [상세 설명]의 역할을 담당합니다.

## 주요 기능
- ${purpose.use_cases.map(useCase => useCase).join('\n- ')}

## 사용법
\`\`\`typescript
// 기본 사용 예시
import { ... } from '@context-action/...';

// 구현 예시
\`\`\`

## 대상 독자
이 문서는 ${purpose.target_audience.join(', ')}을 대상으로 합니다.

실제 코드 예시와 구체적인 구현 방법을 포함하여 실용적인 이해를 돕습니다.`;
    }
  }

  /**
   * 모든 priority.json 파일 경로 찾기
   */
  private findAllPriorityFiles(): string[] {
    const dataDir = this.config.paths.llmContentDir;
    return this.findPriorityFilesRecursive(dataDir);
  }

  /**
   * 재귀적으로 priority.json 파일 찾기
   */
  private findPriorityFilesRecursive(dir: string): string[] {
    const results: string[] = [];
    
    try {
      const { readdirSync, statSync } = require('fs');
      const items = readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          results.push(...this.findPriorityFilesRecursive(fullPath));
        } else if (item === 'priority.json') {
          results.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error);
    }

    return results;
  }
}