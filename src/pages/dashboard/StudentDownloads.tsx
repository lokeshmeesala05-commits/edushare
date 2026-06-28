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

  const deleteDownload = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this download from your history?')) return;
    
    try {
      const { error } = await supabase
        .from('downloads')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setDownloads(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete download:', err);
      alert('Failed to remove download history.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 transition-colors duration-300 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-text dark:text-white">My Downloads</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">History of all the notes you've downloaded.</p>
          </div>
          <Link to="/dashboard" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-brand-text dark:text-white rounded-xl text-sm font-medium transition-all">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : downloads.length === 0 ? (
          <div className="card-base p-14 text-center">
            <div className="text-5xl mb-4">📥</div>
            <h3 className="text-xl font-bold text-brand-text dark:text-white mb-2">No downloads yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">You haven't downloaded any notes from the digital library yet.</p>
            <Link to="/notes" className="px-6 py-3 bg-brand-primary hover:bg-brand-navy text-white font-medium rounded-xl transition-all shadow-md">
              Browse Notes
            </Link>
          </div>
        ) : (
          <div className="card-base overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-sm font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Note Title</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Downloaded On</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {downloads.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-brand-text dark:text-white max-w-[200px] truncate">
                        {item.note.title}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{item.note.subject}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{item.note.class_name}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                        {new Date(item.downloaded_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link to={`/notes/${item.note.id}`} className="text-sm text-brand-primary hover:text-brand-navy font-medium">
                            Details
                          </Link>
                          <button
                            onClick={() => window.open(item.note.file_url, '_blank')}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-brand-text dark:text-white text-sm font-medium rounded-lg transition-all"
                          >
                            Re-download
                          </button>
                          <button
                            onClick={() => deleteDownload(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove from history"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
