import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase Web configuration is public client configuration, not a server credential.
export const firebaseApp = initializeApp({
  apiKey: 'AIzaSyBmZlj6C7AY2jjhh8Kn7vq2sm47eFfwVQI',
  authDomain: 'lucenas1010.firebaseapp.com',
  projectId: 'lucenas1010',
  storageBucket: 'lucenas1010.firebasestorage.app',
  messagingSenderId: '34227299090',
  appId: '1:34227299090:web:714bba5b82a38ad0d8c9cb',
});

export const firebaseAuth = getAuth(firebaseApp);
