/**
 * Playwright-based browser runner for extracting actual styles
 */
import { chromium, type Browser, type Page } from 'playwright';

export interface BrowserOptions {
  headless?: boolean;
  timeout?: number;
}

export class BrowserRunner {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async launch(options: BrowserOptions = {}): Promise<void> {
    this.browser = await chromium.launch({
      headless: options.headless ?? true,
    });

    this.page = await this.browser.newPage();

    if (options.timeout) {
      this.page.setDefaultTimeout(options.timeout);
    }
  }

  async navigateTo(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    await this.page.goto(url, { waitUntil: 'networkidle' });

    // Wait a bit for any dynamic styles to apply
    await this.page.waitForTimeout(500);
  }

  async extractStylesForElement(testId: string): Promise<Record<string, string> | null> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    const element = await this.page.$(`[data-style-test="${testId}"]`);

    if (!element) {
      return null;
    }

    // Extract computed styles
    const styles = await element.evaluate((el) => {
      const computed = window.getComputedStyle(el);

      // Extract important style properties
      return {
        position: computed.position,
        display: computed.display,
        width: computed.width,
        height: computed.height,
        marginTop: computed.marginTop,
        marginRight: computed.marginRight,
        marginBottom: computed.marginBottom,
        marginLeft: computed.marginLeft,
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft,
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderWidth: computed.borderWidth,
        borderColor: computed.borderColor,
        zIndex: computed.zIndex,
        left: computed.left,
        right: computed.right,
        top: computed.top,
        bottom: computed.bottom,
        overflow: computed.overflow,
        overflowX: computed.overflowX,
        overflowY: computed.overflowY,
        minWidth: computed.minWidth,
        maxWidth: computed.maxWidth,
        flexDirection: computed.flexDirection,
        flex: computed.flex,
      };
    });

    return styles;
  }

  async getAllTestIds(): Promise<string[]> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    const testIds = await this.page.$$eval('[data-style-test]', (elements) => {
      return elements.map(el => el.getAttribute('data-style-test')).filter(Boolean) as string[];
    });

    return testIds;
  }

  async extractAllStyles(): Promise<Map<string, Record<string, string>>> {
    const testIds = await this.getAllTestIds();
    const allStyles = new Map<string, Record<string, string>>();

    for (const testId of testIds) {
      const styles = await this.extractStylesForElement(testId);
      if (styles) {
        allStyles.set(testId, styles);
      }
    }

    return allStyles;
  }

  async screenshot(path: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    await this.page.screenshot({ path, fullPage: true });
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
