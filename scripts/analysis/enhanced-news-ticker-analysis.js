const puppeteer = require('puppeteer');

async function analyzeEnhancedNewsTicker() {
  console.log('🔍 Starting Enhanced News Ticker Component Analysis...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the component to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🎯 COMPONENT STRUCTURE ANALYSIS');
    console.log('================================');
    
    // 1. Check if EnhancedNewsTicker component exists
    const newsTickerExists = await page.$('.space-y-4') !== null;
    console.log(`✅ EnhancedNewsTicker Component Present: ${newsTickerExists}`);
    
    // 2. Analyze header section
    const headerSection = await page.$('.bg-black\\/20.backdrop-blur-sm.border.border-orange-500\\/30.rounded-lg.p-4');
    if (headerSection) {
      console.log('✅ Header Section Found');
      
      // Check for title
      const title = await page.$eval('h2', el => el.textContent).catch(() => null);
      console.log(`   📰 Title: "${title}"`);
      
      // Check for demo mode indicator
      const demoMode = await page.$('.bg-blue-500\\/20') !== null;
      console.log(`   🔧 Demo Mode Indicator: ${demoMode}`);
    }
    
    // 3. Analyze connection status indicators
    console.log('\n🌐 CONNECTION STATUS ANALYSIS');
    console.log('==============================');
    
    const connectionIndicators = await page.$$('.w-2.h-2.rounded-full');
    console.log(`✅ Connection Indicators Found: ${connectionIndicators.length}`);
    
    for (let i = 0; i < connectionIndicators.length; i++) {
      const indicator = connectionIndicators[i];
      const classes = await page.evaluate(el => el.className, indicator);
      const status = classes.includes('bg-green-500') ? 'Connected' : 
                   classes.includes('bg-red-500') ? 'Disconnected' : 
                   classes.includes('bg-yellow-500') ? 'Error' : 'Unknown';
      console.log(`   📡 API ${i + 1}: ${status}`);
    }
    
    // 4. Analyze control elements
    console.log('\n🎮 CONTROL ELEMENTS ANALYSIS');
    console.log('=============================');
    
    // Source selector
    const sourceSelector = await page.$('select');
    if (sourceSelector) {
      const options = await page.$$eval('select option', options => 
        options.map(option => ({ value: option.value, text: option.textContent }))
      );
      console.log('✅ Source Selector Found:');
      options.forEach(option => console.log(`   📋 ${option.text} (${option.value})`));
    }
    
    // Display mode buttons
    const displayModeButtons = await page.$$('button');
    const modeButtons = [];
    for (const button of displayModeButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (['Ticker', 'Cards', 'List'].includes(text)) {
        modeButtons.push(text);
      }
    }
    console.log(`✅ Display Mode Buttons: ${modeButtons.join(', ')}`);
    
    // 5. Test display modes
    console.log('\n📺 DISPLAY MODES TESTING');
    console.log('========================');
    
    for (const mode of ['Ticker', 'Cards', 'List']) {
      try {
        console.log(`\n🔄 Testing ${mode} Mode:`);
        
        // Click the mode button
        const modeButton = await page.$x(`//button[contains(text(), "${mode}")]`);
        if (modeButton.length > 0) {
          await modeButton[0].click();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Analyze the display
        if (mode === 'Ticker') {
          const tickerElement = await page.$('.relative.overflow-hidden');
          const hasProgressBar = await page.$('.absolute.bottom-0.left-0.w-full.h-1') !== null;
          const hasPlayPause = await page.$('button[title*="Play"], button[title*="Pause"]') !== null;
          
          console.log(`   ✅ Ticker Container: ${tickerElement !== null}`);
          console.log(`   ✅ Progress Bar: ${hasProgressBar}`);
          console.log(`   ✅ Play/Pause Button: ${hasPlayPause}`);
          
          if (tickerElement) {
            const newsTitle = await page.$eval('h3', el => el.textContent).catch(() => 'Not found');
            console.log(`   📰 Current News: "${newsTitle.substring(0, 50)}..."`);
          }
        }
        
        if (mode === 'Cards') {
          const cardGrid = await page.$('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
          const cards = await page.$$('.bg-black\\/20.backdrop-blur-sm.border.border-orange-500\\/30.rounded-lg.p-4.hover\\:border-orange-400\\/50');
          
          console.log(`   ✅ Card Grid Layout: ${cardGrid !== null}`);
          console.log(`   ✅ Number of Cards: ${cards.length}`);
          
          if (cards.length > 0) {
            const firstCardTitle = await page.evaluate(el => {
              const titleEl = el.querySelector('h3');
              return titleEl ? titleEl.textContent : 'No title';
            }, cards[0]);
            console.log(`   📰 First Card: "${firstCardTitle.substring(0, 40)}..."`);
          }
        }
        
        if (mode === 'List') {
          const listContainer = await page.$('.space-y-2');
          const listItems = await page.$$('.space-y-2 > div');
          
          console.log(`   ✅ List Container: ${listContainer !== null}`);
          console.log(`   ✅ Number of List Items: ${listItems.length}`);
          
          if (listItems.length > 0) {
            const firstItemTitle = await page.evaluate(el => {
              const titleEl = el.querySelector('h3');
              return titleEl ? titleEl.textContent : 'No title';
            }, listItems[0]);
            console.log(`   📰 First Item: "${firstItemTitle.substring(0, 40)}..."`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error testing ${mode} mode: ${error.message}`);
      }
    }
    
    // 6. Test interactive features
    console.log('\n🎯 INTERACTIVE FEATURES TESTING');
    console.log('===============================');
    
    // Test source filtering
    try {
      console.log('\n🔍 Testing Source Filtering:');
      const sourceOptions = ['all', 'spaceflightNews', 'nasa', 'spacex'];
      
      for (const source of sourceOptions) {
        await page.select('select', source);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newsCount = await page.$$eval('.bg-black\\/20', elements => elements.length);
        console.log(`   📊 ${source}: ${newsCount} items displayed`);
      }
    } catch (error) {
      console.log(`   ❌ Source filtering error: ${error.message}`);
    }
    
    // Test play/pause functionality (in ticker mode)
    try {
      console.log('\n⏯️ Testing Play/Pause Functionality:');
      const tickerButton = await page.$x(`//button[contains(text(), "Ticker")]`);
      if (tickerButton.length > 0) {
        await tickerButton[0].click();
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const playPauseButton = await page.$('button[title*="Play"], button[title*="Pause"]');
      if (playPauseButton) {
        const initialTitle = await page.evaluate(el => el.title, playPauseButton);
        console.log(`   🎮 Initial State: ${initialTitle}`);
        
        await playPauseButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newTitle = await page.evaluate(el => el.title, playPauseButton);
        console.log(`   🎮 After Click: ${newTitle}`);
        console.log(`   ✅ Play/Pause Toggle: ${initialTitle !== newTitle ? 'Working' : 'Not working'}`);
      }
    } catch (error) {
      console.log(`   ❌ Play/Pause test error: ${error.message}`);
    }
    
    // 7. Analyze news data structure
    console.log('\n📊 NEWS DATA ANALYSIS');
    console.log('=====================');
    
    try {
      // Get news data from the page
      const newsData = await page.evaluate(() => {
        const newsElements = document.querySelectorAll('.bg-black\\/20.backdrop-blur-sm.border.border-orange-500\\/30.rounded-lg');
        const data = [];
        
        newsElements.forEach(element => {
          const title = element.querySelector('h3')?.textContent || '';
          const source = element.querySelector('.text-orange-400')?.textContent || '';
          const timeAgo = element.querySelector('.text-gray-400')?.textContent || '';
          const importance = element.querySelector('.px-2.py-1.rounded')?.textContent || '';
          const hasReadMore = element.querySelector('a[href]') !== null;
          
          if (title) {
            data.push({ title, source, timeAgo, importance, hasReadMore });
          }
        });
        
        return data;
      });
      
      console.log(`✅ Total News Items Found: ${newsData.length}`);
      
      if (newsData.length > 0) {
        console.log('\n📰 Sample News Items:');
        newsData.slice(0, 3).forEach((item, index) => {
          console.log(`   ${index + 1}. "${item.title.substring(0, 50)}..."`);
          console.log(`      📡 Source: ${item.source}`);
          console.log(`      ⏰ Time: ${item.timeAgo}`);
          console.log(`      🚨 Importance: ${item.importance}`);
          console.log(`      🔗 Has Link: ${item.hasReadMore}`);
          console.log('');
        });
      }
      
      // Analyze importance distribution
      const importanceCounts = newsData.reduce((acc, item) => {
        acc[item.importance] = (acc[item.importance] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Importance Distribution:');
      Object.entries(importanceCounts).forEach(([importance, count]) => {
        console.log(`   ${importance}: ${count} items`);
      });
      
    } catch (error) {
      console.log(`❌ News data analysis error: ${error.message}`);
    }
    
    // 8. Performance analysis
    console.log('\n⚡ PERFORMANCE ANALYSIS');
    console.log('======================');
    
    try {
      const metrics = await page.metrics();
      console.log(`✅ JavaScript Heap Used: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`✅ JavaScript Heap Total: ${(metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`✅ DOM Nodes: ${metrics.Nodes}`);
      console.log(`✅ Event Listeners: ${metrics.JSEventListeners}`);
    } catch (error) {
      console.log(`❌ Performance analysis error: ${error.message}`);
    }
    
    console.log('\n🎉 ANALYSIS COMPLETE!');
    console.log('====================');
    console.log('The Enhanced News Ticker component has been thoroughly analyzed.');
    console.log('Check the detailed results above for all features and functionality.');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the analysis
analyzeEnhancedNewsTicker().catch(console.error);