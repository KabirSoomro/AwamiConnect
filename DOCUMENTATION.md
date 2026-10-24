# 🏛️ AwamiConnect — Complete Project, Vision & Technical Documentation

---

## 📑 Table of Contents
1. **Background & Problem Statement (Yeh Website Kyun Banayi Gayi Hai?)**
2. **Core Vision & Purpose (Website Ka Asal Maqsad Kya Hai?)**
3. **Platform Scope & Capabilities (Yeh Website Kya Karegi?)**
4. **End-to-End Operational Workflow (Yeh Sab Kaise Karegi?)**
5. **System Architecture & Tech Stack**
6. **Dual-Engine Data Layer (`js/firebase-config.js`)**
7. **Common Application Utilities (`js/app.js`)**
8. **Citizen Report Submission Flow (`report.html` & `js/report.js`)**
9. **Citizen Tracking & Resolution Flow (`track.html` & `js/track.js`)**
10. **Public Accountability Dashboard (`index.html` & `js/dashboard.js`)**
11. **Department & Moderator Management Portal (`admin.html` & `js/admin.js`)**
12. **Authentication, Credentials & Password Reset Security**
13. **Automated Email Dispatch System (FormSubmit.co)**
14. **Responsive Design Guardrails & CSS Architecture**
15. **Project Testing & Verification Guide**

---

## 1. Background & Problem Statement (Yeh Website Kyun Banayi Gayi Hai?)

### Hamare Muashray (Society) Ka Asal Masla:
Hamare shehron mein aam shehrion ko roz-marrah zindagi mein bunyadi civic masail ka samna karna parta hai:
- Sadqon par gehray khadday (potholes) jin se roz hadsaat hote hain.
- Kachre ke dher jo hafton tak nahi uthaye jate aur beemariyan phailate hain.
- Peenay ke saaf paani ki pipeline phat jana ya kai dinon tak paani na aana.
- Tooti hui streetlights jin ki wajah se galiyan andheri rehti hain aur chori/dacoity ka khatra barhta hai.
- Clogged gutters aur sewerage lines jin ka ganda paani sadqon aur gharon ke samne jama ho jata hai.

### Traditional System Ki Nakamiyan (Existing Failures):
1. **Daftari Dhakkay Aur Kaghzi File-System**:
   Shehri ko complaint darj karwane ke liye municipal office ke chakkar kaatne parte hain, arziyan likhni parti hain, aur aksar woh kaghaz files ke dher mein gum ho jate hain.
2. **Sifarish Aur Rishwat**:
   Jab tak kisi bare afsar ki sifarish ya rishwat na ho, chhotay mohallon ke masail par koi tawajjoh nahi di jati.
3. **Zero Transparency (Koi Maloomat Nahi)**:
   Shikayat darj karwane ke baad citizen ko kabhi pata nahi chalta ke unka masla kis afsar ke desk par hai, kab team aayegi, ya complaint ko reject kar diya gaya hai.
4. **Idaron Ka Aik Dusre Par Ilzaam Dalna**:
   Agar sadak par paani khara ho to Road Department kehta hai yeh Water Board ka masla hai, aur Water Board kehta hai yeh Town Committee ka masla hai. Aam shehri darmiyan mein pis jata hai.
5. **Jhoote Claims (Fake Closures)**:
   Kaghazon par afsar likh dete hain ke *"Kaam mukammal ho gaya"*, jabke ground par khadda waisa hi rehta hai.

### AwamiConnect Ka Inqilabi Solution:
**AwamiConnect** in tamam purane masail ko technology ke zariye jad se khatam karta hai. Yeh aik aisa public digital platform hai jahan har complaint camera photo, exact GPS location, aur unique tracking ID ke sath publicly record hoti hai. Har shehri aur har department dekh sakta hai ke masla kahan hai, kitne din se hai, kis department ke zimmay hai, aur kaam hone ke baad aam shehri khud use verify karte hain.

---

## 2. Core Vision & Purpose (Website Ka Asal Maqsad Kya Hai?)

AwamiConnect ka wahid maqsad yeh hai: **"Citizen Empowerment & Municipal Accountability Through 100% Transparency."**

