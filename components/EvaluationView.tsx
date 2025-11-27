import React, { useState } from 'react';
import { ArrowLeft, Play, Pause, FastForward, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import { Button, Card, Badge } from './ui';
import { Candidate, CandidateStatus } from '../types';

interface EvaluationViewProps {
  candidateId: string;
  onBack: () => void;
}

// Mock details fetching
const MOCK_DETAILS = {
  questions: [
    { id: 'q1', text: 'Why do you want to work as a Frontend Developer?', duration: 120 },
    { id: 'q2', text: 'Describe a challenging bug you fixed.', duration: 180 },
    { id: 'q3', text: 'Explain React useEffect hook to a junior.', duration: 150 },
  ],
  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" // Placeholder video
};

const EvaluationView: React.FC<EvaluationViewProps> = ({ candidateId, onBack }) => {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<CandidateStatus>(CandidateStatus.IN_REVIEW);

  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeed = (speed: number) => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reviewing: Nguyen Van A</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-500">Frontend Developer</span>
            <Badge status={status} />
          </div>
        </div>
        <div className="ml-auto flex gap-2">
           <Button variant="danger" onClick={() => setStatus(CandidateStatus.REJECTED)} disabled={status === CandidateStatus.REJECTED}>Reject</Button>
           <Button variant="primary" className="bg-green-600 hover:bg-green-700" onClick={() => setStatus(CandidateStatus.PASSED)} disabled={status === CandidateStatus.PASSED}>Pass Candidate</Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Col: Video Player & Questions */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <Card className="aspect-video bg-black relative overflow-hidden group flex-shrink-0">
            <video 
              ref={videoRef}
              src={MOCK_DETAILS.videoUrl} 
              className="w-full h-full object-contain"
              onEnded={() => setIsPlaying(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-blue-400">
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <div className="flex-1 h-1 bg-slate-600 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-1/3"></div>
              </div>
              <div className="flex gap-2 text-white text-sm font-medium">
                <button onClick={() => handleSpeed(1)} className="hover:text-blue-400">1x</button>
                <button onClick={() => handleSpeed(1.5)} className="hover:text-blue-400">1.5x</button>
                <button onClick={() => handleSpeed(2)} className="hover:text-blue-400">2x</button>
              </div>
            </div>
          </Card>

          <Card className="flex-1 overflow-y-auto">
             <div className="p-4 border-b border-slate-100 font-semibold text-slate-700">Interview Questions</div>
             <div className="divide-y divide-slate-100">
               {MOCK_DETAILS.questions.map((q, idx) => (
                 <button 
                  key={q.id}
                  onClick={() => setActiveQuestion(idx)}
                  className={`w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors ${activeQuestion === idx ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                 >
                   <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeQuestion === idx ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                     {idx + 1}
                   </div>
                   <div>
                     <p className={`text-sm font-medium ${activeQuestion === idx ? 'text-blue-900' : 'text-slate-700'}`}>{q.text}</p>
                     <p className="text-xs text-slate-500 mt-1">Duration: {q.duration}s</p>
                   </div>
                   {idx < activeQuestion && <CheckCircle size={16} className="text-green-500 ml-auto" />}
                 </button>
               ))}
             </div>
          </Card>
        </div>

        {/* Right Col: Evaluation Form */}
        <Card className="flex flex-col h-full overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">Evaluation</div>
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            
            {/* Score */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Score (0-100)</label>
              <input 
                type="number" 
                min="0" max="100"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Criteria */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Quick Ratings</label>
              {['Technical Accuracy', 'Communication', 'Problem Solving', 'Culture Fit'].map((criteria) => (
                <div key={criteria} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">{criteria}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} className="w-6 h-6 rounded bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 flex items-center justify-center text-xs">
                        {star}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Review Notes</label>
              <textarea 
                className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                placeholder="Write your feedback here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">AI Transcript Analysis (Demo)</h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                    The candidate demonstrates strong understanding of React lifecycles. However, the explanation of the dependency array was slightly ambiguous. Overall sentiment: Positive.
                </p>
            </div>
          </div>
          <div className="p-4 border-t border-slate-200">
            <Button className="w-full">Save Evaluation</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EvaluationView;
