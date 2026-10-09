import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const EventContext = createContext(null);

export function EventProvider({ children }) {
  const [eventConfig, setEventConfig] = useState({
    eventName: 'DG Tech Offsite 2.0',
    departureDate: '10 October 2026',
    departureStartPoint: 'G Corp Tech Park',
    departureDestination: 'Anchaviyo Resort',
    returnDate: '12 October 2026',
    returnStartPoint: 'Anchaviyo Resort',
    returnDestination: 'G Corp Tech Park',
    busCount: 2,
    trackingDurationMinutes: 240,
    returnTripEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await api.admin.getEventConfig();
      if (res.success && res.eventConfig) {
        setEventConfig(res.eventConfig);
      }
    } catch (err) {
      // If unauthenticated or offline, use defaults
      console.log('Using default event configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updateConfig = async (newConfig) => {
    const res = await api.admin.updateEventConfig(newConfig);
    if (res.success) {
      setEventConfig(res.eventConfig);
    }
    return res;
  };

  const toggleReturnTrip = async (enable) => {
    const res = enable
      ? await api.admin.enableReturnTrip()
      : await api.admin.disableReturnTrip();
    if (res.success) {
      setEventConfig(res.eventConfig);
    }
    return res;
  };

  return (
    <EventContext.Provider
      value={{
        eventConfig,
        loading,
        fetchConfig,
        updateConfig,
        toggleReturnTrip,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}

export default EventContext;
