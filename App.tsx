import React from 'react';
import { Video } from 'lucide-react';
import CandidateView from './components/CandidateView';
import { InterviewFlow } from './types';

// Mock Interview Flow Data
const MOCK_FLOW: InterviewFlow = {
  id: 'flow-1',
  title: 'Senior Frontend Developer Interview',
  jobRole: 'Frontend Developer',
  questions: [
    { 
      id: '1', 
      text: 'Tell us about your experience with React and TypeScript.', 
      prepTimeSeconds: 30, 
      maxAnswerTimeSeconds: 120,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // Mock avatar video
    },
    { 
      id: '2', 
      text: 'How do you handle state management in complex applications?', 
      prepTimeSeconds: 45, 
      maxAnswerTimeSeconds: 180 
    },
    { 
      id: '3', 
      text: 'Describe a time you had a conflict with a team member and how you resolved it.', 
      prepTimeSeconds: 60, 
      maxAnswerTimeSeconds: 180,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
  ]
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 md:px-8 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Video size={18} />
          </div>
          AsyncInterview
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold text-slate-900">Nguyen Van A</div>
            <div className="text-xs text-slate-500">Candidate ID: #8832</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
            NA
          </div>
        </div>
      </header>
      
      <main className="container mx-auto max-w-5xl p-4 md:p-8">
        <CandidateView flow={MOCK_FLOW} onComplete={() => window.location.reload()} />
      </main>
    </div>
  );
};

export default App;