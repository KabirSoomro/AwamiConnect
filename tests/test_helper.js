/**
 * AwamiConnect Test Assertion & Harness Helper
 */

class TestCollector {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.tests = [];
    this.results = [];
  }

  addTest(tier, feature, name, fn) {
    this.tests.push({ tier, feature, name, fn });
  }

  async run(driver) {
    this.results = [];
    for (const t of this.tests) {
      const start = Date.now();
      try {
        await t.fn(driver);
        const duration = Date.now() - start;
        this.results.push({
          suite: this.suiteName,
          tier: t.tier,
          feature: t.feature,
          name: t.name,
          passed: true,
          durationMs: duration
        });
        console.log(`  ✓ [Tier ${t.tier}] ${t.name} (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - start;
        this.results.push({
          suite: this.suiteName,
          tier: t.tier,
          feature: t.feature,
          name: t.name,
          passed: false,
          error: err.message || String(err),
          stack: err.stack,
          durationMs: duration
        });
        console.log(`  ✗ [Tier ${t.tier}] ${t.name} (${duration}ms)`);
        console.log(`      Error: ${err.message}`);
      }
    }
    return this.results;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message ? message + ': ' : ''}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(haystack, needle, message) {
  if (typeof haystack === 'string' || Array.isArray(haystack)) {
    if (!haystack.includes(needle)) {
      throw new Error(`${message ? message + ': ' : ''}Expected ${JSON.stringify(haystack)} to include ${JSON.stringify(needle)}`);
    }
  } else {
    throw new Error(`${message ? message + ': ' : ''}Target is neither string nor array`);
  }
}

function assertMatch(str, regex, message) {
  if (!regex.test(str)) {
    throw new Error(`${message ? message + ': ' : ''}Expected "${str}" to match ${regex}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  TestCollector,
  assert,
  assertEqual,
  assertIncludes,
  assertMatch,
  sleep
};
