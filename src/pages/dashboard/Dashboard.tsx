import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AdminAnalytics from '../../components/admin/AdminAnalytics';

interface Note {
  id: string;
  title: string;
  subject: string;
  class_name: string;
  language: string;
  approval_status: string;
  rejection_reason?: string;
  created_at: string;
  file_url: string;
  downloads_count: number;
}

interface Stats {
  totalNotes: number;
  pendingNotes: number;
  approvedNotes: number;
  totalDownloads: number;
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<'overview' | 'my-notes' | 'saved-notes' | 'pending' | 'analytics'>('overview');
  const [notes, setNotes] = useState<Note[]>([]);
  const [pendingNotes, setPendingNotes] = useState<Note[]>([]);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<Stats>({ totalNotes: 0, pendingNotes: 0, approvedNotes: 0, totalDownloads: 0 });
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const isAdmin = user?.user_metadata?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch approved notes (for overview stats)
      const { data: approved } = await supabase
        .from('notes')
        .select('*')
        .eq('approval_status', 'approved');

      // Fetch user's own notes
      if (user) {
        const { data: mine } = await supabase
          .from('notes')
          .select('*')
          .eq('uploaded_by', user.id)
          .order('created_at', { ascending: false });
        setMyNotes(mine || []);

        const { data: saved } = await supabase
          .from('saved_notes')
          .select('note_id')
          .eq('user_id', user.id);
        
        if (saved && saved.length > 0) {
          const noteIds = saved.map(d => d.note_id);
          const { data: sNotes } = await supabase
            .from('notes')
            .select('*')
            .in('id', noteIds);
          setSavedNotes(sNotes || []);
        }
      }

