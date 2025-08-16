/**
 * Integration test for complete workflow scenarios
 * 시나리오 기반 통합 테스트 - 사용법 검증과 스펙 연계 확인
 */

const { readFile, writeFile, mkdir, rm } = require('fs/promises');
const { existsSync } = require('fs');
const path = require('path');
const TEST_DATA_DIR = path.join(__dirname, 'test-data');
const TEST_DOCS_DIR = path.join(TEST_DATA_DIR, 'docs');

// Test scenarios matching README usage examples
describe('Complete Workflow Integration Tests', () => {
  beforeAll(async () => {
    // Setup test environment
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup
    if (existsSync(TEST_DATA_DIR)) {
      await rm(TEST_DATA_DIR, { recursive: true, force: true });
    }
  });

  describe('시나리오 1: 초기 설정 및 우선순위 생성', () => {
    it('should discover documents and generate priority files', async () => {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Test equivalent of: npx @context-action/llms-generator priority-generate ko --dry-run
      const config = createTestConfig();
      const { PriorityGenerator } = await import('../dist/index.js');
      
      const priorityGenerator = new PriorityGenerator(config);
      await priorityGenerator.initialize();

      // Discover documents
      const documents = await priorityGenerator.discoverDocuments('ko');
      expect(documents.length).toBeGreaterThan(0);
      expect(documents[0]).toHaveProperty('documentId');
      expect(documents[0]).toHaveProperty('category');
      expect(documents[0]).toHaveProperty('sourcePath');

      // Generate priorities (dry run)
      const result = await priorityGenerator.bulkGeneratePriorities({
        languages: ['ko'],
        dryRun: true,
        overwriteExisting: false
      });

      expect(result.summary.totalDiscovered).toBeGreaterThan(0);
      expect(result.summary.totalGenerated).toBe(0); // dry run
      expect(result.errors).toEqual([]);

      // Actually generate priorities
      const realResult = await priorityGenerator.bulkGeneratePriorities({
        languages: ['ko'],
        dryRun: false,
        overwriteExisting: true
      });

      expect(realResult.summary.totalGenerated).toBeGreaterThan(0);
    });

    it('should generate valid priority.json files with work_status schema compliance', async () => {
      const priorityFile = path.join(TEST_DATA_DIR, 'ko', 'guide-hooks', 'priority.json');
      
      if (existsSync(priorityFile)) {
        const content = await readFile(priorityFile, 'utf-8');
        const priority = JSON.parse(content);

        // 스키마 연계 확인 - 기본 필드들
        expect(priority).toHaveProperty('document');
        expect(priority.document).toHaveProperty('id');
        expect(priority.document).toHaveProperty('title');
        expect(priority.document).toHaveProperty('source_path');
        expect(priority.document).toHaveProperty('category');
        
        expect(priority).toHaveProperty('priority');
        expect(priority.priority).toHaveProperty('score');
        expect(priority.priority).toHaveProperty('tier');
        expect(priority.priority.score).toBeGreaterThanOrEqual(0);
        expect(priority.priority.score).toBeLessThanOrEqual(100);

        expect(priority).toHaveProperty('extraction');
        expect(priority.extraction).toHaveProperty('strategy');
        expect(priority.extraction).toHaveProperty('character_limits');

        // work_status 스키마 확장 확인 (옵셔널이므로 존재 시에만 검증)
        if (priority.work_status) {
          expect(priority.work_status).toHaveProperty('generated_files');
          if (priority.work_status.generated_files) {
            const fileKeys = Object.keys(priority.work_status.generated_files);
            fileKeys.forEach(key => {
              expect(key).toMatch(/^\d+$/); // 숫자 패턴
              const fileInfo = priority.work_status.generated_files[key];
              expect(fileInfo).toHaveProperty('path');
              expect(fileInfo).toHaveProperty('edited');
              expect(fileInfo).toHaveProperty('needs_update');
            });
          }
        }
      }
    });
  });

  describe('시나리오 2: 콘텐츠 요약 추출', () => {
    it('should extract content summaries to data directory', async () => {
      const config = createTestConfig();
      const { ContentExtractor } = await import('../dist/index.js');
      
      const contentExtractor = new ContentExtractor(config);

      // Test equivalent of: npx @context-action/llms-generator extract ko --chars=100,300,1000
      const result = await contentExtractor.extractByCharacterLimits('ko', [100, 300, 1000], {
        dryRun: false,
        overwrite: true
      });

      expect(result.summary.totalGenerated).toBeGreaterThan(0);
      expect(result.summary.byCharacterLimit).toHaveProperty('100');
      expect(result.summary.byCharacterLimit).toHaveProperty('300');
      expect(result.summary.byCharacterLimit).toHaveProperty('1000');

      // Verify files are created in correct location
      const testDocumentDir = path.join(TEST_DATA_DIR, 'ko', 'guide-hooks');
      if (existsSync(testDocumentDir)) {
        const file100 = path.join(testDocumentDir, 'guide-hooks-100.txt');
        const file300 = path.join(testDocumentDir, 'guide-hooks-300.txt');
        const file1000 = path.join(testDocumentDir, 'guide-hooks-1000.txt');

        // Files should exist in data directory
        if (existsSync(file100)) {
          const content = await readFile(file100, 'utf-8');
          expect(content.length).toBeGreaterThan(0);
          expect(content.length).toBeLessThanOrEqual(150); // 100 + buffer
        }
      }
    });
  });

  describe('시나리오 3: 적응형 콘텐츠 조합', () => {
    it('should compose adaptive content with optimal space utilization', async () => {
      const config = createTestConfig();
      const { AdaptiveComposer } = await import('../dist/index.js');
      
      const adaptiveComposer = new AdaptiveComposer(config);

      // Test equivalent of: npx @context-action/llms-generator compose ko 5000
      const result = await adaptiveComposer.composeAdaptiveContent({
        language: 'ko',
        characterLimit: 5000,
        includeTableOfContents: true,
        priorityThreshold: 0
      });

      // 스펙 연계 확인 - 적응형 조합 결과
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('documents');

      expect(result.summary.targetCharacters).toBe(5000);
      expect(result.summary.utilization).toBeGreaterThan(90); // 90% 이상 활용
      expect(result.summary.totalCharacters).toBeLessThanOrEqual(5000);
      expect(result.summary.documentsIncluded).toBeGreaterThan(0);

      // 목차 포함 확인
      expect(result.content).toContain('# Context-Action');
      expect(result.content).toContain('## ');

      // 우선순위 기반 선택 확인
      const sortedDocs = result.documents.sort((a, b) => b.priority - a.priority);
      expect(result.documents).toEqual(sortedDocs);
    });

    it('should handle character limit constraints correctly', async () => {
      const config = createTestConfig();
      const { AdaptiveComposer } = await import('../dist/index.js');
      
      const adaptiveComposer = new AdaptiveComposer(config);

      // Test small character limit
      const smallResult = await adaptiveComposer.composeAdaptiveContent({
        language: 'ko',
        characterLimit: 1000,
        includeTableOfContents: true,
        priorityThreshold: 0
      });

      expect(smallResult.summary.totalCharacters).toBeLessThanOrEqual(1000);
      expect(smallResult.summary.utilization).toBeGreaterThan(80);

      // Test large character limit
      const largeResult = await adaptiveComposer.composeAdaptiveContent({
        language: 'ko',
        characterLimit: 10000,
        includeTableOfContents: true,
        priorityThreshold: 0
      });

      expect(largeResult.summary.totalCharacters).toBeLessThanOrEqual(10000);
      expect(largeResult.summary.documentsIncluded).toBeGreaterThanOrEqual(smallResult.summary.documentsIncluded);
    });
  });

  describe('시나리오 4: 작업 상태 관리', () => {
    it('should track work status for documents', async () => {
      const config = createTestConfig();
      const { WorkStatusManager } = await import('../dist/index.js');
      
      const workStatusManager = new WorkStatusManager(config);

      // Update work status for a document
      await workStatusManager.updateWorkStatus('ko', 'guide-hooks');

      // Get work status
      const workStatus = await workStatusManager.getWorkStatus('ko', 'guide-hooks');
      
      if (workStatus) {
        expect(workStatus).toHaveProperty('documentId', 'guide-hooks');
        expect(workStatus).toHaveProperty('sourceFile');
        expect(workStatus).toHaveProperty('characterLimits');
        expect(workStatus).toHaveProperty('generatedFiles');
        expect(workStatus).toHaveProperty('needsWork');

        // Generated files should have proper structure
        expect(workStatus.generatedFiles).toBeInstanceOf(Array);
        workStatus.generatedFiles.forEach(file => {
          expect(file).toHaveProperty('charLimit');
          expect(file).toHaveProperty('path');
          expect(file).toHaveProperty('exists');
          expect(file).toHaveProperty('needsUpdate');
          expect(file).toHaveProperty('edited');
          expect(typeof file.needsUpdate).toBe('boolean');
          expect(typeof file.edited).toBe('boolean');
        });
      }
    });

    it('should provide work context for document editing', async () => {
      const config = createTestConfig();
      const { WorkStatusManager } = await import('../dist/index.js');
      
      const workStatusManager = new WorkStatusManager(config);

      const workContext = await workStatusManager.getWorkContext('ko', 'guide-hooks', 100);
      
      if (workContext) {
        // 편집에 필요한 모든 컨텍스트 제공 확인
        expect(workContext).toHaveProperty('documentId');
        expect(workContext).toHaveProperty('title');
        expect(workContext).toHaveProperty('sourceContent');
        expect(workContext).toHaveProperty('currentSummary');
        expect(workContext).toHaveProperty('priorityInfo');
        expect(workContext).toHaveProperty('workStatus');

        // 우선순위 정보 확인
        expect(workContext.priorityInfo).toHaveProperty('priority');
        expect(workContext.priorityInfo.priority).toHaveProperty('score');
        expect(workContext.priorityInfo.priority).toHaveProperty('tier');
        
        // 추출 전략 확인
        expect(workContext.priorityInfo).toHaveProperty('extraction');
        expect(workContext.priorityInfo.extraction).toHaveProperty('strategy');
        expect(workContext.priorityInfo.extraction).toHaveProperty('character_limits');
        
        // 100자 제한에 대한 focus 정보 확인
        const focus100 = workContext.priorityInfo.extraction.character_limits['100'];
        if (focus100) {
          expect(focus100).toHaveProperty('focus');
          expect(typeof focus100.focus).toBe('string');
        }
      }
    });

    it('should list documents needing work with proper filtering', async () => {
      const config = createTestConfig();
      const { WorkStatusManager } = await import('../dist/index.js');
      
      const workStatusManager = new WorkStatusManager(config);

      // Update all work status first
      await workStatusManager.updateAllWorkStatus('ko');

      // List all documents needing work
      const workList = await workStatusManager.listWorkNeeded('ko', {
        characterLimit: 100,
        needsUpdate: true
      });

      expect(workList).toBeInstanceOf(Array);
      workList.forEach(work => {
        expect(work).toHaveProperty('documentId');
        expect(work).toHaveProperty('needsWork');
        expect(work).toHaveProperty('generatedFiles');
        
        // Should include documents that actually need work
        const file100 = work.generatedFiles.find(f => f.charLimit === 100);
        if (file100) {
          expect(file100.needsUpdate || !file100.exists).toBe(true);
        }
      });
    });
  });

  describe('스키마 검증 및 호환성', () => {
    it('should validate priority.json against schema', async () => {
      const schemaPath = path.join(__dirname, '../data/priority-schema-enhanced.json');
      const schemaContent = await readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);

      // 스키마 자체 검증
      expect(schema).toHaveProperty('$schema');
      expect(schema).toHaveProperty('title');
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('document');
      expect(schema.properties).toHaveProperty('priority');
      expect(schema.properties).toHaveProperty('extraction');
      expect(schema.properties).toHaveProperty('work_status');

      // work_status 스키마 확장 검증
      const workStatusSchema = schema.properties.work_status;
      expect(workStatusSchema).toHaveProperty('properties');
      expect(workStatusSchema.properties).toHaveProperty('source_modified');
      expect(workStatusSchema.properties).toHaveProperty('generated_files');
      expect(workStatusSchema.properties).toHaveProperty('last_checked');
    });

    it('should maintain backward compatibility', async () => {
      // 기존 priority.json 파일이 새 스키마와 호환되는지 확인
      const oldPriorityFile = path.join(TEST_DATA_DIR, 'ko', 'guide-hooks', 'priority.json');
      
      if (existsSync(oldPriorityFile)) {
        const content = await readFile(oldPriorityFile, 'utf-8');
        const priority = JSON.parse(content);

        // 기본 필드들은 여전히 존재해야 함
        expect(priority).toHaveProperty('document');
        expect(priority).toHaveProperty('priority');
        expect(priority).toHaveProperty('extraction');

        // work_status는 옵셔널이므로 없어도 됨
        // 있다면 올바른 구조여야 함
        if (priority.work_status) {
          expect(priority.work_status).toHaveProperty('generated_files');
        }
      }
    });
  });
});

