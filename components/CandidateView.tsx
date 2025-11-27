import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Mic, Wifi, ChevronRight, Video, StopCircle, CheckCircle, AlertCircle, Clock, FileText, MonitorPlay, Zap, Armchair, RotateCcw, Calendar, User, Upload, Hourglass, CloudUpload } from 'lucide-react';
import { Button, Card } from './ui';
import { InterviewFlow, Recording } from '../types';

interface CandidateViewProps {
  flow: InterviewFlow;
  onComplete: () => void;
}

enum Step {
  INPUT_AGE,     // Step 1: Birth year check
  INPUT_CV,      // Step 2: Upload CV
  OVERVIEW,      // Welcome & Process intro (No question list)
  TECH_CHECK,    // Check camera/mic
  INSTRUCTIONS,  // Final confirmation
  QUESTION_INTRO,// Avatar/Text asking question
  PREP,          // 30s Countdown
  RECORDING,     // Recording answer
  UPLOAD,        // Uploading
  FINISHED       // Done
}

const CandidateView: React.FC<CandidateViewProps> = ({ flow, onComplete }) => {
  const [step, setStep] = useState<Step>(Step.INPUT_AGE);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // User Info States
  const [birthYear, setBirthYear] = useState('');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  // Refs
  const cameraVideoRef = useRef<HTMLVideoElement>(null); // For User Camera
  const questionVideoRef = useRef<HTMLVideoElement>(null); // For Question Video playback
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Connect video element to stream (Only for Camera steps)
  useEffect(() => {
    if (cameraVideoRef.current && stream && (step === Step.TECH_CHECK || step === Step.RECORDING || step === Step.PREP)) {
      cameraVideoRef.current.srcObject = stream;
    }
  }, [stream, step]);

  // Handle Upload Progress and Transition
  useEffect(() => {
    if (step === Step.UPLOAD && uploadProgress >= 100) {
      const transitionTimer = setTimeout(() => {
        if (currentQuestionIndex < flow.questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setStep(Step.QUESTION_INTRO);
        } else {
          setStep(Step.FINISHED);
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
      }, 500); // Small delay at 100% before switching
      return () => clearTimeout(transitionTimer);
    }
  }, [step, uploadProgress, currentQuestionIndex, flow.questions.length, stream]);

  const handleNext = useCallback(() => {
    setStep(Step.UPLOAD);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        // Random increment between 2% and 10%
        const increment = Math.random() * 8 + 2;
        const nextValue = prev + increment;
        
        if (nextValue >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return nextValue;
      });
    }, 200); // Update every 200ms
  }, []);

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

  // Handle Prep Step Countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === Step.PREP) {
      setTimeLeft(currentQuestion.prepTimeSeconds); // Normal 30s countdown
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            startRecording(); // Auto start when prep time ends
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, currentQuestion.prepTimeSeconds, startRecording]);

  const handleAgeVerify = () => {
    setAgeError(null);
    const year = parseInt(birthYear);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      setAgeError("Vui lòng nhập năm sinh hợp lệ.");
      return;
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age >= 20 && age <= 30) {
      setStep(Step.INPUT_CV);
    } else {
      setAgeError(`Rất tiếc, vị trí này yêu cầu độ tuổi từ 20-30. (Tuổi của bạn: ${age})`);
    }
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setCvFile(file);
    } else {
      alert("Vui lòng chỉ tải lên định dạng PDF.");
    }
  };

  const requestPermissionsAndStart = async () => {
    try {
      setError(null);
      // Explicitly request permissions only when this function is called by user interaction
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setStep(Step.TECH_CHECK);
    } catch (err) {
      console.error(err);
      setError("Không thể truy cập Camera/Micro. Vui lòng kiểm tra quyền truy cập trên trình duyệt.");
      // Still move to Tech Check screen to show the error UI
      setStep(Step.TECH_CHECK);
    }
  };

  // --- Renders ---

  // STEP 1: INPUT AGE
  if (step === Step.INPUT_AGE) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Xác thực thông tin</h1>
            <p className="text-slate-500 mt-2">Vui lòng nhập năm sinh của bạn để tiếp tục.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Năm sinh</label>
              <input 
                type="number" 
                placeholder="Ví dụ: 1998"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg text-center tracking-widest"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAgeVerify()}
              />
            </div>
            
            {ageError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle size={16} /> {ageError}
              </div>
            )}

            <Button onClick={handleAgeVerify} className="w-full py-3 text-lg" disabled={!birthYear}>
              Xác nhận
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // STEP 2: INPUT CV
  if (step === Step.INPUT_CV) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Hồ sơ ứng viên</h1>
            <p className="text-slate-500 mt-2">Vui lòng tải lên CV của bạn (định dạng PDF).</p>
          </div>

          <div className="space-y-6">
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${cvFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".pdf" 
                className="hidden" 
                onChange={handleCvUpload}
              />
              
              {cvFile ? (
                <div className="text-green-700">
                  <FileText size={48} className="mx-auto mb-2" />
                  <p className="font-semibold">{cvFile.name}</p>
                  <p className="text-xs text-green-600 mt-1">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="text-xs mt-2 underline">Nhấn để thay đổi</p>
                </div>
              ) : (
                <div className="text-slate-500">
                  <Upload size={48} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">Nhấn để tải lên CV</p>
                  <p className="text-xs text-slate-400 mt-1">Chỉ chấp nhận file PDF</p>
                </div>
              )}
            </div>

            <Button onClick={() => setStep(Step.OVERVIEW)} className="w-full py-3 text-lg" disabled={!cvFile}>
              XÁC NHẬN <ChevronRight size={20} className="inline ml-1" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 1. OVERVIEW SCREEN
  if (step === Step.OVERVIEW) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
          <div className="mb-6 border-b border-slate-100 pb-6">
            <div className="flex justify-between items-start mb-2">
               <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{flow.title}</h1>
               <div className="text-right hidden md:block">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Đã xác thực</span>
               </div>
            </div>
            <p className="text-slate-600 mt-2 text-lg">
              Chào mừng bạn tham gia phỏng vấn vòng một không đồng bộ. Hãy giữ tâm lý thoải mái để hoàn thành bài thi một cách tốt nhất.
            </p>
            
            {/* User Info Summary */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center gap-4 text-sm text-slate-600 border border-slate-200">
               <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  <span>Tuổi: {new Date().getFullYear() - parseInt(birthYear)}</span>
               </div>
               <div className="h-4 w-px bg-slate-300"></div>
               <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  <span>CV: {cvFile?.name}</span>
               </div>
            </div>
          </div>

          {/* Stats summary */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Clock size={16} /> Thời lượng ước tính: {Math.round(flow.questions.reduce((acc, q) => acc + q.maxAnswerTimeSeconds + q.prepTimeSeconds, 0) / 60) + 5} phút
            </div>
            <div className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <FileText size={16} /> {flow.questions.length} Câu hỏi
            </div>
          </div>
          
          {/* Prep Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-blue-300 transition-colors">
                 <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <Zap size={20} />
                 </div>
                 <h3 className="font-bold text-slate-800">Quy trình phỏng vấn</h3>
                 <p className="text-sm text-slate-600 leading-relaxed">
                    Bạn sẽ trả lời lần lượt từng câu hỏi. Mỗi câu hỏi sẽ có thời gian chuẩn bị và thời gian trả lời cố định. Sau khi hoàn thành, hệ thống sẽ tự động chuyển sang câu tiếp theo.
                 </p>
             </div>
             
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-blue-300 transition-colors">
                 <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                    <Armchair size={20} />
                 </div>
                 <h3 className="font-bold text-slate-800">Môi trường & Tâm lý</h3>
                 <p className="text-sm text-slate-600 leading-relaxed">
                    Hãy chọn một nơi yên tĩnh, đủ ánh sáng. Giữ tâm lý thoải mái, tự tin như đang trò chuyện trực tiếp. Bạn có thể uống nước trước khi bắt đầu.
                 </p>
             </div>
          </div>

          {/* Warning Block */}
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-lg text-center">
            <p className="text-red-600 font-bold text-lg flex items-center justify-center gap-2">
               <AlertCircle size={24} />
               Hệ thống sẽ yêu cầu quyền truy cập Camera & Micro.
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <Button onClick={requestPermissionsAndStart} className="w-full md:w-auto px-8 py-3.5 text-lg shadow-lg shadow-blue-200">
              Bắt đầu Kiểm tra Thiết bị <ChevronRight size={20} className="inline ml-1" />
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
        <Card className="p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2 text-slate-900">Kiểm tra thiết bị</h1>
            <p className="text-slate-500">Đảm bảo bạn xuất hiện rõ ràng và âm thanh tốt.</p>
          </div>
          
          <div className="bg-slate-900 aspect-video rounded-xl mb-6 overflow-hidden relative flex items-center justify-center shadow-inner">
            {stream ? (
              <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
            ) : (
              <div className="text-slate-400 flex flex-col items-center animate-pulse">
                <Camera size={64} className="mb-4 opacity-50" />
                <p>Khung hình camera sẽ hiển thị tại đây</p>
              </div>
            )}
            
            {stream && (
               <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Camera đang hoạt động
                  </div>
               </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
             <div className={`flex flex-col items-center justify-center p-4 rounded-lg border ${stream ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <Camera size={24} className="mb-2" />
                <span className="text-sm font-medium">Camera</span>
             </div>
             <div className={`flex flex-col items-center justify-center p-4 rounded-lg border ${stream ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <Mic size={24} className="mb-2" />
                <span className="text-sm font-medium">Microphone</span>
             </div>
             <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-green-50 border-green-200 text-green-700">
                <Wifi size={24} className="mb-2" />
                <span className="text-sm font-medium">Kết nối</span>
             </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3 mb-6 border border-red-100">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" /> 
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
             <Button variant="secondary" onClick={() => setStep(Step.OVERVIEW)}>Quay lại</Button>
            {!stream ? (
              <Button onClick={requestPermissionsAndStart}>Thử lại</Button>
            ) : (
              <Button onClick={() => setStep(Step.INSTRUCTIONS)}>
                Tiếp tục <ChevronRight size={20} className="inline ml-1" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // 3. INSTRUCTIONS
  if (step === Step.INSTRUCTIONS) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-slate-900 text-center">Lưu ý trước khi bắt đầu</h1>
          
          <div className="space-y-4 mb-8">
             <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 items-start">
                 <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-1">1</div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Quy trình tự động</h4>
                    <p className="text-sm text-slate-600">Khi bấm "Bắt đầu", các câu hỏi sẽ xuất hiện lần lượt. Bạn không thể quay lại câu hỏi trước.</p>
                 </div>
             </div>
             <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 items-start">
                 <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-1">2</div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Xem video câu hỏi</h4>
                    <p className="text-sm text-slate-600">Bạn sẽ xem video câu hỏi, sau đó có thời gian chuẩn bị trước khi ghi hình.</p>
                 </div>
             </div>
             <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 items-start">
                 <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-1">3</div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Gửi câu trả lời sớm</h4>
                    <p className="text-sm text-slate-600">Nếu trả lời xong trước thời hạn, hãy nhấn nút "Hoàn thành" để chuyển sang câu tiếp theo.</p>
                 </div>
             </div>
          </div>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(Step.TECH_CHECK)}>Kiểm tra lại</Button>
            <Button onClick={() => setStep(Step.QUESTION_INTRO)} className="w-48 justify-center shadow-lg shadow-blue-100">
                Tôi đã sẵn sàng
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 4. FINISHED
  if (step === Step.FINISHED) {
    return (
      <div className="max-w-xl mx-auto text-center mt-8">
        <Card className="p-12 shadow-xl border-t-4 border-t-green-500">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-slate-800">Hoàn thành xuất sắc!</h2>
          <p className="text-slate-600 mb-8 text-lg">Cảm ơn bạn đã tham gia phỏng vấn. Video câu trả lời của bạn đã được tải lên hệ thống bảo mật.</p>
          <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 mb-8 border border-slate-200">
            Mã tham chiếu: <span className="font-mono font-bold text-slate-700">{Date.now().toString(36).toUpperCase()}</span>
          </div>
          <Button onClick={onComplete} variant="outline" className="w-full">Quay về trang chủ</Button>
        </Card>
      </div>
    );
  }

  // ACTIVE INTERVIEW WRAPPER
  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-160px)] flex flex-col">
      {/* Progress Bar */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex justify-between items-center text-sm font-medium text-slate-600">
          <span>Câu hỏi {currentQuestionIndex + 1} / {flow.questions.length}</span>
          <span>{Math.round(((currentQuestionIndex) / flow.questions.length) * 100)}% Hoàn thành</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
           <div 
             className="h-full bg-blue-600 transition-all duration-500 ease-out" 
             style={{ width: `${((currentQuestionIndex) / flow.questions.length) * 100}%` }}
           ></div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 flex-col md:flex-row min-h-0">
        <Card className="flex-1 relative overflow-hidden flex flex-col bg-slate-900 border-none shadow-2xl rounded-2xl ring-4 ring-slate-100">
           
           {/* Step: Question Intro */}
           {step === Step.QUESTION_INTRO && (
             <div className="absolute inset-0 flex flex-col bg-white">
                <div className="flex-1 relative bg-black flex flex-col">
                      <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <MonitorPlay size={12} /> Câu hỏi từ nhà tuyển dụng
                      </div>
                      <video 
                        ref={questionVideoRef}
                        src={currentQuestion.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"} 
                        autoPlay 
                        controls={false}
                        className="w-full h-full object-contain"
                        // Removed automatic transition
                      />
                      <div className="bg-white p-6 border-t border-slate-100 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                                Q{currentQuestionIndex + 1}
                            </div>
                            <span className="text-slate-500 font-medium text-sm">Xem video và nhấn Tiếp theo để chuẩn bị trả lời</span>
                          </div>
                          <div className="flex gap-3">
                            <Button onClick={() => setStep(Step.PREP)} variant="primary" className="px-6 flex items-center gap-2">
                                Tiếp theo <ChevronRight size={18} />
                            </Button>
                          </div>
                      </div>
                </div>
             </div>
           )}

           {/* Step: Prep (Countdown) */}
           {step === Step.PREP && (
             <>
               <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1] opacity-70" />
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10 text-white p-8 text-center">
                  <div className="w-20 h-20 mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                     <Hourglass size={40} className="text-white animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Chuẩn bị trả lời</h2>
                  <p className="text-white/80 mb-8 max-w-md">Hãy hít thở sâu và suy nghĩ về câu trả lời của bạn. Ghi hình sẽ tự động bắt đầu sau:</p>
                  
                  <div className="text-8xl font-mono font-bold tracking-tighter mb-8 tabular-nums">
                    {timeLeft}
                  </div>
                  
                  <Button onClick={startRecording} variant="primary" className="px-8 py-3 text-lg bg-white text-blue-900 hover:bg-blue-50 border-none shadow-xl">
                    Trả lời ngay <ChevronRight size={20} className="inline ml-1" />
                  </Button>
               </div>
             </>
           )}

           {/* Step: Recording */}
           {step === Step.RECORDING && (
              <>
                <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                
                <div className="absolute top-6 right-6 bg-red-600/90 backdrop-blur text-white px-4 py-2 rounded-full flex items-center gap-3 animate-pulse font-bold shadow-lg border border-red-500 z-20">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  REC • {timeLeft}s
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center z-20">
                   <Button onClick={stopRecording} variant="danger" className="flex items-center gap-3 px-10 py-4 rounded-full text-lg shadow-xl shadow-red-900/20 hover:scale-105 transition-transform border-2 border-red-500">
                     <StopCircle size={24} fill="currentColor" /> Hoàn thành câu trả lời
                   </Button>
                </div>
              </>
           )}

           {/* Step: Uploading - Progress Bar */}
           {step === Step.UPLOAD && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-50 p-8">
               <div className="w-24 h-24 mb-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center animate-bounce">
                  <CloudUpload size={48} />
               </div>
               
               <h3 className="text-2xl font-bold text-slate-800 mb-2">Đang tải lên máy chủ...</h3>
               
               <div className="w-full max-w-md mt-6">
                  <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
                     <span>Tiến trình</span>
                     <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                     <div 
                        className="h-full bg-blue-600 transition-all duration-300 ease-out relative overflow-hidden" 
                        style={{ width: `${uploadProgress}%` }}
                     >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"></div>
                     </div>
                  </div>
               </div>

               <p className="text-slate-500 mt-6 text-sm flex items-center gap-2">
                  <AlertCircle size={14} />
                  Vui lòng không tắt trình duyệt trong quá trình tải lên.
               </p>
             </div>
           )}
        </Card>
      </div>
    </div>
  );
};

export default CandidateView;