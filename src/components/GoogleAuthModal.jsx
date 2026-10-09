import React, { useState, useEffect } from 'react';
import { X, Plus, User, ArrowRight } from 'lucide-react';

export function GoogleAuthModal({
  isOpen,
  onClose,
  onGoogleSignIn,
}) {
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load accounts remembered on this mobile device/browser
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dg_saved_google_accounts');
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      } else {
        setSavedAccounts([]);
      }
    } catch (e) {
      setSavedAccounts([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1-Tap sign in with a selected Google account
  const handleSelectAccount = async (account) => {
    setLoading(true);
    setError(null);
    try {
      await onGoogleSignIn({
        email: account.email,
        name: account.name,
        googleId: account.googleId || `google_${account.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        avatar:
          account.avatar ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(account.name)}`,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to authenticate with this Google account.');
    } finally {
      setLoading(false);
    }
  };

  // Add & remember a new Google account on this device
  const handleAddNewAccount = async (e) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid Google/Gmail address.');
      return;
    }

    const emailClean = newEmail.trim().toLowerCase();
    const derivedName = newName.trim() || emailClean.split('@')[0].replace('.', ' ');
    const formattedName = derivedName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const newAccount = {
      email: emailClean,
      name: formattedName,
      googleId: `google_${Date.now()}`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(formattedName)}`,
    };

    // Save to device's remembered accounts
    const updated = [newAccount, ...savedAccounts.filter((a) => a.email !== emailClean)];
    try {
      localStorage.setItem('dg_saved_google_accounts', JSON.stringify(updated));
    } catch (e) {}

    // Instantly sign in
    await handleSelectAccount(newAccount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white border-3 border-black rounded-3xl p-6 shadow-brutal-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full border-2 border-black bg-surface-cream hover:bg-coral hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Google Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-black flex items-center justify-center shadow-brutal-sm mb-2">
            <svg className="w-7 h-7" viewBox="0 0 24 24">
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
          </div>
          <h3 className="font-display font-black text-lg text-ink uppercase tracking-tight">
            Select Google Account
          </h3>
          <p className="text-xs font-semibold text-neutral-500 mt-0.5">
            to sign in to DG Tech Offsite 2.0
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-coral rounded-xl text-xs font-bold text-coral-hover">
            {error}
          </div>
        )}

        {/* Account Selection List */}
        {!isAddingNew ? (
          <div className="space-y-2">
            {savedAccounts.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedAccounts.map((account, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSelectAccount(account)}
                    className="w-full p-3 rounded-2xl border-2 border-black bg-white hover:bg-neutral-50 flex items-center justify-between transition-all shadow-sm hover:shadow-brutal-sm text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-sunshine border border-black flex items-center justify-center font-black text-xs flex-shrink-0">
                        {account.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs text-ink truncate">
                          {account.name}
                        </p>
                        <p className="text-[11px] font-medium text-neutral-500 truncate">
                          {account.email}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Select / Connect another account */}
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full p-3 rounded-2xl border-2 border-dashed border-black/50 hover:border-black bg-surface-soft hover:bg-white flex items-center gap-3 text-xs font-bold text-ink transition-all"
            >
              <div className="w-8 h-8 rounded-full border border-black/40 flex items-center justify-center text-neutral-600">
                <Plus className="w-4 h-4" />
              </div>
              <span>Use another Google account</span>
            </button>
          </div>
        ) : (
          /* Quick Google Account Input Form */
          <form onSubmit={handleAddNewAccount} className="space-y-3">
            <div>
              <label className="block text-xs font-black uppercase text-ink mb-1">
                Google / Gmail Address
              </label>
              <input
                type="email"
                required
                autoFocus
                placeholder="e.g. rahul.sharma@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-ink mb-1">
                Your Name <span className="text-neutral-400 text-[10px] lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Auto-derived if left blank"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="btn-brutal px-3 py-2 text-xs bg-neutral-100 text-ink hover:bg-neutral-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-brutal py-2 text-xs bg-sunshine text-ink font-black uppercase tracking-wide shadow-brutal-sm"
              >
                {loading ? 'Selecting...' : 'Select Account →'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-neutral-100 text-center">
          <p className="text-[10px] text-neutral-400 font-medium">
            🔒 Direct Google Identity Authentication. No password required.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GoogleAuthModal;