### Bunyadi Maqasid:
1. **Awaam Ko Awaaz Dena (Empower the Citizen)**:
   Har aam shehri ko aik aisa digital tool dena jise use karne ke liye kisi sifarish, registration, ya technical taleem ki zaroorat na ho. Sirf 30 seconds mein photo khicho, location lagao, aur complaint registered!
2. **Idaron Ko Jawabdeh Banana (Enforce Accountability)**:
   Shikayaat ko public dashboard par live maps aur metrics ke sath display karna taake municipal departments (KMC, KWSB, KE, LWMC, CDA, waghaira) par public pressure bane aur woh waqt par kaam karein.
3. **Asli Saboot (Ground Evidence)**:
   Har shikayat photographic evidence aur GPS coordinates ke sath bind hoti hai, is liye koi afsar yeh nahi keh sakta ke masla mojood nahi hai.
4. **Public Trust & Citizen Verification**:
   Masla hal hone ka faisla sirf afsar ke dastakhat se nahi hota, balki mohallay ke aam shehri khud button daba kar *"Confirm Resolved"* vote dete hain.
5. **Instant Admin Awareness**:
   Shehar ke administrative officer ko har waqt email alerts ke zariye pata chalta rehta hai ke kis ilaqay mein kya hangami masla darpaish hai.

---

## 3. Platform Scope & Capabilities (Yeh Website Kya Karegi?)

Platform ko teen ahem stakeholders ke liye divide kiya gaya hai:

### A. Aam Shehri (Citizens) Ke Liye:
* **Zero Friction**: Kisi account ya sign-up ki zaroorat nahi.
* **Photo Proof with Auto-Compression**: Mobile camera se tooti sadak ya kachre ki live photo li ja sakti hai, jo browser memory mein hi compress ho jati hai taake fast upload ho.
* **GPS & Leaflet Map Pin**: Draggable pin se exact street/location select ho jati hai aur OpenStreetMap se gali/ilaqay ka pata automatically likh jata hai.
* **Unique Tracking ID**: Har report par aik official number milta hai (e.g. `AC-2026-7841`).
* **WhatsApp Community Sharing**: 1-click se ticket WhatsApp par mohallay ke group mein share kiya ja sakta hai.
* **Live Progress Tracking**: Shehri 4-stage timeline (`Submitted` ➔ `Under Review` ➔ `Assigned` ➔ `Resolved`) par live progress dekh sakte hain.
* **Community Closure Confirmation**: Resolution ke baad shehri vote de kar confirm kar sakte hain.

### B. Municipal Departments & Officers Ke Liye:
* **Department Management Console (`admin.html`)**: Central portal jahan shehar ki tamam complaints aik jagah nazar aati hain.
* **Task Allocation**: Shikayat ko uske mutalliqah idaare ko assign karna (maslan Highway Department, Waste Management Corp, Water & Sewerage Authority, Electric Works).
* **Status Updates**: Status change karna (`Submitted`, `Under Review`, `Assigned`, `Resolved`, `Rejected`).
* **Official Action Remarks**: Official tafseelat aur ground repair ki proof photo ka link record mein add karna.
* **Export Reports**: Tamam shikayaat ki complete CSV/Excel sheet download karna taake government records aur audits mein pesh ki ja sake.
* **Self-Service Credentials**: Admin apna display name, email aur password khud manage aur update kar sakta hai.

### C. Sheher, Media & Civil Society Ke Liye:
* **Public City Map (`index.html`)**: Sheher ke live map par color-coded markers (🔴 Red, 🔵 Blue, 🟡 Amber, 🟢 Green) se tamam masail ki distribution dekhna.
* **Data Analytics**: Chart.js ke zariye category breakdown aur resolution percentage dekhna.
* **Top Civic Hotspots**: Jin ilaqon mein sab se zyada masail hon, unhe identify karna taake municipal funds sahi jagah lagaye ja sakein.

---

## 4. End-to-End Operational Workflow (Yeh Sab Kaise Karegi?)

Yeh platform chaar (4) interconnected phases ke zariye apna maqsad poora karta hai:

