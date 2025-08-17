import { DocumentMetadata, DocumentCategory } from '../../src/types/config';

export interface GenerationOptions {
  categories?: DocumentCategory[];
  tags?: string[];
  withDependencies?: boolean;
  withConflicts?: boolean;
  priorityRange?: [number, number];
}

/**
 * Test data generator for creating realistic test documents and scenarios
 */
export class TestDataGenerator {
  /**
   * Generate realistic test documents
   */
  static generateDocuments(count: number, options: GenerationOptions = {}): DocumentMetadata[] {
    const {
      categories = ['guide', 'api', 'concept', 'example'],
      tags = ['beginner', 'intermediate', 'advanced', 'practical', 'technical'],
      withDependencies = false,
      withConflicts = false,
      priorityRange = [20, 100]
    } = options;

    const documents: DocumentMetadata[] = [];

    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const id = `${category}-document-${i + 1}`;
      
      const doc: DocumentMetadata = {
        document: {
          id,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Document ${i + 1}`,
          source_path: `docs/en/${category}/${id.replace(`${category}-`, '')}.md`,
          category: category as DocumentCategory,
          lastModified: new Date().toISOString(),
          wordCount: Math.floor(Math.random() * 2000) + 500
        },
        priority: {
          score: Math.floor(Math.random() * (priorityRange[1] - priorityRange[0])) + priorityRange[0],
          tier: this.getRandomTier(),
          rationale: `Priority assigned based on ${category} importance`,
          autoCalculated: Math.random() > 0.3
        },
        purpose: {
          primary_goal: this.getRandomGoal(category),
          target_audience: this.getRandomAudience(),
          use_cases: [
            `Understanding ${category} concepts`,
            `Implementing ${category} features`
          ],
          learning_objectives: [
            `Learn ${category} fundamentals`,
            `Apply ${category} in practice`
          ]
        },
        keywords: {
          primary: this.getRandomKeywords(tags, 3),
          technical: this.getTechnicalKeywords(category),
          patterns: [`${category}-pattern`, 'framework-pattern']
        },
        tags: {
          primary: this.getRandomTags(tags, category),
          audience: this.getRandomAudience(),
          complexity: this.getRandomComplexity(),
        },
        dependencies: withDependencies ? this.generateDependencies(i, count) : {
          prerequisites: [],
          references: [],
          followups: [],
          conflicts: [],
          complements: []
        },
        composition: {
          categoryAffinity: this.generateCategoryAffinity(category),
          tagAffinity: this.generateTagAffinity(tags),
          contextualRelevance: this.generateContextualRelevance(),
          userJourneyStage: this.getRandomJourneyStage()
        },
        extraction: {
          strategy: this.getRandomStrategy(category),
          character_limits: {
            "100": {
              focus: "Key concepts only",
              structure: "Brief overview"
            },
            "300": {
              focus: "Main points with examples",
              structure: "Structured explanation"
            },
            "1000": {
              focus: "Comprehensive coverage",
              structure: "Detailed guide"
            }
          }
        }
      };

      if (withConflicts && Math.random() < 0.2) {
        doc.dependencies.conflicts = [{
          documentId: `conflicting-doc-${i}`,
          reason: "Alternative approach to same concept",
          severity: "moderate"
        }];
      }

      documents.push(doc);
    }

    return documents;
  }

  /**
   * Generate documents with complex dependency relationships
   */
  static generateDependencyGraph(complexity: 'simple' | 'complex' | 'cyclic'): DocumentMetadata[] {
    const baseCount = complexity === 'simple' ? 5 : complexity === 'complex' ? 15 : 8;
    const documents = this.generateDocuments(baseCount, { withDependencies: true });

    switch (complexity) {
      case 'simple':
        // Linear dependency chain: 1 → 2 → 3 → 4 → 5
        documents.forEach((doc, i) => {
          if (i > 0) {
            doc.dependencies.prerequisites = [{
              documentId: documents[i - 1].document.id,
              importance: 'required',
              reason: 'Builds on previous concepts'
            }];
          }
          if (i < documents.length - 1) {
            doc.dependencies.followups = [{
              documentId: documents[i + 1].document.id,
              reason: 'Natural progression',
              timing: 'immediate'
            }];
          }
        });
        break;

      case 'complex':
        // Complex web of dependencies
        documents.forEach((doc, i) => {
          const numPrereqs = Math.floor(Math.random() * 3);
          const numFollowups = Math.floor(Math.random() * 2) + 1;

          for (let j = 0; j < numPrereqs; j++) {
            const prereqIndex = Math.floor(Math.random() * i);
            if (prereqIndex >= 0) {
              doc.dependencies.prerequisites.push({
                documentId: documents[prereqIndex].document.id,
                importance: Math.random() > 0.5 ? 'required' : 'recommended',
                reason: 'Required background knowledge'
              });
            }
          }

          for (let j = 0; j < numFollowups && i + j + 1 < documents.length; j++) {
            doc.dependencies.followups.push({
              documentId: documents[i + j + 1].document.id,
              reason: 'Advanced topic',
              timing: 'after-practice'
            });
          }
        });
        break;

      case 'cyclic':
        // Intentionally create cycles for testing cycle detection
        documents[0].dependencies.prerequisites = [{
          documentId: documents[documents.length - 1].document.id,
          importance: 'required',
          reason: 'Circular reference'
        }];
        for (let i = 1; i < documents.length; i++) {
          documents[i].dependencies.prerequisites = [{
            documentId: documents[i - 1].document.id,
            importance: 'required',
            reason: 'Sequential dependency'
          }];
        }
        break;
    }

    return documents;
  }

  /**
   * Generate documents with various types of conflicts
   */
  static generateConflictingDocuments(): DocumentMetadata[] {
    const documents = this.generateDocuments(6);

    // Create tag incompatibilities
    documents[0].tags.primary = ['beginner', 'step-by-step'];
    documents[1].tags.primary = ['advanced', 'expert'];
    documents[1].dependencies.conflicts = [{
      documentId: documents[0].document.id,
      reason: 'Conflicting complexity levels',
      severity: 'major'
    }];

    // Create audience mismatches
    documents[2].tags.audience = ['beginners'];
    documents[3].tags.audience = ['experts'];
    documents[3].dependencies.conflicts = [{
      documentId: documents[2].document.id,
      reason: 'Different target audiences',
      severity: 'moderate'
    }];

    // Create content duplicates
    documents[4].document.title = 'Getting Started Guide';
    documents[5].document.title = 'Getting Started Tutorial';
    documents[4].keywords.primary = ['getting-started', 'tutorial', 'beginner'];
    documents[5].keywords.primary = ['getting-started', 'tutorial', 'introduction'];
    documents[5].dependencies.conflicts = [{
      documentId: documents[4].document.id,
      reason: 'Duplicate content coverage',
      severity: 'minor'
    }];

    return documents;
  }

  // Helper methods
  private static getRandomTier(): string {
    const tiers = ['critical', 'essential', 'important', 'reference', 'supplementary'];
    return tiers[Math.floor(Math.random() * tiers.length)];
  }

  private static getRandomGoal(category: string): string {
    const goals = {
      guide: 'Provide step-by-step guidance',
      api: 'Document API functionality',
      concept: 'Explain core concepts',
      example: 'Demonstrate practical usage'
    };
    return goals[category as keyof typeof goals] || 'General documentation';
  }

  private static getRandomAudience(): string[] {
    const audiences = ['beginners', 'intermediate', 'advanced', 'framework-users', 'contributors'];
    const count = Math.floor(Math.random() * 2) + 1;
    return audiences.slice(0, count);
  }

  private static getRandomKeywords(tags: string[], count: number): string[] {
    const shuffled = [...tags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private static getTechnicalKeywords(category: string): string[] {
    const keywords = {
      guide: ['tutorial', 'guide', 'step-by-step'],
      api: ['api', 'interface', 'method', 'function'],
      concept: ['concept', 'theory', 'principle'],
      example: ['example', 'demo', 'sample', 'code']
    };
    return keywords[category as keyof typeof keywords] || ['general'];
  }

  private static getRandomTags(tags: string[], category: string): string[] {
    const categoryTags = {
      guide: ['beginner', 'step-by-step', 'practical', 'tutorial'],
      api: ['technical', 'reference', 'developer'],
      concept: ['theory', 'architecture', 'design'],
      example: ['practical', 'code', 'sample']
    };
    
    const relevant = categoryTags[category as keyof typeof categoryTags] || tags;
    const count = Math.min(Math.floor(Math.random() * 3) + 1, 5);
    return relevant.slice(0, count);
  }

  private static getRandomComplexity(): string {
    const complexities = ['basic', 'intermediate', 'advanced', 'expert'];
    return complexities[Math.floor(Math.random() * complexities.length)];
  }

  private static getRandomJourneyStage(): string {
    const stages = ['discovery', 'onboarding', 'implementation', 'mastery', 'troubleshooting'];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  private static getRandomStrategy(category: string): string {
    const strategies = {
      guide: 'tutorial-first',
      api: 'reference-first',
      concept: 'concept-first',
      example: 'example-first'
    };
    return strategies[category as keyof typeof strategies] || 'concept-first';
  }

  private static generateDependencies(index: number, total: number): any {
    const deps: any = {
      prerequisites: [],
      references: [],
      followups: [],
      conflicts: [],
      complements: []
    };

    // Add some prerequisites for later documents
    if (index > 0 && Math.random() > 0.5) {
      const prereqIndex = Math.floor(Math.random() * index);
      deps.prerequisites.push({
        documentId: `document-${prereqIndex + 1}`,
        importance: 'required',
        reason: 'Foundation knowledge'
      });
    }

    // Add some followups for earlier documents
    if (index < total - 1 && Math.random() > 0.6) {
      deps.followups.push({
        documentId: `document-${index + 2}`,
        reason: 'Advanced concepts',
        timing: 'after-practice'
      });
    }

    return deps;
  }

  private static generateCategoryAffinity(category: string): Record<string, number> {
    const affinity: Record<string, number> = {};
    const categories = ['guide', 'api', 'concept', 'example', 'reference'];
    
    categories.forEach(cat => {
      if (cat === category) {
        affinity[cat] = 1.0;
      } else {
        affinity[cat] = Math.random() * 0.8 + 0.2;
      }
    });

    return affinity;
  }

  private static generateTagAffinity(tags: string[]): Record<string, number> {
    const affinity: Record<string, number> = {};
    const selectedTags = tags.slice(0, Math.floor(Math.random() * 5) + 3);
    
    selectedTags.forEach(tag => {
      affinity[tag] = Math.random() * 0.8 + 0.2;
    });

    return affinity;
  }

  private static generateContextualRelevance(): Record<string, number> {
    return {
      onboarding: Math.random(),
      troubleshooting: Math.random(),
      advanced_usage: Math.random(),
      api_reference: Math.random(),
      learning_path: Math.random()
    };
  }
}