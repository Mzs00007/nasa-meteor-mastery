const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ComponentTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errors = [];
    this.testResults = [];
    this.baseUrl = 'http://localhost:3000';
  }

  async initialize() {
    console.log('🚀 Initializing Puppeteer browser...');
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for headless testing
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.errors.push({
          type: 'console_error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Listen for page errors
    this.page.on('pageerror', error => {
      this.errors.push({
        type: 'page_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
    
    // Listen for failed requests
    this.page.on('requestfailed', request => {
      this.errors.push({
        type: 'request_failed',
        url: request.url(),
        failure: request.failure().errorText,
        timestamp: new Date().toISOString()
      });
    });
  }

  async testComponent(componentName, path, testFunction) {
    console.log(`\n🧪 Testing ${componentName}...`);
    const startTime = Date.now();
    const initialErrorCount = this.errors.length;
    
    try {
      await this.page.goto(`${this.baseUrl}${path}`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for React to load
      await this.page.waitForTimeout(2000);
      
      // Run component-specific tests
      await testFunction();
      
      const endTime = Date.now();
      const newErrors = this.errors.slice(initialErrorCount);
      
      this.testResults.push({
        component: componentName,
        path: path,
        duration: endTime - startTime,
        errors: newErrors,
        status: newErrors.length === 0 ? 'PASS' : 'FAIL'
      });
      
      console.log(`✅ ${componentName} test completed - ${newErrors.length === 0 ? 'PASS' : 'FAIL'}`);
      if (newErrors.length > 0) {
        console.log(`   Found ${newErrors.length} errors`);
      }
      
    } catch (error) {
      this.errors.push({
        type: 'test_error',
        component: componentName,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      this.testResults.push({
        component: componentName,
        path: path,
        duration: Date.now() - startTime,
        errors: [{ type: 'test_error', message: error.message }],
        status: 'FAIL'
      });
      
      console.log(`❌ ${componentName} test failed: ${error.message}`);
    }
  }

  async testSolarSystemPanel() {
    await this.testComponent('Solar System Panel', '/solar-system', async () => {
      // Wait for 3D scene to load
      await this.page.waitForSelector('canvas', { timeout: 10000 });
      
      // Test planet interactions
      const canvas = await this.page.$('canvas');
      if (canvas) {
        // Click on different areas of the canvas to test planet selection
        await canvas.click({ offset: { x: 400, y: 300 } });
        await this.page.waitForTimeout(1000);
        
        await canvas.click({ offset: { x: 600, y: 400 } });
        await this.page.waitForTimeout(1000);
      }
      
      // Test control buttons if they exist
      const buttons = await this.page.$$('button');
      for (let i = 0; i < Math.min(buttons.length, 3); i++) {
        try {
          await buttons[i].click();
          await this.page.waitForTimeout(500);
        } catch (e) {
          // Button might not be clickable, continue
        }
      }
    });
  }

  async testAsteroidImpactSimulation() {
    await this.testComponent('Asteroid Impact Simulation', '/asteroid-impact', async () => {
      // Wait for simulation to load
      await this.page.waitForTimeout(3000);
      
      // Test input fields
      const inputs = await this.page.$$('input[type="number"], input[type="range"]');
      for (const input of inputs) {
        try {
          await input.click();
          await input.type('50');
          await this.page.waitForTimeout(200);
        } catch (e) {
          // Input might not be editable, continue
        }
      }
      
      // Test dropdowns
      const selects = await this.page.$$('select');
      for (const select of selects) {
        try {
          await select.click();
          await this.page.waitForTimeout(200);
        } catch (e) {
          // Select might not be clickable, continue
        }
      }
      
      // Test simulation button
      const simulateButton = await this.page.$('button:contains("Simulate"), button:contains("Run"), button:contains("Start")');
      if (simulateButton) {
        await simulateButton.click();
        await this.page.waitForTimeout(2000);
      }
    });
  }

  async testMissionControl() {
    await this.testComponent('Mission Control Dashboard', '/mission-control', async () => {
      // Wait for dashboard to load
      await this.page.waitForTimeout(3000);
      
      // Test navigation tabs or buttons
      const navButtons = await this.page.$$('button, .tab, .nav-item');
      for (let i = 0; i < Math.min(navButtons.length, 5); i++) {
        try {
          await navButtons[i].click();
          await this.page.waitForTimeout(1000);
        } catch (e) {
          // Button might not be clickable, continue
        }
      }
    });
  }

  async testSpaceWeatherDashboard() {
    await this.testComponent('Space Weather Dashboard', '/space-weather', async () => {
      // Wait for dashboard to load
      await this.page.waitForTimeout(3000);
      
      // Test any interactive elements
      const interactiveElements = await this.page.$$('button, .clickable, .interactive');
      for (let i = 0; i < Math.min(interactiveElements.length, 3); i++) {
        try {
          await interactiveElements[i].click();
          await this.page.waitForTimeout(500);
        } catch (e) {
          // Element might not be clickable, continue
        }
      }
    });
  }

  async testNaturalEventsTracker() {
    await this.testComponent('Natural Events Tracker', '/natural-events', async () => {
      // Wait for tracker to load
      await this.page.waitForTimeout(3000);
      
      // Test filter buttons or controls
      const filterElements = await this.page.$$('button, .filter, .control');
      for (let i = 0; i < Math.min(filterElements.length, 3); i++) {
        try {
          await filterElements[i].click();
          await this.page.waitForTimeout(500);
        } catch (e) {
          // Element might not be clickable, continue
        }
      }
    });
  }

  async testPartnerAPIs() {
    await this.testComponent('Partner APIs Explorer', '/partner-apis', async () => {
      // Wait for API explorer to load
      await this.page.waitForTimeout(3000);
      
      // Test API selection or buttons
      const apiElements = await this.page.$$('button, .api-item, .endpoint');
      for (let i = 0; i < Math.min(apiElements.length, 3); i++) {
        try {
          await apiElements[i].click();
          await this.page.waitForTimeout(1000);
        } catch (e) {
          // Element might not be clickable, continue
        }
      }
    });
  }

  async testHomePage() {
    await this.testComponent('Home Page', '/', async () => {
      // Wait for home page to load
      await this.page.waitForTimeout(2000);
      
      // Test navigation links
      const navLinks = await this.page.$$('a, button');
      for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
        try {
          const href = await navLinks[i].evaluate(el => el.href || el.getAttribute('href'));
          if (href && !href.includes('http') && !href.includes('mailto')) {
            await navLinks[i].click();
            await this.page.waitForTimeout(1000);
            await this.page.goBack();
            await this.page.waitForTimeout(1000);
          }
        } catch (e) {
          // Link might not be clickable, continue
        }
      }
    });
  }

  async runAllTests() {
    console.log('🔍 Starting comprehensive component testing...\n');
    
    await this.initialize();
    
    // Test all major components
    await this.testHomePage();
    await this.testSolarSystemPanel();
    await this.testAsteroidImpactSimulation();
    await this.testMissionControl();
    await this.testSpaceWeatherDashboard();
    await this.testNaturalEventsTracker();
    await this.testPartnerAPIs();
    
    await this.generateReport();
    await this.cleanup();
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASS').length,
        failed: this.testResults.filter(r => r.status === 'FAIL').length,
        totalErrors: this.errors.length
      },
      testResults: this.testResults,
      errors: this.errors
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate human-readable report
    let humanReport = `
🧪 COMPREHENSIVE COMPONENT TEST REPORT
=====================================
Generated: ${report.timestamp}

📊 SUMMARY:
- Total Tests: ${report.summary.totalTests}
- Passed: ${report.summary.passed}
- Failed: ${report.summary.failed}
- Total Errors: ${report.summary.totalErrors}

📋 TEST RESULTS:
`;

    this.testResults.forEach(result => {
      humanReport += `
${result.status === 'PASS' ? '✅' : '❌'} ${result.component}
   Path: ${result.path}
   Duration: ${result.duration}ms
   Errors: ${result.errors.length}
`;
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          humanReport += `     - ${error.type}: ${error.message}\n`;
        });
      }
    });

    if (this.errors.length > 0) {
      humanReport += `\n🚨 DETAILED ERRORS:\n`;
      this.errors.forEach((error, index) => {
        humanReport += `
${index + 1}. ${error.type.toUpperCase()}
   Message: ${error.message}
   Time: ${error.timestamp}
`;
        if (error.stack) {
          humanReport += `   Stack: ${error.stack.substring(0, 200)}...\n`;
        }
      });
    }

    const humanReportPath = path.join(__dirname, 'test-report.txt');
    fs.writeFileSync(humanReportPath, humanReport);
    
    console.log('\n📊 TEST REPORT GENERATED:');
    console.log(`- JSON Report: ${reportPath}`);
    console.log(`- Human Report: ${humanReportPath}`);
    console.log(humanReport);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the tests
async function main() {
  const tester = new ComponentTester();
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    await tester.cleanup();
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = ComponentTester;

// Run if called directly
if (require.main === module) {
  main();
}