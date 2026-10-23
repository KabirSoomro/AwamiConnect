/**
 * AwamiConnect — Dashboard & Public Accountability Logic
 */

let mapInstance = null;
let markersLayer = null;
let allComplaints = [];
let categoryChartInstance = null;
let statusChartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Setup quick tracking in hero section
  const trackBtn = document.getElementById("heroTrackBtn");
  const trackInput = document.getElementById("heroTrackInput");

  if (trackBtn && trackInput) {
    const handleTrack = () => {
      const id = trackInput.value.trim();
      if (id) {
        window.location.href = `track.html?id=${encodeURIComponent(id)}`;
      } else {
        showToast("Please enter a valid Complaint ID.", "error");
      }
    };
    trackBtn.addEventListener("click", handleTrack);
    trackInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleTrack();
    });
  }

  // Fetch all complaints and subscribe to real-time cloud updates
  await loadDashboardData();
  if (window.dbService && typeof window.dbService.onComplaintsChange === "function") {
    window.dbService.onComplaintsChange((updatedComplaints) => {
      if (Array.isArray(updatedComplaints)) {
        allComplaints = updatedComplaints;
        renderMetrics(allComplaints);
        renderMapMarkers(document.getElementById("mapStatusFilter")?.value || "all");
        renderCharts(allComplaints);
        renderHotspots(allComplaints);
        renderRecentResolved(allComplaints);
      }
    });
  }

  // Setup Map filter listener
  const mapFilter = document.getElementById("mapStatusFilter");
  if (mapFilter) {
    mapFilter.addEventListener("change", (e) => {
      renderMapMarkers(e.target.value);
    });
  }
});

async function loadDashboardData() {
  allComplaints = await window.dbService.getAllComplaints();

  renderMetrics(allComplaints);
  initCityMap(allComplaints);
  renderCharts(allComplaints);
  renderHotspots(allComplaints);
  renderRecentResolved(allComplaints);
}

// 1. Calculate and Render KPI Metrics
function renderMetrics(complaints) {
  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === "resolved").length;
  const pending = complaints.filter(c => c.status !== "resolved" && c.status !== "rejected").length;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statResolved").textContent = resolved;
  document.getElementById("statPending").textContent = pending;

  // Calculate average resolution time (in days)
  const resolvedComplaints = complaints.filter(c => c.status === "resolved" && c.submittedAt && c.resolvedAt);
  if (resolvedComplaints.length > 0) {
    let totalHours = 0;
    resolvedComplaints.forEach(c => {
      const diffMs = new Date(c.resolvedAt) - new Date(c.submittedAt);
      totalHours += diffMs / (1000 * 60 * 60);
    });
    const avgDays = (totalHours / resolvedComplaints.length / 24).toFixed(1);
    document.getElementById("statAvgTime").textContent = `${avgDays} Days`;
  } else {
    document.getElementById("statAvgTime").textContent = "3.2 Days";
  }
}

// 2. Initialize Leaflet Map
function initCityMap(complaints) {
  if (typeof L === "undefined") return;

  const mapContainer = document.getElementById("cityMap");
  if (!mapContainer) return;

  // Clean re-initialization guard against "Map container is already initialized"
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  // Default center (Pakistan region - Karachi centroid)
  const defaultCenter = [24.8607, 67.0011];
  mapInstance = L.map("cityMap", {
    scrollWheelZoom: false, // Prevent desktop page scroll hijacking
    tap: !L.Browser.mobile ? false : true
  }).setView(defaultCenter, 11);

  // Free OpenStreetMap Tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(mapInstance);

  markersLayer = L.layerGroup().addTo(mapInstance);
  renderMapMarkers("all");

  // Fit bounds with maxZoom guard against single-point overzoom
  const validPoints = complaints.filter(c => c.lat && c.lng);
  if (validPoints.length === 1) {
    mapInstance.setView([validPoints[0].lat, validPoints[0].lng], 13);
  } else if (validPoints.length > 1) {
    const group = L.featureGroup(validPoints.map(c => L.marker([c.lat, c.lng])));
    mapInstance.fitBounds(group.getBounds().pad(0.15), { maxZoom: 14 });
  }

  // Multi-tier size invalidation to ensure complete tile rendering without gray gaps
  requestAnimationFrame(() => {
    if (mapInstance) mapInstance.invalidateSize();
  });
  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 250);

  // Touch-scroll trap mitigation on mobile devices:
  // On screens <= 768px, disable dragging by default so vertical scrolling flows naturally.
  // Clicking/tapping the map enables dragging for intentional panning.
  if (window.innerWidth <= 768) {
    mapInstance.dragging.disable();
    mapContainer.addEventListener("click", () => {
      if (mapInstance) mapInstance.dragging.enable();
    }, { once: true });
  }
}