async function setupTestData() {
  // Create test directory structure
  await mkdir(TEST_DATA_DIR, { recursive: true });
  await mkdir(path.join(TEST_DOCS_DIR, 'ko'), { recursive: true });

  // Create sample document
  const sampleDoc = `---
title: "훅 사용법"
description: "Context-Action 프레임워크의 훅 사용 가이드"
---

# 훅 사용법

## 개요

Context-Action 프레임워크에서 제공하는 훅들을 사용하는 방법입니다.

## 주요 훅들

### useActionDispatch

액션을 디스패치하기 위한 훅입니다.

\`\`\`typescript
const dispatch = useActionDispatch();
dispatch('updateUser', { id: 1, name: 'John' });
\`\`\`

### useStoreValue

스토어 값을 구독하기 위한 훅입니다.

\`\`\`typescript
const userValue = useStoreValue(userStore);
\`\`\`

## 사용 예제

완전한 사용 예제는 다음과 같습니다:

\`\`\`typescript
function UserComponent() {
  const dispatch = useActionDispatch();
  const user = useStoreValue(userStore);
  
  const handleUpdate = () => {
    dispatch('updateUser', { id: user.id, name: 'Updated Name' });
  };
  
  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
}
\`\`\`
`;

  await writeFile(path.join(TEST_DOCS_DIR, 'ko', 'guide', 'hooks.md'), sampleDoc, 'utf-8');

  // Make sure the guide directory exists
  await mkdir(path.join(TEST_DOCS_DIR, 'ko', 'guide'), { recursive: true });
}

function createTestConfig() {
  return {
    paths: {
      docsDir: TEST_DOCS_DIR,
      llmContentDir: TEST_DATA_DIR,
      outputDir: path.join(TEST_DATA_DIR, 'output')
    },
    generation: {
      supportedLanguages: ['ko'],
      characterLimits: [100, 300, 1000, 2000],
      defaultLanguage: 'ko',
      outputFormat: 'txt'
    },
    quality: {
      minCompletenessThreshold: 0.8,
      enableValidation: true,
      strictMode: false
    }
  };
}