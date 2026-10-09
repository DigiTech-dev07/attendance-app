import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export function useRealtimeVehicles(tripType = 'DEPARTURE') {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const eventSourceRef = useRef(null);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await api.admin.getVehicles(tripType);
      if (res.success && res.vehicles) {
        setVehicles(res.vehicles);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('Vehicle poll error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tripType]);

  useEffect(() => {
    fetchVehicles();

    // 1. Establish SSE stream for instant real-time pushes
    try {
      const sse = new EventSource('/api/admin/stream');
      eventSourceRef.current = sse;

      sse.addEventListener('vehicle_update', (event) => {
        try {
          const updatedVehicle = JSON.parse(event.data);
          setVehicles((prev) => {
            const index = prev.findIndex((v) => v.vehicleId === updatedVehicle.vehicleId);
            if (index >= 0) {
              const clone = [...prev];
              clone[index] = { ...clone[index], ...updatedVehicle };
              return clone;
            } else {
              return [...prev, updatedVehicle];
            }
          });
          setLastUpdated(new Date());
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      sse.addEventListener('attendance_update', () => {
        fetchVehicles();
      });

      sse.onerror = () => {
        // SSE error - fallback interval handles it smoothly
      };
    } catch (e) {
      console.log('SSE not available, relying on live polling');
    }

    // 2. High-frequency background polling fallback (every 4 seconds)
    const pollInterval = setInterval(() => {
      fetchVehicles();
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [tripType, fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    lastUpdated,
    refreshVehicles: fetchVehicles,
  };
}

export default useRealtimeVehicles;
