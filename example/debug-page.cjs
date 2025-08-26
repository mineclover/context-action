const { chromium } = require('playwright-core');

async function debugPage() {
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
    console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      console.log(`[RESPONSE ERROR]: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('📍 Navigating to http://localhost:4000/...');
    await page.goto('http://localhost:4000/', { waitUntil: 'networkidle' });
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);
    
    // 페이지 URL 확인
    const url = page.url();
    console.log(`🔗 Current URL: ${url}`);
    
    // 페이지 컨텐츠 확인
    const bodyText = await page.locator('body').textContent();
    console.log(`📝 Body content length: ${bodyText.length} characters`);
    
    // 주요 엘리먼트들 확인
    const h1Elements = await page.locator('h1').count();
    const buttonElements = await page.locator('button').count();
    const linkElements = await page.locator('a').count();
    
    console.log(`🔍 Page elements:`);
    console.log(`  - H1 tags: ${h1Elements}`);
    console.log(`  - Buttons: ${buttonElements}`);
    console.log(`  - Links: ${linkElements}`);
    
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
    
    // 스크린샷 저장
    await page.screenshot({ 
      path: 'page-screenshot.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as page-screenshot.png');
    
    // 페이지 소스 일부 출력
    const htmlContent = await page.content();
    console.log('📋 Page HTML structure preview:');
    console.log(htmlContent.substring(0, 1000) + '...');
    
  } catch (error) {
    console.error('❌ Navigation failed:', error.message);
    
    // 연결 실패시 서버 상태 확인
    try {
      const response = await page.request.get('http://localhost:4000/');
      console.log(`Server response status: ${response.status()}`);
    } catch (serverError) {
      console.error('❌ Server not responding:', serverError.message);
    }
  }
  
  await browser.close();
}

debugPage().catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});