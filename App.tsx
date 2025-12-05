import React, { useState, useEffect } from 'react';
import { User, UserRole, SystemPhase } from './types';
import { storageService } from './services/storageService';
import Layout from './components/Layout';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<SystemPhase>(SystemPhase.STUDENT_SELECTION);

  useEffect(() => {
    // Check if user is already logged in (simulated session)
    const storedUser = localStorage.getItem('tm_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Initial fetch of config
    const config = storageService.getConfig();
    setPhase(config.currentPhase);
    
    // Poll for phase changes
    const interval = setInterval(() => {
      const freshConfig = storageService.getConfig();
      setPhase((prev) => {
        if (prev !== freshConfig.currentPhase) {
          return freshConfig.currentPhase;
        }
        return prev;
      });
    }, 2000);

    setLoading(false);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('tm_current_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tm_current_user');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">系统加载中...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const getPageTitle = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT: return '学生选题中心';
      case UserRole.TEACHER: return '导师管理中心';
      case UserRole.ADMIN: return '系统管理后台';
      default: return '师生互选系统';
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout} title={getPageTitle(user.role)}>
      {user.role === UserRole.STUDENT && <StudentDashboard user={user} phase={phase} />}
      {user.role === UserRole.TEACHER && <TeacherDashboard user={user} phase={phase} />}
      {user.role === UserRole.ADMIN && <AdminDashboard />}
    </Layout>
  );
};

export default App;