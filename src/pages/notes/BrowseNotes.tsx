import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Recommendations from '../../components/notes/Recommendations';

interface Note {
  id: string;
  title: string;
  description: string;
  class_name: string;
  subject: string;
  language: string;
  file_url: string;
  downloads_count: number;
  created_at: string;
  uploaded_by: string;
}

const DEFAULT_SUBJECTS = ['Mathematics', 'Science', 'Social Studies', 'Telugu', 'Hindi', 'English', 'Physics', 'Chemistry', 'Biology'];
const CLASSES  = ['6th Class', '7th Class', '8th Class', '9th Class', '10th Class', 'Intermediate 1st Year', 'Intermediate 2nd Year'];
const LANGUAGES = ['Telugu Medium', 'English Medium'];

const subjectColors: Record<string, string> = {
  Mathematics:    'from-blue-500 to-blue-600',
  Science:        'from-green-500 to-emerald-600',
  'Social Studies':'from-orange-500 to-amber-600',
  Telugu:         'from-red-500 to-rose-600',
  Hindi:          'from-orange-400 to-red-500',
  English:        'from-purple-500 to-violet-600',
  Physics:        'from-cyan-500 to-sky-600',
  Chemistry:      'from-yellow-500 to-orange-500',
  Biology:        'from-teal-500 to-green-600',
};

const subjectIcons: Record<string, string> = {
  Mathematics: '∑',
  Science: '⚗',
  'Social Studies': '🌍',
  Telugu: 'అ',
  Hindi: 'अ',
  English: 'A',
  Physics: '⚡',
  Chemistry: '🧪',
  Biology: '🧬',
};

