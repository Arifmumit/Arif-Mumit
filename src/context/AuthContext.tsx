import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  googleProvider,
  facebookProvider,
  twitterProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType,
  User
} from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  isSuperAdmin: boolean;
  emailVerified: boolean;
  disabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithTwitter: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (targetUid: string, newRole: UserRole) => Promise<void>;
  deleteUserAccount: (targetUid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'arifmumit1987@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile when user changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const isBootstrapSuper = user.email?.toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL.toLowerCase();
        const profileRef = doc(db, 'users', user.uid, 'public', 'profile');
        const adminRef = doc(db, 'admins', user.uid);

        try {
          const profileSnap = await getDoc(profileRef);
          if (!profileSnap.exists()) {
            const initialRole: UserRole = isBootstrapSuper ? 'super_admin' : 'user';
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              photoURL: user.photoURL || '',
              role: initialRole,
              isSuperAdmin: isBootstrapSuper,
              emailVerified: user.emailVerified,
              disabled: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            await setDoc(profileRef, newProfile);

            if (isBootstrapSuper) {
              await setDoc(adminRef, {
                uid: user.uid,
                email: user.email || '',
                role: 'super_admin',
                isSuperAdmin: true,
                grantedBy: 'system_bootstrap',
                grantedAt: new Date().toISOString()
              });
            }

            setUserProfile(newProfile);
          } else {
            const data = profileSnap.data() as UserProfile;
            // Always ensure bootstrap email has super_admin role
            if (isBootstrapSuper && (!data.isSuperAdmin || data.role !== 'super_admin')) {
              await updateDoc(profileRef, {
                role: 'super_admin',
                isSuperAdmin: true,
                updatedAt: new Date().toISOString()
              });
              await setDoc(adminRef, {
                uid: user.uid,
                email: user.email || '',
                role: 'super_admin',
                isSuperAdmin: true,
                grantedBy: 'system_bootstrap',
                grantedAt: new Date().toISOString()
              });
              data.role = 'super_admin';
              data.isSuperAdmin = true;
            }
            // Update emailVerified status if changed
            if (user.emailVerified !== data.emailVerified) {
              await updateDoc(profileRef, { emailVerified: user.emailVerified });
              data.emailVerified = user.emailVerified;
            }
            setUserProfile(data);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/public/profile`);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      throw err;
    }
  };

  const loginWithFacebook = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (err: any) {
      console.error('Facebook Sign In Error:', err);
      // Give clear guidance if provider is not configured in Firebase Console
      if (err.code === 'auth/operation-not-allowed') {
        throw new Error('Facebook Login is not enabled in Firebase Authentication console yet.');
      }
      throw err;
    }
  };

  const loginWithTwitter = async () => {
    try {
      await signInWithPopup(auth, twitterProvider);
    } catch (err: any) {
      console.error('Twitter/X Sign In Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        throw new Error('X (Twitter) Login is not enabled in Firebase Authentication console yet.');
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await sendEmailVerification(cred.user);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Super Admin / Admin control: Update User Role
  const updateUserRole = async (targetUid: string, newRole: UserRole) => {
    if (!userProfile) throw new Error('Unauthorized');
    const targetProfileRef = doc(db, 'users', targetUid, 'public', 'profile');
    const targetAdminRef = doc(db, 'admins', targetUid);

    const targetSnap = await getDoc(targetProfileRef);
    if (!targetSnap.exists()) throw new Error('Target user does not exist');
    const targetData = targetSnap.data() as UserProfile;

    // IMMUTABLE SUPER ADMIN PROTECTION: Nobody can demote or alter the Super Admin!
    if (targetData.isSuperAdmin && targetUid !== userProfile.uid) {
      throw new Error('Super Admin is protected and cannot be modified by anyone!');
    }

    if (!userProfile.isSuperAdmin && userProfile.role !== 'admin') {
      throw new Error('Insufficient permissions.');
    }

    // Only Super Admin can grant or revoke the admin role
    if ((newRole === 'admin' || targetData.role === 'admin') && !userProfile.isSuperAdmin) {
      throw new Error('Only Super Admin can control or assign Admin roles.');
    }

    try {
      await updateDoc(targetProfileRef, {
        role: newRole,
        isSuperAdmin: newRole === 'super_admin',
        updatedAt: new Date().toISOString()
      });

      if (newRole === 'admin' || newRole === 'super_admin') {
        await setDoc(targetAdminRef, {
          uid: targetUid,
          email: targetData.email,
          role: newRole,
          isSuperAdmin: newRole === 'super_admin',
          grantedBy: userProfile.uid,
          grantedAt: new Date().toISOString()
        });
      } else {
        // If demoted from admin/super_admin, remove from admins index
        try {
          await deleteDoc(targetAdminRef);
        } catch {
          // Ignore if doc did not exist
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}/public/profile`);
    }
  };

  // Super Admin / Admin control: Delete user account record
  const deleteUserAccount = async (targetUid: string) => {
    if (!userProfile) throw new Error('Unauthorized');
    const targetProfileRef = doc(db, 'users', targetUid, 'public', 'profile');
    const targetAdminRef = doc(db, 'admins', targetUid);

    const targetSnap = await getDoc(targetProfileRef);
    if (!targetSnap.exists()) return;
    const targetData = targetSnap.data() as UserProfile;

    // IMMUTABLE SUPER ADMIN PROTECTION: Nobody can delete Super Admin!
    if (targetData.isSuperAdmin) {
      throw new Error('SUPER ADMIN CANNOT BE DELETED BY ANYONE!');
    }

    // Only Super Admin or Admin can delete users, and only Super Admin can delete an Admin
    if (targetData.role === 'admin' && !userProfile.isSuperAdmin) {
      throw new Error('Only Super Admin can delete another Admin.');
    }

    try {
      await deleteDoc(targetProfileRef);
      try {
        await deleteDoc(targetAdminRef);
      } catch {}
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${targetUid}/public/profile`);
    }
  };

  const isSuperAdmin = !!userProfile?.isSuperAdmin || userProfile?.role === 'super_admin';
  const isAdmin = isSuperAdmin || userProfile?.role === 'admin';
  const isEditor = isAdmin || userProfile?.role === 'editor';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isSuperAdmin,
        isAdmin,
        isEditor,
        loginWithGoogle,
        loginWithFacebook,
        loginWithTwitter,
        signUpWithEmail,
        loginWithEmail,
        resendVerificationEmail,
        logout,
        updateUserRole,
        deleteUserAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
