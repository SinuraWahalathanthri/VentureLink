import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ─── Firebase config ──────────────────────────────────────────────
const app = initializeApp({
  apiKey: 'AIzaSyAYp96VglG4XroleSiPhmBNxD1TsO66XvE',
  authDomain: 'venturelink-8374b.firebaseapp.com',
  projectId: 'venturelink-8374b',
  storageBucket: 'venturelink-8374b.firebasestorage.app',
  messagingSenderId: '1007831383423',
  appId: '1:1007831383423:web:369ee42965552687cc6e4a',
});

const auth = getAuth(app);
const db = getFirestore(app);

// ─── Cloudinary ──────────────────────────────────────────────────
const CLOUD_NAME = 'ddvlnblw7';
const IMG_PRESET = 'venturelink';
const DOC_PRESET = 'venturelink-docs';
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

async function uploadToCloudinary(file, isDoc = false) {
  if (!file) return null;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', isDoc ? DOC_PRESET : IMG_PRESET);
  fd.append('folder', isDoc ? 'docs' : 'images');

  const res = await fetch(CLOUD_URL, { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Upload failed');
  }
  return data.secure_url;
}

// ─── UI helpers ──────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = message;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

function setButtonLoading(id, loading) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;

// ─── Auth guard & user bootstrap ─────────────────────────────────
let currentUser = null;
let currentUserProfile = null;
let currentPayingCampaign = null;

async function redirectToLogin(reason, doSignOut = false) {
  try {
    sessionStorage.setItem('smeDashboardRedirectReason', reason);
  } catch {
    // ignore storage issues
  }
  if (doSignOut) {
    try {
      await signOut(auth);
    } catch {
      // ignore signout failure
    }
  }
  window.location.href = 'SMELogin.html';
}

// Protect dashboard: only logged-in SME with status 'active'
onAuthStateChanged(auth, async (user) => {
  let activeUser = user;

  // On some browsers/environments, persisted auth can restore slightly after the first callback.
  if (!activeUser) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    activeUser = auth.currentUser;
  }

  if (!activeUser) {
    await redirectToLogin('No authenticated user session found (after retry).');
    return;
  }

  try {
    const userRef = doc(db, 'users', activeUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await redirectToLogin('No Firestore user profile found for this account.', true);
      return;
    }

    const data = snap.data();
    currentUser = activeUser;
    currentUserProfile = data;

    // Allow active SME/business-owner accounts; tolerate case/value variations.
    const normalizedStatus = String(data.status || '').trim().toLowerCase();
    const normalizedRole = String(data.role || '').trim().toLowerCase();
    const allowedRoles = new Set([
      'sme',
      'sme_owner',
      'business_owner',
      'owner',
      'entrepreneur',
      '',
    ]);

    if (normalizedStatus !== 'active' || !allowedRoles.has(normalizedRole)) {
      await redirectToLogin(
        `Account is not allowed. status="${data.status || ''}", role="${data.role || ''}"`,
        true,
      );
      return;
    }

    hydrateUserUI();
    attachListenersOnce();
    subscribeToCampaigns();
    subscribeToInvestors(); // optional – just shows empty state if none

  } catch (err) {
    console.error('Auth bootstrap failed', err);
    await redirectToLogin(`Dashboard auth bootstrap failed: ${err?.message || 'Unknown error'}`, true);
  }
});

function hydrateUserUI() {
  if (!currentUserProfile) return;

  const firstName = currentUserProfile.firstName || currentUserProfile.displayName?.split(' ')[0] || 'Owner';
  const lastName = currentUserProfile.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  const dashName = document.getElementById('dashName');
  const sbUserName = document.getElementById('sbUserName');
  const profileName = document.getElementById('profileName');
  const initialsEl = document.getElementById('sbAvatarInitials');

  if (dashName) dashName.textContent = firstName;
  if (sbUserName) sbUserName.textContent = fullName;
  if (profileName) profileName.textContent = fullName;
  if (initialsEl) {
    const i1 = firstName.charAt(0).toUpperCase() || 'S';
    const i2 = lastName.charAt(0).toUpperCase() || '';
    initialsEl.textContent = `${i1}${i2}`;
  }

  const regPage = document.getElementById('regPage');
  const dashPage = document.getElementById('dashPage');
  if (regPage) regPage.style.display = 'none';
  if (dashPage) dashPage.classList.add('active');
}

// ─── Navigation between dashboard views ─────────────────────────
const viewTitles = {
  dashboard: 'Dashboard',
  businesses: 'My Businesses',
  newcampaign: 'Create Campaign',
  pending: 'Pending Review',
  investors: 'Investors',
  profile: 'My Profile',
  docs: 'My Documents',
};

function showPage(id) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
window.showPage = showPage;

