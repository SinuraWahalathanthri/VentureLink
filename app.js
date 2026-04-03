// ═══════════════════════════════════════════════
//  VentureLink — Firebase Integrated Frontend
// ═══════════════════════════════════════════════

// ── FIREBASE INITIALIZATION ──
// Deferring to initialized state passed from root document environment variables
const db = window.db || firebase.firestore();
try { firebase.analytics(); } catch(e) {}

// ── CONSTANTS ──
const INDUSTRY_COLORS = {
  'Technology': '#185FA5',
  'Agriculture & Food': '#3B6D11',
  'Tourism & Hospitality': '#854F0B',
  'Manufacturing': '#6B21A8',
  'Retail & E-commerce': '#B91C1C',
  'Healthcare': '#0F6E56',
  'Apparel & Fashion': '#993556',
  'Construction': '#78716C',
  'Education': '#1E40AF',
  'Fisheries': '#0369A1'
};

// ── STATE ──
let SME_DATA = [];
let currentSME = null;
let currentCalcData = null;
let currentCommitment = null;

// ── AUTHENTICATION STATE ──
let currentUser = null;
let isLoginMode = false;

firebase.auth().onAuthStateChanged(function(user) {
  currentUser = user;
  var navAuthBtns = document.getElementById('navAuthBtns');
  if (navAuthBtns) {
    if (user) {
      navAuthBtns.innerHTML = '<a href="/src/investor/dashboard.html" class="btn btn-outline btn-sm">My Portfolio</a><button class="btn btn-primary btn-sm" onclick="signOut()">Sign Out</button>';
    } else {
      navAuthBtns.innerHTML = '<button class="btn btn-outline btn-sm" onclick="openAuthModal()">Log In / Sign Up</button><button class="btn btn-primary btn-sm">List Your SME</button>';
    }
  }
});

// ── HELPERS ──
function fmtLKR(n) {
  if (n >= 1e9) return 'LKR ' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return 'LKR ' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return 'LKR ' + (n / 1e3).toFixed(0) + 'K';
  return 'LKR ' + n.toLocaleString();
}

function gradientForColor(c) {
  return `linear-gradient(135deg, ${c}cc, ${c}88)`;
}

function getInitials(name) {
  if (!name) return 'NA';
  return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
}

function mapStage(stage) {
  if (!stage) return 'Startup';
  const s = stage.toLowerCase();
  if (s.includes('established') || s.includes('growth') || s.includes('mature')) return 'Established';
  return 'Startup';
}

function showToast(message, isError) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.style.background = isError ? '#B91C1C' : 'var(--green-800)';
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 4000);
}

// ── FIRESTORE → CARD MAPPING ──
function mapCampaignToCard(doc) {
  var d = doc.data();
  var fin = d.financials || {};
  var docs = d.documents || {};
  return {
    id: doc.id,
    name: d.businessName || 'Unnamed Business',
    tagline: d.tagline || '',
    description: d.description || '',
    problem: d.problemSolution || '',
    industry: d.industry || 'Other',
    location: d.city || d.district || '',
    district: d.district || '',
    stage: mapStage(d.stage),
    stageRaw: d.stage || '',
    owner: d.ownerName || '',
    ownerRole: 'Founder & CEO',
    ownerInitials: getInitials(d.ownerName),
    ownerEmail: d.ownerEmail || '',
    ownerUid: d.ownerUid || '',
    color: INDUSTRY_COLORS[d.industry] || '#3B6D11',
    goal: d.fundingGoalLkr || 0,
    equity: d.equityOfferedPct || 0,
    committed: d.committedLkr || 0,
    minInvest: d.minInvestmentLkr || 0,
    deadline: d.deadline || 'TBD',
    employees: fin.employees || 0,
    revenue: fin.revenueLkr ? fmtLKR(fin.revenueLkr) + '/yr' : 'N/A',
    profit: fin.profitLkr ? fmtLKR(fin.profitLkr) + '/yr' : 'Pre-profit',
    expenses: fin.opexLkr ? fmtLKR(fin.opexLkr) + '/yr' : 'N/A',
    products: d.products || '',
    growthPlan: d.growthPlan || '',
    yearEstablished: d.yearEstablished || '',
    regNo: d.regNo || '',
    useOfFunds: (d.useOfFunds || []).map(function (f) {
      return { label: f.category || 'Other', pct: f.percent || 0 };
    }),
    tags: [d.industry, d.stage].filter(Boolean),
    verified: true,
    docUrls: {
      pitchDeck: docs.pitchDeckUrl || '',
      financials: docs.financialsUrl || '',
      registration: docs.registrationUrl || '',
      bankStatement: docs.bankStatementUrl || ''
    }
  };
}

