import React, { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import Modal from './Modal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => Promise<{ success: boolean; message?: string }>;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setIsLoading(false);
      setVisible(false);
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    const result = await onLogin(password);
    setIsLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || '登录失败');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="管理员登录"
      subtitle="登录后可以添加书签、整理分类，数据会同步到云端"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Lock
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-secondary)' }}
          />
          <input
            autoFocus
            type={visible ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="请输入管理密码"
            aria-label="管理密码"
            aria-invalid={!!error}
            className="w-full rounded-lg border py-2.5 pl-9 pr-10 text-[13px] outline-none focus:border-[var(--accent-color)]"
            style={{
              background: 'var(--bg-subtle)',
              borderColor: error ? 'var(--danger)' : 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? '隐藏密码' : '显示密码'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 transition-colors hover:bg-[var(--bg-elevated)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {error && (
          <p
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11.5px] font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
            role="alert"
          >
            <AlertCircle size={12} />
            {error}
          </p>
        )}

        <button
          type="submit"
          data-ripple
          disabled={isLoading || !password.trim()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-bold text-white transition-all disabled:opacity-50"
          style={{ background: 'var(--accent-color)', color: 'var(--accent-contrast)' }}
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          {isLoading ? '验证中…' : '登录'}
        </button>
      </form>
    </Modal>
  );
};

export default LoginModal;
