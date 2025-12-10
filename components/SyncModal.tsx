import React, { useState } from 'react';
import { X, Github, UploadCloud, DownloadCloud, AlertCircle, Check, Loader2, Key, ExternalLink, RefreshCw, Zap, WifiOff } from 'lucide-react';
import { SyncStatus } from '../hooks/useGitHubSync';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  setToken: (t: string) => void;
  autoSync: boolean;
  setAutoSync: (b: boolean) => void;
  status: SyncStatus;
  lastSuccessTime: string;
  onUpload: () => void;
  onDownload: () => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ 
    isOpen, 
    onClose, 
    token, 
    setToken, 
    autoSync, 
    setAutoSync,
    status,
    lastSuccessTime,
    onUpload,
    onDownload
}) => {
  const [showTokenInput, setShowTokenInput] = useState(!token);
  const [localToken, setLocalToken] = useState(token);

  if (!isOpen) return null;

  const handleSaveToken = () => {
      setToken(localToken);
      setShowTokenInput(false);
  };

  const isError = status.state === 'error';
  const isLoading = status.state === 'loading';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0 bg-slate-50/80">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Github size={22} className="text-slate-900" />
            云端同步设置
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Token Section */}
          {(showTokenInput || !token) ? (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 animate-in slide-in-from-top-2">
                  <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                          <Key size={20} />
                      </div>
                      <div>
                          <h4 className="font-bold text-blue-900 text-sm">配置 GitHub Token</h4>
                          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                              用于访问 GitHub Gist 以存储数据。
                          </p>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <a 
                        href="https://github.com/settings/tokens/new?scopes=gist&description=FlatNav%20Sync" 
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-sm"
                      >
                          <ExternalLink size={14} />
                          点击获取 Token (Gist 权限)
                      </a>
                      
                      <div className="relative">
                        <input
                            type="text"
                            value={localToken}
                            onChange={(e) => setLocalToken(e.target.value)}
                            className="w-full bg-white border border-blue-200 rounded-lg pl-3 pr-3 py-2.5 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono shadow-sm"
                            placeholder="粘贴 Token (ghp_...)"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button 
                            onClick={handleSaveToken}
                            disabled={!localToken.trim()}
                            className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                        >
                            保存
                        </button>
                        {token && (
                            <button onClick={() => setShowTokenInput(false)} className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg">
                                取消
                            </button>
                        )}
                      </div>
                  </div>
              </div>
          ) : (
            /* Connected / Status View */
             <div className="space-y-4">
                {/* Status Card */}
                <div className={`p-4 rounded-xl border ${
                    isError ? 'bg-red-50 border-red-200' :
                    isLoading ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
                } transition-all duration-300`}>
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-full ${
                            isError ? 'bg-red-100 text-red-600' :
                            isLoading ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 
                             isError ? <WifiOff size={16} /> : 
                             <Check size={16} />}
                        </div>
                        <div className="flex-1">
                             <h4 className={`text-sm font-bold ${isError ? 'text-red-800' : 'text-slate-800'}`}>
                                 {/* Show the specific error message even if it is an error state */}
                                 {status.message || (isError ? '同步出错' : '就绪')}
                             </h4>
                             {lastSuccessTime && (
                                 <p className="text-xs text-slate-500 mt-1">上次同步: {lastSuccessTime}</p>
                             )}
                        </div>
                        <button 
                            onClick={() => { setLocalToken(token); setShowTokenInput(true); }}
                            className="text-[10px] text-slate-400 hover:text-blue-600 underline"
                        >
                            重置 Token
                        </button>
                    </div>
                </div>

                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${autoSync ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Zap size={20} className={autoSync ? 'fill-current' : ''} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-sm">自动同步</div>
                            <div className="text-xs text-slate-500">修改后自动保存到云端</div>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={autoSync}
                            onChange={(e) => setAutoSync(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Manual Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                        onClick={onUpload}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        <UploadCloud size={16} />
                        手动上传
                    </button>
                    <button
                        onClick={onDownload}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        <DownloadCloud size={16} />
                        恢复备份
                    </button>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SyncModal;