import React from 'react';
import { BookOpen, HelpCircle, List, Layers, Languages } from 'lucide-react';

interface QuickActionsProps {
  onActionSelect: (action: string) => void;
  disabled: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionSelect, disabled }) => {
  const actions = [
    { id: 'summarize', label: 'Summarize', icon: BookOpen, prompt: 'Please provide a comprehensive summary of this document, highlighting the main topics and key takeaways.' },
    { id: 'mcqs', label: 'Generate MCQs', icon: HelpCircle, prompt: 'Generate 5 multiple-choice questions based on the most important concepts in this document. Provide the answers at the end.' },
    { id: 'key_points', label: 'Key Points', icon: List, prompt: 'Extract the most important key points and formulas/definitions from this document as a bulleted list.' },
    { id: 'flashcards', label: 'Flashcards', icon: Layers, prompt: 'Create 5 study flashcards from this document. Format as "Q: [Question] | A: [Answer]".' },
    { id: 'translate', label: 'Explain in Telugu', icon: Languages, prompt: 'Explain the main concepts of this document clearly in Telugu.' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2 px-4">
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            disabled={disabled}
            onClick={() => onActionSelect(action.prompt)}
            className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-xs font-medium border border-white/5 transition-colors disabled:opacity-50"
          >
            <Icon className="w-3.5 h-3.5" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
};
