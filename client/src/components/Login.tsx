import React, { useState, FormEvent } from 'react';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const fillTest = () => {
    setUsername('testuser');
    setPassword('password');
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Server unreachable. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a16 0%, #0f0f1e 50%, #130d24 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-[#6d28d9]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-[#4c1d95]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md mx-4">

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'rgba(15,15,30,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          {/* Logo + Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#4c1d95] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-purple-900/40 mb-4">
              A
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Aether Impact</h1>
            <p className="text-slate-400 text-sm mt-1">Sign in to your workspace</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoFocus
                className="w-full bg-[#1a1a2e] border border-slate-700/60 text-slate-200 placeholder-slate-500 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-[#1a1a2e] border border-slate-700/60 text-slate-200 placeholder-slate-500 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all"
              />
            </div>

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:-translate-y-0.5 active:translate-y-0 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Test credentials hint */}
          <div className="mt-6 rounded-lg bg-[#1a1a2e]/70 border border-slate-700/40 px-4 py-3 text-center">
            <p className="text-xs text-slate-500 mb-2">Demo credentials</p>
            <div className="flex items-center justify-center gap-3 text-xs font-mono">
              <span className="text-slate-300">testuser</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">password</span>
            </div>
            <button
              onClick={fillTest}
              className="mt-2 text-[11px] text-[#8b5cf6] hover:text-[#a78bfa] underline underline-offset-2 transition-colors"
            >
              Click to autofill
            </button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2026 Aether Impact. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;