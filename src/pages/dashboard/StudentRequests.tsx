import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NoteRequest {
  id: string;
  requested_title: string;
  class_name: string;
  subject: string;
  description: string;
  status: 'pending' | 'fulfilled' | 'closed';
  created_at: string;
}

const StudentRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<NoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('note_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If not admin, only fetch their own requests
      if (!isAdmin) {
        query = query.eq('requested_by', user!.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const markFulfilled = async (id: string) => {
    const { error } = await supabase
      .from('note_requests')
      .update({ status: 'fulfilled' })
      .eq('id', id);
    if (!error) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'fulfilled' } : r));
    }
  };

  const deleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this request?')) return;
    const { error } = await supabase
      .from('note_requests')
      .delete()
      .eq('id', id);
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== id));
    } else {
      alert('Failed to delete request: ' + error.message);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'fulfilled': return <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">Fulfilled</span>;
      case 'closed': return <span className="px-3 py-1 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-full text-xs font-medium">Closed</span>;
      default: return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium">Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{isAdmin ? 'All Student Requests' : 'My Requests'}</h1>
            <p className="text-slate-400 mt-1">
              {isAdmin ? 'Manage and fulfill missing study materials requested by students.' : 'Track the status of the study materials you requested.'}
            </p>
          </div>
          <div className="flex gap-3">
            {!isAdmin && (
              <Link to="/notes" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
                Request New Note
              </Link>
            )}
            <Link to="/dashboard" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all">
              Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-14 text-center">
            <div className="text-5xl mb-4">📬</div>
            <h3 className="text-xl font-bold text-white mb-2">No requests yet</h3>
            <p className="text-slate-400 mb-6">There are currently no missing material requests.</p>
            {!isAdmin && (
              <Link to="/notes" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all">
                Browse Notes
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-sm font-semibold text-slate-300 border-b border-white/10">
                    <th className="px-6 py-4">Requested Topic</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Requested On</th>
                    <th className="px-6 py-4 text-right">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white max-w-[250px] truncate">{req.requested_title}</div>
                        {req.description && (
                          <div className="text-xs text-slate-400 truncate max-w-[250px] mt-0.5">{req.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{req.subject}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{req.class_name}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(req.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {statusBadge(req.status)}
                        {isAdmin && req.status === 'pending' && (
                          <button
                            onClick={() => markFulfilled(req.id)}
                            className="ml-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Mark Fulfilled
                          </button>
                        )}
                        <button
                          onClick={() => deleteRequest(req.id)}
                          className="ml-2 px-3 py-1 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-xs font-medium transition-all"
                          title="Permanently delete this request"
                        >
                          🗑 Delete
                        </button>
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

export default StudentRequests;