```
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: CITIZEN REPORTING                                             │
│ Citizen opens report.html ➔ Snaps Photo (Compressed via Canvas)        │
│ ➔ Drags Map Pin / Clicks GPS ➔ Reverse Geocode fills Address           │
│ ➔ Hits "Submit Complaint"                                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: AUTOMATION & DATA LOGGING                                     │
│ System generates Tracking ID (AC-2026-XXXX)                            │
│ ➔ Saves to Cloud Firestore (Real-Time Database Sync)                   │
│ ➔ Background Email Alert dispatched to gkabeersoomro@gmail.com         │
│ ➔ Citizen receives Tracking ID + WhatsApp Share Link                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: PUBLIC DASHBOARD & CITIZEN TRACKING                           │
│ Complaint instantly appears on Live Map & Charts (index.html)          │
│ ➔ Hotspot counter updates automatically                                │
│ ➔ Citizen tracks progress on track.html?id=AC-2026-XXXX               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: MUNICIPAL ACTION & RESOLUTION                                 │
│ Officer logs into admin.html ➔ Reviews Evidence Photo & Location       │
│ ➔ Allocates Department & updates status to "Assigned"                  │
│ ➔ Field repair done ➔ Officer uploads Proof Photo & marks "Resolved"   │
│ ➔ Citizen visits track.html and clicks "Confirm Issue Resolved"        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. System Architecture & Tech Stack

```
                   ┌────────────────────────────────────────┐
                   │           Citizen Client UI            │
                   │ (index.html, report.html, track.html)  │
                   └───────────────────┬────────────────────┘
                                       │
                         ┌─────────────┴────────────┐
                         ▼                          ▼
               ┌──────────────────┐       ┌──────────────────┐
               │ FormSubmit.co    │       │ Leaflet.js &     │
               │ Email Dispatcher │       │ OpenStreetMap    │
               │ (Direct Alerts)  │       │ (Zero-cost maps) │
               └──────────────────┘       └──────────────────┘
                                       │
                                       ▼
                         ┌──────────────────────────┐
                         │ Dual Database Layer      │
                         │ (js/firebase-config.js)  │
                         └──────┬────────────┬──────┘
                                │            │
                 ┌──────────────┘            └──────────────┐
                 ▼                                          ▼
     ┌───────────────────────┐                  ┌───────────────────────┐
     │ Cloud Firestore       │                  │ Smart LocalStorage    │
     │ (Live Cloud Real-Time)│                  │ (Instant Demo Engine) │
     └───────────────────────┘                  └───────────────────────┘
                                 ▲
                                 │
                   ┌─────────────┴────────────┐
                   │ Department Admin Portal  │
                   │      (admin.html)        │
                   └──────────────────────────┘
