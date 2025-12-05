import React, { useState, useEffect } from 'react';
import { User, Selection, SelectionStatus, SystemPhase } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  user: User;
  phase: SystemPhase;
}

const TeacherDashboard: React.FC<Props> = ({ user, phase }) => {
  const [applications, setApplications] = useState<Selection[]>([]);
  const [stats, setStats] = useState({ current: 0, max: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    // Only show loading on first fetch
    if (applications.length === 0 && loading) setLoading(true);
    
    const apps = storageService.getTeacherApplications(user.id);
    const currentStats = await storageService.getTeacherStats(user.id);
    setApplications(apps);
    setStats(currentStats);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Poll for new applications
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleStatusChange = async (selectionId: string, newStatus: SelectionStatus) => {
    // Only allow changes in Phase 2 or if admin allows (simplified here: allowed if phase 2)
    if (phase !== SystemPhase.TEACHER_SELECTION) {
      alert('当前不是导师反选阶段，无法操作。');
      return;
    }

    if (newStatus === SelectionStatus.ACCEPTED && stats.current >= stats.max) {
      alert('您的名额已满，无法接受更多学生。');
      return;
    }

    const success = await storageService.updateSelectionStatus(selectionId, newStatus);
    if (success) {
      fetchData();
    } else {
      alert('操作失败');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">加载中...</div>;

  const pendingApps = applications.filter(a => a.status === SelectionStatus.PENDING);
  const acceptedApps = applications.filter(a => a.status === SelectionStatus.ACCEPTED);
  const rejectedApps = applications.filter(a => a.status === SelectionStatus.REJECTED);

  return (
    <div className="space-y-8">
      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium">指导名额</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${stats.current >= stats.max ? 'text-red-500' : 'text-primary'}`}>
              {stats.current}
            </span>
            <span className="text-slate-400">/ {stats.max}</span>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(stats.current/stats.max)*100}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <p className="text-sm text-slate-500 font-medium">待处理申请</p>
           <p className="mt-2 text-3xl font-bold text-warning">{pendingApps.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
           <div>
             <p className="text-sm text-slate-500 font-medium">当前阶段</p>
             <p className="mt-2 text-xl font-bold text-slate-800">
               {phase === SystemPhase.STUDENT_SELECTION ? '学生选题中' : '导师反选期'}
             </p>
           </div>
           {phase !== SystemPhase.TEACHER_SELECTION && (
             <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded">暂不可操作</span>
           )}
        </div>
      </div>

      {/* Accepted Students */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">已录用学生</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            {acceptedApps.length} 人
          </span>
        </div>
        {acceptedApps.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">暂无已录用学生</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">学号</th>
                <th className="px-6 py-3 font-medium">姓名</th>
                <th className="px-6 py-3 font-medium">自我介绍</th>
                <th className="px-6 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {acceptedApps.map(app => (
                <tr key={app.id}>
                  <td className="px-6 py-4 font-mono text-slate-600">{app.studentId}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{app.studentName}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={app.studentIntro}>{app.studentIntro}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                       onClick={() => handleStatusChange(app.id, SelectionStatus.REJECTED)}
                       className="text-red-500 hover:text-red-700 text-xs font-medium"
                       disabled={phase !== SystemPhase.TEACHER_SELECTION}
                    >
                      移出名单
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending Applications */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">新的申请</h3>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
            {pendingApps.length} 人
          </span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {pendingApps.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">暂无新申请</div>
          ) : (
            pendingApps.map(app => (
              <div key={app.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg text-slate-900">{app.studentName}</span>
                      <span className="font-mono text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{app.studentId}</span>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-900 border border-indigo-100">
                      <span className="font-bold block text-xs uppercase tracking-wider text-indigo-400 mb-1">项目经历 / 优势</span>
                      {app.studentIntro}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 md:flex-col md:justify-center min-w-[120px]">
                    <button
                      onClick={() => handleStatusChange(app.id, SelectionStatus.ACCEPTED)}
                      disabled={phase !== SystemPhase.TEACHER_SELECTION || stats.current >= stats.max}
                      className="flex-1 w-full bg-success text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      接受
                    </button>
                    <button
                      onClick={() => handleStatusChange(app.id, SelectionStatus.REJECTED)}
                      disabled={phase !== SystemPhase.TEACHER_SELECTION}
                      className="flex-1 w-full border border-slate-200 text-slate-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;