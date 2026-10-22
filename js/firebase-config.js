/**
 * AwamiConnect — Firebase Configuration & Universal Data Access Layer
 * 
 * Supports both:
 * 1. Live Firebase Firestore & Storage (when valid keys are entered)
 * 2. Smart LocalStorage Mock Engine (runs 100% functional out-of-the-box for instant testing)
 */

// ============================================================================
// 1. YOUR FIREBASE CONFIGURATION
// Replace the values below with your Firebase Project Settings:
// Console -> Project settings -> General -> Your apps -> Web app -> Config
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_API_KEY_HERE",
  authDomain: "awamiconnect-demo.firebaseapp.com",
  projectId: "awamiconnect-demo",
  storageBucket: "awamiconnect-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Check if Firebase is actually configured or running in Demo / Local mode
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && 
         !firebaseConfig.apiKey.includes("YOUR_API_KEY") &&
         window.firebase !== undefined;
};

// ============================================================================
// 2. Realistic Initial Seed Data (For testing immediately out-of-the-box)
// ============================================================================
const INITIAL_DEMO_COMPLAINTS = [
  {
    id: "AC-2026-001",
    title: "Broken Streetlight on Main Boulevard",
    category: "electricity",
    categoryLabel: "Electricity & Streetlights",
    categoryIcon: "⚡",
    description: "The streetlight outside House 42 has been non-functional for 2 weeks, making the street pitch dark and unsafe at night.",
    locationName: "Gulshan-e-Iqbal, Block 13-D, Near Disco Bakery, Karachi",
    lat: 24.9207,
    lng: 67.0982,
    citizenName: "Ahmed Khan",
    citizenPhone: "0300-1234567",
    status: "resolved", // submitted, under_review, assigned, resolved, rejected
    department: "City Electric & Municipal Works",
    officerRemarks: "Field maintenance team replaced the LED armature and circuit breaker.",
    imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80",
    resolutionProofUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
    submittedAt: "2026-10-15T14:30:00Z",
    reviewedAt: "2026-10-16T10:00:00Z",
    assignedAt: "2026-10-17T11:20:00Z",
    resolvedAt: "2026-10-19T16:45:00Z",
    communityConfirmations: 8,
    userConfirmed: true
  },
  {
    id: "AC-2026-002",
    title: "Deep Potholes and Damaged Asphalt",
    category: "roads",
    categoryLabel: "Roads & Footpaths",
    categoryIcon: "🛣️",
    description: "Huge crater formed after the recent rainfall. Two motorcyclists slipped yesterday. Urgent patch work needed.",
    locationName: "North Nazimabad, Block H, Near Shipowners College, Karachi",
    lat: 24.9456,
    lng: 67.0392,
    citizenName: "Sana Tariq",
    citizenPhone: "0321-9876543",
    status: "assigned",
    department: "District Highway & Works Dept",
    officerRemarks: "Asphalt repair team dispatched for survey and patch work.",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    submittedAt: "2026-10-18T09:15:00Z",
    reviewedAt: "2026-10-19T08:45:00Z",
    assignedAt: "2026-10-20T10:00:00Z",
    resolvedAt: null,
    communityConfirmations: 14,
    userConfirmed: false
  },
  {
    id: "AC-2026-003",
    title: "Overflowing Garbage Dumpster on Corner",
    category: "sanitation",
    categoryLabel: "Solid Waste & Sanitation",
    categoryIcon: "🗑️",
    description: "Garbage hasn't been collected for 5 days. Foul smell spreading across the residential blocks and stray animals gathering.",
    locationName: "Johar Town, Block G-3, Near Commercial Market, Lahore",
    lat: 31.4697,
    lng: 74.2728,
    citizenName: "Usman Ali",
    citizenPhone: "0333-5554321",
    status: "under_review",
    department: "Waste Management Corporation (LWMC)",
    officerRemarks: "Assigned to zonal inspector for urgent sanitation tractor allocation.",
    imageUrl: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80",
    submittedAt: "2026-10-20T11:20:00Z",
    reviewedAt: "2026-10-21T09:00:00Z",
    assignedAt: null,
    resolvedAt: null,
    communityConfirmations: 5,
    userConfirmed: false
  },
  {
    id: "AC-2026-004",
    title: "Main Water Pipeline Leakage & Low Pressure",
    category: "water",
    categoryLabel: "Water Supply",
    categoryIcon: "💧",
    description: "Clean potable water has been gushing out on the street for 48 hours while nearby homes are getting zero water pressure.",
    locationName: "F-10/2, Street 35, Near Park, Islamabad",
    lat: 33.6938,
    lng: 73.0135,
    citizenName: "Bilal Farooq",
    citizenPhone: "0345-4433221",
    status: "submitted",
    department: "Capital Water & Sanitation Directorate",
    officerRemarks: "",
    imageUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80",
    submittedAt: "2026-10-21T16:10:00Z",
    reviewedAt: null,
    assignedAt: null,
    resolvedAt: null,
    communityConfirmations: 2,
    userConfirmed: false
  },
  {
    id: "AC-2026-005",
    title: "Clogged Sewer Line Causing Road Inundation",
    category: "drainage",
    categoryLabel: "Drainage & Sewerage",
    categoryIcon: "🚰",
    description: "Sewage water has backed up and flooded the street corner, making pedestrian access impossible.",
    locationName: "Clifton Block 2, Near Bilawal Chowrangi, Karachi",
    lat: 24.8198,
    lng: 67.0311,
    citizenName: "Zainab Shah",
    citizenPhone: "0312-3322110",
    status: "resolved",
    department: "Karachi Water & Sewerage Corporation",
    officerRemarks: "Suction jetting machine cleared the blockage in main collector line.",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=600&q=80",
    resolutionProofUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
    submittedAt: "2026-10-12T08:30:00Z",
    reviewedAt: "2026-10-13T10:15:00Z",
    assignedAt: "2026-10-14T09:40:00Z",
    resolvedAt: "2026-10-16T15:20:00Z",
    communityConfirmations: 19,
    userConfirmed: true
  }
];

