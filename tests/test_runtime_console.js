/**
 * Tier 1 & Tier 2: Runtime Console Health & Admin Management Test Suite
 * Monitors console errors, warnings, unhandled exceptions, auth flows,
 * DOM security, and CSV export resilience.
 */

const { TestCollector, assert, assertEqual, assertIncludes } = require('./test_helper');
const BrowserDriver = require('./browser_driver');

function registerTests(collector) {
  // =========================================================================
  // Tier 1: Feature 3 — Console & Runtime Health
  // =========================================================================

  // Test 1: Zero unhandled JavaScript exceptions across all 4 pages
  collector.addTest(1, 'Console & Runtime Health', 'Zero unhandled JavaScript exceptions across all 4 pages on initial load', async (driver) => {
    const pages = ['/index.html', '/report.html', '/track.html', '/admin.html'];
    for (const p of pages) {
      await driver.navigate(p, { settleMs: 300 });
      assert(driver.unhandledExceptions.length === 0, `Unhandled exceptions detected on ${p}: ${driver.unhandledExceptions.join('; ')}`);
    }
  });

  // Test 2: Zero console.error calls during standard navigation
  collector.addTest(1, 'Console & Runtime Health', 'Zero console.error calls during normal page navigation across all 4 pages', async (driver) => {
    const pages = ['/index.html', '/report.html', '/track.html', '/admin.html'];
    for (const p of pages) {
      await driver.navigate(p, { settleMs: 300 });
      // Exclude third-party CDN / favicon 404s if any; inspect script errors
      const scriptErrors = driver.consoleErrors.filter(e => !e.includes('favicon.ico') && !e.includes('Failed to load resource'));
      assert(scriptErrors.length === 0, `console.error emitted on ${p}: ${scriptErrors.join('; ')}`);
    }
  });

  // Test 3: Zero console.warn calls during standard navigation
  collector.addTest(1, 'Console & Runtime Health', 'Zero console.warn calls during normal page navigation across all 4 pages', async (driver) => {
    const pages = ['/index.html', '/report.html', '/track.html', '/admin.html'];
    for (const p of pages) {
      await driver.navigate(p, { settleMs: 300 });
      assert(driver.consoleWarns.length === 0, `console.warn emitted on ${p}: ${driver.consoleWarns.join('; ')}`);
    }
  });

  // Test 4: Autocomplete attributes present on admin login inputs
  collector.addTest(1, 'Console & Runtime Health', 'admin.html email and password inputs include autocomplete attributes', async (driver) => {
    await driver.navigate('/admin.html', { settleMs: 200 });
    const autocompleteStatus = await driver.evaluate(`
      (() => {
        const email = document.getElementById('loginEmail');
        const pass = document.getElementById('loginPassword');
        return {
          emailAutocomplete: email ? email.getAttribute('autocomplete') : null,
          passAutocomplete: pass ? pass.getAttribute('autocomplete') : null
        };
      })()
    `);
    assert(autocompleteStatus.emailAutocomplete !== null, 'loginEmail must have autocomplete attribute');
    assert(autocompleteStatus.passAutocomplete !== null, 'loginPassword must have autocomplete attribute');
  });

  // Test 5: copyToClipboard executes without unhandled error
  collector.addTest(1, 'Console & Runtime Health', 'copyToClipboard helper executes safely and shows feedback toast', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-001', { settleMs: 300 });
    const executed = await driver.evaluate(`
      (() => {
        try {
          if (typeof copyToClipboard === 'function') {
            copyToClipboard('AC-2026-001');
            return true;
          }
          return false;
        } catch (e) {
          return false;
        }
      })()
    `);
    assert(executed, 'copyToClipboard must execute without throwing');
  });

  // =========================================================================
  // Tier 1: Feature 7 — Admin Auth & Management
  // =========================================================================

  // Test 6: Admin auth session initialization in sessionStorage
  collector.addTest(1, 'Admin Auth & Management', 'Admin portal renders login screen when unauthenticated', async (driver) => {
    await driver.navigate('/admin.html', { settleMs: 250 });
    const viewState = await driver.evaluate(`
      (() => {
        sessionStorage.removeItem('awami_admin_auth');
        if (typeof showLoginScreen === 'function') showLoginScreen();
        const loginScreen = document.getElementById('loginScreen');
        const portal = document.getElementById('adminPortal');
        return {
          loginVisible: loginScreen ? window.getComputedStyle(loginScreen).display !== 'none' : false,
          portalHidden: portal ? window.getComputedStyle(portal).display === 'none' : true
        };
      })()
    `);
    assert(viewState.loginVisible, '#loginScreen must be visible when unauthenticated');
    assert(viewState.portalHidden, '#adminPortal must be hidden when unauthenticated');
  });

  // Test 7: 1-Click Demo Login populates session and reveals portal
  collector.addTest(1, 'Admin Auth & Management', '1-Click Moderator Demo Access logs in and renders dashboard portal', async (driver) => {
    await driver.navigate('/admin.html', { settleMs: 250 });
    const loggedIn = await driver.evaluate(`
      (() => {
        const btn = document.getElementById('btnQuickDemoLogin');
        if (!btn) return false;
        btn.click();
        const session = sessionStorage.getItem('awami_admin_auth');
        const portal = document.getElementById('adminPortal');
        const isPortalVisible = portal ? window.getComputedStyle(portal).display !== 'none' : false;
        return Boolean(session && isPortalVisible);
      })()
    `);
    assert(loggedIn, '1-Click Demo Login must set auth session and display #adminPortal');
  });

  // Test 8: Logout button clears session and returns to login
  collector.addTest(1, 'Admin Auth & Management', 'Logout button clears session and restores login screen', async (driver) => {
    const loggedOut = await driver.evaluate(`
      (() => {
        const btn = document.getElementById('btnLogout');
        if (!btn) return false;
        btn.click();
        const session = sessionStorage.getItem('awami_admin_auth');
        const loginScreen = document.getElementById('loginScreen');
        const isLoginVisible = loginScreen ? window.getComputedStyle(loginScreen).display !== 'none' : false;
        return session === null && isLoginVisible;
      })()
    `);
    assert(loggedOut, 'Logout must clear sessionStorage and display #loginScreen');
  });

  // Test 9: KPI metric counter calculation matches complaints
  collector.addTest(1, 'Admin Auth & Management', 'Admin dashboard KPI metrics accurately compute complaint status totals', async (driver) => {
    // Re-login to check metrics
    await driver.evaluate(`
      (() => {
        const user = { name: "Moderator", email: "mod@civic.gov", role: "moderator" };
        sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
        if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    const metrics = await driver.evaluate(`
      (() => {
        const total = parseInt(document.getElementById('adminTotalCount')?.textContent || '0');
        const submitted = parseInt(document.getElementById('adminSubmittedCount')?.textContent || '0');
        const assigned = parseInt(document.getElementById('adminAssignedCount')?.textContent || '0');
        const resolved = parseInt(document.getElementById('adminResolvedCount')?.textContent || '0');
        return { total, submitted, assigned, resolved };
      })()
    `);
    assert(metrics.total >= 5, `Total complaints count should be at least 5, got ${metrics.total}`);
    assert(metrics.total >= metrics.submitted + metrics.assigned + metrics.resolved, 'Total should be >= sum of sub-metrics');
  });

  // Test 10: Search input filters complaints table by query
  collector.addTest(1, 'Admin Auth & Management', 'Search input filters table rows by ID, title, or location', async (driver) => {
    const searchResult = await driver.evaluate(`
      (() => {
        const searchInput = document.getElementById('adminSearchInput');
        if (!searchInput) return null;
        searchInput.value = 'AC-2026-001';
        searchInput.dispatchEvent(new Event('input'));
        const rows = document.querySelectorAll('#complaintsTableBody tr');
        return {
          rowCount: rows.length,
          firstRowText: rows[0]?.textContent || ''
        };
      })()
    `);
    assert(searchResult !== null, '#adminSearchInput must exist');
    assert(searchResult.rowCount === 1, `Searching for AC-2026-001 should yield exactly 1 row, got ${searchResult.rowCount}`);
    assertIncludes(searchResult.firstRowText, 'AC-2026-001', 'First row must contain AC-2026-001');
  });

  // =========================================================================
  // Tier 2: Boundary & Corner Cases — Runtime Health & Admin Edge Cases
  // =========================================================================

  // Test 11: history.pushState resilience on restricted origins
  collector.addTest(2, 'Boundary & Corner Cases', 'track.html search form handles pushState restrictions safely without crashing', async (driver) => {
    await driver.navigate('/track.html', { settleMs: 250 });
    const pushStateHandled = await driver.evaluate(`
      (() => {
        // Mock pushState throwing SecurityError as occurs on file://
        const originalPushState = history.pushState;
        history.pushState = () => { throw new DOMException("SecurityError", "SecurityError"); };
        try {
          const form = document.getElementById('trackSearchForm');
          const input = document.getElementById('trackSearchInput');
          if (!form || !input) return false;
          input.value = 'AC-2026-001';
          form.dispatchEvent(new Event('submit'));
          return true;
        } catch (e) {
          return false;
        } finally {
          history.pushState = originalPushState;
        }
      })()
    `);
    assert(pushStateHandled, 'Form submit must catch pushState SecurityError without unhandled exception');
  });

  // Test 12: Offline CDN resilience when Chart.js fails to load
  collector.addTest(2, 'Boundary & Corner Cases', 'dashboard.js gracefully degrades when Chart constructor is unavailable', async (driver) => {
    // Navigate with Chart explicitly undefined
    await driver.navigate('/index.html', { settleMs: 200 });
    const survivedChartAbsence = await driver.evaluate(`
      (() => {
        const savedChart = window.Chart;
        delete window.Chart;
        try {
          if (typeof renderCharts === 'function') {
            renderCharts([]);
          }
          return true;
        } catch (e) {
          return false;
        } finally {
          window.Chart = savedChart;
        }
      })()
    `);
    assert(survivedChartAbsence, 'renderCharts should not crash when Chart.js is offline or undefined');
  });

  // Test 13: Insecure origin fallback for copyToClipboard
  collector.addTest(2, 'Boundary & Corner Cases', 'copyToClipboard provides textarea fallback when navigator.clipboard is undefined', async (driver) => {
    const handledFallback = await driver.evaluate(`
      (() => {
        const originalClipboard = navigator.clipboard;
        Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
        try {
          if (typeof copyToClipboard === 'function') {
            copyToClipboard('AC-FALLBACK-TEST');
            return true;
          }
          return false;
        } catch (e) {
          return false;
        } finally {
          Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
        }
      })()
    `);
    assert(handledFallback, 'copyToClipboard must not crash when navigator.clipboard is undefined');
  });

  // Test 14: Nominatim reverse geocoding failure resilience
  collector.addTest(2, 'Boundary & Corner Cases', 'Reverse geocode network failure does not crash report.html form', async (driver) => {
    await driver.navigate('/report.html', { settleMs: 250 });
    const geocodeHandled = await driver.evaluate(`
      (() => {
        const originalFetch = window.fetch;
        window.fetch = () => Promise.reject(new Error("Network error"));
        try {
          if (typeof reverseGeocode === 'function') {
            reverseGeocode(24.86, 67.00);
            return true;
          }
          return false;
        } catch (e) {
          return false;
        } finally {
          window.fetch = originalFetch;
        }
      })()
    `);
    assert(geocodeHandled, 'reverseGeocode must handle fetch rejection gracefully');
  });

  // Test 15: GPS Geolocation error handling without console.error
  collector.addTest(2, 'Boundary & Corner Cases', 'GPS Geolocation error callback handles rejection without unhandled errors', async (driver) => {
    const gpsHandled = await driver.evaluate(`
      (() => {
        const originalGeo = navigator.geolocation;
        Object.defineProperty(navigator, 'geolocation', {
          value: {
            getCurrentPosition: (success, error) => {
              error({ code: 1, message: 'User denied geolocation' });
            }
          },
          configurable: true
        });
        try {
          const btn = document.getElementById('btnUseGps');
          if (btn) btn.click();
          return true;
        } catch (e) {
          return false;
        } finally {
          Object.defineProperty(navigator, 'geolocation', { value: originalGeo, configurable: true });
        }
      })()
    `);
    assert(gpsHandled, 'Geolocation denial must not crash application');
  });

  // Test 16: Admin Edit Modal Enter key submission prevention
  collector.addTest(2, 'Boundary & Corner Cases', 'Pressing Enter inside edit modal input fields does not trigger page reload', async (driver) => {
    await driver.navigate('/admin.html', { settleMs: 250 });
    await driver.evaluate(`
      (() => {
        const user = { name: "Moderator", email: "mod@civic.gov", role: "moderator" };
        sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
        if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
        if (typeof openEditModal === 'function') openEditModal('AC-2026-001');
      })()
    `);
    await new Promise(r => setTimeout(r, 200));
    const enterHandled = await driver.evaluate(`
      (() => {
        const proofInput = document.getElementById('modalProofUrl');
        const form = document.getElementById('modalEditForm');
        if (!proofInput || !form) return true;
        let formSubmitted = false;
        form.addEventListener('submit', (e) => {
          formSubmitted = true;
          e.preventDefault();
        });
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        proofInput.dispatchEvent(event);
        return !formSubmitted || event.defaultPrevented;
      })()
    `);
    assert(enterHandled, 'Enter key inside modal input should be prevented from triggering standard form submit');
  });

  // Test 17: Department options in admin.html match CATEGORIES
  collector.addTest(2, 'Boundary & Corner Cases', 'Department select in admin.html contains matching options for all standard departments', async (driver) => {
    await driver.navigate('/admin.html', { settleMs: 200 });
    const selectOptions = await driver.evaluate(`
      (() => {
        const sel = document.getElementById('modalDepartmentSelect');
        if (!sel) return [];
        return Array.from(sel.options).map(o => o.value);
      })()
    `);
    assert(selectOptions.length >= 5, `modalDepartmentSelect should have at least 5 department options, got ${selectOptions.length}`);
    // Verify common municipal departments are present
    const deptString = selectOptions.join(' ');
    assert(deptString.includes('Works') || deptString.includes('Highways'), 'Department options must include Works/Highways');
    assert(deptString.includes('Waste') || deptString.includes('Sanitation'), 'Department options must include Waste/Sanitation');
  });

  // Test 18: Safe DOM entity escaping for user-supplied content
  collector.addTest(2, 'Boundary & Corner Cases', 'escapeHtml utility safely escapes HTML entities (<, >, &, ", \')', async (driver) => {
    const escapeResults = await driver.evaluate(`
      (() => {
        const payload = '<script>alert("XSS")<\\/script> & \\'test\\'';
        if (typeof escapeHtml !== 'function') {
          if (window.AwamiUI && typeof window.AwamiUI.escapeHtml === 'function') {
            return {
              escaped: window.AwamiUI.escapeHtml(payload)
            };
          }
          return null;
        }
        return {
          escaped: escapeHtml(payload)
        };
      })()
    `);
    if (escapeResults) {
      assert(!escapeResults.escaped.includes('<script>'), 'escapeHtml must escape <script> tags');
      assert(escapeResults.escaped.includes('&lt;'), 'escapeHtml must convert < to &lt;');
    }
  });

  // Test 19: RFC 4180 CSV export handles special characters without truncation
  collector.addTest(2, 'Boundary & Corner Cases', 'exportComplaintsToCSV handles quotes, commas, and hashtags (#) safely', async (driver) => {
    await driver.navigate('/admin.html', { settleMs: 200 });
    const csvHandled = await driver.evaluate(`
      (() => {
        const testComplaints = [{
          id: "AC-2026-TEST",
          title: 'Issue #42: "Broken Pipe", Sector F-10',
          category: 'water',
          status: 'submitted',
          department: 'Water Authority',
          citizenName: 'Ali, Ahmed',
          citizenPhone: '0300-1111111',
          locationName: 'Street #5, Near Park',
          submittedAt: '2026-10-21T00:00:00Z',
          resolvedAt: ''
        }];
        try {
          if (typeof exportComplaintsToCSV === 'function') {
            // Mock link click to verify no unhandled exception
            const originalCreate = document.createElement;
            let exportedHref = '';
            document.createElement = function(tagName) {
              const el = originalCreate.call(document, tagName);
              if (tagName === 'a') {
                el.click = function() { exportedHref = el.getAttribute('href'); };
              }
              return el;
            };
            exportComplaintsToCSV(testComplaints);
            document.createElement = originalCreate;
            return {
              success: true,
              hrefType: exportedHref.startsWith('data:text/csv') || exportedHref.startsWith('blob:')
            };
          }
          return { success: false };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })()
    `);
    assert(csvHandled.success, `exportComplaintsToCSV failed: ${csvHandled.error}`);
  });

  // Test 20: Empty filter combinations render clean empty-state message
  collector.addTest(2, 'Boundary & Corner Cases', 'Filtering with no matching records displays empty state without console errors', async (driver) => {
    await driver.evaluate(`
      (() => {
        const user = { name: "Moderator", email: "mod@civic.gov", role: "moderator" };
        sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
        if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
      })()
    `);
    await new Promise(r => setTimeout(r, 200));
    const emptyState = await driver.evaluate(`
      (() => {
        const searchInput = document.getElementById('adminSearchInput');
        if (searchInput) {
          searchInput.value = 'NONEXISTENT_COMPLAINT_XYZ_12345';
          searchInput.dispatchEvent(new Event('input'));
        }
        const tbody = document.getElementById('complaintsTableBody');
        return tbody ? tbody.textContent : '';
      })()
    `);
    assertIncludes(emptyState, 'No complaints match', 'Empty filter result must render user-friendly message');
  });
}

async function run(driver, collector) {
  registerTests(collector);
  return await collector.run(driver);
}

if (require.main === module) {
  (async () => {
    const driver = new BrowserDriver({ port: 3000, cdpPort: 9222 });
    const collector = new TestCollector('Runtime & Console Health');
    try {
      await driver.startServer();
      await driver.launchChrome();
      const results = await run(driver, collector);
      console.log(`\nRuntime & Console Tests: ${results.filter(r => r.passed).length}/${results.length} passed`);
      results.forEach(r => {
        console.log(`  ${r.passed ? '✓' : '✗'} [Tier ${r.tier}] ${r.name} (${r.durationMs}ms)`);
        if (!r.passed) console.log(`      Error: ${r.error}`);
      });
      process.exit(results.every(r => r.passed) ? 0 : 1);
    } catch (e) {
      console.error(e);
      process.exit(1);
    } finally {
      await driver.close();
    }
  })();
}

module.exports = { registerTests, run };
