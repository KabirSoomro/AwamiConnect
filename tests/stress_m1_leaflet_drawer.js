/**
 * Empirical Adversarial Stress Test Suite for Milestone 1
 * Targets:
 * 1. Mobile Navigation Drawer (hammering, escape, click-outside, cross-breakpoint resize)
 * 2. Leaflet Maps (#cityMap, #pickerMap, #trackMap)
 *    - Rapid show/hide and re-initialization
 *    - Rapid viewport resizes & invalidateSize
 *    - Mobile touch scroll trap mitigation
 *    - Extreme coordinates and filter stress
 *    - Tile container integrity and gray gap prevention
 */

const BrowserDriver = require('./browser_driver');
const { TestCollector, assert, assertEqual } = require('./test_helper');

async function runStressTests() {
  console.log('================================================================');
  console.log('🔥 Challenger M1-2: Leaflet Map & Interactive Drawer Stress Suite');
  console.log('================================================================\n');

  // Use distinct ports to avoid collision with standard test runs
  const driver = new BrowserDriver({ port: 3040, cdpPort: 9240 });
  const collector = new TestCollector('M1-2 Adversarial Stress Suite');

  try {
    await driver.startServer();
    await driver.launchChrome();
    console.log('✓ Headless Chrome CDP session connected on port 9240.\n');

    // -------------------------------------------------------------------------
    // TEST 1: Mobile Drawer Hammering (30 rapid clicks)
    // -------------------------------------------------------------------------
    collector.addTest(1, 'Drawer Hammering', 'Mobile menu toggle handles 30 rapid clicks without desynchronizing ARIA or classes', async (d) => {
      await d.setViewport(375, 667);
      await d.navigate('/index.html', { settleMs: 300 });

      const hammerResult = await d.evaluate(`
        (async () => {
          const btn = document.querySelector('.mobile-menu-btn');
          const navLinks = document.querySelector('.nav-links');
          if (!btn || !navLinks) return { error: 'Elements not found' };

          // Perform 30 rapid clicks
          for (let i = 0; i < 30; i++) {
            btn.click();
            await new Promise(r => setTimeout(r, 15));
          }

          // After 30 clicks (even number), drawer must be closed
          const closedState = {
            hasNavOpen: navLinks.classList.contains('nav-open'),
            hasOpen: navLinks.classList.contains('open'),
            ariaExpanded: btn.getAttribute('aria-expanded'),
            btnText: btn.textContent.trim(),
            computedDisplay: window.getComputedStyle(navLinks).display
          };

          // 31st click (odd) must open
          btn.click();
          await new Promise(r => setTimeout(r, 50));
          const openState = {
            hasNavOpen: navLinks.classList.contains('nav-open'),
            ariaExpanded: btn.getAttribute('aria-expanded'),
            btnText: btn.textContent.trim(),
            computedDisplay: window.getComputedStyle(navLinks).display
          };

          // 32nd click (even) must close again
          btn.click();
          await new Promise(r => setTimeout(r, 50));
          const finalClosedState = {
            hasNavOpen: navLinks.classList.contains('nav-open'),
            ariaExpanded: btn.getAttribute('aria-expanded'),
            btnText: btn.textContent.trim()
          };

          return { closedState, openState, finalClosedState };
        })()
      `);

      assert(!hammerResult.error, `Error during drawer hammer: ${hammerResult.error}`);
      assert(!hammerResult.closedState.hasNavOpen, 'Drawer should be closed after 30 clicks');
      assertEqual(hammerResult.closedState.ariaExpanded, 'false', 'aria-expanded should be false after 30 clicks');
      assertEqual(hammerResult.closedState.btnText, '☰', 'Button text should be ☰ when closed');
      assertEqual(hammerResult.closedState.computedDisplay, 'none', 'nav-links display should be none when closed');

      assert(hammerResult.openState.hasNavOpen, 'Drawer should be open after 31st click');
      assertEqual(hammerResult.openState.ariaExpanded, 'true', 'aria-expanded should be true after 31st click');
      assertEqual(hammerResult.openState.btnText, '✕', 'Button text should be ✕ when open');
      assertEqual(hammerResult.openState.computedDisplay, 'flex', 'nav-links display should be flex when open');

      assert(!hammerResult.finalClosedState.hasNavOpen, 'Drawer should return to closed after 32nd click');
      assertEqual(hammerResult.finalClosedState.btnText, '☰', 'Button text should reset to ☰');
    });

    // -------------------------------------------------------------------------
    // TEST 2: Keyboard Escape Closes Drawer & Refocuses Button
    // -------------------------------------------------------------------------
    collector.addTest(1, 'Drawer Escape Key', 'Pressing Escape closes mobile drawer and returns focus to menu button', async (d) => {
      await d.setViewport(375, 667);
      await d.navigate('/index.html', { settleMs: 300 });

      const escapeResult = await d.evaluate(`
        (() => {
          const btn = document.querySelector('.mobile-menu-btn');
          const navLinks = document.querySelector('.nav-links');
          // Open menu
          btn.click();
          const opened = navLinks.classList.contains('nav-open');

          // Dispatch Escape
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

          const closed = !navLinks.classList.contains('nav-open');
          const ariaExpanded = btn.getAttribute('aria-expanded');
          const btnText = btn.textContent.trim();
          const isFocused = document.activeElement === btn;

          return { opened, closed, ariaExpanded, btnText, isFocused };
        })()
      `);

      assert(escapeResult.opened, 'Menu should open on click');
      assert(escapeResult.closed, 'Menu should close on Escape key');
      assertEqual(escapeResult.ariaExpanded, 'false', 'aria-expanded should reset to false');
      assertEqual(escapeResult.btnText, '☰', 'Button text should reset to ☰');
      assert(escapeResult.isFocused, 'Menu button should receive focus after Escape');
    });

    // -------------------------------------------------------------------------
    // TEST 3: Click-Outside Backdrop Dismissal
    // -------------------------------------------------------------------------
    collector.addTest(1, 'Drawer Click Outside', 'Clicking outside mobile menu closes drawer, while clicking inside preserves it', async (d) => {
      await d.setViewport(375, 667);
      await d.navigate('/index.html', { settleMs: 300 });

      const clickOutsideResult = await d.evaluate(`
        (() => {
          const btn = document.querySelector('.mobile-menu-btn');
          const navLinks = document.querySelector('.nav-links');

          // Open drawer
          btn.click();
          const opened = navLinks.classList.contains('nav-open');

          // Click on document body (outside)
          document.body.click();
          const closedAfterOutsideClick = !navLinks.classList.contains('nav-open');

          // Re-open
          btn.click();
          // Click on navLinks container itself (not on an anchor)
          navLinks.click();
          const remainedOpenAfterInsideClick = navLinks.classList.contains('nav-open');

          return { opened, closedAfterOutsideClick, remainedOpenAfterInsideClick };
        })()
      `);

      assert(clickOutsideResult.opened, 'Menu should open initially');
      assert(clickOutsideResult.closedAfterOutsideClick, 'Menu should close when clicking outside');
      assert(clickOutsideResult.remainedOpenAfterInsideClick, 'Menu should remain open when clicking container background');
    });

    // -------------------------------------------------------------------------
    // TEST 4: Nav-link Selection Auto-Closes Mobile Menu
    // -------------------------------------------------------------------------
    collector.addTest(1, 'Drawer Link Click', 'Clicking navigation link inside mobile drawer closes the menu automatically', async (d) => {
      await d.setViewport(375, 667);
      await d.navigate('/index.html', { settleMs: 300 });

      const linkClickResult = await d.evaluate(`
        (() => {
          const btn = document.querySelector('.mobile-menu-btn');
          const navLinks = document.querySelector('.nav-links');
          const link = navLinks.querySelector('.nav-link');

          btn.click();
          const opened = navLinks.classList.contains('nav-open');

          // Click nav link
          link.click();
          const closed = !navLinks.classList.contains('nav-open');
          const ariaExpanded = btn.getAttribute('aria-expanded');

          return { opened, closed, ariaExpanded };
        })()
      `);

      assert(linkClickResult.opened, 'Menu should open initially');
      assert(linkClickResult.closed, 'Menu should close after link click');
      assertEqual(linkClickResult.ariaExpanded, 'false', 'aria-expanded should be false');
    });

    // -------------------------------------------------------------------------
    // TEST 5: Cross-Breakpoint Resize Stress (10 cycles: 375px <-> 1024px)
    // -------------------------------------------------------------------------
    collector.addTest(2, 'Breakpoint Cycling', 'Repeatedly crossing 768px breakpoint resets mobile drawer and preserves desktop navigation without style contamination', async (d) => {
      await d.setViewport(375, 667);
      await d.navigate('/index.html', { settleMs: 300 });
      for (let cycle = 0; cycle < 10; cycle++) {
        // Step A: Mobile - Open Drawer
        await d.setViewport(375, 667);
        await d.evaluate(`
          (() => {
            const btn = document.querySelector('.mobile-menu-btn');
            const navLinks = document.querySelector('.nav-links');
            if (!navLinks.classList.contains('nav-open')) btn.click();
            window.dispatchEvent(new Event('resize'));
          })()
        `);

        // Step B: Desktop - Expand to 1024px
        await d.setViewport(1024, 768);
        const desktopState = await d.evaluate(`
          (() => {
            window.dispatchEvent(new Event('resize'));
            const btn = document.querySelector('.mobile-menu-btn');
            const navLinks = document.querySelector('.nav-links');
            const btnStyle = window.getComputedStyle(btn);
            const navStyle = window.getComputedStyle(navLinks);
            return {
              hasNavOpen: navLinks.classList.contains('nav-open'),
              ariaExpanded: btn.getAttribute('aria-expanded'),
              btnDisplay: btnStyle.display,
              navDisplay: navStyle.display,
              hasInlineDisplay: Boolean(navLinks.style.display)
            };
          })()
        `);

        assert(!desktopState.hasNavOpen, `Cycle ${cycle}: nav-open class must be stripped on desktop`);
        assertEqual(desktopState.ariaExpanded, 'false', `Cycle ${cycle}: aria-expanded must be false on desktop`);
        assertEqual(desktopState.btnDisplay, 'none', `Cycle ${cycle}: mobile menu button must be hidden on desktop`);
        assertEqual(desktopState.navDisplay, 'flex', `Cycle ${cycle}: desktop navigation links must be display: flex`);
        assert(!desktopState.hasInlineDisplay, `Cycle ${cycle}: navLinks must not have contaminated inline style.display`);
      }
    });

    // -------------------------------------------------------------------------
    // TEST 6: Mobile Drawer Uniformity Across All 4 Pages
    // -------------------------------------------------------------------------
    collector.addTest(2, 'Drawer All Pages', 'Mobile menu toggle works identically across report.html, track.html, and admin.html', async (d) => {
      await d.setViewport(375, 667);
      const testPages = ['/report.html', '/track.html', '/admin.html'];

      for (const page of testPages) {
        await d.navigate(page, { settleMs: 250 });
        const res = await d.evaluate(`
          (() => {
            const btn = document.querySelector('.mobile-menu-btn');
            const navLinks = document.querySelector('.nav-links');
            if (!btn || !navLinks) return { error: 'Missing nav elements on ' + location.pathname };

            btn.click();
            const openOk = navLinks.classList.contains('nav-open') && btn.getAttribute('aria-expanded') === 'true';

            btn.click();
            const closeOk = !navLinks.classList.contains('nav-open') && btn.getAttribute('aria-expanded') === 'false';

            return { openOk, closeOk };
          })()
        `);

        assert(!res.error, res.error);
        assert(res.openOk, `${page} mobile drawer failed to open`);
        assert(res.closeOk, `${page} mobile drawer failed to close`);
      }
    });

    // -------------------------------------------------------------------------
    // TEST 7: #cityMap Rapid Window Resizes (20 rapid cycles)
    // -------------------------------------------------------------------------
    collector.addTest(2, 'CityMap Resize Stress', '#cityMap handles 20 rapid viewport shifts without throwing or losing container dimensions', async (d) => {
      await d.navigate('/index.html', { settleMs: 400 });
      const viewports = [
        [320, 568], [768, 1024], [1440, 900], [375, 667], [1024, 768]
      ];

      for (let i = 0; i < 20; i++) {
        const vp = viewports[i % viewports.length];
        await d.setViewport(vp[0], vp[1]);
        const check = await d.evaluate(`
          (() => {
            try {
              window.dispatchEvent(new Event('resize'));
              const el = document.getElementById('cityMap');
              if (!el) return { error: 'cityMap not found' };
              return {
                w: el.clientWidth,
                h: el.clientHeight,
                isLeaflet: el.classList.contains('leaflet-container')
              };
            } catch (err) {
              return { error: err.message };
            }
          })()
        `);

        assert(!check.error, `Resize cycle ${i} threw error: ${check.error}`);
        assert(check.w > 0 && check.h > 0, `cityMap lost dimensions on cycle ${i}: ${JSON.stringify(check)}`);
        assert(check.isLeaflet, 'cityMap must maintain leaflet-container class');
      }
    });

    // -------------------------------------------------------------------------
    // TEST 8: #cityMap Mobile Touch Scroll Trap Mitigation
    // -------------------------------------------------------------------------
    collector.addTest(2, 'CityMap Touch Trap', '#cityMap disables dragging on mobile <= 768px until user taps map, avoiding touch scroll trapping', async (d) => {
      await d.setViewport(375, 667);
      await d.navigate('/index.html', { settleMs: 400 });

      const touchState = await d.evaluate(`
        (() => {
          if (!mapInstance) return { error: 'mapInstance not defined' };
          const initialDragging = mapInstance.dragging.enabled();

          // Simulate user click/tap on map container
          const mapEl = document.getElementById('cityMap');
          mapEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          const afterTapDragging = mapInstance.dragging.enabled();

          return { initialDragging, afterTapDragging };
        })()
      `);

      assert(!touchState.error, touchState.error);
      assert(!touchState.initialDragging, '#cityMap dragging must be disabled on mobile by default to prevent scroll trap');
      assert(touchState.afterTapDragging, '#cityMap dragging must be enabled after intentional tap');
    });

    // -------------------------------------------------------------------------
    // TEST 9: #cityMap Rapid Filter Toggling
    // -------------------------------------------------------------------------
    collector.addTest(2, 'CityMap Filter Stress', '#cityMap handles 20 rapid status filter switches without layer errors', async (d) => {
      await d.setViewport(1024, 768);
      await d.navigate('/index.html', { settleMs: 400 });

      const filterStressResult = await d.evaluate(`
        (() => {
          const filter = document.getElementById('mapStatusFilter');
          if (!filter) return { error: 'mapStatusFilter not found' };

          const statuses = ['all', 'submitted', 'assigned', 'resolved'];
          try {
            for (let i = 0; i < 20; i++) {
              filter.value = statuses[i % statuses.length];
              filter.dispatchEvent(new Event('change'));
            }
            // Settle on resolved
            filter.value = 'resolved';
            filter.dispatchEvent(new Event('change'));

            const markerCount = markersLayer ? markersLayer.getLayers().length : 0;
            return { success: true, markerCount };
          } catch (e) {
            return { error: e.message };
          }
        })()
      `);

      assert(!filterStressResult.error, `Filter stress threw error: ${filterStressResult.error}`);
      assert(filterStressResult.success, 'Filter stress test should complete successfully');
      assert(filterStressResult.markerCount >= 0, 'Markers should be queryable after stress filtering');
    });

    // -------------------------------------------------------------------------
    // TEST 10: #cityMap Repeated Teardown and Re-initialization
    // -------------------------------------------------------------------------
    collector.addTest(2, 'CityMap Reinit Guard', 'initCityMap cleanly tears down previous instance and does not throw already initialized error', async (d) => {
      await d.navigate('/index.html', { settleMs: 400 });

      const reinitResult = await d.evaluate(`
        (() => {
          try {
            for (let i = 0; i < 5; i++) {
              initCityMap(allComplaints);
            }
            return {
              success: true,
              isLeaflet: document.getElementById('cityMap')?.classList.contains('leaflet-container')
            };
          } catch (e) {
            return { error: e.message };
          }
        })()
      `);

      assert(!reinitResult.error, `Repeated initCityMap threw error: ${reinitResult.error}`);
      assert(reinitResult.isLeaflet, '#cityMap should remain a valid Leaflet container after repeated init');
    });

    // -------------------------------------------------------------------------
    // TEST 11: #pickerMap Boundary Coordinates & Repeated Inits
    // -------------------------------------------------------------------------
    collector.addTest(2, 'PickerMap Extreme Coords', '#pickerMap handles boundary & negative coordinates cleanly and supports repeated inits', async (d) => {
      await d.setViewport(768, 1024);
      await d.navigate('/report.html', { settleMs: 400 });

      const pickerStress = await d.evaluate(`
        (() => {
          try {
            const testCoords = [
              [0, 0],
              [-33.8688, 151.2093],
              [89.9999, 179.9999],
              [-89.9999, -179.9999],
              [24.8607, 67.0011]
            ];

            for (const [lat, lng] of testCoords) {
              updateCoordinates(lat, lng);
              const latTxt = document.getElementById('lblLat')?.textContent;
              const lngTxt = document.getElementById('lblLng')?.textContent;
              if (latTxt.includes('NaN') || lngTxt.includes('NaN')) {
                return { error: 'NaN encountered in coordinate label' };
              }
            }

            // Test 5 repeated inits
            for (let i = 0; i < 5; i++) {
              initPickerMap();
            }

            const mapEl = document.getElementById('pickerMap');
            return {
              success: true,
              width: mapEl ? mapEl.clientWidth : 0,
              height: mapEl ? mapEl.clientHeight : 0,
              isLeaflet: mapEl ? mapEl.classList.contains('leaflet-container') : false
            };
          } catch (e) {
            return { error: e.message };
          }
        })()
      `);

      assert(!pickerStress.error, `Picker stress test failed: ${pickerStress.error}`);
      assert(pickerStress.success, 'Picker stress should succeed');
      assert(pickerStress.width > 0 && pickerStress.height > 0, 'pickerMap should retain positive dimensions');
      assert(pickerStress.isLeaflet, 'pickerMap must remain a valid Leaflet container');
    });

    // -------------------------------------------------------------------------
    // TEST 12: #trackMap Hidden Container Sizing & Rapid Lookups
    // -------------------------------------------------------------------------
    collector.addTest(2, 'TrackMap Hidden Lifecycle', '#trackMap initializes non-zero dimensions after unhiding and handles rapid ticket lookups', async (d) => {
      await d.setViewport(768, 1024);
      await d.navigate('/track.html', { settleMs: 300 });

      const trackStress = await d.evaluate(`
        (async () => {
          try {
            const resultCard = document.getElementById('complaintResult');
            const beforeDisplay = window.getComputedStyle(resultCard).display;

            // Look up complaint AC-2026-001
            document.getElementById('trackSearchInput').value = 'AC-2026-001';
            document.getElementById('trackSearchForm').dispatchEvent(new Event('submit'));
            await new Promise(r => setTimeout(r, 400));

            const mapEl = document.getElementById('trackMap');
            const afterDisplay = window.getComputedStyle(resultCard).display;
            const dimsAfterSearch = {
              w: mapEl.clientWidth,
              h: mapEl.clientHeight,
              isLeaflet: mapEl.classList.contains('leaflet-container')
            };

            // Stress rapid lookups
            const ticketIds = ['AC-2026-002', 'AC-2026-003', 'AC-INVALID-999', 'AC-2026-001'];
            for (const tid of ticketIds) {
              document.getElementById('trackSearchInput').value = tid;
              document.getElementById('trackSearchForm').dispatchEvent(new Event('submit'));
              await new Promise(r => setTimeout(r, 150));
            }
            await new Promise(r => setTimeout(r, 300));

            const finalMapEl = document.getElementById('trackMap');
            const finalDims = {
              w: finalMapEl.clientWidth,
              h: finalMapEl.clientHeight,
              isLeaflet: finalMapEl.classList.contains('leaflet-container')
            };

            return { beforeDisplay, afterDisplay, dimsAfterSearch, finalDims };
          } catch (e) {
            return { error: e.message };
          }
        })()
      `);

      assert(!trackStress.error, `Track stress failed: ${trackStress.error}`);
      assertEqual(trackStress.beforeDisplay, 'none', 'Complaint result should be hidden before search');
      assertEqual(trackStress.afterDisplay, 'block', 'Complaint result should be block after search');
      assert(trackStress.dimsAfterSearch.w > 0 && trackStress.dimsAfterSearch.h > 0, '#trackMap must measure non-zero dimensions after unhiding');
      assert(trackStress.dimsAfterSearch.isLeaflet, '#trackMap must have leaflet-container class');
      assert(trackStress.finalDims.w > 0 && trackStress.finalDims.h > 0, '#trackMap must retain positive dimensions after rapid ticket lookups');
    });

    // -------------------------------------------------------------------------
    // TEST 13: Gray Gap Elimination & Fallback Background Verification
    // -------------------------------------------------------------------------
    collector.addTest(2, 'Gray Gap Mitigation', 'Leaflet map containers declare explicit neutral background (#f1f5f9) and prevent gray gap voids', async (d) => {
      const mapsToCheck = [
        { page: '/index.html', selector: '#cityMap' },
        { page: '/report.html', selector: '#pickerMap' },
        { page: '/track.html?id=AC-2026-001', selector: '#trackMap' }
      ];

      for (const m of mapsToCheck) {
        await d.navigate(m.page, { settleMs: 350 });
        const bgCheck = await d.evaluate(`
          (() => {
            const el = document.querySelector('${m.selector}');
            if (!el) return { error: 'Element ${m.selector} not found' };
            const style = window.getComputedStyle(el);
            return {
              bgColor: style.backgroundColor,
              w: el.clientWidth,
              h: el.clientHeight,
              overflow: style.overflow
            };
          })()
        `);

        assert(!bgCheck.error, bgCheck.error);
        assert(bgCheck.w > 0 && bgCheck.h > 0, `${m.selector} must have positive dimensions`);
        // rgb(241, 245, 249) is #f1f5f9
        assert(
          bgCheck.bgColor === 'rgb(241, 245, 249)' || bgCheck.bgColor.includes('241'),
          `${m.selector} background-color should be styled as #f1f5f9 (got ${bgCheck.bgColor}) to prevent black/gray tile voids`
        );
      }
    });

    // Run all tests in collector
    const results = await collector.run(driver);

    console.log('\n================================================================');
    console.log('📊 CHALLENGER M1-2 EMPIRICAL STRESS TEST RESULTS');
    console.log('================================================================');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`Total Stress Tests : ${results.length}`);
    console.log(`Passed             : ${passed}`);
    console.log(`Failed             : ${failed}`);
    console.log(`Success Rate       : ${((passed / results.length) * 100).toFixed(1)}%\n`);

    results.forEach((r, idx) => {
      console.log(`  ${r.passed ? '✓' : '✗'} [Tier ${r.tier}] ${r.name} (${r.durationMs}ms)`);
      if (!r.passed) {
        console.log(`      Error: ${r.error}`);
      }
    });

    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);

  } catch (err) {
    console.error('Fatal stress suite error:', err);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

if (require.main === module) {
  runStressTests();
}

module.exports = { runStressTests };
