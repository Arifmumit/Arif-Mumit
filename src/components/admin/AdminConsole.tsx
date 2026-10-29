import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  Search,
  Lock,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronDown,
  Layers,
  Crown
} from 'lucide-react';
import { useAuth, UserProfile, UserRole } from '../../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface AdminConsoleProps {
  onClose: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onClose }) => {
  const { userProfile, isSuperAdmin, isAdmin, updateUserRole, deleteUserAccount } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  // Load all user profiles
  useEffect(() => {
    setLoading(true);
    // Fetch users via direct queries
    const loadUsers = async () => {
      try {
        // Query users collection
        const snap = await getDocs(collection(db, 'admins'));
        // In this implementation, let's also listen to the admins directory and public profiles
        // We can subscribe or fetch public profile docs
        const usersList: UserProfile[] = [];
        
        // Also ensure current user and any registered users are listed
        if (userProfile) {
          usersList.push(userProfile);
        }

        // Fetch known admin index entries
        snap.forEach((d) => {
          const data = d.data();
          if (!usersList.some((u) => u.uid === data.uid)) {
            usersList.push({
              uid: data.uid,
              email: data.email || 'Admin User',
              displayName: data.email?.split('@')[0] || 'Admin',
              photoURL: '',
              role: data.role || 'admin',
              isSuperAdmin: !!data.isSuperAdmin,
              emailVerified: true,
              createdAt: data.grantedAt || new Date().toISOString(),
              updatedAt: data.grantedAt || new Date().toISOString()
            });
          }
        });

        setUsers(usersList);
      } catch (err) {
        console.warn('Could not list users from Firestore, using current context:', err);
        if (userProfile) setUsers([userProfile]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [userProfile]);

  const handleRoleChange = async (targetUser: UserProfile, newRole: UserRole) => {
    setActionError(null);
    setActionSuccess(null);
    setProcessingUid(targetUser.uid);

    try {
      if (targetUser.isSuperAdmin && targetUser.uid !== userProfile?.uid) {
        throw new Error('Super Admin is immutable and cannot be demoted or changed!');
      }

      await updateUserRole(targetUser.uid, newRole);
      setActionSuccess(`Successfully updated ${targetUser.email} role to ${newRole.toUpperCase()}.`);
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === targetUser.uid
            ? { ...u, role: newRole, isSuperAdmin: newRole === 'super_admin' }
            : u
        )
      );
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user role.');
    } finally {
      setProcessingUid(null);
    }
  };

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (targetUser.isSuperAdmin) {
      setActionError('CRITICAL: Super Admin CANNOT be deleted by anyone!');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove user ${targetUser.email}?`)) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setProcessingUid(targetUser.uid);

    try {
      await deleteUserAccount(targetUser.uid);
      setActionSuccess(`User ${targetUser.email} removed from the system.`);
      setUsers((prev) => prev.filter((u) => u.uid !== targetUser.uid));
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete user.');
    } finally {
      setProcessingUid(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin & Access Control Panel</h2>
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase tracking-wider">
                    Super Admin Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Super Admin has immutable status and controls all Admins, Editors, and Users.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Close Panel
          </button>
        </div>

        {/* Action Alerts */}
        {actionError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Protected Super Admin Notice */}
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">
              Permanent Super Admin Security Guarantee:
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              The Super Admin (<span className="font-mono font-semibold">arifmumit1987@gmail.com</span>) cannot be deleted, demoted, or altered by any user or other admin. The Super Admin possesses sovereign authority to control other Admins, assign role permissions, and govern platform security.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-medium text-slate-500">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">User & Email</th>
                <th className="px-4 py-3">Role Status</th>
                <th className="px-4 py-3">Email Verified</th>
                <th className="px-4 py-3 text-right">Role Controls & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserSuperAdmin = u.isSuperAdmin || u.role === 'super_admin';
                  const isProcessing = processingUid === u.uid;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                            {u.displayName[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                              <span>{u.displayName}</span>
                              {isUserSuperAdmin && (
                                <span title="Super Admin">
                                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isUserSuperAdmin
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : u.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : u.role === 'editor'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {isUserSuperAdmin ? 'Super Admin' : u.role.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {u.emailVerified ? (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-500 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Unverified</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Role selector */}
                          {isUserSuperAdmin ? (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Immutable Super Admin</span>
                            </span>
                          ) : (
                            <>
                              <select
                                disabled={isProcessing || !isAdmin}
                                value={u.role}
                                onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer disabled:opacity-50"
                              >
                                {isSuperAdmin && <option value="admin">Promote to Admin</option>}
                                <option value="editor">Editor</option>
                                <option value="user">User</option>
                              </select>

                              {/* Delete button (Strictly disabled for super admin) */}
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={isProcessing || isUserSuperAdmin}
                                className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-30"
                                title={isUserSuperAdmin ? "Super Admin cannot be deleted" : "Delete user"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
