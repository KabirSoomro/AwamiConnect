/**
 * Milestone 1 Empirical Challenger Stress Test Suite
 * Conducts exhaustive adversarial overflow and boundary testing across:
 * - 14 viewports: 319px, 320px, 360px, 375px, 414px, 767px, 768px, 769px, 820px, 900px, 1024px, 1440px, 1920px, 2560px
 * - 4 pages: index.html, report.html, track.html, admin.html
 * - Interactive states: Modals open, mobile nav drawer open/closed, admin logged-in table
 * - Component level: cards, modals, buttons, navbar, timeline, tables, badges
 * - Adversarial edge cases: unbroken 120-char strings, long button text, rapid resize reflow
 */

const BrowserDriver = require('./browser_driver');

const VIEWPORTS = [
  { width: 319, height: 568, name: '319px (Sub-compact Edge Case)' },
  { width: 320, height: 568, name: '320px (Compact Mobile / iPhone SE1)' },
  { width: 360, height: 640, name: '360px (Standard Android Compact)' },
  { width: 375, height: 667, name: '375px (iPhone 8 / SE2)' },
  { width: 414, height: 896, name: '414px (Large Mobile / iPhone Plus)' },
  { width: 767, height: 1024, name: '767px (Breakpoint -1px Mobile Drawer)' },
  { width: 768, height: 1024, name: '768px (Tablet Portrait Boundary)' },
  { width: 769, height: 1024, name: '769px (Breakpoint +1px Desktop Nav)' },
  { width: 820, height: 1180, name: '820px (iPad Air Portrait)' },
  { width: 900, height: 1200, name: '900px (Intermediate Breakpoint Boundary)' },
  { width: 1024, height: 768, name: '1024px (Tablet Landscape / Small Desktop)' },
  { width: 1440, height: 900, name: '1440px (Standard Desktop)' },
  { width: 1920, height: 1080, name: '1920px (Full HD 1080p)' },
  { width: 2560, height: 1440, name: '2560px (2K QHD Ultra-wide)' }
];

const PAGES = [
  { path: '/index.html', name: 'Citizen Landing Portal (index.html)' },
  { path: '/report.html', name: 'Complaint Filing Form (report.html)' },
  { path: '/track.html?id=AC-2026-001', name: 'Complaint Tracking Details (track.html)' },
  { path: '/admin.html', name: 'Admin Dashboard Login & Portal (admin.html)' }
];

class ChallengerStressRunner {
  constructor(port = 3010, cdpPort = 9230) {
    this.driver = new BrowserDriver({ port, cdpPort });
    this.results = [];
    this.failures = [];
  }

  logResult(category, testName, passed, details = {}) {
    const record = { category, testName, passed, details, timestamp: new Date().toISOString() };
    this.results.push(record);
    if (!passed) {
      this.failures.push(record);
      console.log(`❌ FAIL [${category}] ${testName}`);
      if (details.error) console.log(`   Error: ${details.error}`);
      if (details.overflowing) console.log(`   Overflowing Elements:`, JSON.stringify(details.overflowing, null, 2));
    } else {
      console.log(`✓ PASS [${category}] ${testName}`);
    }
  }

  async runAll() {
    console.log('================================================================');
    console.log('⚔️  CHALLENGER M1-1: ADVERSARIAL VIEWPORT & OVERFLOW HARNESS');
    console.log('================================================================');
    console.log(`Targeting 14 viewports: ${VIEWPORTS.map(v => v.width + 'px').join(', ')}`);
    console.log(`Targeting 4 pages across static, modal, and edge-case states\n`);

    await this.driver.startServer();
    await this.driver.launchChrome();

    try {
      // PHASE 1: Full Matrix (14 viewports x 4 pages = 56 evaluations)
      await this.testViewportMatrix();

      // PHASE 2: Navigation Drawer States across all mobile viewports
      await this.testNavigationDrawerStates();

      // PHASE 3: Modal Dialog Overflows (Report Success Modal & Admin Edit Modal)
      await this.testModalOverflows();

      // PHASE 4: Component-level scrollWidth <= clientWidth
      await this.testComponentScrollWidth();

      // PHASE 5: Adversarial Unbroken Long Strings & Button Wrapping Stress
      await this.testAdversarialLongStringsAndWrapping();

      // PHASE 6: Dynamic Window Resizing Reflow & Map Invalidation
      await this.testDynamicResizeReflow();

    } catch (err) {
      console.error('Fatal stress test error:', err);
    } finally {
      await this.driver.close();
    }

    this.printSummary();
    return this.failures.length === 0;
  }