// ── LOAD CAMPAIGNS FROM FIRESTORE ──
async function loadCampaigns() {
  var grid = document.getElementById('cardsGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;"><div class="loading-spinner"></div><p style="color:var(--text-muted);margin-top:1rem;">Loading investment opportunities...</p></div>';
  document.getElementById('cardCount').textContent = 'Loading...';

  try {
    const response = await fetch('http://localhost:5000/api/campaigns');
    if (!response.ok) throw new Error('Failed to fetch campaigns');
    const campaignsData = await response.json();
    
    SME_DATA = campaignsData.map(data => {
      return mapCampaignToCard({ id: data.id, data: () => data });
    });

    if (SME_DATA.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted);"><span class="material-symbols-outlined" style="font-size:48px;margin-bottom:1rem;color:var(--gray-400);">construction</span><p style="font-size:1.2rem;margin-bottom:0.5rem;color:var(--text-primary);">No campaigns available yet</p><p>Check back soon for exciting investment opportunities!</p></div>';
      document.getElementById('cardCount').textContent = 'Showing 0 SMEs';
      return;
    }
    renderCards(SME_DATA);
  } catch (error) {
    console.error('Error loading campaigns:', error);
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;"><span class="material-symbols-outlined" style="font-size:48px;margin-bottom:1rem;color:#B91C1C;">warning</span><p style="font-size:1.2rem;margin-bottom:0.5rem;color:#B91C1C;">Failed to load campaigns</p><p style="color:var(--text-muted);margin-bottom:1rem;">Please check your connection and try again.</p><button class="btn btn-primary" onclick="loadCampaigns()">Retry</button></div>';
    document.getElementById('cardCount').textContent = 'Error';
  }
}

// ── RENDER CARDS ──
function renderCards(data) {
  var grid = document.getElementById('cardsGrid');
  document.getElementById('cardCount').textContent = 'Showing ' + data.length + ' SME' + (data.length !== 1 ? 's' : '');
  if (!data.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">No SMEs match your filters. Try adjusting your search.</div>';
    return;
  }
  grid.innerHTML = data.map(function (s, i) {
    var pct = s.goal > 0 ? Math.round((s.committed / s.goal) * 100) : 0;
    var stageCls = s.stage === 'Startup' ? 'stage-startup' : 'stage-established';
    var delay = (i % 3) * 0.1;
    return '<div class="sme-card animate-on-scroll" style="transition-delay: ' + delay + 's" onclick="openDetail(\'' + s.id + '\')">' +
      '<div class="card-header">' +
      '<div class="card-header-bg" style="background:' + gradientForColor(s.color) + ';"></div>' +
      '<div class="card-header-overlay"></div>' +
      '<div class="card-header-info">' +
      '<span class="card-industry-badge">' + s.industry + '</span>' +
      '<span class="card-stage-badge ' + stageCls + '">' + s.stage + '</span>' +
      '</div>' +
      '</div>' +
      '<div class="card-owner-wrap"><div class="card-owner">' + s.ownerInitials + '</div></div>' +
      '<div class="card-body">' +
      '<h3 class="card-name">' + s.name + (s.verified ? ' <span style="color:var(--green-400);font-size:13px;">✓</span>' : '') + '</h3>' +
      '<p class="card-tagline">' + s.tagline + '</p>' +
      '<div class="card-location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + s.location + '</div>' +
      '<hr class="card-divider">' +
      '<div class="card-investment">' +
      '<div class="invest-item"><div class="label">Funding Goal</div><div class="value">' + fmtLKR(s.goal) + '</div></div>' +
      '<div class="invest-item"><div class="label">Equity Offered</div><div class="value">' + s.equity + '%</div></div>' +
      '</div>' +
      '<div class="progress-section"><div class="progress-meta"><span class="committed">' + fmtLKR(s.committed) + ' raised</span><span>' + pct + '%</span></div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div></div>' +
      '<div class="card-deadline"><span class="deadline-text">Closes <strong>' + s.deadline + '</strong></span><button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openDetail(\'' + s.id + '\')">View Details →</button></div>' +
      '</div>' +
      '</div>';
  }).join('');
}