```

### Front-End Technologies:
- **HTML5 & Vanilla JavaScript (ES6+)**: Zero heavy framework dependencies (no React/Angular overhead), fast loading (<50ms).
- **CSS3 with Custom Properties**: Modular civic green design tokens, fluid clamp sizing, zero horizontal overflow guarantee.
- **Leaflet.js 1.9.4 + OpenStreetMap**: 100% free interactive geospatial mapping (no Google Maps API billing or credit card required).
- **Chart.js 4.4.1**: Interactive visual breakdown of complaint categories and resolution ratios.
- **Firebase JS SDK 10.8.0 Compat**: Real-time cloud database synchronization.
- **FormSubmit.co REST API**: Zero-server direct client-side email dispatch.

---

## 6. Dual-Engine Data Layer (`js/firebase-config.js`)

Yeh file platform ki backbone hai. Iska kaam online hone par Firebase Firestore use karna aur offline/demo mode mein LocalStorage par seamlessly switch karna hai.

### Global Variables & Configurations:
- `firebaseConfig`: Google Firebase project credentials (apiKey, authDomain, projectId, storageBucket, appId).
- `INITIAL_DEMO_COMPLAINTS`: 5 realistic pre-seeded complaints (roads, sanitation, water, electricity, drainage) taake pehli dafa chalane par dashboard khali na lage.

### `DatabaseService` Class Methods:

#### 1. `constructor()`
- **Kaam**: Check karta hai ke kya Firebase SDK loaded hai aur valid credentials maujood hain.
- **Logic**: Agar Firebase connect ho jaye to `this.isFirebase = true` ho jata hai, warna fallback mode `this.isFirebase = false` set hota hai.

#### 2. `initStorage()`
- **Kaam**: Browser ke LocalStorage ko initialize karta hai.
- **Self-Healing Logic**: Agar browser storage khali ho ya purana dummy cache ho, to yeh seed records se storage ko safely update karta hai.

#### 3. `async getAllComplaints()`
- **Kaam**: Tamam complaints fetch karke array return karta hai.
- **Logic**: 
  - Firebase mode mein: `firestore.collection("complaints").orderBy("submittedAt", "desc").get()`.
  - LocalStorage mode mein: `localStorage.getItem("awami_complaints_data")` ko parse karta hai with auto-repair try-catch.

#### 4. `async getComplaintById(complaintId)`
- **Kaam**: Unique Tracking ID (maslan `AC-2026-001`) ke zariye specific complaint find karta hai.
- **Logic**: Firestore doc lookup ya local array find operation perform karta hai.

#### 5. `async createComplaint(complaintData)`
- **Kaam**: Nayi complaint ko database mein store karta hai.
- **Logic**:
  - Firebase mode mein doc ID complaint ke tracking ID se set karta hai: `firestore.collection("complaints").doc(complaintData.id).set(complaintData)`.
  - LocalStorage mode mein local array ke shuru mein unshift karke persist karta hai.

#### 6. `async updateComplaintStatus(complaintId, updates)`
- **Kaam**: Moderator portal se status, department, official remarks ya fix proof photo update karta hai.
- **Logic**: Timestamp auto-record karta hai (`resolvedAt`, `assignedAt`, `reviewedAt`).

#### 7. `onComplaintsChange(callback)`
- **Kaam**: Real-time snapshot listener.
- **Logic**: Firestore ka `collection("complaints").onSnapshot(...)` attach karta hai. Jaise hi kisi bhi device se complaint update ya add hoti hai, tamam open tabs aur dashboards baghair page reload kiye update ho jate hain!

#### 8. `async resetDemoData()`
- **Kaam**: Database ko wapas fresh initial demo dataset par reset karta hai.

#### 9. `async clearAllComplaints()`
- **Kaam**: Tamam complaints ko wipe out karke clean zero-state banata hai.

---

## 7. Common Application Utilities (`js/app.js`)

Har page par use hone wale generic tools is file mein hain:

### Key Functions:

#### 1. `CATEGORIES`
- 6 civic categories ki dictionary (roads, sanitation, water, electricity, drainage, other) jisme icon, public label aur assigned municipal department ki mapping hoti hai.

#### 2. `generateTrackingId()`
- Unique alphanumeric code banata hai: `AC-[CurrentYear]-[Random4Digits]` (e.g. `AC-2026-8912`).

#### 3. `formatDate(dateString)`
- ISO date string ko insaan ke parhne qabil format mein tabdeel karta hai (e.g. `Oct 24, 2026, 04:30 AM`).

#### 4. `getRelativeTime(dateString)`
- Relative time calculate karta hai (e.g. `Just now`, `5m ago`, `2h ago`, `3 days ago`).

#### 5. `getStatusBadge(status)`
- Status string ke mutabiq color-coded HTML badge tag return karta hai:
  - `submitted`: 🔴 Red badge
  - `under_review`: 🔵 Blue badge
  - `assigned`: 🟡 Amber badge
  - `resolved`: 🟢 Green badge
  - `rejected`: ⚪ Gray badge

#### 6. `compressImage(file, maxWidth = 1200, quality = 0.75)`
- **Client-Side HTML5 Canvas Compression**:
- Jab citizen mobile se 5MB ya 10MB ki heavy photo leta hai, yeh function use browser memory mein resize aur JPEG quality compress kar ke ~250KB Base64 dataURL bana deta hai. Isse page foran upload hota hai aur server par bojh nahi parta.

#### 7. `showToast(message, type = "info")`
- Screen par animated pop-up notification show karta hai (Success, Error, Info) jo 4 seconds baad smoothly disappear ho jati hai.

#### 8. `copyToClipboard(text)`
- Tracking ID ko 1-click clipboard mein copy karta hai with modern `navigator.clipboard` aur legacy fallback.

#### 9. Mobile Drawer Navigation Listener
- Mobile screens par hamburger menu toggle (`☰` aur `✕`) aur ARIA accessibility manage karta hai.

---

## 8. Citizen Report Submission Flow (`report.html` & `js/report.js`)

Citizen jab masla report karne aata hai to yeh pipeline execute hoti hai:

### Step-by-Step Functions:

#### 1. `initPickerMap()`
- Leaflet map initialize karta hai default coordinates (Karachi center `24.8607, 67.0011`) ke sath.
- Map par Draggable Pin marker add karta hai. Pin drag hone par ya map par click hone par coordinates foran capture hote hain.

#### 2. `updateCoordinates(lat, lng)`
- Screen par latitude aur longitude numbers ko update karta hai.

#### 3. `reverseGeocode(lat, lng)`
- OpenStreetMap ke **Nominatim API** ko query karta hai:
  `https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}`
- GPS coordinates se gali, mohallay ya city ka naam nikal kar automatically address box mein type kar deta hai.

#### 4. `setupGpsButton()`
- Browser ke `navigator.geolocation.getCurrentPosition()` ko call karta hai.
- Citizen ka device GPS coordinate lekar pin foran unki exact physical location par move kar deta hai.

#### 5. `setupImageUpload()`
- Drag & Drop zone aur File Input ko listen karta hai.
- File select hone par `compressImage()` chala kar live preview dikhata hai.
- Sample demo buttons (Pothole, Garbage) provide karta hai taake baghair camera ke bhi testing ho sake.

#### 6. `setupFormSubmission()`
- Form validation check karta hai (Photo, Title, Description, Location).
- Light Placeholders (`Kabeer Soomro`, `03168465697`, `gkabeersoomro@gmail.com`) se fallback values ensure karta hai agar user ne fields empty chhori hon.
- Unique tracking ID generate karta hai.
- `dbService.createComplaint(newComplaint)` se database mein save karta hai.
- `sendEmailNotification(newComplaint)` trigger karta hai.
- `showSuccessModal(newComplaint)` popup open karta hai.

#### 7. `sendEmailNotification(complaint)`
- FormSubmit AJAX endpoint (`https://formsubmit.co/ajax/gkabeersoomro@gmail.com`) ko JSON table POST karta hai jisme:
  - Tracking ID, Title, Category, Department, Citizen Name, Citizen Phone, Address, GPS Coordinates, Google Maps Pin Link, Description, aur Live Tracking URL shamil hote hain.
