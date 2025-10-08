const fs = require('fs');

function analyzeAllResults() {
    console.log('🔍 COMPREHENSIVE ANALYSIS REPORT');
    console.log('=================================\n');

    // Load all analysis results
    let puppeteerResults = {};
    let playwrightResults = {};

    try {
        puppeteerResults = JSON.parse(fs.readFileSync('simulation-analysis-results.json', 'utf8'));
        console.log('✅ Puppeteer results loaded');
    } catch (e) {
        console.log('⚠️ Puppeteer results not found');
    }

    try {
        playwrightResults = JSON.parse(fs.readFileSync('playwright-analysis-results.json', 'utf8'));
        console.log('✅ Playwright results loaded');
    } catch (e) {
        console.log('⚠️ Playwright results not found');
    }

    // Comprehensive analysis
    const analysis = {
        criticalIssues: [],
        majorIssues: [],
        minorIssues: [],
        improvements: [],
        enhancements: [],
        performance: {},
        accessibility: {},
        usability: {},
        crossBrowser: {}
    };

    // Analyze Puppeteer results
    if (puppeteerResults.issues) {
        puppeteerResults.issues.forEach(issue => {
            if (issue.includes('JavaScript Error') || issue.includes('missing label')) {
                analysis.criticalIssues.push(issue);
            } else if (issue.includes('Missing semantic') || issue.includes('Touch targets')) {
                analysis.majorIssues.push(issue);
            } else {
                analysis.minorIssues.push(issue);
            }
        });
    }

    if (puppeteerResults.improvements) {
        analysis.improvements.push(...puppeteerResults.improvements);
    }

    if (puppeteerResults.enhancements) {
        analysis.enhancements.push(...puppeteerResults.enhancements);
    }

    if (puppeteerResults.performance) {
        analysis.performance = puppeteerResults.performance;
    }

    // Analyze Playwright results
    if (playwrightResults.browsers) {
        const browsers = Object.keys(playwrightResults.browsers);
        analysis.crossBrowser = {
            testedBrowsers: browsers,
            loadTimes: {},
            compatibility: {}
        };

        browsers.forEach(browser => {
            const browserData = playwrightResults.browsers[browser];
            analysis.crossBrowser.loadTimes[browser] = browserData.loadTime;
            
            // Check for browser-specific issues
            if (browserData.buttons === 0 && browserData.inputs === 0) {
                analysis.criticalIssues.push(`${browser}: No interactive elements detected`);
            }
            
            if (browserData.accessibility.focusableElements === 0) {
                analysis.majorIssues.push(`${browser}: No focusable elements for keyboard navigation`);
            }
        });
    }

    // Generate comprehensive todo list
    const todoList = generateTodoList(analysis);

    // Display results
    displayAnalysisResults(analysis);
    displayTodoList(todoList);

    // Save results
    const finalResults = {
        analysis,
        todoList,
        timestamp: new Date().toISOString()
    };

    fs.writeFileSync('comprehensive-analysis-results.json', JSON.stringify(finalResults, null, 2));
    console.log('\n📄 Comprehensive analysis saved to comprehensive-analysis-results.json');

    return finalResults;
}

function generateTodoList(analysis) {
    const todos = [];

    // Critical fixes (High Priority)
    analysis.criticalIssues.forEach((issue, index) => {
        todos.push({
            id: `critical-${index + 1}`,
            priority: 'high',
            category: 'Critical Fix',
            title: getFixTitle(issue),
            description: issue,
            estimatedTime: '2-4 hours',
            dependencies: []
        });
    });

    // Major improvements (High Priority)
    analysis.majorIssues.forEach((issue, index) => {
        todos.push({
            id: `major-${index + 1}`,
            priority: 'high',
            category: 'Major Improvement',
            title: getFixTitle(issue),
            description: issue,
            estimatedTime: '1-3 hours',
            dependencies: []
        });
    });

    // UI/UX Improvements (Medium Priority)
    analysis.improvements.forEach((improvement, index) => {
        todos.push({
            id: `improvement-${index + 1}`,
            priority: 'medium',
            category: 'UI/UX Improvement',
            title: improvement,
            description: `Implement ${improvement.toLowerCase()}`,
            estimatedTime: '1-2 hours',
            dependencies: []
        });
    });

    // Performance optimizations (Medium Priority)
    if (analysis.performance.loadTime > 2000) {
        todos.push({
            id: 'performance-1',
            priority: 'medium',
            category: 'Performance',
            title: 'Optimize page load time',
            description: `Current load time is ${analysis.performance.loadTime}ms, target < 2000ms`,
            estimatedTime: '2-4 hours',
            dependencies: []
        });
    }

    // Accessibility fixes (High Priority)
    todos.push({
        id: 'accessibility-1',
        priority: 'high',
        category: 'Accessibility',
        title: 'Fix form accessibility issues',
        description: 'Add proper labels to all form inputs and improve keyboard navigation',
        estimatedTime: '2-3 hours',
        dependencies: []
    });

    // Enhancements (Low Priority)
    analysis.enhancements.forEach((enhancement, index) => {
        todos.push({
            id: `enhancement-${index + 1}`,
            priority: 'low',
            category: 'Enhancement',
            title: enhancement,
            description: `Add ${enhancement.toLowerCase()}`,
            estimatedTime: '3-6 hours',
            dependencies: []
        });
    });

    // Additional specific improvements based on the simulation page
    const specificImprovements = [
        {
            id: 'ui-1',
            priority: 'high',
            category: 'UI Fix',
            title: 'Fix missing interactive elements',
            description: 'Implement missing sliders, input fields, and preset buttons for asteroid parameters',
            estimatedTime: '4-6 hours',
            dependencies: []
        },
        {
            id: 'ui-2',
            priority: 'high',
            category: 'UI Fix',
            title: 'Implement responsive design',
            description: 'Fix mobile touch targets and ensure proper responsive behavior across all devices',
            estimatedTime: '3-4 hours',
            dependencies: ['ui-1']
        },
        {
            id: 'functionality-1',
            priority: 'high',
            category: 'Functionality',
            title: 'Implement simulation controls',
            description: 'Add working diameter, velocity, and entry angle controls with real-time updates',
            estimatedTime: '6-8 hours',
            dependencies: ['ui-1']
        },
        {
            id: 'data-1',
            priority: 'medium',
            category: 'Data Integration',
            title: 'Fix NASA data integration',
            description: 'Resolve WebSocket connection issues and implement proper NASA data fetching',
            estimatedTime: '4-6 hours',
            dependencies: []
        },
        {
            id: 'visual-1',
            priority: 'medium',
            category: 'Visual Enhancement',
            title: 'Improve visual feedback',
            description: 'Add loading states, error handling, and better visual indicators for all interactions',
            estimatedTime: '2-3 hours',
            dependencies: ['ui-1']
        }
    ];

    todos.push(...specificImprovements);

    return todos.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}

