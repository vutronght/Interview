import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Wand2, Loader2, Save } from 'lucide-react';
import { Button, Card } from './ui';
import { Question } from '../types';
import { generateInterviewQuestions } from '../services/geminiService';

const FlowBuilder: React.FC = () => {
  const [jobRole, setJobRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    { id: '1', text: 'Please introduce yourself.', prepTimeSeconds: 30, maxAnswerTimeSeconds: 60 }
  ]);

  const handleGenerateAI = async () => {
    if (!jobRole) return;
    setIsGenerating(true);
    try {
      const newQuestions = await generateInterviewQuestions(jobRole);
      // Map AI response to our state structure
      const formatted = newQuestions.map((q: any, i: number) => ({
        id: `ai-${Date.now()}-${i}`,
        text: q.text,
        prepTimeSeconds: q.prepTimeSeconds,
        maxAnswerTimeSeconds: q.maxAnswerTimeSeconds
      }));
      setQuestions(prev => [...prev, ...formatted]);
    } catch (e) {
      alert("Failed to generate questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: `manual-${Date.now()}`, text: '', prepTimeSeconds: 30, maxAnswerTimeSeconds: 120 }]);
  };

  const removeQuestion = (index: number) => {
    const newQ = [...questions];
    newQ.splice(index, 1);
    setQuestions(newQ);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], [field]: value };
    setQuestions(newQ);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Create Interview Flow</h2>
           <p className="text-slate-500">Design the question sequence for candidates.</p>
        </div>
        <Button className="flex items-center gap-2">
            <Save size={18} /> Save Flow
        </Button>
      </div>

      <Card className="p-6 mb-6 bg-indigo-50 border-indigo-100">
        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Wand2 size={16} /> AI Assistant
        </h3>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Enter Job Role (e.g., Senior React Engineer)" 
            className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
          />
          <Button onClick={handleGenerateAI} disabled={!jobRole || isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
            {isGenerating ? <><Loader2 size={18} className="animate-spin mr-2"/> Generating</> : 'Auto-Generate'}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={q.id} className="p-4 group relative hover:shadow-md transition-shadow">
             <div className="flex items-start gap-4">
                <div className="mt-3 text-slate-400 cursor-move">
                    <GripVertical size={20} />
                </div>
                <div className="flex-1 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Question Text</label>
                        <textarea 
                            value={q.text}
                            onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                            rows={2}
                            placeholder="Type your question here..."
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Prep Time (sec)</label>
                            <input 
                                type="number"
                                value={q.prepTimeSeconds}
                                onChange={(e) => updateQuestion(idx, 'prepTimeSeconds', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Max Answer (sec)</label>
                            <input 
                                type="number"
                                value={q.maxAnswerTimeSeconds}
                                onChange={(e) => updateQuestion(idx, 'maxAnswerTimeSeconds', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Avatar Video</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white">
                                <option>Default HR Avatar</option>
                                <option>Tech Lead Avatar</option>
                                <option>None (Text Only)</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button onClick={() => removeQuestion(idx)} className="text-slate-400 hover:text-red-500 p-2">
                    <Trash2 size={20} />
                </button>
             </div>
          </Card>
        ))}

        <Button onClick={addQuestion} variant="outline" className="w-full py-4 border-dashed border-2 flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50">
            <Plus size={20} /> Add Manual Question
        </Button>
      </div>
    </div>
  );
};

export default FlowBuilder;
