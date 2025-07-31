import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = { 
    logLevel: 'info', 
    output: 'json', 
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port 
  };

  // Test multiple pages
  const urls = [
    'http://localhost:3000',
    'http://localhost:3000/about',
    'http://localhost:3000/posts/my-top-3-ai-tools-for-productivity'
  ];

  console.log('🚀 Starting Lighthouse Performance Analysis...\n');

  for (const url of urls) {
    try {
      console.log(`📊 Testing: ${url}`);
      const runnerResult = await lighthouse(url, options);
      
      const scores = runnerResult.lhr.categories;
      const performance = Math.round(scores.performance.score * 100);
      const accessibility = Math.round(scores.accessibility.score * 100);
      const bestPractices = Math.round(scores['best-practices'].score * 100);
      const seo = Math.round(scores.seo.score * 100);
      const total = performance + accessibility + bestPractices + seo;

      console.log(`  Performance: ${performance}/100`);
      console.log(`  Accessibility: ${accessibility}/100`);
      console.log(`  Best Practices: ${bestPractices}/100`);
      console.log(`  SEO: ${seo}/100`);
      console.log(`  🎯 TOTAL: ${total}/400\n`);

      // Core Web Vitals
      const metrics = runnerResult.lhr.audits;
      if (metrics['largest-contentful-paint']) {
        console.log(`  📈 LCP: ${Math.round(metrics['largest-contentful-paint'].numericValue)}ms`);
      }
      if (metrics['interaction-to-next-paint']) {
        console.log(`  ⚡ INP: ${Math.round(metrics['interaction-to-next-paint'].numericValue)}ms`);
      }
      if (metrics['cumulative-layout-shift']) {
        console.log(`  📐 CLS: ${metrics['cumulative-layout-shift'].numericValue.toFixed(3)}`);
      }
      console.log('---\n');

    } catch (error) {
      console.error(`❌ Error testing ${url}:`, error.message);
    }
  }

  await chrome.kill();
}

// Run lighthouse test
runLighthouse().catch(console.error);