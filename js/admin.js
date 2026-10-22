/**
 * AwamiConnect — Department & Moderator Portal Logic
 */

let adminComplaints = [];
let selectedComplaintForEdit = null;
const AUTH_SESSION_KEY = "awami_admin_auth";

document.addEventListener("DOMContentLoaded", () => {
  setupAuth();
  setupFilters();
  setupEditModal();
});

// 1. Authentication Handlers
function setupAuth() {
  const loginForm = document.getElementById("adminLoginForm");
  const quickDemoBtn = document.getElementById("btnQuickDemoLogin");
  const logoutBtn = document.getElementById("btnLogout");
  const resetDemoBtn = document.getElementById("btnResetDemo");

  // Check existing session with resilient corrupt session recovery
  try {
    const session = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (session) {
      const user = JSON.parse(session);
      if (user && typeof user === "object") {
        showAdminDashboard(user);
      } else {
        throw new Error("Invalid session format");
      }
    } else {
      showLoginScreen();
    }
  } catch (err) {
    console.warn("Corrupt session detected in sessionStorage, resetting to login screen:", err);
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch (ign) {}
    showLoginScreen();
  }

  // Handle standard login
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const user = { name: "Municipal Moderator", email: email, role: "moderator" };
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
      showToast("Signed in successfully!", "success");
      showAdminDashboard(user);
    });
  }

  // 1-Click Demo Login
  if (quickDemoBtn) {
    quickDemoBtn.addEventListener("click", () => {
      const demoUser = { name: "Chief Municipal Moderator", email: "chief.officer@civic.gov", role: "super_admin" };
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(demoUser));
      showToast("Signed in as Chief Moderator (Demo)", "success");
      showAdminDashboard(demoUser);
    });
  }

  // Sign out
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      showToast("Signed out.", "info");
      showLoginScreen();
    });
  }

  // Export CSV
  const exportBtn = document.getElementById("btnExportCsv");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportComplaintsToCSV(adminComplaints);
    });
  }

  // Reset Demo Data
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener("click", async () => {
      if (confirm("Reset all complaints back to initial demo dataset?")) {
        window.dbService.resetDemoData();
        showToast("Demo complaints restored!", "success");
        await loadAdminComplaints();
      }
    });
  }
}

function showLoginScreen() {
  document.getElementById("loginScreen").style.display = "block";
  document.getElementById("adminPortal").style.display = "none";
}

async function showAdminDashboard(user) {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("adminPortal").style.display = "block";
  document.getElementById("officerName").textContent = user.name || "Municipal Officer";
  await loadAdminComplaints();
}

// 2. Fetch and Display Complaints
async function loadAdminComplaints() {
  adminComplaints = await window.dbService.getAllComplaints();
  updateAdminMetrics(adminComplaints);
  filterAndRenderTable();
}

function updateAdminMetrics(complaints) {
  const total = complaints.length;
  const submitted = complaints.filter(c => c.status === "submitted").length;
  const assigned = complaints.filter(c => c.status === "assigned" || c.status === "under_review").length;
  const resolved = complaints.filter(c => c.status === "resolved").length;

  document.getElementById("adminTotalCount").textContent = total;
  document.getElementById("adminSubmittedCount").textContent = submitted;
  document.getElementById("adminAssignedCount").textContent = assigned;
  document.getElementById("adminResolvedCount").textContent = resolved;
}

// 3. Search & Filter Table
function setupFilters() {
  const searchInput = document.getElementById("adminSearchInput");
  const statusFilter = document.getElementById("adminStatusFilter");
  const catFilter = document.getElementById("adminCategoryFilter");
  const clearBtn = document.getElementById("btnClearFilters");

  if (searchInput) searchInput.addEventListener("input", filterAndRenderTable);
  if (statusFilter) statusFilter.addEventListener("change", filterAndRenderTable);
  if (catFilter) catFilter.addEventListener("change", filterAndRenderTable);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      statusFilter.value = "all";
      catFilter.value = "all";
      filterAndRenderTable();
    });
  }
}

function filterAndRenderTable() {
  const searchQuery = document.getElementById("adminSearchInput")?.value.toLowerCase().trim() || "";
  const statusFilter = document.getElementById("adminStatusFilter")?.value || "all";
  const catFilter = document.getElementById("adminCategoryFilter")?.value || "all";

  const filtered = adminComplaints.filter(c => {
    // Search match
    const textMatch = 
      (c.id && c.id.toLowerCase().includes(searchQuery)) ||
      (c.title && c.title.toLowerCase().includes(searchQuery)) ||
      (c.locationName && c.locationName.toLowerCase().includes(searchQuery)) ||
      (c.citizenName && c.citizenName.toLowerCase().includes(searchQuery));

    // Status match
    const statusMatch = statusFilter === "all" || c.status === statusFilter;

    // Category match
    const catMatch = catFilter === "all" || c.category === catFilter;

    return textMatch && statusMatch && catMatch;
  });

  renderTable(filtered);
}

