import { vol } from 'memfs';
import { join } from 'path';

/**
 * Mock file system utilities for testing
 */
export class MockFileSystem {
  private static mockFiles: Map<string, string> = new Map();

  /**
   * Reset the mock file system
   */
  static reset(): void {
    vol.reset();
    this.mockFiles.clear();
  }

  /**
   * Create mock file with content
   */
  static createFile(path: string, content: string): void {
    this.mockFiles.set(path, content);
    vol.fromJSON({ [path]: content });
  }

  /**
   * Create mock directory
   */
  static createDirectory(path: string): void {
    vol.mkdirSync(path, { recursive: true });
  }

  /**
   * Get mock file content
   */
  static getFile(path: string): string | undefined {
    return this.mockFiles.get(path);
  }

  /**
   * Check if mock file exists
   */
  static fileExists(path: string): boolean {
    return this.mockFiles.has(path);
  }

  /**
   * Setup typical test directory structure
   */
  static setupTestStructure(): void {
    const baseDir = '/test-project';
    
    // Create directories
    this.createDirectory(join(baseDir, 'docs/en'));
    this.createDirectory(join(baseDir, 'docs/ko'));
    this.createDirectory(join(baseDir, 'config'));
    
    // Create basic config files
    this.createFile(
      join(baseDir, 'llms-generator.config.json'),
      JSON.stringify({
        paths: {
          docs: 'docs',
          output: 'generated'
        },
        generation: {
          defaultCharacterLimits: [100, 300, 1000]
        }
      }, null, 2)
    );

    // Create enhanced config
    this.createFile(
      join(baseDir, 'llms-generator.config.json'),
      JSON.stringify({
        categories: {
          guide: {
            name: "가이드",
            priority: 90,
            defaultStrategy: "tutorial-first",
            tags: ["beginner", "step-by-step", "practical"]
          },
          api: {
            name: "API",
            priority: 85,
            defaultStrategy: "reference-first",
            tags: ["technical", "reference", "developer"]
          }
        },
        tags: {
          beginner: {
            name: "초보자",
            weight: 1.2,
            compatibleWith: ["step-by-step", "practical"],
            audience: ["new-users"]
          },
          advanced: {
            name: "고급",
            weight: 0.9,
            compatibleWith: ["technical", "expert"],
            audience: ["experts"]
          }
        },
        composition: {
          strategies: {
            balanced: {
              weights: {
                categoryWeight: 0.4,
                tagWeight: 0.3,
                dependencyWeight: 0.2,
                priorityWeight: 0.1
              }
            }
          },
          defaultStrategy: "balanced"
        }
      }, null, 2)
    );
  }

  /**
   * Create sample documents for testing
   */
  static createSampleDocuments(): void {
    const docs = [
      {
        id: 'guide-getting-started',
        path: '/test-project/docs/en/guide/getting-started.md',
        content: '# Getting Started\n\nThis guide helps you get started with the framework...',
        priority: {
          document: {
            id: 'guide-getting-started',
            title: 'Getting Started Guide',
            category: 'guide'
          },
          priority: { score: 95, tier: 'critical' },
          tags: {
            primary: ['beginner', 'step-by-step'],
            audience: ['new-users'],
            complexity: 'basic'
          },
          dependencies: {
            prerequisites: [],
            followups: [{ documentId: 'guide-basic-concepts', timing: 'immediate' }]
          }
        }
      },
      {
        id: 'api-action-provider',
        path: '/test-project/docs/en/api/action-provider.md',
        content: '# ActionProvider API\n\nThe ActionProvider class manages action registration...',
        priority: {
          document: {
            id: 'api-action-provider',
            title: 'ActionProvider API',
            category: 'api'
          },
          priority: { score: 85, tier: 'essential' },
          tags: {
            primary: ['technical', 'reference'],
            audience: ['developers'],
            complexity: 'intermediate'
          },
          dependencies: {
            prerequisites: [{ documentId: 'guide-getting-started', importance: 'recommended' }]
          }
        }
      }
    ];

    docs.forEach(doc => {
      this.createFile(doc.path, doc.content);
      this.createFile(
        doc.path.replace('.md', '.priority.json'),
        JSON.stringify(doc.priority, null, 2)
      );
    });
  }
}

// Mock fs module for testing
jest.mock('fs', () => require('memfs').fs);
jest.mock('fs/promises', () => require('memfs').fs.promises);