import React, { useState, useEffect, useRef } from 'react';
import { User, SystemPhase, SystemConfig, UserRole, SelectionStatus, TeacherProfile, Selection } from '../types';
import { api } from '../services/mockBackend';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: any) => void }) => {
  const menuItems = [
    { id: 'teachers', label: '导师信息管理', icon: '👨‍🏫' },
    { id: 'students', label: '学生名单管理', icon: '👨‍🎓' },
    { id: 'phase', label: '流程阶段设置', icon: '⚙️' },
    { id: 'monitor', label: '师生选择监控', icon: '📊' },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] flex flex-col">
      <div className="p-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">管理菜单</h2>
        <nav className="space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-primary' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

const TeacherManager = ({ users, teachers, refresh }: { users: User[], teachers: TeacherProfile[], refresh: () => void }) => {
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        await api.importTeachersFromData(data);
        alert('导入成功');
        refresh(); // Refresh to update counts
      } catch (error) {
        console.error("Import error:", error);
        alert("导入失败，请检查文件格式");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    await api.updateTeacher(editingTeacher);
    setEditingTeacher(null);
    refresh();
  };

  const teacherUsers = users.filter(u => u.role === UserRole.TEACHER);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">导师信息管理 <span className="text-sm font-normal text-slate-500 ml-2">(共 {teacherUsers.length} 人)</span></h2>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            <span>📥</span> 导入导师Excel
          </button>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
        <strong>Excel模板说明：</strong> 请确保第一行包含以下列名：
        <div className="mt-2 font-mono bg-white/50 p-2 rounded">
          代号, 姓名, 职称, 院校, 指导方向, QQ, 电话, 学生选择名额, 反选学生名额
        </div>
        <div className="mt-1 text-xs text-blue-600">
          * 代号：作为导师登录账号<br/>
          * 学生选择名额：学生申请阶段的上限（控制先选先得）<br/>
          * 反选学生名额：导师最终录取的上限（不可超过）
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">代号</th>
                <th className="px-6 py-3 whitespace-nowrap">姓名</th>
                <th className="px-6 py-3 whitespace-nowrap">职称</th>
                <th className="px-6 py-3 whitespace-nowrap">院校</th>
                <th className="px-6 py-3">指导方向</th>
                <th className="px-6 py-3 whitespace-nowrap">QQ</th>
                <th className="px-6 py-3 whitespace-nowrap">电话</th>
                <th className="px-6 py-3 whitespace-nowrap text-center">申请名额</th>
                <th className="px-6 py-3 whitespace-nowrap text-center">录取名额</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map(t => {
                const u = teacherUsers.find(user => user.id === t.userId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-600">{t.userId}</td>
                    <td className="px-6 py-4 font-medium">{u?.name}</td>
                    <td className="px-6 py-4">{t.title}</td>
                    <td className="px-6 py-4 text-slate-500">{t.school}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={t.researchDirection}>{t.researchDirection}</td>
                    <td className="px-6 py-4 font-mono text-xs">{t.qq}</td>
                    <td className="px-6 py-4 font-mono text-xs">{t.phone}</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600">{t.studentSelectQuota}</td>
                    <td className="px-6 py-4 text-center font-bold text-green-600">{t.teacherConfirmQuota}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setEditingTeacher(t)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">编辑导师信息</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium mb-1">学生选择名额 (申请上限)</label>
                   <input 
                     type="number" 
                     className="w-full border rounded p-2"
                     value={editingTeacher.studentSelectQuota}
                     onChange={e => setEditingTeacher({...editingTeacher, studentSelectQuota: parseInt(e.target.value)})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">反选学生名额 (录取上限)</label>
                   <input 
                     type="number" 
                     className="w-full border rounded p-2"
                     value={editingTeacher.teacherConfirmQuota}
                     onChange={e => setEditingTeacher({...editingTeacher, teacherConfirmQuota: parseInt(e.target.value)})}
                   />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1">指导方向</label>
                 <textarea 
                   className="w-full border rounded p-2"
                   value={editingTeacher.researchDirection}
                   onChange={e => setEditingTeacher({...editingTeacher, researchDirection: e.target.value})}
                 />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium mb-1">QQ</label>
                   <input 
                     type="text" 
                     className="w-full border rounded p-2"
                     value={editingTeacher.qq || ''}
                     onChange={e => setEditingTeacher({...editingTeacher, qq: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-1">电话</label>
                   <input 
                     type="text" 
                     className="w-full border rounded p-2"
                     value={editingTeacher.phone || ''}
                     onChange={e => setEditingTeacher({...editingTeacher, phone: e.target.value})}
                   />
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentManager = ({ users, refresh }: { users: User[], refresh: () => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        await api.importStudentsFromData(data);
        alert('导入成功');
        refresh(); // Refresh to update counts
      } catch (error) {
        console.error("Import error:", error);
        alert("导入失败，请检查文件格式");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const studentUsers = users.filter(u => u.role === UserRole.STUDENT);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">学生名单管理 <span className="text-sm font-normal text-slate-500 ml-2">(共 {studentUsers.length} 人)</span></h2>
        <div className="flex gap-2">
          <input 
             type="file" 
             accept=".xlsx, .xls" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             className="hidden" 
           />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            <span>📥</span> 导入学生Excel
          </button>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
        <strong>Excel模板说明：</strong> 请确保第一行包含以下列名：
        <div className="mt-2 font-mono bg-white/50 p-2 rounded">
          学号, 姓名, 性别, 电话, 密码(可选)
        </div>
        <div className="mt-1 text-xs text-blue-600">
          * 初始密码默认为 123<br/>
          * 如果包含“密码”列，则使用该列作为初始密码
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 sticky top-0">
              <tr>
                <th className="px-6 py-3">学号</th>
                <th className="px-6 py-3">姓名</th>
                <th className="px-6 py-3">性别</th>
                <th className="px-6 py-3">电话</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentUsers.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 font-mono text-slate-600">{u.id}</td>
                  <td className="px-6 py-4 font-medium">{u.name}</td>
                  <td className="px-6 py-4">{u.gender || '-'}</td>
                  <td className="px-6 py-4 font-mono">{u.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PhaseCtrl = ({ config, refresh }: { config: SystemConfig, refresh: () => void }) => {
  const handlePhaseSwitch = (phase: SystemPhase) => {
    api.updateConfig({ ...config, currentPhase: phase });
    let phaseName = "";
    if (phase === SystemPhase.SETUP) phaseName = "系统配置期";
    if (phase === SystemPhase.STUDENT_SELECTION) phaseName = "学生选择期";
    if (phase === SystemPhase.TEACHER_SELECTION) phaseName = "导师反选期";
    if (phase === SystemPhase.COMPLETED) phaseName = "结果公示";
    
    alert(`系统已切换至：${phaseName}`);
    refresh();
  };

  const handleExportSuccess = () => {
    // Export successful matches: Student Info + Teacher Info
    const allSelections = api.getSelections();
    const accepted = allSelections.filter(s => s.status === SelectionStatus.ACCEPTED);
    const users = api.getUsers();
    const teachers = api.getTeachers();

    const data = accepted.map(s => {
      const student = users.find(u => u.id === s.studentId);
      const teacherProfile = teachers.find(t => t.id === s.teacherId);
      const teacherUser = users.find(u => u.id === teacherProfile?.userId);

      return {
        "学号": student?.id,
        "学生姓名": student?.name,
        "学生性别": student?.gender,
        "学生手机": student?.phone,
        "导师姓名": teacherUser?.name, // Real Name
        "导师职称": teacherProfile?.title,
        "导师电话": teacherProfile?.phone,
        "导师QQ号": teacherProfile?.qq
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "互选成功名单");
    XLSX.writeFile(wb, "师生互选成功名单.xlsx");
  };

  const handleExportUnmatched = () => {
    // Export unmatched students
    const allSelections = api.getSelections();
    const users = api.getUsers();
    const studentUsers = users.filter(u => u.role === UserRole.STUDENT);

    const unmatchedStudents = studentUsers.filter(s => {
      // Check if student has an ACCEPTED selection
      return !allSelections.some(sel => sel.studentId === s.id && sel.status === SelectionStatus.ACCEPTED);
    });

    const data = unmatchedStudents.map(s => ({
      "学号": s.id,
      "学生姓名": s.name,
      "学生性别": s.gender,
      "学生手机": s.phone
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "未互选成功名单");
    XLSX.writeFile(wb, "未互选成功名单.xlsx");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">流程阶段设置</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { id: SystemPhase.SETUP, label: '系统配置期', desc: '导入数据，调整参数。师生暂不可操作。' },
           { id: SystemPhase.STUDENT_SELECTION, label: '学生选择期', desc: '学生查看导师并提交申请，先选先得。' },
           { id: SystemPhase.TEACHER_SELECTION, label: '导师反选期', desc: '导师查看申请名单，进行最终确认。' },
           { id: SystemPhase.COMPLETED, label: '公布结果', desc: '流程结束，公示最终匹配名单。' },
         ].map(phase => (
           <div 
             key={phase.id}
             onClick={() => handlePhaseSwitch(phase.id)}
             className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
               config.currentPhase === phase.id 
                 ? 'border-primary bg-indigo-50 ring-2 ring-primary ring-opacity-20' 
                 : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
             }`}
           >
             <div className="flex justify-between items-center mb-2">
               <span className={`font-bold ${config.currentPhase === phase.id ? 'text-primary' : 'text-slate-700'}`}>
                 {phase.label}
               </span>
               {config.currentPhase === phase.id && (
                 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
               )}
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">{phase.desc}</p>
           </div>
         ))}
      </div>

      {config.currentPhase === SystemPhase.COMPLETED && (
        <div className="mt-8 pt-8 border-t border-slate-200">
           <h3 className="text-lg font-bold text-slate-800 mb-4">数据导出</h3>
           <div className="flex gap-4">
             <div className="p-6 bg-green-50 rounded-xl border border-green-100 flex-1">
               <h4 className="font-bold text-green-800 mb-2">导出互选成功名单</h4>
               <p className="text-xs text-green-600 mb-4">包含学号、学生信息、导师详细信息等完整匹配记录。</p>
               <button 
                 onClick={handleExportSuccess}
                 className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 w-full"
               >
                 下载 Excel (.xlsx)
               </button>
             </div>
             <div className="p-6 bg-red-50 rounded-xl border border-red-100 flex-1">
               <h4 className="font-bold text-red-800 mb-2">导出未成功名单</h4>
               <p className="text-xs text-red-600 mb-4">包含所有未能匹配到导师的学生名单。</p>
               <button 
                 onClick={handleExportUnmatched}
                 className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 w-full"
               >
                 下载 Excel (.xlsx)
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const Monitor = ({ users, selections, teachers, refresh }: { users: User[], selections: Selection[], teachers: TeacherProfile[], refresh: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SelectionStatus | 'UNSELECTED'>('ALL');
  const [showOnlyNotFull, setShowOnlyNotFull] = useState(false);

  const studentUsers = users.filter(u => u.role === UserRole.STUDENT);
  
  // Prepare data for Student Table
  const studentData = studentUsers.map(student => {
    const selection = selections.find(s => s.studentId === student.id && s.status !== SelectionStatus.REJECTED);
    let statusText = '未选题';
    let teacherName = '-';
    let rawStatus = 'UNSELECTED';

    if (selection) {
      const teacherProfile = teachers.find(t => t.id === selection.teacherId);
      const teacherUser = users.find(u => u.id === teacherProfile?.userId);
      teacherName = teacherUser ? teacherUser.name : (teacherProfile ? teacherProfile.name : '未知');
      
      if (selection.status === SelectionStatus.PENDING) {
        statusText = '待确认';
        rawStatus = SelectionStatus.PENDING;
      } else if (selection.status === SelectionStatus.ACCEPTED) {
        statusText = '已录取';
        rawStatus = SelectionStatus.ACCEPTED;
      }
    }

    return {
      student,
      statusText,
      teacherName,
      rawStatus
    };
  });

  const filteredData = studentData.filter(item => {
    const matchesSearch = item.student.name.includes(searchTerm) || item.student.id.includes(searchTerm);
    const matchesFilter = statusFilter === 'ALL' ? true : item.rawStatus === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate Stats
  const stats = {
    total: studentUsers.length,
    accepted: studentData.filter(i => i.rawStatus === SelectionStatus.ACCEPTED).length,
    pending: studentData.filter(i => i.rawStatus === SelectionStatus.PENDING).length,
    unselected: studentData.filter(i => i.rawStatus === 'UNSELECTED').length,
  };

  const chartData = [
    { name: '已录取', value: stats.accepted, color: '#10b981' },
    { name: '待确认', value: stats.pending, color: '#f59e0b' },
    { name: '未选题', value: stats.unselected, color: '#64748b' },
  ];

  // Teacher Stats
  const teacherStats = teachers.map(t => {
     const apps = selections.filter(s => s.teacherId === t.id);
     const acceptedCount = apps.filter(s => s.status === SelectionStatus.ACCEPTED).length;
     const pendingCount = apps.filter(s => s.status === SelectionStatus.PENDING).length;
     const remaining = t.teacherConfirmQuota - acceptedCount; // Remaining spots for confirmation
     
     return {
       ...t,
       acceptedCount,
       pendingCount,
       remaining
     };
  }).filter(t => showOnlyNotFull ? t.remaining > 0 : true);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs mb-1">学生总数</div>
           <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50 shadow-sm">
           <div className="text-emerald-600 text-xs mb-1">已录取</div>
           <div className="text-2xl font-bold text-emerald-700">{stats.accepted}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50 shadow-sm">
           <div className="text-amber-600 text-xs mb-1">待确认</div>
           <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs mb-1">未选题</div>
           <div className="text-2xl font-bold text-slate-400">{stats.unselected}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 text-lg mb-6">总体状态分布</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" barSize={30} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-lg mb-4">学生选择明细</h3>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            {[
              { id: 'ALL', label: '全部' },
              { id: SelectionStatus.ACCEPTED, label: '已录取' },
              { id: SelectionStatus.PENDING, label: '待确认' },
              { id: 'UNSELECTED', label: '未选题' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  statusFilter === f.id 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="搜索姓名或学号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  <th className="px-6 py-3">学号</th>
                  <th className="px-6 py-3">姓名</th>
                  <th className="px-6 py-3">所选导师</th>
                  <th className="px-6 py-3">当前状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(item => (
                  <tr key={item.student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-slate-600">{item.student.id}</td>
                    <td className="px-6 py-3 font-medium">{item.student.name}</td>
                    <td className="px-6 py-3 text-slate-600">{item.teacherName}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.rawStatus === SelectionStatus.ACCEPTED ? 'bg-emerald-100 text-emerald-700' :
                        item.rawStatus === SelectionStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {item.statusText}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      未找到匹配的学生记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
          导师录取统计 & 未满额预警
          <label className="flex items-center gap-2 text-sm font-normal text-slate-500 ml-auto cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={showOnlyNotFull} 
              onChange={e => setShowOnlyNotFull(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            仅显示未满额导师
          </label>
        </h3>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500">
                 <tr>
                   <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">导师信息 (真名/代号)</th>
                   <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-center">录取进度</th>
                   <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-center">状态预警</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {teacherStats.map(t => {
                   const u = users.find(user => user.id === t.userId);
                   const isFull = t.remaining <= 0;
                   return (
                     <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4">
                         <div className="font-bold text-slate-900">{u?.name}</div>
                         <div className="text-xs text-slate-500">代号: {t.userId}</div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col items-center">
                           <span className="text-sm font-medium mb-1">
                             <span className="text-emerald-600">{t.acceptedCount}</span>
                             <span className="text-slate-400 mx-1">/</span>
                             <span className="text-slate-700">{t.teacherConfirmQuota}</span>
                           </span>
                           <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                             <div 
                               className={`h-full rounded-full ${isFull ? 'bg-emerald-500' : 'bg-blue-400'}`} 
                               style={{ width: `${(t.acceptedCount / t.teacherConfirmQuota) * 100}%` }}
                             />
                           </div>
                           <div className="text-xs text-slate-400 mt-1">
                             申请中: {t.pendingCount}
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-center">
                         {isFull ? (
                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                             ✅ 已招满
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                             ⚠️ 缺额 {t.remaining} 人
                           </span>
                         )}
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('teachers');
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [config, setConfig] = useState<SystemConfig>(api.getConfig());
  const [selections, setSelections] = useState<Selection[]>([]);

  const refreshData = () => {
    // Force refresh from localStorage
    setUsers(api.getUsers(true)); // Include test accounts if any, though removed now
    setTeachers(api.getTeachers(true));
    setConfig(api.getConfig());
    setSelections(api.getSelections());
  };

  useEffect(() => {
    refreshData();
    // Poll for updates
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-64px)]">
        {activeTab === 'teachers' && (
          <TeacherManager users={users} teachers={teachers} refresh={refreshData} />
        )}
        {activeTab === 'students' && (
          <StudentManager users={users} refresh={refreshData} />
        )}
        {activeTab === 'phase' && (
          <PhaseCtrl config={config} refresh={refreshData} />
        )}
        {activeTab === 'monitor' && (
          <Monitor users={users} selections={selections} teachers={teachers} refresh={refreshData} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;