  // --------------------------------------------------------------------------
  // Phase 1: Exhaustive Viewport Matrix
  // --------------------------------------------------------------------------
  async testViewportMatrix() {
    console.log('\n--- Phase 1: Exhaustive Viewport Matrix (14 Viewports x 4 Pages) ---');
    for (const page of PAGES) {
      for (const vp of VIEWPORTS) {
        await this.driver.setViewport(vp.width, vp.height);
        await this.driver.navigate(page.path, { settleMs: 250 });

        // If admin.html, also test with logged-in admin portal state
        if (page.path === '/admin.html') {
          await this.driver.evaluate(`
            (() => {
              const user = { name: "Adversarial Verifier", email: "audit@civic.gov", role: "admin" };
              sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
              if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
            })()
          `);
          await new Promise(r => setTimeout(r, 200));
        }

        const overflow = await this.driver.checkHorizontalOverflow();
        const passed = !overflow.hasOverflow;
        this.logResult(
          'Phase 1: Viewport Matrix',
          `${page.name} @ ${vp.name}`,
          passed,
          {
            docWidth: overflow.docWidth,
            scrollWidth: overflow.scrollWidth,
            overflowDelta: overflow.overflowDelta,
            overflowing: overflow.overflowingElements
          }
        );
      }
    }
  }

  // --------------------------------------------------------------------------
  // Phase 2: Navigation Drawer States
  // --------------------------------------------------------------------------
  async testNavigationDrawerStates() {
    console.log('\n--- Phase 2: Navigation Drawer States (Open & Closed at Mobile Viewports) ---');
    const mobileViewports = VIEWPORTS.filter(v => v.width <= 768);

    for (const vp of mobileViewports) {
      await this.driver.setViewport(vp.width, vp.height);
      await this.driver.navigate('/index.html', { settleMs: 200 });

      // 1. Open mobile menu
      const openResult = await this.driver.evaluate(`
        (() => {
          const btn = document.querySelector('.mobile-menu-btn');
          const navLinks = document.querySelector('.nav-links');
          if (!btn || !navLinks) return { error: 'Nav elements missing' };
          btn.click();
          const rect = navLinks.getBoundingClientRect();
          const hasOpenClass = navLinks.classList.contains('nav-open') || navLinks.classList.contains('open');
          const isAriaExpanded = btn.getAttribute('aria-expanded') === 'true';
          const overflowsViewport = rect.right > window.innerWidth + 1.5;
          return {
            hasOpenClass,
            isAriaExpanded,
            width: rect.width,
            right: rect.right,
            winWidth: window.innerWidth,
            overflowsViewport
          };
        })()
      `);

      this.logResult(
        'Phase 2: Nav Drawer Open',
        `Nav drawer open @ ${vp.name}`,
        openResult.hasOpenClass && !openResult.overflowsViewport,
        openResult
      );

      // 2. Check document overflow with menu open
      const overflowWithMenu = await this.driver.checkHorizontalOverflow();
      this.logResult(
        'Phase 2: Nav Drawer Open Doc Overflow',
        `Page scrollWidth <= clientWidth with nav open @ ${vp.name}`,
        !overflowWithMenu.hasOverflow,
        overflowWithMenu
      );

      // 3. Close mobile menu
      const closeResult = await this.driver.evaluate(`
        (() => {
          const btn = document.querySelector('.mobile-menu-btn');
          const navLinks = document.querySelector('.nav-links');
          btn.click();
          const isAriaExpanded = btn.getAttribute('aria-expanded') === 'true';
          const hasOpenClass = navLinks.classList.contains('nav-open') || navLinks.classList.contains('open');
          return { isAriaExpanded, hasOpenClass };
        })()
      `);

      this.logResult(
        'Phase 2: Nav Drawer Close',
        `Nav drawer closes cleanly @ ${vp.name}`,
        !closeResult.isAriaExpanded && !closeResult.hasOpenClass,
        closeResult
      );
    }
  }

