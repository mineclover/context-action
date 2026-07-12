import {
  AnnotationExtractor,
  type AnnotatedTest,
  type DocAnnotation
} from '@context-action/test-driven-docs/extractors';
import {
  EnhancedMarkdownGenerator,
  type EnhancedDocConfig
} from '@context-action/test-driven-docs/generators';
import {
  ConsistencyValidator,
  type ProjectValidationReport
} from '@context-action/test-driven-docs/validators';
import type {
  GeneratorConfig,
  TestFileMetadata
} from '@context-action/test-driven-docs/types';

const annotation: DocAnnotation = {
  extractId: 'example',
  category: 'basic-usage',
  priority: 'high',
  lineNumber: 1
};

const extractor = new AnnotationExtractor();
const generatorConfig: EnhancedDocConfig = { includeOverview: true };
const generator = new EnhancedMarkdownGenerator(generatorConfig);
const validator = new ConsistencyValidator({ packagesDir: './packages', packages: [] });

void annotation;
void extractor;
void generator;
void validator;
void (null as AnnotatedTest | null);
void (null as ProjectValidationReport | null);
void (null as GeneratorConfig | null);
void (null as TestFileMetadata | null);
