// Firebase initialization for Snow Sense
// 1. Go to Firebase Console → Project Settings → Web App
// 2. Copy your config object and replace the placeholder values below.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDZ4DA5zsoAX80FSNsOliup0lV6x4hWgts',
  authDomain: 'snowsense-57c5e.firebaseapp.com',
  projectId: 'snowsense-57c5e',
  storageBucket: 'snowsense-57c5e.firebasestorage.app',
  messagingSenderId: '517363917994',
  appId: '1:517363917994:web:6bba05a7376a44cfcc5cd3',
  measurementId: 'G-HJSEW1F8JR',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