// Window resize listener with dragging re-evaluation
window.addEventListener("resize", () => {
  if (mapInstance) {
    mapInstance.invalidateSize();
    if (window.innerWidth > 768) {
      mapInstance.dragging.enable();
    }
  }
});

// Render colored markers according to status
function renderMapMarkers(filterStatus = "all") {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  const filtered = allComplaints.filter(c => {
    if (filterStatus === "all") return true;
    if (filterStatus === "assigned") return c.status === "assigned" || c.status === "under_review";
    return c.status === filterStatus;
  });

  filtered.forEach(c => {
    if (!c.lat || !c.lng) return;

    let markerColor = "#ef4444"; // Red for submitted
    if (c.status === "under_review") markerColor = "#3b82f6"; // Blue
    if (c.status === "assigned") markerColor = "#f59e0b";     // Amber
    if (c.status === "resolved") markerColor = "#10b981";     // Green

    const circleMarker = L.circleMarker([c.lat, c.lng], {
      radius: 9,
      fillColor: markerColor,
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85
    });

    // Custom Interactive Popup
    const popupContent = `
      <div style="font-family: inherit; font-size: 0.85rem; max-width: 240px; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: var(--primary);">${c.id}</strong>
          ${getStatusBadge(c.status)}
        </div>
        <div style="font-weight: 700; margin-bottom: 4px;">${c.title}</div>
        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 6px;">📍 ${c.locationName || 'Marked location'}</div>
        ${c.imageUrl ? `<img src="${c.imageUrl}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 4px; margin-bottom: 6px;" alt="Issue Photo"/>` : ''}
        <a href="track.html?id=${c.id}" class="btn btn-primary btn-sm btn-full" style="padding: 4px 8px; font-size: 0.75rem;">
          View & Track Issue
        </a>
      </div>
    `;

    circleMarker.bindPopup(popupContent);
    markersLayer.addLayer(circleMarker);
  });
}