const BrowseNotes: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin';
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [gapLogged, setGapLogged] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [voiceLang, setVoiceLang] = useState<'te-IN' | 'en-IN'>('te-IN');
  const [showFilters, setShowFilters] = useState(false);
  const [downloadedSession, setDownloadedSession] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  /* ── Voice search ── */
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support voice search. Please use Google Chrome.");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = voiceLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart  = () => setIsListening(true);
    recognition.onend    = () => setIsListening(false);
    recognition.onerror  = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
      fetchNotes(transcript);
    };
    recognition.start();
  };

  /* ── Fetch notes ── */
  useEffect(() => {
    fetchNotes();
    fetchUniqueSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSubject, selectedLanguage, sortBy]);

  const fetchUniqueSubjects = async () => {
    try {
      const { data } = await supabase.from('notes').select('subject').eq('approval_status', 'approved');
      if (data) {
        const unique = Array.from(new Set(data.map(d => d.subject)));
        const merged = Array.from(new Set([...DEFAULT_SUBJECTS, ...unique]));
        setAvailableSubjects(merged);
      }
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    }
  };

  const fetchNotes = async (query = searchQuery) => {
    setLoading(true);
    setGapLogged(false);
    try {
      let q = supabase
        .from('notes')
        .select('*')
        .eq('approval_status', 'approved');

      if (query.trim()) {
        q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,subject.ilike.%${query}%`);
      }
      if (selectedClass)    q = q.eq('class_name', selectedClass);
      if (selectedSubject)  q = q.eq('subject', selectedSubject);
      if (selectedLanguage) q = q.eq('language', selectedLanguage);

      q = sortBy === 'popular'
        ? q.order('downloads_count', { ascending: false })
        : q.order('created_at',      { ascending: false });

      const { data, error } = await q;
      if (error) throw error;

      if (data && data.length === 0 && query.trim()) {
        logResourceGap(query);
        setGapLogged(true);
      }
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const logResourceGap = async (query: string) => {
    try {
      await supabase.from('search_logs').insert([{
        search_query: query,
        class_name:   selectedClass || null,
        subject:      selectedSubject || null,
        results_found: 0,
      }]);
    } catch (err) {
      console.error('Failed to log resource gap:', err);
    }
  };

  /* ── Download handler (increments counter) ── */
  const handleDownload = async (note: Note) => {
    setDownloadingId(note.id);
    try {
      if (!downloadedSession.has(note.id)) {
        // Increment download count securely via RPC
        const { error: rpcError } = await supabase.rpc('track_download_secure', { p_note_id: note.id });
        if (rpcError) {
          console.error("RPC Error:", rpcError);
        } else {
          setDownloadedSession(prev => new Set(prev).add(note.id));
          // Update local state
          setNotes(prev => prev.map(n =>
            n.id === note.id ? { ...n, downloads_count: n.downloads_count + 1 } : n
          ));
        }
      }

      // Open the file
      window.open(note.file_url, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      window.open(note.file_url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  /* ── Delete handler ── */
  const deleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to completely delete this note?')) return;
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } else {
      alert('Failed to delete note: ' + error.message);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedLanguage('');
  };

  const hasFilters = searchQuery || selectedClass || selectedSubject || selectedLanguage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full opacity-5 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-purple-600 rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">Digital Library</h1>
              <p className="text-slate-400 mt-1">Free notes, papers &amp; textbooks for AP/TS students</p>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25 text-sm self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload a Note
            </Link>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex items-center mb-4">
              <div className="absolute left-4 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchRef}
                id="browse-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by topic, subject or keyword… e.g. 'Photosynthesis'"
                className="w-full pl-12 pr-36 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {/* Language Toggle */}
                <button
                  type="button"
                  onClick={() => setVoiceLang(prev => prev === 'te-IN' ? 'en-IN' : 'te-IN')}
                  className="px-2 py-1.5 text-[10px] font-bold tracking-wider rounded bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 transition-colors uppercase"
                  title={`Switch voice language (Currently: ${voiceLang === 'te-IN' ? 'Telugu' : 'English'})`}
                >
                  {voiceLang === 'te-IN' ? 'TE' : 'EN'}
                </button>
                {/* Voice button */}
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  title="Voice search"
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 animate-pulse'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                {/* Search button */}
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Filters row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">All Classes</option>
                {CLASSES.map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
              </select>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="appearance-none w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner"
              >
                <option value="" className="bg-slate-900">All Subjects</option>
                {availableSubjects.map(s => (
                  <option key={s} value={s} className="bg-slate-900">{s}</option>
                ))}
              </select>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">All Languages</option>
                {LANGUAGES.map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
              </select>
            </div>
          </form>
        </div>

        {/* ── Sort + Stats bar ── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-400">
            {loading ? 'Searching…' : `${notes.length} note${notes.length !== 1 ? 's' : ''} found`}
            {hasFilters && (
              <button onClick={clearFilters} className="ml-3 text-indigo-400 hover:text-indigo-300 transition text-xs underline">
                Clear filters
              </button>
            )}
          </p>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {(['newest', 'popular'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                  sortBy === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s === 'newest' ? '🕒 Newest' : '🔥 Popular'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading notes…</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && notes.length === 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-14 text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No notes found</h3>
            <p className="text-slate-400 text-sm mb-6">
              {gapLogged
                ? "We've recorded your request — an admin will upload this resource soon! 📬"
                : "Try adjusting your search or filters."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all"
              >
                Clear filters
              </button>
              <Link
                to="/upload"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all"
              >
                Upload this note
              </Link>
            </div>
          </div>
        )}

        {/* ── Notes Grid ── */}
        {!loading && notes.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {notes.map(note => {
                const gradientClass = subjectColors[note.subject] || 'from-indigo-500 to-purple-600';
                const icon = subjectIcons[note.subject] || '📄';
                return (
                  <div
                    key={note.id}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group flex flex-col relative"
                  >
                  {(isAdmin || user?.id === note.uploaded_by) && (
                    <button 
                      onClick={() => deleteNote(note.id)}
                      title="Delete Note"
                      className="absolute top-4 right-4 p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100 z-10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  {/* Card Header */}
                  <div className={`bg-gradient-to-br ${gradientClass} p-5 flex items-center justify-between`}>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                      {icon}
                    </div>
                    <div className="text-right">
                      <span className="block text-white/80 text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                        {note.class_name}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                        {note.subject}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-base mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                      {note.title}
                    </h3>
                    {note.description && (
                      <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">
                        {note.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-auto mb-4">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        {note.language}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {note.downloads_count || 0} downloads
                      </span>
                    </div>

                    {/* Buttons row */}
                    <div className="flex gap-2">
                      <Link
                        to={`/notes/${note.id}`}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 text-center transition-all duration-200 flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Details
                      </Link>
                      <button
                        onClick={() => handleDownload(note)}
                        disabled={downloadingId === note.id}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                          downloadingId === note.id
                            ? 'bg-indigo-500/30 text-indigo-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
                        }`}
                      >
                        {downloadingId === note.id ? (
                          <><div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />Opening…</>
                        ) : (
                          <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>Download</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* AI Recommendations */}
            <Recommendations
              currentSubject={selectedSubject}
              currentClass={selectedClass}
              excludeIds={notes.map(n => n.id)}
            />
          </>
        )}

        {/* ── Voice search indicator ── */}
        {isListening && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-red-500/30 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl z-50">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            <p className="text-white font-medium text-sm">Listening… speak in Telugu or English</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseNotes;
