# 🏛️ AwamiConnect — Citizen Complaint Management & Accountability Platform

**AwamiConnect** aik modern, responsive civic tech web application hai jahan aam shehri (citizens) apne mohallay ya sheher ke masail (kharab sadqain, kachra, bijli, pani ki kami, gutter/drainage) photo aur live map location ke sath report kar sakte hain, unique tracking ID ke sath progress monitor kar sakte hain, aur masla hal hone par confirmation de sakte hain.

---

## 🚀 Features (Tamam Requirements Completed)

1. **📸 Photo Upload with Automatic Canvas Compression**:
   - Citizen camera se live photo le sakta hai ya gallery se upload kar sakta hai.
   - Large images (e.g. 8MB) ko browser ke andar hi lightweight format (~300KB) mein compress kiya jata hai taake fast upload ho.
2. **📍 Interactive Map Location Picker (Leaflet.js + OpenStreetMap)**:
   - 100% Free, kisi Google Maps billing ya credit card API key ki zaroorat nahi.
   - Draggable pin aur **"Use My Current Location"** (GPS) button.
   - Pin move karne par **Reverse Geocoding** se address automatically likh jata hai.
3. **🏷️ 6 Civic Categories**:
   - 🛣️ Roads & Footpaths (Potholes, broken roads)
   - 🗑️ Solid Waste & Sanitation (Overflowing garbage)
   - 💧 Water Supply (Pipeline leakages, no water)
   - ⚡ Electricity & Streetlights (Dark streets, damaged poles)
   - 🚰 Drainage & Sewerage (Sewage overflow)
   - 🏗️ Other Civic Issues
4. **🎫 Unique Tracking ID Generation**:
   - Har complaint ke liye automatic standard tracking ID banti hai (maslan: `AC-2026-4821`).
5. **📊 Real-time 4-Stage Lifecycle Timeline**:
   - `Submitted` ➔ `Under Review` ➔ `Assigned to Department` ➔ `Resolved`.
6. **👍 Citizen Community Verification**:
   - Jab issue `Resolved` hota hai, to aam shehri button press karke confirm kar sakte hain: *"Yes, Problem Resolved"*.
7. **🏛️ Department & Moderator Portal (`admin.html`)**:
   - Authorized access / 1-Click Demo login.
   - Status update dropdown (`Submitted`, `Under Review`, `Assigned`, `Resolved`, `Rejected`).
   - Relevant municipal department assign karna.
   - Official remarks aur resolution proof photo link save karna.
8. **📈 Public Accountability Dashboard (`index.html`)**:
   - Real-time KPI counters (Total Reported, Resolved, In Action, Avg Resolution Time).
   - Live Leaflet city map with color-coded markers (🔴 Red, 🔵 Blue, 🟡 Amber, 🟢 Green).
   - Chart.js category breakdown & resolution percentage.
   - Top high-priority hotspots needing municipal attention.
9. **📧 Automated Email Notifications**:
   - Har complaint submit hone par automatic formatted table notification `gkabeersoomro@gmail.com` par deliver hoti hai.
10. **🔐 Comprehensive Admin Security & Self-Service Management**:
    - Default Credentials: `admin@gmail.com` / `admin123`.
    - Password Show/Hide toggle (👁️ / 🙈) on all password fields.
    - 2-Step Forgot Password recovery flow with 6-digit verification code.
    - Admin Settings Modal: Admin apna display name, login email aur password khud customize aur reset kar sakta hai.

---

## 🕒 Release & Build Information
- **Platform**: AwamiConnect Civic Accountability Engine
- **Build Timestamp**: 2026-10-24 04:30 PKT (UTC+5)
- **Status**: Production Ready • Zero Pixel Overflow • Real-Time Firestore Sync
- **Repository Remote**: `https://github.com/KabirSoomro/AwamiConnect.git`

---

## 📁 File Structure

```text
AwamiConnect/
│
├── index.html               # Public Home & Transparency Dashboard (Map, Stats, Charts)
├── report.html              # Citizen Complaint Submission Form (Camera, Map Picker)
├── track.html               # Citizen Tracking Page (4-Step Timeline & Community Verification)
├── admin.html               # Department & Moderator Portal (Table, Filter, Status Update Modal)
│
├── css/
│   └── style.css            # Responsive, Clean Civic Theme (Mobile & Desktop friendly)
│
├── js/
│   ├── firebase-config.js   # Dual-Engine: Live Firebase OR Smart LocalStorage for Instant Testing
│   ├── app.js               # Common Utilities (Tracking ID generator, Image compression, Toasts)
│   ├── dashboard.js         # Leaflet City Map, Chart.js graphs, Hotspot detection
│   ├── report.js            # GPS Geolocation, Reverse Geocoding, Form validation
│   ├── track.js             # Timeline renderer, Resolution confirmation
│   └── admin.js             # Moderator login, Complaint management, Department allocation
│
└── README.md                # Documentation & Setup Guide
```

---

## 🏃 Project Ko Kaise Run Karein? (Instant Testing)

Yeh project **100% ready-to-run** hai. Is mein kisi Node.js ya server installation ki zaroorat nahi hai:

### Option 1 (Direct Browser Open):
1. Folder mein jayein: `d:\Short_Course\AwamiConnect`.
2. Kisi bhi file (maslan `index.html`) par **Double-Click** karein aur browser mein open karein.
3. Initial realistic demo complaints pehle se loaded hain taake aap foran check kar sakein:
   - `index.html` par maps aur charts dekhein.
   - `report.html` se nayi complaint submit karein.
   - `track.html?id=AC-2026-001` par status aur confirmation check karein.
   - `admin.html` par **"1-Click Moderator Demo Access"** se login karke status update karein.

### Option 2 (VS Code Live Server - Recommended):
1. VS Code mein folder open karein.
2. `index.html` par right click karke **"Open with Live Server"** karein.

---

## 🔥 Firebase Connect Karne Ka Tareeqa (Jab aap chaho):

Project by default smart LocalStorage mode mein chalta hai, isliye abhi bhi 100% functional hai. Agar aap apna real Firebase connect karna chahte hain:

1. [Firebase Console](https://console.firebase.google.com/) par jayein aur naya project create karein (e.g. `awamiconnect`).
2. **Firestore Database** enable karein (Test Mode mein create karein taake read/write permissions on hon).
3. **Storage** enable karein (agar images Firebase pe save karni hon).
4. Project Settings ➔ **General** ➔ **Your apps** ➔ **Web app (</>)** add karein.
5. Jo Firebase Config object mile, usay `js/firebase-config.js` mein paste kar dein:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_FIREBASE_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

Jaise hi aap valid API key dalenge, system automatically Firestore ke sath real-time sync shuru kar dega!
