import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trash2, Users, Search, AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const ManageUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Alert/Confirm modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load user directory:', err.message);
      setErrorMsg('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const confirmDelete = (usr) => {
    setUserToDelete(usr);
    setShowConfirm(true);
  };

  const handleDeleteSubmit = async () => {
    if (!userToDelete) return;
    setErrorMsg('');
    setSuccessMsg('');
    setShowConfirm(false);

    try {
      await API.delete(`/admin/users/${userToDelete._id}`);
      setSuccessMsg(`User "${userToDelete.name}" deleted successfully.`);
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      setUserToDelete(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/25';
      case 'recruiter':
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/25';
      default:
        return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/25';
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-450 hover:text-indigo-550 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-500" />
            <span>Manage User Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Review active student, recruiter, and administrative account logs</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
          <input
            type="text"
            placeholder="Search name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-805 dark:text-slate-100"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-650 text-xs font-bold">
          {successMsg}
        </div>
      )}

      {/* Users grid list */}
      <GlassCard className="overflow-hidden p-0" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800/40 text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">User Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Security Role</th>
                <th className="px-6 py-4">Registered Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-450 font-bold">
                    No users found matching query
                  </td>
                </tr>
              ) : (
                filteredUsers.map((usr) => (
                  <tr key={usr._id} className="hover:bg-slate-100/20 dark:hover:bg-slate-800/10 transition">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{usr.name}</td>
                    <td className="px-6 py-4 font-mono text-[11px]">{usr.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wide ${getRoleBadge(usr.role)}`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(usr.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {usr._id === user._id ? (
                        <span className="text-[10px] text-slate-400 font-semibold italic">Current Admin</span>
                      ) : (
                        <button
                          onClick={() => confirmDelete(usr)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition border border-rose-500/15"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Confirm Deletion Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md p-6 shadow-2xl space-y-4 relative border border-rose-500/20" hover={false}>
            <div className="flex items-center gap-3 text-rose-500">
              <ShieldAlert className="w-8 h-8 shrink-0 animate-bounce" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Confirm Account Deletion</h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete the account for <strong className="text-slate-800 dark:text-slate-200">{userToDelete?.name}</strong> (<code className="font-mono text-[10px] text-rose-505 bg-rose-500/5 px-1 py-0.5 rounded">{userToDelete?.email}</code>)?
            </p>
            
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-505 dark:text-amber-400 text-[11px] leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> This will permanently delete this user, along with all associated resume scores, applications, notifications, and company profile records. This action cannot be undone.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 font-bold text-xs hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-650 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-[0.98] transition"
              >
                Delete Account
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
