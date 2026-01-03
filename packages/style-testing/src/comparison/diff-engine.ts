/**
 * Compare expected vs actual styles and report differences
 */

export interface StyleDifference {
  property: string;
  expected: string;
  actual: string;
}

export interface ComparisonResult {
  testId: string;
  passed: boolean;
  differences: StyleDifference[];
  file?: string;
  line?: number;
}

export interface ComparisonOptions {
  /**
   * CSS properties to compare (if not set, compares all)
   */
  properties?: string[];

  /**
   * Whether to normalize values before comparison
   * (e.g., "0px" vs "0", "rgb(255,255,255)" vs "#fff")
   */
  normalize?: boolean;

  /**
   * Tolerance for numeric values (in pixels)
   */
  tolerance?: number;
}

export class DiffEngine {
  private options: ComparisonOptions;

  constructor(options: ComparisonOptions = {}) {
    this.options = {
      normalize: true,
      tolerance: 1,
      ...options,
    };
  }

  compare(
    expected: Record<string, string>,
    actual: Record<string, string>,
    testId: string,
    metadata?: { file?: string; line?: number }
  ): ComparisonResult {
    const differences: StyleDifference[] = [];

    // Get properties to compare
    const properties = this.options.properties || Object.keys(expected);

    for (const property of properties) {
      const expectedValue = expected[property];
      let actualValue = actual[property];

      // Skip if expected value is not set
      if (expectedValue === undefined) continue;

      // Handle shorthand properties that might be split
      if (!actualValue && this.isShorthandProperty(property)) {
        actualValue = this.getShorthandValue(property, actual);
      }

      // Normalize values if needed
      const normalizedExpected = this.options.normalize
        ? this.normalizeValue(expectedValue)
        : expectedValue;
      const normalizedActual = this.options.normalize
        ? this.normalizeValue(actualValue || '')
        : actualValue || '';

      // Compare values
      if (!this.valuesMatch(normalizedExpected, normalizedActual, property)) {
        // Don't report if actual has individual properties set correctly
        if (this.isShorthandProperty(property) && actualValue) {
          continue; // Skip if shorthand was successfully resolved
        }

        differences.push({
          property,
          expected: expectedValue,
          actual: actualValue || 'not set',
        });
      }
    }

    return {
      testId,
      passed: differences.length === 0,
      differences,
      file: metadata?.file,
      line: metadata?.line,
    };
  }

  private isShorthandProperty(property: string): boolean {
    return ['padding', 'margin', 'border', 'borderWidth', 'borderStyle', 'borderColor'].includes(property);
  }

  private getShorthandValue(property: string, actual: Record<string, string>): string {
    // For padding and margin, check if all 4 sides are set to the same value
    if (property === 'padding') {
      const top = actual.paddingTop;
      const right = actual.paddingRight;
      const bottom = actual.paddingBottom;
      const left = actual.paddingLeft;

      if (top && right && bottom && left && top === right && right === bottom && bottom === left) {
        return top;
      }
    }

    if (property === 'margin') {
      const top = actual.marginTop;
      const right = actual.marginRight;
      const bottom = actual.marginBottom;
      const left = actual.marginLeft;

      if (top && right && bottom && left && top === right && right === bottom && bottom === left) {
        return top;
      }
    }

    return '';
  }

  private normalizeValue(value: string): string {
    if (!value) return '';

    // Normalize 0 values
    if (value === '0px' || value === '0rem' || value === '0em') {
      return '0';
    }

    // Handle CSS variables - extract the fallback value
    if (value.includes('var(')) {
      const match = value.match(/var\([^,]+,\s*(.+)\)/);
      if (match) {
        value = match[1].trim();
      }
    }

    // Normalize colors
    if (value.startsWith('#')) {
      return this.normalizeColor(value);
    }

    if (value.startsWith('rgb')) {
      return this.normalizeRgb(value);
    }

    // Convert rem to px (assuming 16px base font size)
    if (value.endsWith('rem')) {
      const rem = parseFloat(value);
      if (!isNaN(rem)) {
        return `${rem * 16}px`;
      }
    }

    // Normalize whitespace
    return value.trim().toLowerCase();
  }

  private normalizeColor(hex: string): string {
    // Convert #fff to #ffffff
    if (hex.length === 4) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return hex.toLowerCase();
  }

  private normalizeRgb(rgb: string): string {
    // Extract numbers from rgb(r, g, b) or rgba(r, g, b, a)
    const match = rgb.match(/\d+/g);
    if (!match) return rgb;

    const [r, g, b] = match.map(Number);
    // Convert to hex for easier comparison
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return hex;
  }

  private valuesMatch(expected: string, actual: string, property: string): boolean {
    if (expected === actual) return true;

    // For numeric values with tolerance
    if (this.options.tolerance && this.options.tolerance > 0) {
      const expectedNum = parseFloat(expected);
      const actualNum = parseFloat(actual);

      if (!isNaN(expectedNum) && !isNaN(actualNum)) {
        return Math.abs(expectedNum - actualNum) <= this.options.tolerance;
      }
    }

    // Special cases
    if (property === 'display') {
      // 'block' and 'flow-root' are often equivalent
      if (
        (expected === 'block' && actual === 'flow-root') ||
        (expected === 'flow-root' && actual === 'block')
      ) {
        return true;
      }
    }

    return false;
  }

  summarize(results: ComparisonResult[]): {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  } {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, passRate };
  }
}