function getFixTitle(issue) {
    if (issue.includes('JavaScript Error')) return 'Fix JavaScript errors';
    if (issue.includes('missing label')) return 'Add form labels';
    if (issue.includes('Missing semantic header')) return 'Add semantic header';
    if (issue.includes('Missing semantic main')) return 'Add semantic main element';
    if (issue.includes('Touch targets')) return 'Fix mobile touch targets';
    if (issue.includes('No interactive elements')) return 'Implement interactive elements';
    if (issue.includes('No focusable elements')) return 'Add keyboard navigation';
    return 'Fix identified issue';
}

function displayAnalysisResults(analysis) {
    console.log('🚨 CRITICAL ISSUES:', analysis.criticalIssues.length);
    analysis.criticalIssues.forEach(issue => console.log(`   • ${issue}`));

    console.log('\n⚠️ MAJOR ISSUES:', analysis.majorIssues.length);
    analysis.majorIssues.forEach(issue => console.log(`   • ${issue}`));

    console.log('\n📈 IMPROVEMENTS NEEDED:', analysis.improvements.length);
    analysis.improvements.forEach(improvement => console.log(`   • ${improvement}`));

    console.log('\n🚀 ENHANCEMENT OPPORTUNITIES:', analysis.enhancements.length);
    analysis.enhancements.forEach(enhancement => console.log(`   • ${enhancement}`));

    if (analysis.performance.loadTime) {
        console.log('\n⚡ PERFORMANCE:');
        console.log(`   Load Time: ${analysis.performance.loadTime}ms`);
        console.log(`   DOM Content Loaded: ${analysis.performance.domContentLoaded}ms`);
    }

    if (analysis.crossBrowser.testedBrowsers) {
        console.log('\n🌐 CROSS-BROWSER COMPATIBILITY:');
        analysis.crossBrowser.testedBrowsers.forEach(browser => {
            console.log(`   ${browser}: ${analysis.crossBrowser.loadTimes[browser]}ms load time`);
        });
    }
}

function displayTodoList(todos) {
    console.log('\n📋 COMPREHENSIVE TODO LIST');
    console.log('===========================\n');

    const categories = [...new Set(todos.map(todo => todo.category))];
    
    categories.forEach(category => {
        const categoryTodos = todos.filter(todo => todo.category === category);
        console.log(`📂 ${category.toUpperCase()} (${categoryTodos.length} items)`);
        
        categoryTodos.forEach(todo => {
            const priorityIcon = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
            console.log(`   ${priorityIcon} ${todo.title}`);
            console.log(`      ${todo.description}`);
            console.log(`      ⏱️ Estimated: ${todo.estimatedTime}`);
            if (todo.dependencies.length > 0) {
                console.log(`      🔗 Depends on: ${todo.dependencies.join(', ')}`);
            }
            console.log('');
        });
    });

    const highPriority = todos.filter(todo => todo.priority === 'high').length;
    const mediumPriority = todos.filter(todo => todo.priority === 'medium').length;
    const lowPriority = todos.filter(todo => todo.priority === 'low').length;

    console.log(`📊 PRIORITY BREAKDOWN:`);
    console.log(`   🔴 High Priority: ${highPriority} items`);
    console.log(`   🟡 Medium Priority: ${mediumPriority} items`);
    console.log(`   🟢 Low Priority: ${lowPriority} items`);
    console.log(`   📝 Total: ${todos.length} items`);
}

// Run the comprehensive analysis
analyzeAllResults();