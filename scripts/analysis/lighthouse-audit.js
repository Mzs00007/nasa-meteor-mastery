const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

async function runLighthouseAudit() {
    console.log('🏮 LIGHTHOUSE PERFORMANCE AUDIT');
    console.log('================================\n');

    let chrome;
    try {
        // Launch Chrome
        chrome = await chromeLauncher.launch({
            chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
        });

        const options = {
            logLevel: 'info',
            output: 'json',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            port: chrome.port,
        };

        // Run Lighthouse audit
        console.log('🔍 Running Lighthouse audit...');
        const runnerResult = await lighthouse('http://localhost:3000', options);

        // Extract results
        const { lhr } = runnerResult;
        
        const results = {
            scores: {
                performance: Math.round(lhr.categories.performance.score * 100),
                accessibility: Math.round(lhr.categories.accessibility.score * 100),
                bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
                seo: Math.round(lhr.categories.seo.score * 100)
            },
            metrics: {
                firstContentfulPaint: lhr.audits['first-contentful-paint'].displayValue,
                largestContentfulPaint: lhr.audits['largest-contentful-paint'].displayValue,
                firstMeaningfulPaint: lhr.audits['first-meaningful-paint'].displayValue,
                speedIndex: lhr.audits['speed-index'].displayValue,
                totalBlockingTime: lhr.audits['total-blocking-time'].displayValue,
                cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].displayValue
            },
            opportunities: [],
            diagnostics: [],
            accessibility: {
                issues: [],
                passed: []
            }
        };

        // Extract performance opportunities
        Object.keys(lhr.audits).forEach(auditKey => {
            const audit = lhr.audits[auditKey];
            if (audit.details && audit.details.type === 'opportunity' && audit.score < 1) {
                results.opportunities.push({
                    title: audit.title,
                    description: audit.description,
                    score: audit.score,
                    displayValue: audit.displayValue
                });
            }
        });

        // Extract diagnostics
        Object.keys(lhr.audits).forEach(auditKey => {
            const audit = lhr.audits[auditKey];
            if (audit.details && audit.details.type === 'diagnostic' && audit.score < 1) {
                results.diagnostics.push({
                    title: audit.title,
                    description: audit.description,
                    score: audit.score,
                    displayValue: audit.displayValue
                });
            }
        });

        // Extract accessibility issues
        Object.keys(lhr.audits).forEach(auditKey => {
            const audit = lhr.audits[auditKey];
            if (lhr.categories.accessibility.auditRefs.find(ref => ref.id === auditKey)) {
                if (audit.score < 1) {
                    results.accessibility.issues.push({
                        title: audit.title,
                        description: audit.description,
                        score: audit.score
                    });
                } else {
                    results.accessibility.passed.push(audit.title);
                }
            }
        });

        // Display results
        console.log('📊 LIGHTHOUSE SCORES:');
        console.log(`   Performance: ${results.scores.performance}/100`);
        console.log(`   Accessibility: ${results.scores.accessibility}/100`);
        console.log(`   Best Practices: ${results.scores.bestPractices}/100`);
        console.log(`   SEO: ${results.scores.seo}/100\n`);

        console.log('⚡ PERFORMANCE METRICS:');
        Object.entries(results.metrics).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });

        console.log(`\n🚀 OPPORTUNITIES (${results.opportunities.length}):`);
        results.opportunities.slice(0, 5).forEach(opp => {
            console.log(`   • ${opp.title}`);
        });

        console.log(`\n♿ ACCESSIBILITY ISSUES (${results.accessibility.issues.length}):`);
        results.accessibility.issues.slice(0, 5).forEach(issue => {
            console.log(`   • ${issue.title}`);
        });

        // Save results
        fs.writeFileSync('lighthouse-audit-results.json', JSON.stringify(results, null, 2));
        fs.writeFileSync('lighthouse-full-report.json', JSON.stringify(lhr, null, 2));
        
        console.log('\n✅ Lighthouse audit complete!');
        console.log('📄 Results saved to lighthouse-audit-results.json');
        console.log('📄 Full report saved to lighthouse-full-report.json');

        return results;

    } catch (error) {
        console.error('❌ Lighthouse audit failed:', error.message);
        return null;
    } finally {
        if (chrome) {
            await chrome.kill();
        }
    }
}

// Run the audit
runLighthouseAudit().catch(console.error);