// ── FILTER ──
function filterCards() {
  var q = document.getElementById('searchInput').value.toLowerCase();
  var ind = document.getElementById('filterIndustry').value;
  var stage = document.getElementById('filterStage').value;
  var loc = document.getElementById('filterLocation').value;
  var size = document.getElementById('filterSize').value;

  var filtered = SME_DATA.filter(function (s) {
    if (q && !s.name.toLowerCase().includes(q) && !s.industry.toLowerCase().includes(q) && !s.location.toLowerCase().includes(q)) return false;
    if (ind && s.industry !== ind) return false;
    if (stage && s.stage !== stage) return false;
    if (loc && s.location !== loc) return false;
    if (size) {
      if (size === 'Under LKR 10M' && s.goal >= 10e6) return false;
      if (size === 'LKR 10M–100M' && (s.goal < 10e6 || s.goal > 100e6)) return false;
      if (size === 'LKR 100M–500M' && (s.goal < 100e6 || s.goal > 500e6)) return false;
      if (size === 'Over LKR 500M' && s.goal <= 500e6) return false;
    }
    return true;
  });
  renderCards(filtered);
}

// ── DETAIL PAGE ──
function openDetail(id) {
  var s = SME_DATA.find(function (x) { return x.id === id; });
  if (!s) return;
  currentSME = s;
  currentCalcData = { goal: s.goal, equity: s.equity };

  document.getElementById('detailName').textContent = s.name;
  document.getElementById('detailTagline').textContent = s.tagline;
  document.getElementById('detailMeta').innerHTML =
    '<span class="meta-pill"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:bottom;margin-right:2px;">location_on</span>' + s.location + '</span>' +
    '<span class="meta-pill"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:bottom;margin-right:2px;">factory</span>' + s.industry + '</span>' +
    '<span class="meta-pill"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:bottom;margin-right:2px;">domain</span>' + (s.stageRaw || s.stage) + '</span>' +
    '<span class="meta-pill"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:bottom;margin-right:2px;">group</span>' + s.employees + ' Employees</span>';

  document.getElementById('detailHero').style.background = 'linear-gradient(135deg, ' + s.color + 'dd, ' + s.color + '88)';

  // Sidebar
  document.getElementById('sdAmount').textContent = fmtLKR(s.goal);
  document.getElementById('sdEquity').textContent = 'for ' + s.equity + '% Equity';
  var pct = s.goal > 0 ? Math.round((s.committed / s.goal) * 100) : 0;
  document.getElementById('sdPct').textContent = pct + '%';
  document.getElementById('sdCommitted').textContent = fmtLKR(s.committed) + ' of ' + fmtLKR(s.goal) + ' committed';
  document.getElementById('sdBar').style.width = pct + '%';
  document.getElementById('sdMeta').innerHTML =
    '<div class="fund-meta-item"><div class="fmi-label">Min Investment</div><div class="fmi-value">' + fmtLKR(s.minInvest) + '</div></div>' +
    '<div class="fund-meta-item"><div class="fmi-label">Deadline</div><div class="fmi-value">' + s.deadline + '</div></div>' +
    '<div class="fund-meta-item"><div class="fmi-label">Est. Year</div><div class="fmi-value">' + (s.yearEstablished || 'N/A') + '</div></div>' +
    '<div class="fund-meta-item"><div class="fmi-label">Valuation</div><div class="fmi-value">' + (s.equity > 0 ? fmtLKR(s.goal / s.equity * 100) : 'N/A') + '</div></div>';

  // Reset calc
  document.getElementById('calcInput').value = '';
  document.getElementById('crEquity').textContent = '—';
  document.getElementById('crOwnership').textContent = '—';
  document.getElementById('crValuation').textContent = '—';

  // Use of funds
  var useOfFunds = s.useOfFunds.map(function (f) {
    return '<div class="fund-item"><span class="fund-item-label">' + f.label + '</span><div class="fund-item-bar-bg"><div class="fund-item-bar" style="width:' + f.pct + '%"></div></div><span class="fund-item-pct">' + f.pct + '%</span></div>';
  }).join('');

  // Documents
  var docsHtml = '';
  if (s.docUrls.pitchDeck) docsHtml += '<div class="doc-item"><div class="doc-item-left"><div class="doc-icon"><span class="material-symbols-outlined" style="font-size:16px;">analytics</span></div><div><div class="doc-name">Pitch Deck</div><div class="doc-type">PDF</div></div></div><a href="' + s.docUrls.pitchDeck + '" target="_blank" class="btn btn-outline btn-sm">Download</a></div>';
  if (s.docUrls.financials) docsHtml += '<div class="doc-item"><div class="doc-item-left"><div class="doc-icon"><span class="material-symbols-outlined" style="font-size:16px;">assignment</span></div><div><div class="doc-name">Financial Statements</div><div class="doc-type">PDF</div></div></div><a href="' + s.docUrls.financials + '" target="_blank" class="btn btn-outline btn-sm">Download</a></div>';
  if (s.docUrls.registration) docsHtml += '<div class="doc-item"><div class="doc-item-left"><div class="doc-icon"><span class="material-symbols-outlined" style="font-size:16px;">workspace_premium</span></div><div><div class="doc-name">Business Registration</div><div class="doc-type">PDF</div></div></div><a href="' + s.docUrls.registration + '" target="_blank" class="btn btn-outline btn-sm">Download</a></div>';
  if (s.docUrls.bankStatement) docsHtml += '<div class="doc-item"><div class="doc-item-left"><div class="doc-icon"><span class="material-symbols-outlined" style="font-size:16px;">account_balance</span></div><div><div class="doc-name">Bank Statement</div><div class="doc-type">PDF</div></div></div><a href="' + s.docUrls.bankStatement + '" target="_blank" class="btn btn-outline btn-sm">Download</a></div>';
  if (!docsHtml) docsHtml = '<p style="color:var(--text-muted);font-size:14px;">No documents uploaded yet.</p>';

  // Tags
  var tagsHtml = s.tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('');

  // Update modal subtitle with campaign info
  document.querySelector('.modal-sub').textContent = 'Express interest in ' + s.name + '. Min investment: ' + fmtLKR(s.minInvest);

  document.getElementById('detailSections').innerHTML =
    '<div class="detail-section"><div class="ds-header"><div class="ds-icon"><span class="material-symbols-outlined" style="font-size:18px;">domain</span></div><h3 class="ds-title">Business Overview</h3></div><div class="ds-body"><p>' + s.description + '</p>' + (s.problem ? '<p><strong style="color:var(--green-700)">Problem & Solution:</strong> ' + s.problem + '</p>' : '') + (s.regNo ? '<p><strong style="color:var(--green-700)">Registration No:</strong> ' + s.regNo + '</p>' : '') + '<div class="tag-list">' + tagsHtml + '</div></div></div>' +

    '<div class="detail-section"><div class="ds-header"><div class="ds-icon"><span class="material-symbols-outlined" style="font-size:18px;">inventory_2</span></div><h3 class="ds-title">Products & Services</h3></div><div class="ds-body"><p>' + (s.products || 'No product details provided.') + '</p></div></div>' +

    '<div class="detail-section"><div class="ds-header"><div class="ds-icon"><span class="material-symbols-outlined" style="font-size:18px;">monetization_on</span></div><h3 class="ds-title">Financials</h3></div><div class="ds-grid"><div class="ds-metric"><div class="ds-metric-label">Annual Revenue</div><div class="ds-metric-value">' + s.revenue + '</div></div><div class="ds-metric"><div class="ds-metric-label">Net Profit</div><div class="ds-metric-value">' + s.profit + '</div></div><div class="ds-metric"><div class="ds-metric-label">Operating Expenses</div><div class="ds-metric-value">' + s.expenses + '</div></div><div class="ds-metric"><div class="ds-metric-label">Team Size</div><div class="ds-metric-value">' + s.employees + ' staff</div></div></div></div>' +

    '<div class="detail-section"><div class="ds-header"><div class="ds-icon"><span class="material-symbols-outlined" style="font-size:18px;">rocket_launch</span></div><h3 class="ds-title">Funding Details</h3></div><div class="ds-grid" style="margin-bottom:1.25rem;"><div class="ds-metric"><div class="ds-metric-label">Funding Goal</div><div class="ds-metric-value">' + fmtLKR(s.goal) + '</div></div><div class="ds-metric"><div class="ds-metric-label">Equity Offered</div><div class="ds-metric-value">' + s.equity + '%</div></div><div class="ds-metric"><div class="ds-metric-label">Min. Investment</div><div class="ds-metric-value">' + fmtLKR(s.minInvest) + '</div></div><div class="ds-metric"><div class="ds-metric-label">Implied Valuation</div><div class="ds-metric-value">' + (s.equity > 0 ? fmtLKR(s.goal / s.equity * 100) : 'N/A') + '</div></div></div><div class="ds-body"><strong style="color:var(--green-700)">Use of Funds:</strong></div><div class="use-of-funds" style="margin-top:12px;">' + useOfFunds + '</div></div>' +

    '<div class="detail-section"><div class="ds-header"><div class="ds-icon"><span class="material-symbols-outlined" style="font-size:18px;">trending_up</span></div><h3 class="ds-title">Growth Strategy</h3></div><div class="ds-body"><p>' + (s.growthPlan || 'No growth plan provided.') + '</p></div></div>' +

    '<div class="detail-section"><div class="ds-header"><div class="ds-icon"><span class="material-symbols-outlined" style="font-size:18px;">attach_file</span></div><h3 class="ds-title">Documents</h3></div><div class="docs-list">' + docsHtml + '</div></div>' +

    '<div class="detail-section"><div class="ds-header"><div class="ds-icon"><span class="material-symbols-outlined" style="font-size:18px;">person</span></div><h3 class="ds-title">Founder</h3></div><div class="founder-card"><div class="founder-avatar">' + s.ownerInitials + '</div><div class="founder-info"><div style="font-size:1.1rem;font-weight:600;color:var(--green-800);">' + s.owner + '</div><div class="founder-role">' + s.ownerRole + '</div><div class="founder-badges"><span class="founder-badge"><span class="material-symbols-outlined" style="font-size:14px;">check</span> Verified</span><span class="founder-badge">🇱🇰 Sri Lankan</span></div></div></div></div>';

  document.getElementById('homePage').style.display = 'none';
  document.getElementById('detailPage').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── EQUITY CALCULATOR ──
function calcEquity() {
  if (!currentCalcData) return;
  var inv = parseFloat(document.getElementById('calcInput').value);
  if (!inv || inv <= 0) {
    document.getElementById('crEquity').textContent = '—';
    document.getElementById('crOwnership').textContent = '—';
    document.getElementById('crValuation').textContent = '—';
    return;
  }
  var goal = currentCalcData.goal;
  var equity = currentCalcData.equity;
  var valuation = goal / (equity / 100);
  var investorEquity = (inv / goal) * equity;
  document.getElementById('crEquity').textContent = investorEquity.toFixed(4) + '%';
  document.getElementById('crOwnership').textContent = investorEquity.toFixed(3) + '% stake';
  document.getElementById('crValuation').textContent = fmtLKR(valuation);
}

// ── NAVIGATION ──
function goHome() {
  document.getElementById('homePage').style.display = 'block';
  document.getElementById('detailPage').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── MODAL ──
async function openModal() {
  if (!currentUser) {
    showToast('⚠️ Please log in or sign up to invest.', true);
    openAuthModal();
    return;
  }
  
  currentCommitment = null;
  document.getElementById('commitAmount').value = '';
  document.getElementById('commitMessage').value = '';
  document.getElementById('commitSubmitBtn').textContent = 'Submit Expression of Interest';
  document.querySelector('#modalOverlay .modal-title').textContent = 'Commit to Invest';

  try {
    const token = await currentUser.getIdToken();
    const response = await fetch(`http://localhost:5000/api/commitments/campaign/${currentSME.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch commitment');
    const data = await response.json();
    
    if (data) {
      currentCommitment = data;
      
      // Clean forced floating point residue for UI clarity
      let cleanAmount = Math.round((data.investmentAmountLkr || 0) * 100) / 100;
      document.getElementById('commitAmount').value = cleanAmount;
      document.getElementById('commitMessage').value = data.message || '';
      document.getElementById('commitSubmitBtn').textContent = 'Update Commitment';
      document.querySelector('#modalOverlay .modal-title').textContent = 'Update Commitment';
    }
  } catch(e) {
    console.error('Error fetching existing commitment', e);
  }

  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ── AUTH MODAL ──
function openAuthModal() {
  document.getElementById('authModalOverlay').classList.add('open');
}
function closeAuthModal() {
  document.getElementById('authModalOverlay').classList.remove('open');
}
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  document.getElementById('authTitle').textContent = isLoginMode ? 'Log In' : 'Sign Up';
  document.getElementById('authSub').textContent = isLoginMode ? 'Welcome back, investor.' : 'Create an investor account to start committing.';
  document.getElementById('authNameGroup').style.display = isLoginMode ? 'none' : 'block';
  document.getElementById('authPhoneGroup').style.display = isLoginMode ? 'none' : 'block';
  document.getElementById('authSubmitBtn').textContent = isLoginMode ? 'Log In' : 'Create Account';
  document.getElementById('authSwitchText').textContent = isLoginMode ? "Don't have an account? " : "Already have an account? ";
  document.getElementById('authSwitchBtn').textContent = isLoginMode ? 'Sign Up' : 'Log In';
}

async function submitAuth() {
  var email = document.getElementById('authEmail').value.trim();
  var password = document.getElementById('authPassword').value;
  var btn = document.getElementById('authSubmitBtn');

  if (!email || !password) {
    showToast('⚠️ Please enter email and password.', true);
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    if (isLoginMode) {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      showToast('✅ Successfully logged in!');
    } else {
      var name = document.getElementById('authName').value.trim();
      var phone = document.getElementById('authPhone').value.trim();
      if (!name || !phone) {
        showToast('⚠️ Please provide your name and phone number.', true);
        btn.disabled = false;
        btn.textContent = 'Create Account';
        return;
      }
      var res = await firebase.auth().createUserWithEmailAndPassword(email, password);
      var token = await res.user.getIdToken();
      await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: name, email: email, phone: phone })
      });
      showToast('✅ Account created successfully!');
    }
    closeAuthModal();
  } catch (error) {
    showToast('⚠️ ' + error.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = isLoginMode ? 'Log In' : 'Create Account';
  }
}

function signOut() {
  firebase.auth().signOut().then(function() {
    showToast('✅ Signed out successfully.');
  });
}

// ── COMMIT TO INVEST — WRITES TO FIRESTORE ──
async function submitCommit() {
  if (!currentUser) return;
  var amount = parseFloat(document.getElementById('commitAmount').value);
  var message = document.getElementById('commitMessage').value.trim();

  if (!amount) {
    showToast('⚠️ Please enter an investment amount.', true);
    return;
  }
  if (!currentSME) {
    showToast('⚠️ No campaign selected.', true);
    return;
  }

  var existingAmount = currentCommitment ? currentCommitment.investmentAmountLkr : 0;
  var delta = amount - existingAmount;
  
  if (delta === 0 && currentCommitment && currentCommitment.message === message) {
    showToast('⚠️ No changes made.', true);
    closeModal();
    return;
  }

  var remaining = (currentSME.goal - currentSME.committed) + existingAmount;

  if (amount > remaining) {
    showToast('⚠️ Cannot exceed goal. Max allowed is ' + fmtLKR(remaining), true);
    return;
  }

  var effectiveMinInvest = Math.min(currentSME.minInvest, remaining);
  if (amount < effectiveMinInvest) {
    showToast('⚠️ Minimum investment is ' + fmtLKR(effectiveMinInvest), true);
    return;
  }

  var submitBtn = document.getElementById('commitSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const token = await currentUser.getIdToken();
    if (currentCommitment) {
      // Update existing
      const res = await fetch(`http://localhost:5000/api/commitments/${currentSME.id}/${currentCommitment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newAmount: amount, message: message, delta: delta })
      });
      if (!res.ok) throw new Error('Update failed');
      showToast('✅ Commitment updated successfully!');
    } else {
      // Create new
      const res = await fetch('http://localhost:5000/api/commitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          message: message,
          campaignId: currentSME.id,
          campaignName: currentSME.name,
          ownerUid: currentSME.ownerUid,
          ownerEmail: currentSME.ownerEmail
        })
      });
      if (!res.ok) throw new Error('Create failed');
      showToast('✅ Your interest has been submitted! The business owner will contact you.');
    }

    if (delta !== 0) {
      // Update local UI state
      currentSME.committed += delta;
      
      // Refresh Detail Page UI
      var pct = currentSME.goal > 0 ? Math.round((currentSME.committed / currentSME.goal) * 100) : 0;
      document.getElementById('sdCommitted').textContent = fmtLKR(currentSME.committed) + ' of ' + fmtLKR(currentSME.goal) + ' committed';
      document.getElementById('sdPct').textContent = pct + '%';
      document.getElementById('sdBar').style.width = pct + '%';

      // Refresh Home Page Cards
      renderCards(SME_DATA);
    }

    closeModal();
    document.getElementById('commitAmount').value = '';
    document.getElementById('commitMessage').value = '';
  } catch (error) {
    console.error('Error submitting commitment:', error);
    showToast('⚠️ Failed to submit. Please try again.', true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = currentCommitment ? 'Update Commitment' : 'Submit Expression of Interest';
  }
}

// ── EVENT LISTENERS ──
document.getElementById('modalOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});
document.getElementById('authModalOverlay')?.addEventListener('click', function (e) {
  if (e.target === this) closeAuthModal();
});

// ── SCROLL ANIMATIONS ──
function initScrollAnimations() {
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  });

  document.querySelectorAll('.animate-on-scroll:not(.is-visible)').forEach(el => {
    scrollObserver.observe(el);
  });
}

// ── INIT: Load campaigns from Firestore ──
loadCampaigns().then(() => {
  initScrollAnimations();
});

// Handle dynamically added content or navigation
const domObserver = new MutationObserver(() => {
  initScrollAnimations();
});
domObserver.observe(document.body, { childList: true, subtree: true });
