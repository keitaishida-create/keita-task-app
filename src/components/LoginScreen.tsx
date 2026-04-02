import { useState } from 'react';
import { testAuth, saveCredentials } from '../api/client';

interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !token.trim()) {
      setError('URLとトークンを入力してください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ok = await testAuth(url.trim(), token.trim());
      if (ok) {
        saveCredentials(url.trim(), token.trim());
        onLogin();
      } else {
        setError('認証に失敗しました。URLとトークンを確認してください。');
      }
    } catch {
      setError('接続エラー。URLを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-icon">✓</div>
        <h1>Task Manager</h1>
        <p className="login-desc">GAS Web App のURLとAPIトークンを入力</p>
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="GAS Web App URL"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="login-input"
            autoComplete="url"
          />
          <input
            type="password"
            placeholder="APIトークン"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="login-input"
            autoComplete="current-password"
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '接続中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
