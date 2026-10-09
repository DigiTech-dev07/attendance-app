const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('dg_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status === 401) {
      // If token expired, clear invalid session
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        localStorage.removeItem('dg_token');
        localStorage.removeItem('dg_user');
      }
    }
    throw err;
  }
}

export const api = {
  // Authentication
  auth: {
    register: (name, email, password) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),

    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    google: (payload) =>
      request('/auth/google', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    adminLogin: (email, password) =>
      request('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    getMe: () => request('/auth/me'),
    getConfig: () => request('/auth/config'),
  },

  // Trips & Location
  trip: {
    register: (tripData) =>
      request('/trip/register', {
        method: 'POST',
        body: JSON.stringify(tripData),
      }),

    startLocation: (locationData) =>
      request('/trip/location/start', {
        method: 'POST',
        body: JSON.stringify(locationData),
      }),

    updateLocation: (locationData) =>
      request('/trip/location/update', {
        method: 'POST',
        body: JSON.stringify(locationData),
      }),

    stopLocation: (data) =>
      request('/trip/location/stop', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Attendance
  attendance: {
    mark: (payload) =>
      request('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getStatus: () => request('/attendance/status'),
  },

  // Admin APIs
  admin: {
    getDashboard: (tripType = 'DEPARTURE') =>
      request(`/admin/dashboard?tripType=${encodeURIComponent(tripType)}`),

    getEmployees: (tripType = 'DEPARTURE') =>
      request(`/admin/employees?tripType=${encodeURIComponent(tripType)}`),

    getVehicles: (tripType = 'DEPARTURE') =>
      request(`/admin/vehicles?tripType=${encodeURIComponent(tripType)}`),

    getVehicle: (id, tripType = 'DEPARTURE') =>
      request(`/admin/vehicles/${id}?tripType=${encodeURIComponent(tripType)}`),

    getEventConfig: () => request('/admin/event'),

    updateEventConfig: (data) =>
      request('/admin/event', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    enableReturnTrip: () =>
      request('/admin/return-trip/enable', {
        method: 'POST',
      }),

    disableReturnTrip: () =>
      request('/admin/return-trip/disable', {
        method: 'POST',
      }),
  },
};

export default api;