  // --------------------------------------------------------------------------
  // Phase 3: Modal Dialog Overflows
  // --------------------------------------------------------------------------
  async testModalOverflows() {
    console.log('\n--- Phase 3: Modal Dialog Overflows (Report Success Modal & Admin Edit Modal) ---');
    const criticalViewports = [319, 320, 360, 375, 414, 768, 1024];

    for (const w of criticalViewports) {
      await this.driver.setViewport(w, 700);

      // Test 3A: Report Success Modal
      await this.driver.navigate('/report.html', { settleMs: 250 });
      const reportModalCheck = await this.driver.evaluate(`
        (() => {
          const fakeComplaint = {
            id: 'AC-2026-STRESS-9999',
            title: 'Overflow Stress Verification Incident Involving Extremely Long Municipal Department Names and References',
            locationName: 'Sector 5-A/2 Near Community Center Buffer Zone Karachi'
          };
          if (typeof showSuccessModal === 'function') {
            showSuccessModal(fakeComplaint);
          }
          const modalBox = document.querySelector('#successModal .modal-box') || document.querySelector('.modal-box');
          if (!modalBox) return { exists: false };
          const rect = modalBox.getBoundingClientRect();
          const docElem = document.documentElement;
          const body = document.body;
          const docWidth = window.innerWidth;
          const scrollWidth = Math.max(docElem.scrollWidth, body ? body.scrollWidth : 0);

          return {
            exists: true,
            boxWidth: Math.round(rect.width),
            boxRight: Math.round(rect.right),
            winWidth: docWidth,
            scrollWidth: scrollWidth,
            modalOverflows: rect.right > docWidth + 1.5,
            pageOverflows: scrollWidth > docWidth + 1.5
          };
        })()
      `);

      this.logResult(
        'Phase 3: Success Modal',
        `Success modal fits within viewport @ ${w}px`,
        reportModalCheck.exists && !reportModalCheck.modalOverflows && !reportModalCheck.pageOverflows,
        reportModalCheck
      );

      // Test 3B: Admin Edit Modal
      await this.driver.navigate('/admin.html', { settleMs: 250 });
      const adminModalCheck = await this.driver.evaluate(`
        (() => {
          const user = { name: "Admin Tester", email: "admin@gov.pk", role: "admin" };
          sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
          if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
          if (typeof openEditModal === 'function') openEditModal('AC-2026-001');

          const modalBox = document.querySelector('#editModal .modal-box') || document.querySelector('.modal-box');
          if (!modalBox) return { exists: false };
          const rect = modalBox.getBoundingClientRect();
          const docWidth = window.innerWidth;
          const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0);
          
          // Check footer buttons inside modal
          const btns = modalBox.querySelectorAll('button, .btn');
          const btnOverflows = [];
          for (const b of btns) {
            const bRect = b.getBoundingClientRect();
            if (bRect.right > rect.right + 2) {
              btnOverflows.push({ text: b.textContent.trim(), right: bRect.right, boxRight: rect.right });
            }
          }

          return {
            exists: true,
            boxWidth: Math.round(rect.width),
            boxRight: Math.round(rect.right),
            winWidth: docWidth,
            scrollWidth: scrollWidth,
            modalOverflows: rect.right > docWidth + 1.5,
            pageOverflows: scrollWidth > docWidth + 1.5,
            btnOverflows
          };
        })()
      `);

      this.logResult(
        'Phase 3: Admin Edit Modal',
        `Admin edit modal & action buttons fit within viewport @ ${w}px`,
        adminModalCheck.exists && !adminModalCheck.modalOverflows && !adminModalCheck.pageOverflows && (adminModalCheck.btnOverflows || []).length === 0,
        adminModalCheck
      );
    }
  }