function renderTable(complaints) {
  const tbody = document.getElementById("complaintsTableBody");
  if (!tbody) return;

  if (complaints.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No complaints match the current filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = complaints.map(c => `
    <tr>
      <td>
        <img src="${c.imageUrl || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=120&q=80'}" 
             alt="Photo" 
             style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border);" />
      </td>
      <td>
        <strong style="color: var(--primary); font-size: 0.85rem;">${c.id}</strong>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${getRelativeTime(c.submittedAt)}</div>
      </td>
      <td>
        <span style="font-size: 0.85rem;">${c.categoryIcon || '📁'} ${c.categoryLabel || c.category}</span>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${c.department || 'Unassigned'}</div>
      </td>
      <td style="max-width: 250px;">
        <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 2px;">${c.title}</div>
        <div style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          📍 ${c.locationName || 'Location marked'}
        </div>
      </td>
      <td>
        <div style="font-size: 0.85rem; font-weight: 600;">${c.citizenName || 'Resident'}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${c.citizenPhone || '--'}</div>
      </td>
      <td>
        ${getStatusBadge(c.status)}
      </td>
      <td>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openEditModal('${c.id}')">
          ✏️ Manage
        </button>
      </td>
    </tr>
  `).join("");
}

// 4. Edit & Action Modal
function setupEditModal() {
  const modal = document.getElementById("editModal");
  const closeBtn = document.getElementById("modalCloseX");
  const cancelBtn = document.getElementById("btnCancelEdit");
  const saveBtn = document.getElementById("btnSaveEdit");
  const deleteBtn = document.getElementById("btnDeleteComplaint");

  const closeModal = () => modal.classList.remove("open");

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!selectedComplaintForEdit) return;
      if (confirm(`Are you sure you want to delete complaint ${selectedComplaintForEdit.id}?`)) {
        await window.dbService.deleteComplaint(selectedComplaintForEdit.id);
        showToast(`Complaint ${selectedComplaintForEdit.id} deleted.`, "info");
        closeModal();
        await loadAdminComplaints();
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      if (!selectedComplaintForEdit) return;

      const newStatus = document.getElementById("modalStatusSelect").value;
      const department = document.getElementById("modalDepartmentSelect").value;
      const remarks = document.getElementById("modalRemarksText").value.trim();
      const proofUrl = document.getElementById("modalProofUrl").value.trim();

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      try {
        await window.dbService.updateComplaintStatus(
          selectedComplaintForEdit.id,
          newStatus,
          remarks,
          department,
          proofUrl
        );

        showToast(`Complaint ${selectedComplaintForEdit.id} updated!`, "success");
        closeModal();
        await loadAdminComplaints();
      } catch (err) {
        console.error("Save error:", err);
        showToast("Failed to save updates.", "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span>💾</span> Save Status & Updates`;
      }
    });
  }
}

window.openEditModal = function (complaintId) {
  const complaint = adminComplaints.find(c => c.id === complaintId);
  if (!complaint) return;

  selectedComplaintForEdit = complaint;

  document.getElementById("modalEditId").textContent = complaint.id;
  document.getElementById("modalEditHeading").textContent = complaint.title;
  document.getElementById("modalEditLocation").textContent = `📍 ${complaint.locationName || 'Marked on map'}`;
  document.getElementById("modalEditCitizen").textContent = `Reported by: ${complaint.citizenName || 'Citizen'} (${complaint.citizenPhone || 'N/A'})`;
  document.getElementById("modalEditDesc").textContent = complaint.description;

  const photo = document.getElementById("modalEditPhoto");
  photo.src = complaint.imageUrl || "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=120&q=80";

  // Form values
  document.getElementById("modalStatusSelect").value = complaint.status || "submitted";
  document.getElementById("modalDepartmentSelect").value = complaint.department || "District Works & Highways";
  document.getElementById("modalRemarksText").value = complaint.officerRemarks || "";
  document.getElementById("modalProofUrl").value = complaint.resolutionProofUrl || "";

  document.getElementById("editModal").classList.add("open");
};

// 5. CSV Export Helper
function exportComplaintsToCSV(complaints) {
  if (!complaints || complaints.length === 0) {
    showToast("No data available to export.", "error");
    return;
  }

  const headers = ["ID", "Title", "Category", "Status", "Department", "Citizen Name", "Citizen Phone", "Location", "Submitted At", "Resolved At"];
  const rows = complaints.map(c => [
    `"${c.id || ''}"`,
    `"${(c.title || '').replace(/"/g, '""')}"`,
    `"${c.categoryLabel || c.category || ''}"`,
    `"${(c.status || '').toUpperCase()}"`,
    `"${(c.department || '').replace(/"/g, '""')}"`,
    `"${(c.citizenName || '').replace(/"/g, '""')}"`,
    `"${(c.citizenPhone || '').replace(/"/g, '""')}"`,
    `"${(c.locationName || '').replace(/"/g, '""')}"`,
    `"${c.submittedAt || ''}"`,
    `"${c.resolvedAt || ''}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `AwamiConnect_Complaints_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Complaints CSV report downloaded!", "success");
}
