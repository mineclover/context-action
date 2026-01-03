/**
 * Babel plugin to automatically inject data-style-test attributes
 * Converts: <nav className="...">
 * To: <nav className="..." data-style-test="ComponentName:nav:123">
 */
import type { PluginObj, PluginPass } from '@babel/core';
import type * as BabelTypes from '@babel/types';

interface PluginState extends PluginPass {
  filename?: string;
  componentName?: string;
}

export default function styleTestPlugin({ types: t }: { types: typeof BabelTypes }): PluginObj<PluginState> {
  return {
    name: 'auto-inject-style-test-id',

    visitor: {
      // Track component name from function/class declarations
      FunctionDeclaration(path, state) {
        if (path.node.id) {
          state.componentName = path.node.id.name;
        }
      },

      ArrowFunctionExpression(path, state) {
        const parent = path.parent;
        if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
          state.componentName = parent.id.name;
        }
      },

      // Inject data-style-test into JSX elements
      JSXOpeningElement(path, state) {
        const { node } = path;

        // Skip if already has data-style-test
        const hasStyleTest = node.attributes.some(
          attr => t.isJSXAttribute(attr) &&
                  t.isJSXIdentifier(attr.name) &&
                  attr.name.name === 'data-style-test'
        );

        if (hasStyleTest) return;

        // Only add to elements with className
        const hasClassName = node.attributes.some(
          attr => t.isJSXAttribute(attr) &&
                  t.isJSXIdentifier(attr.name) &&
                  attr.name.name === 'className'
        );

        if (!hasClassName) return;

        // Generate unique identifier
        const elementName = t.isJSXIdentifier(node.name) ? node.name.name : 'element';
        const componentName = state.componentName || 'Unknown';
        const line = node.loc?.start.line || 0;

        const testId = `${componentName}:${elementName}:${line}`;

        // Create and add data-style-test attribute
        const attribute = t.jsxAttribute(
          t.jsxIdentifier('data-style-test'),
          t.stringLiteral(testId)
        );

        node.attributes.push(attribute);
      },
    },
  };
}
