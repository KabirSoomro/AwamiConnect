/**
 * AwamiConnect — Citizen Complaint Submission Logic
 */

let pickerMap = null;
let pickerMarker = null;
let selectedLat = 24.8607;
let selectedLng = 67.0011;
let compressedImageDataUrl = null;

document.addEventListener("DOMContentLoaded", () => {
  initPickerMap();
  setupImageUpload();
  setupGpsButton();
  setupFormSubmission();
});

// 1. Initialize Interactive Leaflet Map for Location Picking
function initPickerMap() {
  if (typeof L === "undefined") return;

  const mapElement = document.getElementById("pickerMap");
  if (!mapElement) return;

  if (pickerMap) {
    pickerMap.remove();
    pickerMap = null;
  }

  pickerMap = L.map("pickerMap", {
    scrollWheelZoom: false, // Prevent form scrolling hijack
    dragging: true,
    touchZoom: true
  }).setView([selectedLat, selectedLng], 13);

  // Free OpenStreetMap Tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(pickerMap);

  // Custom Draggable Pin
  pickerMarker = L.marker([selectedLat, selectedLng], { draggable: true }).addTo(pickerMap);

  pickerMarker.on("dragend", function (e) {
    const position = pickerMarker.getLatLng();
    updateCoordinates(position.lat, position.lng);
    reverseGeocode(position.lat, position.lng);
  });

  // Click on map to move pin
  pickerMap.on("click", function (e) {
    pickerMarker.setLatLng(e.latlng);
    updateCoordinates(e.latlng.lat, e.latlng.lng);
    reverseGeocode(e.latlng.lat, e.latlng.lng);
  });

  // Invalidate size once DOM layout and CSS styles settle
  requestAnimationFrame(() => {
    if (pickerMap) pickerMap.invalidateSize();
  });
  setTimeout(() => {
    if (pickerMap) pickerMap.invalidateSize();
  }, 250);
}

// Global resize listener for location picker map
window.addEventListener("resize", () => {
  if (pickerMap) {
    pickerMap.invalidateSize();
  }
});

function updateCoordinates(lat, lng) {
  selectedLat = Number(lat.toFixed(6));
  selectedLng = Number(lng.toFixed(6));
  document.getElementById("lblLat").textContent = selectedLat;
  document.getElementById("lblLng").textContent = selectedLng;
}

// 2. Reverse Geocoding with OpenStreetMap Nominatim
async function reverseGeocode(lat, lng) {
  const addressInput = document.getElementById("locationAddress");
  addressInput.placeholder = "Locating address...";

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { "Accept-Language": "en" }
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        addressInput.value = data.display_name;
      }
    }
  } catch (err) {
    console.warn("Reverse geocode could not fetch address:", err);
  } finally {
    addressInput.placeholder = "Street / Area / Landmark";
  }
}

// 3. Current GPS Geolocation
function setupGpsButton() {
  const gpsBtn = document.getElementById("btnUseGps");
  if (!gpsBtn) return;

  gpsBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    gpsBtn.disabled = true;
    gpsBtn.textContent = "Detecting GPS...";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateCoordinates(lat, lng);

        if (pickerMap && pickerMarker) {
          pickerMap.invalidateSize();
          pickerMap.setView([lat, lng], 16);
          pickerMarker.setLatLng([lat, lng]);
        }

        reverseGeocode(lat, lng);
        showToast("Location updated from your device GPS!", "success");
        gpsBtn.disabled = false;
        gpsBtn.innerHTML = `<span>📍</span> Use My Current Location`;
      },
      (error) => {
        console.error("GPS error:", error);
        showToast("Could not access location. Please click on the map manually.", "error");
        gpsBtn.disabled = false;
        gpsBtn.innerHTML = `<span>📍</span> Use My Current Location`;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// 4. Image Upload, Drag & Drop & Client-side Canvas Compression
function setupImageUpload() {
  const uploadZone = document.getElementById("uploadZone");
  const imageInput = document.getElementById("imageInput");
  const previewContainer = document.getElementById("previewContainer");
  const imagePreview = document.getElementById("imagePreview");
  const removeBtn = document.getElementById("removeImageBtn");
  const sampleBtns = document.querySelectorAll(".sample-photo-btn");

  if (!uploadZone || !imageInput) return;

  uploadZone.addEventListener("click", () => imageInput.click());

  // Drag and drop events
  ["dragenter", "dragover"].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add("drag-active");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove("drag-active");
    });
  });

  uploadZone.addEventListener("drop", async (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (file) handleImageFile(file);
  });

  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) handleImageFile(file);
  });

  async function handleImageFile(file) {
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file (JPG or PNG).", "error");
      return;
    }

    try {
      showToast("Compressing image for fast upload...", "info");
      compressedImageDataUrl = await compressImage(file, 1200, 0.75);

      imagePreview.src = compressedImageDataUrl;
      previewContainer.style.display = "block";
      uploadZone.style.display = "none";
      uploadZone.classList.remove("error-highlight");
      showToast("Photograph ready for submission!", "success");
    } catch (err) {
      console.error("Compression error:", err);
      showToast("Failed to process image.", "error");
    }
  }

  // Quick Demo Photos Selector
  sampleBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = btn.getAttribute("data-url");
      const cat = btn.getAttribute("data-category");

      if (url) {
        compressedImageDataUrl = url;
        imagePreview.src = url;
        previewContainer.style.display = "block";
        uploadZone.style.display = "none";
        uploadZone.classList.remove("error-highlight");
        showToast("Demo photo loaded!", "success");

        // Auto select corresponding category radio
        if (cat) {
          const radio = document.querySelector(`input[name="category"][value="${cat}"]`);
          if (radio) radio.checked = true;
        }
      }
    });
  });

  removeBtn.addEventListener("click", () => {
    compressedImageDataUrl = null;
    imageInput.value = "";
    previewContainer.style.display = "none";
    uploadZone.style.display = "block";
  });
}

