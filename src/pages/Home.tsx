import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FeaturedNote {
  id: string;
  title: string;
  subject: string;
  class_name: string;
  language: string;
  downloads_count: number;
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

const STATS = [
  { value: '500+', label: 'Notes Available', icon: '📚' },
  { value: '10K+', label: 'Students Helped', icon: '🎓' },
  { value: '8',    label: 'Subjects Covered', icon: '📖' },
  { value: '2',    label: 'Language Mediums', icon: '🗣️' },
];

const FEATURES = [
  {
    icon: '🎤',
    title: 'Voice Search',
    desc: 'Speak in Telugu or English to instantly find notes without typing a single letter.',
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    icon: '📥',
    title: 'Free Downloads',
    desc: 'Every note, paper and textbook is completely free. Download PDF directly to your device.',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: '🛡️',
    title: 'Admin Verified',
    desc: 'Every upload goes through admin review before being published, ensuring quality content.',
    gradient: 'from-orange-500 to-amber-600',
  },
  {
    icon: '📡',
    title: 'Offline Ready',
    desc: 'Download once, study anywhere. No internet needed after you save the files.',
    gradient: 'from-pink-500 to-rose-600',
  },
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredNotes, setFeaturedNotes] = useState<FeaturedNote[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data, count } = await supabase
        .from('notes')
        .select('id,title,subject,class_name,language,downloads_count', { count: 'exact' })
        .eq('approval_status', 'approved')
        .order('downloads_count', { ascending: false })
        .limit(6);
      setFeaturedNotes(data || []);
      setTotalNotes(count || 0);
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/notes?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/notes');
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice search requires Google Chrome.");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'te-IN';
    r.onstart = () => setIsListening(true);
    r.onend   = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = (event: any) => {
      const t = event.results[0][0].transcript;
      setSearchQuery(t);
      setIsListening(false);
      navigate(`/notes?q=${encodeURIComponent(t)}`);
    };
    r.start();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -left-40 w-[500px] h-[500px] bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-purple-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-800 rounded-full opacity-10 blur-3xl" />
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <span className="text-indigo-300 text-sm font-medium">Free for all AP & TS students</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Education for
            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              everyone, everywhere.
            </span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Discover free notes, textbooks & question papers for government school students.
            Find resources in <strong className="text-white">Telugu & English medium</strong> — verified by admins.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative mb-8">
            <div className="relative flex items-center">
              <div className="absolute left-5 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="home-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search — e.g. '10th class science notes'…"
                className="w-full pl-14 pr-36 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base shadow-2xl"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                  title="Voice search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/notes"
              className="px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-indigo-500/30 text-sm"
            >
              📚 Browse Library
            </Link>
            {!user ? (
              <Link
                to="/register"
                className="px-7 py-3 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-semibold rounded-2xl transition-all text-sm"
              >
                Join Community →
              </Link>
            ) : (
              <Link
                to="/upload"
                className="px-7 py-3 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-semibold rounded-2xl transition-all text-sm"
              >
                ⬆️ Upload a Note
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Live Stats ── */}
      <section className="relative max-w-5xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-center hover:border-indigo-500/30 transition-all">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Notes ── */}
      {featuredNotes.length > 0 && (
        <section className="relative max-w-7xl mx-auto px-4 mb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">🔥 Most Downloaded</h2>
              <p className="text-slate-400 text-sm mt-1">{totalNotes} notes available in the library</p>
            </div>
            <Link to="/notes" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredNotes.map(note => {
              const gradient = subjectColors[note.subject] || 'from-indigo-500 to-purple-600';
              const icon = subjectIcons[note.subject] || '📄';
              return (
                <div key={note.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group">
                  <div className={`bg-gradient-to-br ${gradient} p-4 flex items-center justify-between`}>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold text-white">
                      {icon}
                    </div>
                    <span className="text-white/80 text-xs bg-white/20 px-2 py-0.5 rounded-full">{note.class_name}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1">{note.subject}</p>
                    <h3 className="text-white font-semibold text-sm mb-3 line-clamp-2 group-hover:text-indigo-300 transition-colors">{note.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{note.language}</span>
                      <Link to="/notes" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition">
                        Download →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="relative max-w-7xl mx-auto px-4 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Why EduShare?</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Built for government school students across Andhra Pradesh & Telangana.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
              <div className={`w-12 h-12 bg-gradient-to-br ${f.gradient} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative max-w-4xl mx-auto px-4 mb-20">
        <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Have notes to share?</h2>
          <p className="text-slate-300 mb-7 max-w-lg mx-auto">
            Help thousands of students by uploading your notes. Every contribution makes a difference.
          </p>
          <Link
            to={user ? '/upload' : '/register'}
            className="inline-block px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-indigo-500/30"
          >
            {user ? '⬆️ Upload Now' : 'Get Started Free'}
          </Link>
        </div>
      </section>

      {/* Voice listening indicator */}
      {isListening && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-red-500/30 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl z-50">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          <p className="text-white font-medium text-sm">Listening… speak in Telugu or English</p>
        </div>
      )}
    </div>
  );
};

export default Home;
