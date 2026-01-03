/**
 * Extract expected styles from source code
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type * as t from '@babel/types';
import { resolveTailwindClasses } from '../analyzers/class-resolver.js';

export interface ExtractedElement {
  testId: string;
  className: string;
  expectedStyles: Record<string, string>;
  file: string;
  line: number;
}

export class StyleExtractor {
  private sourceFiles: string[] = [];

  addSourceFile(filePath: string): void {
    this.sourceFiles.push(filePath);
  }

  addSourceDirectory(dirPath: string, pattern: RegExp = /\.tsx?$/): void {
    const files = this.walkDirectory(dirPath, pattern);
    this.sourceFiles.push(...files);
  }

  private walkDirectory(dir: string, pattern: RegExp): string[] {
    const results: string[] = [];

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== 'dist') {
            results.push(...this.walkDirectory(fullPath, pattern));
          }
        } else if (pattern.test(entry.name)) {
          results.push(fullPath);
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }

    return results;
  }

  extractExpectedStyles(): ExtractedElement[] {
    const elements: ExtractedElement[] = [];

    for (const file of this.sourceFiles) {
      try {
        const code = fs.readFileSync(file, 'utf-8');
        const fileElements = this.parseFile(code, file);
        elements.push(...fileElements);
      } catch (err) {
        console.warn(`Failed to parse ${file}:`, err);
      }
    }

    return elements;
  }

  private parseFile(code: string, filePath: string): ExtractedElement[] {
    const elements: ExtractedElement[] = [];

    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      traverse(ast, {
        JSXOpeningElement: (path) => {
          const { node } = path;

          // Find data-style-test attribute
          const testIdAttr = node.attributes.find(
            (attr): attr is t.JSXAttribute =>
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'JSXIdentifier' &&
              attr.name.name === 'data-style-test' &&
              attr.value?.type === 'StringLiteral'
          );

          // Find className attribute
          const classNameAttr = node.attributes.find(
            (attr): attr is t.JSXAttribute =>
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'JSXIdentifier' &&
              attr.name.name === 'className'
          );

          if (testIdAttr && classNameAttr && testIdAttr.value?.type === 'StringLiteral') {
            const testId = testIdAttr.value.value;
            let className = '';

            // Extract className value (can be string or expression)
            if (classNameAttr.value?.type === 'StringLiteral') {
              className = classNameAttr.value.value;
            } else if (
              classNameAttr.value?.type === 'JSXExpressionContainer' &&
              classNameAttr.value.expression.type === 'StringLiteral'
            ) {
              className = classNameAttr.value.expression.value;
            }

            if (className) {
              const expectedStyles = resolveTailwindClasses(className);

              elements.push({
                testId,
                className,
                expectedStyles,
                file: filePath,
                line: node.loc?.start.line || 0,
              });
            }
          }
        },
      });
    } catch (err) {
      // Parse errors are already warned above
    }

    return elements;
  }
}
