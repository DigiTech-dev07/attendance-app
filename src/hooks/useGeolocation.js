import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unavailable'
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastReceivedTime, setLastReceivedTime] = useState(null);
  const [trackingStartedAt, setTrackingStartedAt] = useState(null);

  const watchIdRef = useRef(null);
  const currentTripTypeRef = useRef('DEPARTURE');
  const lastSentTimeRef = useRef(0);

  // Monitor online / offline network state per requirement Section 35
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  };

  const handlePositionSuccess = useCallback(async (position) => {
    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const now = new Date();
    const formatted = formatTime(now);

    setCoords({ latitude, longitude, accuracy, speed, heading });
    setPermissionState('granted');
    setError(null);
    setLastReceivedTime(formatted);

    // Throttle backend updates: send every 6 seconds to optimize bandwidth
    const currentTimeMs = Date.now();
    if (currentTimeMs - lastSentTimeRef.current >= 5000) {
      lastSentTimeRef.current = currentTimeMs;
      try {
        const res = await api.trip.updateLocation({
          tripType: currentTripTypeRef.current,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
        });

        if (res.expired) {
          // 4-Hour limit reached on server
          stopTracking(currentTripTypeRef.current, 'EXPIRED');
          setError('Your 4-hour location-sharing session has ended automatically.');
        }
      } catch (err) {
        console.warn('Location sync delayed:', err.message);
      }
    }
  }, []);

  const handlePositionError = useCallback((geoError) => {
    console.error('Geolocation error:', geoError);
    switch (geoError.code) {
      case geoError.PERMISSION_DENIED:
        setPermissionState('denied');
        setError('Location permission was denied. Please allow GPS access in your browser settings to mark attendance.');
        break;
      case geoError.POSITION_UNAVAILABLE:
        setPermissionState('unavailable');
        setError('GPS position unavailable. Please check that location services are active on your device.');
        break;
      case geoError.TIMEOUT:
        setError('GPS request timed out. Retrying...');
        break;
      default:
        setError('An unexpected location error occurred.');
    }
  }, []);

  const startTracking = async (tripType = 'DEPARTURE') => {
    currentTripTypeRef.current = tripType;
    setError(null);

    if (!navigator.geolocation) {
      setPermissionState('unavailable');
      setError('Geolocation is not supported by your current browser.');
      return false;
    }

    return new Promise((resolve) => {
      // First get a single position to verify permissions and start session immediately
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy, speed, heading } = position.coords;
          const now = new Date();

          setCoords({ latitude, longitude, accuracy, speed, heading });
          setPermissionState('granted');
          setLastReceivedTime(formatTime(now));
          setTrackingStartedAt(now);
          setIsTracking(true);

          try {
            await api.trip.startLocation({
              tripType,
              latitude,
              longitude,
              accuracy,
              speed,
              heading,
            });
          } catch (err) {
            console.error('Failed to notify backend of tracking start:', err.message);
          }

          // Now start continuous watch
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }

          watchIdRef.current = navigator.geolocation.watchPosition(
            handlePositionSuccess,
            handlePositionError,
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 4000,
            }
          );

          resolve(true);
        },
        (geoError) => {
          handlePositionError(geoError);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const stopTracking = async (tripType = 'DEPARTURE', reason = 'MANUAL') => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);

    try {
      await api.trip.stopLocation({
        tripType,
        reason,
      });
    } catch (err) {
      console.warn('Failed to notify server of tracking stop:', err.message);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    coords,
    isTracking,
    permissionState,
    error,
    isOnline,
    lastReceivedTime,
    trackingStartedAt,
    startTracking,
    stopTracking,
  };
}

export default useGeolocation;
