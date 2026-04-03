// ── FIREBASE INITIALIZATION ──
// Deferring to initialized state passed from root document environment variables
const db = window.db || firebase.firestore();

// ── AUTH CHECK ──
let currentUser = null;
let globalCommits = [];

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    loadDashboard();
  } else {
    // Redirect to home page if not logged in
    window.location.href = '../../index.html';
  }
});

document.getElementById('btnSignOut').addEventListener('click', function() {
  firebase.auth().signOut();
});

// ── LOAD DASHBOARD ──
async function loadDashboard() {
  var tbody = document.getElementById('commitmentsTable');
  var totalValEl = document.getElementById('totalVal');
  let totalCommitted = 0;

  try {
    var snapshot = await db.collectionGroup('commitments')
                           .where('investorUid', '==', currentUser.uid)
                           .get();

    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted);">You haven\'t made any commitments yet.</td></tr>';
      return;
    }

    globalCommits = [];
    snapshot.forEach(doc => {
      let d = doc.data();
      globalCommits.push({ id: doc.id, ref: doc.ref, ...d });
      totalCommitted += d.investmentAmountLkr || 0;
    });

    // Sort by date manually (if composite index is not set in Firebase)
    globalCommits.sort((a, b) => {
      let da = a.createdAt ? a.createdAt.toMillis() : 0;
      let db = b.createdAt ? b.createdAt.toMillis() : 0;
      return db - da; 
    });

    tbody.innerHTML = globalCommits.map(c => {
      let dateStr = c.createdAt ? new Date(c.createdAt.toMillis()).toLocaleDateString() : 'Pending';
      let statusColor = c.status === 'accepted' ? 'var(--green-600)' : (c.status === 'rejected' ? '#B91C1C' : 'var(--amber-400)');
      let statusStr = c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Pending';
      let amountStr = 'LKR ' + (c.investmentAmountLkr || 0).toLocaleString();

      return `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 16px 20px;">
            <div style="font-weight: 500; color: var(--green-800);">${c.campaignName || 'Unknown Campaign'}</div>
          </td>
          <td style="padding: 16px 20px; font-weight: 600;">${amountStr}</td>
          <td style="padding: 16px 20px;">
            <span style="display:inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; background: ${statusColor}15; color: ${statusColor}; font-weight: 600; border: 1px solid ${statusColor}40;">
              ${statusStr}
            </span>
          </td>
          <td style="padding: 16px 20px; color: var(--text-muted); font-size: 14px;">${dateStr}</td>
          <td style="padding: 16px 20px;">
            <div style="display:flex;gap:6px;">
              <button onclick="openEditModal('${c.id}')" class="btn btn-outline btn-sm" style="font-size:12px; padding: 4px 10px;">Edit</button>
              <button onclick="openDeleteModal('${c.id}')" class="btn btn-primary btn-sm" style="font-size:12px; padding: 4px 10px; background:#B91C1C; border-color:#B91C1C;">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Format total nicely
    totalValEl.textContent = 'LKR ' + totalCommitted.toLocaleString();

  } catch (error) {
    console.error("Error loading dashboard data:", error);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#B91C1C;">Failed to load data. Please refresh or check connection.</td></tr>';
  }
}

// ── EDIT & DELETE LOGIC ──
let currentDashCommitment = null;

window.openEditModal = function(id) {
  let commit = globalCommits.find(c => c.id === id);
  if (!commit) return;
  currentDashCommitment = commit;
  
  document.getElementById('dashModalTitle').textContent = 'Edit Commitment';
  document.getElementById('dashModalSub').textContent = 'Update your investment details for ' + (commit.campaignName || 'this campaign') + '.';
  document.getElementById('editForm').style.display = 'block';
  document.getElementById('deleteForm').style.display = 'none';
  
  // Strip any forced Double floating padding for the frontend input display
  let cleanAmount = Math.round(commit.investmentAmountLkr * 100) / 100;
  document.getElementById('editAmount').value = cleanAmount;
  document.getElementById('editMessage').value = commit.message || '';
  
  document.getElementById('dashModalOverlay').style.display = 'flex';
}

window.openDeleteModal = function(id) {
  let commit = globalCommits.find(c => c.id === id);
  if (!commit) return;
  currentDashCommitment = commit;
  
  document.getElementById('dashModalTitle').textContent = 'Retract Commitment';
  document.getElementById('dashModalSub').textContent = 'Cancel your investment in ' + (commit.campaignName || 'this campaign') + '.';
  document.getElementById('editForm').style.display = 'none';
  document.getElementById('deleteForm').style.display = 'block';
  
  document.getElementById('dashModalOverlay').style.display = 'flex';
}

window.closeDashModal = function() {
  document.getElementById('dashModalOverlay').style.display = 'none';
}

document.getElementById('btnSaveEdit').addEventListener('click', async function() {
  if (!currentDashCommitment) return;
  let newAmount = parseFloat(document.getElementById('editAmount').value);
  if (Number.isInteger(newAmount)) {
    newAmount += 0.00000001; // Forces Firestore JS SDK to store as Double instead of Integer
  }
  let newMessage = document.getElementById('editMessage').value.trim();
  
  if (!newAmount || newAmount <= 0) {
    showToast("⚠️ Please enter a valid amount.", true);
    return;
  }
  
  let oldAmount = currentDashCommitment.investmentAmountLkr || 0;
  let delta = newAmount - oldAmount;
  let btn = this;
  btn.disabled = true;
  btn.textContent = 'Saving...';
  
  try {
    let campSnap = await db.collection('campaigns').doc(currentDashCommitment.campaignId).get();
    if (campSnap.exists) {
      let camp = campSnap.data();
      let remaining = (camp.fundingGoalLkr - camp.committedLkr) + oldAmount;
      
      if (newAmount > remaining) {
        showToast("⚠️ Cannot exceed goal. Max allowed is LKR " + remaining.toLocaleString(), true);
        btn.disabled = false;
        btn.textContent = 'Save Changes';
        return;
      }
      
      let effectiveMin = Math.min(camp.minInvestmentLkr || 0, remaining);
      if (newAmount < effectiveMin) {
        showToast("⚠️ Minimum investment is LKR " + effectiveMin.toLocaleString(), true);
        btn.disabled = false;
        btn.textContent = 'Save Changes';
        return;
      }
    }

    await currentDashCommitment.ref.update({
      investmentAmountLkr: newAmount,
      message: newMessage,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    if (delta !== 0) {
      await currentDashCommitment.ref.parent.parent.update({
        committedLkr: firebase.firestore.FieldValue.increment(delta)
      });
    }
    
    closeDashModal();
    loadDashboard();
    showToast('✅ Commitment updated successfully!');
  } catch (error) {
    console.error(error);
    showToast("❌ Failed to update. Please try again.", true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
});

document.getElementById('btnConfirmDelete').addEventListener('click', async function() {
  if (!currentDashCommitment) return;
  
  let oldAmount = currentDashCommitment.investmentAmountLkr || 0;
  let btn = this;
  btn.disabled = true;
  btn.textContent = 'Deleting...';
  
  try {
    await currentDashCommitment.ref.delete();
    
    await currentDashCommitment.ref.parent.parent.update({
      committedLkr: firebase.firestore.FieldValue.increment(-oldAmount)
    });
    
    closeDashModal();
    loadDashboard();
    showToast('✅ Commitment successfully retracted.');
  } catch (error) {
    console.error(error);
    showToast("❌ Failed to delete. Please try again.", true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
});

// ── UI HELPERS ──
function showToast(message, isError = false) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = isError ? '#B91C1C' : 'var(--green-800)';
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
