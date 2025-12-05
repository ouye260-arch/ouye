import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await storageService.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('用户名或密码错误');
      }
    } catch (err) {
      setError('登录系统出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-primary text-white w-12 h-12 rounded-lg flex items-center justify-center mx-auto text-2xl font-bold mb-4">
            TM
          </div>
          <h1 className="text-2xl font-bold text-slate-900">欢迎使用师生互选系统</h1>
          <p className="text-slate-500 mt-2">计算机专业毕业设计管理平台</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">学号 / 工号</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="请输入账号"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="请输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
           <p>默认账号: 管理员(admin), 导师(T001), 学生(S2021001)</p>
           <p>默认密码: 123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;