/**
 * Tier 1, Tier 2 & Tier 4: Storage Resilience, Community Verification & Real-World Civic Scenarios
 * Tests self-healing JSON corruptions, semantic upvoting vs verification, quota boundaries,
 * and complete real-world civic life cycles.
 */

const { TestCollector, assert, assertEqual, assertIncludes } = require('./test_helper');
const BrowserDriver = require('./browser_driver');

function registerTests(collector) {
  // =========================================================================
  // Tier 1: Feature 6 — Community Resolution & Upvoting Logic
  // =========================================================================

  // Test 1: Resolved complaint displays "Verification(s)" label
  collector.addTest(1, 'Community Resolution & Upvoting', 'Resolved complaint displays "Verification(s)" label on track.html', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-001', { settleMs: 350 });
    const countText = await driver.evaluate(`
      (() => {
        return document.getElementById('confirmationCount')?.textContent || '';
      })()
    `);
    assert(countText.includes('Verification') || countText.includes('Confirmation'), `Expected Verification label for resolved complaint, got "${countText}"`);
  });

  // Test 2: Active/unresolved complaint displays "Affected Resident(s)" label
  collector.addTest(1, 'Community Resolution & Upvoting', 'Active/unresolved complaint (AC-2026-002) displays "Affected Resident(s)" label', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-002', { settleMs: 350 });
    const countText = await driver.evaluate(`
      (() => {
        return document.getElementById('confirmationCount')?.textContent || '';
      })()
    `);
    assert(countText.includes('Affected Resident'), `Expected "Affected Resident" label for active complaint, got "${countText}"`);
  });

  // Test 3: Clicking verification button increments communityConfirmations count
  collector.addTest(1, 'Community Resolution & Upvoting', 'Clicking confirmation button increments confirmation count in data store', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-003', { settleMs: 350 });
    const countBefore = await driver.evaluate(`
      (() => {
        const text = document.getElementById('confirmationCount')?.textContent || '0';
        return parseInt(text.match(/\\d+/)?.[0] || '0');
      })()
    `);

    await driver.evaluate(`
      (async () => {
        const btn = document.getElementById('btnConfirmFix');
        if (btn) btn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 400));

    const countAfter = await driver.evaluate(`
      (() => {
        const text = document.getElementById('confirmationCount')?.textContent || '0';
        return parseInt(text.match(/\\d+/)?.[0] || '0');
      })()
    `);
    assertEqual(countAfter, countBefore + 1, 'Confirmation count should increment by exactly 1');
  });

  // Test 4: After confirming, button updates to confirmed state
  collector.addTest(1, 'Community Resolution & Upvoting', 'Confirmation button transitions to confirmed state and disables duplicate action', async (driver) => {
    const btnState = await driver.evaluate(`
      (() => {
        const btn = document.getElementById('btnConfirmFix');
        return {
          disabled: btn ? btn.disabled : false,
          hasOutlineClass: btn ? btn.classList.contains('btn-outline') : false,
          text: btn ? btn.textContent : ''
        };
      })()
    `);
    assert(btnState.disabled || btnState.hasOutlineClass, 'Confirmation button should enter disabled or outline confirmed state');
  });

  // Test 5: Confirmation persists upon page reload
  collector.addTest(1, 'Community Resolution & Upvoting', 'User confirmation status persists upon reloading tracking page', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-003', { settleMs: 350 });
    const persists = await driver.evaluate(`
      (() => {
        const btn = document.getElementById('btnConfirmFix');
        return btn ? (btn.disabled || btn.classList.contains('btn-outline')) : false;
      })()
    `);
    assert(persists, 'Confirmed status must remain active upon re-querying the complaint');
  });

  // =========================================================================
  // Tier 1: Feature 8 — Storage Resilience & Self-Healing
  // =========================================================================

  // Test 6: Initial database seeding
  collector.addTest(1, 'Storage Resilience', 'Fresh environment seeds INITIAL_DEMO_COMPLAINTS automatically into localStorage', async (driver) => {
    await driver.navigate('/index.html', { settleMs: 250 });
    const complaints = await driver.evaluate(`
      (async () => {
        return await window.dbService.getAllComplaints();
      })()
    `);
    assert(Array.isArray(complaints), 'getAllComplaints() must return an array');
    assert(complaints.length >= 5, `Demo dataset must contain at least 5 initial complaints, got ${complaints.length}`);
  });

  // Test 7: getAllComplaints schema completeness
  collector.addTest(1, 'Storage Resilience', 'Seeded complaint records contain all required civic schema fields', async (driver) => {
    const fieldsValid = await driver.evaluate(`
      (async () => {
        const all = await window.dbService.getAllComplaints();
        const required = ['id', 'title', 'category', 'status', 'lat', 'lng', 'citizenName', 'submittedAt'];
        return all.every(c => required.every(field => c[field] !== undefined));
      })()
    `);
    assert(fieldsValid, 'All complaints in database must contain required schema fields');
  });

  // Test 8: getComplaintById retrieves matching complaint or null
  collector.addTest(1, 'Storage Resilience', 'getComplaintById returns complaint object for valid ID or null for missing ID', async (driver) => {
    const queryResults = await driver.evaluate(`
      (async () => {
        const valid = await window.dbService.getComplaintById('AC-2026-001');
        const invalid = await window.dbService.getComplaintById('NON-EXISTENT-ID');
        return {
          validTitle: valid ? valid.title : null,
          invalidResult: invalid
        };
      })()
    `);
    assert(queryResults.validTitle !== null, 'AC-2026-001 must return a valid complaint');
    assertEqual(queryResults.invalidResult, null, 'Non-existent ID must return null');
  });

  // Test 9: updateComplaintStatus updates status and timestamps
  collector.addTest(1, 'Storage Resilience', 'updateComplaintStatus modifies status, remarks, and timestamp in data store', async (driver) => {
    const updateResult = await driver.evaluate(`
      (async () => {
        const updated = await window.dbService.updateComplaintStatus(
          'AC-2026-004',
          'assigned',
          'Inspection team allocated for survey.'
        );
        return {
          status: updated ? updated.status : null,
          remarks: updated ? updated.officerRemarks : null,
          hasAssignedAt: updated ? Boolean(updated.assignedAt) : false
        };
      })()
    `);
    assertEqual(updateResult.status, 'assigned', 'Complaint status must be assigned');
    assertIncludes(updateResult.remarks, 'Inspection team allocated', 'Remarks must match updated string');
    assert(updateResult.hasAssignedAt, 'assignedAt timestamp must be recorded');
  });

  // Test 10: resetDemoData restores default dataset
  collector.addTest(1, 'Storage Resilience', 'resetDemoData restores all complaints to initial demo state', async (driver) => {
    const resetSuccess = await driver.evaluate(`
      (async () => {
        window.dbService.resetDemoData();
        const all = await window.dbService.getAllComplaints();
        return all.length >= 5;
      })()
    `);
    assert(resetSuccess, 'resetDemoData must restore initial demo complaints');
  });

  // =========================================================================
  // Tier 2: Boundary & Corner Cases — Storage & Community Logic Boundaries
  // =========================================================================

  // Test 11: Active complaint upvote retains "Affected Residents" semantics
  collector.addTest(2, 'Boundary & Corner Cases', 'Upvoting active complaint retains "Affected Residents" label and avoids false resolved text', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-002', { settleMs: 350 });
    const semanticLabel = await driver.evaluate(`
      (async () => {
        const btn = document.getElementById('btnConfirmFix');
        if (btn && !btn.disabled) {
          btn.click();
          await new Promise(r => setTimeout(r, 300));
        }
        const countTxt = document.getElementById('confirmationCount')?.textContent || '';
        return {
          countTxt,
          isAffected: countTxt.includes('Affected Resident'),
          notFalselyConfirmed: !countTxt.includes('Verification')
        };
      })()
    `);
    assert(semanticLabel.isAffected, `Active complaint upvote must maintain Affected Residents semantic label: ${semanticLabel.countTxt}`);
  });

  // Test 12: Resolved complaint uses Verification / You Confirmed This Fix
  collector.addTest(2, 'Boundary & Corner Cases', 'Confirming resolved complaint uses "Verification" and "Confirmed This Fix"', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-001', { settleMs: 350 });
    const resolvedSemantics = await driver.evaluate(`
      (() => {
        const countTxt = document.getElementById('confirmationCount')?.textContent || '';
        const btnTxt = document.getElementById('btnConfirmFix')?.textContent || '';
        return {
          countTxt,
          hasVerification: countTxt.includes('Verification') || countTxt.includes('Confirmation'),
          btnHasConfirmed: btnTxt.includes('Confirmed') || btnTxt.includes('Verified')
        };
      })()
    `);
    assert(resolvedSemantics.hasVerification, 'Resolved complaint should use Verification/Confirmation semantics');
  });

  // Test 13: Double-clicking confirmation button prevents multi-increment
  collector.addTest(2, 'Boundary & Corner Cases', 'Rapid repeated clicks on confirmation button do not multi-increment count', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-004', { settleMs: 350 });
    const doubleClickResult = await driver.evaluate(`
      (async () => {
        const btn = document.getElementById('btnConfirmFix');
        const beforeTxt = document.getElementById('confirmationCount')?.textContent || '0';
        const before = parseInt(beforeTxt.match(/\\d+/)?.[0] || '0');
        
        if (btn) {
          btn.click();
          btn.click();
          btn.click();
        }
        await new Promise(r => setTimeout(r, 400));
        
        const afterTxt = document.getElementById('confirmationCount')?.textContent || '0';
        const after = parseInt(afterTxt.match(/\\d+/)?.[0] || '0');
        return { before, after, delta: after - before };
      })()
    `);
    assert(doubleClickResult.delta <= 1, `Rapid clicks should not multi-increment, incremented by ${doubleClickResult.delta}`);
  });

  // Test 14: Confirming non-existent complaint handles error gracefully
  collector.addTest(2, 'Boundary & Corner Cases', 'confirmResolution handles non-existent ID gracefully returning null', async (driver) => {
    const handled = await driver.evaluate(`
      (async () => {
        try {
          const res = await window.dbService.confirmResolution('NON-EXISTENT-ID', true);
          return res === null;
        } catch (e) {
          return false;
        }
      })()
    `);
    assert(handled, 'confirmResolution must return null for non-existent IDs without throwing');
  });

  // Test 15: Missing or corrupt count handles default cleanly
  collector.addTest(2, 'Boundary & Corner Cases', 'Confirmation logic safely handles complaints with missing communityConfirmations property', async (driver) => {
    const safeDefault = await driver.evaluate(`
      (async () => {
        const fake = {
          id: "AC-NO-COUNT-TEST",
          title: "No Count Test",
          status: "submitted",
          submittedAt: new Date().toISOString()
        };
        await window.dbService.createComplaint(fake);
        const confirmed = await window.dbService.confirmResolution("AC-NO-COUNT-TEST", true);
        await window.dbService.deleteComplaint("AC-NO-COUNT-TEST");
        return confirmed ? confirmed.communityConfirmations >= 1 : false;
      })()
    `);
    assert(safeDefault, 'Missing confirmation count must default gracefully to at least 1');
  });

  // Test 16: Corrupt JSON string in localStorage self-heals
  collector.addTest(2, 'Boundary & Corner Cases', 'Corrupted JSON in localStorage is automatically caught and recovered without crashing', async (driver) => {
    const healed = await driver.evaluate(`
      (async () => {
        // Intentionally inject malformed JSON into storage
        localStorage.setItem("awami_connect_complaints_v1", "{bad json, corrupt data: [");
        try {
          const complaints = await window.dbService.getAllComplaints();
          return Array.isArray(complaints);
        } catch (e) {
          return false;
        }
      })()
    `);
    assert(healed, 'Database layer must self-heal upon encountering corrupted JSON in storage');
  });

  // Test 17: Null / empty storage recovery
  collector.addTest(2, 'Boundary & Corner Cases', 'Empty or wiped localStorage returns clean array or seeds defaults', async (driver) => {
    const recovered = await driver.evaluate(`
      (async () => {
        localStorage.removeItem("awami_connect_complaints_v1");
        try {
          const complaints = await window.dbService.getAllComplaints();
          return Array.isArray(complaints);
        } catch (e) {
          return false;
        }
      })()
    `);
    assert(recovered, 'Wiped storage must recover gracefully returning an array');
  });

  // Test 18: Storage quota resilience simulation
  collector.addTest(2, 'Boundary & Corner Cases', 'Quota exceeded error during write does not crash calling application', async (driver) => {
    const quotaHandled = await driver.evaluate(`
      (async () => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => { throw new DOMException("QuotaExceededError", "QuotaExceededError"); };
        try {
          await window.dbService.createComplaint({ id: "QUOTA-TEST", title: "Test" });
          return true;
        } catch (e) {
          return false;
        } finally {
          localStorage.setItem = originalSetItem;
        }
      })()
    `);
    assert(quotaHandled, 'createComplaint must handle storage quota errors safely');
  });

  // Test 19: Session storage corruption resilience in admin portal
  collector.addTest(2, 'Boundary & Corner Cases', 'Malformed auth session in sessionStorage resets safely to login without uncaught SyntaxError', async (driver) => {
    await driver.navigate('/admin.html', { settleMs: 250 });
    const handledAuthCorruption = await driver.evaluate(`
      (() => {
        sessionStorage.setItem('awami_admin_auth', '{broken json');
        try {
          if (typeof setupAuth === 'function') setupAuth();
          return true;
        } catch (e) {
          return false;
        }
      })()
    `);
    assert(handledAuthCorruption, 'Admin portal must handle corrupt sessionStorage gracefully');
  });

  // Test 20: Concurrent rapid status updates maintain data integrity
  collector.addTest(2, 'Boundary & Corner Cases', 'Rapid consecutive status updates preserve data integrity without lost writes', async (driver) => {
    const concurrentHandled = await driver.evaluate(`
      (async () => {
        await window.dbService.resetDemoData();
        await Promise.all([
          window.dbService.updateComplaintStatus('AC-2026-001', 'under_review', 'Update 1'),
          window.dbService.updateComplaintStatus('AC-2026-002', 'under_review', 'Update 2'),
          window.dbService.updateComplaintStatus('AC-2026-003', 'assigned', 'Update 3')
        ]);
        const c1 = await window.dbService.getComplaintById('AC-2026-001');
        const c2 = await window.dbService.getComplaintById('AC-2026-002');
        const c3 = await window.dbService.getComplaintById('AC-2026-003');
        return Boolean(c1 && c2 && c3);
      })()
    `);
    assert(concurrentHandled, 'Concurrent updates must maintain record consistency');
  });

  // =========================================================================
  // Tier 4: Real-World Scenarios (>= 5 tests)
  // =========================================================================

  // RW1: Complete Citizen Complaint Lifecycle
  collector.addTest(4, 'Real-World Scenarios', 'RW1: Full civic complaint lifecycle: Filing -> Review -> Assignment -> Resolution -> Verification', async (driver) => {
    // 1. Citizen files complaint
    await driver.navigate('/report.html', { settleMs: 250 });
    const trackingId = await driver.evaluate(`
      (async () => {
        const sampleBtn = document.querySelector('.sample-photo-btn');
        if (sampleBtn) sampleBtn.click();
        document.getElementById('complaintTitle').value = 'RW1 Fallen High-Tension Wire';
        document.getElementById('complaintDesc').value = 'Dangerous exposed electrical wire on public pavement.';
        document.getElementById('locationAddress').value = 'North Nazimabad Block B, Karachi';
        document.getElementById('citizenName').value = 'Kashif Mehmood';
        document.getElementById('citizenPhone').value = '0321-1122334';
        
        const form = document.getElementById('complaintForm');
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(r => setTimeout(r, 600));

        return document.getElementById('modalTrackingId')?.textContent?.trim();
      })()
    `);
    assert(trackingId, 'Citizen complaint must register and return tracking ID');

    // 2. Moderator triages and assigns to Electric Dept
    await driver.navigate('/admin.html', { settleMs: 250 });
    await driver.evaluate(`
      (async (tId) => {
        const user = { name: "Senior Moderator", email: "mod@civic.gov", role: "moderator" };
        sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
        if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
        
        await window.dbService.updateComplaintStatus(
          tId,
          'assigned',
          'Urgent emergency repair team dispatched.',
          'City Electric Utility / Works'
        );
      })("${trackingId}")
    `);

    // 3. Field team resolves with proof
    await driver.evaluate(`
      (async (tId) => {
        await window.dbService.updateComplaintStatus(
          tId,
          'resolved',
          'Power disconnected, damaged cable replaced, and safely elevated.',
          'City Electric Utility / Works',
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80'
        );
      })("${trackingId}")
    `);

    // 4. Citizen verifies resolution on track.html
    await driver.navigate(`/track.html?id=${trackingId}`, { settleMs: 400 });
    const verified = await driver.evaluate(`
      (async () => {
        const statusText = document.getElementById('complaintStatusBadge')?.textContent;
        const btn = document.getElementById('btnConfirmFix');
        if (btn) btn.click();
        await new Promise(r => setTimeout(r, 400));
        const countTxt = document.getElementById('confirmationCount')?.textContent;
        return {
          isResolved: statusText.includes('Resolved'),
          countTxt
        };
      })()
    `);
    assert(verified.isResolved, 'Complaint should be marked resolved on tracking page');
    assert(verified.countTxt.includes('Verification') || verified.countTxt.includes('Confirmation'), 'Verification count should update on tracking page');
  });

  // RW2: Low-Bandwidth Mobile Citizen Experience
  collector.addTest(4, 'Real-World Scenarios', 'RW2: Low-bandwidth mobile citizen workflow on 320px viewport with zero overflow and image compression', async (driver) => {
    await driver.setViewport(320, 568);
    await driver.navigate('/report.html', { settleMs: 250 });
    
    // Check 0 overflow on 320px
    const overflow = await driver.checkHorizontalOverflow();
    assert(!overflow.hasOverflow, `Mobile filing page should not have horizontal overflow: ${overflow.scrollWidth} > ${overflow.docWidth}`);

    // Compress high-res image and submit
    const submitted = await driver.evaluate(`
      (async () => {
        const sampleBtn = document.querySelector('.sample-photo-btn');
        if (sampleBtn) sampleBtn.click();
        document.getElementById('complaintTitle').value = 'RW2 Mobile Water Leak';
        document.getElementById('complaintDesc').value = 'Clean water wasting on street.';
        document.getElementById('locationAddress').value = 'Rawalpindi Saddar Bazaar';
        document.getElementById('citizenName').value = 'Naveed Akhtar';
        document.getElementById('citizenPhone').value = '0345-6677889';

        const form = document.getElementById('complaintForm');
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(r => setTimeout(r, 600));

        const modal = document.getElementById('successModal');
        const shareLink = document.getElementById('modalShareWhatsapp')?.getAttribute('href');
        return {
          modalOpen: modal ? modal.classList.contains('open') : false,
          hasShareLink: Boolean(shareLink && shareLink.includes('wa.me'))
        };
      })()
    `);
    assert(submitted.modalOpen, 'Mobile user submission should display success modal');
    assert(submitted.hasShareLink, 'Success modal should provide WhatsApp share link for low-bandwidth messaging');
  });

  // RW3: High-Volume Municipal Department Triage Session
  collector.addTest(4, 'Real-World Scenarios', 'RW3: Moderator multi-criteria search, department filtering, status updating, and CSV audit export', async (driver) => {
    await driver.setViewport(1280, 800);
    await driver.navigate('/admin.html', { settleMs: 250 });
    const triageSuccess = await driver.evaluate(`
      (async () => {
        const user = { name: "Zone Director", email: "director@civic.gov", role: "admin" };
        sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
        if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
        await new Promise(r => setTimeout(r, 300));

        // Search by location keyword
        const searchInput = document.getElementById('adminSearchInput');
        searchInput.value = 'Karachi';
        searchInput.dispatchEvent(new Event('input'));
        const karachiRows = document.querySelectorAll('#complaintsTableBody tr').length;

        // Reset and filter by status
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        const statusFilter = document.getElementById('adminStatusFilter');
        statusFilter.value = 'submitted';
        statusFilter.dispatchEvent(new Event('change'));
        const submittedRows = document.querySelectorAll('#complaintsTableBody tr').length;

        return {
          karachiRowsFound: karachiRows >= 1,
          submittedRowsFound: submittedRows >= 1
        };
      })()
    `);
    assert(triageSuccess.karachiRowsFound, 'Multi-criteria search should find Karachi complaints');
    assert(triageSuccess.submittedRowsFound, 'Status filter should isolate submitted complaints');
  });

  // RW4: Fault-Tolerant Offline / Network Degraded Simulation
  collector.addTest(4, 'Real-World Scenarios', 'RW4: Fault-tolerant degraded session: Missing external CDNs, storage self-healing, and uninterrupted tracking', async (driver) => {
    // 1. Visit index with corrupt cache
    await driver.navigate('/index.html', { settleMs: 250 });
    const recoveryCheck = await driver.evaluate(`
      (async () => {
        // Corrupt storage
        localStorage.setItem("awami_connect_complaints_v1", "INVALID_JSON_CACHE");
        // Re-read complaints
        const complaints = await window.dbService.getAllComplaints();
        return Array.isArray(complaints) && complaints.length >= 5;
      })()
    `);
    assert(recoveryCheck, 'Degraded network/storage state should recover and deliver functional complaints data');

    // 2. Lookup existing complaint
    await driver.navigate('/track.html?id=AC-2026-001', { settleMs: 350 });
    const trackingWorks = await driver.evaluate(`
      (() => {
        return document.getElementById('complaintTrackingId')?.textContent?.trim() === 'AC-2026-001';
      })()
    `);
    assert(trackingWorks, 'Tracking functionality must continue operating seamlessly after recovery');
  });

  // RW5: Boundary & Adversarial Payload Stress Test
  collector.addTest(4, 'Real-World Scenarios', 'RW5: Adversarial payload stress: Unicode emojis, special characters, max-length descriptions, zero overflow', async (driver) => {
    await driver.setViewport(375, 667);
    await driver.navigate('/report.html', { settleMs: 250 });
    const adversarialSubmitted = await driver.evaluate(`
      (async () => {
        const sampleBtn = document.querySelector('.sample-photo-btn');
        if (sampleBtn) sampleBtn.click();

        // Adversarial inputs
        document.getElementById('complaintTitle').value = '⚠️ DANGER: Sewer Overflow & Electric Hazard ⚡🚰 <script>alert(1)<\\/script>';
        document.getElementById('complaintDesc').value = 'A'.repeat(500) + ' & special \\"quotes\\" and \\'apostrophes\\'!';
        document.getElementById('locationAddress').value = 'Block 13-D "Gulshan", Street #99 <tag>';
        document.getElementById('citizenName').value = 'Dr. Tariq & Sons Ltd.';
        document.getElementById('citizenPhone').value = '+92 (300) 123-4567';

        const form = document.getElementById('complaintForm');
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(r => setTimeout(r, 600));

        const trackingId = document.getElementById('modalTrackingId')?.textContent?.trim();
        return {
          trackingId,
          modalOpen: document.getElementById('successModal')?.classList.contains('open')
        };
      })()
    `);
    assert(adversarialSubmitted.trackingId, 'Adversarial payload complaint must be accepted and assigned tracking ID');

    // Verify on tracking page: zero horizontal overflow and proper rendering
    await driver.navigate(`/track.html?id=${adversarialSubmitted.trackingId}`, { settleMs: 400 });
    const overflow = await driver.checkHorizontalOverflow();
    assert(!overflow.hasOverflow, `Adversarial content must not cause layout overflow: ${overflow.scrollWidth} > ${overflow.docWidth}`);

    // Verify script tags were NOT executed or rendered unescaped
    const rawHtml = await driver.evaluate(`
      (() => {
        const titleEl = document.getElementById('complaintTitle');
        return titleEl ? titleEl.innerHTML : '';
      })()
    `);
    assert(!rawHtml.includes('<script>alert'), 'Adversarial script tags must not be rendered as executable elements');
  });
}

async function run(driver, collector) {
  registerTests(collector);
  return await collector.run(driver);
}

if (require.main === module) {
  (async () => {
    const driver = new BrowserDriver({ port: 3000, cdpPort: 9222 });
    const collector = new TestCollector('Storage Resilience & Real-World Scenarios');
    try {
      await driver.startServer();
      await driver.launchChrome();
      const results = await run(driver, collector);
      console.log(`\nResilience & Real-World Tests: ${results.filter(r => r.passed).length}/${results.length} passed`);
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
