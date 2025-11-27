import React from 'react';
import { Video, Building2 } from 'lucide-react';
import CandidateView from './components/CandidateView';
import { InterviewFlow } from './types';

// Mock Interview Flow Data matching the requirements
const MOCK_FLOW: InterviewFlow = {
  id: 'flow-1',
  title: 'Phỏng vấn Sơ tuyển - Frontend Developer',
  jobRole: 'Frontend Developer',
  questions: [
    { 
      id: '1', 
      text: 'Hãy giới thiệu ngắn gọn về bản thân và kinh nghiệm làm việc với ReactJS.', 
      prepTimeSeconds: 30, 
      maxAnswerTimeSeconds: 120,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // Video Added
    },
    { 
      id: '2', 
      text: 'Chúng tôi có một tình huống cho bạn: Một API quan trọng bị lỗi 500 trên Production. Quy trình xử lý của bạn là gì?', 
      prepTimeSeconds: 60, 
      maxAnswerTimeSeconds: 180,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    { 
      id: '3', 
      text: 'Bạn có câu hỏi nào đặt ra cho chúng tôi về văn hóa công ty không?', 
      prepTimeSeconds: 30, 
      maxAnswerTimeSeconds: 90,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // Video Added
    }
  ]
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex-none flex items-center px-4 md:px-8 shadow-sm z-20">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Video size={18} />
          </div>
          <span className="hidden md:inline">AsyncInterview Pro</span>
        </div>
        <div className="mx-auto font-medium text-slate-600 md:hidden">
          Frontend Developer
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold text-slate-900">Ứng viên: Nguyen Van A</div>
            <div className="text-xs text-slate-500">ID: #CAND-8832</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
            NA
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
        <CandidateView flow={MOCK_FLOW} onComplete={() => window.location.reload()} />
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-sm">
        &copy; 2024 AsyncInterview Platform. Powered by Gemini AI.
      </footer>
    </div>
  );
};

export default App;