      // Admins also fetch pending notes
      if (isAdmin) {
        const { data: pending } = await supabase
          .from('notes')
          .select('*')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false });
        setPendingNotes(pending || []);
      }

      const approvedList = approved || [];
      const totalDownloads = approvedList.reduce((sum, n) => sum + (n.downloads_count || 0), 0);
      setNotes(approvedList);
      setStats({
        totalNotes: approvedList.length,
        approvedNotes: approvedList.length,
        pendingNotes: isAdmin ? (pendingNotes.length) : 0,
        totalDownloads,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveNote = async (noteId: string) => {
    const { error } = await supabase
      .from('notes')
      .update({ approval_status: 'approved' })
      .eq('id', noteId);
    if (!error) {
      setActionMsg('✅ Note approved successfully!');
      setPendingNotes(prev => prev.filter(n => n.id !== noteId));
      setTimeout(() => setActionMsg(''), 3000);
    }
  };

  const rejectNote = async (noteId: string) => {
    const reason = window.prompt('Why are you rejecting this note? (Optional but recommended so the student knows)');
    if (reason === null) return; // Admin cancelled the prompt

    const { error } = await supabase
      .from('notes')
      .update({ approval_status: 'rejected', rejection_reason: reason })
      .eq('id', noteId);
    if (!error) {
      setActionMsg('🗑 Note rejected.');
      setPendingNotes(prev => prev.filter(n => n.id !== noteId));
      setTimeout(() => setActionMsg(''), 3000);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to completely delete this note?')) return;
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (!error) {
      setActionMsg('🗑 Note deleted successfully.');
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setMyNotes(prev => prev.filter(n => n.id !== noteId));
      setPendingNotes(prev => prev.filter(n => n.id !== noteId));
      setTimeout(() => setActionMsg(''), 3000);
    } else {
      alert('Failed to delete note: ' + error.message);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${map[status] || 'bg-white/10 text-white/60'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600 rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600 rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0]} 👋
            </h1>
            <p className="text-slate-400 mt-1">
              {isAdmin ? 'Admin Dashboard — manage content and users' : 'Your personal EduShare dashboard'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/upload"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25"
            >
              + Upload Note
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium rounded-xl transition-all"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className="mb-4 px-4 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm">
            {actionMsg}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Approved Notes', value: stats.approvedNotes, icon: '📚', color: 'from-indigo-600 to-indigo-500' },
            { label: 'Total Downloads', value: stats.totalDownloads, icon: '⬇️', color: 'from-purple-600 to-purple-500' },
            { label: 'My Uploads', value: myNotes.length, icon: '📤', color: 'from-pink-600 to-pink-500' },
            { label: 'Pending Review', value: isAdmin ? pendingNotes.length : myNotes.filter(n => n.approval_status === 'pending').length, icon: '⏳', color: 'from-orange-600 to-orange-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{loading ? '—' : stat.value}</p>
              <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'my-notes', label: '📤 My Notes' },
            { key: 'saved-notes', label: '🔖 Saved Notes' },
            ...(isAdmin ? [
              { key: 'pending',   label: `⏳ Pending (${pendingNotes.length})` },
              { key: 'analytics', label: '📈 Analytics' },
            ] : []),
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === t.key
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {tab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Recently Approved Notes</h2>
                {notes.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-slate-400">
                    No approved notes yet. <Link to="/upload" className="text-indigo-400 hover:underline">Upload the first one!</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.slice(0, 6).map(note => (
                      <NoteCard 
                        key={note.id} 
                        note={note} 
                        statusBadge={statusBadge} 
                        onDelete={isAdmin ? () => deleteNote(note.id) : undefined} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Notes Tab */}
            {tab === 'my-notes' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">My Uploaded Notes</h2>
                {myNotes.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-slate-400">
                    You haven't uploaded any notes yet.{' '}
                    <Link to="/upload" className="text-indigo-400 hover:underline">Upload now</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myNotes.map(note => (
                      <NoteCard 
                        key={note.id} 
                        note={note} 
                        statusBadge={statusBadge} 
                        onDelete={() => deleteNote(note.id)} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Saved Notes Tab */}
            {tab === 'saved-notes' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">My Saved Notes</h2>
                {savedNotes.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-slate-400">
                    You haven't saved any notes yet.{' '}
                    <Link to="/notes" className="text-indigo-400 hover:underline">Browse notes</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedNotes.map(note => (
                      <NoteCard 
                        key={note.id} 
                        note={note} 
                        statusBadge={statusBadge} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Admin Analytics Tab */}
            {tab === 'analytics' && isAdmin && (
              <AdminAnalytics />
            )}

            {/* Admin Pending Tab */}
            {tab === 'pending' && isAdmin && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Pending Review</h2>
                {pendingNotes.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-slate-400">
                    🎉 No notes pending review. Everything is up to date!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingNotes.map(note => (
                      <div key={note.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{note.title}</p>
                          <p className="text-sm text-slate-400">{note.subject} · Class {note.class_name} · {note.language}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{new Date(note.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {note.file_url && (
                            <a
                              href={note.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-all"
                            >
                              Preview
                            </a>
                          )}
                          <button
                            onClick={() => approveNote(note.id)}
                            className="px-3 py-1.5 bg-green-600/80 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectNote(note.id)}
                            className="px-3 py-1.5 bg-yellow-600/80 hover:bg-yellow-500 text-white text-xs font-medium rounded-lg transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Note card sub-component
const NoteCard: React.FC<{ note: Note; statusBadge: (s: string) => React.ReactNode; onDelete?: () => void }> = ({ note, statusBadge, onDelete }) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-indigo-500/40 transition-all group relative">
    {onDelete && (
      <button 
        onClick={onDelete}
        title="Delete Note"
        className="absolute top-4 right-4 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    )}
    <div className="flex items-start justify-between mb-3 pr-8">
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      {statusBadge(note.approval_status)}
    </div>
    <h3 className="font-semibold text-white mb-1 truncate">{note.title}</h3>
    <p className="text-sm text-slate-400 mb-3">{note.subject} · Class {note.class_name}</p>
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{note.language}</span>
      {note.file_url && (
        <a
          href={note.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition group-hover:underline"
        >
          View PDF →
        </a>
      )}
    </div>
    {note.approval_status === 'rejected' && note.rejection_reason && (
      <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-xs text-red-400 font-medium">Rejection Reason:</p>
        <p className="text-xs text-slate-300 mt-0.5">{note.rejection_reason}</p>
      </div>
    )}
  </div>
);

export default Dashboard;
