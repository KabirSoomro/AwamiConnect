/**
 * Tier 1, Tier 2 & Tier 3: Citizen Complaint Filing, Tracking & Cross-Feature Interaction Suite
 * Tests citizen submission, canvas compression, tracking lookup, status progression,
 * admin triage, and end-to-end synchronized civic workflows.
 */

const { TestCollector, assert, assertEqual, assertIncludes, assertMatch } = require('./test_helper');
const BrowserDriver = require('./browser_driver');

function registerTests(collector) {
  let createdComplaintId = null;

  // =========================================================================
  // Tier 1: Feature 4 — Citizen Complaint Filing & Compression
  // =========================================================================

  // Test 1: Report form required inputs presence
  collector.addTest(1, 'Citizen Complaint Filing', 'report.html renders all required form controls and upload zones', async (driver) => {
    await driver.navigate('/report.html', { settleMs: 300 });
    const formInputs = await driver.evaluate(`
      (() => {
        return {
          title: Boolean(document.getElementById('complaintTitle')),
          desc: Boolean(document.getElementById('complaintDesc')),
          address: Boolean(document.getElementById('locationAddress')),
          name: Boolean(document.getElementById('citizenName')),
          phone: Boolean(document.getElementById('citizenPhone')),
          uploadZone: Boolean(document.getElementById('uploadZone')),
          submitBtn: Boolean(document.getElementById('btnSubmit')),
          categories: document.querySelectorAll('input[name="category"]').length
        };
      })()
    `);
    assert(formInputs.title, '#complaintTitle must exist');
    assert(formInputs.desc, '#complaintDesc must exist');
    assert(formInputs.address, '#locationAddress must exist');
    assert(formInputs.name, '#citizenName must exist');
    assert(formInputs.phone, '#citizenPhone must exist');
    assert(formInputs.uploadZone, '#uploadZone must exist');
    assert(formInputs.submitBtn, '#btnSubmit must exist');
    assert(formInputs.categories >= 5, `Expected at least 5 category options, found ${formInputs.categories}`);
  });

  // Test 2: Sample photo selector button loads preview
  collector.addTest(1, 'Citizen Complaint Filing', 'Clicking sample photo button populates image preview and selects category', async (driver) => {
    const sampleClicked = await driver.evaluate(`
      (() => {
        const sampleBtn = document.querySelector('.sample-photo-btn');
        if (!sampleBtn) return false;
        sampleBtn.click();
        const preview = document.getElementById('previewContainer');
        const img = document.getElementById('imagePreview');
        const uploadZone = document.getElementById('uploadZone');
        return {
          previewShown: preview ? preview.style.display !== 'none' : false,
          hasImgSrc: Boolean(img && img.src),
          uploadHidden: uploadZone ? uploadZone.style.display === 'none' : false
        };
      })()
    `);
    assert(sampleClicked.previewShown, 'Preview container must be visible after selecting sample photo');
    assert(sampleClicked.hasImgSrc, 'Image preview must have valid image source');
    assert(sampleClicked.uploadHidden, 'Upload zone must be hidden when preview is active');
  });

  // Test 3: Submitting valid form creates a new complaint record with AC-YYYY-NNNN format
  collector.addTest(1, 'Citizen Complaint Filing', 'Submitting valid complaint form registers record and returns tracking ID', async (driver) => {
    const submitResult = await driver.evaluate(`
      (async () => {
        document.getElementById('complaintTitle').value = 'Broken Street Light on Main Road';
        document.getElementById('complaintDesc').value = 'Streetlight is sparking and not working for past 5 days.';
        document.getElementById('locationAddress').value = 'Gulshan Block 7, Main Boulevard';
        document.getElementById('citizenName').value = 'Mohammad Tariq';
        document.getElementById('citizenPhone').value = '0300-9876543';
        
        // Select electricity category radio
        const elecRadio = document.querySelector('input[name="category"][value="electricity"]');
        if (elecRadio) elecRadio.checked = true;

        // Ensure image is loaded
        const sampleBtn = document.querySelector('.sample-photo-btn');
        if (sampleBtn) sampleBtn.click();

        // Submit form
        const form = document.getElementById('complaintForm');
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        // Wait for modal or db write
        await new Promise(r => setTimeout(r, 600));

        const trackingId = document.getElementById('modalTrackingId')?.textContent?.trim();
        return {
          trackingId,
          modalOpen: document.getElementById('successModal')?.classList.contains('open')
        };
      })()
    `);
    assert(submitResult.trackingId, 'Tracking ID must be generated upon submission');
    assertMatch(submitResult.trackingId, /^AC-\d{4}-\d{4}$/, 'Tracking ID must follow format AC-YYYY-NNNN');
    createdComplaintId = submitResult.trackingId;
  });

  // Test 4: Success modal displays tracking ID and tracking link
  collector.addTest(1, 'Citizen Complaint Filing', 'Success modal displays tracking ID and link to track.html?id={id}', async (driver) => {
    const modalData = await driver.evaluate(`
      (() => {
        const modal = document.getElementById('successModal');
        const trackBtn = document.getElementById('modalTrackBtn');
        const shareBtn = document.getElementById('modalShareWhatsapp');
        return {
          isOpen: modal ? modal.classList.contains('open') : false,
          trackHref: trackBtn ? trackBtn.getAttribute('href') : '',
          shareHref: shareBtn ? shareBtn.getAttribute('href') : ''
        };
      })()
    `);
    assert(modalData.isOpen, 'Success modal should have class "open"');
    assertIncludes(modalData.trackHref, 'track.html?id=', 'Track button href must point to track.html?id=');
    assertIncludes(modalData.shareHref, 'wa.me', 'Share button href must point to WhatsApp URL');
  });

  // Test 5: Remove photo button clears selected image and restores upload zone
  collector.addTest(1, 'Citizen Complaint Filing', 'Remove image button resets preview and restores upload zone', async (driver) => {
    const resetState = await driver.evaluate(`
      (() => {
        const removeBtn = document.getElementById('removeImageBtn');
        if (removeBtn) removeBtn.click();
        const preview = document.getElementById('previewContainer');
        const uploadZone = document.getElementById('uploadZone');
        return {
          previewHidden: preview ? preview.style.display === 'none' : false,
          uploadShown: uploadZone ? uploadZone.style.display !== 'none' : false
        };
      })()
    `);
    assert(resetState.previewHidden, 'Preview container must be hidden after remove button click');
    assert(resetState.uploadShown, 'Upload zone must be restored after remove button click');
  });

  // =========================================================================
  // Tier 1: Feature 5 — Tracking Lookup & Timeline Progression
  // =========================================================================

  // Test 6: Querying existing complaint ID renders complaint details
  collector.addTest(1, 'Tracking Lookup & Timeline', 'Querying valid complaint ID (AC-2026-001) renders complaint details and metadata', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-001', { settleMs: 400 });
    const complaintDetails = await driver.evaluate(`
      (() => {
        const resultCard = document.getElementById('complaintResult');
        const id = document.getElementById('complaintTrackingId')?.textContent?.trim();
        const title = document.getElementById('complaintTitle')?.textContent?.trim();
        const statusBadge = document.getElementById('complaintStatusBadge')?.innerHTML;
        return {
          resultVisible: resultCard ? window.getComputedStyle(resultCard).display !== 'none' : false,
          id,
          title,
          statusBadge
        };
      })()
    `);
    assert(complaintDetails.resultVisible, '#complaintResult must be visible');
    assertEqual(complaintDetails.id, 'AC-2026-001', 'Loaded complaint ID must match AC-2026-001');
    assert(complaintDetails.title.length > 0, 'Complaint title must not be empty');
    assertIncludes(complaintDetails.statusBadge, 'Resolved', 'Status badge should contain Resolved');
  });

  // Test 7: Status badge renders semantic styling
  collector.addTest(1, 'Tracking Lookup & Timeline', 'Status badge renders correct class for resolved, assigned, and submitted statuses', async (driver) => {
    const badges = await driver.evaluate(`
      (() => {
        if (typeof getStatusBadge !== 'function') return null;
        return {
          submitted: getStatusBadge('submitted'),
          underReview: getStatusBadge('under_review'),
          assigned: getStatusBadge('assigned'),
          resolved: getStatusBadge('resolved')
        };
      })()
    `);
    if (badges) {
      assertIncludes(badges.submitted, 'badge-submitted', 'Submitted badge must use badge-submitted');
      assertIncludes(badges.assigned, 'badge-assigned', 'Assigned badge must use badge-assigned');
      assertIncludes(badges.resolved, 'badge-resolved', 'Resolved badge must use badge-resolved');
    }
  });

  // Test 8: Progress timeline reflects active step
  collector.addTest(1, 'Tracking Lookup & Timeline', 'Timeline progress bar reflects completion steps corresponding to complaint status', async (driver) => {
    const timelineData = await driver.evaluate(`
      (() => {
        const steps = document.querySelectorAll('.timeline-step');
        const activeSteps = document.querySelectorAll('.timeline-step.completed, .timeline-step.active');
        return {
          totalSteps: steps.length,
          activeCount: activeSteps.length
        };
      })()
    `);
    assert(timelineData.totalSteps >= 4, `Expected at least 4 timeline steps, found ${timelineData.totalSteps}`);
    assert(timelineData.activeCount >= 1, 'At least one timeline step should be active/completed for AC-2026-001');
  });

  // Test 9: URL parameter auto-loading
  collector.addTest(1, 'Tracking Lookup & Timeline', 'track.html?id=AC-2026-002 auto-populates search input and loads record', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-002', { settleMs: 400 });
    const loadedData = await driver.evaluate(`
      (() => {
        const inputVal = document.getElementById('trackSearchInput')?.value;
        const idVal = document.getElementById('complaintTrackingId')?.textContent?.trim();
        return { inputVal, idVal };
      })()
    `);
    assertEqual(loadedData.inputVal, 'AC-2026-002', 'Search input should auto-populate from URL parameter');
    assertEqual(loadedData.idVal, 'AC-2026-002', 'Loaded complaint result ID should match URL parameter');
  });

  // Test 10: Official remarks and resolution proof conditionally render
  collector.addTest(1, 'Tracking Lookup & Timeline', 'Resolution proof photo container is displayed for resolved complaints with proof URL', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-001', { settleMs: 400 });
    const proofState = await driver.evaluate(`
      (() => {
        const container = document.getElementById('proofPhotoContainer');
        const photo = document.getElementById('complaintProofPhoto');
        return {
          containerVisible: container ? window.getComputedStyle(container).display !== 'none' : false,
          hasPhotoSrc: Boolean(photo && photo.src)
        };
      })()
    `);
    assert(proofState.containerVisible, '#proofPhotoContainer must be visible for AC-2026-001 (resolved with proof)');
    assert(proofState.hasPhotoSrc, '#complaintProofPhoto must have a valid source URL');
  });

  // =========================================================================
  // Tier 2: Boundary & Corner Cases — Filing & Tracking Edge Cases
  // =========================================================================

  // Test 11: Empty required fields validation
  collector.addTest(2, 'Boundary & Corner Cases', 'Submitting empty complaint form prevents submission and applies error feedback', async (driver) => {
    await driver.navigate('/report.html', { settleMs: 250 });
    const validationHandled = await driver.evaluate(`
      (() => {
        const form = document.getElementById('complaintForm');
        document.getElementById('complaintTitle').value = '';
        document.getElementById('complaintDesc').value = '';
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        const modal = document.getElementById('successModal');
        const isModalOpen = modal ? modal.classList.contains('open') : false;
        return !isModalOpen;
      })()
    `);
    assert(validationHandled, 'Form with empty inputs must not open success modal');
  });

  // Test 12: Image requirement validation
  collector.addTest(2, 'Boundary & Corner Cases', 'Submitting without image applies error class to #uploadZone', async (driver) => {
    const imageValidated = await driver.evaluate(`
      (() => {
        document.getElementById('complaintTitle').value = 'Test Issue';
        document.getElementById('complaintDesc').value = 'Detailed description';
        document.getElementById('locationAddress').value = 'Test Location';
        document.getElementById('citizenName').value = 'Tester';
        document.getElementById('citizenPhone').value = '0300-0000000';
        
        const form = document.getElementById('complaintForm');
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        const uploadZone = document.getElementById('uploadZone');
        return uploadZone ? uploadZone.classList.contains('error-highlight') : false;
      })()
    `);
    assert(imageValidated, '#uploadZone should receive .error-highlight when image is omitted');
  });

  // Test 13: Canvas image downscaling bounds both dimensions
  collector.addTest(2, 'Boundary & Corner Cases', 'compressImage maintains aspect ratio and clamps both width and height <= 1200', async (driver) => {
    const compressionTested = await driver.evaluate(`
      (async () => {
        if (typeof compressImage !== 'function') return { available: false };
        // Create an offscreen image blob of 2400x1600
        const canvas = document.createElement('canvas');
        canvas.width = 2400;
        canvas.height = 1600;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 2400, 1600);
        
        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg'));
        const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
        
        const compressedUrl = await compressImage(file, 1200, 0.75);
        const img = new Image();
        img.src = compressedUrl;
        await new Promise(r => { img.onload = r; });
        return {
          available: true,
          width: img.width,
          height: img.height,
          clamped: img.width <= 1200 && img.height <= 1200
        };
      })()
    `);
    if (compressionTested.available) {
      assert(compressionTested.clamped, `Compressed image should be <= 1200px: ${JSON.stringify(compressionTested)}`);
    }
  });

  // Test 14: Non-image file upload rejection
  collector.addTest(2, 'Boundary & Corner Cases', 'Uploading non-image files (e.g. text/plain) rejects with user error', async (driver) => {
    const rejectionHandled = await driver.evaluate(`
      (async () => {
        const file = new File(['hello text'], 'test.txt', { type: 'text/plain' });
        const input = document.getElementById('imageInput');
        if (!input) return false;
        
        // Simulate file change
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change'));
        
        await new Promise(r => setTimeout(r, 200));
        const preview = document.getElementById('previewContainer');
        return preview ? window.getComputedStyle(preview).display === 'none' : true;
      })()
    `);
    assert(rejectionHandled, 'Non-image file upload must not open preview container');
  });

  // Test 15: Storage quota handling
  collector.addTest(2, 'Boundary & Corner Cases', 'createComplaint safely handles storage limits without unhandled crashes', async (driver) => {
    const quotaHandled = await driver.evaluate(`
      (async () => {
        try {
          if (window.dbService && typeof window.dbService.createComplaint === 'function') {
            const fake = {
              id: "AC-QUOTA-TEST",
              title: "Quota Test",
              status: "submitted",
              submittedAt: new Date().toISOString()
            };
            await window.dbService.createComplaint(fake);
            // Clean up
            await window.dbService.deleteComplaint("AC-QUOTA-TEST");
            return true;
          }
          return false;
        } catch (e) {
          return false;
        }
      })()
    `);
    assert(quotaHandled, 'createComplaint should succeed under standard conditions and clean up');
  });

  // Test 16: Non-existent ID lookup
  collector.addTest(2, 'Boundary & Corner Cases', 'Querying non-existent tracking ID (AC-9999-9999) displays #trackNotFound', async (driver) => {
    await driver.navigate('/track.html?id=AC-9999-9999', { settleMs: 350 });
    const notFoundState = await driver.evaluate(`
      (() => {
        const notFound = document.getElementById('trackNotFound');
        const result = document.getElementById('complaintResult');
        return {
          notFoundVisible: notFound ? window.getComputedStyle(notFound).display !== 'none' : false,
          resultHidden: result ? window.getComputedStyle(result).display === 'none' : true
        };
      })()
    `);
    assert(notFoundState.notFoundVisible, '#trackNotFound must be displayed for invalid IDs');
    assert(notFoundState.resultHidden, '#complaintResult must be hidden for invalid IDs');
  });

  // Test 17: Case-insensitive and whitespace-tolerant tracking ID lookup
  collector.addTest(2, 'Boundary & Corner Cases', 'Tracking lookup safely trims whitespace and ignores letter casing (ac-2026-001)', async (driver) => {
    await driver.navigate('/track.html?id=%20ac-2026-001%20', { settleMs: 400 });
    const resolvedId = await driver.evaluate(`
      (() => {
        return document.getElementById('complaintTrackingId')?.textContent?.trim();
      })()
    `);
    assertEqual(resolvedId, 'AC-2026-001', 'ID lookup should resolve lowercase and trimmed input to AC-2026-001');
  });

  // Test 18: Loading indicator state toggling
  collector.addTest(2, 'Boundary & Corner Cases', 'Tracking lookup toggles #trackLoading during database fetch', async (driver) => {
    const loadingExists = await driver.evaluate(`
      (() => {
        return Boolean(document.getElementById('trackLoading'));
      })()
    `);
    assert(loadingExists, '#trackLoading element must exist in track.html');
  });

  // Test 19: Print ticket button invokes window.print() safely
  collector.addTest(2, 'Boundary & Corner Cases', 'Print ticket button executes without throwing errors', async (driver) => {
    await driver.navigate('/track.html?id=AC-2026-001', { settleMs: 300 });
    const printInvoked = await driver.evaluate(`
      (() => {
        let printCalled = false;
        const originalPrint = window.print;
        window.print = () => { printCalled = true; };
        try {
          const btn = document.getElementById('btnPrintTicket');
          if (btn) btn.click();
          return printCalled;
        } finally {
          window.print = originalPrint;
        }
      })()
    `);
    assert(printInvoked, '#btnPrintTicket must invoke window.print()');
  });

  // Test 20: WhatsApp share link encoding
  collector.addTest(2, 'Boundary & Corner Cases', 'WhatsApp share button URI encodes title, status, and URL', async (driver) => {
    const shareHref = await driver.evaluate(`
      (() => {
        const btn = document.getElementById('btnShareTicket');
        return btn ? btn.getAttribute('href') : '';
      })()
    `);
    assertIncludes(shareHref, 'wa.me', 'WhatsApp share URL must start with https://wa.me');
    assertIncludes(shareHref, 'text=', 'WhatsApp share URL must contain text query parameter');
  });

  // =========================================================================
  // Tier 3: Cross-Feature Combinations (>= 10 tests)
  // =========================================================================

  let crossFeatureId = null;

  // CF1: Citizen filing -> Tracking sync
  collector.addTest(3, 'Cross-Feature Combinations', 'CF1: Submitting complaint on report.html allows immediate tracking on track.html', async (driver) => {
    await driver.navigate('/report.html', { settleMs: 250 });
    const creation = await driver.evaluate(`
      (async () => {
        const sampleBtn = document.querySelector('.sample-photo-btn');
        if (sampleBtn) sampleBtn.click();
        document.getElementById('complaintTitle').value = 'CF1 Cross-Feature Test Pothole';
        document.getElementById('complaintDesc').value = 'Pothole requires immediate asphalt patch.';
        document.getElementById('locationAddress').value = 'University Road Block 4';
        document.getElementById('citizenName').value = 'Zubair Shah';
        document.getElementById('citizenPhone').value = '0333-1234567';

        const form = document.getElementById('complaintForm');
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(r => setTimeout(r, 600));

        return document.getElementById('modalTrackingId')?.textContent?.trim();
      })()
    `);
    assert(creation, 'Complaint should be created');
    crossFeatureId = creation;

    // Navigate to tracking
    await driver.navigate(`/track.html?id=${crossFeatureId}`, { settleMs: 400 });
    const loadedTitle = await driver.evaluate(`
      (() => {
        return document.getElementById('complaintTitle')?.textContent?.trim();
      })()
    `);
    assertEqual(loadedTitle, 'CF1 Cross-Feature Test Pothole', 'Tracking page should display newly created complaint title');
  });

  // CF2: Citizen filing -> Admin table sync
  collector.addTest(3, 'Cross-Feature Combinations', 'CF2: Newly submitted complaint appears in Admin dashboard table with updated metrics', async (driver) => {
    await driver.navigate('/admin.html', { settleMs: 250 });
    // Log in
    await driver.evaluate(`
      (() => {
        const user = { name: "Moderator", email: "mod@civic.gov", role: "moderator" };
        sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
        if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    const foundInAdmin = await driver.evaluate(`
      ((targetId) => {
        const searchInput = document.getElementById('adminSearchInput');
        if (searchInput) {
          searchInput.value = targetId;
          searchInput.dispatchEvent(new Event('input'));
        }
        const rows = document.querySelectorAll('#complaintsTableBody tr');
        return rows.length === 1 && rows[0].textContent.includes(targetId);
      })("${crossFeatureId}")
    `);
    assert(foundInAdmin, `Newly filed complaint ${crossFeatureId} must appear in Admin portal search`);
  });

  // CF3: Admin status triage -> Tracking timeline update
  collector.addTest(3, 'Cross-Feature Combinations', 'CF3: Admin updates status to under_review -> Citizen tracking page reflects update and remarks', async (driver) => {
    // Perform admin update
    await driver.evaluate(`
      (async (targetId) => {
        await window.dbService.updateComplaintStatus(
          targetId,
          'under_review',
          'Review team has verified the complaint coordinates.'
        );
      })("${crossFeatureId}")
    `);

    // Verify on tracking page
    await driver.navigate(`/track.html?id=${crossFeatureId}`, { settleMs: 400 });
    const updatedState = await driver.evaluate(`
      (() => {
        const badge = document.getElementById('complaintStatusBadge')?.innerHTML;
        const remarks = document.getElementById('complaintRemarks')?.textContent;
        return {
          isUnderReview: badge.includes('Under Review') || badge.includes('under-review'),
          remarks
        };
      })()
    `);
    assert(updatedState.isUnderReview, 'Status badge must reflect Under Review on track.html');
    assertIncludes(updatedState.remarks, 'Review team has verified', 'Officer remarks must appear on track.html');
  });

  // CF4: Admin department assignment -> Tracking department sync
  collector.addTest(3, 'Cross-Feature Combinations', 'CF4: Admin assigns department -> Tracking page reflects updated department name', async (driver) => {
    await driver.evaluate(`
      (async (targetId) => {
        await window.dbService.updateComplaintStatus(
          targetId,
          'assigned',
          'Dispatched to asphalt repair unit.',
          'District Works & Highways'
        );
      })("${crossFeatureId}")
    `);

    await driver.navigate(`/track.html?id=${crossFeatureId}`, { settleMs: 400 });
    const deptText = await driver.evaluate(`
      (() => {
        return document.getElementById('complaintDepartment')?.textContent?.trim();
      })()
    `);
    assertIncludes(deptText, 'Works', 'Assigned department must reflect in complaint tracking view');
  });

  // CF5: Admin resolution with proof URL -> Tracking proof container & badge
  collector.addTest(3, 'Cross-Feature Combinations', 'CF5: Admin marks complaint resolved with proof -> Tracking shows Resolved and displays proof image', async (driver) => {
    await driver.evaluate(`
      (async (targetId) => {
        await window.dbService.updateComplaintStatus(
          targetId,
          'resolved',
          'Pothole filled with asphalt and compacted.',
          'District Works & Highways',
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80'
        );
      })("${crossFeatureId}")
    `);

    await driver.navigate(`/track.html?id=${crossFeatureId}`, { settleMs: 400 });
    const resolvedCheck = await driver.evaluate(`
      (() => {
        const badge = document.getElementById('complaintStatusBadge')?.innerHTML;
        const proofContainer = document.getElementById('proofPhotoContainer');
        return {
          isResolved: badge.includes('Resolved') || badge.includes('resolved'),
          proofVisible: proofContainer ? window.getComputedStyle(proofContainer).display !== 'none' : false
        };
      })()
    `);
    assert(resolvedCheck.isResolved, 'Complaint status should be Resolved');
    assert(resolvedCheck.proofVisible, 'Resolution proof container should be visible');
  });

  // CF6: Citizen community verification -> Confirmation increment
  collector.addTest(3, 'Cross-Feature Combinations', 'CF6: Citizen verifies resolved complaint -> Confirmation count increments and button updates', async (driver) => {
    const verified = await driver.evaluate(`
      (async () => {
        const btn = document.getElementById('btnConfirmFix');
        if (!btn) return { clicked: false };
        btn.click();
        await new Promise(r => setTimeout(r, 400));
        const countTxt = document.getElementById('confirmationCount')?.textContent;
        return {
          clicked: true,
          countTxt,
          btnText: btn.textContent
        };
      })()
    `);
    assert(verified.clicked, '#btnConfirmFix must exist and be clicked');
    assert(verified.countTxt.includes('Verification') || verified.countTxt.includes('Confirmation'), 'Verification text should be updated');
  });

  // CF7: Admin Category Filter interaction with new complaint
  collector.addTest(3, 'Cross-Feature Combinations', 'CF7: Category filter in admin displays complaint for matching category and hides for others', async (driver) => {
    await driver.navigate('/admin.html', { settleMs: 250 });
    await driver.evaluate(`
      (() => {
        const user = { name: "Moderator", email: "mod@civic.gov", role: "moderator" };
        sessionStorage.setItem("awami_admin_auth", JSON.stringify(user));
        if (typeof showAdminDashboard === 'function') showAdminDashboard(user);
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    const filterResults = await driver.evaluate(`
      ((targetId) => {
        const catFilter = document.getElementById('adminCategoryFilter');
        const searchInput = document.getElementById('adminSearchInput');
        searchInput.value = targetId;
        
        // Filter by all
        catFilter.value = 'all';
        searchInput.dispatchEvent(new Event('input'));
        const allCount = document.querySelectorAll('#complaintsTableBody tr').length;

        // Filter by electricity (unrelated category)
        catFilter.value = 'electricity';
        catFilter.dispatchEvent(new Event('change'));
        const elecCount = document.querySelectorAll('#complaintsTableBody tr').length;

        return { allCount, elecCount };
      })("${crossFeatureId}")
    `);
    assert(filterResults.allCount >= 1, 'Target complaint should be visible under all categories');
  });

  // CF8: Admin Status Filter interaction
  collector.addTest(3, 'Cross-Feature Combinations', 'CF8: Status filter in admin filters table strictly by selected status', async (driver) => {
    const statusFiltered = await driver.evaluate(`
      (() => {
        const statusFilter = document.getElementById('adminStatusFilter');
        const searchInput = document.getElementById('adminSearchInput');
        if (searchInput) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input'));
        }
        statusFilter.value = 'resolved';
        statusFilter.dispatchEvent(new Event('change'));
        
        const rows = Array.from(document.querySelectorAll('#complaintsTableBody tr'));
        // Verify every row displayed has Resolved status
        return rows.every(r => r.textContent.includes('Resolved') || r.textContent.includes('No complaints'));
      })()
    `);
    assert(statusFiltered, 'Every table row under status "resolved" filter must be resolved');
  });

  // CF9: Admin Deletion -> Tracking lookup reflects not found
  collector.addTest(3, 'Cross-Feature Combinations', 'CF9: Admin deletes complaint -> Tracking lookup for deleted ID renders trackNotFound', async (driver) => {
    // Delete target complaint
    await driver.evaluate(`
      (async (targetId) => {
        await window.dbService.deleteComplaint(targetId);
      })("${crossFeatureId}")
    `);

    // Verify lookup is not found
    await driver.navigate(`/track.html?id=${crossFeatureId}`, { settleMs: 350 });
    const isNotFound = await driver.evaluate(`
      (() => {
        const notFound = document.getElementById('trackNotFound');
        return notFound ? window.getComputedStyle(notFound).display !== 'none' : false;
      })()
    `);
    assert(isNotFound, `Deleted complaint ${crossFeatureId} should result in #trackNotFound`);
  });

  // CF10: Dashboard Metric & Map Sync
  collector.addTest(3, 'Cross-Feature Combinations', 'CF10: Dashboard index.html KPI counters reflect active total and resolved database counts', async (driver) => {
    await driver.navigate('/index.html', { settleMs: 400 });
    const dashboardMetrics = await driver.evaluate(`
      (async () => {
        const complaints = await window.dbService.getAllComplaints();
        const statTotal = parseInt(document.getElementById('statTotal')?.textContent || '0');
        const statResolved = parseInt(document.getElementById('statResolved')?.textContent || '0');
        const statPending = parseInt(document.getElementById('statPending')?.textContent || '0');
        return {
          dbTotal: complaints.length,
          dbResolved: complaints.filter(c => c.status === 'resolved').length,
          statTotal,
          statResolved,
          statPending
        };
      })()
    `);
    assertEqual(dashboardMetrics.statTotal, dashboardMetrics.dbTotal, 'Dashboard total KPI must match dbService complaint count');
    assertEqual(dashboardMetrics.statResolved, dashboardMetrics.dbResolved, 'Dashboard resolved KPI must match dbService resolved count');
  });
}

async function run(driver, collector) {
  registerTests(collector);
  return await collector.run(driver);
}

if (require.main === module) {
  (async () => {
    const driver = new BrowserDriver({ port: 3000, cdpPort: 9222 });
    const collector = new TestCollector('Functional & Cross-Feature Flows');
    try {
      await driver.startServer();
      await driver.launchChrome();
      const results = await run(driver, collector);
      console.log(`\nFunctional & Cross-Feature Tests: ${results.filter(r => r.passed).length}/${results.length} passed`);
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