export function switchView(name, el) {
  document
    .querySelectorAll('.dash-view')
    .forEach((v) => v.classList.remove('active'));
  const view = document.getElementById(`view-${name}`);
  if (view) view.classList.add('active');

  const title = document.getElementById('topbarTitle');
  if (title) title.textContent = viewTitles[name] || name;

  document
    .querySelectorAll('.sb-nav-item')
    .forEach((i) => i.classList.remove('active'));
  if (el) el.classList.add('active');

  if (name === 'businesses') renderBizCardsCached();
  if (name === 'investors') renderInvestors();
  if (name === 'dashboard') renderDashboardOverview();
  if (name === 'pending') renderPendingView();
}

window.switchView = switchView;

// ─── Campaign form stepper ───────────────────────────────────────
function updateCfStepUI(step) {
  [1, 2, 3, 4].forEach((i) => {
    const circle = document.getElementById(`cfs${i}`);
    const label = document.getElementById(`cfsl${i}`) || document.getElementById(`cfsl${i}`); // some labels only 2..4
    if (!circle) return;

    if (i < step) {
      circle.className = 'cf-step-circle done';
      circle.textContent = '✓';
      if (label) label.className = 'cf-step-label';
    } else if (i === step) {
      circle.className = 'cf-step-circle active';
      circle.textContent = String(i);
      if (label) label.className = 'cf-step-label active';
    } else {
      circle.className = 'cf-step-circle pending';
      circle.textContent = String(i);
      if (label) label.className = 'cf-step-label';
    }
  });
}

export function cfNext(step) {
  document
    .querySelectorAll('.cf-section')
    .forEach((s) => s.classList.remove('active'));
  const target = document.getElementById(`cfs-${step}`);
  if (target) target.classList.add('active');
  updateCfStepUI(step);
}

window.cfNext = cfNext;

// ─── Use-of-funds builder ────────────────────────────────────────
export function addFundRow() {
  const container = document.getElementById('fundsBuilder');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'fund-row';
  row.innerHTML = `
    <input class="fund-row-input fund-category" type="text" placeholder="e.g. Marketing expansion" />
    <input class="fund-row-input fund-percent" type="number" placeholder="%" />
    <button class="fund-row-del" type="button" onclick="delFundRow(this)">×</button>
  `;
  container.appendChild(row);
}

export function delFundRow(btn) {
  const row = btn.closest('.fund-row');
  if (row) row.remove();
}

window.addFundRow = addFundRow;
window.delFundRow = delFundRow;

function getUseOfFunds() {
  const container = document.getElementById('fundsBuilder');
  if (!container) return [];
  const rows = Array.from(container.querySelectorAll('.fund-row'));
  return rows
    .map((row) => {
      const category = row.querySelector('.fund-category')?.value.trim() || '';
      const percentStr = row.querySelector('.fund-percent')?.value || '0';
      if (!category) return null;
      const percent = parseInt(percentStr, 10) || 0;
      return { category, percent };
    })
    .filter(Boolean);
}