  // --------------------------------------------------------------------------
  // Phase 4: Component-level scrollWidth <= clientWidth
  // --------------------------------------------------------------------------
  async testComponentScrollWidth() {
    console.log('\n--- Phase 4: Component-Level scrollWidth <= clientWidth Checks ---');
    const testCases = [
      { url: '/index.html', viewports: [319, 320, 375, 768, 1024] },
      { url: '/report.html', viewports: [319, 320, 375, 768, 1024] },
      { url: '/track.html?id=AC-2026-001', viewports: [319, 320, 375, 768, 1024] },
      { url: '/admin.html', viewports: [319, 320, 375, 768, 1024] }
    ];

    for (const tc of testCases) {
      for (const w of tc.viewports) {
        await this.driver.setViewport(w, 800);
        await this.driver.navigate(tc.url, { settleMs: 300 });

        if (tc.url === '/admin.html') {
          await this.driver.evaluate(`
            (() => {
              const user = { name: "Inspector", email: "inspector@gov.pk", role: "moderator" };
              sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
              if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
            })()
          `);
          await new Promise(r => setTimeout(r, 200));
        }

        const componentChecks = await this.driver.evaluate(`
          (() => {
            const selectors = ['.navbar', '.container', '.card', '.btn', '.timeline', '.map-container'];
            const violations = [];

            for (const sel of selectors) {
              const elements = document.querySelectorAll(sel);
              for (const el of elements) {
                if (el.offsetWidth === 0 || el.offsetHeight === 0) continue;
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') continue;

                // Elements inside an intentional horizontally scrollable wrapper (like .table-responsive)
                // scroll within that container; check the container itself, not individual table row buttons
                if (el.closest('.table-responsive') && el !== el.closest('.table-responsive')) continue;

                const rect = el.getBoundingClientRect();
                if (rect.right > window.innerWidth + 1.5) {
                  violations.push({
                    selector: sel,
                    className: el.className,
                    id: el.id,
                    right: Math.round(rect.right),
                    winWidth: window.innerWidth,
                    delta: Math.round(rect.right - window.innerWidth)
                  });
                }
              }
            }

            return violations;
          })()
        `);

        this.logResult(
          'Phase 4: Component Bounding',
          `All cards, buttons, navbar, containers fit bounds on ${tc.url} @ ${w}px`,
          componentChecks.length === 0,
          { violations: componentChecks }
        );
      }
    }
  }

  // --------------------------------------------------------------------------
  // Phase 5: Adversarial Unbroken Long Strings & Button Wrapping Stress
  // --------------------------------------------------------------------------
  async testAdversarialLongStringsAndWrapping() {
    console.log('\n--- Phase 5: Adversarial Unbroken Long Strings & Button Wrapping Stress ---');
    const stressViewports = [319, 320, 360, 375];

    for (const w of stressViewports) {
      await this.driver.setViewport(w, 750);

      // 5A. Unbroken 100+ char string inside complaint card on track.html
      await this.driver.navigate('/track.html', { settleMs: 250 });
      const stringStressResult = await this.driver.evaluate(`
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

          if (typeof renderComplaint === 'function') {
            const card = document.getElementById('complaintResult');
            if (card) card.style.display = 'block';
            renderComplaint(fakeComplaint);
          }

          const docWidth = window.innerWidth;
          const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0);
          
          return {
            docWidth,
            scrollWidth,
            hasOverflow: scrollWidth > docWidth + 1.5,
            delta: scrollWidth - docWidth
          };
        })()
      `);

      this.logResult(
        'Phase 5: Unbroken Long Strings',
        `Unbroken 100-char strings do not cause overflow on track.html @ ${w}px`,
        !stringStressResult.hasOverflow,
        stringStressResult
      );

      // 5B. Ultra-long button label wrapping
      await this.driver.navigate('/report.html', { settleMs: 250 });
      const buttonWrappingResult = await this.driver.evaluate(`
        (() => {
          const btn = document.getElementById('btnSubmit');
          if (!btn) return { exists: false };
          btn.textContent = 'Submit Formal Citizen Grievance, Expedite Verification And Generate Ultra Long Reference Identifier For Municipal Tracking';
          
          const rect = btn.getBoundingClientRect();
          const docWidth = window.innerWidth;
          const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0);

          return {
            exists: true,
            btnRight: Math.round(rect.right),
            docWidth,
            scrollWidth,
            buttonFits: rect.right <= docWidth + 1.5,
            pageFits: scrollWidth <= docWidth + 1.5
          };
        })()
      `);

      this.logResult(
        'Phase 5: Button Wrapping Stress',
        `Ultra-long button text wraps without exceeding page width on report.html @ ${w}px`,
        buttonWrappingResult.exists && buttonWrappingResult.buttonFits && buttonWrappingResult.pageFits,
        buttonWrappingResult
      );
    }
  }

