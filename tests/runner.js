/**
 * AwamiConnect Master Automated Test Runner
 * Executes all 4 tiers of automated test suites:
 *   - Tier 1: Feature Coverage (>= 40 tests)
 *   - Tier 2: Boundary & Corner Cases (>= 40 tests)
 *   - Tier 3: Cross-Feature Combinations (>= 10 tests)
 *   - Tier 4: Real-World Civic Scenarios (>= 5 tests)
 * Total Threshold: >= 95 tests
 * Exits with code 0 on success, non-zero on failure.
 */

const BrowserDriver = require('./browser_driver');
const { TestCollector } = require('./test_helper');

const testViewports = require('./test_viewports');
const testRuntimeConsole = require('./test_runtime_console');
const testFunctionalFlows = require('./test_functional_flows');
const testResilienceE2e = require('./test_resilience_e2e');

async function runAllSuites() {
  console.log('================================================================');
  console.log('🏛️  AwamiConnect Automated E2E Test Suite Runner');
  console.log('================================================================');
  console.log(`Node Runtime : ${process.version}`);
  console.log(`Platform     : ${process.platform} (${process.arch})`);
  console.log(`Timestamp    : ${new Date().toISOString()}`);
  console.log('----------------------------------------------------------------');

  const allResults = [];
  const startTime = Date.now();

  const suites = [
    { name: 'Suite 1: Viewports & Map Rendering', module: testViewports },
    { name: 'Suite 2: Runtime Console Health & Admin', module: testRuntimeConsole },
    { name: 'Suite 3: Functional & Cross-Feature Flows', module: testFunctionalFlows },
    { name: 'Suite 4: Storage Resilience & Real-World Scenarios', module: testResilienceE2e }
  ];

  for (let i = 0; i < suites.length; i++) {
    const s = suites[i];
    console.log(`\n================================================================`);
    console.log(`▶ Executing ${s.name} (${i + 1}/${suites.length})...`);
    console.log(`================================================================`);

    const driver = new BrowserDriver({ port: 3000, cdpPort: 9222 });
    try {
      await driver.startServer();
      await driver.launchChrome();
      const collector = new TestCollector(s.name);
      s.module.registerTests(collector);
      const results = await collector.run(driver);
      allResults.push(...results);

      const passedCount = results.filter(r => r.passed).length;
      console.log(`\n  ▶ ${s.name} Finished: ${passedCount}/${results.length} passed`);
    } catch (err) {
      console.error(`Error executing ${s.name}:`, err);
    } finally {
      await driver.close();
      // Brief pause between suite teardown and next startup
      await new Promise(r => setTimeout(r, 400));
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // Group by Tier
  const tierSummary = {
    1: { name: 'Tier 1: Feature Coverage', tests: [], minThreshold: 40 },
    2: { name: 'Tier 2: Boundary & Corner Cases', tests: [], minThreshold: 40 },
    3: { name: 'Tier 3: Cross-Feature Interactions', tests: [], minThreshold: 10 },
    4: { name: 'Tier 4: Real-World Scenarios', tests: [], minThreshold: 5 }
  };

  for (const r of allResults) {
    if (tierSummary[r.tier]) {
      tierSummary[r.tier].tests.push(r);
    }
  }

  console.log('\n================================================================');
  console.log('📊 TEST EXECUTION SUMMARY BY TIER');
  console.log('================================================================');

  let totalTests = allResults.length;
  let totalPassed = allResults.filter(r => r.passed).length;
  let totalFailed = allResults.filter(r => !r.passed).length;
  let allThresholdsMet = true;

  for (const tierNum of [1, 2, 3, 4]) {
    const t = tierSummary[tierNum];
    const passed = t.tests.filter(r => r.passed).length;
    const total = t.tests.length;
    const meetsThreshold = total >= t.minThreshold;
    if (!meetsThreshold) allThresholdsMet = false;

    console.log(`\n${t.name}:`);
    console.log(`  Tests Executed : ${total} (Required Threshold: >= ${t.minThreshold}) ${meetsThreshold ? '✓' : '✗'}`);
    console.log(`  Passed         : ${passed}`);
    console.log(`  Failed         : ${total - passed}`);
    console.log(`  Pass Rate      : ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Total Automated Tests : ${totalTests} (Threshold >= 95: ${totalTests >= 95 ? 'MET ✓' : 'UNMET ✗'})`);
  console.log(`Total Passed          : ${totalPassed}`);
  console.log(`Total Failed          : ${totalFailed}`);
  console.log(`Overall Pass Rate     : ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
  console.log(`Total Duration        : ${durationSec}s`);
  console.log('----------------------------------------------------------------');

  if (totalFailed > 0) {
    console.log('\n❌ FAILED TEST DETAILS (Discovered Defects for Implementation Teams):');
    allResults.filter(r => !r.passed).forEach((r, idx) => {
      console.log(`\n  ${idx + 1}) [Tier ${r.tier}] ${r.suite} -> ${r.name}`);
      console.log(`     Error: ${r.error}`);
    });
    console.log('\n================================================================');
    console.log(`❌ RESULT: ${totalFailed} IMPLEMENTATION DEFECT(S) DISCOVERED (Non-zero exit code)`);
    console.log('================================================================\n');
    process.exit(1);
  } else {
    console.log('\n================================================================');
    console.log('✅ RESULT: ALL TEST TIERS PASSED (Exit code 0)');
    console.log('================================================================\n');
    process.exit(0);
  }
}

if (require.main === module) {
  runAllSuites();
}

module.exports = { runAllSuites };
