import React, { useState, useEffect } from 'react';
import { User, Selection, SystemPhase, SelectionStatus } from '../types';
import { storageService } from '../services/storageService';
import { getMatchingAdvice } from '../services/geminiService';

interface Props {
  user: User;
  phase: SystemPhase;
}

const StudentDashboard: React.FC<Props> = ({ user, phase }) => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [mySelection, setMySelection] = useState<Selection | null>(null);
  const [teacherStats, setTeacherStats] = useState<Record<string, { current: number, max: number }>>({});
  const [loading, setLoading] = useState(true);
  
  // Selection Modal State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [introText, setIntroText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Advisor State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = async () => {
    // Keep loading true only for initial load to avoid flickering
    if (teachers.length === 0) setLoading(true);
    
    const allTeachers = storageService.getTeachers();
    setTeachers(allTeachers);
    
    // Get stats for all teachers
    const stats: Record<string, { current: number, max: number }> = {};
    for (const t of allTeachers) {
      stats[t.id] = await storageService.getTeacherStats(t.id);
    }
    setTeacherStats(stats);

    // Get my selection
    const allSelections = storageService.getSelections();
    const mine = allSelections.find(s => s.studentId === user.id && s.status !== SelectionStatus.REJECTED);
    setMySelection(mine || null);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Poll for updates (real-time quota check)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleSelect = async () => {
    if (!selectedTeacherId) return;
    setSubmitting(true);
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return;

    const res = await storageService.makeSelection(user.id, teacher.id, user.name, introText);
    if (res.success) {
      alert('申请提交成功！');
      setSelectedTeacherId(null);
      setIntroText('');
      fetchData();
    } else {
      alert(res.message);
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('确定要撤销当前的选择吗？')) return;
    setSubmitting(true);
    const success = await storageService.cancelSelection(user.id);
    if (success) {
      setMySelection(null);
      fetchData();
    } else {
      alert('撤销失败或当前状态不允许撤销。');
    }
    setSubmitting(false);
  };

  const handleAiAsk = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    const advice = await getMatchingAdvice(aiPrompt, teachers);
    setAiResponse(advice);
    setAiLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">加载数据中...</div>;

  const isSelectionPhase = phase === SystemPhase.STUDENT_SELECTION;

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
             <h2 className="text-lg font-bold text-slate-800">当前阶段: {isSelectionPhase ? '学生选题期' : '导师反选期'}</h2>
             <p className="text-slate-500 text-sm mt-1">
               {mySelection 
                 ? `当前状态: 已选择 ${teachers.find(t => t.id === mySelection.teacherId)?.name} (${mySelection.status === SelectionStatus.PENDING ? '等待确认' : '已录用'})` 
                 : '当前状态: 尚未选择导师'}
             </p>
          </div>
          {isSelectionPhase && (
             <button 
               onClick={() => setShowAiModal(true)}
               className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
               </svg>
               AI 智能选导助手
             </button>
          )}
        </div>
      </div>

      {/* Teacher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map(teacher => {
          const stats = teacherStats[teacher.id] || { current: 0, max: teacher.maxQuota || 0 };
          const isFull = stats.current >= stats.max;
          const isSelected = mySelection?.teacherId === teacher.id;
          const percentage = (stats.current / stats.max) * 100;

          return (
            <div key={teacher.id} className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col transition-all ${isSelected ? 'ring-2 ring-primary border-primary' : 'border-slate-200 hover:shadow-md'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{teacher.name}</h3>
                  <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded mt-1">{teacher.title}</span>
                </div>
                {isSelected && <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">已选</span>}
              </div>

              <div className="flex-1 space-y-3 mb-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">研究方向</p>
                  <p className="text-sm text-slate-700 line-clamp-3">{teacher.researchArea}</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">剩余名额</span>
                    <span className={`font-bold ${isFull ? 'text-red-500' : 'text-slate-700'}`}>
                      {stats.current} / {stats.max}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-green-400'}`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                {isSelected ? (
                   isSelectionPhase && mySelection?.status === SelectionStatus.PENDING ? (
                    <button 
                      onClick={handleCancel}
                      disabled={submitting}
                      className="w-full py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                    >
                      撤销选择
                    </button>
                   ) : (
                     <button disabled className="w-full py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed">
                       {mySelection?.status === SelectionStatus.ACCEPTED ? '已被录取' : '已选择'}
                     </button>
                   )
                ) : (
                  <button
                    onClick={() => setSelectedTeacherId(teacher.id)}
                    disabled={isFull || !!mySelection || !isSelectionPhase}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      isFull || !!mySelection || !isSelectionPhase
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-indigo-700 shadow-sm hover:shadow'
                    }`}
                  >
                    {isFull ? '名额已满' : !isSelectionPhase ? '非选题时间' : '选择导师'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Modal */}
      {selectedTeacherId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">申请确认</h3>
            <p className="text-sm text-slate-600 mb-4">
              您正在申请 <span className="font-bold text-primary">{teachers.find(t => t.id === selectedTeacherId)?.name}</span> 导师。
              请简单介绍您的项目经历或个人优势（建议100字以内）：
            </p>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none mb-4 h-32 resize-none"
              placeholder="例如：熟悉React开发，曾获得XX比赛二等奖..."
              value={introText}
              onChange={e => setIntroText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSelectedTeacherId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
              >
                取消
              </button>
              <button 
                onClick={handleSelect}
                disabled={submitting || !introText.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Advisor Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-indigo-700 flex items-center gap-2">
                ✨ 智能选导助手
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
               {aiResponse ? (
                 <div className="bg-indigo-50 p-4 rounded-lg text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                   {aiResponse}
                 </div>
               ) : (
                 <div className="text-center py-10 text-slate-400">
                   <p>请描述你的技术栈、感兴趣的方向或未来的职业规划。</p>
                   <p className="text-xs mt-2">Gemini AI 将为您分析并推荐匹配的导师。</p>
                 </div>
               )}
            </div>

            <div className="border-t pt-4">
               <div className="flex gap-2">
                 <input
                   type="text"
                   className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                   placeholder="例如：我擅长Python数据分析，对机器学习感兴趣..."
                   value={aiPrompt}
                   onChange={(e) => setAiPrompt(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                 />
                 <button
                   onClick={handleAiAsk}
                   disabled={aiLoading || !aiPrompt.trim()}
                   className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                 >
                   {aiLoading ? '分析中...' : '发送'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;