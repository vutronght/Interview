import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Mic, Wifi, ChevronRight, Video, StopCircle, CheckCircle, AlertCircle, Clock, FileText, PlayCircle } from 'lucide-react';
import { Button, Card } from './ui';
import { InterviewFlow, Recording } from '../types';

interface CandidateViewProps {
  flow: InterviewFlow;
  onComplete: () => void;
}

enum Step {
  OVERVIEW,      // New step: Show list of questions
  TECH_CHECK,    // Check camera/mic
  INSTRUCTIONS,  // Final confirmation
  QUESTION_INTRO,// Avatar/Text asking question
  PREP,          // Thinking time
  RECORDING,     // Recording answer
  UPLOAD,        // Uploading
  FINISHED       // Done
}

const CandidateView: React.FC<CandidateViewProps> = ({ flow, onComplete }) => {
  const [step, setStep] = useState<Step>(Step.OVERVIEW);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = flow.questions[currentQuestionIndex];

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stream]);

  // Connect video element to stream when step changes to TECH_CHECK or RECORDING
  useEffect(() => {
    if (videoRef.current && stream && (step === Step.TECH_CHECK || step === Step.RECORDING)) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, step]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      setError("Cannot access camera/microphone. Please check permissions.");
    }
  };

  const handleNext = useCallback(() => {
    setStep(Step.UPLOAD);
    // Simulate upload delay
    setTimeout(() => {
      if (currentQuestionIndex < flow.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setStep(Step.QUESTION_INTRO);
      } else {
        setStep(Step.FINISHED);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }, 1500);
  }, [currentQuestionIndex, flow.questions.length, stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!stream) return;

    setStep(Step.RECORDING);
    setIsRecording(true);
    setTimeLeft(currentQuestion.maxAnswerTimeSeconds);
    chunksRef.current = [];

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordings(prev => [...prev, { 
        questionId: currentQuestion.id, 
        videoBlob: blob, 
        videoUrl: url 
      }]);
      handleNext();
    };

    mediaRecorder.start();

    // Max time limit
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stream, currentQuestion, handleNext, stopRecording]);

  const startPrep = () => {
    setStep(Step.PREP);
    setTimeLeft(currentQuestion.prepTimeSeconds);
    
    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --- Renders ---

  // 1. OVERVIEW SCREEN (List of Questions)
  if (step === Step.OVERVIEW) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold mb-2">{flow.title}</h1>
          <div className="flex items-center gap-4 text-slate-500 text-sm mb-6">
            <span className="flex items-center gap-1"><Clock size={16} /> Est. {Math.round(flow.questions.reduce((acc, q) => acc + q.maxAnswerTimeSeconds + q.prepTimeSeconds, 0) / 60)} mins</span>
            <span className="flex items-center gap-1"><FileText size={16} /> {flow.questions.length} Questions</span>
          </div>
          
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-slate-700 uppercase text-sm tracking-wide">Interview Structure</h3>
            {flow.questions.map((q, idx) => (
              <div key={q.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors">
                <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${q.videoUrl ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'}`}>
                      {q.videoUrl ? 'VIDEO QUESTION' : 'TEXT QUESTION'}
                    </span>
                    <span className="text-xs text-slate-500">Prep: {q.prepTimeSeconds}s | Max Answer: {q.maxAnswerTimeSeconds}s</span>
                  </div>
                  <p className="font-medium text-slate-800">{q.text}</p>
                  {q.videoUrl && (
                     <div className="mt-2 flex items-center gap-2 text-xs text-purple-600 font-medium">
                        <PlayCircle size={14} /> Includes Recruiter Video
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(Step.TECH_CHECK)} className="px-8 py-3 text-lg">
              Start System Check <ChevronRight size={20} className="inline ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TECH CHECK
  if (step === Step.TECH_CHECK) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-4">System Check</h1>
          <p className="text-slate-600 mb-6">Please ensure your camera and microphone are working correctly before proceeding.</p>
          
          <div className="bg-black aspect-video rounded-lg mb-6 overflow-hidden relative flex items-center justify-center">
            {stream ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
            ) : (
              <div className="text-slate-400 flex flex-col items-center">
                <Camera size={48} className="mb-2" />
                <p>Camera preview will appear here</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 mb-6 justify-center">
            <div className={`flex items-center gap-2 ${stream ? 'text-green-600' : 'text-slate-400'}`}>
              <Camera size={20} /> Camera
            </div>
            <div className={`flex items-center gap-2 ${stream ? 'text-green-600' : 'text-slate-400'}`}>
              <Mic size={20} /> Microphone
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Wifi size={20} /> Internet
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 mb-6">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          <div className="flex justify-between items-center">
             <Button variant="secondary" onClick={() => setStep(Step.OVERVIEW)}>Back</Button>
            {!stream ? (
              <Button onClick={startCamera}>Enable Camera & Mic</Button>
            ) : (
              <Button onClick={() => setStep(Step.INSTRUCTIONS)}>
                Continue <ChevronRight size={20} className="inline ml-1" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // 3. INSTRUCTIONS (Final check before start)
  if (step === Step.INSTRUCTIONS) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-4">Ready to Begin?</h1>
          <div className="bg-blue-50 p-6 rounded-xl mb-8 space-y-4 text-blue-900">
             <div className="flex gap-3">
                 <div className="font-bold">1.</div>
                 <div>Once started, the process is automated. Don't close the browser window.</div>
             </div>
             <div className="flex gap-3">
                 <div className="font-bold">2.</div>
                 <div>You will have <strong>{currentQuestion.prepTimeSeconds} seconds</strong> to think about each answer.</div>
             </div>
             <div className="flex gap-3">
                 <div className="font-bold">3.</div>
                 <div>If you finish answering early, click the <strong>"Finish Answer"</strong> button.</div>
             </div>
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(Step.TECH_CHECK)}>Back</Button>
            <Button onClick={() => setStep(Step.QUESTION_INTRO)} className="w-48 justify-center">
                I'm Ready
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 4. FINISHED
  if (step === Step.FINISHED) {
    return (
      <div className="max-w-xl mx-auto text-center mt-12">
        <Card className="p-12">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-slate-800">All Done!</h2>
          <p className="text-slate-600 mb-8 text-lg">Thank you for completing the interview. Your video responses have been securely uploaded.</p>
          <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 mb-8">
            Ref ID: {Date.now().toString(36).toUpperCase()}
          </div>
          <Button onClick={onComplete} variant="outline" className="w-full">Return to Home</Button>
        </Card>
      </div>
    );
  }

  // ACTIVE INTERVIEW WRAPPER (Intro -> Prep -> Record)
  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-slate-500">Question {currentQuestionIndex + 1} of {flow.questions.length}</h2>
        <div className="flex gap-1">
          {flow.questions.map((_, idx) => (
            <div key={idx} className={`h-2 w-8 rounded-full ${idx <= currentQuestionIndex ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-6 flex-col md:flex-row min-h-0">
        <Card className="flex-1 relative overflow-hidden flex flex-col bg-slate-900 border-none shadow-xl">
           
           {/* Step: Question Intro (Avatar or Text) */}
           {step === Step.QUESTION_INTRO && (
             <div className="absolute inset-0 flex flex-col bg-white">
                {currentQuestion.videoUrl ? (
                    <div className="flex-1 relative bg-black">
                         <video 
                           src={currentQuestion.videoUrl} 
                           autoPlay 
                           controls={false}
                           className="w-full h-full object-contain"
                           onEnded={startPrep}
                         />
                         <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-lg text-white">
                             <p className="text-lg font-medium">{currentQuestion.text}</p>
                         </div>
                         <Button onClick={startPrep} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border-none">Skip Video</Button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                           <FileText size={40} className="text-blue-600" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-slate-800 leading-tight">{currentQuestion.text}</h3>
                        <div className="flex gap-4 text-slate-500">
                            <span className="bg-slate-100 px-3 py-1 rounded-full text-sm">Prep: {currentQuestion.prepTimeSeconds}s</span>
                            <span className="bg-slate-100 px-3 py-1 rounded-full text-sm">Answer: {currentQuestion.maxAnswerTimeSeconds}s</span>
                        </div>
                    </div>
                )}
                
                {/* Intro Footer Action */}
                {!currentQuestion.videoUrl && (
                    <div className="p-6 border-t border-slate-100 flex justify-center bg-slate-50">
                        <Button onClick={startPrep} className="w-48 py-3 text-lg">Start Preparation</Button>
                    </div>
                )}
             </div>
           )}

           {/* Step: Prep Time */}
           {step === Step.PREP && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-8">
               <div className="relative mb-8">
                  <svg className="w-40 h-40 transform -rotate-90">
                     <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                     <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-blue-500 transition-all duration-1000 ease-linear" strokeDasharray={440} strokeDashoffset={440 - (440 * timeLeft) / currentQuestion.prepTimeSeconds} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold font-mono">
                      {timeLeft}
                  </div>
               </div>
               
               <p className="text-slate-400 mb-8 uppercase tracking-widest text-sm font-semibold">Preparation Time</p>
               
               <div className="max-w-2xl text-center bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                 <p className="text-xl text-white font-medium leading-relaxed">"{currentQuestion.text}"</p>
               </div>
               
               <Button onClick={() => { if(timerRef.current) clearInterval(timerRef.current); startRecording(); }} className="mt-8 bg-white text-slate-900 hover:bg-slate-200 px-8">
                 Skip Prep & Record Now
               </Button>
             </div>
           )}

           {/* Step: Recording */}
           {step === Step.RECORDING && (
              <>
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-3 animate-pulse font-medium shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  {timeLeft}s remaining
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center">
                   <div className="bg-black/40 backdrop-blur-md text-white p-4 rounded-xl max-w-2xl w-full text-center mb-6 border border-white/10">
                      <p className="text-lg font-medium">{currentQuestion.text}</p>
                   </div>
                   <Button onClick={stopRecording} variant="danger" className="flex items-center gap-2 px-8 py-4 rounded-full text-lg shadow-xl hover:scale-105 transition-transform">
                     <StopCircle size={24} /> Finish Answer
                   </Button>
                </div>
              </>
           )}

           {/* Step: Uploading */}
           {step === Step.UPLOAD && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
               <div className="relative w-20 h-20 mb-6">
                   <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Saving your response...</h3>
               <p className="text-slate-500">Please do not close this window.</p>
             </div>
           )}
        </Card>
      </div>
    </div>
  );
};

export default CandidateView;