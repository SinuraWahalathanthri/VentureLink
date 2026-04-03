import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin
try {
  // NOTE: Set the GOOGLE_APPLICATION_CREDENTIALS environment variable 
  // to the path of your Firebase service account JSON file.
  // Or manually provide the object here:
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
  console.log('Firebase Admin Initialized Successfully');
} catch (error) {
  console.log('Error initializing Firebase Admin. Please ensure you have GOOGLE_APPLICATION_CREDENTIALS in .env mapped correctly.', error);
}

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
import apiRoutes from './routes/api.js';
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

export { db, admin };
