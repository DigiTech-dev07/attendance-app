import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Bus, Check, ArrowLeft, User, ShieldCheck } from 'lucide-react';

export function BusRegistrationPage() {
  const { user, userProfile, refreshUser } = useAuth();
  const { eventConfig } = useEvent();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripType = searchParams.get('type') === 'return' ? 'RETURN' : 'DEPARTURE';

  const existingReg =
    tripType === 'RETURN'
      ? userProfile?.returnTrip?.registration
      : userProfile?.departure?.registration;

  const [selectedBus, setSelectedBus] = useState(
    existingReg?.mode === 'BUS' ? existingReg.busNumber : 'Bus 1'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.trip.register({
        tripType,
        mode: 'BUS',
        busNumber: selectedBus,
      });

      if (res.success) {
        setSuccessMsg(`Successfully registered for ${selectedBus}!`);
        await refreshUser();
        setTimeout(() => {
          navigate(tripType === 'RETURN' ? '/trip/return' : '/trip/departure');
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to save bus selection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 md:py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/70 hover:text-ink mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="card-brutal p-6 md:p-8 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-electric border-2 border-black flex items-center justify-center text-2xl shadow-brutal-sm">
              🚌
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-electric">
                {tripType === 'RETURN' ? 'Return Trip' : 'Departure Trip'}
              </span>
              <h1 className="font-display font-black text-2xl text-ink uppercase tracking-tight">
                Bus Self-Selection
              </h1>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border-2 border-coral rounded-xl text-xs font-bold text-coral-hover flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border-2 border-mint-dark rounded-xl text-xs font-bold text-mint-dark flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Confirmation */}
            <div className="p-4 rounded-2xl bg-surface-soft border-2 border-black">
              <span className="text-[10px] font-black uppercase text-ink/60 tracking-wider">
                Passenger Identity
              </span>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-sunshine border border-black flex items-center justify-center font-black text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-ink">{user?.name}</h4>
                    <p className="text-xs text-ink/70">{user?.email}</p>
                  </div>
                </div>
                <span className="badge-stamp bg-mint-light text-mint-dark text-[10px]">
                  ✓ Verified
                </span>
              </div>
            </div>

            {/* Select Bus: Bus 1 vs Bus 2 */}
            <div>
              <label className="block text-xs font-black uppercase text-ink mb-2">
                Choose Your Bus (Self-Selection)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bus 1 */}
                <div
                  onClick={() => setSelectedBus('Bus 1')}
                  className={`p-5 rounded-2xl border-3 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedBus === 'Bus 1'
                      ? 'bg-blue-50 border-electric shadow-brutal-electric ring-2 ring-electric'
                      : 'bg-white border-black hover:bg-neutral-50 shadow-brutal-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">🚌</span>
                    {selectedBus === 'Bus 1' ? (
                      <div className="w-6 h-6 rounded-full bg-electric text-white flex items-center justify-center border-2 border-black text-xs">
                        ✓
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-black/40"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-ink">Bus 1</h3>
                    <p className="text-xs font-semibold text-ink/70 mt-0.5">
                      Departs from {eventConfig?.departureStartPoint || 'G Corp Tech Park'}
                    </p>
                  </div>
                </div>

                {/* Bus 2 */}
                <div
                  onClick={() => setSelectedBus('Bus 2')}
                  className={`p-5 rounded-2xl border-3 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedBus === 'Bus 2'
                      ? 'bg-blue-50 border-electric shadow-brutal-electric ring-2 ring-electric'
                      : 'bg-white border-black hover:bg-neutral-50 shadow-brutal-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">🚌</span>
                    {selectedBus === 'Bus 2' ? (
                      <div className="w-6 h-6 rounded-full bg-electric text-white flex items-center justify-center border-2 border-black text-xs">
                        ✓
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-black/40"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-ink">Bus 2</h3>
                    <p className="text-xs font-semibold text-ink/70 mt-0.5">
                      Departs from {eventConfig?.departureStartPoint || 'G Corp Tech Park'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Route Info */}
            <div className="p-3.5 rounded-xl bg-sunshine-light/60 border border-black text-xs font-medium text-ink/80">
              <span className="font-bold text-ink">Route Details:</span>{' '}
              {tripType === 'RETURN'
                ? `${eventConfig?.returnStartPoint || 'Anchaviyo Resort'} → ${eventConfig?.returnDestination || 'G Corp Tech Park'}`
                : `${eventConfig?.departureStartPoint || 'G Corp Tech Park'} → ${eventConfig?.departureDestination || 'Anchaviyo Resort'}`}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-brutal py-3.5 bg-electric text-white hover:bg-electric-dark font-black text-sm uppercase tracking-wide shadow-brutal"
            >
              {loading ? 'Confirming...' : `Confirm Registration for ${selectedBus}`}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default BusRegistrationPage;
