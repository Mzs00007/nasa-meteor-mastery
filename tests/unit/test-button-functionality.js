const puppeteer = require('puppeteer');

async function testButtonFunctionality() {
  console.log('🔍 Testing Button and 2D Map Functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages and errors
  const consoleMessages = [];
  const jsErrors = [];
  
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error('Page Error:', error.message);
  });
  
  try {
    console.log('📍 Navigating to simulation page...');
    await page.goto('http://localhost:3000/simulation', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    console.log('🔍 Testing button functionality...');
    
    // Test 1: Check if buttons exist
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        disabled: btn.disabled,
        hasClickHandler: btn.onclick !== null || btn.addEventListener !== undefined
      }))
    );
    
    console.log(`Found ${buttons.length} buttons:`, buttons);
    
    // Test 2: Check view mode buttons specifically
    const viewModeButtons = await page.$$eval('[data-testid*="view"], button:contains("2D"), button:contains("Data"), button:contains("Comparison")', 
      buttons => buttons.map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        disabled: btn.disabled
      }))
    ).catch(() => []);
    
    console.log('View mode buttons:', viewModeButtons);
    
    // Test 3: Try clicking preset buttons
    console.log('🎯 Testing preset button clicks...');
    const presetButtons = await page.$$('button[class*="glass-button"]');
    
    for (let i = 0; i < Math.min(presetButtons.length, 3); i++) {
      try {
        const buttonText = await presetButtons[i].evaluate(el => el.textContent.trim());
        console.log(`Clicking button: ${buttonText}`);
        
        await presetButtons[i].click();
        await page.waitForTimeout(1000);
        
        console.log(`✅ Successfully clicked: ${buttonText}`);
      } catch (error) {
        console.error(`❌ Failed to click button ${i}:`, error.message);
      }
    }
    
    // Test 4: Check 2D map canvas
    console.log('🗺️ Testing 2D map functionality...');
    const canvas = await page.$('canvas');
    
    if (canvas) {
      const canvasInfo = await canvas.evaluate(el => ({
        width: el.width,
        height: el.height,
        style: el.style.cssText,
        hasEventListeners: el.onmousedown !== null || el.onclick !== null
      }));
      
      console.log('Canvas found:', canvasInfo);
      
      // Test canvas interaction
      try {
        const canvasBox = await canvas.boundingBox();
        if (canvasBox) {
          console.log('Testing canvas click...');
          await page.mouse.click(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
          await page.waitForTimeout(1000);
          console.log('✅ Canvas click test completed');
        }
      } catch (error) {
        console.error('❌ Canvas click test failed:', error.message);
      }
    } else {
      console.log('❌ No canvas element found');
    }
    
    // Test 5: Check for React component errors
    console.log('⚛️ Checking React component state...');
    const reactErrors = await page.evaluate(() => {
      const errors = [];
      
      // Check if React DevTools are available
      if (window.React) {
        console.log('React is loaded');
      } else {
        errors.push('React not found in window object');
      }
      
      // Check for common React error patterns
      const errorElements = document.querySelectorAll('[data-reactroot] *');
      errorElements.forEach(el => {
        if (el.textContent.includes('Error') || el.textContent.includes('Failed')) {
          errors.push(`Potential error in element: ${el.textContent.substring(0, 100)}`);
        }
      });
      
      return errors;
    });
    
    console.log('React component check:', reactErrors);
    
    // Test 6: Check simulation context
    console.log('🎮 Testing simulation context...');
    const simulationState = await page.evaluate(() => {
      // Try to access simulation state through window or global variables
      return {
        hasSimulationContext: window.simulationContext !== undefined,
        hasAsteroidParams: window.asteroidParams !== undefined,
        localStorageKeys: Object.keys(localStorage),
        sessionStorageKeys: Object.keys(sessionStorage)
      };
    });
    
    console.log('Simulation state:', simulationState);
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total buttons found: ${buttons.length}`);
    console.log(`Console messages: ${consoleMessages.length}`);
    console.log(`JavaScript errors: ${jsErrors.length}`);
    console.log(`Canvas found: ${canvas ? 'Yes' : 'No'}`);
    
    if (jsErrors.length > 0) {
      console.log('\n❌ JavaScript Errors:');
      jsErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }
    
    if (consoleMessages.filter(msg => msg.type === 'error').length > 0) {
      console.log('\n❌ Console Errors:');
      consoleMessages.filter(msg => msg.type === 'error').forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.text}`);
      });
    }
    
    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      buttons,
      viewModeButtons,
      canvasFound: !!canvas,
      consoleMessages,
      jsErrors,
      reactErrors,
      simulationState
    };
    
    require('fs').writeFileSync('button-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed results saved to button-test-results.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testButtonFunctionality().catch(console.error);