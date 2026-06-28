import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TeacherData {
  id: string;
  email: string;
  created_at: string;
  raw_user_meta_data: {
    full_name?: string;
    phone?: string;
    school_name?: string;
    subject?: string;
    role?: string;
  };
}

const ManageUsers: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');
  const [pendingTeachers, setPendingTeachers] = useState<TeacherData[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'pending') fetchPendingTeachers();
    if (tab === 'approved') fetchApprovedTeachers();
  }, [tab]);

  const fetchPendingTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_pending_teachers');
      if (error) throw error;
      setPendingTeachers(data || []);
    } catch (err) {
      console.error('Error fetching pending teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_teachers');
      if (error) throw error;
      setApprovedTeachers(data || []);
    } catch (err) {
      console.error('Error fetching approved teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (teacherId: string) => {
    if (!window.confirm("Approve this user as a teacher?")) return;
    
    setActionLoading(teacherId);
    try {
      const { error } = await supabase.rpc('approve_teacher', { teacher_id: teacherId });
      if (error) throw error;
      
      setPendingTeachers(prev => prev.filter(t => t.id !== teacherId));
      alert("Teacher approved successfully!");
    } catch (err: any) {
      console.error('Error approving teacher:', err);
      alert("Failed to approve: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMakeAdmin = async (teacherId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to promote ${name} to an Admin? They will have full control over the website.`)) return;
    
    setActionLoading(teacherId);
    try {
      const { error } = await supabase.rpc('promote_to_admin', { target_user_id: teacherId });
      if (error) throw error;
      
      setApprovedTeachers(prev => prev.filter(t => t.id !== teacherId));
      alert(`${name} has been promoted to Admin successfully!`);
    } catch (err: any) {
      console.error('Error promoting to admin:', err);
      alert("Failed to promote: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (teacherId: string, name: string) => {
    if (!window.confirm(`Are you SURE you want to completely delete ${name}'s account? This action cannot be undone.`)) return;
    
    setActionLoading(teacherId);
    try {
      const { error } = await supabase.rpc('delete_user', { target_user_id: teacherId });
      if (error) throw error;
      
      setApprovedTeachers(prev => prev.filter(t => t.id !== teacherId));
      setPendingTeachers(prev => prev.filter(t => t.id !== teacherId));
      alert("Account deleted successfully!");
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert("Failed to delete account: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (!user || user.user_metadata?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-red-500">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text dark:text-white">Manage Users</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage teacher accounts and approvals.</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
        <button
          onClick={() => setTab('pending')}
          className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'pending' 
              ? 'bg-white dark:bg-slate-800 text-brand-text dark:text-white shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          ⏳ Pending Requests
        </button>
        <button
          onClick={() => setTab('approved')}
          className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'approved' 
              ? 'bg-white dark:bg-slate-800 text-brand-text dark:text-white shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          ✅ Approved Teachers
        </button>
      </div>

      <div className="card-base p-6">
        <h2 className="text-lg font-bold text-brand-text dark:text-white mb-4">
          {tab === 'pending' ? 'Pending Teacher Requests' : 'Active Teachers'}
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (tab === 'pending' ? pendingTeachers : approvedTeachers).length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              {tab === 'pending' ? 'No pending teacher requests at the moment.' : 'No active teachers found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-sm font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email & Phone</th>
                  <th className="px-4 py-3">School Name</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Registered On</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(tab === 'pending' ? pendingTeachers : approvedTeachers).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-4 font-medium text-brand-text dark:text-white">
                      {t.raw_user_meta_data?.full_name || 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-brand-text dark:text-white">{t.email}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{t.raw_user_meta_data?.phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {t.raw_user_meta_data?.school_name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-brand-primary font-medium text-sm">
                      {t.raw_user_meta_data?.subject || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {tab === 'pending' && (
                          <button
                            onClick={() => handleApprove(t.id)}
                            disabled={actionLoading === t.id}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50 shadow-sm"
                          >
                            {actionLoading === t.id ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                        {tab === 'approved' && (
                          <button
                            onClick={() => handleMakeAdmin(t.id, t.raw_user_meta_data?.full_name || 'this user')}
                            disabled={actionLoading === t.id}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-200 dark:border-indigo-500/20 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                          >
                            {actionLoading === t.id ? 'Processing...' : 'Make Admin'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(t.id, t.raw_user_meta_data?.full_name || 'this user')}
                          disabled={actionLoading === t.id}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white border border-red-200 dark:border-red-500/20 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                        >
                          {actionLoading === t.id ? 'Processing...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