// ─── Implied valuation live calculation ─────────────────────────
function updateImpliedValuation() {
  const goalEl = document.getElementById('cfGoal');
  const equityEl = document.getElementById('cfEquity');
  const out = document.getElementById('impliedVal');
  if (!goalEl || !equityEl || !out) return;
  const goal = Number(goalEl.value || 0);
  const equity = Number(equityEl.value || 0);
  if (!goal || !equity) {
    out.textContent = '—';
    return;
  }
  const valuation = (goal / (equity / 100));
  out.textContent =
    'LKR ' + valuation.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

// ─── Document uploads (4 docs) ──────────────────────────────────
const docFiles = {
  registration: null,
  pitch: null,
  financials: null,
  bank: null,
};

export function handleDocUpload(input, key) {
  const file = input.files[0];
  if (!file) return;
  docFiles[key] = file;

  let zoneId = '';
  if (key === 'registration') zoneId = 'docRegistrationZone';
  if (key === 'pitch') zoneId = 'docPitchZone';
//   if (key === 'financials') zoneId = 'docFinancialsZone';
  if (key === 'bank') zoneId = 'docBankZone';

  const zone = document.getElementById(zoneId);
  if (!zone) return;

  zone.classList.add('filled');
  const title = zone.querySelector('.upload-zone-title');
  const sub = zone.querySelector('.upload-zone-sub');
  if (title) {
    const nm = file.name;
    title.textContent =
      '✓ ' + (nm.length > 22 ? nm.substring(0, 22) + '…' : nm);
  }
  if (sub) {
    sub.textContent = (file.size / 1024 / 1024).toFixed(1) + ' MB · Ready';
  }
}

window.handleDocUpload = handleDocUpload;

// ─── Campaign creation ───────────────────────────────────────────
function readValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function readNumber(id) {
  const v = readValue(id);
  if (!v) return 0;
  // allow "45,000,000" style too
  const normalized = v.replace(/,/g, '');
  return Number(normalized) || 0;
}

async function submitCampaignInternal() {
  if (!currentUser || !currentUserProfile) {
    showToast('Please sign in again.', 'error');
    return;
  }

  // Section 1
  const businessName = readValue('cfBusinessName');
  const industry = readValue('cfIndustry');
  const stage = readValue('cfStage');
  const city = readValue('cfCity');
  const district = readValue('cfDistrict');
  const regNo = readValue('cfRegNo');
  const tin = readValue('cfTin');
  const yearEstablished = Number(readValue('cfYearEstablished')) || null;
  const tagline = readValue('cfTagline');
  const description = readValue('cfDescription');
  const problemSolution = readValue('cfProblemSolution');

  // Section 2
  const revenueLkr = readNumber('cfRevenue');
  const profitLkr = readNumber('cfProfit');
  const opexLkr = readNumber('cfOpex');
  const employees = Number(readValue('cfEmployees')) || 0;
  const products = readValue('cfProducts');
  const growthPlan = readValue('cfGrowthPlan');

  // Section 3
  const fundingGoalLkr = readNumber('cfGoal');
  const equityOfferedPct = Number(readValue('cfEquity')) || 0;
  const minInvestmentLkr = readNumber('cfMinInvestment');
  const deadline = readValue('cfDeadline'); // keep as string "YYYY-MM-DD"
  const useOfFunds = getUseOfFunds();

  // Basic validation (required fields)
  if (
    !businessName ||
    !industry ||
    !stage ||
    !city ||
    !district ||
    !tagline ||
    !description ||
    !products ||
    !growthPlan ||
    !fundingGoalLkr ||
    !equityOfferedPct ||
    !minInvestmentLkr ||
    !deadline
  ) {
    showToast('Please complete all required fields before submitting.', 'error');
    return;
  }

  try {
    setButtonLoading('cfSubmitBtn', true);

    // Upload docs
    const [
      registrationUrl,
      pitchDeckUrl,
    //   financialsUrl,
      bankStatementUrl,
    ] = await Promise.all([
      uploadToCloudinary(docFiles.registration, true),
      uploadToCloudinary(docFiles.pitch, true),
    //   uploadToCloudinary(docFiles.financials, true),
      uploadToCloudinary(docFiles.bank, true),
    ]);

    const ownerName =
      currentUserProfile.displayName ??
      `${currentUserProfile.firstName || ''} ${currentUserProfile.lastName || ''}`.trim();

    const now = serverTimestamp();

    // Build document with exact shape requested
    const campaignDoc = {
      businessName,
      city,
      committedLkr: 0.0,
      createdAt: now,
      deadline, // string "YYYY-MM-DD"
      description,
      district,
      documents: {
        bankStatementUrl: bankStatementUrl || '',
        // financialsUrl: financialsUrl || '',
        pitchDeckUrl: pitchDeckUrl || '',
        registrationUrl: registrationUrl || '',
      },
      equityOfferedPct,
      financials: {
        employees,
        opexLkr,
        profitLkr,
        revenueLkr,
      },
      fundingGoalLkr,
      growthPlan,
      industry,
      minInvestmentLkr,
      ownerEmail: currentUser.email,
      ownerName: ownerName || currentUser.email,
      ownerUid: currentUser.uid,
      problemSolution,
      products,
      regNo,
      stage,
      status: 'pending', // initial status
      tagline,
      tin,
      updatedAt: now,
      useOfFunds, // array of { category, percent }
      yearEstablished,
    };

    const campaignsCol = collection(db, 'campaigns');
    await addDoc(campaignsCol, campaignDoc);

    showToast('Campaign submitted for review!', 'success');
    // reset / go back to Businesses list
    resetCampaignForm();
    switchView('businesses');
  } catch (err) {
    console.error('submitCampaign failed', err);
    showToast('Failed to submit campaign: ' + err.message, 'error');
  } finally {
    setButtonLoading('cfSubmitBtn', false);
  }
}

function resetCampaignForm() {
  [
    'cfBusinessName',
    'cfIndustry',
    'cfStage',
    'cfCity',
    'cfDistrict',
    'cfRegNo',
    'cfTin',
    'cfYearEstablished',
    'cfTagline',
    'cfDescription',
    'cfProblemSolution',
    'cfRevenue',
    'cfProfit',
    'cfOpex',
    'cfEmployees',
    'cfProducts',
    'cfGrowthPlan',
    'cfGoal',
    'cfEquity',
    'cfMinInvestment',
    'cfDeadline',
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const fundsBuilder = document.getElementById('fundsBuilder');
  if (fundsBuilder) {
    fundsBuilder.innerHTML = '';
    addFundRow();
  }

  Object.keys(docFiles).forEach((k) => (docFiles[k] = null));
  ['docRegistrationZone', 'docPitchZone', 'docFinancialsZone', 'docBankZone'].forEach((id) => {
    const zone = document.getElementById(id);
    if (!zone) return;
    zone.classList.remove('filled');
    const title = zone.querySelector('.upload-zone-title');
    const sub = zone.querySelector('.upload-zone-sub');
    if (title) title.textContent = 'Upload document';
    if (sub) sub.textContent = 'PDF, up to 10MB';
  });

  const val = document.getElementById('impliedVal');
  if (val) val.textContent = '—';

  cfNext(1);
}

export function submitCampaign() {
  submitCampaignInternal();
}

window.submitCampaign = submitCampaign;

// ─── Real-time campaigns listing ─────────────────────────────────
let campaignsCache = [];

function subscribeToCampaigns() {
  if (!currentUser) return;
  const q = query(
    collection(db, 'campaigns'),
    where('ownerUid', '==', currentUser.uid),
    orderBy('createdAt', 'desc'),
  );

  onSnapshot(
    q,
    (snap) => {
      campaignsCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      refreshDashboardFromCache();
    },
    (err) => {
      console.error('campaigns snapshot error', err);
      showToast('Failed to load campaigns list.', 'error');
    },
  );
}

function renderBizCardsCached() {
  const grid = document.getElementById('bizGrid');
  if (!grid) return;

  const activeFilterEl = document.querySelector('.filter-pill.active');
  const filter =
    activeFilterEl?.dataset?.status || activeFilterEl?.getAttribute('data-status') || 'all';

  let data =
    filter === 'all'
      ? campaignsCache
      : campaignsCache.filter((c) => c.status === filter);

  if (!data.length) {
    grid.innerHTML =
      '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🏢</div><div class="empty-title">No campaigns found</div><div class="empty-sub">Try a different filter or create a new campaign.</div></div>';
    return;
  }

  const pillMap = {
    published: 'pill-published',
    accepted: 'pill-accepted',
    pending: 'pill-pending',
    changes: 'pill-changes',
    rejected: 'pill-rejected',
  };
  const labelMap = {
    published: 'Published',
    accepted: 'Accepted',
    pending: 'Pending',
    changes: 'Changes Required',
    rejected: 'Rejected',
  };

  grid.innerHTML = data
    .map((c) => {
      const goalM = c.fundingGoalLkr ? c.fundingGoalLkr / 1_000_000 : 0;
      const committedM = c.committedLkr ? c.committedLkr / 1_000_000 : 0;
      const pct =
        c.fundingGoalLkr && c.committedLkr
          ? Math.round((c.committedLkr / c.fundingGoalLkr) * 100)
          : 0;
      const pill = pillMap[c.status] || 'pill-pending';
      const label = labelMap[c.status] || c.status || 'Pending';

      let actionHtml = '';
      if (c.status === 'accepted') {
        actionHtml = `<button class="btn btn-pay btn-xs" type="button" onclick="openPayModal('${c.id}')">
          <svg viewBox="0 0 24 24" width="10" height="10" stroke="white" fill="none" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          Pay to Publish
        </button>`;
      } else if (c.status === 'published') {
        actionHtml = `<button class="btn btn-publish btn-xs" type="button" onclick="showToast('Opening live campaign...')">View Live</button>`;
      } else if (c.status === 'pending') {
        actionHtml = `<button class="btn btn-outline btn-xs" type="button" style="opacity:.5;cursor:not-allowed">Awaiting Review</button>`;
      } else {
        actionHtml = `<button class="btn btn-outline btn-xs" type="button">View</button>`;
      }

      const committedInfo =
        c.committedLkr && c.committedLkr > 0
          ? `<div class="biz-progress"><div class="biz-progress-fill" style="width:${pct}%"></div></div>
             <div style="font-size:12px;color:var(--text3);margin-bottom:10px">
               LKR ${committedM.toFixed(1)}M raised · ${pct}%
             </div>`
          : `<div style="font-size:12px;color:var(--text3);margin-bottom:22px">
               ${c.status === 'accepted' ? 'Ready to publish' : 'Not yet live'}
             </div>`;

      const statusSub =
        c.committedLkr && c.committedLkr > 0
          ? `${Math.max(1, Math.floor(c.committedLkr / (c.minInvestmentLkr || 1)))} investors`
          : c.status === 'accepted'
          ? 'Pay to go live'
          : 'Awaiting review';

      const industry = c.industry || 'Business';
      const initials = (c.businessName || 'SME')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return `
      <div class="biz-card">
        <div class="biz-card-top" style="background:linear-gradient(135deg,#3B6D11dd,#3B6D1188)">
          ${initials}
        </div>
        <div class="biz-card-body">
          <h3 class="biz-card-name">${c.businessName}</h3>
          <div class="biz-card-ind">${industry}</div>
          <div class="biz-card-meta">
            <span style="font-size:13px;color:var(--text2)">Goal: <strong>LKR ${goalM.toFixed(
              1,
            )}M</strong></span>
            <span class="pill ${pill}">${label}</span>
          </div>
          ${committedInfo}
          <div class="biz-card-footer">
            <span style="font-size:12px;color:var(--text3)">${statusSub}</span>
            ${actionHtml}
          </div>
        </div>
      </div>`;
    })
    .join('');
}

export function bizFilter(filter, el) {
  document
    .querySelectorAll('.filter-pill')
    .forEach((p) => p.classList.remove('active'));
  if (el) el.classList.add('active');
  renderBizCardsCached();
}

window.bizFilter = bizFilter;

// ─── Payment flow (for accepted campaigns) ───────────────────────
export function openPayModal(campaignId) {
  currentPayingCampaign =
    campaignsCache.find((c) => c.id === campaignId || c.businessName === campaignId) || null;
  if (!currentPayingCampaign) return;
  // You can populate modal details here (amount, name, etc.)
  openModal('payModal');
}

window.openPayModal = openPayModal;

export async function confirmPayment() {
  if (!currentPayingCampaign) {
    closeModal('payModal');
    return;
  }

  try {
    setButtonLoading('confirmPayBtn', true);

    const campaignRef = doc(db, 'campaigns', currentPayingCampaign.id);

    // For demo: assume full goal committed once payment is “successful”
    const committedLkr = currentPayingCampaign.fundingGoalLkr || 0;

    await setDoc(
      campaignRef,
      {
        status: 'published',
        committedLkr,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    showToast('Payment successful! Campaign is now published.', 'success');
    closeModal('payModal');
  } catch (err) {
    console.error('confirmPayment failed', err);
    showToast('Payment failed: ' + err.message, 'error');
  } finally {
    setButtonLoading('confirmPayBtn', false);
  }
}

window.confirmPayment = confirmPayment;

// ─── Investors view (Firestor-backed, no static HTML data) ──────
let investorsCache = [];

function subscribeToInvestors() {
  if (!currentUser) return;
  // You can change this schema – here we assume a top-level 'investors' collection
  // with field 'ownerUid' or 'campaignOwnerUid'. Adjust if your schema is different.
  const q = query(
    collection(db, 'investors'),
    where('ownerUid', '==', currentUser.uid),
  );

  onSnapshot(
    q,
    (snap) => {
      investorsCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      refreshDashboardFromCache();
    },
    (err) => {
      console.error('investors snapshot error', err);
    },
  );
}

function fmtLKR(n) {
  if (!n) return 'LKR 0';
  if (n >= 1_000_000) {
    return 'LKR ' + (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
  }
  return 'LKR ' + Number(n).toLocaleString();
}

function fmtCompactLkrNumber(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 2) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return String(Math.round(v));
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function tsToMs(v) {
  if (!v) return 0;
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  if (v.seconds != null) return v.seconds * 1000;
  return 0;
}

function formatSubmittedAgo(v) {
  const t = tsToMs(v);
  if (!t) return '—';
  const d = Math.floor((Date.now() - t) / 86400000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

function goalCell(lkr) {
  if (!lkr) return '—';
  if (lkr >= 1_000_000) return fmtCompactLkrNumber(lkr) + 'M';
  return fmtLKR(lkr);
}

function committedCell(c) {
  const goal = Number(c.fundingGoalLkr) || 0;
  const com = Number(c.committedLkr) || 0;
  if (!com) return '—';
  const pct = goal ? Math.round((com / goal) * 100) : 0;
  const comStr = com >= 1_000_000 ? fmtCompactLkrNumber(com) + 'M' : fmtLKR(com).replace('LKR ', '');
  return `${comStr} (${pct}%)`;
}

const tableLabelMap = {
  published: 'Published',
  accepted: 'Accepted',
  pending: 'Pending',
  changes: 'Changes Required',
  rejected: 'Rejected',
};

const tablePillMap = {
  published: 'pill-published',
  accepted: 'pill-accepted',
  pending: 'pill-pending',
  changes: 'pill-changes',
  rejected: 'pill-rejected',
};

function refreshDashboardFromCache() {
  renderDashboardOverview();
  renderPendingView();
  renderBizCardsCached();
  syncInvCampaignFilterOptions();
  renderInvestors();
}

function syncInvCampaignFilterOptions() {
  const sel = document.getElementById('invCampaignFilter');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="all">All Campaigns</option>';
  campaignsCache.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.businessName || 'Campaign';
    sel.appendChild(opt);
  });
  if ([...sel.options].some((o) => o.value === prev)) sel.value = prev;
}

export function renderDashboardOverview() {
  const n = campaignsCache.length;
  const counts = { published: 0, pending: 0, accepted: 0, changes: 0, rejected: 0, other: 0 };
  let totalGoal = 0;
  let totalCommitted = 0;
  campaignsCache.forEach((c) => {
    const st = String(c.status || '').toLowerCase();
    if (st === 'published') counts.published++;
    else if (st === 'pending') counts.pending++;
    else if (st === 'accepted') counts.accepted++;
    else if (st === 'changes') counts.changes++;
    else if (st === 'rejected') counts.rejected++;
    else counts.other++;
    totalGoal += Number(c.fundingGoalLkr) || 0;
    totalCommitted += Number(c.committedLkr) || 0;
  });

  const elCamp = document.getElementById('dashStatCampaignsValue');
  const elCampMeta = document.getElementById('dashStatCampaignsMeta');
  if (elCamp) elCamp.textContent = n ? String(n) : '0';
  if (elCampMeta) {
    const parts = [
      `<strong>${counts.published}</strong> published`,
      `<strong>${counts.pending}</strong> pending`,
      `<strong>${counts.accepted}</strong> accepted`,
    ];
    if (counts.changes) parts.push(`<strong>${counts.changes}</strong> changes req.`);
    if (counts.rejected) parts.push(`<strong>${counts.rejected}</strong> rejected`);
    if (counts.other) parts.push(`<strong>${counts.other}</strong> other`);
    elCampMeta.innerHTML = parts.join(' · ');
  }

  const elGoal = document.getElementById('dashStatGoalValue');
  const elGoalMeta = document.getElementById('dashStatGoalMeta');
  if (elGoal) elGoal.textContent = totalGoal ? fmtCompactLkrNumber(totalGoal) : '0';
  if (elGoalMeta) elGoalMeta.textContent = 'LKR across all campaigns';

  const elCom = document.getElementById('dashStatCommittedValue');
  const elComMeta = document.getElementById('dashStatCommittedMeta');
  if (elCom) elCom.textContent = totalCommitted ? fmtCompactLkrNumber(totalCommitted) : '0';
  if (elComMeta) {
    const pct = totalGoal ? Math.round((totalCommitted / totalGoal) * 1000) / 10 : 0;
    elComMeta.innerHTML = totalGoal
      ? `<strong>${pct}%</strong> of total goal`
      : 'No funding goals yet';
  }

  const invN = investorsCache.length;
  const elInv = document.getElementById('dashStatInvestorsValue');
  const elInvMeta = document.getElementById('dashStatInvestorsMeta');
  if (elInv) elInv.textContent = invN ? String(invN) : '0';
  if (elInvMeta) elInvMeta.textContent = 'Across all campaigns';

  const tbody = document.getElementById('dashRecentCampaignsBody');
  if (!tbody) return;
  const recent = [...campaignsCache].slice(0, 5);
  if (!recent.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="padding:1.5rem;text-align:center;color:var(--text3)">No campaigns yet. Create one to get started.</td></tr>';
    return;
  }
  tbody.innerHTML = recent
    .map((c) => {
      const pill = tablePillMap[c.status] || 'pill-pending';
      const label = tableLabelMap[c.status] || c.status || 'Pending';
      let action = '';
      if (c.status === 'accepted') {
        action = `<button class="btn btn-pay btn-xs" type="button" onclick="openPayModal('${c.id}')"><svg viewBox="0 0 24 24" width="12" height="12" stroke="white" fill="none" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pay to Publish</button>`;
      } else if (c.status === 'published') {
        action = `<button class="btn btn-outline btn-xs" type="button" onclick="switchView('businesses', null)">View</button>`;
      } else if (c.status === 'pending') {
        action = `<button class="btn btn-outline btn-xs" type="button" style="opacity:.5;cursor:not-allowed">Awaiting Review</button>`;
      } else {
        action = `<button class="btn btn-outline btn-xs" type="button" onclick="switchView('businesses', null)">View</button>`;
      }
      return `<tr>
        <td class="td-name">${escapeHtml(c.businessName)}</td>
        <td>${escapeHtml(c.industry || '—')}</td>
        <td>${goalCell(c.fundingGoalLkr)}</td>
        <td>${committedCell(c)}</td>
        <td><span class="pill ${pill}">${label}</span></td>
        <td>${action}</td>
      </tr>`;
    })
    .join('');
}

window.renderDashboardOverview = renderDashboardOverview;

export function renderPendingView() {
  const accepted = campaignsCache.filter((c) => c.status === 'accepted');
  const banner = document.getElementById('pendingAcceptedBanner');
  const titleEl = document.getElementById('pendingAcceptedTitle');
  const payBtn = document.getElementById('pendingAcceptedPayBtn');
  if (accepted.length && banner && titleEl && payBtn) {
    const latest = accepted.reduce((a, b) => (tsToMs(a.createdAt) >= tsToMs(b.createdAt) ? a : b));
    banner.style.display = 'flex';
    titleEl.textContent = `${latest.businessName || 'Campaign'} — Accepted!`;
    payBtn.onclick = () => openPayModal(latest.id);
  } else if (banner) {
    banner.style.display = 'none';
  }

  const tbody = document.getElementById('pendingSubmissionsBody');
  if (!tbody) return;
  if (!campaignsCache.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="padding:1.5rem;text-align:center;color:var(--text3)">No submissions yet.</td></tr>';
    return;
  }
  const sorted = [...campaignsCache].sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));
  tbody.innerHTML = sorted
    .map((c) => {
      const pill = tablePillMap[c.status] || 'pill-pending';
      const label =
        c.status === 'pending'
          ? 'Under Review'
          : tableLabelMap[c.status] || c.status || 'Pending';
      let action = '—';
      if (c.status === 'accepted') {
        action = `<button class="btn btn-pay btn-xs" type="button" onclick="openPayModal('${c.id}')">Pay to Publish</button>`;
      }
      return `<tr>
        <td class="td-name">${escapeHtml(c.businessName)}</td>
        <td>${formatSubmittedAgo(c.createdAt)}</td>
        <td>${escapeHtml(c.industry || '—')}</td>
        <td>${c.fundingGoalLkr ? 'LKR ' + fmtCompactLkrNumber(c.fundingGoalLkr) + 'M' : '—'}</td>
        <td><span class="pill ${pill}">${label}</span></td>
        <td>${action}</td>
      </tr>`;
    })
    .join('');
}

window.renderPendingView = renderPendingView;

export function renderInvestors() {
  const tbody = document.getElementById('invTableBody');
  const statsRow = document.getElementById('invStatsRow');
  if (!tbody || !statsRow) return;

  const filterEl = document.getElementById('invCampaignFilter');
  const filter = filterEl?.value || 'all';
  const search = (document.getElementById('invSearch')?.value || '').toLowerCase();

  const data = investorsCache.filter((inv) => {
    const matchCampaign = filter === 'all' || inv.campaignId === filter;
    const matchSearch =
      !search ||
      (inv.name || '').toLowerCase().includes(search) ||
      (inv.email || '').toLowerCase().includes(search) ||
      (inv.mobile || '').includes(search) ||
      (inv.campaignName || '').toLowerCase().includes(search);
    return matchCampaign && matchSearch;
  });

  const total = data.reduce((s, i) => s + (i.amountLkr || 0), 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  const largest = data.length ? Math.max(...data.map((i) => i.amountLkr || 0)) : 0;

  statsRow.innerHTML = `
    <div class="inv-stat">
      <div class="inv-stat-label">Total Investors</div>
      <div class="inv-stat-value">${data.length}</div>
      <div class="inv-stat-sub">in selected campaign(s)</div>
    </div>
    <div class="inv-stat">
      <div class="inv-stat-label">Total Committed</div>
      <div class="inv-stat-value">${fmtLKR(total)}</div>
      <div class="inv-stat-sub">combined commitment</div>
    </div>
    <div class="inv-stat">
      <div class="inv-stat-label">Avg. Commitment</div>
      <div class="inv-stat-value">${fmtLKR(avg)}</div>
      <div class="inv-stat-sub">per investor</div>
    </div>
    <div class="inv-stat">
      <div class="inv-stat-label">Largest Commitment</div>
      <div class="inv-stat-value">${data.length ? fmtLKR(largest) : '—'}</div>
      <div class="inv-stat-sub">single investor</div>
    </div>
  `;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="inv-empty">
            <div class="inv-empty-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="inv-empty-title">No investors found</div>
            <div class="inv-empty-sub">Once investors commit funds to your campaigns, they'll show up here.</div>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((inv) => {
      const initials =
        (inv.initials ||
          (inv.name || 'I')
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase());
      const notes = inv.notes || '';
      const notesPreview =
        notes.length > 55 ? notes.substring(0, 55) + '…' : notes;

      return `
        <tr>
          <td>
            <div class="inv-name-cell">
              <div class="inv-avatar">${initials}</div>
              <div>
                <div class="inv-name-text">${inv.name || 'Investor'}</div>
                <div class="inv-name-date">Committed ${inv.date || ''}</div>
              </div>
            </div>
          </td>
          <td style="white-space:nowrap">
            <a href="tel:${(inv.mobile || '').replace(/\s/g, '')}" style="color:var(--text2);text-decoration:none;font-size:13px" onclick="event.stopPropagation()">${inv.mobile || '—'}</a>
          </td>
          <td>
            <a href="mailto:${inv.email || ''}" style="color:var(--b400);text-decoration:none;font-size:13px" onclick="event.stopPropagation()">${inv.email || '—'}</a>
          </td>
          <td><span class="inv-campaign-tag">${inv.campaignName || 'Campaign'}</span></td>
          <td><span class="inv-amount">${fmtLKR(inv.amountLkr || 0)}</span></td>
          <td><span class="inv-notes" title="${notes}">${notesPreview}</span></td>
          <td>
            <div class="inv-actions">
              <button class="btn-mail" type="button" onclick="sendMail('${inv.id}',event)" title="Send email">
                Email
              </button>
              <button class="btn-wa" type="button" onclick="sendWA('${inv.id}',event)" title="WhatsApp">
                WhatsApp
              </button>
              <button class="btn-view-inv" type="button" onclick="openInvDetail('${inv.id}',event)" title="View details">
                View
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

window.renderInvestors = renderInvestors;

export function sendMail(id, event) {
  event?.stopPropagation();
  const inv = investorsCache.find((i) => i.id === id);
  if (!inv || !inv.email) return;
  const subject = encodeURIComponent(
    `SMEFund.lk — Regarding your investment interest in ${inv.campaignName || ''}`,
  );
  const body = encodeURIComponent(
    `Dear ${inv.name || ''},\n\nThank you for expressing your interest in ${
      inv.campaignName || 'our campaign'
    } on SMEFund.lk.\n\nBest regards,\n${currentUserProfile?.firstName || 'SME Owner'}`,
  );
  window.open(`mailto:${inv.email}?subject=${subject}&body=${body}`);
  showToast(`Opening mail client for ${inv.name || 'investor'}…`);
}

export function sendWA(id, event) {
  event?.stopPropagation();
  const inv = investorsCache.find((i) => i.id === id);
  if (!inv || !inv.mobile) return;
  const num = inv.mobile.replace(/[\s\+]/g, '');
  const msg = encodeURIComponent(
    `Hello ${(inv.name || '').split(' ')[0]}, this is ${
      currentUserProfile?.firstName || 'an SME owner'
    } from SMEFund.lk. Thank you for your interest in ${
      inv.campaignName || 'our campaign'
    }. I'd love to connect and discuss the investment opportunity further!`,
  );
  window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  showToast(`Opening WhatsApp for ${inv.name || 'investor'}…`);
}

export function openInvDetail(id, event) {
  event?.stopPropagation();
  const inv = investorsCache.find((i) => i.id === id);
  if (!inv) return;

  document.getElementById('invDetailAvatar').textContent =
    inv.initials ||
    (inv.name || 'I')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  document.getElementById('invDetailName').textContent = inv.name || 'Investor';
  document.getElementById('invDetailSub').textContent =
    'Committed · ' + (inv.campaignName || '');
  document.getElementById('invDetailMobile').textContent = inv.mobile || '—';
  document.getElementById('invDetailEmail').textContent = inv.email || '—';
  document.getElementById('invDetailAmount').textContent = fmtLKR(inv.amountLkr || 0);
  document.getElementById('invDetailDate').textContent = inv.date || '';
  document.getElementById('invDetailNotes').textContent = inv.notes || '';

  const mailBtn = document.getElementById('invDetailMailBtn');
  const waBtn = document.getElementById('invDetailWaBtn');
  if (mailBtn) mailBtn.onclick = () => sendMail(inv.id, { stopPropagation() {} });
  if (waBtn) waBtn.onclick = () => sendWA(inv.id, { stopPropagation() {} });

  openModal('invDetailModal');
}

window.sendMail = sendMail;
window.sendWA = sendWA;
window.openInvDetail = openInvDetail;

export function exportCSV() {
  const header = 'Name,Mobile,Email,Campaign,Committed (LKR),Date,Notes\n';
  const rows = investorsCache
    .map(
      (i) =>
        `"${i.name || ''}","${i.mobile || ''}","${i.email || ''}","${i.campaignName || ''}",${i.amountLkr || 0},"${i.date || ''}","${(i.notes || '').replace(/"/g, "'")}"`,
    )
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smefund-investors.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Investor list exported as CSV!');
}
window.exportCSV = exportCSV;

export function goToPublished() {
  closeModal('invoiceModal');
  switchView('businesses');
}
window.goToPublished = goToPublished;

// ─── One-time DOM event wiring ──────────────────────────────────
let listenersAttached = false;

function attachListenersOnce() {
  if (listenersAttached) return;
  listenersAttached = true;

  const goalEl = document.getElementById('cfGoal');
  const equityEl = document.getElementById('cfEquity');
  if (goalEl) goalEl.addEventListener('input', updateImpliedValuation);
  if (equityEl) equityEl.addEventListener('input', updateImpliedValuation);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = 'SMELogin.html';
    });
  }

  addFundRow();
  updateImpliedValuation();
}