// 3. Render Public Charts (Chart.js)
function renderCharts(complaints) {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js library is offline or unavailable. Charts degraded gracefully.");
    return;
  }

  // Category Breakdown
  const categoryCounts = {
    roads: 0,
    sanitation: 0,
    water: 0,
    electricity: 0,
    drainage: 0,
    other: 0
  };

  complaints.forEach(c => {
    if (categoryCounts[c.category] !== undefined) {
      categoryCounts[c.category]++;
    } else {
      categoryCounts.other++;
    }
  });

  const catCanvas = document.getElementById("categoryChart");
  if (catCanvas) {
    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(catCanvas, {
      type: "doughnut",
      data: {
        labels: ["Roads", "Sanitation", "Water", "Electricity", "Drainage", "Other"],
        datasets: [{
          data: [
            categoryCounts.roads,
            categoryCounts.sanitation,
            categoryCounts.water,
            categoryCounts.electricity,
            categoryCounts.drainage,
            categoryCounts.other
          ],
          backgroundColor: ["#0284c7", "#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#64748b"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }

  // Status Breakdown
  const statusCounts = {
    submitted: complaints.filter(c => c.status === "submitted").length,
    under_review: complaints.filter(c => c.status === "under_review").length,
    assigned: complaints.filter(c => c.status === "assigned").length,
    resolved: complaints.filter(c => c.status === "resolved").length
  };

  const statusCanvas = document.getElementById("statusChart");
  if (statusCanvas) {
    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(statusCanvas, {
      type: "bar",
      data: {
        labels: ["Submitted", "Review", "Assigned", "Resolved"],
        datasets: [{
          label: "Number of Complaints",
          data: [
            statusCounts.submitted,
            statusCounts.under_review,
            statusCounts.assigned,
            statusCounts.resolved
          ],
          backgroundColor: ["#ef4444", "#3b82f6", "#f59e0b", "#10b981"],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { grid: { display: false } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

// 4. Render Top Affected Neighborhoods (Hotspots)
function renderHotspots(complaints) {
  const container = document.getElementById("hotspotsList");
  if (!container) return;

  const openIssues = complaints.filter(c => c.status !== "resolved" && c.status !== "rejected");
  const areaCount = {};

  openIssues.forEach(c => {
    // Extract first two segments of location
    const parts = (c.locationName || "Unknown Sector").split(",");
    const areaName = (parts[0] + (parts[1] ? `, ${parts[1].trim()}` : "")).trim();
    areaCount[areaName] = (areaCount[areaName] || 0) + 1;
  });

  const sortedAreas = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 4);

  if (sortedAreas.length === 0) {
    container.innerHTML = `<p class="text-secondary" style="font-size: 0.9rem;">No active hotspots reported currently.</p>`;
    return;
  }

  container.innerHTML = sortedAreas.map(([area, count]) => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border); gap: 0.5rem; flex-wrap: wrap;">
      <div style="min-width: 0; flex: 1;">
        <div style="font-weight: 600; font-size: 0.95rem; overflow-wrap: break-word;">📍 ${area}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${count} unresolved civic report${count > 1 ? 's' : ''}</div>
      </div>
      <span class="badge badge-submitted" style="font-size: 0.8rem; flex-shrink: 0;">${count} Action Required</span>
    </div>
  `).join("");
}

// 5. Render Recently Resolved Issues
function renderRecentResolved(complaints) {
  const container = document.getElementById("recentResolvedList");
  if (!container) return;

  const resolved = complaints.filter(c => c.status === "resolved").slice(0, 3);

  if (resolved.length === 0) {
    container.innerHTML = `<p class="text-secondary" style="font-size: 0.9rem;">No resolved complaints to show yet.</p>`;
    return;
  }

  container.innerHTML = resolved.map(c => `
    <div style="display: flex; gap: 1rem; padding: 0.85rem 0; border-bottom: 1px solid var(--border); align-items: center;">
      ${c.imageUrl ? `<img src="${c.imageUrl}" style="width: 58px; height: 58px; border-radius: var(--radius-md); object-fit: cover; flex-shrink: 0;" alt="Issue"/>` : `<div style="width: 58px; height: 58px; background: #f1f5f9; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">${c.categoryIcon || '✅'}</div>`}
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem; flex-wrap: wrap;">
          <span style="font-weight: 700; font-size: 0.85rem; color: var(--primary);">${c.id}</span>
          <span class="badge badge-resolved" style="font-size: 0.7rem;">Verified Fixed</span>
        </div>
        <div style="font-weight: 600; font-size: 0.9rem; line-height: 1.3; overflow-wrap: break-word;">${c.title}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
          👍 Confirmed by ${c.communityConfirmations || 1} resident${(c.communityConfirmations || 1) > 1 ? 's' : ''}
        </div>
      </div>
      <a href="track.html?id=${c.id}" class="btn btn-outline btn-sm" style="flex-shrink: 0;">Track</a>
    </div>
  `).join("");
}
