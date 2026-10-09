import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { Car, Bus, ArrowRight, Calendar, MapPin, Users, Edit3, Compass, CheckCircle } from 'lucide-react';

export function DashboardPage() {
  const { user, userProfile, refreshUser } = useAuth();
  const { eventConfig } = useEvent();
  const navigate = useNavigate();

  const departureReg = userProfile?.departure?.registration;
  const departureAtt = userProfile?.departure?.attendance;
  const returnReg = userProfile?.returnTrip?.registration;
  const returnAtt = userProfile?.returnTrip?.attendance;

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-8">
        {/* Welcome & Event Overview Banner */}
        <section className="bg-sunshine border-3 border-black rounded-3xl p-6 md:p-8 shadow-brutal mb-8 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-7xl select-none opacity-20 pointer-events-none">
            🚀
          </div>
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral text-white font-black text-xs uppercase shadow-brutal-sm mb-3">
              ★ Official Offsite Portal
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-ink uppercase tracking-tight">
              Hey, {user?.name?.split(' ')[0] || 'Traveler'}!
            </h1>
            <p className="text-sm sm:text-base font-bold text-ink/80 mt-1">
              Select your travel mode, register your vehicle details, and share live location on trip day to mark attendance.
            </p>

            <div className="flex flex-wrap gap-3 mt-4 text-xs font-black">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border-2 border-black shadow-sm">
                <Calendar className="w-4 h-4 text-coral" />
                <span>{eventConfig?.departureDate || '10 October 2026'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border-2 border-black shadow-sm">
                <MapPin className="w-4 h-4 text-electric" />
                <span>
                  {eventConfig?.departureStartPoint || 'G Corp Tech Park'} →{' '}
                  {eventConfig?.departureDestination || 'Anchaviyo Resort'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Departure Journey Status or Selection */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-black text-xl md:text-2xl text-ink uppercase tracking-tight">
                Departure Journey
              </h2>
              <p className="text-xs font-bold text-ink/70">
                Outbound Trip to {eventConfig?.departureDestination || 'Anchaviyo Resort'}
              </p>
            </div>
            {departureAtt?.status && (
              <StatusBadge status={departureAtt.status} />
            )}
          </div>

          {departureReg ? (
            /* Already Registered: Show Summary Card */
            <div className="card-brutal p-6 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-neutral-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sunshine border-2 border-black flex items-center justify-center text-2xl shadow-brutal-sm">
                    {departureReg.mode === 'CAR' ? '🚗' : '🚌'}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">
                      Selected Travel Mode
                    </span>
                    <h3 className="font-black text-lg text-ink">
                      {departureReg.mode === 'CAR'
                        ? `Car: ${departureReg.vehicleNumber} (${departureReg.carModel})`
                        : departureReg.busNumber}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      navigate(
                        departureReg.mode === 'CAR' ? '/register/car' : '/register/bus'
                      )
                    }
                    className="btn-brutal px-3 py-2 text-xs bg-white text-ink hover:bg-neutral-50 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Details
                  </button>
                  <button
                    onClick={() => navigate('/trip/departure')}
                    className="btn-brutal px-4 py-2 text-xs bg-coral text-white hover:bg-coral-hover flex items-center gap-1.5 shadow-brutal-sm"
                  >
                    <Compass className="w-4 h-4" />
                    Open Live Tracking & Attendance
                  </button>
                </div>
              </div>

              {/* Registration Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {departureReg.mode === 'CAR' ? (
                  <>
                    <div className="p-3 rounded-xl bg-surface-soft border border-neutral-200">
                      <span className="text-neutral-500 font-bold block mb-1">
                        People in Car ({departureReg.passengers?.length || 1})
                      </span>
                      <ul className="space-y-0.5 font-bold text-ink">
                        {departureReg.passengers && departureReg.passengers.length > 0 ? (
                          departureReg.passengers.map((p, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-coral"></span>
                              <span>{typeof p === 'string' ? p : p.name}</span>
                            </li>
                          ))
                        ) : (
                          <li>{user?.name} (Owner)</li>
                        )}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-soft border border-neutral-200">
                      <span className="text-neutral-500 font-bold block mb-1">Travel Route</span>
                      <p className="font-bold text-ink">
                        Start: {departureReg.startLocation || 'G Corp Tech Park'}
                      </p>
                      <p className="font-medium text-neutral-600 mt-1">
                        Route: {departureReg.route || 'Western Express Highway → Wada'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="col-span-full p-3 rounded-xl bg-surface-soft border border-neutral-200">
                    <span className="text-neutral-500 font-bold block mb-1">Assigned Bus</span>
                    <p className="font-bold text-ink text-sm">{departureReg.busNumber}</p>
                    <p className="font-medium text-neutral-600 mt-0.5">
                      Departure Point: {eventConfig?.departureStartPoint} • Pick up at designated bay.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Not Yet Registered: Show Large Selection Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Coming by Car */}
              <div
                onClick={() => navigate('/register/car')}
                className="card-brutal p-6 bg-white hover:bg-yellow-50 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-coral border-2 border-black flex items-center justify-center text-3xl shadow-brutal-sm mb-4 group-hover:scale-105 transition-transform">
                    🚗
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-coral">
                    Option 1
                  </span>
                  <h3 className="font-black text-xl text-ink mt-0.5">Coming by Car</h3>
                  <p className="text-xs font-bold text-ink/70 mt-1">
                    Drive your private car or carpool with colleagues. Register vehicle number, car model, and passengers.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t-2 border-neutral-100 flex items-center justify-between">
                  <span className="text-xs font-black text-ink uppercase">Select Car Mode</span>
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-brutal-sm group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Option 2: Coming by Bus */}
              <div
                onClick={() => navigate('/register/bus')}
                className="card-brutal p-6 bg-white hover:bg-blue-50 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-electric border-2 border-black flex items-center justify-center text-3xl shadow-brutal-sm mb-4 group-hover:scale-105 transition-transform">
                    🚌
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-electric">
                    Option 2
                  </span>
                  <h3 className="font-black text-xl text-ink mt-0.5">Coming by Bus</h3>
                  <p className="text-xs font-bold text-ink/70 mt-1">
                    Travel with the DG Tech squad in official event coaches. Choose between Bus 1 or Bus 2.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t-2 border-neutral-100 flex items-center justify-between">
                  <span className="text-xs font-black text-ink uppercase">Select Bus Mode</span>
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-brutal-sm group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Return Trip Section per Requirements Section 26, 27, 28 */}
        <section className="mt-8 pt-8 border-t-3 border-black">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-black text-xl md:text-2xl text-ink uppercase tracking-tight">
                Return Trip ({eventConfig?.returnDate || '12 October 2026'})
              </h2>
              <p className="text-xs font-bold text-ink/70">
                {eventConfig?.returnStartPoint || 'Anchaviyo Resort'} →{' '}
                {eventConfig?.returnDestination || 'G Corp Tech Park'}
              </p>
            </div>
            {returnAtt?.status && <StatusBadge status={returnAtt.status} />}
          </div>

          {!eventConfig?.returnTripEnabled ? (
            /* Return Trip Disabled State per Requirement 27 & 28 */
            <div className="card-brutal p-6 bg-neutral-100 border-dashed border-2 border-neutral-400">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-neutral-300 border-2 border-neutral-500 flex items-center justify-center text-2xl">
                  🔒
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-neutral-300 text-neutral-800 text-[10px] font-black uppercase mb-1">
                    Coming Soon
                  </div>
                  <h3 className="font-black text-lg text-neutral-800">
                    Return Trip Attendance
                  </h3>
                  <p className="text-xs font-semibold text-neutral-600 max-w-md mt-0.5">
                    Return attendance will be enabled by the administrator on 12 October 2026. Please check back before departure.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Return Trip Enabled State per Requirement 28 */
            <div className="card-brutal p-6 bg-white border-electric">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-mint-light border-2 border-mint-dark flex items-center justify-center text-2xl shadow-brutal-sm">
                    🔄
                  </div>
                  <div>
                    <span className="badge-stamp bg-mint-light text-mint-dark text-[10px] mb-1">
                      ● Active Now
                    </span>
                    <h3 className="font-black text-lg text-ink">
                      Return Trip Open for Attendance
                    </h3>
                    <p className="text-xs font-bold text-ink/70">
                      Anchaviyo Resort → G Corp Tech Park
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/trip/return')}
                  className="btn-brutal px-4 py-2.5 bg-electric text-white hover:bg-electric-dark font-black text-xs uppercase tracking-wide"
                >
                  Open Return Tracking & Attendance →
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
