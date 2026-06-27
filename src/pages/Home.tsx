import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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
    icon: '🤖',
    title: 'AI Tutor (EduBot)',
    desc: 'Chat with our smart AI. It reads your PDFs and answers your questions in English and Telugu.',
    gradient: 'from-blue-500 to-cyan-600',
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredNotes, setFeaturedNotes] = useState<FeaturedNote[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [realStats, setRealStats] = useState({ notes: 0, downloads: 0, subjects: 0, users: 0 });

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase
        .from('notes')
        .select('id,title,subject,class_name,language,downloads_count', { count: 'exact' })
        .eq('approval_status', 'approved')
        .order('downloads_count', { ascending: false })
        .limit(6);
      setFeaturedNotes(data || []);


      // Fetch real stats
      const { data: allNotes } = await supabase
        .from('notes')
        .select('subject, downloads_count')
        .eq('approval_status', 'approved');

      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (allNotes) {
        const totalDownloads = allNotes.reduce((s, n) => s + (n.downloads_count || 0), 0);
        const uniqueSubjects = new Set(allNotes.map(n => n.subject)).size;
        setRealStats({
          notes: allNotes.length,
          downloads: totalDownloads,
          subjects: uniqueSubjects,
          users: userCount || 0,
        });
      }
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
    <div className="flex-1 w-full bg-slate-50 dark:bg-transparent transition-colors duration-200">
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-[100px] rounded-full pointer-events-none hidden dark:block" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Free for all AP & TS students
        </div>

        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 relative z-10">
          Education for <span className="text-indigo-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-indigo-400 dark:to-purple-400">everyone,</span> everywhere.
        </h1>
        
        <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10 relative z-10">
          Discover free notes, textbooks & question papers for government school students. 
          Find resources in <span className="text-slate-900 dark:text-white font-semibold">Telugu & English medium</span> — verified by admins.
        </p>

        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mb-12 group z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity hidden dark:block" />
          <div className="relative flex items-center bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-sm dark:shadow-none transition-all">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search — e.g. '10th class science notes'..."
              className="flex-1 bg-transparent border-none px-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0"
            />
            <button type="button" onClick={handleVoiceSearch} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-md">
              Search
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-4 relative z-10">
          <Link to="/notes" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2">
            <span>📚</span> Browse Library
          </Link>
          <Link to="/upload" className="px-8 py-3.5 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white font-semibold border border-slate-200 dark:border-white/10 rounded-xl transition-all shadow-sm dark:shadow-none flex items-center gap-2">
            <span>📤</span> Upload a Note
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 w-full max-w-4xl mx-auto relative z-10">
          {[
            { label: 'Notes Available', value: realStats.notes, icon: '📚' },
            { label: 'Total Downloads', value: realStats.downloads, icon: '⬇️' },
            { label: 'Subjects Covered', value: realStats.subjects, icon: '📖' },
            { label: 'Registered Students', value: realStats.users, icon: '🎓' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center hover:-translate-y-1 transition-transform shadow-sm dark:shadow-none">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">🔥 Popular Notes</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Top downloaded materials in the library</p>
          </div>
          <Link to="/notes" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredNotes.map((note) => {
            const gradient = subjectColors[note.subject] || 'from-indigo-500 to-purple-600';
            const icon = subjectIcons[note.subject] || '📄';
            return (
              <div key={note.id} className="group relative bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-indigo-500/10">
                <div className={`h-24 bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between`}>
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md text-white font-bold text-sm">
                      {icon}
                    </div>
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-medium rounded-lg">{note.class_name} Class</span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">{note.subject}</p>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{note.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>{note.downloads_count || 0} downloads</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">{note.language} Medium</span>
                    <Link to={`/notes/${note.id}`} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center">View Details <span className="ml-1">→</span></Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why EduShare?</h2>
          <p className="text-slate-600 dark:text-slate-400">Built for government school students across Andhra Pradesh & Telangana.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <div key={i} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:-translate-y-1 transition-transform shadow-sm dark:shadow-none">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-4 shadow-lg`}>{feature.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-900 dark:to-purple-900 border border-indigo-500 dark:border-white/10 rounded-3xl p-10 md:p-16 text-center shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Have notes to share?</h2>
          <p className="text-indigo-100 dark:text-indigo-200 text-lg mb-8 max-w-2xl mx-auto">Help thousands of students by uploading your notes.</p>
          <Link to="/upload" className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-indigo-600 font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"><span>✨</span> Upload Now</Link>
        </div>
      </section>

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
