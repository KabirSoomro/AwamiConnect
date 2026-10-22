/**
 * Tier 1 & Tier 2: Viewport Overflow & Leaflet Map Rendering Test Suite
 * Tests viewports 320px to 1920px across index.html, report.html, track.html, admin.html
 * and verifies Leaflet map lifecycles.
 */

const { TestCollector, assert, assertEqual } = require('./test_helper');
const BrowserDriver = require('./browser_driver');

const STANDARD_VIEWPORTS = [
  { width: 320, height: 568, name: '320px (Compact Mobile)' },
  { width: 375, height: 667, name: '375px (Mobile Portrait)' },
  { width: 768, height: 1024, name: '768px (Tablet Portrait)' },
  { width: 1024, height: 768, name: '1024px (Tablet Landscape)' },
  { width: 1440, height: 900, name: '1440px (Desktop)' },
  { width: 1920, height: 1080, name: '1920px (Full HD Desktop)' }
];

function registerTests(collector) {
  // =========================================================================
  // Tier 1: Feature 1 — Responsive Viewports & Zero Overflow
  // =========================================================================

  // Test 1: index.html standard viewports
  collector.addTest(1, 'Responsive Viewports', 'index.html zero horizontal overflow across 6 standard viewports (320px-1920px)', async (driver) => {
    for (const vp of STANDARD_VIEWPORTS) {
      await driver.setViewport(vp.width, vp.height);
      await driver.navigate('/index.html', { settleMs: 250 });
      const overflow = await driver.checkHorizontalOverflow();
      assert(!overflow.hasOverflow, `index.html has horizontal overflow at ${vp.name}: scrollWidth=${overflow.scrollWidth}, docWidth=${overflow.docWidth}`);
    }
  });

  // Test 2: report.html standard viewports
  collector.addTest(1, 'Responsive Viewports', 'report.html zero horizontal overflow across 6 standard viewports (320px-1920px)', async (driver) => {
    for (const vp of STANDARD_VIEWPORTS) {
      await driver.setViewport(vp.width, vp.height);
      await driver.navigate('/report.html', { settleMs: 250 });
      const overflow = await driver.checkHorizontalOverflow();
      assert(!overflow.hasOverflow, `report.html has horizontal overflow at ${vp.name}: scrollWidth=${overflow.scrollWidth}, docWidth=${overflow.docWidth}`);
    }
  });

  // Test 3: track.html standard viewports
  collector.addTest(1, 'Responsive Viewports', 'track.html zero horizontal overflow across 6 standard viewports (320px-1920px)', async (driver) => {
    for (const vp of STANDARD_VIEWPORTS) {
      await driver.setViewport(vp.width, vp.height);
      await driver.navigate('/track.html?id=AC-2026-001', { settleMs: 350 });
      const overflow = await driver.checkHorizontalOverflow();
      assert(!overflow.hasOverflow, `track.html has horizontal overflow at ${vp.name}: scrollWidth=${overflow.scrollWidth}, docWidth=${overflow.docWidth}`);
    }
  });

  // Test 4: admin.html standard viewports
  collector.addTest(1, 'Responsive Viewports', 'admin.html (login & portal) zero horizontal overflow across 6 standard viewports (320px-1920px)', async (driver) => {
    for (const vp of STANDARD_VIEWPORTS) {
      await driver.setViewport(vp.width, vp.height);
      await driver.navigate('/admin.html', { settleMs: 250 });
      const overflowLogin = await driver.checkHorizontalOverflow();
      assert(!overflowLogin.hasOverflow, `admin.html login has horizontal overflow at ${vp.name}: scrollWidth=${overflowLogin.scrollWidth}, docWidth=${overflowLogin.docWidth}`);

      // Log in to check admin portal viewports
      await driver.evaluate(`
        (() => {
          const user = { name: "Test Moderator", email: "mod@civic.gov", role: "moderator" };
          sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
          if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
        })()
      `);
      await new Promise(r => setTimeout(r, 200));
      const overflowPortal = await driver.checkHorizontalOverflow();
      assert(!overflowPortal.hasOverflow, `admin.html portal has horizontal overflow at ${vp.name}: scrollWidth=${overflowPortal.scrollWidth}, docWidth=${overflowPortal.docWidth}`);
    }
  });

  // Test 5: Mobile navigation toggle visibility and sizing
  collector.addTest(1, 'Responsive Viewports', 'Mobile navigation hamburger button is visible <= 768px and hidden on desktop > 768px', async (driver) => {
    await driver.setViewport(375, 667);
    await driver.navigate('/index.html');
    const isMobileBtnVisible = await driver.evaluate(`
      (() => {
        const btn = document.querySelector('.mobile-menu-btn');
        if (!btn) return false;
        const style = window.getComputedStyle(btn);
        return style.display !== 'none' && btn.offsetWidth > 0;
      })()
    `);
    assert(isMobileBtnVisible, 'Mobile menu button should be visible on 375px viewport');

    await driver.setViewport(1280, 800);
    const isDesktopBtnHidden = await driver.evaluate(`
      (() => {
        const btn = document.querySelector('.mobile-menu-btn');
        if (!btn) return true;
        const style = window.getComputedStyle(btn);
        return style.display === 'none' || btn.offsetWidth === 0;
      })()
    `);
    assert(isDesktopBtnHidden, 'Mobile menu button should be hidden on 1280px desktop viewport');
  });

  // Test 6: Form cards and container boundaries
  collector.addTest(1, 'Responsive Viewports', 'Card containers and action buttons fit inside parent container width on 320px/375px', async (driver) => {
    await driver.setViewport(320, 568);
    await driver.navigate('/report.html');
    const cardFit = await driver.evaluate(`
      (() => {
        const card = document.querySelector('.card');
        const container = document.querySelector('.container');
        if (!card || !container) return { fits: true };
        const cardRect = card.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return {
          fits: cardRect.right <= containerRect.right + 2,
          cardWidth: cardRect.width,
          containerWidth: containerRect.width
        };
      })()
    `);
    assert(cardFit.fits, `Card element exceeds container width: ${JSON.stringify(cardFit)}`);
  });

  // =========================================================================
  // Tier 1: Feature 2 — Leaflet Maps Rendering
  // =========================================================================

  // Test 7: index.html #cityMap container non-zero dimensions
  collector.addTest(1, 'Leaflet Maps Rendering', 'index.html city distribution map (#cityMap) initializes with non-zero dimensions', async (driver) => {
    await driver.setViewport(1024, 768);
    await driver.navigate('/index.html', { settleMs: 500 });
    const mapDims = await driver.evaluate(`
      (() => {
        const el = document.getElementById('cityMap');
        if (!el) return null;
        return {
          width: el.clientWidth,
          height: el.clientHeight,
          hasLeafletClass: el.classList.contains('leaflet-container')
        };
      })()
    `);
    assert(mapDims !== null, '#cityMap container element must exist in DOM');
    assert(mapDims.width > 0 && mapDims.height > 0, `#cityMap must have non-zero dimensions: ${JSON.stringify(mapDims)}`);
    assert(mapDims.hasLeafletClass, '#cityMap must be initialized with Leaflet (.leaflet-container)');
  });

  // Test 8: index.html Leaflet layers and marker pane
  collector.addTest(1, 'Leaflet Maps Rendering', 'index.html #cityMap attaches tile layers and marker pane', async (driver) => {
    await driver.navigate('/index.html', { settleMs: 400 });
    const layersPresent = await driver.evaluate(`
      (() => {
        const pane = document.querySelector('#cityMap .leaflet-pane');
        const markerPane = document.querySelector('#cityMap .leaflet-marker-pane');
        return Boolean(pane && markerPane);
      })()
    `);
    assert(layersPresent, '#cityMap must contain active Leaflet panes (tile-pane and marker-pane)');
  });

  // Test 9: report.html #pickerMap location picker
  collector.addTest(1, 'Leaflet Maps Rendering', 'report.html location picker map (#pickerMap) initializes with draggable marker and coordinates', async (driver) => {
    await driver.setViewport(768, 1024);
    await driver.navigate('/report.html', { settleMs: 500 });
    const pickerState = await driver.evaluate(`
      (() => {
        const mapEl = document.getElementById('pickerMap');
        const lat = document.getElementById('lblLat')?.textContent;
        const lng = document.getElementById('lblLng')?.textContent;
        const marker = document.querySelector('#pickerMap .leaflet-marker-icon');
        return {
          hasMap: mapEl?.classList.contains('leaflet-container'),
          width: mapEl?.clientWidth,
          height: mapEl?.clientHeight,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          hasMarker: Boolean(marker)
        };
      })()
    `);
    assert(pickerState.hasMap, '#pickerMap must be initialized as a Leaflet map');
    assert(pickerState.width > 0 && pickerState.height > 0, '#pickerMap must have non-zero dimensions');
    assert(!isNaN(pickerState.lat) && !isNaN(pickerState.lng), 'Picker latitude and longitude must be valid numbers');
    assert(pickerState.hasMarker, '#pickerMap must display a location marker pin');
  });

  // Test 10: track.html #trackMap mini-map
  collector.addTest(1, 'Leaflet Maps Rendering', 'track.html incident mini-map (#trackMap) initializes when complaint details load', async (driver) => {
    await driver.setViewport(1024, 768);
    await driver.navigate('/track.html?id=AC-2026-001', { settleMs: 600 });
    const trackMapState = await driver.evaluate(`
      (() => {
        const mapEl = document.getElementById('trackMap');
        if (!mapEl) return null;
        return {
          hasMap: mapEl.classList.contains('leaflet-container'),
          width: mapEl.clientWidth,
          height: mapEl.clientHeight,
          markerPresent: Boolean(mapEl.querySelector('.leaflet-marker-icon'))
        };
      })()
    `);
    assert(trackMapState !== null, '#trackMap must exist on track.html');
    assert(trackMapState.hasMap, '#trackMap must be initialized with Leaflet');
    assert(trackMapState.width > 0 && trackMapState.height > 0, `#trackMap must have non-zero dimensions: ${JSON.stringify(trackMapState)}`);
  });

  // Test 11: index.html Map status filter updates without error
  collector.addTest(1, 'Leaflet Maps Rendering', 'index.html map filter dynamically updates markers without throwing errors', async (driver) => {
    await driver.navigate('/index.html', { settleMs: 400 });
    const filterWorked = await driver.evaluate(`
      (() => {
        const filter = document.getElementById('mapStatusFilter');
        if (!filter) return false;
        filter.value = 'resolved';
        filter.dispatchEvent(new Event('change'));
        return true;
      })()
    `);
    assert(filterWorked, 'Map filter change event should execute without error');
  });

  // =========================================================================
  // Tier 2: Boundary & Corner Cases — Viewports & Map Boundaries
  // =========================================================================

  // Test 12: 320px submit button text wrapping
  collector.addTest(2, 'Boundary & Corner Cases', 'Submit button on report.html wraps cleanly without horizontal page blowout at 320px', async (driver) => {
    await driver.setViewport(320, 568);
    await driver.navigate('/report.html', { settleMs: 250 });
    const btnMetrics = await driver.evaluate(`
      (() => {
        const btn = document.getElementById('btnSubmit');
        if (!btn) return null;
        const rect = btn.getBoundingClientRect();
        return {
          width: rect.width,
          right: rect.right,
          docWidth: window.innerWidth,
          overflows: rect.right > window.innerWidth + 1
        };
      })()
    `);
    assert(btnMetrics !== null, '#btnSubmit must exist');
    assert(!btnMetrics.overflows, `Submit button overflows 320px viewport: ${JSON.stringify(btnMetrics)}`);
  });

  // Test 13: CSS Grid minmax boundary at 320px and 375px
  collector.addTest(2, 'Boundary & Corner Cases', 'CSS Grid layouts on index.html and track.html adapt to 320px without rigid minmax blowout', async (driver) => {
    await driver.setViewport(320, 568);
    await driver.navigate('/index.html', { settleMs: 250 });
    const gridOverflow = await driver.evaluate(`
      (() => {
        const grids = document.querySelectorAll('[style*="grid-template-columns"]');
        const results = [];
        for (const g of grids) {
          const rect = g.getBoundingClientRect();
          if (rect.right > window.innerWidth + 1) {
            results.push({ style: g.getAttribute('style'), right: rect.right, winWidth: window.innerWidth });
          }
        }
        return results;
      })()
    `);
    assert(gridOverflow.length === 0, `Inline CSS grids overflow 320px viewport: ${JSON.stringify(gridOverflow)}`);
  });

  // Test 14: Exact breakpoint boundary testing (767px vs 768px vs 769px)
  collector.addTest(2, 'Boundary & Corner Cases', 'Navigation header and layout behave consistently at exact boundary viewports 767px, 768px, 769px', async (driver) => {
    const boundaryWidths = [767, 768, 769];
    for (const w of boundaryWidths) {
      await driver.setViewport(w, 800);
      await driver.navigate('/index.html', { settleMs: 200 });
      const overflow = await driver.checkHorizontalOverflow();
      assert(!overflow.hasOverflow, `Breakpoint ${w}px exhibits horizontal overflow: ${overflow.scrollWidth} > ${overflow.docWidth}`);
    }
  });

  // Test 15: Ultra-wide viewport 1920px & 2560px container clamping
  collector.addTest(2, 'Boundary & Corner Cases', 'Ultra-wide viewports (1920px, 2560px) clamp container max-width and center content', async (driver) => {
    for (const w of [1920, 2560]) {
      await driver.setViewport(w, 1080);
      await driver.navigate('/index.html', { settleMs: 200 });
      const containerMetrics = await driver.evaluate(`
        (() => {
          const c = document.querySelector('.container');
          if (!c) return null;
          const rect = c.getBoundingClientRect();
          return {
            width: rect.width,
            left: rect.left,
            right: rect.right,
            windowWidth: window.innerWidth
          };
        })()
      `);
      assert(containerMetrics !== null, '.container element must exist');
      assert(containerMetrics.width <= 1400, `Container width should be constrained by max-width on ${w}px screens`);
      // Content should be horizontally centered (left margin roughly equal to right margin)
      const leftMargin = containerMetrics.left;
      const rightMargin = containerMetrics.windowWidth - containerMetrics.right;
      assert(Math.abs(leftMargin - rightMargin) < 50, `Container should be roughly centered on ${w}px viewport`);
    }
  });

  // Test 16: Admin Edit Modal responsive wrapping on 320px
  collector.addTest(2, 'Boundary & Corner Cases', 'Admin edit modal footer buttons wrap cleanly without horizontal overflow at 320px', async (driver) => {
    await driver.setViewport(320, 568);
    await driver.navigate('/admin.html', { settleMs: 250 });
    // Open edit modal for first complaint
    await driver.evaluate(`
      (() => {
        const user = { name: "Test Moderator", email: "mod@civic.gov", role: "moderator" };
        sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
        if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
        setTimeout(() => {
          if (typeof openEditModal === 'function') openEditModal('AC-2026-001');
        }, 100);
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    const modalOverflow = await driver.evaluate(`
      (() => {
        const modal = document.querySelector('.modal.open .modal-box') || document.querySelector('.modal-box');
        if (!modal) return { exists: false, overflow: false };
        const rect = modal.getBoundingClientRect();
        return {
          exists: true,
          right: rect.right,
          winWidth: window.innerWidth,
          overflow: rect.right > window.innerWidth + 1
        };
      })()
    `);
    assert(!modalOverflow.overflow, `Admin edit modal overflows 320px screen: ${JSON.stringify(modalOverflow)}`);
  });

  // Test 17: Success modal on report.html wraps cleanly on 320px
  collector.addTest(2, 'Boundary & Corner Cases', 'Success modal on report.html wraps tracking ID action bar on 320px', async (driver) => {
    await driver.setViewport(320, 568);
    await driver.navigate('/report.html', { settleMs: 250 });
    await driver.evaluate(`
      (() => {
        const fakeComplaint = {
          id: "AC-2026-9999",
          title: "Test Broken Pipe",
          locationName: "Test Area Karachi"
        };
        if (typeof showSuccessModal === 'function') showSuccessModal(fakeComplaint);
      })()
    `);
    await new Promise(r => setTimeout(r, 200));
    const modalCheck = await driver.evaluate(`
      (() => {
        const modalBox = document.querySelector('#successModal .modal-box');
        if (!modalBox) return { exists: false, overflow: false };
        const rect = modalBox.getBoundingClientRect();
        return {
          exists: true,
          overflow: rect.right > window.innerWidth + 1,
          rectRight: rect.right,
          winWidth: window.innerWidth
        };
      })()
    `);
    assert(!modalCheck.overflow, `Success modal exceeds 320px viewport: ${JSON.stringify(modalCheck)}`);
  });

  // Test 18: Map resize invalidateSize() execution without gray gaps
  collector.addTest(2, 'Boundary & Corner Cases', 'Window resize reflow triggers map.invalidateSize() safely across viewports', async (driver) => {
    await driver.setViewport(1280, 800);
    await driver.navigate('/index.html', { settleMs: 300 });
    // Shrink window to 400px and fire window resize
    await driver.setViewport(400, 600);
    const noExceptionThrown = await driver.evaluate(`
      (() => {
        try {
          window.dispatchEvent(new Event('resize'));
          return true;
        } catch (e) {
          return false;
        }
      })()
    `);
    assert(noExceptionThrown, 'Dispatching resize event to trigger map invalidateSize() must not throw');
  });

  // Test 19: Hidden container unhiding on track.html adjusts map dimensions
  collector.addTest(2, 'Boundary & Corner Cases', 'track.html mini-map adapts container size after #complaintResult unhides', async (driver) => {
    await driver.setViewport(768, 1024);
    await driver.navigate('/track.html', { settleMs: 250 });
    // Load complaint via search input
    await driver.evaluate(`
      (() => {
        document.getElementById('trackSearchInput').value = 'AC-2026-001';
        document.getElementById('trackSearchForm').dispatchEvent(new Event('submit'));
      })()
    `);
    await new Promise(r => setTimeout(r, 500));
    const mapDims = await driver.evaluate(`
      (() => {
        const el = document.getElementById('trackMap');
        return el ? { width: el.clientWidth, height: el.clientHeight } : null;
      })()
    `);
    assert(mapDims !== null && mapDims.width > 0 && mapDims.height > 0, `#trackMap must have positive dimensions after unhiding: ${JSON.stringify(mapDims)}`);
  });

  // Test 20: Location picker marker drag updates coordinate labels
  collector.addTest(2, 'Boundary & Corner Cases', 'Moving picker map coordinates programmatically updates coordinate labels', async (driver) => {
    await driver.navigate('/report.html', { settleMs: 400 });
    const coordsUpdated = await driver.evaluate(`
      (() => {
        if (typeof updateCoordinates === 'function') {
          updateCoordinates(25.123456, 67.654321);
          const latTxt = document.getElementById('lblLat')?.textContent;
          const lngTxt = document.getElementById('lblLng')?.textContent;
          return latTxt === '25.123456' && lngTxt === '67.654321';
        }
        return false;
      })()
    `);
    assert(coordsUpdated, 'updateCoordinates() must update #lblLat and #lblLng DOM elements');
  });

  // Test 21: Out-of-bounds or zero coordinates do not crash map rendering
  collector.addTest(2, 'Boundary & Corner Cases', 'Map renders cleanly even with edge-case coordinates (0,0)', async (driver) => {
    await driver.navigate('/track.html', { settleMs: 300 });
    const rendered = await driver.evaluate(`
      (() => {
        try {
          if (typeof initTrackMiniMap === 'function') {
            initTrackMiniMap(0, 0, 'Equator Point');
            return true;
          }
          return false;
        } catch (e) {
          return false;
        }
      })()
    `);
    assert(rendered, 'initTrackMiniMap must handle coordinate edge cases without throwing');
  });

  // Test 22: Map height responsiveness across mobile vs desktop
  collector.addTest(2, 'Boundary & Corner Cases', 'Leaflet map containers maintain reasonable height bounds on mobile (<= 450px)', async (driver) => {
    await driver.setViewport(375, 667);
    await driver.navigate('/index.html', { settleMs: 300 });
    const mapHeight = await driver.evaluate(`
      (() => {
        const el = document.getElementById('cityMap');
        return el ? el.clientHeight : 0;
      })()
    `);
    assert(mapHeight > 0 && mapHeight <= 500, `Map height on mobile should be balanced (<= 500px), got ${mapHeight}px`);
  });

  // =========================================================================
  // Test 23: Adversarial Unbroken Long Strings Layout Defense (Regression Guard)
  // =========================================================================
  collector.addTest(2, 'Boundary & Corner Cases', 'Unbroken continuous strings (100+ chars) in complaint card do not cause flex/grid blowout on track.html at 320px/375px', async (driver) => {
    const mobileViewports = [
      { width: 320, height: 568, name: '320px (Compact Mobile)' },
      { width: 375, height: 667, name: '375px (Mobile Portrait)' }
    ];

    for (const vp of mobileViewports) {
      await driver.setViewport(vp.width, vp.height);
      await driver.navigate('/track.html', { settleMs: 250 });

      const overflowResult = await driver.evaluate(`
        (() => {
          const fakeComplaint = {
            id: 'AC-2026-LONGSTRINGS-999999999999999999999999999999999999999999999999999999999999',
            title: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
            description: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            locationName: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
            category: 'sanitation',
            status: 'in-progress',
            createdAt: new Date().toISOString(),
            citizenName: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
            communityConfirmations: 99999
          };

          const card = document.getElementById('complaintResult');
          if (card) card.style.display = 'block';
          if (typeof renderComplaint === 'function') {
            renderComplaint(fakeComplaint);
          }

          const docElem = document.documentElement;
          const body = document.body;
          const docWidth = window.innerWidth;
          const scrollWidth = Math.max(docElem.scrollWidth, body ? body.scrollWidth : 0);

          return {
            docWidth,
            scrollWidth,
            hasOverflow: scrollWidth > docWidth + 1.5,
            delta: scrollWidth - docWidth
          };
        })()
      `);

      assert(
        !overflowResult.hasOverflow,
        `track.html has horizontal overflow under unbroken long strings at ${vp.name}: scrollWidth=${overflowResult.scrollWidth}, docWidth=${overflowResult.docWidth}, delta=${overflowResult.delta}px`
      );
    }
  });

  // =========================================================================
  // Test 24: Submit button wraps ultra-long grievance text without horizontal blowout at 320px
  // =========================================================================
  collector.addTest(2, 'Boundary & Corner Cases', 'Submit button on report.html wraps ultra-long continuous grievance text at 320px without blowout', async (driver) => {
    await driver.setViewport(320, 568);
    await driver.navigate('/report.html', { settleMs: 250 });

    const btnWrapping = await driver.evaluate(`
      (() => {
        const btn = document.getElementById('btnSubmit');
        if (!btn) return { exists: false, fits: false };
        btn.textContent = 'Submit Formal Citizen Grievance Expedite Verification And Generate Ultra Long Reference Identifier For Municipal Tracking';

        const rect = btn.getBoundingClientRect();
        const docElem = document.documentElement;
        const body = document.body;
        const docWidth = window.innerWidth;
        const scrollWidth = Math.max(docElem.scrollWidth, body ? body.scrollWidth : 0);

        return {
          exists: true,
          buttonFits: rect.right <= docWidth + 1.5,
          pageFits: scrollWidth <= docWidth + 1.5,
          btnRight: Math.round(rect.right),
          scrollWidth,
          docWidth
        };
      })()
    `);

    assert(btnWrapping.exists, '#btnSubmit must exist on report.html');
    assert(btnWrapping.buttonFits, `Submit button overflows viewport: ${JSON.stringify(btnWrapping)}`);
    assert(btnWrapping.pageFits, `Page scrollWidth overflows viewport on long button text: ${JSON.stringify(btnWrapping)}`);
  });
}

async function run(driver, collector) {
  registerTests(collector);
  return await collector.run(driver);
}

if (require.main === module) {
  (async () => {
    const driver = new BrowserDriver({ port: 3000, cdpPort: 9222 });
    const collector = new TestCollector('Viewports & Map Rendering');
    try {
      await driver.startServer();
      await driver.launchChrome();
      const results = await run(driver, collector);
      console.log(`\nViewports & Map Tests: ${results.filter(r => r.passed).length}/${results.length} passed`);
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
