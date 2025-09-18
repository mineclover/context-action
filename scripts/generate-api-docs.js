#!/usr/bin/env node

/**
 * 테스트 기반 API 문서 생성기
 *
 * 이 스크립트는 테스트 파일을 분석하여 실제 사용 예제를 기반으로
 * API 문서를 자동 생성합니다.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.join(__dirname, '../packages');
const docsDir = path.join(__dirname, '../docs');

/**
 * API 문서 템플릿
 */
function createApiDocTemplate(apiName, examples, description = '') {
  return `# ${apiName}

${description}

## Usage Examples

${examples.map((example, index) => `
### Example ${index + 1}

\`\`\`typescript
${example.code}
\`\`\`

${example.description || ''}
`).join('\n')}

## Test Coverage

이 API는 다음 테스트 파일에서 검증됩니다:
${examples.map(ex => `- [${ex.testFile}](../../packages/${ex.packageName}/${ex.testFile})`).join('\n')}

## Related APIs

- 관련 API 링크들이 여기에 추가됩니다.

---
*이 문서는 테스트 코드를 기반으로 자동 생성되었습니다.*
`;
}

/**
 * 테스트 파일에서 API 사용 예제 추출
 */
async function extractExamplesFromTest(testFilePath, packageName) {
  const content = await fs.readFile(testFilePath, 'utf-8');
  const examples = [];

  // 인터페이스 및 설정 코드 추출
  const interfaceMatch = content.match(/interface\s+\w+Actions?\s+extends\s+ActionPayloadMap\s*\{([\s\S]*?)\}/);
  const setupMatch = content.match(/beforeEach\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\);/);

  // 테스트 케이스별로 코드 추출
  const testMatches = content.matchAll(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g);

  for (const match of testMatches) {
    const [, description, testCode] = match;

    // ActionRegister 관련 코드만 추출
    if (testCode.includes('ActionRegister') || testCode.includes('createActionContext') || testCode.includes('createStoreContext')) {

      // 완전한 예제 구성
      let completeExample = '';

      // 1. 타입 정의 포함
      if (interfaceMatch) {
        completeExample += `interface TestActions extends ActionPayloadMap {\n${interfaceMatch[1].trim()}\n}\n\n`;
      }

      // 2. 설정 코드 포함
      if (setupMatch) {
        completeExample += `// Setup\n${setupMatch[1].trim()}\n\n`;
      }

      // 3. 실제 테스트 코드 (정리된 버전)
      const cleanedCode = testCode
        .replace(/expect\([^)]*\)[^;]*;/g, '') // expect 문 제거
        .replace(/jest\.fn\(\)/g, 'async (payload) => { /* handler logic */ }') // mock을 실제 핸들러로
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//') && !line.includes('expect'))
        .join('\n');

      completeExample += `// Usage\n${cleanedCode}`;

      examples.push({
        description: description.trim(),
        code: completeExample,
        testFile: path.relative(path.join(packagesDir, packageName), testFilePath),
        packageName
      });
    }
  }

  return examples;
}

/**
 * 패키지의 모든 테스트 파일 스캔
 */
async function scanPackageTests(packageName) {
  const packagePath = path.join(packagesDir, packageName);
  const testDir = path.join(packagePath, '__tests__');

  try {
    const examples = [];
    const files = await fs.readdir(testDir, { recursive: true });

    for (const file of files) {
      if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) {
        const testFilePath = path.join(testDir, file);
        const fileExamples = await extractExamplesFromTest(testFilePath, packageName);
        examples.push(...fileExamples);
      }
    }

    return examples;
  } catch (error) {
    console.log(`No test directory found for ${packageName}`);
    return [];
  }
}

/**
 * API별로 예제 그룹화
 */
function groupExamplesByApi(examples) {
  const grouped = {};

  examples.forEach(example => {
    // API 이름 추출 (ActionRegister, createActionContext 등)
    const apiMatches = example.code.match(/(ActionRegister|createActionContext|createStoreContext|useActionHandler|useStoreValue)/g);

    if (apiMatches) {
      apiMatches.forEach(api => {
        if (!grouped[api]) {
          grouped[api] = [];
        }
        grouped[api].push(example);
      });
    }
  });

  return grouped;
}

/**
 * API 문서 생성
 */
async function generateApiDocs() {
  console.log('🔍 테스트 파일에서 API 사용 예제 추출 중...');

  // Core 패키지 예제 추출
  const coreExamples = await scanPackageTests('core');
  console.log(`📋 Core 패키지에서 ${coreExamples.length}개 예제 발견`);

  // React 패키지 예제 추출
  const reactExamples = await scanPackageTests('react');
  console.log(`⚛️ React 패키지에서 ${reactExamples.length}개 예제 발견`);

  // 모든 예제 합치기
  const allExamples = [...coreExamples, ...reactExamples];

  // API별로 그룹화
  const groupedExamples = groupExamplesByApi(allExamples);

  console.log(`📚 발견된 API: ${Object.keys(groupedExamples).join(', ')}`);

  // 각 API에 대한 문서 생성
  for (const [apiName, examples] of Object.entries(groupedExamples)) {
    if (examples.length > 0) {
      const docContent = createApiDocTemplate(apiName, examples);

      // 영어 문서 생성
      const enDocPath = path.join(docsDir, 'en', 'api', `${apiName.toLowerCase()}.md`);
      await fs.mkdir(path.dirname(enDocPath), { recursive: true });
      await fs.writeFile(enDocPath, docContent);

      // 한국어 문서 생성 (기본 구조만)
      const koDocPath = path.join(docsDir, 'ko', 'api', `${apiName.toLowerCase()}.md`);
      await fs.mkdir(path.dirname(koDocPath), { recursive: true });
      await fs.writeFile(koDocPath, docContent.replace('Usage Examples', '사용 예제').replace('Test Coverage', '테스트 커버리지'));

      console.log(`✅ ${apiName} 문서 생성 완료`);
    }
  }

  console.log('🎉 테스트 기반 API 문서 생성 완료!');
}

// 스크립트 실행
generateApiDocs().catch(console.error);