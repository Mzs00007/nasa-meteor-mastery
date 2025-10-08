const puppeteer = require('puppeteer');

async function testSimulationFunctionality() {
  console.log('🧪 Testing Simulation Page Functionality...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && !text.includes('reconnection') && !text.includes('ERR_CONNECTION_REFUSED')) {
        console.log(`❌ Console Error: ${text}`);
      } else if (type === 'log' && text.includes('Backend API unavailable')) {
        console.log(`✅ Expected: ${text}`);
      }
    });
    
    // Navigate to simulation page
    console.log('📍 Navigating to simulation page...');
    await page.goto('http://localhost:3000/simulation', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if run simulation button exists and is clickable
    console.log('🔍 Checking for Run Simulation button...');
    const runButton = await page.$('button[title*="Start asteroid impact simulation"]');
    
    if (runButton) {
      console.log('✅ Run Simulation button found');
      
      // Check if button is enabled
      const isDisabled = await page.evaluate(btn => btn.disabled, runButton);
      console.log(`Button disabled: ${isDisabled}`);
      
      if (!isDisabled) {
        console.log('🖱️ Clicking Run Simulation button...');
        await runButton.click();
        
        // Wait for simulation to process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Button click successful');
      }
    } else {
      console.log('❌ Run Simulation button not found');
    }
    
    // Check for 2D map canvas
    console.log('🗺️ Checking for 2D impact map...');
    const canvas = await page.$('canvas');
    
    if (canvas) {
      console.log('✅ 2D map canvas found');
      
      // Check canvas dimensions
      const canvasInfo = await page.evaluate(canvas => ({
        width: canvas.width,
        height: canvas.height,
        visible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0
      }), canvas);
      
      console.log(`Canvas: ${canvasInfo.width}x${canvasInfo.height}, visible: ${canvasInfo.visible}`);
    } else {
      console.log('❌ 2D map canvas not found');
    }
    
    // Check for any error messages on page
    console.log('🔍 Checking for error messages...');
    const errorElements = await page.$$('.error, .text-red-400, .text-red-500');
    
    if (errorElements.length > 0) {
      console.log(`⚠️ Found ${errorElements.length} error elements on page`);
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await page.evaluate(el => el.textContent, errorElements[i]);
        console.log(`   Error ${i + 1}: ${errorText}`);
      }
    } else {
      console.log('✅ No error messages found on page');
    }
    
    console.log('\n✅ Simulation functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testSimulationFunctionality().catch(console.error);