// 5. Form Submission
function setupFormSubmission() {
  const form = document.getElementById("complaintForm");
  const submitBtn = document.getElementById("btnSubmit");
  const uploadZone = document.getElementById("uploadZone");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!compressedImageDataUrl) {
      showToast("Please upload or take a photograph of the problem.", "error");
      if (uploadZone) {
        uploadZone.classList.add("error-highlight");
        uploadZone.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const selectedCategory = document.querySelector('input[name="category"]:checked')?.value || "other";
    const categoryInfo = CATEGORIES[selectedCategory] || CATEGORIES.other;

    const title = document.getElementById("complaintTitle").value.trim();
    const desc = document.getElementById("complaintDesc").value.trim();
    const address = document.getElementById("locationAddress").value.trim();
    const citizenName = document.getElementById("citizenName").value.trim();
    const citizenPhone = document.getElementById("citizenPhone").value.trim();

    if (!title || !desc || !address || !citizenName || !citizenPhone) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⏳</span> Registering complaint...`;

    try {
      const trackingId = generateTrackingId();

      const newComplaint = {
        id: trackingId,
        title: title,
        category: selectedCategory,
        categoryLabel: categoryInfo.label,
        categoryIcon: categoryInfo.icon,
        description: desc,
        locationName: address,
        lat: selectedLat,
        lng: selectedLng,
        citizenName: citizenName,
        citizenPhone: citizenPhone,
        status: "submitted",
        department: categoryInfo.department,
        officerRemarks: "",
        imageUrl: compressedImageDataUrl,
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        assignedAt: null,
        resolvedAt: null,
        communityConfirmations: 1,
        userConfirmed: false
      };

      await window.dbService.createComplaint(newComplaint);

      // Open Success Modal
      showSuccessModal(newComplaint);

      // Reset form
      form.reset();
      document.getElementById("removeImageBtn").click();

    } catch (err) {
      console.error("Submission failed:", err);
      showToast("Error registering complaint. Please try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>🚀</span> Submit Complaint & Generate Tracking ID`;
    }
  });
}

// 6. Success Modal Handler
function showSuccessModal(complaint) {
  const modal = document.getElementById("successModal");
  const trackingIdSpan = document.getElementById("modalTrackingId");
  const trackBtn = document.getElementById("modalTrackBtn");
  const shareWhatsapp = document.getElementById("modalShareWhatsapp");
  const copyBtn = document.getElementById("btnCopyId");
  const closeBtn = document.getElementById("modalCloseBtn");

  trackingIdSpan.textContent = complaint.id;
  trackBtn.href = `track.html?id=${complaint.id}`;

  // WhatsApp share link
  const shareText = encodeURIComponent(
    `🏛️ AwamiConnect Civic Report\nI reported "${complaint.title}" at ${complaint.locationName}.\nTracking ID: ${complaint.id}\nTrack progress here: ${window.location.origin}/track.html?id=${complaint.id}`
  );
  shareWhatsapp.href = `https://wa.me/?text=${shareText}`;

  copyBtn.onclick = () => copyToClipboard(complaint.id);
  closeBtn.onclick = () => modal.classList.remove("open");

  modal.classList.add("open");
}
