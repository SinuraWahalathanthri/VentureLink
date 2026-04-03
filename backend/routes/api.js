import express from 'express';
import { db, admin } from '../server.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. GET /api/campaigns (Public) 
router.get('/campaigns', async (req, res) => {
  try {
    const snapshot = await db.collection('campaigns').where('status', '==', 'published').get();
    const campaigns = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Ensure complex nested types like FieldValue or Timestamps are processed if needed
      campaigns.push({ id: doc.id, ...data });
    });
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// 2. POST /api/users
router.post('/users', verifyToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const uid = req.user.uid;

    await db.collection('users').doc(uid).set({
      name,
      email,
      phone,
      role: 'investor',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 3. GET /api/commitments/me (For Dashboard)
router.get('/commitments/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const snapshot = await db.collectionGroup('commitments').where('investorUid', '==', uid).get();
    
    const commitments = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Convert serverTimestamp to string/number if present
      const createdAt = data.createdAt ? data.createdAt.toDate().getTime() : null;
      commitments.push({ id: doc.id, ...data, createdAt });
    });
    res.json(commitments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch commitments' });
  }
});

// 4. GET /api/commitments/campaign/:id
router.get('/commitments/campaign/:id', verifyToken, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const uid = req.user.uid;
    
    const snapshot = await db.collection('campaigns').doc(campaignId).collection('commitments')
      .where('investorUid', '==', uid).limit(1).get();

    if (snapshot.empty) {
      return res.json(null);
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    // Strip timestamps out to return raw numbers cleanly
    res.json({ id: doc.id, ...data, createdAt: null, updatedAt: null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch commitment' });
  }
});

// 5. POST /api/commitments
router.post('/commitments', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { amount, message, campaignId, campaignName, ownerUid, ownerEmail } = req.body;

    const newCommit = {
      investorUid: uid,
      investmentAmountLkr: amount,
      message: message,
      campaignId: campaignId,
      campaignName: campaignName,
      ownerUid: ownerUid,
      ownerEmail: ownerEmail,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('campaigns').doc(campaignId).collection('commitments').add(newCommit);
    
    // Update campaign total
    await db.collection('campaigns').doc(campaignId).update({
      committedLkr: admin.firestore.FieldValue.increment(amount)
    });

    res.status(201).json({ message: 'Commitment created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create commitment', details: error.message });
  }
});

// 6. PUT /api/commitments/:campaignId/:commitmentId
router.put('/commitments/:campaignId/:commitmentId', verifyToken, async (req, res) => {
  try {
    const { campaignId, commitmentId } = req.params;
    const { newAmount, message, delta } = req.body;

    await db.collection('campaigns').doc(campaignId).collection('commitments').doc(commitmentId).update({
      investmentAmountLkr: newAmount,
      message: message,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (delta !== 0) {
      await db.collection('campaigns').doc(campaignId).update({
        committedLkr: admin.firestore.FieldValue.increment(delta)
      });
    }

    res.json({ message: 'Commitment updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update commitment' });
  }
});

// 7. DELETE /api/commitments/:campaignId/:commitmentId
router.delete('/commitments/:campaignId/:commitmentId', verifyToken, async (req, res) => {
  try {
    const { campaignId, commitmentId } = req.params;

    // Read it first to avoid trusting client delta for deletion
    const commitDoc = await db.collection('campaigns').doc(campaignId).collection('commitments').doc(commitmentId).get();
    if (!commitDoc.exists) {
      return res.status(404).json({ error: 'Not found' });
    }
    const data = commitDoc.data();
    
    // Make sure the authenticated user owns this commitment. 
    if (data.investorUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const amountToDecrement = data.investmentAmountLkr || 0;

    await db.collection('campaigns').doc(campaignId).collection('commitments').doc(commitmentId).delete();

    await db.collection('campaigns').doc(campaignId).update({
      committedLkr: admin.firestore.FieldValue.increment(-amountToDecrement)
    });

    res.json({ message: 'Commitment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete commitment' });
  }
});

export default router;