- Yeh process background (non-blocking) mein chalta hai taake citizen ki screen freeze na ho.

#### 8. `showSuccessModal(complaint)`
- Success card dikhata hai jahan:
  - Tracking ID display hoti hai with Copy button.
  - WhatsApp Share link hota hai (`https://wa.me/?text=...`).
  - Direct *"Track This Complaint Now"* ka button hota hai.

---

## 9. Citizen Tracking & Resolution Flow (`track.html` & `js/track.js`)

Citizen apni shikayat ka status track karne ke liye is page ko use karta hai.

### Key Functions:

#### 1. `initTrackSearch()`
- URL query string check karta hai (`?id=AC-2026-001`). Agar ID mojood ho to foran load karta hai, warna search input show karta hai.

#### 2. `loadComplaint(id)`
- `dbService.getComplaintById(id)` call karta hai. Agar ticket na mile to clean "Not Found" state dikhata hai.

#### 3. `renderComplaint(c)`
- Complaint ki photo, title, department, date, aur reporter information render karta hai.
- Status badge display karta hai.
- Agar municipal officer ne fix hone ke baad koi resolution proof photo link ya remarks dale hon, to unhe highlight card mein dikhata hai.

#### 4. `renderTimeline(c)`
- 4-Stage visual breadcrumb timeline generate karta hai:
  1. `Submitted` (Registration date ke sath)
  2. `Under Review` (Moderator review date ke sath)
  3. `Assigned` (Field department ke sath)
  4. `Resolved` (Fix verification date ke sath)
- Current status tak ke steps green tick (`✓`) ho jate hain aur aage wale pending rehte hain.

#### 5. `setupCommunityVerification(c)`
- Jab issue ka status `resolved` hota hai, to citizen ke liye verification box active hota hai:
  - *"Did the municipal department fix this issue?"*
  - Citizen ke click karne par `communityConfirmations` count barh jata hai aur state save ho jati hai.

