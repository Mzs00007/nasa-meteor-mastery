const puppeteer = require('puppeteer');

async function comprehensiveSimulationAnalysis() {
    console.log('🔬 COMPREHENSIVE SIMULATION PAGE ANALYSIS');
    console.log('=========================================\n');

    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
        slowMo: 50
    });

    const analysisResults = {
        issues: [],
        improvements: [],
        enhancements: [],
        performance: {},
        accessibility: {},
        usability: {}
    };

    try {
        const page = await browser.newPage();
        
        // Track errors and console messages
        const errors = [];
        const warnings = [];
        
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
            if (msg.type() === 'warning') warnings.push(msg.text());
        });

        console.log('🌐 Loading simulation page...');
        const startTime = Date.now();
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        const loadTime = Date.now() - startTime;
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 1. STRUCTURE AND LAYOUT ANALYSIS
        console.log('\n🏗️ STRUCTURE & LAYOUT ANALYSIS');
        console.log('==============================');
        
        const layoutAnalysis = await page.evaluate(() => {
            const results = {
                hasHeader: !!document.querySelector('header, .header, [role="banner"]'),
                hasNavigation: !!document.querySelector('nav, .nav, [role="navigation"]'),
                hasMain: !!document.querySelector('main, .main, [role="main"]'),
                hasFooter: !!document.querySelector('footer, .footer, [role="contentinfo"]'),
                totalElements: document.querySelectorAll('*').length,
                interactiveElements: document.querySelectorAll('button, input, select, textarea, a[href]').length,
                headingStructure: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
                    level: h.tagName,
                    text: h.textContent.trim().substring(0, 50)
                }))
            };
            return results;
        });

        console.log(`📋 Layout Structure:`);
        console.log(`   Header: ${layoutAnalysis.hasHeader ? '✅' : '❌'}`);
        console.log(`   Navigation: ${layoutAnalysis.hasNavigation ? '✅' : '❌'}`);
        console.log(`   Main Content: ${layoutAnalysis.hasMain ? '✅' : '❌'}`);
        console.log(`   Footer: ${layoutAnalysis.hasFooter ? '✅' : '❌'}`);
        console.log(`   Total Elements: ${layoutAnalysis.totalElements}`);
        console.log(`   Interactive Elements: ${layoutAnalysis.interactiveElements}`);

        if (!layoutAnalysis.hasHeader) analysisResults.issues.push('Missing semantic header element');
        if (!layoutAnalysis.hasMain) analysisResults.issues.push('Missing semantic main element');
        if (layoutAnalysis.headingStructure.length === 0) analysisResults.issues.push('No heading structure found');

        // 2. SIMULATION CONTROLS ANALYSIS
        console.log('\n🎛️ SIMULATION CONTROLS ANALYSIS');
        console.log('===============================');
        
        const controlsAnalysis = await page.evaluate(() => {
            const sliders = document.querySelectorAll('input[type="range"]');
            const selects = document.querySelectorAll('select');
            const numberInputs = document.querySelectorAll('input[type="number"]');
            const buttons = document.querySelectorAll('button');
            
            return {
                sliders: Array.from(sliders).map(slider => ({
                    id: slider.id || 'no-id',
                    min: slider.min,
                    max: slider.max,
                    value: slider.value,
                    hasLabel: !!slider.labels?.length || !!document.querySelector(`label[for="${slider.id}"]`)
                })),
                selects: Array.from(selects).map(select => ({
                    id: select.id || 'no-id',
                    optionsCount: select.options.length,
                    hasLabel: !!select.labels?.length || !!document.querySelector(`label[for="${select.id}"]`)
                })),
                numberInputs: Array.from(numberInputs).map(input => ({
                    id: input.id || 'no-id',
                    min: input.min,
                    max: input.max,
                    value: input.value,
                    hasLabel: !!input.labels?.length || !!document.querySelector(`label[for="${input.id}"]`)
                })),
                buttons: Array.from(buttons).map(btn => ({
                    text: btn.textContent.trim().substring(0, 30),
                    disabled: btn.disabled,
                    type: btn.type,
                    hasAriaLabel: !!btn.getAttribute('aria-label')
                }))
            };
        });

        console.log(`🎚️ Sliders: ${controlsAnalysis.sliders.length}`);
        controlsAnalysis.sliders.forEach((slider, i) => {
            console.log(`   ${i + 1}. ID: ${slider.id}, Range: ${slider.min}-${slider.max}, Label: ${slider.hasLabel ? '✅' : '❌'}`);
            if (!slider.hasLabel) analysisResults.issues.push(`Slider ${slider.id} missing label`);
        });

        console.log(`📋 Dropdowns: ${controlsAnalysis.selects.length}`);
        controlsAnalysis.selects.forEach((select, i) => {
            console.log(`   ${i + 1}. ID: ${select.id}, Options: ${select.optionsCount}, Label: ${select.hasLabel ? '✅' : '❌'}`);
            if (!select.hasLabel) analysisResults.issues.push(`Select ${select.id} missing label`);
        });

        console.log(`🔢 Number Inputs: ${controlsAnalysis.numberInputs.length}`);
        console.log(`🔘 Buttons: ${controlsAnalysis.buttons.length}`);

        // 3. PRESET BUTTONS TESTING
        console.log('\n💥 PRESET BUTTONS TESTING');
        console.log('=========================');
        
        const presetButtons = await page.$$('button');
        const presetTests = [];
        
        for (let i = 0; i < Math.min(presetButtons.length, 5); i++) {
            const button = presetButtons[i];
            const text = await page.evaluate(el => el.textContent.trim(), button);
            
            if (text.includes('Chelyabinsk') || text.includes('Tunguska') || text.includes('Chicxulub')) {
                try {
                    console.log(`🧪 Testing preset: ${text}`);
                    await button.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Check if values changed
                    const valuesChanged = await page.evaluate(() => {
                        const sliders = document.querySelectorAll('input[type="range"]');
                        return Array.from(sliders).some(slider => slider.value !== slider.defaultValue);
                    });
                    
                    presetTests.push({
                        name: text,
                        working: valuesChanged,
                        status: valuesChanged ? '✅' : '❌'
                    });
                    
                    console.log(`   ${valuesChanged ? '✅' : '❌'} Preset ${text} ${valuesChanged ? 'working' : 'not working'}`);
                    
                } catch (error) {
                    presetTests.push({ name: text, working: false, status: '❌', error: error.message });
                    console.log(`   ❌ Error testing ${text}: ${error.message}`);
                }
            }
        }

        // 4. RESPONSIVE DESIGN TESTING
        console.log('\n📱 RESPONSIVE DESIGN TESTING');
        console.log('============================');
        
        const viewports = [
            { name: 'Mobile', width: 375, height: 667 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Desktop', width: 1920, height: 1080 }
        ];

        for (const viewport of viewports) {
            await page.setViewport(viewport);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const responsiveIssues = await page.evaluate(() => {
                const issues = [];
                
                // Check for horizontal scrolling
                if (document.body.scrollWidth > window.innerWidth) {
                    issues.push('Horizontal scrolling detected');
                }
                
                // Check for overlapping elements
                const buttons = document.querySelectorAll('button');
                if (buttons.length > 0) {
                    const firstButton = buttons[0].getBoundingClientRect();
                    if (firstButton.width < 44 || firstButton.height < 44) {
                        issues.push('Touch targets too small (< 44px)');
                    }
                }
                
                return issues;
            });
            
            console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height}): ${responsiveIssues.length === 0 ? '✅' : '❌'}`);
            responsiveIssues.forEach(issue => {
                console.log(`   ⚠️ ${issue}`);
                analysisResults.issues.push(`${viewport.name}: ${issue}`);
            });
        }

        // Reset to desktop
        await page.setViewport({ width: 1920, height: 1080 });

        // 5. PERFORMANCE ANALYSIS
        console.log('\n⚡ PERFORMANCE ANALYSIS');
        console.log('======================');
        
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
            };
        });

        console.log(`⏱️ Load Time: ${loadTime}ms`);
        console.log(`📄 DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
        console.log(`🎨 First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
        console.log(`🖼️ First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);

        analysisResults.performance = { loadTime, ...performanceMetrics };

        if (loadTime > 3000) analysisResults.issues.push('Page load time exceeds 3 seconds');
        if (performanceMetrics.firstContentfulPaint > 2500) analysisResults.issues.push('First Contentful Paint too slow');

        // 6. ACCESSIBILITY ANALYSIS
        console.log('\n♿ ACCESSIBILITY ANALYSIS');
        console.log('========================');
        
        const accessibilityIssues = await page.evaluate(() => {
            const issues = [];
            
            // Check for images without alt text
            const images = document.querySelectorAll('img');
            const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
            if (imagesWithoutAlt.length > 0) {
                issues.push(`${imagesWithoutAlt.length} images missing alt text`);
            }
            
            // Check for buttons without accessible names
            const buttons = document.querySelectorAll('button');
            const buttonsWithoutNames = Array.from(buttons).filter(btn => 
                !btn.textContent.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('aria-labelledby')
            );
            if (buttonsWithoutNames.length > 0) {
                issues.push(`${buttonsWithoutNames.length} buttons missing accessible names`);
            }
            
            // Check for form inputs without labels
            const inputs = document.querySelectorAll('input, select, textarea');
            const inputsWithoutLabels = Array.from(inputs).filter(input => 
                !input.labels?.length && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')
            );
            if (inputsWithoutLabels.length > 0) {
                issues.push(`${inputsWithoutLabels.length} form inputs missing labels`);
            }
            
            // Check color contrast (basic check)
            const elements = document.querySelectorAll('*');
            let lowContrastElements = 0;
            Array.from(elements).slice(0, 50).forEach(el => {
                const styles = window.getComputedStyle(el);
                const color = styles.color;
                const backgroundColor = styles.backgroundColor;
                if (color === backgroundColor && color !== 'rgba(0, 0, 0, 0)') {
                    lowContrastElements++;
                }
            });
            
            if (lowContrastElements > 0) {
                issues.push(`${lowContrastElements} elements with potential contrast issues`);
            }
            
            return issues;
        });

        console.log(`♿ Accessibility Issues: ${accessibilityIssues.length}`);
        accessibilityIssues.forEach(issue => {
            console.log(`   ⚠️ ${issue}`);
            analysisResults.accessibility[issue] = true;
        });

        // 7. ERROR ANALYSIS
        console.log('\n🚨 ERROR ANALYSIS');
        console.log('=================');
        
        console.log(`❌ JavaScript Errors: ${errors.length}`);
        console.log(`⚠️ Console Warnings: ${warnings.length}`);
        
        errors.slice(0, 5).forEach((error, i) => {
            console.log(`   ${i + 1}. ${error}`);
            analysisResults.issues.push(`JavaScript Error: ${error}`);
        });

        // 8. GENERATE IMPROVEMENT RECOMMENDATIONS
        console.log('\n💡 IMPROVEMENT RECOMMENDATIONS');
        console.log('==============================');
        
        // UI/UX Improvements
        analysisResults.improvements.push('Add loading states for all interactive elements');
        analysisResults.improvements.push('Implement better visual feedback for button clicks');
        analysisResults.improvements.push('Add tooltips for complex controls');
        analysisResults.improvements.push('Improve spacing and alignment consistency');
        
        // Functionality Enhancements
        analysisResults.enhancements.push('Add keyboard navigation support');
        analysisResults.enhancements.push('Implement undo/redo functionality');
        analysisResults.enhancements.push('Add simulation result comparison feature');
        analysisResults.enhancements.push('Implement real-time parameter validation');
        analysisResults.enhancements.push('Add export/import simulation configurations');
        
        console.log('\n🎉 ANALYSIS COMPLETE!');
        console.log('====================');
        console.log(`Total Issues Found: ${analysisResults.issues.length}`);
        console.log(`Improvement Suggestions: ${analysisResults.improvements.length}`);
        console.log(`Enhancement Ideas: ${analysisResults.enhancements.length}`);

        return analysisResults;

    } catch (error) {
        console.error('❌ Analysis Error:', error.message);
        analysisResults.issues.push(`Analysis Error: ${error.message}`);
        return analysisResults;
    } finally {
        await browser.close();
    }
}

// Run the analysis
comprehensiveSimulationAnalysis()
    .then(results => {
        console.log('\n📊 FINAL ANALYSIS RESULTS');
        console.log('=========================');
        console.log('Results saved for further processing...');
        
        // Save results to file for further processing
        const fs = require('fs');
        fs.writeFileSync('simulation-analysis-results.json', JSON.stringify(results, null, 2));
        console.log('✅ Results saved to simulation-analysis-results.json');
    })
    .catch(console.error);