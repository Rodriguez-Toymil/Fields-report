import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBCdPD4PUMKvpEdmEaSZG3X2omvvc0LUs0",
  authDomain: "field-visit-reports-219ab.firebaseapp.com",
  projectId: "field-visit-reports-219ab",
  storageBucket: "field-visit-reports-219ab.firebasestorage.app",
  messagingSenderId: "208266158174",
  appId: "1:208266158174:web:9901b4589ff450f8cdd4cf"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
