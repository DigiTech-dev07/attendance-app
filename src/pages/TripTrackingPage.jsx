import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { use4HourTimer } from '../hooks/use4HourTimer';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import {
  Compass,
  MapPin,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  StopCircle,
  WifiOff,
  Navigation,
  ArrowLeft,
} from 'lucide-react';

export function TripTrackingPage() {
  const { direction } = useParams(); // 'departure' or 'return'
  const tripType = direction?.toUpperCase() === 'RETURN' ? 'RETURN' : 'DEPARTURE';

  const { user, userProfile, refreshUser } = useAuth();
  const { eventConfig } = useEvent();
  const navigate = useNavigate();

  const registration =
    tripType === 'RETURN'
      ? userProfile?.returnTrip?.registration
      : userProfile?.departure?.registration;

  const initialAttendance =
    tripType === 'RETURN'
      ? userProfile?.returnTrip?.attendance
      : userProfile?.departure?.attendance;

  const [attendance, setAttendance] = useState(initialAttendance);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState(
    initialAttendance?.status === 'MARKED'
  );
  const [errorMessage, setErrorMessage] = useState(null);

  // Geolocation Hook
  const {
    coords,
    isTracking,
    permissionState,
    error: geoError,
    isOnline,
    lastReceivedTime,
    trackingStartedAt,
    startTracking,
    stopTracking,
  } = useGeolocation();

  // 4-Hour Timer Hook per Requirement Section 14 & 36
  const { formattedRemaining, isExpired } = use4HourTimer({
    isActive: isTracking,
    startedAt: trackingStartedAt,
    onExpire: () => {
      stopTracking(tripType, 'EXPIRED');
    },
  });

  useEffect(() => {
    if (initialAttendance?.status === 'MARKED') {
      setAttendanceSuccess(true);
      setAttendance(initialAttendance);
    }
  }, [initialAttendance]);

  // If user hasn't registered for this trip yet, redirect to dashboard
  useEffect(() => {
    if (!registration && userProfile) {
      navigate('/dashboard');
    }
  }, [registration, userProfile, navigate]);

  // Trigger celebratory confetti on attendance mark
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FEE135', '#FF4D30', '#3B82F6', '#10B981'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handleStartLocation = async () => {
    setErrorMessage(null);
    const success = await startTracking(tripType);
    if (!success) {
      setErrorMessage(
        'Location permission is required. Please allow browser location access in your address bar.'
      );
    }
  };

  const handleStopTrip = async () => {
    if (window.confirm('Are you sure you want to stop live tracking for this trip?')) {
      await stopTracking(tripType, 'MANUAL');
      await refreshUser();
    }
  };

  // Mark Attendance (Strictly Gated by Active GPS Location Sharing)
  const handleMarkAttendance = async () => {
    if (!isTracking || !coords) {
      setErrorMessage(
        'Attendance: Disabled. Reason: Location sharing is required to mark attendance. Please click "Share Location" first.'
      );
      return;
    }

    setMarkingAttendance(true);
    setErrorMessage(null);

    try {
      const res = await api.attendance.mark({
        tripType,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (res.success) {
        setAttendance(res.attendance);
        setAttendanceSuccess(true);
        triggerConfetti();
        await refreshUser();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to mark attendance.');
    } finally {
      setMarkingAttendance(false);
    }
  };

  // Determine Gatekeeper State
  const isLocationActive = isTracking && coords !== null;
  const isAttendanceMarked = attendance?.status === 'MARKED' || attendanceSuccess;

  const journeyTitle =
    tripType === 'RETURN'
      ? `${eventConfig?.returnStartPoint || 'Anchaviyo Resort'} → ${eventConfig?.returnDestination || 'G Corp Tech Park'}`
      : `${eventConfig?.departureStartPoint || 'G Corp Tech Park'} → ${eventConfig?.departureDestination || 'Anchaviyo Resort'}`;

  const vehicleLabel =
    registration?.mode === 'CAR'
      ? `Car - ${registration.vehicleNumber} (${registration.carModel})`
      : registration?.busNumber || 'Bus';

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 md:py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/70 hover:text-ink mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Network Failure Banner per Requirement Section 35 */}
        {!isOnline && (
          <div className="mb-4 p-3.5 bg-amber-50 border-2 border-amber-500 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-amber-900 shadow-sm animate-pulse">
            <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p>⚠ Connection interrupted. Reconnecting...</p>
              {lastReceivedTime && (
                <p className="text-[11px] text-amber-700">
                  Last location received: {lastReceivedTime}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tracking Expired Notification per Requirement Section 36 */}
        {isExpired && (
          <div className="mb-4 p-4 bg-neutral-100 border-2 border-neutral-400 rounded-2xl flex items-start gap-3 text-xs font-bold text-neutral-800 shadow-sm">
            <Clock className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-sm text-neutral-900">Tracking Complete</h4>
              <p className="mt-0.5">
                Your 4-hour location-sharing session has ended automatically. Your attendance remains recorded.
              </p>
            </div>
          </div>
        )}

        <div className="card-brutal p-6 md:p-8 bg-white mb-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-neutral-100 pb-4 mb-5">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-coral">
                {tripType === 'RETURN' ? 'Return Trip' : 'Departure Trip'} • Live Tracking
              </span>
              <h1 className="font-display font-black text-xl sm:text-2xl text-ink uppercase tracking-tight">
                {journeyTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge
                status={
                  isAttendanceMarked
                    ? 'MARKED'
                    : isLocationActive
                    ? 'ACTIVE'
                    : 'NOT_MARKED'
                }
              />
            </div>
          </div>

          {/* Vehicle Info Badge */}
          <div className="p-3.5 rounded-2xl bg-surface-soft border-2 border-black mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">
                {registration?.mode === 'CAR' ? '🚗' : '🚌'}
              </span>
              <div>
                <span className="text-[10px] font-black uppercase text-ink/60">
                  Registered Travel Vehicle
                </span>
                <h4 className="font-black text-sm text-ink">{vehicleLabel}</h4>
              </div>
            </div>
            <span className="badge-stamp bg-white text-ink text-xs">
              {registration?.mode}
            </span>
          </div>

          {/* Error messages */}
          {(errorMessage || geoError) && (
            <div className="mb-5 p-3.5 bg-red-50 border-2 border-coral rounded-xl text-xs font-bold text-coral-hover flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage || geoError}</span>
            </div>
          )}

          {/* Telemetry Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-surface-soft border border-neutral-200">
              <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                Location Sharing
              </span>
              <span className="font-black text-xs sm:text-sm text-ink flex items-center gap-1.5 mt-0.5">
                {isTracking ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-emerald-700">Active</span>
                  </>
                ) : (
                  <span className="text-neutral-500">Inactive</span>
                )}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-soft border border-neutral-200">
              <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                4-Hour Session
              </span>
              <span className="font-black text-xs sm:text-sm text-ink flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-coral" />
                <span>{isTracking ? formattedRemaining : '04:00:00'}</span>
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-surface-soft border border-neutral-200">
              <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                GPS Accuracy
              </span>
              <span className="font-black text-xs sm:text-sm text-ink mt-0.5 block">
                {coords?.accuracy ? `±${Math.round(coords.accuracy)}m` : 'Waiting for GPS'}
              </span>
            </div>
          </div>

          {/* Live GPS Coordinates Preview */}
          {coords && (
            <div className="p-3 bg-blue-50/70 border border-electric/40 rounded-xl mb-6 text-xs text-ink/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-electric animate-pulse" />
                <span className="font-bold">
                  Lat: {coords.latitude.toFixed(5)}, Lng: {coords.longitude.toFixed(5)}
                </span>
              </div>
              {lastReceivedTime && (
                <span className="text-[11px] text-ink/60">{lastReceivedTime}</span>
              )}
            </div>
          )}

          {/* Action Gatekeeper Controls per Requirement Section 12 */}
          <div className="space-y-4">
            {/* 1. Share Location Button */}
            {!isTracking ? (
              <button
                type="button"
                onClick={handleStartLocation}
                className="w-full btn-brutal py-3.5 bg-sunshine text-ink hover:bg-sunshine-dark font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-brutal"
              >
                <Radio className="w-4 h-4 text-coral animate-pulse" />
                <span>Step 1: Share Live Location</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-mint-light/60 border-2 border-mint-dark text-xs font-black text-mint-dark">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-mint-dark" />
                  <span>GPS Location Sharing Active</span>
                </div>
                <button
                  type="button"
                  onClick={handleStopTrip}
                  className="px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:text-coral text-[11px] font-bold"
                >
                  Stop Trip
                </button>
              </div>
            )}

            {/* 2. Mark Attendance Button (STRICTLY GATED) */}
            <div>
              <button
                type="button"
                disabled={!isLocationActive || isAttendanceMarked || markingAttendance}
                onClick={handleMarkAttendance}
                className={`w-full btn-brutal py-4 font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-brutal ${
                  isAttendanceMarked
                    ? 'bg-mint text-white cursor-default'
                    : isLocationActive
                    ? 'bg-coral text-white hover:bg-coral-hover'
                    : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isAttendanceMarked ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>✓ Attendance Marked</span>
                  </>
                ) : markingAttendance ? (
                  <span>Recording Attendance...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Step 2: Mark Attendance</span>
                  </>
                )}
              </button>

              {/* Requirement 12 Strict Reason Text when disabled */}
              {!isLocationActive && !isAttendanceMarked && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 flex items-start gap-2">
                  <span className="text-amber-600 font-black">ℹ</span>
                  <div>
                    <span className="text-ink font-black">Attendance: Disabled</span>
                    <p className="font-medium text-amber-800 text-[11px] mt-0.5">
                      Reason: Location sharing is required to mark attendance. Please click "Share Live Location" above and grant device GPS access.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post-Attendance Success Card per Requirement Section 17 */}
        {isAttendanceMarked && (
          <div className="card-brutal p-6 bg-white border-mint-dark shadow-brutal animate-fade-in">
            <div className="flex items-center gap-3 mb-4 border-b-2 border-neutral-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-mint-light border-2 border-mint-dark flex items-center justify-center text-xl text-mint-dark font-black">
                ✓
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-ink uppercase tracking-tight">
                  Attendance Confirmed
                </h3>
                <p className="text-xs font-semibold text-neutral-600">
                  Your trip is confirmed and recorded.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-500 font-bold">Vehicle:</span>
                <span className="font-black text-ink">{vehicleLabel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-500 font-bold">Location Sharing:</span>
                <span className="font-black text-mint-dark">
                  {isTracking ? 'Active' : 'Completed'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-500 font-bold">Trip:</span>
                <span className="font-black text-ink">{journeyTitle}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500 font-bold">Status:</span>
                <span className="badge-stamp bg-sunshine text-ink text-[10px]">
                  Ready to Go
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default TripTrackingPage;