#### 6. `initTrackMiniMap(lat, lng, title)`
- Leaflet ka mini read-only map render karta hai jo exact report kiye gaye spot par pin dikhata hai.

---

## 10. Public Accountability Dashboard (`index.html` & `js/dashboard.js`)

Public dashboard city-wide civic accountability ke liye real-time data visualizer hai.

### Key Functions:

#### 1. `renderMetrics(complaints)`
- 4 Key Performance Indicators (KPIs) compute karta hai:
  - **Total Reported**: Kul complaints ki tadaad.
  - **Issues Resolved**: Hal shuda masail.
  - **Under Action / Review**: Active pending shikayaat.
  - **Avg. Resolution Time**: Issue report hone aur resolve hone ke darmiyani ghanton ka average days mein calculation.

#### 2. `initCityMap(complaints)` & `renderMapMarkers(filterStatus)`
- City map par har complaint ko uske status ke color ke mutabiq circle marker banata hai:
  - 🔴 Red: Submitted
  - 🔵 Blue: Under Review
  - 🟡 Amber: Assigned
  - 🟢 Green: Resolved
- Marker click karne par photo preview, address, status aur direct tracking link wala popup khulta hai.
- Status filter dropdown ke mutabiq map markers live filter hote hain.

#### 3. `renderCharts(complaints)`
- Chart.js ke do interactive graphs render karta hai:
  - **Doughnut Chart**: Category breakdown (Roads vs Water vs Sanitation vs Electricity).
  - **Bar / Status Chart**: Resolution ratio (Resolved vs Pending).

#### 4. `renderHotspots(complaints)`
- Location address string ko parse karke areas mein complaints count karta hai.
- Jin ilaqon mein sab se zyada issues report hue hon, unhe "Top Civic Hotspots" table mein rank karta hai taake municipal department un ilaqon ko prioritize karein.

---

## 11. Department & Moderator Portal (`admin.html` & `js/admin.js`)

Municipal officers aur moderators is portal se complaints ko manage karte hain.

### Key Functions:

#### 1. `setupAuth()`
- `sessionStorage` ke zariye login session check karta hai.
- Login form submit hone par registered Admin credentials ke sath email aur password compare karta hai.

#### 2. `showAdminDashboard(user)`
- Login screen hide karke management console display karta hai.
- Header par logged-in admin ka display name aur email show karta hai.
- Real-time `onComplaintsChange` listener attach karta hai.

#### 3. `filterAndRenderTable()`
- Search bar (ID, Title, Citizen Name, Location) aur Dropdown filters (Category, Status) ke mutabiq table records ko real-time filter karta hai.

#### 4. `openEditModal(complaintId)`
- Complaint management modal open karta hai:
  - Status dropdown (`submitted`, `under_review`, `assigned`, `resolved`, `rejected`)
  - Department assigner
  - Officer action remarks textarea
  - Fix proof photo link input

#### 5. `saveComplaintUpdates()`
- `dbService.updateComplaintStatus()` ko call karke status update karta hai, jis se dashboard aur citizen tracking timeline foran update ho jati hai.

#### 6. `exportComplaintsToCSV(complaints)`
- Tamam complaints ka structured CSV file generate karke browser download trigger karta hai (`AwamiConnect_Complaints_Report_YYYY-MM-DD.csv`).

---

## 12. Authentication, Credentials & Password Reset Security

Platform par complete self-service credential management system mojood hai:

### 1. Default Credentials:
- **Admin Display Name**: `Admin`
- **Admin Email**: `admin@gmail.com`
- **Admin Password**: `admin123`

### 2. Password Visibility Toggle (`setupPasswordToggles`):
- Tamam password input fields ke right side par **Eye Icon (`👁️`)** button laga hai.
- Click karne par `type="password"` aur `type="text"` toggle hota hai aur icon `🙈` ban jata hai.

### 3. Admin Account Settings Modal (`setupSettingsModal`):
- Top bar par **`⚙️ Admin Settings`** button mojood hai.
- Admin apna **Display Name** (maslan `Kabeer Soomro`), **Login Email**, aur **Naya Password** khud change kar sakta hai.
- Purana password verify hona lazmi hai taake koi unauthorized user settings na badal sake.
- Kisi ghalti ki soorat mein **"↺ Reset to Default"** ka button credentials ko wapas `admin@gmail.com` / `admin123` par le aata hai.

