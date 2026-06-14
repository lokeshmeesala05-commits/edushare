import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface SubjectStat {
  subject: string;
  count: number;
  downloads: number;
}

interface SearchGap {
  search_query: string;
  count: number;
  class_name: string | null;
  subject: string | null;
}

interface AnalyticsData {
  totalNotes: number;
  totalDownloads: number;
  pendingCount: number;
  rejectedCount: number;
  subjectStats: SubjectStat[];
  topDownloaded: { title: string; subject: string; downloads_count: number }[];
  searchGaps: SearchGap[];
}

const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    totalNotes: 0,
    totalDownloads: 0,
    pendingCount: 0,
    rejectedCount: 0,
    subjectStats: [],
    topDownloaded: [],
    searchGaps: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // All notes
      const { data: allNotes } = await supabase
        .from('notes')
        .select('id,title,subject,class_name,approval_status,downloads_count');

      const notes = allNotes || [];
      const approved = notes.filter(n => n.approval_status === 'approved');
      const pending  = notes.filter(n => n.approval_status === 'pending');
      const rejected = notes.filter(n => n.approval_status === 'rejected');
      const totalDownloads = approved.reduce((s, n) => s + (n.downloads_count || 0), 0);

      // Subject breakdown
      const subjectMap: Record<string, { count: number; downloads: number }> = {};
      for (const n of approved) {
        if (!subjectMap[n.subject]) subjectMap[n.subject] = { count: 0, downloads: 0 };
        subjectMap[n.subject].count++;
        subjectMap[n.subject].downloads += n.downloads_count || 0;
      }
      const subjectStats: SubjectStat[] = Object.entries(subjectMap)
        .map(([subject, v]) => ({ subject, ...v }))
        .sort((a, b) => b.count - a.count);

      // Top 5 downloaded
      const topDownloaded = [...approved]
        .sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0))
        .slice(0, 5)
        .map(n => ({ title: n.title, subject: n.subject, downloads_count: n.downloads_count || 0 }));

      // Search gaps (most requested missing topics)
      const { data: gaps, error: gapsError } = await supabase
        .from('search_logs')
        .select('search_query,class_name,subject')
        .eq('results_found', 0)
        .order('searched_at', { ascending: false })
        .limit(20);

      if (gapsError) console.error('Gaps Error:', gapsError);

      // Aggregate gap counts
      const gapMap: Record<string, SearchGap> = {};
      for (const g of gaps || []) {
        const key = g.search_query.toLowerCase();
        if (!gapMap[key]) {
          gapMap[key] = { search_query: g.search_query, count: 0, class_name: g.class_name, subject: g.subject };
        }
        gapMap[key].count++;
      }
      const searchGaps = Object.values(gapMap).sort((a, b) => b.count - a.count).slice(0, 8);

      setData({
        totalNotes: approved.length,
        totalDownloads,
        pendingCount: pending.length,
        rejectedCount: rejected.length,
        subjectStats,
        topDownloaded,
        searchGaps,
      });
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* Delete all search_logs entries for a given search query */
  const deleteGap = async (search_query: string) => {
    await supabase
      .from('search_logs')
      .delete()
      .ilike('search_query', search_query);
    setData(prev => ({
      ...prev,
      searchGaps: prev.searchGaps.filter(
        g => g.search_query.toLowerCase() !== search_query.toLowerCase()
      ),
    }));
  };

  const subjectColors: Record<string, string> = {
    Mathematics:     'bg-blue-500',
    Science:         'bg-green-500',
    'Social Studies':'bg-orange-500',
    Telugu:          'bg-red-500',
    English:         'bg-purple-500',
    Physics:         'bg-cyan-500',
    Chemistry:       'bg-yellow-500',
    Biology:         'bg-teal-500',
  };

  const maxDownloads = Math.max(...data.subjectStats.map(s => s.downloads), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Published Notes',  value: data.totalNotes,     icon: '📚', color: 'text-indigo-400' },
          { label: 'Total Downloads',  value: data.totalDownloads, icon: '⬇️', color: 'text-green-400'  },
          { label: 'Pending Review',   value: data.pendingCount,   icon: '⏳', color: 'text-yellow-400' },
          { label: 'Rejected',         value: data.rejectedCount,  icon: '❌', color: 'text-red-400'    },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downloads by Subject */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            📊 Downloads by Subject
          </h3>
          {data.subjectStats.length === 0 ? (
            <p className="text-slate-400 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {data.subjectStats.map(s => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 text-sm">{s.subject}</span>
                    <span className="text-slate-400 text-xs">{s.downloads} downloads · {s.count} notes</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${subjectColors[s.subject] || 'bg-indigo-500'}`}
                      style={{ width: `${Math.round((s.downloads / maxDownloads) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Downloaded Notes */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            🔥 Top Downloaded Notes
          </h3>
          {data.topDownloaded.length === 0 ? (
            <p className="text-slate-400 text-sm">No downloads yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topDownloaded.map((note, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm font-mono w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{note.title}</p>
                    <p className="text-slate-400 text-xs">{note.subject}</p>
                  </div>
                  <span className="text-green-400 text-sm font-bold">{note.downloads_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Automated Demand Predictor */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_15px_rgba(79,70,229,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-24 h-24 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-bold">Automated Demand Predictor (Smart Gap Alerts)</h3>
          </div>
          <p className="text-indigo-200/70 text-sm mb-6">
            Our algorithm detects curriculum resource deficits by analyzing regional voice-search fail-states. 
            Topics with multiple failed searches generate an automated high-priority curriculum request.
          </p>

          {data.searchGaps.length === 0 ? (
            <p className="text-indigo-300 text-sm">No gap data detected yet.</p>
          ) : (
            <div className="space-y-4">
              {/* High Priority Alerts */}
              {data.searchGaps.filter(g => g.count >= 2).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    High Priority Gap Alerts
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.searchGaps.filter(g => g.count >= 2).map((gap, i) => (
                      <div key={`high-${i}`} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-red-300 font-semibold text-lg">"{gap.search_query}"</p>
                          <p className="text-red-400/60 text-xs mt-1">Status: Unfulfilled Demand</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-red-500 text-white font-bold text-lg px-3 py-1.5 rounded-lg">
                            {gap.count} requests
                          </div>
                          <button
                            onClick={() => deleteGap(gap.search_query)}
                            title="Remove this entry"
                            className="p-1.5 bg-white/10 hover:bg-red-700 text-white rounded-lg transition text-xs font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standard Tracking */}
              <div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 mt-6">
                  Early Detection Tracking
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.searchGaps.filter(g => g.count < 2).map((gap, i) => (
                    <div key={`low-${i}`} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl pl-3 pr-1.5 py-1.5">
                      <span className="text-slate-300 text-sm">"{gap.search_query}"</span>
                      <button
                        onClick={() => deleteGap(gap.search_query)}
                        title="Remove this entry"
                        className="p-0.5 hover:bg-red-500 text-slate-400 hover:text-white rounded transition text-xs font-bold leading-none w-5 h-5 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
