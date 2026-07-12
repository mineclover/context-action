/**
 * Extract expected styles from source code
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseImport from '@babel/traverse';
import type * as t from '@babel/types';

const traverse: typeof traverseImport =
  (traverseImport as typeof traverseImport & {
    default?: typeof traverseImport;
  }).default ?? traverseImport;
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
    let currentComponentName = 'Unknown';

    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      traverse(ast, {
        // Track component names
        FunctionDeclaration(path) {
          if (path.node.id?.name) {
            currentComponentName = path.node.id.name;
          }
        },
        VariableDeclarator(path) {
          if (
            path.node.id.type === 'Identifier' &&
            path.node.init &&
            (path.node.init.type === 'ArrowFunctionExpression' ||
              path.node.init.type === 'FunctionExpression')
          ) {
            currentComponentName = path.node.id.name;
          }
        },
        JSXOpeningElement: (path) => {
          const { node } = path;

          // Find className attribute
          const classNameAttr = node.attributes.find(
            (attr): attr is t.JSXAttribute =>
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'JSXIdentifier' &&
              attr.name.name === 'className'
          );

          if (classNameAttr) {
            let className = '';

            // Extract className value (can be string or expression)
            if (classNameAttr.value?.type === 'StringLiteral') {
              className = classNameAttr.value.value;
            } else if (classNameAttr.value?.type === 'JSXExpressionContainer') {
              const expr = classNameAttr.value.expression;

              // Direct string literal
              if (expr.type === 'StringLiteral') {
                className = expr.value;
              }
              // Template literal
              else if (expr.type === 'TemplateLiteral' && expr.quasis.length > 0) {
                className = expr.quasis.map(q => q.value.raw).join(' ');
              }
              // Call expression like cn()
              else if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
                const firstArg = expr.arguments[0];
                if (firstArg.type === 'StringLiteral') {
                  className = firstArg.value;
                } else if (firstArg.type === 'TemplateLiteral' && firstArg.quasis.length > 0) {
                  className = firstArg.quasis.map((q: any) => q.value.raw).join(' ');
                }
              }
            }

            if (className) {
              // Generate test ID (same logic as Babel plugin)
              const elementName = node.name.type === 'JSXIdentifier' ? node.name.name : 'element';
              const line = node.loc?.start.line || 0;
              const testId = `${currentComponentName}:${elementName}:${line}`;

              const expectedStyles = resolveTailwindClasses(className);

              elements.push({
                testId,
                className,
                expectedStyles,
                file: filePath,
                line,
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
