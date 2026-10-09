import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { Shield, LogOut, Compass, User, Car, Bus } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { eventConfig } = useEvent();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-sunshine border-b-2 border-black px-4 py-3 shadow-brutal-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Event Title */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-coral border-2 border-black flex items-center justify-center text-white font-black text-xl shadow-brutal-sm group-hover:rotate-6 transition-transform">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg md:text-xl tracking-tight text-ink uppercase">
                {eventConfig?.eventName || 'DG Tech Offsite 2.0'}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-black text-sunshine">
                Live
              </span>
            </div>
            <p className="text-[11px] font-bold text-ink/80 tracking-wide hidden sm:block">
              Attendance & Real-time Vehicle Fleet Tracking
            </p>
          </div>
        </Link>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 md:gap-3">
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className={`btn-brutal px-3 py-1.5 text-xs md:text-sm bg-coral text-white ${
                    location.pathname.startsWith('/admin') ? 'ring-2 ring-black' : ''
                  }`}
                >
                  <Shield className="w-4 h-4 mr-1.5" />
                  Admin Panel
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="btn-brutal px-3 py-1.5 text-xs md:text-sm bg-white text-ink"
                >
                  <Compass className="w-4 h-4 mr-1.5 text-electric" />
                  My Trip
                </Link>
              )}

              {/* User Profile Pill */}
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border-2 border-black shadow-brutal-sm">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full border border-black bg-sunshine-light"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-sunshine border border-black flex items-center justify-center text-[10px] font-black">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="font-bold text-xs max-w-[100px] truncate hidden md:inline">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="text-ink/60 hover:text-coral transition-colors p-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/login"
                className="text-xs font-bold text-ink/75 hover:text-ink underline decoration-2 decoration-coral mr-2 hidden sm:inline"
              >
                Organizer / CTO
              </Link>
              <Link
                to="/login"
                className="btn-brutal px-3 py-1.5 text-xs md:text-sm bg-black text-white hover:bg-neutral-800"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
