/**
 * AwamiConnect — Citizen Complaint Tracking Logic
 */

let trackMapInstance = null;
let trackMarker = null;
let currentComplaint = null;
let trackUnsubscribe = null;

document.addEventListener("DOMContentLoaded", () => {
  setupSearchForm();
  checkUrlParams();
  setupConfirmationButton();
});

// Check if ?id=AC-2026-XXXX is in URL
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get("id");
  if (complaintId) {
    document.getElementById("trackSearchInput").value = complaintId;
    loadComplaintDetails(complaintId);
  }
}

// Search Form Handler
function setupSearchForm() {
  const form = document.getElementById("trackSearchForm");
  const input = document.getElementById("trackSearchInput");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = input.value.trim();
    if (id) {
      // Update browser URL without reload
      const newUrl = `${window.location.pathname}?id=${encodeURIComponent(id)}`;
      window.history.pushState({ path: newUrl }, "", newUrl);
      loadComplaintDetails(id);
    }
  });

  const copyBtn = document.getElementById("btnCopyResultId");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (currentComplaint) copyToClipboard(currentComplaint.id);
    });
  }

  const printBtn = document.getElementById("btnPrintTicket");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }
}

// Load and Render Complaint
async function loadComplaintDetails(complaintId) {
  const loading = document.getElementById("trackLoading");
  const notFound = document.getElementById("trackNotFound");
  const resultCard = document.getElementById("complaintResult");

  loading.style.display = "block";
  notFound.style.display = "none";
  resultCard.style.display = "none";

  try {
    const complaint = await window.dbService.getComplaintById(complaintId);

    loading.style.display = "none";

    if (!complaint) {
      notFound.style.display = "block";
      return;
    }

    currentComplaint = complaint;
    // Make container visible BEFORE initializing map so Leaflet measures non-zero dimensions
    resultCard.style.display = "block";
    renderComplaint(complaint);

    // Subscribe to live updates for this complaint
    if (typeof trackUnsubscribe === "function") {
      trackUnsubscribe();
      trackUnsubscribe = null;
    }
    if (window.dbService && typeof window.dbService.onComplaintChange === "function") {
      trackUnsubscribe = window.dbService.onComplaintChange(complaintId, (liveComplaint) => {
        if (liveComplaint) {
          currentComplaint = liveComplaint;
          renderComplaint(liveComplaint);
        }
      });
    }

    // Multi-tier post-display size invalidation to force complete tile rendering
    requestAnimationFrame(() => {
      if (trackMapInstance) {
        trackMapInstance.invalidateSize();
      }
    });
    setTimeout(() => {
      if (trackMapInstance) {
        trackMapInstance.invalidateSize();
      }
    }, 150);

  } catch (err) {
    console.error("Error loading complaint:", err);
    loading.style.display = "none";
    showToast("Error retrieving complaint.", "error");
  }
}

function renderComplaint(c) {
  document.getElementById("complaintTrackingId").textContent = c.id;
  document.getElementById("complaintTitle").textContent = c.title;
  document.getElementById("complaintDate").textContent = formatDate(c.submittedAt);
  document.getElementById("complaintReporter").textContent = c.citizenName || "Anonymous Resident";
  document.getElementById("complaintStatusBadge").innerHTML = getStatusBadge(c.status);

  // Evidence Photo
  const photoElem = document.getElementById("complaintPhoto");
  photoElem.src = c.imageUrl || "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80";

  // WhatsApp share link
  const shareBtn = document.getElementById("btnShareTicket");
  if (shareBtn) {
    const text = encodeURIComponent(`🏛️ AwamiConnect Civic Update: "${c.title}" (Status: ${c.status.toUpperCase()}). Track here: ${window.location.href}`);
    shareBtn.href = `https://wa.me/?text=${text}`;
  }

  document.getElementById("complaintDescription").textContent = c.description;
  document.getElementById("complaintCategory").textContent = `${c.categoryIcon || ''} ${c.categoryLabel || c.category}`;
  document.getElementById("complaintDepartment").textContent = c.department || "Municipal Administration";

  // Location text
  document.getElementById("complaintAddress").textContent = c.locationName || `${c.lat}, ${c.lng}`;

  // Mini Map
  initTrackMiniMap(c.lat, c.lng, c.title);

  // Official Remarks
  const remarksElem = document.getElementById("complaintRemarks");
  if (c.officerRemarks && c.officerRemarks.trim()) {
    remarksElem.textContent = c.officerRemarks;
  } else {
    remarksElem.textContent = "Your complaint is registered and queued for moderator review. Official updates will appear here.";
  }

  // Proof Photo
  const proofContainer = document.getElementById("proofPhotoContainer");
  const proofPhoto = document.getElementById("complaintProofPhoto");
  if (c.resolutionProofUrl) {
    proofPhoto.src = c.resolutionProofUrl;
    proofContainer.style.display = "block";
  } else {
    proofContainer.style.display = "none";
  }

  // Community Confirmations / Upvotes
  const confirmCountElem = document.getElementById("confirmationCount");
  const confirmBtn = document.getElementById("btnConfirmFix");
  const count = c.communityConfirmations || 1;
  const isResolved = c.status === "resolved";

  confirmCountElem.textContent = isResolved
    ? `${count} Verification${count > 1 ? 's' : ''}`
    : `${count} Affected Resident${count > 1 ? 's' : ''}`;

  if (c.userConfirmed) {
    confirmBtn.disabled = true;
    confirmBtn.className = "btn btn-outline";
    confirmBtn.innerHTML = isResolved
      ? `<span>✓</span> You Confirmed This Fix`
      : `<span>✓</span> You Upvoted This Issue`;
  } else {
    confirmBtn.disabled = false;
    confirmBtn.className = "btn btn-primary";
    confirmBtn.innerHTML = isResolved
      ? `<span>✅</span> Confirm It's Resolved`
      : `<span>👍</span> I Face This Too (+1 Upvote)`;
  }

  // Render Timeline
  renderTimeline(c);
}

