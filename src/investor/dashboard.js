// ── FIREBASE INITIALIZATION ──
const db = window.db || firebase.firestore();

// ── AUTH CHECK ──
let currentUser = null;
let globalCommits = [];

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    currentUser = user;
    loadDashboard();
  } else {
    window.location.href = '../../index.html';
  }
});

document.getElementById('btnSignOut').addEventListener('click', function () {
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

      // Ensure amount is treated as double
      let amount = Number(parseFloat(d.investmentAmountLkr || 0).toFixed(2));

      globalCommits.push({ id: doc.id, ref: doc.ref, ...d, investmentAmountLkr: amount });
      totalCommitted += amount;
    });

    // Sort by date
    globalCommits.sort((a, b) => {
      let da = a.createdAt ? a.createdAt.toMillis() : 0;
      let dbb = b.createdAt ? b.createdAt.toMillis() : 0;
      return dbb - da;
    });

    tbody.innerHTML = globalCommits.map(c => {
      let dateStr = c.createdAt ? new Date(c.createdAt.toMillis()).toLocaleDateString() : 'Pending';
      let statusColor = c.status === 'accepted' ? 'var(--green-600)' : (c.status === 'rejected' ? '#B91C1C' : 'var(--amber-400)');
      let statusStr = c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Pending';
      let amountStr = 'LKR ' + Number(c.investmentAmountLkr).toLocaleString();

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
              <button onclick="openEditModal('${c.id}')" class="btn btn-outline btn-sm">Edit</button>
              <button onclick="openDeleteModal('${c.id}')" class="btn btn-primary btn-sm" style="background:#B91C1C;">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    totalValEl.textContent = 'LKR ' + totalCommitted.toLocaleString();

  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// ── EDIT & DELETE LOGIC ──
let currentDashCommitment = null;

window.openEditModal = function (id) {
  let commit = globalCommits.find(c => c.id === id);
  if (!commit) return;
  currentDashCommitment = commit;

  document.getElementById('editAmount').value = commit.investmentAmountLkr;
  document.getElementById('editMessage').value = commit.message || '';
  document.getElementById('dashModalOverlay').style.display = 'flex';
}

window.openDeleteModal = function (id) {
  let commit = globalCommits.find(c => c.id === id);
  if (!commit) return;
  currentDashCommitment = commit;
  document.getElementById('dashModalOverlay').style.display = 'flex';
}

window.closeDashModal = function () {
  document.getElementById('dashModalOverlay').style.display = 'none';
}

// ── SAVE EDIT ──
document.getElementById('btnSaveEdit').addEventListener('click', async function () {
  if (!currentDashCommitment) return;

  let newAmount = parseFloat(document.getElementById('editAmount').value);
  let newMessage = document.getElementById('editMessage').value.trim();

  if (!newAmount || newAmount <= 0) {
    showToast("Invalid amount", true);
    return;
  }

  // FORCE DOUBLE
  newAmount = Number(newAmount.toFixed(2));

  let oldAmount = Number(parseFloat(currentDashCommitment.investmentAmountLkr || 0).toFixed(2));
  let delta = newAmount - oldAmount;

  try {
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
    showToast('Commitment updated');

  } catch (error) {
    console.error(error);
  }
});

// ── DELETE ──
document.getElementById('btnConfirmDelete').addEventListener('click', async function () {
  if (!currentDashCommitment) return;

  let oldAmount = Number(parseFloat(currentDashCommitment.investmentAmountLkr || 0).toFixed(2));

  try {
    await currentDashCommitment.ref.delete();

    await currentDashCommitment.ref.parent.parent.update({
      committedLkr: firebase.firestore.FieldValue.increment(-oldAmount)
    });

    closeDashModal();
    loadDashboard();
    showToast('Commitment deleted');

  } catch (error) {
    console.error(error);
  }
});

// ── UI HELPERS ──
function showToast(message, isError = false) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = isError ? '#B91C1C' : 'green';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}