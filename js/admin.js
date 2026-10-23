/**
 * AwamiConnect — Department & Moderator Portal Logic
 */

let adminComplaints = [];
let selectedComplaintForEdit = null;
const AUTH_SESSION_KEY = "awami_admin_auth";
const ADMIN_CREDS_KEY = "awami_admin_credentials";

const DEFAULT_ADMIN_CREDS = {
  name: "Admin",
  email: "admin@gmail.com",
  password: "admin123"
};

function getAdminCredentials() {
  try {
    const raw = localStorage.getItem(ADMIN_CREDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email && parsed.password) {
        return {
          name: parsed.name || "Admin",
          email: parsed.email,
          password: parsed.password
        };
      }
    }
  } catch (e) {}
  return { ...DEFAULT_ADMIN_CREDS };
}

function saveAdminCredentials(creds) {
  localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(creds));
}

document.addEventListener("DOMContentLoaded", () => {
  setupAuth();
  setupSettingsModal();
  setupForgotPasswordModal();
  setupResetViaLinkModal();
  checkResetTokenInUrl();
  setupPasswordToggles();
  setupFilters();
  setupEditModal();
});

// 1. Authentication Handlers
function setupAuth() {
  const loginForm = document.getElementById("adminLoginForm");
  const logoutBtn = document.getElementById("btnLogout");
  const resetDemoBtn = document.getElementById("btnResetDemo");
  const loginEmailInput = document.getElementById("loginEmail");

  const currentCreds = getAdminCredentials();
  if (loginEmailInput) {
    loginEmailInput.placeholder = currentCreds.email;
  }

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
      const activeCreds = getAdminCredentials();
      const email = (document.getElementById("loginEmail").value.trim() || activeCreds.email).toLowerCase();
      const password = document.getElementById("loginPassword").value.trim();

      if (!password) {
        showToast("Please enter your admin password.", "error");
        return;
      }

      if (email !== activeCreds.email.toLowerCase()) {
        showToast(`Invalid Admin Email! Registered admin is: ${activeCreds.email}`, "error");
        return;
      }

      if (password !== activeCreds.password) {
        showToast("Incorrect password! Please enter the correct admin password.", "error");
        return;
      }

      const user = { name: activeCreds.name || "Admin", email: activeCreds.email, role: "super_admin" };
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
      showToast("Signed in successfully as Admin!", "success");
      showAdminDashboard(user);
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

let adminUnsubscribe = null;

async function showAdminDashboard(user) {
  const activeCreds = getAdminCredentials();
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("adminPortal").style.display = "block";
  document.getElementById("officerName").textContent = activeCreds.name || user.name || "Admin";
  const emailDisplay = document.getElementById("officerEmail");
  if (emailDisplay) emailDisplay.textContent = activeCreds.email;
  await loadAdminComplaints();

  if (!adminUnsubscribe && window.dbService && typeof window.dbService.onComplaintsChange === "function") {
    adminUnsubscribe = window.dbService.onComplaintsChange((updated) => {
      if (Array.isArray(updated)) {
        adminComplaints = updated;
        updateAdminMetrics(adminComplaints);
        filterAndRenderTable();
      }
    });
  }
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
  document.getElementById("modalEditCitizen").textContent = `Reported by: ${complaint.citizenName || 'Resident'} (${complaint.citizenPhone || '--'})`;
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

// 6. Admin Account Settings (Change Email & Password)
function setupSettingsModal() {
  const modal = document.getElementById("settingsModal");
  const openBtn = document.getElementById("btnAdminSettings");
  const closeX = document.getElementById("btnCloseSettingsX");
  const cancelBtn = document.getElementById("btnCancelSettings");
  const saveBtn = document.getElementById("btnSaveSettings");
  const resetBtn = document.getElementById("btnResetCredsToDefault");

  if (!modal) return;

  function openModal() {
    const creds = getAdminCredentials();
    const nameInput = document.getElementById("settingsName");
    if (nameInput) nameInput.value = creds.name || "Admin";
    document.getElementById("settingsEmail").value = creds.email;
    document.getElementById("settingsCurrentPass").value = "";
    document.getElementById("settingsNewPass").value = "";
    document.getElementById("settingsConfirmPass").value = "";
    modal.classList.add("open");
  }

  function closeModal() {
    modal.classList.remove("open");
  }

  if (openBtn) openBtn.addEventListener("click", openModal);
  if (closeX) closeX.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Reset to default Admin / admin@gmail.com / admin123
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset admin credentials back to default (Admin / admin@gmail.com / admin123)?")) {
        saveAdminCredentials(DEFAULT_ADMIN_CREDS);
        const nameInput = document.getElementById("settingsName");
        if (nameInput) nameInput.value = DEFAULT_ADMIN_CREDS.name;
        document.getElementById("settingsEmail").value = DEFAULT_ADMIN_CREDS.email;
        document.getElementById("settingsCurrentPass").value = "";
        document.getElementById("settingsNewPass").value = "";
        document.getElementById("settingsConfirmPass").value = "";

        const officerName = document.getElementById("officerName");
        if (officerName) officerName.textContent = DEFAULT_ADMIN_CREDS.name;
        const emailDisplay = document.getElementById("officerEmail");
        if (emailDisplay) emailDisplay.textContent = DEFAULT_ADMIN_CREDS.email;
        const loginEmail = document.getElementById("loginEmail");
        if (loginEmail) loginEmail.placeholder = DEFAULT_ADMIN_CREDS.email;

        showToast("Credentials restored to default: Admin (admin@gmail.com / admin123)", "info");
      }
    });
  }

  // Save new credentials
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const creds = getAdminCredentials();
      const nameInput = document.getElementById("settingsName");
      const newName = (nameInput ? nameInput.value.trim() : "") || "Admin";
      const newEmail = document.getElementById("settingsEmail").value.trim().toLowerCase();
      const currentPass = document.getElementById("settingsCurrentPass").value.trim();
      const newPass = document.getElementById("settingsNewPass").value.trim();
      const confirmPass = document.getElementById("settingsConfirmPass").value.trim();

      if (!newEmail) {
        showToast("Admin Email cannot be empty.", "error");
        return;
      }

      if (!/\S+@\S+\.\S+/.test(newEmail)) {
        showToast("Please enter a valid email address.", "error");
        return;
      }

      if (!currentPass) {
        showToast("Please enter your current password to authorize changes.", "error");
        return;
      }

      if (currentPass !== creds.password) {
        showToast("Current password does not match! Verification failed.", "error");
        return;
      }

      let finalPassword = creds.password;
      if (newPass) {
        if (newPass.length < 4) {
          showToast("New password must be at least 4 characters long.", "error");
          return;
        }
        if (newPass !== confirmPass) {
          showToast("New password and confirm password do not match!", "error");
          return;
        }
        finalPassword = newPass;
      }

      const updatedCreds = {
        name: newName,
        email: newEmail,
        password: finalPassword
      };
      saveAdminCredentials(updatedCreds);

      // Update current session
      const updatedUser = { name: newName, email: newEmail, role: "super_admin" };
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));

      // Update UI displays
      const officerName = document.getElementById("officerName");
      if (officerName) officerName.textContent = newName;
      const officerEmail = document.getElementById("officerEmail");
      if (officerEmail) officerEmail.textContent = newEmail;
      const loginEmail = document.getElementById("loginEmail");
      if (loginEmail) loginEmail.placeholder = newEmail;

      closeModal();
      showToast("Admin settings updated successfully!", "success");
    });
  }
}