// Render Lifecycle Progress Timeline
function renderTimeline(c) {
  const container = document.getElementById("progressTimeline");
  const status = c.status; // submitted, under_review, assigned, resolved, rejected

  const steps = [
    {
      title: "1. Submitted",
      date: formatDate(c.submittedAt),
      isDone: true,
      isActive: status === "submitted"
    },
    {
      title: "2. Under Review",
      date: c.reviewedAt ? formatDate(c.reviewedAt) : (status === "under_review" ? "In Progress" : "Pending"),
      isDone: ["under_review", "assigned", "resolved"].includes(status),
      isActive: status === "under_review"
    },
    {
      title: "3. Assigned",
      date: c.assignedAt ? formatDate(c.assignedAt) : (status === "assigned" ? "In Progress" : "Pending"),
      isDone: ["assigned", "resolved"].includes(status),
      isActive: status === "assigned"
    },
    {
      title: "4. Resolved",
      date: c.resolvedAt ? formatDate(c.resolvedAt) : (status === "resolved" ? "Completed" : "Pending"),
      isDone: status === "resolved",
      isActive: status === "resolved"
    }
  ];

  container.innerHTML = steps.map(s => {
    let stateClass = "";
    if (s.isDone) stateClass = "completed";
    if (s.isActive) stateClass = "active";

    let iconText = "✓";
    if (s.isActive) iconText = "●";
    if (!s.isDone && !s.isActive) iconText = "○";

    return `
      <div class="timeline-step ${stateClass}">
        <div class="timeline-icon">${iconText}</div>
        <div class="timeline-content">
          <div class="timeline-title">${s.title}</div>
          <div class="timeline-date">${s.date}</div>
        </div>
      </div>
    `;
  }).join("");
}

// Mini Map initialization
function initTrackMiniMap(lat, lng, title) {
  if (typeof L === "undefined") return;

  const mapContainer = document.getElementById("trackMap");
  if (!mapContainer) return;

  if (!lat || !lng) {
    mapContainer.style.display = "none";
    return;
  }
  mapContainer.style.display = "block";

  if (trackMapInstance) {
    trackMapInstance.remove();
    trackMapInstance = null;
  }

  trackMapInstance = L.map("trackMap", {
    scrollWheelZoom: false, // Prevent desktop page scroll hijacking
    dragging: true,
    touchZoom: true
  }).setView([lat, lng], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(trackMapInstance);

  const safeTitle = typeof escapeHtml === "function"
    ? escapeHtml(title || "Reported Location")
    : (title || "Reported Location");

  trackMarker = L.marker([lat, lng]).addTo(trackMapInstance);
  trackMarker.bindPopup(`<b>${safeTitle}</b>`).openPopup();

  // Multi-tier size invalidation
  requestAnimationFrame(() => {
    if (trackMapInstance) trackMapInstance.invalidateSize();
  });
  setTimeout(() => {
    if (trackMapInstance) trackMapInstance.invalidateSize();
  }, 150);
}

// Add window resize listener to eliminate gray gaps on screen rotation / resize
window.addEventListener("resize", () => {
  if (trackMapInstance) {
    trackMapInstance.invalidateSize();
  }
});

// Confirmation Button Listener
function setupConfirmationButton() {
  const btn = document.getElementById("btnConfirmFix");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!currentComplaint) return;

    btn.disabled = true;
    btn.textContent = "Updating...";

    try {
      const updated = await window.dbService.confirmResolution(currentComplaint.id, true);
      if (updated) {
        currentComplaint = updated;
        const count = updated.communityConfirmations;
        const isResolved = updated.status === "resolved";
        document.getElementById("confirmationCount").textContent = isResolved
          ? `${count} Verification${count > 1 ? 's' : ''}`
          : `${count} Affected Resident${count > 1 ? 's' : ''}`;
        btn.className = "btn btn-outline";
        btn.innerHTML = isResolved
          ? `<span>✓</span> You Confirmed This Fix`
          : `<span>✓</span> You Upvoted This Issue`;
        showToast(
          isResolved ? "Thank you for verifying this civic resolution!" : "Thank you for upvoting this civic issue!",
          "success"
        );
      }
    } catch (err) {
      console.error("Confirmation error:", err);
      showToast("Could not submit confirmation.", "error");
      btn.disabled = false;
    }
  });
}
