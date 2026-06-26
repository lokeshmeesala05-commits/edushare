import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface AnalyticsData {
  totalSearches: number;
  failedSearches: number;
  totalRequests: number;
  pendingRequests: number;
  topSearches: { query: string; count: number }[];
  subjectGaps: { subject: string; class: string; requested_count: number }[];
}

const MissingResourcesAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.user_metadata?.role === 'admin';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchAnalytics();
  }, [isAdmin]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all logs
      const { data: searchLogs } = await supabase.from('search_logs').select('*');
      const { data: noteRequests } = await supabase.from('note_requests').select('*');

      const logs = searchLogs || [];
      const requests = noteRequests || [];

      const totalSearches = logs.length;
      const failedSearches = logs.filter(log => log.results_found_count === 0).length;
      
      const totalRequests = requests.length;
      const pendingRequests = requests.filter(req => req.status === 'pending').length;

      // Calculate Top Searches (Failed ones)
      const failedQueries = logs.filter(log => log.results_found_count === 0 && log.search_query);
      const queryCounts: Record<string, number> = {};
      failedQueries.forEach(log => {
        const q = log.search_query.toLowerCase().trim();
        queryCounts[q] = (queryCounts[q] || 0) + 1;
      });
      const topSearches = Object.entries(queryCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate Subject/Class Gaps from explicit requests
      const gapCounts: Record<string, number> = {};
      requests.filter(req => req.status === 'pending').forEach(req => {
        const key = `${req.subject}|${req.class_name}`;
        gapCounts[key] = (gapCounts[key] || 0) + 1;
      });
      const subjectGaps = Object.entries(gapCounts)
        .map(([key, requested_count]) => {
          const [subject, className] = key.split('|');
          return { subject, class: className, requested_count };
        })
        .sort((a, b) => b.requested_count - a.requested_count)
        .slice(0, 10);

      setData({
        totalSearches,
        failedSearches,
        totalRequests,
        pendingRequests,
        topSearches,
        subjectGaps
      });

    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Missing Resources Analytics</h1>
            <p className="text-slate-400 mt-1">Identify content gaps based on student searches and requests.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/note-requests" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
              Manage Requests
            </Link>
            <Link to="/dashboard" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all">
              Dashboard
            </Link>
          </div>
        </div>

        {loading || !data ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {[
                { label: 'Total Searches', value: data.totalSearches, icon: '🔍', color: 'from-blue-500 to-cyan-500' },
                { label: 'Failed Searches', value: data.failedSearches, icon: '⚠️', color: 'from-red-500 to-orange-500' },
                { label: 'Explicit Requests', value: data.totalRequests, icon: '📬', color: 'from-purple-500 to-pink-500' },
                { label: 'Pending Fulfillment', value: data.pendingRequests, icon: '⏳', color: 'from-amber-500 to-yellow-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                  <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl`} />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{stat.icon}</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Missing Topics */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-indigo-400">🔥</span> Top Failed Search Queries
                </h2>
                {data.topSearches.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">No failed searches logged yet.</p>
                ) : (
                  <div className="space-y-4">
                    {data.topSearches.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                        <span className="text-white font-medium">"{item.query}"</span>
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                          {item.count} searches
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Class & Subject Gaps */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-indigo-400">📊</span> Most Requested Subjects
                </h2>
                {data.subjectGaps.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">No pending requests.</p>
                ) : (
                  <div className="space-y-4">
                    {data.subjectGaps.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                        <div>
                          <p className="text-white font-medium">{item.subject}</p>
                          <p className="text-xs text-slate-400">{item.class}</p>
                        </div>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                          {item.requested_count} requests
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MissingResourcesAnalytics;
