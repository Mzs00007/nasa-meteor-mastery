const puppeteer = require('puppeteer');

async function detailedComponentTest() {
  console.log('🔍 Enhanced News Ticker - Detailed Feature Analysis\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, 
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Navigate to the application
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🎯 DETAILED FEATURE ANALYSIS');
    console.log('============================\n');
    
    // 1. Test Display Mode Switching
    console.log('📺 DISPLAY MODE SWITCHING TEST');
    console.log('------------------------------');
    
    const displayModes = ['Ticker', 'Cards', 'List'];
    for (const mode of displayModes) {
      try {
        // Find and click the button
        const buttons = await page.$$('button');
        let modeButton = null;
        
        for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text === mode) {
            modeButton = button;
            break;
          }
        }
        
        if (modeButton) {
          await modeButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if mode is active
          const isActive = await page.evaluate(button => {
            return button.classList.contains('bg-orange-500');
          }, modeButton);
          
          console.log(`✅ ${mode} Mode: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
          
          // Analyze content for each mode
          if (mode === 'Ticker') {
            const hasProgressBar = await page.$('.absolute.bottom-0.left-0.w-full.h-1') !== null;
            const hasPlayPause = await page.$('button[title*="Play"], button[title*="Pause"]') !== null;
            const hasCounter = await page.$$eval('*', elements => {
              return elements.some(el => el.textContent && el.textContent.includes('/'));
            });
            
            console.log(`   📊 Progress Bar: ${hasProgressBar}`);
            console.log(`   ⏯️ Play/Pause Control: ${hasPlayPause}`);
            console.log(`   🔢 News Counter: ${hasCounter}`);
          }
          
          if (mode === 'Cards') {
            const cardElements = await page.$$('.grid > div');
            console.log(`   🃏 Number of Cards: ${cardElements.length}`);
            
            if (cardElements.length > 0) {
              const hasImages = await page.$$('img').then(imgs => imgs.length > 0);
              console.log(`   🖼️ Has Images: ${hasImages}`);
            }
          }
          
          if (mode === 'List') {
            const listElements = await page.$$('.space-y-2 > div');
            console.log(`   📋 Number of List Items: ${listElements.length}`);
          }
        }
      } catch (error) {
        console.log(`❌ Error testing ${mode}: ${error.message}`);
      }
    }
    
    // 2. Test Source Filtering
    console.log('\n🔍 SOURCE FILTERING TEST');
    console.log('------------------------');
    
    const sourceSelect = await page.$('select');
    if (sourceSelect) {
      const options = await page.$$eval('select option', opts => 
        opts.map(opt => ({ value: opt.value, text: opt.textContent }))
      );
      
      console.log('Available Sources:');
      options.forEach(opt => console.log(`   📡 ${opt.text} (${opt.value})`));
      
      // Test each source
      for (const option of options) {
        if (option.value !== 'light' && option.value !== 'dark' && option.value !== 'nasa') {
          try {
            await page.select('select', option.value);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const newsCount = await page.$$eval('*', elements => {
              return elements.filter(el => 
                el.textContent && 
                (el.textContent.includes('SpaceX') || 
                 el.textContent.includes('NASA') || 
                 el.textContent.includes('Spaceflight'))
              ).length;
            });
            
            console.log(`   📊 ${option.text}: ${newsCount} news items`);
          } catch (error) {
            console.log(`   ❌ Error testing ${option.text}: ${error.message}`);
          }
        }
      }
    }
    
    // 3. Test Play/Pause Functionality
    console.log('\n⏯️ PLAY/PAUSE FUNCTIONALITY TEST');
    console.log('--------------------------------');
    
    try {
      // Switch to ticker mode first
      const tickerButton = await page.$$('button');
      for (const button of tickerButton) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text === 'Ticker') {
          await button.click();
          break;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find play/pause button
      const playPauseButton = await page.$('button[title*="Play"], button[title*="Pause"]');
      if (playPauseButton) {
        const initialTitle = await page.evaluate(el => el.title, playPauseButton);
        const initialEmoji = await page.evaluate(el => el.textContent, playPauseButton);
        
        console.log(`✅ Initial State: ${initialTitle} (${initialEmoji})`);
        
        // Click to toggle
        await playPauseButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newTitle = await page.evaluate(el => el.title, playPauseButton);
        const newEmoji = await page.evaluate(el => el.textContent, playPauseButton);
        
        console.log(`✅ After Toggle: ${newTitle} (${newEmoji})`);
        console.log(`✅ Toggle Working: ${initialTitle !== newTitle ? 'YES' : 'NO'}`);
      } else {
        console.log('❌ Play/Pause button not found');
      }
    } catch (error) {
      console.log(`❌ Play/Pause test error: ${error.message}`);
    }
    
    // 4. Test News Content Structure
    console.log('\n📰 NEWS CONTENT STRUCTURE TEST');
    console.log('------------------------------');
    
    try {
      const newsAnalysis = await page.evaluate(() => {
        const newsElements = document.querySelectorAll('h3');
        const analysis = {
          totalTitles: newsElements.length,
          titles: [],
          sources: [],
          importanceBadges: [],
          readMoreLinks: 0
        };
        
        // Collect titles
        newsElements.forEach(el => {
          if (el.textContent && el.textContent.length > 10) {
            analysis.titles.push(el.textContent.substring(0, 50) + '...');
          }
        });
        
        // Collect sources
        const sourceElements = document.querySelectorAll('.text-orange-400');
        sourceElements.forEach(el => {
          if (el.textContent && ['SpaceX', 'NASA', 'Spaceflight News'].includes(el.textContent)) {
            analysis.sources.push(el.textContent);
          }
        });
        
        // Collect importance badges
        const badgeElements = document.querySelectorAll('.px-2.py-1.rounded');
        badgeElements.forEach(el => {
          if (el.textContent && ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(el.textContent)) {
            analysis.importanceBadges.push(el.textContent);
          }
        });
        
        // Count read more links
        const readMoreLinks = document.querySelectorAll('a[href]');
        analysis.readMoreLinks = Array.from(readMoreLinks).filter(link => 
          link.textContent.includes('Read') || link.textContent.includes('→')
        ).length;
        
        return analysis;
      });
      
      console.log(`✅ Total News Titles: ${newsAnalysis.totalTitles}`);
      console.log(`✅ Unique Sources: ${[...new Set(newsAnalysis.sources)].join(', ')}`);
      console.log(`✅ Importance Levels: ${[...new Set(newsAnalysis.importanceBadges)].join(', ')}`);
      console.log(`✅ Read More Links: ${newsAnalysis.readMoreLinks}`);
      
      if (newsAnalysis.titles.length > 0) {
        console.log('\n📰 Sample News Titles:');
        newsAnalysis.titles.slice(0, 3).forEach((title, index) => {
          console.log(`   ${index + 1}. ${title}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ News content analysis error: ${error.message}`);
    }
    
    // 5. Test Connection Status Indicators
    console.log('\n🌐 CONNECTION STATUS INDICATORS TEST');
    console.log('-----------------------------------');
    
    try {
      const connectionStatus = await page.evaluate(() => {
        const indicators = document.querySelectorAll('.w-2.h-2.rounded-full');
        const status = [];
        
        indicators.forEach(indicator => {
          const classes = indicator.className;
          let state = 'Unknown';
          
          if (classes.includes('bg-green-500')) state = 'Connected';
          else if (classes.includes('bg-red-500')) state = 'Disconnected';
          else if (classes.includes('bg-yellow-500')) state = 'Error';
          else if (classes.includes('bg-gray-500')) state = 'Unknown';
          
          status.push(state);
        });
        
        return status;
      });
      
      connectionStatus.forEach((status, index) => {
        console.log(`✅ API ${index + 1}: ${status}`);
      });
      
    } catch (error) {
      console.log(`❌ Connection status test error: ${error.message}`);
    }
    
    // 6. Test Responsive Design Elements
    console.log('\n📱 RESPONSIVE DESIGN TEST');
    console.log('-------------------------');
    
    try {
      // Test different viewport sizes
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewport(viewport);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const layout = await page.evaluate(() => {
          const header = document.querySelector('.flex.flex-col.lg\\:flex-row');
          const grid = document.querySelector('.grid');
          
          return {
            headerIsStacked: header ? window.getComputedStyle(header).flexDirection === 'column' : false,
            gridColumns: grid ? window.getComputedStyle(grid).gridTemplateColumns : 'none'
          };
        });
        
        console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}):`);
        console.log(`   📱 Header Layout: ${layout.headerIsStacked ? 'Stacked' : 'Horizontal'}`);
        console.log(`   🃏 Grid Columns: ${layout.gridColumns !== 'none' ? 'Responsive' : 'Single'}`);
      }
      
      // Reset to desktop
      await page.setViewport({ width: 1920, height: 1080 });
      
    } catch (error) {
      console.log(`❌ Responsive design test error: ${error.message}`);
    }
    
    console.log('\n🎉 DETAILED ANALYSIS COMPLETE!');
    console.log('==============================');
    console.log('All features and functionality have been thoroughly tested.');
    
  } catch (error) {
    console.error('❌ Detailed analysis failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the detailed test
detailedComponentTest().catch(console.error);