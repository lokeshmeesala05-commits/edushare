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
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingSubjectFilter, setPendingSubjectFilter] = useState<string>('all');

  const isAdmin = user?.user_metadata?.role === 'admin';
  const isTeacher = user?.user_metadata?.role === 'teacher';
  const teacherSubject = user?.user_metadata?.subject;

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

      // Admins and Teachers fetch pending notes
      let pendingList = [];
      if (isAdmin || isTeacher) {
        let query = supabase
          .from('notes')
          .select('*')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false });
          
        if (isTeacher && teacherSubject) {
          query = query.eq('subject', teacherSubject);
        }
        
        const { data: pending } = await query;
        pendingList = pending || [];
        setPendingNotes(pendingList);
      }

      const approvedList = approved || [];
      const totalDownloads = approvedList.reduce((sum, n) => sum + (n.downloads_count || 0), 0);
      setNotes(approvedList);
      setStats({
        totalNotes: approvedList.length,
        approvedNotes: approvedList.length,
        pendingNotes: (isAdmin || isTeacher) ? pendingList.length : 0,
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

  const openRejectModal = (noteId: string) => {
    setRejectModalId(noteId);
    setRejectReason('');
  };

  const submitReject = async () => {
    if (!rejectModalId) return;

    const { error } = await supabase
      .from('notes')
      .update({ approval_status: 'rejected', rejection_reason: rejectReason })
      .eq('id', rejectModalId);
    if (!error) {
      setActionMsg('🗑 Note rejected.');
      setPendingNotes(prev => prev.filter(n => n.id !== rejectModalId));
      setTimeout(() => setActionMsg(''), 3000);
    }
    setRejectModalId(null);
    setRejectReason('');
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
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 transition-colors duration-300">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-text dark:text-white">
              Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0]} 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {isAdmin ? 'Admin Dashboard — manage content and users' : isTeacher ? `Teacher Dashboard — verify notes for ${teacherSubject}` : 'Your personal EduShare dashboard'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/upload"
              className="px-4 py-2 bg-brand-primary hover:bg-brand-navy text-white text-sm font-medium rounded-xl transition-all shadow-md"
            >
              + Upload Note
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-brand-text dark:text-white text-sm font-medium rounded-xl transition-all shadow-sm"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className="mb-4 px-4 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-brand-primary text-sm">
            {actionMsg}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Approved Notes', value: stats.approvedNotes, icon: '📚', color: 'from-brand-primary to-brand-navy' },
            { label: 'Total Downloads', value: stats.totalDownloads, icon: '⬇️', color: 'from-brand-emerald to-green-600' },
            { label: 'My Uploads', value: myNotes.length, icon: '📤', color: 'from-brand-amber to-orange-500' },
            { label: 'Pending Review', value: (isAdmin || isTeacher) ? pendingNotes.length : myNotes.filter(n => n.approval_status === 'pending').length, icon: '⏳', color: 'from-purple-500 to-purple-700' },
          ].map(stat => (
            <div key={stat.label} className="card-base p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-brand-text dark:text-white">{loading ? '—' : stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 mb-6 w-fit shadow-sm">
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'my-notes', label: '📤 My Notes' },
            { key: 'saved-notes', label: '🔖 Saved Notes' },
            ...((isAdmin || isTeacher) ? [
              { key: 'pending', label: `⏳ Pending (${pendingNotes.length})` }
            ] : []),
            ...(isAdmin ? [
              { key: 'analytics', label: '📈 Analytics' },
            ] : []),
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.key
                ? 'bg-brand-primary text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-brand-text dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {tab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold text-brand-text dark:text-white mb-4">Recently Approved Notes</h2>
                {notes.length === 0 ? (
                  <div className="card-base p-10 text-center text-slate-500 dark:text-slate-400">
                    No approved notes yet. <Link to="/upload" className="text-brand-primary hover:underline">Upload the first one!</Link>
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
                <h2 className="text-xl font-semibold text-brand-text dark:text-white mb-4">My Uploaded Notes</h2>
                {myNotes.length === 0 ? (
                  <div className="card-base p-10 text-center text-slate-500 dark:text-slate-400">
                    You haven't uploaded any notes yet.{' '}
                    <Link to="/upload" className="text-brand-primary hover:underline">Upload now</Link>
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
                <h2 className="text-xl font-semibold text-brand-text dark:text-white mb-4">My Saved Notes</h2>
                {savedNotes.length === 0 ? (
                  <div className="card-base p-10 text-center text-slate-500 dark:text-slate-400">
                    You haven't saved any notes yet.{' '}
                    <Link to="/notes" className="text-brand-primary hover:underline">Browse notes</Link>
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

            {/* Admin/Teacher Pending Tab */}
            {tab === 'pending' && (isAdmin || isTeacher) && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                  <h2 className="text-xl font-semibold text-brand-text dark:text-white">Pending Review</h2>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600 dark:text-slate-400">Filter by Subject:</label>
                      <select
                        value={pendingSubjectFilter}
                        onChange={(e) => setPendingSubjectFilter(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-brand-text dark:text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-primary shadow-sm"
                      >
                        <option value="all">All Subjects</option>
                        {Array.from(new Set([
                          'Mathematics', 'Science', 'Social Studies', 'Telugu', 'Hindi', 'English', 'Physics', 'Chemistry', 'Biology',
                          ...pendingNotes.map(n => n.subject)
                        ])).map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {pendingNotes.length === 0 ? (
                  <div className="card-base p-10 text-center text-slate-500 dark:text-slate-400">
                    🎉 No notes pending review. Everything is up to date!
                  </div>
                ) : pendingNotes.filter(n => (isAdmin ? (pendingSubjectFilter === 'all' || n.subject === pendingSubjectFilter) : true)).length === 0 ? (
                  <div className="card-base p-10 text-center text-slate-500 dark:text-slate-400">
                    No pending notes found for subject: {pendingSubjectFilter}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingNotes
                      .filter(n => (isAdmin ? (pendingSubjectFilter === 'all' || n.subject === pendingSubjectFilter) : true))
                      .map(note => (
                      <div key={note.id} className="card-base p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-brand-text dark:text-white truncate">{note.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{note.subject} · Class {note.class_name} · {note.language}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{new Date(note.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                          {note.file_url && (
                            <a
                              href={note.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-brand-text dark:text-white text-xs font-medium rounded-lg transition-all"
                            >
                              Preview
                            </a>
                          )}
                          <button
                            onClick={() => approveNote(note.id)}
                            className="px-3 py-1.5 bg-green-100 dark:bg-green-600/20 hover:bg-green-200 dark:hover:bg-green-600/40 text-green-700 dark:text-green-400 text-xs font-medium rounded-lg transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(note.id)}
                            className="px-3 py-1.5 bg-amber-100 dark:bg-amber-600/20 hover:bg-amber-200 dark:hover:bg-amber-600/40 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-lg transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="px-3 py-1.5 bg-red-100 dark:bg-red-600/20 hover:bg-red-200 dark:hover:bg-red-600/40 text-red-700 dark:text-red-400 text-xs font-medium rounded-lg transition-all"
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

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-brand-text dark:text-white mb-2">Reject Note</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Why are you rejecting this note? (Optional but recommended so the student knows how to improve it)
            </p>
            <textarea
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition resize-none mb-6 text-sm"
              placeholder="e.g., The handwriting is unreadable, please scan it clearly..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-brand-text dark:text-white text-sm font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-all shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Note card sub-component
const NoteCard: React.FC<{ note: Note; statusBadge: (s: string) => React.ReactNode; onDelete?: () => void }> = ({ note, statusBadge, onDelete }) => (
  <div className="card-base p-5 hover:border-brand-primary/40 transition-all group relative flex flex-col">
    {onDelete && (
      <button
        onClick={onDelete}
        title="Delete Note"
        className="absolute top-4 right-4 p-1.5 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100 z-10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    )}
    <div className="flex items-start justify-between mb-3 pr-8">
      <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      {statusBadge(note.approval_status)}
    </div>
    <h3 className="font-semibold text-brand-text dark:text-white mb-1 truncate">{note.title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{note.subject} · Class {note.class_name}</p>
    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
      <span className="text-xs text-slate-400 dark:text-slate-500">{note.language}</span>
      {note.file_url && (
        <a
          href={note.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-primary hover:text-brand-navy font-medium transition group-hover:underline"
        >
          View File →
        </a>
      )}
    </div>
    {note.approval_status === 'rejected' && note.rejection_reason && (
      <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Rejection Reason:</p>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{note.rejection_reason}</p>
      </div>
    )}
  </div>
);

export default Dashboard;
