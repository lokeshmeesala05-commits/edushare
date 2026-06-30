import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { HeroIllustration } from '../components/HeroIllustration';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface FeaturedNote {
  id: string;
  title: string;
  subject: string;
  class_name: string;
  language: string;
  downloads_count: number;
}

const subjectIcons: Record<string, string> = {
  Mathematics: '∑', Science: '⚗', 'Social Studies': '🌍',
  Telugu: 'అ', English: 'A', Physics: '⚡', Chemistry: '🧪', Biology: '🧬',
};


const FEATURES = [
  {
    icon: '🎤',
    title: 'Voice Search',
    desc: 'Speak in Telugu or English to instantly find notes without typing a single letter.',
    gradient: 'from-blue-500 to-blue-600',
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
    gradient: 'from-blue-400 to-blue-500',
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredNotes, setFeaturedNotes] = useState<FeaturedNote[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [realStats, setRealStats] = useState({ notes: 0, downloads: 0, subjects: 0, users: 0 });

  // Scroll reveal hooks for sections
  const statsRef = useScrollReveal();
  const popularRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const ctaRef = useScrollReveal();

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
    <div className="flex-1 w-full bg-transparent transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-24 lg:pb-24 max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12">
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left z-10 w-full">
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-bold shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              Learning for Everyone
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              AI Powered Learning
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Free Downloads
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-extrabold tracking-tight text-brand-text dark:text-white mb-4 sm:mb-6 leading-tight">
            Education for <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 animate-gradient-x">everyone, everywhere.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mb-8 sm:mb-10 leading-relaxed font-medium">
            Discover free notes, textbooks, previous papers and AI-powered learning resources for students. Learn smarter in one place.
          </p>

          <form onSubmit={handleSearch} className="relative w-full max-w-xl mb-8 sm:mb-10 group z-10">
            <div className="relative flex flex-col sm:flex-row items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-blue-500/30 rounded-2xl sm:rounded-[2rem] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_40px_rgb(37,99,235,0.15)] focus-within:ring-4 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-all duration-300 gap-2 sm:gap-0">
              <div className="hidden sm:block pl-5 pr-3 text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search '10th science'..."
                className="w-full sm:flex-1 bg-transparent border-none px-4 sm:px-2 py-3 sm:py-0 text-brand-text dark:text-white placeholder-slate-400 font-medium outline-none focus:ring-0 text-base"
              />
              <div className="flex items-center gap-3 w-full sm:w-auto px-2 sm:px-0">
                <button type="button" onClick={handleVoiceSearch} className="flex-1 sm:flex-none flex justify-center items-center p-3 sm:p-3 bg-slate-100/80 dark:bg-slate-800/80 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl sm:rounded-[1.5rem] transition-colors shadow-sm border border-slate-200 dark:border-slate-700" title="Voice Search">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
                <button type="submit" className="flex-1 sm:flex-none flex justify-center items-center px-8 py-3.5 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl sm:rounded-[1.5rem] transition-all shadow-lg hover:shadow-blue-500/25 text-lg">
                  Search
                </button>
              </div>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 relative z-10 w-full sm:w-auto">
            <Link to="/notes" className="w-full sm:w-auto justify-center px-8 py-3.5 bg-brand-text dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-brand-text font-extrabold rounded-xl sm:rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2">
              📚 Browse Library
            </Link>
            <Link to="/upload" className="w-full sm:w-auto justify-center px-8 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur hover:bg-white dark:hover:bg-slate-700 text-brand-text dark:text-white font-bold border-2 border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload Note
            </Link>
          </div>
        </div>
        
        {/* Hero Educational Illustration */}
        <div className="flex-1 w-full max-w-md sm:max-w-lg md:max-w-none relative z-10 mt-12 md:mt-0 flex justify-center">
           <div className="relative p-4 md:p-6 w-full flex justify-center items-center">
             <HeroIllustration className="w-full max-w-2xl h-auto object-contain animate-float-delayed drop-shadow-2xl relative z-10" />
           </div>
        </div>

      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="px-4 sm:px-6 lg:px-8 pb-16 pt-8 max-w-7xl mx-auto relative z-20 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Notes Available', value: realStats.notes, icon: '📘', gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
            { label: 'Total Downloads', value: realStats.downloads, icon: '⬇️', gradient: 'from-emerald-500 to-green-500', shadow: 'shadow-emerald-500/20' },
            { label: 'Subjects Covered', value: realStats.subjects, icon: '📙', gradient: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/20' },
            { label: 'Registered Students', value: realStats.users, icon: '🎓', gradient: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/20' },
          ].map((stat, i) => (
            <div key={i} className={`bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-default group animate-float`} style={{ animationDelay: `${i * 0.2}s` }}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <div className="text-4xl font-extrabold text-brand-text dark:text-white mb-2">{stat.value}</div>
              <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Notes */}
      <section ref={popularRef} className="px-4 sm:px-6 lg:px-8 pb-24 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10">
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredNotes.map((note) => {
            // Extract gamified colors
            let colorCode = 'border-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:border-blue-500';
            if(note.subject === 'Science' || note.subject === 'Biology') colorCode = 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-500';
            if(note.subject === 'Social Studies') colorCode = 'border-orange-400 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:border-orange-500';
            if(note.subject === 'Telugu') colorCode = 'border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:border-rose-500';
            if(note.subject === 'English') colorCode = 'border-purple-400 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:border-purple-500';

            const icon = subjectIcons[note.subject] || '📄';
            
            return (
              <div key={note.id} className={`relative overflow-hidden group bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-md border border-slate-100 dark:border-slate-800 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer`} onClick={() => navigate(`/notes/${note.id}`)}>
                {/* Background decorative gradient */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${colorCode.split(' ')[1]}`} />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${colorCode.split(' ')[1]} ${colorCode.split(' ')[2]} ${colorCode.split(' ')[4] || ''}`}>
                    {icon}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-full shadow-sm">
                      {note.class_name} Class
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${colorCode.split(' ')[1]} ${colorCode.split(' ')[2]} ${colorCode.split(' ')[4] || ''}`}>
                      {note.subject}
                    </span>
                  </div>
                </div>
                
                <h3 className="font-extrabold text-brand-text dark:text-white text-xl mb-4 line-clamp-2 leading-tight flex-1 relative z-10">{note.title}</h3>
                
                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium mb-6 relative z-10">
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {note.downloads_count || 0}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="w-4 text-center">🌍</span>
                    {note.language}
                  </span>
                </div>
                
                <button className={`mt-auto w-full py-3 rounded-xl font-bold flex items-center justify-center transition-all shadow-md ${colorCode.split(' ')[1]} ${colorCode.split(' ')[2]} ${colorCode.split(' ')[4] || ''} hover:opacity-90 relative z-10`}>
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-brand-text dark:text-white mb-6">Why EduShare?</h2>
            <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 font-medium">Built to empower students everywhere with seamless access to high-quality educational materials.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 shadow-md border border-slate-100 dark:border-slate-800 flex flex-col items-start hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-10 bg-gradient-to-br ${feature.gradient}`} />
                <div className="flex justify-between w-full items-start mb-8 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                    <svg className="w-5 h-5 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-brand-text dark:text-white mb-4 relative z-10">{feature.title}</h3>
                <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium relative z-10">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-blue-500 rounded-[3rem] p-10 sm:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl">
          
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="w-32 sm:w-48 hidden md:block shrink-0 z-10">
             <div className="w-full h-full flex items-end justify-center text-[100px] sm:text-[130px] drop-shadow-2xl animate-float">
               👨‍💻
             </div>
          </div>

          <div className="flex-1 text-center z-10">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 drop-shadow-md tracking-tight">📂 Share Your Knowledge</h2>
            <p className="text-blue-100 text-lg sm:text-xl mb-10 max-w-lg mx-auto font-medium leading-relaxed">
              Help thousands of students by sharing your notes, question papers, and study materials.
            </p>
            <Link to="/upload" className="inline-flex items-center justify-center px-10 py-5 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 hover:scale-105 transition-all shadow-2xl gap-3 text-xl border-4 border-white/20 hover:border-white/40">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload Materials Now
            </Link>
          </div>

          <div className="w-32 sm:w-48 hidden md:block shrink-0 relative z-10">
             <div className="w-full h-full flex items-end justify-center text-[100px] sm:text-[130px] drop-shadow-2xl animate-float-delayed rotate-6">
               📁
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
