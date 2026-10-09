import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { GoogleAuthModal } from '../components/GoogleAuthModal';
import api from '../services/api';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [isNativeGoogleReady, setIsNativeGoogleReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, register, loginWithGoogle } = useAuth();
  const { eventConfig } = useEvent();
  const navigate = useNavigate();

  // Initialize Google Identity Services (GIS) for mobile One-Tap & official Google button
  useEffect(() => {
    let isMounted = true;

    async function initGoogleServices() {
      try {
        const configRes = await api.auth.getConfig();
        const clientId =
          configRes?.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

        if (isMounted) setGoogleClientId(clientId);

        if (clientId && window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              if (response.credential) {
                setLoading(true);
                try {
                  await loginWithGoogle({ credential: response.credential });
                  navigate('/dashboard');
                } catch (err) {
                  setError(err.message || 'Google account sign-in failed.');
                } finally {
                  setLoading(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render ONLY the single official Google button
          const btnTarget = document.getElementById('singleGoogleSignInBtn');
          if (btnTarget) {
            btnTarget.innerHTML = '';
            window.google.accounts.id.renderButton(btnTarget, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              width: 320,
            });
            if (isMounted) setIsNativeGoogleReady(true);
          }

          // Trigger native Google One-Tap account chooser on mobile/desktop
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
              console.log('Google One-Tap prompt not displayed');
            }
          });
        }
      } catch (err) {
        console.warn('Google Identity Services setup note:', err.message);
      }
    }

    const timer = setTimeout(initGoogleServices, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [loginWithGoogle, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleProfile) => {
    try {
      await loginWithGoogle(googleProfile);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col justify-between">
      {/* Decorative Hero Header */}
      <div className="relative bg-sunshine border-b-3 border-black pt-8 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-polka-dots opacity-15 pointer-events-none"></div>

        <div className="max-w-xl mx-auto relative">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="sticker-pill bg-coral text-white text-[11px] rotate-[-2deg]">
              ★ {eventConfig?.departureDate || '10 OCT 2026'}
            </span>
            <span className="sticker-pill bg-electric text-white text-[11px] rotate-[1deg]">
              📍 {eventConfig?.departureStartPoint || 'G CORP'} →{' '}
              {eventConfig?.departureDestination || 'ANCHAVIYO'}
            </span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl text-ink tracking-tight uppercase leading-none mb-2">
            {eventConfig?.eventName || 'DG TECH OFFSITE 2.0'}
          </h1>
          <p className="font-bold text-sm sm:text-base text-ink/80">
            Employee Registration & Login
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 -mt-6 mb-10 z-10">
        <div className="card-brutal p-6 md:p-8 bg-white">
          {/* Tab Switcher: Login / Register */}
          <div className="flex bg-surface-soft p-1.5 rounded-2xl border-2 border-black mb-6 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                !isRegister
                  ? 'bg-sunshine text-ink border-2 border-black shadow-brutal-sm'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                isRegister
                  ? 'bg-sunshine text-ink border-2 border-black shadow-brutal-sm'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-coral rounded-xl text-xs font-bold text-coral-hover flex items-start gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* SINGLE Google Authentication Option */}
          <div className="mb-5 flex flex-col items-center">
            {/* The single official Google button rendered by Google Identity Services */}
            <div
              id="singleGoogleSignInBtn"
              className={`w-full flex justify-center min-h-[44px] ${
                isNativeGoogleReady ? 'block' : 'hidden'
              }`}
            ></div>

            {/* Fallback button shown ONLY if Google's native button is not yet rendered */}
            {!isNativeGoogleReady && (
              <button
                type="button"
                onClick={() => {
                  if (window.google?.accounts?.id && googleClientId) {
                    window.google.accounts.id.prompt();
                  } else {
                    setIsGoogleModalOpen(true);
                  }
                }}
                className="w-full btn-brutal py-3 bg-white text-ink border-2 border-black hover:bg-neutral-50 flex items-center justify-center gap-3 text-sm font-black shadow-brutal"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            )}
          </div>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t-2 border-black/15 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-black uppercase text-ink/50 tracking-wider">
              Or with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-black uppercase text-ink mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya Sen"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-sunshine"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase text-ink mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya@dgtech.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-ink mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-brutal py-3 bg-black text-white hover:bg-neutral-800 font-black text-sm uppercase tracking-wide mt-2"
            >
              {loading
                ? 'Processing...'
                : isRegister
                ? 'Create Employee Account'
                : 'Sign In to Trip'}
            </button>
          </form>

          {/* Admin portal prompt */}
          <div className="mt-6 pt-4 border-t-2 border-neutral-100 text-center">
            <Link
              to="/admin/login"
              className="text-xs font-bold text-ink/70 hover:text-coral transition-colors inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Organizer or CTO? Enter Admin Portal →</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Google Account Chooser Modal (fallback if user needs to manually specify account) */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onGoogleSignIn={handleGoogleSuccess}
      />

      <footer className="text-center py-4 border-t border-black/10 text-xs font-bold text-ink/60">
        © 2026 DG Tech Offsite • Built for Safe & Efficient Fleet Logistics
      </footer>
    </div>
  );
}

export default LoginPage;
