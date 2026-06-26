import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DownloadedNote {
  id: string;
  downloaded_at: string;
  note: {
    id: string;
    title: string;
    subject: string;
    class_name: string;
    file_url: string;
  };
}

const StudentDownloads: React.FC = () => {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<DownloadedNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDownloads();
  }, [user]);

  const fetchDownloads = async () => {
    try {
      const { data, error } = await supabase
        .from('downloads')
        .select(`
          id,
          downloaded_at,
          note:notes(id, title, subject, class_name, file_url)
        `)
        .eq('user_id', user!.id)
        .order('downloaded_at', { ascending: false });

      if (error) throw error;
      
      // Filter out downloads where note might have been deleted (note is null)
      const validDownloads = (data as any[]).filter(d => d.note) as DownloadedNote[];
      setDownloads(validDownloads);
    } catch (err) {
      console.error('Failed to fetch downloads:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Downloads</h1>
            <p className="text-slate-400 mt-1">History of all the notes you've downloaded.</p>
          </div>
          <Link to="/dashboard" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : downloads.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-14 text-center">
            <div className="text-5xl mb-4">📥</div>
            <h3 className="text-xl font-bold text-white mb-2">No downloads yet</h3>
            <p className="text-slate-400 mb-6">You haven't downloaded any notes from the digital library yet.</p>
            <Link to="/notes" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all">
              Browse Notes
            </Link>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-sm font-semibold text-slate-300 border-b border-white/10">
                    <th className="px-6 py-4">Note Title</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Downloaded On</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {downloads.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate">
                        {item.note.title}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{item.note.subject}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{item.note.class_name}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(item.downloaded_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link to={`/notes/${item.note.id}`} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                            Details
                          </Link>
                          <button
                            onClick={() => window.open(item.note.file_url, '_blank')}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all"
                          >
                            Re-download
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

export default StudentDownloads;
