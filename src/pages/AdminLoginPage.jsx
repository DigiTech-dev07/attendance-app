import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { Shield, Lock, Mail, ArrowLeft } from 'lucide-react';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { loginAdmin } = useAuth();
  const { eventConfig } = useEvent();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginAdmin(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col justify-between">
      {/* Admin Header */}
      <div className="bg-coral text-white border-b-3 border-black py-8 px-4 text-center relative shadow-brutal-sm">
        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border-2 border-black text-coral mb-3 shadow-brutal-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight">
            Organizer & CTO Portal
          </h1>
          <p className="text-xs font-bold text-white/90 mt-1">
            {eventConfig?.eventName || 'DG Tech Offsite 2.0'} • Command Center
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-md w-full mx-auto px-4 -mt-6 mb-10 z-10">
        <div className="card-brutal p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black uppercase text-ink">Admin Sign In</h2>
            <Link
              to="/login"
              className="text-xs font-bold text-ink/60 hover:text-ink flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Employee Login
            </Link>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded-xl text-xs font-bold text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-ink mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dgtech.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-coral shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-ink mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-coral shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-brutal py-3 bg-coral text-white hover:bg-coral-hover font-black text-sm uppercase tracking-wide mt-2"
            >
              {loading ? 'Authenticating...' : 'Enter Admin Dashboard'}
            </button>
          </form>

          <div className="mt-5 p-3 rounded-xl bg-sunshine-light/60 border border-black text-[11px] text-ink/80 font-medium">
            <span className="font-bold text-ink">💡 Note:</span> Admin credentials are configured in server environment variables. Frontend contains zero hardcoded secrets.
          </div>
        </div>
      </main>

      <footer className="text-center py-4 border-t border-black/10 text-xs font-bold text-ink/60">
        DG Tech Admin Command • Authorized Access Only
      </footer>
    </div>
  );
}

export default AdminLoginPage;
