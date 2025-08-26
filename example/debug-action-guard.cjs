const { chromium } = require('playwright-core');

async function debugActionGuardPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 콘솔 메시지 캐치
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[CONSOLE ${type.toUpperCase()}]: ${text}`);
  });
  
  // 페이지 에러 캐치
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
    console.log(`[STACK]: ${error.stack}`);
  });
  
  // 네트워크 요청 모니터링
  page.on('request', request => {
    const url = request.url();
    if (url.includes('action-guard') || url.includes('4000')) {
      console.log(`[REQUEST]: ${request.method()} ${url}`);
    }
  });
  
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      console.log(`[RESPONSE ERROR]: ${status} ${url}`);
    }
  });
  
  try {
    console.log('📍 Navigating to http://localhost:4000/action-guard...');
    await page.goto('http://localhost:4000/action-guard', { waitUntil: 'networkidle' });
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);
    
    // 페이지 URL 확인
    const url = page.url();
    console.log(`🔗 Current URL: ${url}`);
    
    // 페이지 컨텐츠 확인
    const bodyText = await page.locator('body').textContent();
    console.log(`📝 Body content length: ${bodyText.length} characters`);
    
    // 에러 메시지 확인
    const errorElements = await page.locator('[class*="error"], .error, [data-error]').count();
    if (errorElements > 0) {
      console.log(`⚠️  Found ${errorElements} error elements on page`);
      const errorTexts = await page.locator('[class*="error"], .error, [data-error]').allTextContents();
      errorTexts.forEach((text, index) => {
        console.log(`  Error ${index + 1}: ${text.trim()}`);
      });
    }
    
    // React 컴포넌트 에러 확인
    const reactErrors = await page.locator('[data-testid*="error"], [class*="react-error"]').count();
    if (reactErrors > 0) {
      console.log(`⚠️  Found ${reactErrors} React error components`);
    }
    
    // action-guard 특정 요소 확인
    const h1Elements = await page.locator('h1').count();
    const actionGuardButtons = await page.locator('button[class*="action"]').count();
    const navLinks = await page.locator('nav a').count();
    
    console.log(`🔍 Action Guard page elements:`);
    console.log(`  - H1 tags: ${h1Elements}`);
    console.log(`  - Action buttons: ${actionGuardButtons}`);
    console.log(`  - Navigation links: ${navLinks}`);
    
    // 스크린샷 저장
    await page.screenshot({ 
      path: 'action-guard-screenshot.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as action-guard-screenshot.png');
    
    // 페이지 HTML 구조 확인
    const htmlContent = await page.content();
    console.log('📋 Action Guard page HTML structure preview:');
    console.log(htmlContent.substring(0, 2000) + '...');
    
  } catch (error) {
    console.error('❌ Navigation failed:', error.message);
    console.error('❌ Full error:', error);
  }
  
  await browser.close();
}

debugActionGuardPage().catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});