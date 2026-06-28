import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface NoteRequest {
  id: string;
  requested_title: string;
  class_name: string;
  subject: string;
  description: string;
  status: 'pending' | 'fulfilled' | 'closed';
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

const ManageNoteRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.user_metadata?.role === 'admin';

  const [requests, setRequests] = useState<NoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled' | 'closed'>('pending');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchRequests();
  }, [isAdmin, filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('note_requests')
        .select(`
          *,
          user:users(name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        q = q.eq('status', filter);
      }

      const { data, error } = await q;
      if (error) throw error;
      setRequests(data as any[]);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: 'pending' | 'fulfilled' | 'closed') => {
    try {
      const { error } = await supabase
        .from('note_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update request status.');
    }
  };

  const deleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this request?')) return;
    try {
      const { error } = await supabase
        .from('note_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete request', err);
      alert('Failed to delete request.');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'fulfilled': return <span className="px-3 py-1 bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30 rounded-full text-xs font-medium">Fulfilled</span>;
      case 'closed': return <span className="px-3 py-1 bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30 rounded-full text-xs font-medium">Closed</span>;
      default: return <span className="px-3 py-1 bg-amber-50 dark:bg-yellow-500/20 text-amber-700 dark:text-yellow-400 border border-amber-200 dark:border-yellow-500/30 rounded-full text-xs font-medium">Pending</span>;
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 transition-colors duration-300 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-text dark:text-white">Manage Note Requests</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Review what students are searching for but cannot find.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/missing-resources" className="px-4 py-2 bg-brand-primary hover:bg-brand-navy text-white rounded-xl text-sm font-medium transition-all shadow-md">
              View Analytics
            </Link>
            <Link to="/dashboard" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-brand-text dark:text-white rounded-xl text-sm font-medium transition-all">
              Dashboard
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['pending', 'fulfilled', 'closed', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all shadow-sm ${
                filter === f 
                  ? 'bg-brand-primary text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-text dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="card-base p-14 text-center">
            <div className="text-5xl mb-4">👍</div>
            <h3 className="text-xl font-bold text-brand-text dark:text-white mb-2">No {filter !== 'all' ? filter : ''} requests</h3>
            <p className="text-slate-500 dark:text-slate-400">Everything looks good here.</p>
          </div>
        ) : (
          <div className="card-base overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-sm font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Request Details</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Requested On</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-text dark:text-white mb-1">{req.requested_title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{req.subject} · {req.class_name}</div>
                        {req.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{req.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-brand-text dark:text-white">{req.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{req.user?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                        {new Date(req.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {statusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {req.status !== 'fulfilled' && (
                            <button
                              onClick={() => updateStatus(req.id, 'fulfilled')}
                              className="px-3 py-1.5 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-lg transition-all border border-green-200 dark:border-transparent"
                              title="Mark as fulfilled (meaning the note has been uploaded)"
                            >
                              Fulfill
                            </button>
                          )}
                          {req.status !== 'closed' && (
                            <button
                              onClick={() => updateStatus(req.id, 'closed')}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-500/20 hover:bg-slate-200 dark:hover:bg-slate-500/40 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-all"
                              title="Close request without fulfilling"
                            >
                              Close
                            </button>
                          )}
                          {req.status !== 'pending' && (
                            <button
                              onClick={() => updateStatus(req.id, 'pending')}
                              className="px-3 py-1.5 bg-amber-50 dark:bg-yellow-500/20 hover:bg-amber-100 dark:hover:bg-yellow-500/40 text-amber-700 dark:text-yellow-400 text-xs font-medium rounded-lg transition-all border border-amber-200 dark:border-transparent"
                            >
                              Reopen
                            </button>
                          )}
                          <button
                            onClick={() => deleteRequest(req.id)}
                            className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 dark:hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white text-xs font-medium rounded-lg transition-all border border-red-200 dark:border-transparent"
                            title="Permanently delete this request"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageNoteRequests;