### 4. Email-Based Forgot Password System (`setupForgotPasswordModal`):
1. **Request Reset Link**:
   - Admin Login screen par *"Forgot Password?"* click karke apna registered email enter karta hai.
2. **Email Dispatch**:
   - System aik unique cryptographic token banata hai: `rst_xxxxxxxxxxxx` (valid for 60 minutes).
   - FormSubmit ke zariye admin ke email par formatted password reset link deliver hota hai:
     `http://127.0.0.1:3000/admin.html?reset_token=rst_xxxx`
3. **URL Link Verification (`checkResetTokenInUrl` & `setupResetViaLinkModal`)**:
   - Jaise hi admin email mein us link par click karta hai, browser reset token verify karta hai.
   - Token valid hone par **"Set New Admin Password"** ka modal khulta hai.
   - Naya password enter karne par credentials update ho jate hain, token invalidate ho jata hai, aur admin portal mein automatically login ho jata hai!

---

## 13. Automated Email Dispatch System (FormSubmit.co)

- **Kyoon Chuna Gaya?**: Client-side application se bina kisi backend Node.js server ya SMTP credentials expose kiye emails deliver karne ka yeh sab se reliable aur zero-cost tareeqa hai.
- **Workflow**:
  - `POST https://formsubmit.co/ajax/TARGET_EMAIL`
  - Body mein JSON format mein details bheji jati hain.
  - `_template: "table"` email ko table format mein design karta hai.
  - `_captcha: "false"` background automation ko smooth banata hai.
- **Recipient**: Citizen jab bhi report submit karega, notification automatic `gkabeersoomro@gmail.com` par pohnchti hai.
- **1-Time Activation**: FormSubmit pehli martaba email verification link bhejta hai; aik baar "Activate Form" click karne ke baad tamam aane wali reports direct inbox mein aati hain.

---

## 14. Responsive Design Guardrails & CSS Architecture

Project mein **Zero Pixel Overflow** strict audit pass kiya gaya hai:

- **CSS Variables & Theming (`css/style.css`)**:
  - Primary Civic Green: `#0f766e`, `#0d9488`
  - Accent Gold: `#f59e0b`
  - Clean Slate Grays: `#0f172a`, `#334155`, `#64748b`, `#f8fafc`
- **Overflow Prevention**:
  - Har card, timeline aur table cell par `min-width: 0;`, `overflow-wrap: anywhere;`, aur `word-break: break-word;` enforce kiya gaya hai taake koi lamba lafz ya string mobile screen ko stretch na kare.
- **Responsive Viewports**:
  - `320px` (Small mobile / iPhone SE)
  - `375px` - `414px` (Standard smartphones)
  - `768px` (Tablets / iPads)
  - `1024px` - `1440px` (Laptops / Desktops)
  - `1920px` (Ultra-wide displays)
- **Leaflet Map Invalidation**:
  - Container resize hone par `map.invalidateSize()` hook lagaya gaya hai taake maps ke tiles gray box na banain.

---

## 15. Project Testing & Verification Guide

### Quick Start Instructions:

1. **Local Server Chalana**:
   Project folder mein terminal open karein:
   ```powershell
   node server.js
   ```
   Browser mein open karein: `http://127.0.0.1:3000`

2. **Citizen Report Test Karna**:
   - `http://127.0.0.1:3000/report.html` open karein.
   - Demo photo select karein, GPS ya map par pin mark karein.
   - "Submit Complaint" dabayein. Tracking ID generate hogi aur email dispatch trigger hoga.

3. **Complaint Track Karna**:
   - `http://127.0.0.1:3000/track.html` par jayein aur Tracking ID enter karein.
   - 4-Stage lifecycle timeline aur mini-map verify karein.

4. **Department Portal & Password Reset Test Karna**:
   - `http://127.0.0.1:3000/admin.html` open karein.
   - Login karein (`admin@gmail.com` / `admin123`).
   - "⚙️ Admin Settings" se Display Name, Email ya Password change karein.
   - "Sign Out" karke "Forgot Password?" se email reset link ka workflow check karein.

---

*AwamiConnect Civic Platform • Documented & Verified • October 2026*
