import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Recommendations from '../../components/notes/Recommendations';

interface Note {
  id: string;
  title: string;
  description: string;
  subject: string;
  class_name: string;
  chapter: string;
  language: string;
  file_url: string;
  downloads_count: number;
  approval_status: string;
  created_at: string;
  uploaded_by: string;
}

const subjectColors: Record<string, string> = {
  Mathematics:     'from-blue-500 to-blue-600',
  Science:         'from-green-500 to-emerald-600',
  'Social Studies':'from-orange-500 to-amber-600',
  Telugu:          'from-red-500 to-rose-600',
  English:         'from-purple-500 to-violet-600',
  Physics:         'from-cyan-500 to-sky-600',
  Chemistry:       'from-yellow-500 to-orange-500',
  Biology:         'from-teal-500 to-green-600',
};

const subjectIcons: Record<string, string> = {
  Mathematics: '∑', Science: '⚗', 'Social Studies': '🌍',
  Telugu: 'అ', English: 'A', Physics: '⚡', Chemistry: '🧪', Biology: '🧬',
};

const NoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    if (id) fetchNote();
  }, [id]);

  const fetchNote = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setNote(data);
      fetchRatings(data.id);
    }
    setLoading(false);
  };

  const fetchRatings = async (noteId: string) => {
    const { data } = await supabase
      .from('ratings')
      .select('rating')
      .eq('note_id', noteId);

    if (data && data.length > 0) {
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
      setAvgRating(Math.round(avg * 10) / 10);
      setRatingCount(data.length);
    }

    // Check if current user already rated
    if (user) {
      const { data: myRating } = await supabase
        .from('ratings')
        .select('rating')
        .eq('note_id', noteId)
        .eq('user_id', user.id)
        .single();
      if (myRating) {
        setUserRating(myRating.rating);
        setRatingSubmitted(true);
      }
    }
  };

  const handleDownload = () => {
    if (!note) return;
    
    // 1. Open file immediately to bypass browser popup blockers
    window.open(note.file_url, '_blank');

    // 2. Track download asynchronously in the background
    (async () => {
      try {
        await supabase
          .from('notes')
          .update({ downloads_count: (note.downloads_count || 0) + 1 })
          .eq('id', note.id);

        if (user) {
          await supabase.from('downloads').insert([{ note_id: note.id, user_id: user.id }]);
        }
        setNote(prev => prev ? { ...prev, downloads_count: prev.downloads_count + 1 } : prev);
      } catch (error) {
        console.error('Error tracking download:', error);
      }
    })();
  };

  const submitRating = async (rating: number) => {
    if (!user) { navigate('/login'); return; }
    if (!note || ratingSubmitted) return;

    setUserRating(rating);
    const { error } = await supabase
      .from('ratings')
      .upsert([{ note_id: note.id, user_id: user.id, rating }], { onConflict: 'note_id,user_id' });

    if (!error) {
      setRatingSubmitted(true);
      const newTotal = avgRating * ratingCount + rating;
      const newCount = ratingCount + 1;
      setAvgRating(Math.round((newTotal / newCount) * 10) / 10);
      setRatingCount(newCount);
    }
  };

  const isPDF = note?.file_url?.toLowerCase().includes('.pdf') ||
                note?.file_url?.includes('/pdf');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !note) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-white mb-2">Note not found</h1>
          <p className="text-slate-400 mb-6">This note may have been removed or isn't published yet.</p>
          <Link to="/notes" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition">
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const gradient = subjectColors[note.subject] || 'from-indigo-500 to-purple-600';
  const icon = subjectIcons[note.subject] || '📄';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-purple-600 rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link to="/" className="hover:text-white transition">Home</Link>
          <span>/</span>
          <Link to="/notes" className="hover:text-white transition">Library</Link>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{note.title}</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden mb-6">
          {/* Colored Header */}
          <div className={`bg-gradient-to-br ${gradient} p-8 flex items-center gap-5`}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/80 text-xs bg-white/20 px-2 py-0.5 rounded-full">{note.class_name}</span>
                {note.chapter && (
                  <span className="text-white/70 text-xs">📌 {note.chapter}</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{note.title}</h1>
              <p className="text-white/70 text-sm mt-1">{note.subject} · {note.language}</p>
            </div>
          </div>

          {/* Meta + Actions */}
          <div className="p-6">
            {note.description && (
              <p className="text-slate-300 text-sm leading-relaxed mb-6">{note.description}</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-5 mb-6">
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span><strong className="text-white">{note.downloads_count || 0}</strong> downloads</span>
              </div>
              {ratingCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <span className="text-yellow-400">★</span>
                  <span><strong className="text-white">{avgRating}</strong>/5 ({ratingCount} ratings)</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(note.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60"
              >
                {downloading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Opening…</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>Download PDF</>
                )}
              </button>

              {isPDF && (
                <button
                  onClick={() => setShowPDF(s => !s)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {showPDF ? 'Hide Preview' : 'Preview PDF'}
                </button>
              )}

              <Link
                to="/notes"
                className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-all text-sm"
              >
                ← Back to Library
              </Link>
            </div>
          </div>
        </div>

        {/* PDF Preview */}
        {showPDF && isPDF && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden mb-6">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF Preview
              </h2>
              <button onClick={() => setShowPDF(false)} className="text-slate-400 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <iframe
              src={`${note.file_url}#view=FitH`}
              title="PDF Preview"
              className="w-full"
              style={{ height: '70vh' }}
              loading="lazy"
            />
          </div>
        )}

        {/* Star Rating */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">
            {ratingSubmitted ? '✅ Thanks for rating!' : '⭐ Rate this note'}
          </h2>
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => submitRating(star)}
                onMouseEnter={() => !ratingSubmitted && setHoverRating(star)}
                onMouseLeave={() => !ratingSubmitted && setHoverRating(0)}
                disabled={ratingSubmitted}
                className={`text-3xl transition-all duration-150 ${ratingSubmitted ? 'cursor-default' : 'hover:scale-125 cursor-pointer'}`}
              >
                <span className={
                  star <= (hoverRating || userRating)
                    ? 'text-yellow-400'
                    : 'text-slate-600'
                }>★</span>
              </button>
            ))}
            {(userRating > 0 || hoverRating > 0) && (
              <span className="text-slate-300 text-sm ml-2">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || userRating]}
              </span>
            )}
          </div>
          {!user && (
            <p className="text-slate-400 text-xs">
              <Link to="/login" className="text-indigo-400 hover:underline">Sign in</Link> to rate this note.
            </p>
          )}
          {ratingCount > 0 && (
            <p className="text-slate-400 text-xs mt-2">
              Average: {avgRating}/5 from {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
            </p>
          )}
        </div>

        {/* Recommendations */}
        <Recommendations
          currentSubject={note.subject}
          currentClass={note.class_name}
          excludeIds={[note.id]}
        />
      </div>
    </div>
  );
};

export default NoteDetail;
