import React, { useState, useEffect } from 'react';
import { User, SystemPhase, SystemConfig, UserRole, SelectionStatus } from '../types';
import { storageService } from '../services/storageService';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<SystemConfig>(storageService.getConfig());
  const [selections, setSelections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'stats'>('system');

  // Import State
  const [importText, setImportText] = useState('');
  const [importRole, setImportRole] = useState<UserRole>(UserRole.STUDENT);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(storageService.getUsers());
    setConfig(storageService.getConfig());
    setSelections(storageService.getSelections());
  };

  const handlePhaseChange = (phase: SystemPhase) => {
    const newConfig = { ...config, currentPhase: phase };
    storageService.saveConfig(newConfig);
    setConfig(newConfig);
    alert('系统阶段已更新');
  };

  const handleResetSystem = () => {
    if (window.confirm('警告：此操作将清空所有数据（包括用户和选择结果）并恢复初始状态。是否继续？')) {
      storageService.resetSystem();
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;

    const lines = importText.trim().split('\n');
    const newUsers: User[] = [];

    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2) return;

      const username = parts[0];
      const name = parts[1];
      
      const user: User = {
        id: username, // Use username as ID for simplicity
        username,
        name,
        password: '123', // Default password
        role: importRole
      };

      if (importRole === UserRole.TEACHER) {
        user.title = parts[2] || '讲师';
        user.maxQuota = parts[3] ? parseInt(parts[3]) : 5;
        user.researchArea = parts[4] || '未填写';
      }

      newUsers.push(user);
    });

    const count = storageService.addUsers(newUsers);
    alert(`成功导入 ${count} 名用户（忽略重复账号）。`);
    setImportText('');
    refreshData();
  };

  const getStats = () => {
    const teachers = users.filter(u => u.role === UserRole.TEACHER);
    const students = users.filter(u => u.role === UserRole.STUDENT);
    const matchedStudents = selections.filter(s => s.status === SelectionStatus.ACCEPTED).length;
    
    return {
      teacherCount: teachers.length,
      studentCount: students.length,
      matchedCount: matchedStudents,
      matchRate: students.length ? ((matchedStudents / students.length) * 100).toFixed(1) : 0
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('system')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'system' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          系统配置
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          用户管理
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'stats' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          数据统计
        </button>
      </div>

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4">互选流程控制</h3>
            <div className="space-y-4">
              <div 
                onClick={() => handlePhaseChange(SystemPhase.STUDENT_SELECTION)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${config.currentPhase === SystemPhase.STUDENT_SELECTION ? 'bg-indigo-50 border-primary ring-1 ring-primary' : 'hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">第一阶段：学生选题</span>
                  {config.currentPhase === SystemPhase.STUDENT_SELECTION && <span className="text-primary text-xs font-bold px-2 py-1 bg-white rounded-full">进行中</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">学生查看导师并提交申请，导师仅可查看。</p>
              </div>

              <div 
                onClick={() => handlePhaseChange(SystemPhase.TEACHER_SELECTION)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${config.currentPhase === SystemPhase.TEACHER_SELECTION ? 'bg-indigo-50 border-primary ring-1 ring-primary' : 'hover:bg-slate-50'}`}
              >
                 <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">第二阶段：导师反选</span>
                  {config.currentPhase === SystemPhase.TEACHER_SELECTION && <span className="text-primary text-xs font-bold px-2 py-1 bg-white rounded-full">进行中</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">学生停止选题，导师筛选申请者进行录用或拒绝。</p>
              </div>

              <div 
                onClick={() => handlePhaseChange(SystemPhase.COMPLETED)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${config.currentPhase === SystemPhase.COMPLETED ? 'bg-indigo-50 border-primary ring-1 ring-primary' : 'hover:bg-slate-50'}`}
              >
                 <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">结束阶段：公示结果</span>
                  {config.currentPhase === SystemPhase.COMPLETED && <span className="text-primary text-xs font-bold px-2 py-1 bg-white rounded-full">进行中</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">流程结束，所有选择锁定，仅供查看。</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 text-red-600">危险区域</h3>
            <p className="text-sm text-slate-600 mb-4">如需重新开始下一届选题，请重置系统。</p>
            <button 
              onClick={handleResetSystem}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition-colors"
            >
              重置系统数据
            </button>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4">批量导入用户</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="importRole" 
                  checked={importRole === UserRole.STUDENT}
                  onChange={() => setImportRole(UserRole.STUDENT)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">导入学生</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="importRole" 
                  checked={importRole === UserRole.TEACHER}
                  onChange={() => setImportRole(UserRole.TEACHER)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">导入导师</span>
              </label>
            </div>
            
            <textarea
              className="w-full h-32 p-3 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary outline-none"
              placeholder={importRole === UserRole.STUDENT 
                ? "格式: 学号,姓名\nS2024001,张三\nS2024002,李四" 
                : "格式: 工号,姓名,职称,名额,研究方向\nT005,王五,教授,5,计算机视觉"}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs text-slate-500">初始密码默认为 123</span>
              <button 
                onClick={handleImport}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                开始导入
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-800">用户列表 ({users.length})</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-6 py-3">账号</th>
                    <th className="px-6 py-3">姓名</th>
                    <th className="px-6 py-3">角色</th>
                    <th className="px-6 py-3">配额/信息</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-3 font-mono text-slate-600">{u.username}</td>
                      <td className="px-6 py-3 font-medium">{u.name}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${u.role === UserRole.ADMIN ? 'bg-slate-200' : u.role === UserRole.TEACHER ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                          {u.role === UserRole.STUDENT ? '学生' : u.role === UserRole.TEACHER ? '导师' : '管理员'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500 max-w-xs truncate">
                        {u.role === UserRole.TEACHER ? `${u.title} | 名额: ${u.maxQuota} | ${u.researchArea}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
             <p className="text-slate-500 text-sm">学生总数</p>
             <p className="text-3xl font-bold text-slate-800 mt-2">{stats.studentCount}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
             <p className="text-slate-500 text-sm">导师总数</p>
             <p className="text-3xl font-bold text-slate-800 mt-2">{stats.teacherCount}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
             <p className="text-slate-500 text-sm">已匹配成功</p>
             <p className="text-3xl font-bold text-success mt-2">{stats.matchedCount}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
             <p className="text-slate-500 text-sm">匹配率</p>
             <p className="text-3xl font-bold text-primary mt-2">{stats.matchRate}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;