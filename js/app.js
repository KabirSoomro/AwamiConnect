/**
 * AwamiConnect — Common Application Utilities
 */

// Category metadata helper
const CATEGORIES = {
  roads: { label: "Roads & Footpaths", icon: "🛣️", department: "District Works & Highways" },
  sanitation: { label: "Solid Waste & Sanitation", icon: "🗑️", department: "Waste Management Corporation" },
  water: { label: "Water Supply", icon: "💧", department: "Water & Sanitation Authority" },
  electricity: { label: "Electricity & Streetlights", icon: "⚡", department: "Electric Utility / Municipal Works" },
  drainage: { label: "Drainage & Sewerage", icon: "🚰", department: "Sewerage & Drainage Board" },
  other: { label: "Other Civic Issues", icon: "🏗️", department: "General Municipal Administration" }
};

// Generate Unique Complaint Tracking Number (e.g., AC-2026-7841)
function generateTrackingId() {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `AC-${year}-${randomDigits}`;
}

// Format readable date
function formatDate(dateString) {
  if (!dateString) return "Pending";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Relative time (e.g. "2 hours ago")
function getRelativeTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

// Get HTML badge for status
function getStatusBadge(status) {
  switch (status) {
    case "submitted":
      return `<span class="badge badge-submitted">● Submitted</span>`;
    case "under_review":
      return `<span class="badge badge-under-review">● Under Review</span>`;
    case "assigned":
      return `<span class="badge badge-assigned">● Assigned</span>`;
    case "resolved":
      return `<span class="badge badge-resolved">✓ Resolved</span>`;
    case "rejected":
      return `<span class="badge badge-rejected">✕ Rejected</span>`;
    default:
      return `<span class="badge badge-submitted">${status}</span>`;
  }
}

// Compress client-side image using Canvas (avoids uploading 8MB files)
function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Get compressed Base64 string
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Toast notification popup
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "⚠️";

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Copy text to clipboard with resilient fallback
function copyToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Complaint ID copied to clipboard!", "success");
    }).catch(() => {
      fallbackCopyText(text);
    });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    if (successful) {
      showToast("Complaint ID copied to clipboard!", "success");
    } else {
      showToast("Could not copy automatically.", "error");
    }
  } catch (err) {
    showToast("Could not copy automatically.", "error");
  }
}

// Setup mobile navigation toggle if present
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if (menuBtn && navLinks) {
    // Initialize ARIA accessibility attribute
    menuBtn.setAttribute("aria-expanded", "false");

    const toggleMenu = (open) => {
      const isOpen = typeof open === "boolean" ? open : !navLinks.classList.contains("nav-open");
      navLinks.classList.toggle("nav-open", isOpen);
      navLinks.classList.toggle("open", isOpen); // backward-compatible alias
      menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      menuBtn.textContent = isOpen ? "✕" : "☰";
    };

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close mobile menu when clicking any navigation link
    navLinks.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          toggleMenu(false);
        }
      });
    });

    // Close mobile menu when clicking outside header
    document.addEventListener("click", (e) => {
      if (navLinks.classList.contains("nav-open")) {
        if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
          toggleMenu(false);
        }
      }
    });

    // Close on Escape key press for keyboard accessibility
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("nav-open")) {
        toggleMenu(false);
        menuBtn.focus();
      }
    });

    // Ensure clean restoration of desktop navigation when resizing past 768px
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768 && navLinks.classList.contains("nav-open")) {
        toggleMenu(false);
      }
    });
  }
});
