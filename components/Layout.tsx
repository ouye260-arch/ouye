import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  title: string;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, title, children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-white p-2 rounded-lg font-bold text-xl">TM</div>
              <h1 className="text-xl font-bold text-slate-800 hidden md:block">ThesisMatch</h1>
              <span className="text-slate-400 mx-2 hidden md:block">|</span>
              <h2 className="text-lg text-slate-600 font-medium">{title}</h2>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">
                    {user.role === UserRole.STUDENT ? '学生' : user.role === UserRole.TEACHER ? '导师' : '管理员'} | {user.username}
                  </p>
                </div>
              )}
              <button
                onClick={onLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-6">
         <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
           © 2024 毕业论文师生互选系统 | Computer Science Dept.
         </div>
      </footer>
    </div>
  );
};

export default Layout;