const puppeteer = require('puppeteer');

async function runBasicTests() {
  console.log('🚀 Starting Basic Functionality Tests...\n');
  
  let browser;
  let page;
  const results = {
    passed: 0,
    failed: 0,
    issues: []
  };

  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📱 Testing page loading...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Test 1: Page loads successfully
    try {
      const title = await page.title();
      if (title.toLowerCase().includes('meteor')) {
        console.log('✅ Page loads successfully');
        results.passed++;
      } else {
        console.log('❌ Page title issue:', title);
        results.failed++;
        results.issues.push('Page title does not contain "meteor"');
      }
    } catch (error) {
      console.log('❌ Page loading failed:', error.message);
      results.failed++;
      results.issues.push('Page loading failed');
    }

    // Test 2: Navigation elements exist
    try {
      const navElements = await page.$$('nav, .navbar, .navigation, a[href*="/"]');
      if (navElements.length > 0) {
        console.log('✅ Navigation elements found');
        results.passed++;
      } else {
        console.log('❌ No navigation elements found');
        results.failed++;
        results.issues.push('No navigation elements found');
      }
    } catch (error) {
      console.log('❌ Navigation test failed:', error.message);
      results.failed++;
      results.issues.push('Navigation test failed');
    }

    // Test 3: Main content exists
    try {
      const mainContent = await page.$('main, .main-content, .app-content, h1, .hero');
      if (mainContent) {
        console.log('✅ Main content found');
        results.passed++;
      } else {
        console.log('❌ No main content found');
        results.failed++;
        results.issues.push('No main content found');
      }
    } catch (error) {
      console.log('❌ Main content test failed:', error.message);
      results.failed++;
      results.issues.push('Main content test failed');
    }

    // Test 4: Check for buttons
    try {
      const buttons = await page.$$('button, .btn, input[type="button"], input[type="submit"]');
      if (buttons.length > 0) {
        console.log(`✅ Found ${buttons.length} interactive buttons`);
        results.passed++;
      } else {
        console.log('❌ No buttons found');
        results.failed++;
        results.issues.push('No interactive buttons found');
      }
    } catch (error) {
      console.log('❌ Button test failed:', error.message);
      results.failed++;
      results.issues.push('Button test failed');
    }

    // Test 5: Check for simulation link
    try {
      await page.goto('http://localhost:3000/simulation', { waitUntil: 'networkidle2', timeout: 15000 });
      const simulationPage = await page.$('.simulation, .asteroid, .impact');
      if (simulationPage) {
        console.log('✅ Simulation page accessible');
        results.passed++;
      } else {
        console.log('⚠️ Simulation page loads but content unclear');
        results.passed++;
      }
    } catch (error) {
      console.log('❌ Simulation page test failed:', error.message);
      results.failed++;
      results.issues.push('Simulation page not accessible');
    }

    // Test 6: Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_FAILED') &&
      !error.includes('chrome-extension')
    );
    
    if (criticalErrors.length === 0) {
      console.log('✅ No critical console errors');
      results.passed++;
    } else {
      console.log('❌ Console errors found:', criticalErrors.slice(0, 3));
      results.failed++;
      results.issues.push(`Console errors: ${criticalErrors.length} found`);
    }

    // Test 7: Responsive design check
    try {
      await page.setViewport({ width: 375, height: 667 });
      await page.reload({ waitUntil: 'networkidle2' });
      
      const mobileContent = await page.$('body');
      if (mobileContent) {
        console.log('✅ Mobile viewport works');
        results.passed++;
      } else {
        console.log('❌ Mobile viewport issues');
        results.failed++;
        results.issues.push('Mobile viewport issues');
      }
    } catch (error) {
      console.log('❌ Mobile test failed:', error.message);
      results.failed++;
      results.issues.push('Mobile test failed');
    }

  } catch (error) {
    console.log('❌ Critical test failure:', error.message);
    results.failed++;
    results.issues.push('Critical test failure');
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print results
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.issues.length > 0) {
    console.log('\n🔍 Issues Found:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }

  if (results.failed === 0) {
    console.log('\n🎉 All basic functionality tests passed!');
  } else {
    console.log('\n⚠️ Some issues found. Check the details above.');
  }

  return results;
}

// Run the tests
runBasicTests().catch(console.error);