  // --------------------------------------------------------------------------
  // Phase 6: Dynamic Window Resizing Reflow & Map Invalidation
  // --------------------------------------------------------------------------
  async testDynamicResizeReflow() {
    console.log('\n--- Phase 6: Dynamic Window Resizing Reflow & Map Invalidation ---');
    const resizeSteps = [
      { from: 1440, to: 320, label: 'Desktop (1440px) -> Mobile (320px)' },
      { from: 320, to: 768, label: 'Mobile (320px) -> Tablet (768px)' },
      { from: 768, to: 769, label: 'Tablet (768px) -> Desktop transition (769px)' },
      { from: 769, to: 820, label: 'Transition (769px) -> iPad (820px)' },
      { from: 820, to: 1920, label: 'iPad (820px) -> Full HD (1920px)' }
    ];

    await this.driver.setViewport(1440, 900);
    await this.driver.navigate('/index.html', { settleMs: 300 });

    for (const step of resizeSteps) {
      await this.driver.setViewport(step.to, 800);
      // Wait for resize handlers and microtasks
      await new Promise(r => setTimeout(r, 200));

      const reflowCheck = await this.driver.evaluate(`
        (() => {
          const docWidth = window.innerWidth;
          const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0);
          const map = document.getElementById('cityMap');
          const mapWidth = map ? map.clientWidth : 0;
          const mapHeight = map ? map.clientHeight : 0;

          return {
            docWidth,
            scrollWidth,
            hasOverflow: scrollWidth > docWidth + 1.5,
            mapWidth,
            mapHeight
          };
        })()
      `);

      this.logResult(
        'Phase 6: Dynamic Resize Reflow',
        `Dynamic resize ${step.label} maintains zero overflow and map dimensions`,
        !reflowCheck.hasOverflow && reflowCheck.mapWidth > 0 && reflowCheck.mapHeight > 0,
        reflowCheck
      );
    }
  }

  printSummary() {
    console.log('\n================================================================');
    console.log('📊 CHALLENGER M1-1 STRESS TEST EXECUTION SUMMARY');
    console.log('================================================================');
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.failures.length;

    console.log(`Total Stress Checks Executed : ${total}`);
    console.log(`Passed                       : ${passed}`);
    console.log(`Failed                       : ${failed}`);
    console.log(`Pass Rate                    : ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ DETAILED FAILURE LIST:');
      this.failures.forEach((f, i) => {
        console.log(`  ${i + 1}. [${f.category}] ${f.testName}`);
        console.log(`     Details:`, JSON.stringify(f.details, null, 2));
      });
      console.log('\n⚖️  CHALLENGER VERDICT: REQUEST_CHANGES');
    } else {
      console.log('\n✅ ALL 14 VIEWPORTS, MODALS, BUTTONS, AND STRESS CASES PASSED EMPIRICALLY!');
      console.log('⚖️  CHALLENGER VERDICT: APPROVE');
    }
    console.log('================================================================\n');
  }
}

if (require.main === module) {
  (async () => {
    const runner = new ChallengerStressRunner(3010, 9230);
    const success = await runner.runAll();
    process.exit(success ? 0 : 1);
  })();
}

module.exports = ChallengerStressRunner;
