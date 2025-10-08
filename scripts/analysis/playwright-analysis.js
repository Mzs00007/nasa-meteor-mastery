const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');

async function runPlaywrightAnalysis() {
    console.log('🎭 PLAYWRIGHT CROSS-BROWSER ANALYSIS');
    console.log('=====================================\n');

    const browsers = [
        { name: 'Chromium', browser: chromium },
        { name: 'Firefox', browser: firefox },
        { name: 'WebKit', browser: webkit }
    ];

    const results = {
        browsers: {},
        accessibility: {},
        performance: {},
        interactions: {},
        visual: {},
        errors: []
    };

    for (const { name, browser } of browsers) {
        console.log(`🌐 Testing with ${name}...`);
        
        try {
            const browserInstance = await browser.launch({ headless: true });
            const context = await browserInstance.newContext({
                viewport: { width: 1920, height: 1080 }
            });
            const page = await context.newPage();

            // Track console errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            // Navigate to page
            const startTime = Date.now();
            await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
            const loadTime = Date.now() - startTime;

            // Browser-specific analysis
            const browserResults = {
                loadTime,
                consoleErrors: consoleErrors.length,
                elements: await page.locator('*').count(),
                buttons: await page.locator('button').count(),
                inputs: await page.locator('input').count(),
                selects: await page.locator('select').count()
            };

            // Test interactive elements
            const interactionTests = await testInteractions(page);
            
            // Accessibility testing
            const accessibilityResults = await testAccessibility(page);
            
            // Visual testing
            const visualResults = await testVisualElements(page);

            results.browsers[name] = {
                ...browserResults,
                interactions: interactionTests,
                accessibility: accessibilityResults,
                visual: visualResults
            };

            console.log(`✅ ${name} analysis complete`);
            await browserInstance.close();

        } catch (error) {
            console.log(`❌ ${name} analysis failed: ${error.message}`);
            results.errors.push(`${name}: ${error.message}`);
        }
    }

    // Save results
    fs.writeFileSync('playwright-analysis-results.json', JSON.stringify(results, null, 2));
    console.log('\n📊 PLAYWRIGHT ANALYSIS COMPLETE');
    console.log('Results saved to playwright-analysis-results.json');
    
    return results;
}

async function testInteractions(page) {
    console.log('  🎯 Testing interactions...');
    
    const results = {
        clickableElements: 0,
        workingButtons: 0,
        workingSelects: 0,
        formValidation: false,
        keyboardNavigation: false
    };

    try {
        // Test clickable elements
        const buttons = await page.locator('button').all();
        results.clickableElements = buttons.length;

        // Test button functionality
        for (const button of buttons.slice(0, 5)) { // Test first 5 buttons
            try {
                await button.click({ timeout: 1000 });
                results.workingButtons++;
            } catch (e) {
                // Button might not be clickable or visible
            }
        }

        // Test select dropdowns
        const selects = await page.locator('select').all();
        for (const select of selects) {
            try {
                const options = await select.locator('option').all();
                if (options.length > 1) {
                    await select.selectOption({ index: 1 });
                    results.workingSelects++;
                }
            } catch (e) {
                // Select might not be functional
            }
        }

        // Test keyboard navigation
        try {
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            const focusedElement = await page.evaluate(() => document.activeElement.tagName);
            results.keyboardNavigation = focusedElement !== 'BODY';
        } catch (e) {
            results.keyboardNavigation = false;
        }

    } catch (error) {
        console.log(`    ⚠️ Interaction testing error: ${error.message}`);
    }

    return results;
}

async function testAccessibility(page) {
    console.log('  ♿ Testing accessibility...');
    
    const results = {
        imagesWithoutAlt: 0,
        buttonsWithoutLabels: 0,
        inputsWithoutLabels: 0,
        headingStructure: [],
        ariaElements: 0,
        focusableElements: 0
    };

    try {
        // Images without alt text
        const images = await page.locator('img').all();
        for (const img of images) {
            const alt = await img.getAttribute('alt');
            if (!alt || alt.trim() === '') {
                results.imagesWithoutAlt++;
            }
        }

        // Buttons without accessible names
        const buttons = await page.locator('button').all();
        for (const button of buttons) {
            const text = await button.textContent();
            const ariaLabel = await button.getAttribute('aria-label');
            if ((!text || text.trim() === '') && !ariaLabel) {
                results.buttonsWithoutLabels++;
            }
        }

        // Inputs without labels
        const inputs = await page.locator('input').all();
        for (const input of inputs) {
            const id = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
            if (!hasLabel && !ariaLabel) {
                results.inputsWithoutLabels++;
            }
        }

        // Heading structure
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        for (const heading of headings) {
            const tagName = await heading.evaluate(el => el.tagName);
            const text = await heading.textContent();
            results.headingStructure.push({ level: tagName, text: text?.trim() });
        }

        // ARIA elements
        results.ariaElements = await page.locator('[aria-label], [aria-labelledby], [role]').count();

        // Focusable elements
        results.focusableElements = await page.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])').count();

    } catch (error) {
        console.log(`    ⚠️ Accessibility testing error: ${error.message}`);
    }

    return results;
}

async function testVisualElements(page) {
    console.log('  👁️ Testing visual elements...');
    
    const results = {
        colorContrast: 'unknown',
        responsiveImages: 0,
        animations: 0,
        loadingStates: 0,
        errorStates: 0
    };

    try {
        // Check for loading indicators
        results.loadingStates = await page.locator('[class*="loading"], [class*="spinner"], [class*="loader"]').count();

        // Check for error states
        results.errorStates = await page.locator('[class*="error"], [class*="warning"], .alert-danger').count();

        // Check for animations
        results.animations = await page.locator('[class*="animate"], [class*="transition"], [style*="animation"]').count();

        // Check responsive images
        const images = await page.locator('img').all();
        for (const img of images) {
            const srcset = await img.getAttribute('srcset');
            if (srcset) {
                results.responsiveImages++;
            }
        }

    } catch (error) {
        console.log(`    ⚠️ Visual testing error: ${error.message}`);
    }

    return results;
}

// Run the analysis
runPlaywrightAnalysis().catch(console.error);