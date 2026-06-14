import React, { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';

interface Note {
  id: string;
  title: string;
  subject: string;
  class_name: string;
  language: string;
  downloads_count: number;
  file_url: string;
}

interface RecommendationsProps {
  currentSubject: string;
  currentClass: string;
  excludeIds?: string[];
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

// Related subjects map — if you're browsing Science, also suggest Physics/Biology
const RELATED_SUBJECTS: Record<string, string[]> = {
  Science:      ['Biology', 'Chemistry', 'Physics'],
  Physics:      ['Mathematics', 'Chemistry', 'Science'],
  Chemistry:    ['Biology', 'Physics', 'Science'],
  Biology:      ['Science', 'Chemistry'],
  Mathematics:  ['Physics', 'Science'],
  English:      ['Telugu', 'Social Studies'],
  Telugu:       ['English', 'Social Studies'],
  'Social Studies': ['English', 'Telugu'],
};

const Recommendations: React.FC<RecommendationsProps> = ({
  currentSubject,
  currentClass,
  excludeIds = [],
}) => {
  const [recommendations, setRecommendations] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentSubject && !currentClass) {
      setLoading(false);
      return;
    }
    fetchRecommendations();
  }, [currentSubject, currentClass]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Get related subjects
      const relatedSubjects = RELATED_SUBJECTS[currentSubject] || [];

      // Strategy 1: Same class, same subject — ordered by downloads
      const { data: sameClass } = await supabase
        .from('notes')
        .select('id,title,subject,class_name,language,downloads_count,file_url')
        .eq('approval_status', 'approved')
        .eq('class_name', currentClass)
        .eq('subject', currentSubject)
        .order('downloads_count', { ascending: false })
        .limit(3);

      // Strategy 2: Related subjects, same class
      let relatedNotes: Note[] = [];
      if (relatedSubjects.length > 0) {
        const { data: related } = await supabase
          .from('notes')
          .select('id,title,subject,class_name,language,downloads_count,file_url')
          .eq('approval_status', 'approved')
          .eq('class_name', currentClass)
          .in('subject', relatedSubjects)
          .order('downloads_count', { ascending: false })
          .limit(3);
        relatedNotes = related || [];
      }

      // Merge, deduplicate, exclude current results
      const all = [...(sameClass || []), ...relatedNotes];
      const seen = new Set(excludeIds);
      const unique = all.filter(n => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      });

      setRecommendations(unique.slice(0, 4));
    } catch (err) {
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || recommendations.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
        <h2 className="text-lg font-bold text-white">
          ✨ You might also like
        </h2>
        <span className="text-xs text-slate-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
          AI Picks
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map(note => {
          const gradient = subjectColors[note.subject] || 'from-indigo-500 to-purple-600';
          const icon = subjectIcons[note.subject] || '📄';
          return (
            <div
              key={note.id}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
            >
              {/* Compact header */}
              <div className={`bg-gradient-to-br ${gradient} px-4 py-3 flex items-center justify-between`}>
                <span className="text-lg">{icon}</span>
                <span className="text-white/70 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{note.class_name}</span>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1">{note.subject}</p>
                <h3 className="text-white text-sm font-medium line-clamp-2 mb-3 group-hover:text-indigo-300 transition-colors">
                  {note.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">⬇️ {note.downloads_count || 0}</span>
                  <a
                    href={note.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
                  >
                    Download →
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 mt-3 text-center">
        Suggestions based on your selected subject &amp; class
      </p>
    </div>
  );
};

export default Recommendations;
