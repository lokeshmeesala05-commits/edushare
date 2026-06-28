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
    <div className="flex-1 w-full bg-brand-bg dark:bg-slate-950 transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-24 max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-gradient-to-br from-brand-primary/5 to-brand-emerald/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-300 text-sm font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-emerald" />
            Free for all AP & TS students
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-text dark:text-white mb-6 leading-tight">
            Education for <br className="hidden lg:block"/>
            <span className="text-brand-primary">everyone, everywhere.</span>
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Discover free notes, textbooks & question papers for government school students. Find resources in <span className="font-semibold text-brand-emerald">Telugu</span> & <span className="font-semibold text-brand-emerald">English</span> medium — verified by admins.
          </p>

          <form onSubmit={handleSearch} className="relative w-full max-w-xl mb-10 group z-10">
            <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full p-2 shadow-lg focus-within:ring-4 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all">
              <div className="pl-4 pr-2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search – e.g. '10th class science notes'..."
                className="flex-1 bg-transparent border-none px-2 text-brand-text dark:text-white placeholder-slate-400 outline-none focus:ring-0 text-sm sm:text-base"
              />
              <button type="button" onClick={handleVoiceSearch} className="p-2 text-slate-400 hover:text-brand-primary transition-colors mx-1" title="Voice Search">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              <button type="submit" className="px-6 py-2.5 bg-brand-primary hover:bg-brand-navy text-white font-semibold rounded-full transition-all shadow-md">
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center lg:justify-start gap-4 relative z-10">
            <Link to="/notes" className="px-6 py-3 bg-brand-primary hover:bg-brand-navy text-white font-semibold rounded-xl transition-all shadow-md shadow-brand-primary/20 flex items-center gap-2">
              📚 Browse Library
            </Link>
            <Link to="/upload" className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-brand-text dark:text-white font-semibold border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload a Note
            </Link>
          </div>
        </div>
        
        {/* Hero Educational Illustration */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none relative z-10 hidden sm:block">
           <div className="relative p-4 md:p-6 flex justify-center items-center">
             <img src="/hero-illustration.png" alt="Education Illustration" className="w-full max-w-md h-auto object-contain animate-float-delayed drop-shadow-2xl" />
             {/* Background blobs */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-brand-primary/10 rounded-full blur-3xl -z-10" />
           </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20 pt-4 max-w-7xl mx-auto relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Notes Available', value: realStats.notes, icon: '📘', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
            { label: 'Total Downloads', value: realStats.downloads, icon: '⬇️', color: 'text-brand-emerald', bg: 'bg-brand-emerald/10' },
            { label: 'Subjects Covered', value: realStats.subjects, icon: '📙', color: 'text-brand-amber', bg: 'bg-brand-amber/10' },
            { label: 'Registered Students', value: realStats.users, icon: '🎓', color: 'text-brand-navy', bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 hover:-translate-y-1 transition-transform">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${stat.bg}`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-text dark:text-white mb-0.5">{stat.value}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Notes */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-brand-text dark:text-white flex items-center gap-2">
              🔥 Popular Notes
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Top downloaded materials in the library</p>
          </div>
          <Link to="/notes" className="text-sm font-semibold text-brand-primary hover:text-brand-navy mt-4 sm:mt-0 flex items-center gap-1 group">
            View all <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredNotes.map((note) => {
            // Extract colors for the top border and icon
            let colorCode = 'border-brand-primary text-brand-primary bg-brand-primary/10';
            if(note.subject === 'Science' || note.subject === 'Biology') colorCode = 'border-brand-emerald text-brand-emerald bg-brand-emerald/10';
            if(note.subject === 'Social Studies') colorCode = 'border-brand-amber text-brand-amber bg-brand-amber/10';
            if(note.subject === 'Telugu') colorCode = 'border-orange-500 text-orange-500 bg-orange-100';
            if(note.subject === 'English') colorCode = 'border-purple-500 text-purple-500 bg-purple-100';

            const icon = subjectIcons[note.subject] || '📄';
            
            return (
              <div key={note.id} className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 border-t-4 ${colorCode.split(' ')[0]} hover:-translate-y-1.5 hover:shadow-md transition-all group flex flex-col`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${colorCode.split(' ')[2]} ${colorCode.split(' ')[1]}`}>
                    {icon}
                  </div>
                  <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                    {note.class_name} Class
                  </span>
                </div>
                
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${colorCode.split(' ')[1]}`}>{note.subject}</p>
                <h3 className="font-bold text-brand-text dark:text-white text-lg mb-3 line-clamp-2 leading-tight flex-1">{note.title}</h3>
                
                <div className="flex flex-col gap-2 text-xs text-slate-500 mb-5">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {note.downloads_count || 0} downloads
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 text-center">🌍</span>
                    {note.language} Medium
                  </span>
                </div>
                
                <Link to={`/notes/${note.id}`} className="text-xs font-semibold text-brand-primary flex items-center justify-end gap-1 group-hover:text-brand-navy">
                  View Details <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-brand-text dark:text-white mb-4">Why EduShare?</h2>
            <p className="text-slate-500 dark:text-slate-400">Built for government school students across Andhra Pradesh & Telangana.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-start hover:-translate-y-1 transition-transform">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-6 bg-brand-primary/10 text-brand-primary`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-brand-text dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-[2rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
          
          <div className="w-48 hidden md:block shrink-0">
             <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-6xl shadow-inner relative">
               👨‍💻
               <div className="absolute -top-4 -right-4 w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
               </div>
             </div>
          </div>

          <div className="flex-1 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-text dark:text-white mb-4">Have notes to share?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mb-8 max-w-lg mx-auto">
              Help thousands of students by uploading your notes. Every contribution makes a difference.
            </p>
            <Link to="/upload" className="inline-flex items-center justify-center px-8 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-navy transition-colors shadow-md gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload Now
            </Link>
          </div>

          <div className="w-48 hidden md:block shrink-0 relative">
             <div className="w-full aspect-square bg-brand-emerald/10 dark:bg-brand-emerald/5 rounded-3xl flex items-center justify-center text-7xl shadow-sm border border-brand-emerald/20 rotate-6 relative">
               📁
               <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-brand-emerald rounded-full flex items-center justify-center text-white shadow-lg">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
               </div>
             </div>
          </div>
          
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
