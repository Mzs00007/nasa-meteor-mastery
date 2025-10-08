const puppeteer = require('puppeteer');
const fs = require('fs');

async function recheckSimulationPage() {
    console.log('🔄 RECHECKING SIMULATION PAGE');
    console.log('=============================\n');

    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        
        // Track console messages and errors
        const consoleMessages = [];
        const jsErrors = [];
        
        page.on('console', msg => {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            });
        });
        
        page.on('pageerror', error => {
            jsErrors.push({
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Navigate and wait for page to load
        console.log('🌐 Loading page...');
        const startTime = Date.now();
        await page.goto('http://localhost:3000', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        const loadTime = Date.now() - startTime;

        // Wait a bit more for dynamic content
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('📊 CURRENT PAGE STATE ANALYSIS');
        console.log('===============================\n');

        // Basic page info
        const title = await page.title();
        const url = page.url();
        console.log(`📄 Title: ${title}`);
        console.log(`🔗 URL: ${url}`);
        console.log(`⏱️ Load Time: ${loadTime}ms\n`);

        // Element counts
        const elementCounts = await page.evaluate(() => {
            return {
                totalElements: document.querySelectorAll('*').length,
                buttons: document.querySelectorAll('button').length,
                inputs: document.querySelectorAll('input').length,
                selects: document.querySelectorAll('select').length,
                sliders: document.querySelectorAll('input[type="range"]').length,
                forms: document.querySelectorAll('form').length,
                images: document.querySelectorAll('img').length,
                links: document.querySelectorAll('a').length,
                divs: document.querySelectorAll('div').length,
                headers: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length
            };
        });

        console.log('🧮 ELEMENT COUNTS:');
        Object.entries(elementCounts).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });
        console.log('');

        // Check for specific simulation elements
        const simulationElements = await page.evaluate(() => {
            const results = {
                presetButtons: [],
                parameterControls: [],
                simulationDisplay: null,
                nasaDataSection: null,
                errorMessages: [],
                loadingIndicators: []
            };

            // Look for preset buttons
            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
                const text = btn.textContent?.toLowerCase() || '';
                if (text.includes('chelyabinsk') || text.includes('tunguska') || text.includes('chicxulub')) {
                    results.presetButtons.push(text.trim());
                }
            });

            // Look for parameter controls
            const inputs = document.querySelectorAll('input, select');
            inputs.forEach(input => {
                const label = input.getAttribute('aria-label') || input.getAttribute('placeholder') || '';
                const id = input.getAttribute('id') || '';
                if (label.toLowerCase().includes('diameter') || 
                    label.toLowerCase().includes('velocity') || 
                    label.toLowerCase().includes('angle') ||
                    id.toLowerCase().includes('diameter') ||
                    id.toLowerCase().includes('velocity') ||
                    id.toLowerCase().includes('angle')) {
                    results.parameterControls.push({
                        type: input.type || input.tagName.toLowerCase(),
                        label: label,
                        id: id,
                        value: input.value
                    });
                }
            });

            // Look for simulation display area
            const displayElements = document.querySelectorAll('[class*="simulation"], [id*="simulation"], [class*="display"], [id*="display"]');
            if (displayElements.length > 0) {
                results.simulationDisplay = {
                    count: displayElements.length,
                    types: Array.from(displayElements).map(el => el.tagName.toLowerCase())
                };
            }

            // Look for NASA data section
            const nasaElements = document.querySelectorAll('[class*="nasa"], [id*="nasa"], [class*="data"], [id*="data"]');
            if (nasaElements.length > 0) {
                results.nasaDataSection = {
                    count: nasaElements.length,
                    types: Array.from(nasaElements).map(el => el.tagName.toLowerCase())
                };
            }

            // Look for error messages
            const errorElements = document.querySelectorAll('[class*="error"], [class*="warning"], .alert-danger, .text-red');
            errorElements.forEach(el => {
                if (el.textContent?.trim()) {
                    results.errorMessages.push(el.textContent.trim());
                }
            });

            // Look for loading indicators
            const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="loader"]');
            results.loadingIndicators = Array.from(loadingElements).map(el => ({
                class: el.className,
                visible: el.offsetParent !== null
            }));

            return results;
        });

        console.log('🎛️ SIMULATION ELEMENTS:');
        console.log(`   Preset Buttons: ${simulationElements.presetButtons.length}`);
        simulationElements.presetButtons.forEach(btn => console.log(`      • ${btn}`));
        
        console.log(`   Parameter Controls: ${simulationElements.parameterControls.length}`);
        simulationElements.parameterControls.forEach(ctrl => {
            console.log(`      • ${ctrl.type}: ${ctrl.label || ctrl.id}`);
        });
        
        console.log(`   Simulation Display: ${simulationElements.simulationDisplay ? 'Found' : 'Not Found'}`);
        if (simulationElements.simulationDisplay) {
            console.log(`      Elements: ${simulationElements.simulationDisplay.count}`);
        }
        
        console.log(`   NASA Data Section: ${simulationElements.nasaDataSection ? 'Found' : 'Not Found'}`);
        if (simulationElements.nasaDataSection) {
            console.log(`      Elements: ${simulationElements.nasaDataSection.count}`);
        }
        
        console.log(`   Error Messages: ${simulationElements.errorMessages.length}`);
        simulationElements.errorMessages.forEach(msg => console.log(`      • ${msg}`));
        
        console.log(`   Loading Indicators: ${simulationElements.loadingIndicators.length}`);
        console.log('');

        // Check accessibility
        const accessibilityCheck = await page.evaluate(() => {
            const results = {
                missingAltImages: 0,
                missingLabels: 0,
                missingHeadings: false,
                focusableElements: 0,
                ariaElements: 0
            };

            // Images without alt text
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (!img.getAttribute('alt') || img.getAttribute('alt').trim() === '') {
                    results.missingAltImages++;
                }
            });

            // Form elements without labels
            const formElements = document.querySelectorAll('input, select, textarea');
            formElements.forEach(element => {
                const id = element.getAttribute('id');
                const ariaLabel = element.getAttribute('aria-label');
                const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
                if (!hasLabel && !ariaLabel) {
                    results.missingLabels++;
                }
            });

            // Check for heading structure
            const h1 = document.querySelector('h1');
            results.missingHeadings = !h1;

            // Count focusable elements
            results.focusableElements = document.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])').length;

            // Count ARIA elements
            results.ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]').length;

            return results;
        });

        console.log('♿ ACCESSIBILITY CHECK:');
        console.log(`   Images without alt text: ${accessibilityCheck.missingAltImages}`);
        console.log(`   Form elements without labels: ${accessibilityCheck.missingLabels}`);
        console.log(`   Missing main heading: ${accessibilityCheck.missingHeadings ? 'Yes' : 'No'}`);
        console.log(`   Focusable elements: ${accessibilityCheck.focusableElements}`);
        console.log(`   ARIA elements: ${accessibilityCheck.ariaElements}`);
        console.log('');

        // Console messages analysis
        console.log('📝 CONSOLE MESSAGES:');
        const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
        const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');
        const infoMessages = consoleMessages.filter(msg => msg.type === 'info' || msg.type === 'log');

        console.log(`   Errors: ${errorMessages.length}`);
        errorMessages.slice(0, 5).forEach(msg => console.log(`      • ${msg.text}`));
        
        console.log(`   Warnings: ${warningMessages.length}`);
        warningMessages.slice(0, 3).forEach(msg => console.log(`      • ${msg.text}`));
        
        console.log(`   Info/Log: ${infoMessages.length}`);
        console.log('');

        // JavaScript errors
        console.log('🚨 JAVASCRIPT ERRORS:');
        console.log(`   Total JS Errors: ${jsErrors.length}`);
        jsErrors.slice(0, 3).forEach(error => {
            console.log(`      • ${error.message}`);
        });
        console.log('');

        // Compile recheck results
        const recheckResults = {
            timestamp: new Date().toISOString(),
            pageInfo: { title, url, loadTime },
            elementCounts,
            simulationElements,
            accessibility: accessibilityCheck,
            console: {
                errors: errorMessages.length,
                warnings: warningMessages.length,
                info: infoMessages.length,
                recentErrors: errorMessages.slice(0, 10)
            },
            jsErrors: jsErrors.length,
            status: {
                pageLoaded: true,
                hasInteractiveElements: elementCounts.buttons > 0 || elementCounts.inputs > 0,
                hasSimulationFeatures: simulationElements.presetButtons.length > 0 || simulationElements.parameterControls.length > 0,
                hasAccessibilityIssues: accessibilityCheck.missingLabels > 0 || accessibilityCheck.missingAltImages > 0,
                hasErrors: jsErrors.length > 0 || errorMessages.length > 0
            }
        };

        // Save results
        fs.writeFileSync('recheck-analysis-results.json', JSON.stringify(recheckResults, null, 2));

        console.log('✅ RECHECK COMPLETE');
        console.log('===================');
        console.log(`📄 Results saved to recheck-analysis-results.json`);
        console.log(`🎯 Page Status: ${recheckResults.status.pageLoaded ? 'Loaded' : 'Failed'}`);
        console.log(`🎛️ Interactive Elements: ${recheckResults.status.hasInteractiveElements ? 'Present' : 'Missing'}`);
        console.log(`🚀 Simulation Features: ${recheckResults.status.hasSimulationFeatures ? 'Present' : 'Missing'}`);
        console.log(`♿ Accessibility Issues: ${recheckResults.status.hasAccessibilityIssues ? 'Found' : 'None'}`);
        console.log(`🚨 Errors: ${recheckResults.status.hasErrors ? 'Found' : 'None'}`);

        return recheckResults;

    } catch (error) {
        console.error('❌ Recheck failed:', error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the recheck
recheckSimulationPage().catch(console.error);