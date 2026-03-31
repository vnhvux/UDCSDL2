import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, User, Lock, ShieldCheck } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { MOCK_USERS, setMockUser } from '../data/mockUsers';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setMockUser(null); // Clear mock user if logging in with Google
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/network-request-failed') {
        setError('Lỗi mạng: Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng, tắt trình chặn quảng cáo (Ad-blocker) hoặc VPN và thử lại.');
      } else {
        setError(`Đăng nhập Google thất bại: ${err.message || err.code}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const mockUser = MOCK_USERS[username];
    if (mockUser && mockUser.password === password) {
      try {
        setMockUser(mockUser);
        await signInAnonymously(auth);
        // Force a page reload to ensure App.tsx picks up the mock user state immediately if auth state was already null
        window.location.reload();
      } catch (err: any) {
        console.error('Login error:', err);
        setMockUser(null); // Clear mock user if Firebase auth fails
        if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
          setError('Lỗi: Vui lòng bật "Anonymous" (Đăng nhập ẩn danh) trong Firebase Console -> Authentication -> Sign-in method để dùng tài khoản thử nghiệm.');
        } else if (err.code === 'auth/unauthorized-domain') {
          setError('Lỗi: Tên miền này chưa được cấp phép. Vui lòng thêm tên miền của ứng dụng vào Firebase Console -> Authentication -> Settings -> Authorized domains.');
        } else if (err.code === 'auth/network-request-failed') {
          setError('Lỗi mạng: Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng, tắt trình chặn quảng cáo (Ad-blocker) hoặc VPN và thử lại.');
        } else {
          setError(`Đăng nhập thất bại: ${err.message || err.code}`);
        }
      }
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Cover Section */}
        <div className="md:w-1/2 relative bg-[#8b0000] overflow-hidden">
          <div className="absolute inset-0 bg-black/30 z-10" />
          <img 
            src="https://picsum.photos/seed/neu-campus/800/1200" 
            alt="NEU Campus" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-20 h-full flex flex-col justify-end p-8 text-white">
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-2"
            >
              NEU
            </motion.h1>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg opacity-90"
            >
              Hệ thống Quản lý Giảng đường
            </motion.p>
            <div className="mt-4 h-1 w-12 bg-white rounded-full" />
          </div>
        </div>

        {/* Login Section */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800">Đăng nhập</h2>
            <p className="text-gray-500 mt-1">Chào mừng bạn quay trở lại</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent transition-all outline-none"
                  placeholder="Nhập mã sinh viên / cán bộ"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8b0000] focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-[#8b0000] hover:bg-[#a00000] text-white font-semibold rounded-xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Đăng nhập</span>
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-gray-200 w-full" />
              <span className="absolute bg-white px-4 text-sm text-gray-400">Hoặc đăng nhập với</span>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full py-3 border-2 border-gray-100 hover:border-[#8b0000] hover:bg-red-50 text-gray-700 font-medium rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <ShieldCheck className="w-5 h-5 text-[#8b0000]" />
              <span>SSO Login (NEU ID)</span>
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            &copy; 2026 Đại học Kinh tế Quốc dân. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
