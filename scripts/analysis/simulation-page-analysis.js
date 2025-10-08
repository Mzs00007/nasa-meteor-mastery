const puppeteer = require('puppeteer');

async function analyzeSimulationPage() {
    console.log('🚀 Starting Comprehensive Simulation Page Analysis');
    console.log('================================================\n');

    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    try {
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            if (!msg.text().includes('JSHandle@object')) {
                console.log('🖥️ Console:', msg.text());
            }
        });
        page.on('pageerror', error => console.log('❌ Page Error:', error.message));

        console.log('📍 Navigating to simulation page...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n🔍 SIMULATION PAGE ANALYSIS');
        console.log('============================\n');

        // 1. Page Structure Analysis
        console.log('📋 PAGE STRUCTURE ANALYSIS');
        console.log('---------------------------');
        
        const pageTitle = await page.title();
        console.log(`📄 Page Title: ${pageTitle}`);
        
        const headerExists = await page.$('header') !== null;
        console.log(`🎯 Header Present: ${headerExists ? '✅' : '❌'}`);
        
        const mainContent = await page.$('main') !== null;
        console.log(`📱 Main Content: ${mainContent ? '✅' : '❌'}`);

        // Check for app container
        const appContainer = await page.$('#root, .app, [class*="app"]') !== null;
        console.log(`📦 App Container: ${appContainer ? '✅' : '❌'}`);

        // 2. Navigation Analysis
        console.log('\n🧭 NAVIGATION ANALYSIS');
        console.log('-----------------------');
        
        const navButtons = await page.$$('button, a[href]');
        console.log(`🔗 Total Navigation Elements: ${navButtons.length}`);
        
        // Look for back button using text content
        const backButton = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            return buttons.some(btn => btn.textContent.toLowerCase().includes('back'));
        });
        console.log(`⬅️ Back Button: ${backButton ? '✅' : '❌'}`);

        // 3. Theme System Analysis
        console.log('\n🎨 THEME SYSTEM ANALYSIS');
        console.log('-------------------------');
        
        const themeElements = await page.$$('select, button, div');
        let themeSelector = null;
        
        for (const element of themeElements.slice(0, 20)) {
            const text = await page.evaluate(el => el.textContent, element);
            if (text && (text.includes('Light Mode') || text.includes('Dark Mode') || text.includes('Theme'))) {
                themeSelector = element;
                console.log(`🌞 Theme Selector: ✅`);
                console.log(`🎨 Theme Text: ${text.trim()}`);
                break;
            }
        }
        
        if (!themeSelector) {
            console.log(`🌞 Theme Selector: ❌`);
        }

        // 4. Simulation Controls Analysis
        console.log('\n⚙️ SIMULATION CONTROLS ANALYSIS');
        console.log('--------------------------------');
        
        // Quick Presets - look for preset-related elements
        const allButtons = await page.$$('button');
        const presetButtons = [];
        
        for (const button of allButtons) {
            const text = await page.evaluate(el => el.textContent, button);
            if (text && (text.includes('Chelyabinsk') || text.includes('Tunguska') || text.includes('Chicxulub'))) {
                presetButtons.push(button);
            }
        }
        
        console.log(`🎯 Quick Preset Buttons: ${presetButtons.length}`);
        
        for (let i = 0; i < presetButtons.length; i++) {
            const presetText = await page.evaluate(el => el.textContent, presetButtons[i]);
            console.log(`   ${i + 1}. ${presetText.trim()}`);
        }

        // Parameter Controls
        const sliders = await page.$$('input[type="range"]');
        console.log(`🎚️ Parameter Sliders: ${sliders.length}`);
        
        const numberInputs = await page.$$('input[type="number"]');
        console.log(`🔢 Number Inputs: ${numberInputs.length}`);
        
        const selectDropdowns = await page.$$('select');
        console.log(`📋 Dropdown Selectors: ${selectDropdowns.length}`);

        // 5. Form Validation Analysis
        console.log('\n✅ FORM VALIDATION ANALYSIS');
        console.log('----------------------------');
        
        // Test diameter slider
        if (sliders.length > 0) {
            const diameterSlider = sliders[0];
            const minValue = await page.evaluate(el => el.min, diameterSlider);
            const maxValue = await page.evaluate(el => el.max, diameterSlider);
            const currentValue = await page.evaluate(el => el.value, diameterSlider);
            console.log(`📏 First Slider Range: ${minValue} - ${maxValue} (Current: ${currentValue})`);
        }

        // 6. Interactive Elements Testing
        console.log('\n🖱️ INTERACTIVE ELEMENTS TESTING');
        console.log('--------------------------------');
        
        // Test preset button clicks
        if (presetButtons.length > 0) {
            console.log('🧪 Testing Preset Button Interaction...');
            try {
                await presetButtons[0].click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('✅ Preset button clickable');
            } catch (error) {
                console.log('❌ Preset button click failed:', error.message);
            }
        }

        // Test slider interaction
        if (sliders.length > 0) {
            console.log('🧪 Testing Slider Interaction...');
            try {
                const slider = sliders[0];
                await slider.click();
                await page.keyboard.press('ArrowRight');
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log('✅ Slider responsive to keyboard input');
            } catch (error) {
                console.log('❌ Slider interaction failed:', error.message);
            }
        }

        // 7. Visual Elements Analysis
        console.log('\n👁️ VISUAL ELEMENTS ANALYSIS');
        console.log('----------------------------');
        
        const images = await page.$$('img');
        console.log(`🖼️ Images: ${images.length}`);
        
        const icons = await page.$$('svg, i, [class*="icon"]');
        console.log(`🎯 Icons/SVGs: ${icons.length}`);
        
        const cards = await page.$$('[class*="card"], [class*="panel"], [class*="container"]');
        console.log(`🃏 Card/Panel Elements: ${cards.length}`);

        // 8. Simulation Display Analysis
        console.log('\n📊 SIMULATION DISPLAY ANALYSIS');
        console.log('-------------------------------');
        
        const mapContainer = await page.$('canvas, svg, [class*="map"], [class*="simulation"]');
        console.log(`🗺️ Map/Simulation Container: ${mapContainer ? '✅' : '❌'}`);
        
        const dataDisplays = await page.$$('[class*="data"], [class*="result"], [class*="output"], [class*="display"]');
        console.log(`📈 Data Display Elements: ${dataDisplays.length}`);

        // 9. Text Content Analysis
        console.log('\n📝 TEXT CONTENT ANALYSIS');
        console.log('-------------------------');
        
        const textContent = await page.evaluate(() => {
            const text = document.body.textContent;
            return {
                hasSimulationSetup: text.includes('Simulation Setup'),
                hasAsteroidParameters: text.includes('Asteroid Parameters'),
                hasDiameter: text.includes('Diameter'),
                hasVelocity: text.includes('Velocity'),
                hasEntryAngle: text.includes('Entry Angle'),
                hasMaterialComposition: text.includes('Material Composition'),
                hasNASAData: text.includes('NASA'),
                hasLaunchSimulation: text.includes('Launch Simulation')
            };
        });
        
        Object.entries(textContent).forEach(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            console.log(`📄 ${label}: ${value ? '✅' : '❌'}`);
        });

        // 10. Performance Metrics
        console.log('\n⚡ PERFORMANCE METRICS');
        console.log('----------------------');
        
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
                domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
                totalTime: Math.round(navigation.loadEventEnd - navigation.fetchStart)
            };
        });
        
        console.log(`⏱️ Page Load Time: ${performanceMetrics.loadTime}ms`);
        console.log(`📄 DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
        console.log(`🕐 Total Load Time: ${performanceMetrics.totalTime}ms`);

        // 11. Responsive Design Testing
        console.log('\n📱 RESPONSIVE DESIGN TESTING');
        console.log('-----------------------------');
        
        const viewports = [
            { name: 'Desktop', width: 1920, height: 1080 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Mobile', width: 375, height: 667 }
        ];

        for (const viewport of viewports) {
            await page.setViewport(viewport);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const isResponsive = await page.evaluate(() => {
                const body = document.body;
                return {
                    hasHorizontalScroll: body.scrollWidth > window.innerWidth,
                    bodyWidth: body.scrollWidth,
                    windowWidth: window.innerWidth
                };
            });
            
            console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height}): ${!isResponsive.hasHorizontalScroll ? '✅' : '⚠️'} ${isResponsive.hasHorizontalScroll ? `Horizontal scroll (${isResponsive.bodyWidth}px > ${isResponsive.windowWidth}px)` : 'Responsive'}`);
        }

        // 12. Accessibility Analysis
        console.log('\n♿ ACCESSIBILITY ANALYSIS');
        console.log('-------------------------');
        
        const altTexts = await page.$$eval('img', imgs => 
            imgs.filter(img => img.alt && img.alt.trim() !== '').length
        );
        const totalImages = await page.$$eval('img', imgs => imgs.length);
        console.log(`🖼️ Images with Alt Text: ${altTexts}/${totalImages}`);
        
        const ariaLabels = await page.$$('[aria-label], [aria-labelledby], [aria-describedby]');
        console.log(`🏷️ Elements with ARIA Labels: ${ariaLabels.length}`);
        
        const focusableElements = await page.$$('button, input, select, textarea, a[href]');
        console.log(`⌨️ Focusable Elements: ${focusableElements.length}`);

        // 13. Error Detection
        console.log('\n🚨 ERROR DETECTION');
        console.log('------------------');
        
        const jsErrors = await page.evaluate(() => {
            return window.jsErrors || [];
        });
        console.log(`❌ JavaScript Errors: ${jsErrors.length}`);

        console.log('\n🎉 ANALYSIS COMPLETE!');
        console.log('=====================');
        console.log('Detailed analysis of the simulation page has been completed.');
        console.log('Check the results above for areas that need improvement.');

    } catch (error) {
        console.error('❌ Analysis Error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the analysis
analyzeSimulationPage().catch(console.error);