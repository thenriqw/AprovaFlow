const fs = require('fs');

let content = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const target = `import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// No extra scopes added here. Integration scopes will be requested incrementally when needed.

let isSigningIn = false;

export const initAuth = (
  onAuthChange?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (onAuthChange) {
      onAuthChange(user);
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    return { user: result.user };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  await auth.signOut();
};`;

const replacement = `import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/classroom.addons.student');
provider.addScope('https://www.googleapis.com/auth/classroom.addons.teacher');
provider.addScope('https://www.googleapis.com/auth/classroom.announcements');
provider.addScope('https://www.googleapis.com/auth/classroom.announcements.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.courses');
provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.courseworkmaterials');
provider.addScope('https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.guardianlinks.me.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.guardianlinks.students');
provider.addScope('https://www.googleapis.com/auth/classroom.guardianlinks.students.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.profile.emails');
provider.addScope('https://www.googleapis.com/auth/classroom.profile.photos');
provider.addScope('https://www.googleapis.com/auth/classroom.push-notifications');
provider.addScope('https://www.googleapis.com/auth/classroom.rosters');
provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.student-submissions.me.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.student-submissions.students.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.topics');
provider.addScope('https://www.googleapis.com/auth/classroom.topics.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthChange?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      cachedAccessToken = null;
    }
    if (onAuthChange) {
      onAuthChange(user);
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken?: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken || undefined };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};`;

content = content.replace(target.replace(/\r\n/g, '\n'), replacement.replace(/\r\n/g, '\n'));

fs.writeFileSync('src/lib/firebase.ts', content);