// ============================================================================
// 3. Database Service (Dual Mode: Firebase or LocalStorage)
// ============================================================================
class CivicDatabaseService {
  constructor() {
    this.storageKey = "awami_connect_complaints_v1";
    this.initStorage();
    this.isFirebase = false;

    // Try initializing Firebase if SDK & valid config exist
    if (isFirebaseConfigured()) {
      try {
        firebase.initializeApp(firebaseConfig);
        this.firestore = firebase.firestore();
        this.storage = firebase.storage();
        this.auth = firebase.auth();
        this.isFirebase = true;
        console.log("Connected to Live Firebase Project!");
      } catch (err) {
        console.warn("Firebase init failed, running in smart LocalStorage mode:", err);
        this.isFirebase = false;
      }
    } else {
      console.log("AwamiConnect running with Smart LocalStorage Engine (Demo Ready).");
    }
  }

  initStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
    }
  }

  // Get all complaints with self-healing corrupted storage recovery
  async getAllComplaints() {
    if (this.isFirebase) {
      try {
        const snapshot = await this.firestore.collection("complaints").orderBy("submittedAt", "desc").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.error("Firebase get error, falling back to local:", e);
      }
    }
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
        return [...INITIAL_DEMO_COMPLAINTS];
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      throw new Error("Storage is not an array");
    } catch (parseErr) {
      console.warn("Corrupted storage detected, self-healing with initial seed:", parseErr);
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
      } catch (ign) {}
      return [...INITIAL_DEMO_COMPLAINTS];
    }
  }

  // Get single complaint by unique ID (e.g. AC-2026-001)
  async getComplaintById(complaintId) {
    const cleanId = complaintId.trim().toUpperCase();
    if (this.isFirebase) {
      try {
        const doc = await this.firestore.collection("complaints").doc(cleanId).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
      } catch (e) {
        console.error("Firebase search error:", e);
      }
    }
    const all = await this.getAllComplaints();
    return all.find(c => c.id.toUpperCase() === cleanId) || null;
  }

  // Save new complaint
  async createComplaint(complaintData) {
    if (this.isFirebase) {
      try {
        await this.firestore.collection("complaints").doc(complaintData.id).set(complaintData);
        return complaintData;
      } catch (e) {
        console.error("Firebase write error, falling back to local:", e);
      }
    }
    // Local fallback with QuotaExceeded resilience
    try {
      const all = await this.getAllComplaints();
      all.unshift(complaintData);
      localStorage.setItem(this.storageKey, JSON.stringify(all));
    } catch (quotaErr) {
      console.warn("Storage quota exceeded or write failed:", quotaErr);
    }
    return complaintData;
  }

  // Update status and official remarks
  async updateComplaintStatus(id, newStatus, remarks = "", department = "", resolutionProofUrl = "") {
    const timestamp = new Date().toISOString();
    const updatePayload = {
      status: newStatus,
      officerRemarks: remarks,
      updatedAt: timestamp
    };

    if (department) updatePayload.department = department;
    if (resolutionProofUrl) updatePayload.resolutionProofUrl = resolutionProofUrl;

    if (newStatus === "under_review") updatePayload.reviewedAt = timestamp;
    if (newStatus === "assigned") updatePayload.assignedAt = timestamp;
    if (newStatus === "resolved") updatePayload.resolvedAt = timestamp;

    if (this.isFirebase) {
      try {
        await this.firestore.collection("complaints").doc(id).update(updatePayload);
      } catch (e) {
        console.error("Firebase update error:", e);
      }
    }

    // Local storage update
    const all = await this.getAllComplaints();
    const index = all.findIndex(c => c.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updatePayload };
      localStorage.setItem(this.storageKey, JSON.stringify(all));
      return all[index];
    }
    return null;
  }

  // Citizen confirms resolution
  async confirmResolution(id, isConfirmed = true) {
    const all = await this.getAllComplaints();
    const index = all.findIndex(c => c.id === id);
    if (index !== -1) {
      all[index].communityConfirmations = (all[index].communityConfirmations || 0) + (isConfirmed ? 1 : 0);
      all[index].userConfirmed = isConfirmed;

      if (this.isFirebase) {
        try {
          await this.firestore.collection("complaints").doc(id).update({
            communityConfirmations: all[index].communityConfirmations,
            userConfirmed: isConfirmed
          });
        } catch (e) {
          console.error("Firebase confirm error:", e);
        }
      }

      localStorage.setItem(this.storageKey, JSON.stringify(all));
      return all[index];
    }
    return null;
  }

  // Delete complaint
  async deleteComplaint(id) {
    if (this.isFirebase) {
      try {
        await this.firestore.collection("complaints").doc(id).delete();
      } catch (e) {
        console.error("Firebase delete error:", e);
      }
    }
    const all = await this.getAllComplaints();
    const updated = all.filter(c => c.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
    return true;
  }

  // Reset to original demo data anytime
  resetDemoData() {
    localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
  }
}

// Global instance
window.dbService = new CivicDatabaseService();