// 7. Password Visibility Toggle (Show / Hide Password)
function setupPasswordToggles() {
  document.querySelectorAll(".password-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
        btn.title = "Hide password";
      } else {
        input.type = "password";
        btn.textContent = "👁️";
        btn.title = "Show password";
      }
    });
  });
}

const RESET_TOKEN_KEY = "awami_admin_reset_token";

// 8. Forgot Password: Send Password Reset Link directly to Admin's Email
function setupForgotPasswordModal() {
  const modal = document.getElementById("forgotPasswordModal");
  const openLink = document.getElementById("btnForgotPassLink");
  const closeX = document.getElementById("btnCloseForgotX");
  const cancelBtn = document.getElementById("btnCancelForgot");
  const sendLinkBtn = document.getElementById("btnSendResetLink");
  const backToLoginBtn = document.getElementById("btnBackToLoginAfterSent");

  if (!modal) return;

  function openForgotModal() {
    const creds = getAdminCredentials();
    const emailInput = document.getElementById("forgotEmailInput");
    if (emailInput) emailInput.value = creds.email;

    document.getElementById("forgotStep1").style.display = "block";
    document.getElementById("forgotStep2").style.display = "none";
    const footer = document.getElementById("forgotModalFooter");
    if (footer) footer.style.display = "flex";
    modal.classList.add("open");
  }

  function closeForgotModal() {
    modal.classList.remove("open");
  }

  if (openLink) openLink.addEventListener("click", openForgotModal);
  if (closeX) closeX.addEventListener("click", closeForgotModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeForgotModal);
  if (backToLoginBtn) backToLoginBtn.addEventListener("click", closeForgotModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeForgotModal();
  });

  // Send Reset Link to Admin's Registered Email
  if (sendLinkBtn) {
    sendLinkBtn.addEventListener("click", async () => {
      const creds = getAdminCredentials();
      const enteredEmail = document.getElementById("forgotEmailInput").value.trim().toLowerCase();

      if (!enteredEmail) {
        showToast("Please enter your registered Admin Email.", "error");
        return;
      }

      if (enteredEmail !== creds.email.toLowerCase()) {
        showToast(`No admin account registered with: ${enteredEmail}`, "error");
        return;
      }

      sendLinkBtn.disabled = true;
      sendLinkBtn.innerHTML = `<span>⏳</span> Dispatching Reset Link...`;

      // Generate unique token
      const token = "rst_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      const tokenData = {
        token: token,
        email: creds.email,
        expiresAt: Date.now() + 60 * 60 * 1000 // 60 minutes
      };
      localStorage.setItem(RESET_TOKEN_KEY, JSON.stringify(tokenData));

      // Build link
      const resetUrl = `${window.location.origin}${window.location.pathname}?reset_token=${token}`;

      // Dispatch Email to Admin's Email via FormSubmit
      try {
        await fetch(`https://formsubmit.co/ajax/${creds.email}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            _subject: "🔐 AwamiConnect: Password Reset Link for Admin",
            _template: "table",
            _captcha: "false",
            "Account": "AwamiConnect Administrator Portal",
            "Admin Email": creds.email,
            "Password Reset Link": resetUrl,
            "Validity": "60 Minutes",
            "Instructions": "Click the Password Reset Link above to open the secure portal and set your new admin password.",
            "Requested At": new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })
          })
        });
      } catch (err) {
        console.warn("Email dispatch note (non-blocking):", err);
      } finally {
        sendLinkBtn.disabled = false;
        sendLinkBtn.innerHTML = `<span>📨</span> Send Password Reset Link to Email`;
      }

      // Display Step 2 Confirmation & Shortcut Link
      document.getElementById("displaySentEmail").textContent = creds.email;
      const linkDirectReset = document.getElementById("linkDirectReset");
      if (linkDirectReset) {
        linkDirectReset.href = resetUrl;
      }

      document.getElementById("forgotStep1").style.display = "none";
      document.getElementById("forgotStep2").style.display = "block";
      const footer = document.getElementById("forgotModalFooter");
      if (footer) footer.style.display = "none";

      showToast(`Password reset link dispatched to ${creds.email}!`, "success");
    });
  }
}

// 9. Check Reset Token in URL and open Set New Password Modal
function checkResetTokenInUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get("reset_token");
  if (!resetToken) return;

  const rawTokenData = localStorage.getItem(RESET_TOKEN_KEY);
  if (!rawTokenData) {
    showToast("This password reset link is invalid or has already been used.", "error");
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  try {
    const tokenData = JSON.parse(rawTokenData);
    if (!tokenData || tokenData.token !== resetToken) {
      showToast("Invalid password reset token.", "error");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (Date.now() > tokenData.expiresAt) {
      showToast("This password reset link has expired (valid for 60 mins). Please request a new link.", "error");
      localStorage.removeItem(RESET_TOKEN_KEY);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Open Set New Password Modal
    const modal = document.getElementById("resetViaLinkModal");
    const emailElem = document.getElementById("resetTargetEmail");
    if (emailElem) emailElem.textContent = tokenData.email;

    document.getElementById("linkNewPass").value = "";
    document.getElementById("linkConfirmPass").value = "";

    if (modal) {
      modal.classList.add("open");
    }
  } catch (err) {
    console.error("Token verification error:", err);
  }
}

// 10. Handle Set New Password Submission via Reset Link
function setupResetViaLinkModal() {
  const modal = document.getElementById("resetViaLinkModal");
  const closeX = document.getElementById("btnCloseResetViaLinkX");
  const cancelBtn = document.getElementById("btnCancelResetViaLink");
  const submitBtn = document.getElementById("btnSubmitResetViaLink");

  if (!modal) return;

  function closeModal() {
    modal.classList.remove("open");
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (closeX) closeX.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const newPass = document.getElementById("linkNewPass").value.trim();
      const confirmPass = document.getElementById("linkConfirmPass").value.trim();

      if (!newPass || newPass.length < 4) {
        showToast("New password must be at least 4 characters long.", "error");
        return;
      }

      if (newPass !== confirmPass) {
        showToast("New password and confirm password do not match!", "error");
        return;
      }

      const creds = getAdminCredentials();
      const updatedCreds = {
        name: creds.name || "Admin",
        email: creds.email,
        password: newPass
      };
      saveAdminCredentials(updatedCreds);

      // Invalidate used reset token
      localStorage.removeItem(RESET_TOKEN_KEY);

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      modal.classList.remove("open");
      showToast("Password reset successfully! Welcome to Admin Portal.", "success");

      // Auto sign in as Admin
      const user = { name: updatedCreds.name || "Admin", email: updatedCreds.email, role: "super_admin" };
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
      showAdminDashboard(user);
    });
  }
}
