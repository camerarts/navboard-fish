import React, { useState } from 'react';
import { X, Lock, AlertCircle, Ban, Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => Promise<{ success: boolean; message?: string }>;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const result = await onLogin(password);
        if (result.success) {
            setPassword('');
            setError('');
            onClose();
        } else {
            setError(result.message || '密码错误');
        }
    } catch (e) {
        setError('发生意外错误');
    } finally {
        setIsLoading(false);
    }
  };

  // Check if the error message implies a lockout
  const isLocked = error.includes('禁止') || error.includes('锁定');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            {isLocked ? <Ban size={20} className="text-red-500" /> : <Lock size={20} className="text-blue-500" />}
            {isLocked ? '账号锁定' : '管理员登录'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLocked || isLoading}
              className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
              placeholder={isLocked ? "已禁止输入" : "输入管理员密码"}
              autoFocus={!isLocked}
            />
          </div>

          {error && (
            <div className={`flex items-start gap-2 text-sm p-3 rounded-lg ${isLocked ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-600'}`}>
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLocked || isLoading}
            className={`w-full flex items-center justify-center gap-2 text-white rounded-lg px-4 py-3 font-medium transition shadow-md active:transform active:scale-95 ${
                isLocked || isLoading
                ? 'bg-slate-400 cursor-not-allowed hover:bg-slate-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : (isLocked ? '明日再试' : '登录')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;