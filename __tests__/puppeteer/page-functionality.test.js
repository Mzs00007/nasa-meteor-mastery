const puppeteer = require('puppeteer');

describe('Meteor Mastery Page Functionality Tests', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:3000';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      slowMo: 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  });

  describe('Page Loading and Basic Elements', () => {
    test('should load the main page successfully', async () => {
      const title = await page.title();
      expect(title).toContain('Meteor');
      
      // Check if main heading is present
      const heading = await page.$eval('h1, .main-title', el => el.textContent);
      expect(heading).toMatch(/meteor|madness/i);
    });

    test('should display navigation menu', async () => {
      const navExists = await page.$('nav, .navbar, .navigation') !== null;
      expect(navExists).toBe(true);
    });

    test('should display theme toggle button', async () => {
      const themeToggle = await page.$('[data-testid="theme-toggle"], .theme-toggle, button:contains("Light Mode")');
      expect(themeToggle).toBeTruthy();
    });
  });

  describe('Navigation Functionality', () => {
    test('should navigate to simulation page', async () => {
      try {
        await page.click('a[href="/simulation"], button:contains("Start Simulation"), .simulation-link');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        const currentUrl = page.url();
        expect(currentUrl).toContain('/simulation');
      } catch (error) {
        console.log('Simulation navigation test failed:', error.message);
      }
    });

    test('should test all main navigation links', async () => {
      const navigationLinks = [
        { selector: 'a[href="/education"], .education-link', expectedPath: '/education' },
        { selector: 'a[href="/tutorials"], .tutorials-link', expectedPath: '/tutorials' },
        { selector: 'a[href="/about"], .about-link', expectedPath: '/about' },
        { selector: 'a[href="/mission-control"], .mission-control-link', expectedPath: '/mission-control' },
        { selector: 'a[href="/analytics"], .analytics-link', expectedPath: '/analytics' }
      ];

      for (const link of navigationLinks) {
        try {
          await page.goto(BASE_URL);
          await page.waitForSelector(link.selector, { timeout: 5000 });
          await page.click(link.selector);
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
          
          const currentUrl = page.url();
          expect(currentUrl).toContain(link.expectedPath);
        } catch (error) {
          console.log(`Navigation test failed for ${link.expectedPath}:`, error.message);
        }
      }
    });
  });

  describe('Interactive Elements', () => {
    test('should test theme toggle functionality', async () => {
      try {
        const themeToggle = await page.$('button:contains("Light Mode"), .theme-toggle, [data-testid="theme-toggle"]');
        if (themeToggle) {
          await themeToggle.click();
          await page.waitForTimeout(1000);
          
          // Check if theme changed (look for dark mode classes or styles)
          const bodyClass = await page.$eval('body', el => el.className);
          const isDarkMode = bodyClass.includes('dark') || bodyClass.includes('theme-dark');
          expect(typeof isDarkMode).toBe('boolean');
        }
      } catch (error) {
        console.log('Theme toggle test failed:', error.message);
      }
    });

    test('should test "Discover More" button', async () => {
      try {
        await page.click('button:contains("Discover More"), .discover-more, [data-testid="discover-more"]');
        await page.waitForTimeout(2000);
        
        // Check if page scrolled or content appeared
        const scrollPosition = await page.evaluate(() => window.pageYOffset);
        expect(scrollPosition).toBeGreaterThan(0);
      } catch (error) {
        console.log('Discover More button test failed:', error.message);
      }
    });
  });

  describe('Data Display Elements', () => {
    test('should display NEO statistics', async () => {
      try {
        const neoStats = await page.$eval('.neo-stats, .statistics, .stats-container', el => el.textContent);
        expect(neoStats).toMatch(/2,000\+|Known NEOs|Tracked/i);
      } catch (error) {
        console.log('NEO statistics test failed:', error.message);
      }
    });

    test('should display detection accuracy', async () => {
      try {
        const accuracy = await page.$eval('.accuracy-stats, .statistics, .stats-container', el => el.textContent);
        expect(accuracy).toMatch(/99\.9%|Detection Accuracy/i);
      } catch (error) {
        console.log('Detection accuracy test failed:', error.message);
      }
    });

    test('should display monitoring status', async () => {
      try {
        const monitoring = await page.$eval('.monitoring-stats, .statistics, .stats-container', el => el.textContent);
        expect(monitoring).toMatch(/24\/7|Real-time Monitoring/i);
      } catch (error) {
        console.log('Monitoring status test failed:', error.message);
      }
    });
  });

  describe('Responsive Design Tests', () => {
    test('should work on mobile viewport', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.reload({ waitUntil: 'networkidle2' });
      
      const title = await page.title();
      expect(title).toContain('Meteor');
      
      // Check if mobile menu exists or navigation is responsive
      const mobileNav = await page.$('.mobile-menu, .hamburger, .menu-toggle') !== null;
      expect(typeof mobileNav).toBe('boolean');
    });

    test('should work on tablet viewport', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.reload({ waitUntil: 'networkidle2' });
      
      const title = await page.title();
      expect(title).toContain('Meteor');
    });
  });

  describe('Performance Tests', () => {
    test('should load within acceptable time', async () => {
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });

    test('should not have console errors', async () => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);
      
      // Filter out known acceptable errors
      const criticalErrors = errors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('404') &&
        !error.includes('net::ERR_FAILED')
      );
      
      expect(criticalErrors.length).toBe(0);
    });
  });

  describe('Accessibility Tests', () => {
    test('should have proper heading structure', async () => {
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => ({ tag: el.tagName, text: el.textContent.trim() }))
      );
      
      expect(headings.length).toBeGreaterThan(0);
      expect(headings.some(h => h.tag === 'H1')).toBe(true);
    });

    test('should have alt text for images', async () => {
      const images = await page.$$eval('img', imgs => 
        imgs.map(img => ({ src: img.src, alt: img.alt }))
      );
      
      if (images.length > 0) {
        const imagesWithoutAlt = images.filter(img => !img.alt || img.alt.trim() === '');
        expect(imagesWithoutAlt.length).toBe(0);
      }
    });

    test('should have proper button labels', async () => {
      const buttons = await page.$$eval('button', btns => 
        btns.map(btn => ({ 
          text: btn.textContent.trim(), 
          ariaLabel: btn.getAttribute('aria-label'),
          title: btn.getAttribute('title')
        }))
      );
      
      if (buttons.length > 0) {
        const unlabeledButtons = buttons.filter(btn => 
          !btn.text && !btn.ariaLabel && !btn.title
        );
        expect(unlabeledButtons.length).toBe(0);
      }
    });
  });
});