import React, { useState } from 'react';
import { LogIn, Smartphone, Lock, ShieldCheck, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { User } from '../types/rental';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: User[];
  onLoginSuccess: (user: User) => void;
  onOpenRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  allUsers,
  onLoginSuccess,
  onOpenRegister
}) => {
  const [identifier, setIdentifier] = useState(''); // SĐT hoặc CCCD
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg('Vui lòng nhập Số điện thoại hoặc Số CCCD!');
      return;
    }

    // Tìm tài khoản theo SĐT hoặc CCCD
    const found = allUsers.find(
      (u) => u.phoneNumber === cleanId || u.citizenId === cleanId
    );

    if (found) {
      onLoginSuccess(found);
      onClose();
    } else {
      setErrorMsg('Không tìm thấy tài khoản với Số điện thoại hoặc CCCD này. Vui lòng đăng ký nếu bạn là người dùng mới!');
    }
  };

  const handleQuickSelect = (user: User) => {
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Đăng Nhập Tài Khoản</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Số điện thoại hoặc Số CCCD:</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="0986666666 hoặc 034098006666"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Mật khẩu:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/30 text-xs"
          >
            Đăng Nhập Vào Hệ Thống
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center text-xs text-slate-400">
          Chưa có tài khoản?{' '}
          <button
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="text-blue-400 hover:text-blue-300 font-semibold underline"
          >
            Đăng ký ngay tại đây
          </button>
        </div>

        {/* Đăng nhập nhanh dành cho trải nghiệm thử nghiệm */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <span className="text-[11px] text-slate-400 block font-semibold">
            Hoặc chọn nhanh tài khoản thử nghiệm:
          </span>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {allUsers.slice(0, 3).map((u) => (
              <button
                key={u.userId}
                type="button"
                onClick={() => handleQuickSelect(u)}
                className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex justify-between items-center transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">{u.fullName}</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">({u.roleId === 1 ? 'Admins' : u.roleId === 2 ? 'Quản lý' : 'Khách thuê'})</span>
                </div>
                <span className="text-[10px] text-blue-400 font-mono">{u.phoneNumber}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
