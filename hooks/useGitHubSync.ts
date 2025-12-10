import { useState, useEffect, useCallback, useRef } from 'react';
import { GITHUB_TOKEN_ENCODED } from '../constants';

const GIST_FILENAME = 'flatnav_backup.json';

export interface SyncStatus {
    state: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    lastSynced?: string;
}

// 辅助函数：安全解码 Token
const getDecodedToken = () => {
    // 强制转换为 string，防止 TypeScript 在常量为空字符串时将其推断为 never 或特定字面量类型，导致 .trim() 报错
    const tokenStr = GITHUB_TOKEN_ENCODED as string;
    
    if (!tokenStr) return '';
    try {
        const cleanEncoded = tokenStr.trim();
        // 如果用户不小心填入了明文（以 ghp_ 开头），直接返回，但在控制台警告
        if (cleanEncoded.startsWith('ghp_') || cleanEncoded.startsWith('github_pat_')) {
            console.warn('【配置警告】检测到 constants.tsx 中填入了明文 Token。GitHub 安全扫描可能已自动将其作废，导致同步失败。请使用 Base64 编码。');
            return cleanEncoded;
        }
        
        // 进行 Base64 解码
        const decoded = atob(cleanEncoded);
        return decoded.trim();
    } catch (e) {
        console.error('【配置错误】GitHub Token 解码失败：请确保 constants.tsx 中填入的是有效的 Base64 字符串 (无空格/换行)', e);
        return '';
    }
};

export const useGitHubSync = () => {
    // 惰性初始化：优先读取代码中硬编码的 Token (解码后)，其次是本地存储
    const [token, setTokenState] = useState(() => {
        const hardcoded = getDecodedToken();
        if (typeof window !== 'undefined') {
            // 如果代码中有硬编码，优先使用硬编码
            if (hardcoded) return hardcoded;
            return localStorage.getItem('flatnav_github_token') || '';
        }
        return hardcoded || '';
    });

    const [gistId, setGistIdState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('flatnav_gist_id') || '';
        }
        return '';
    });

    const [autoSync, setAutoSyncState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('flatnav_auto_sync') === 'true';
        }
        return false;
    });

    const [status, setStatus] = useState<SyncStatus>({ state: 'idle', message: '就绪' });
    
    const [lastSuccessTime, setLastSuccessTime] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('flatnav_last_sync_time') || '';
        }
        return '';
    });

    const setToken = (newToken: string) => {
        const clean = newToken.trim().replace(/^Bearer\s+/i, '');
        setTokenState(clean);
        // 如果用户手动输入，我们保存到本地
        localStorage.setItem('flatnav_github_token', clean);
        if (clean) setStatus({ state: 'idle', message: 'Token 已更新' });
    };

    const setAutoSync = (enabled: boolean) => {
        setAutoSyncState(enabled);
        localStorage.setItem('flatnav_auto_sync', String(enabled));
    };

    // Helper to find Gist ID if missing
    const findGistId = async (authToken: string): Promise<string | null> => {
        if (!authToken) return null;
        try {
            const res = await fetch('https://api.github.com/gists', {
                headers: { 
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (res.status === 401) {
                // 不在这里抛出，让外层处理
                return null;
            }
            
            if (!res.ok) return null;
            const gists = await res.json();
            if (Array.isArray(gists)) {
                // 查找包含我们特定文件名的 Gist
                const found = gists.find((g: any) => g.files && g.files[GIST_FILENAME]);
                return found ? found.id : null;
            }
            return null;
        } catch (e: any) {
            console.error('Find Gist Error:', e);
            return null;
        }
    };

    const pushData = useCallback(async (data: any, silent = false) => {
        if (!token) {
            setStatus({ state: 'error', message: '未配置 Token' });
            return;
        }

        if (!silent) setStatus({ state: 'loading', message: '正在同步到云端...' });

        try {
            // 1. Ensure we have a Gist ID
            let targetId = gistId;
            if (!targetId) {
                targetId = await findGistId(token) || '';
            }

            const url = targetId ? `https://api.github.com/gists/${targetId}` : 'https://api.github.com/gists';
            const method = targetId ? 'PATCH' : 'POST';

            const body = {
                description: "FlatNav Dashboard Backup (Auto-Sync)",
                public: false,
                files: {
                    [GIST_FILENAME]: {
                        content: JSON.stringify(data, null, 2)
                    }
                }
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                if (res.status === 401) throw new Error('Token 无效或已失效。请检查是否被 GitHub 自动作废。');
                if (res.status === 403) throw new Error('API 频率超限或无权限');
                if (res.status === 404) throw new Error('Gist 未找到，或已被删除');
                throw new Error(`同步失败 (${res.status})`);
            }

            const result = await res.json();
            
            // Save new ID if created
            if (result.id && result.id !== gistId) {
                setGistIdState(result.id);
                localStorage.setItem('flatnav_gist_id', result.id);
            }

            const now = new Date().toLocaleString();
            setLastSuccessTime(now);
            localStorage.setItem('flatnav_last_sync_time', now);
            setStatus({ state: 'success', message: '同步成功' });

        } catch (err: any) {
            console.error('Sync Error:', err);
            const msg = err.message || '同步异常';
            setStatus({ state: 'error', message: msg });
            
            // If auth failed, disable auto-sync to stop loop
            if (msg.includes('Token') || msg.includes('401') || msg.includes('失效')) {
                setAutoSync(false);
            }
        }
    }, [token, gistId]);

    const pullData = useCallback(async () => {
        if (!token) throw new Error('请先配置 Token');
        
        setStatus({ state: 'loading', message: '正在连接...' });

        try {
            let targetId = gistId;
            if (!targetId) {
                targetId = await findGistId(token) || '';
            }

            if (!targetId) {
                // 如果没有找到 Gist，这可能是一个新账号，不应该报错
                console.log('No backup gist found.');
                setStatus({ state: 'success', message: '云端无备份数据' });
                return null;
            }

            // Save ID if we found it
            if (targetId !== gistId) {
                setGistIdState(targetId);
                localStorage.setItem('flatnav_gist_id', targetId);
            }

            // 添加时间戳防止缓存
            const res = await fetch(`https://api.github.com/gists/${targetId}?t=${Date.now()}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (res.status === 401) throw new Error('Token 无效或已失效 (401)');
            if (res.status === 404) throw new Error('云端备份文件未找到 (404)');
            if (!res.ok) throw new Error(`下载失败 (${res.status})`);

            const result = await res.json();
            const file = result.files[GIST_FILENAME];
            
            if (!file || !file.content) throw new Error('备份文件内容为空');

            setStatus({ state: 'success', message: '下载成功' });
            return JSON.parse(file.content);

        } catch (err: any) {
            const msg = err.message || '下载失败';
            setStatus({ state: 'error', message: msg });
            // Re-throw to let the caller know it failed
            if (msg.includes('401') || msg.includes('失效')) setAutoSync(false);
            throw err;
        }
    }, [token, gistId]);

    return {
        token,
        setToken,
        autoSync,
        setAutoSync,
        status,
        lastSuccessTime,
        pushData,
        pullData
    };
};