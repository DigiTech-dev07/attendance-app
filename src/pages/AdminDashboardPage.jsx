import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { useRealtimeVehicles } from '../hooks/useRealtimeVehicles';
import Navbar from '../components/Navbar';
import LiveMap from '../components/LiveMap';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import {
  Users,
  CheckCircle,
  Clock,
  Car,
  Bus,
  Radio,
  MapPin,
  Settings,
  RefreshCw,
  Search,
  Power,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const { eventConfig, toggleReturnTrip, updateConfig } = useEvent();
  const navigate = useNavigate();

  const [tripType, setTripType] = useState('DEPARTURE'); // 'DEPARTURE' | 'RETURN'
  const [activeTab, setActiveTab] = useState('MAP'); // 'MAP' | 'BUSES' | 'CARS' | 'EMPLOYEES' | 'CONFIG'
  const [selectedBusTab, setSelectedBusTab] = useState('Bus 1'); // 'Bus 1' | 'Bus 2'
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingReturn, setTogglingReturn] = useState(false);

  // Editable Event Config state
  const [configForm, setConfigForm] = useState({
    eventName: '',
    departureDate: '',
    departureStartPoint: '',
    departureDestination: '',
    returnDate: '',
    returnStartPoint: '',
    returnDestination: '',
    trackingDurationMinutes: 240,
  });
  const [configSuccess, setConfigSuccess] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);

  // Live vehicles hook for map and real-time counter
  const { vehicles, lastUpdated, refreshVehicles } = useRealtimeVehicles(tripType);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (eventConfig) {
      setConfigForm({
        eventName: eventConfig.eventName || 'DG Tech Offsite 2.0',
        departureDate: eventConfig.departureDate || '10 October 2026',
        departureStartPoint: eventConfig.departureStartPoint || 'G Corp Tech Park',
        departureDestination: eventConfig.departureDestination || 'Anchaviyo Resort',
        returnDate: eventConfig.returnDate || '12 October 2026',
        returnStartPoint: eventConfig.returnStartPoint || 'Anchaviyo Resort',
        returnDestination: eventConfig.returnDestination || 'G Corp Tech Park',
        trackingDurationMinutes: eventConfig.trackingDurationMinutes || 240,
      });
    }
  }, [eventConfig]);

  const loadData = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [statsRes, employeesRes] = await Promise.all([
        api.admin.getDashboard(tripType),
        api.admin.getEmployees(tripType),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (employeesRes.success) setEmployees(employeesRes.employees);
    } catch (err) {
      console.warn('Admin load data error:', err.message);
    } finally {
      setLoadingStats(false);
    }
  }, [tripType]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleToggleReturnTrip = async () => {
    const newState = !eventConfig?.returnTripEnabled;
    const confirmMsg = newState
      ? 'Enable Return Trip attendance for all employees now?'
      : 'Disable Return Trip attendance? Employees will see the "Coming Soon" screen.';

    if (window.confirm(confirmMsg)) {
      setTogglingReturn(true);
      try {
        await toggleReturnTrip(newState);
        await loadData();
      } catch (err) {
        alert(err.message || 'Failed to toggle return trip');
      } finally {
        setTogglingReturn(false);
      }
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigLoading(true);
    setConfigSuccess(null);
    try {
      await updateConfig(configForm);
      setConfigSuccess('Event configuration updated successfully!');
      await loadData();
      setTimeout(() => setConfigSuccess(null), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save configuration');
    } finally {
      setConfigLoading(false);
    }
  };

  // Filtered employees for search
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.vehicleNumber && emp.vehicleNumber.toLowerCase().includes(q)) ||
      (emp.busNumber && emp.busNumber.toLowerCase().includes(q))
    );
  });

  // Filtered bus employees
  const busEmployees = employees.filter(
    (emp) => emp.mode === 'BUS' && emp.busNumber === selectedBusTab
  );

  // Filtered cars
  const registeredCars = vehicles.filter((v) => v.type === 'CAR');

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8">
        {/* Admin Command Header Banner */}
        <div className="bg-sunshine border-3 border-black rounded-3xl p-6 md:p-8 shadow-brutal mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="sticker-pill bg-coral text-white text-xs">
                  ★ Organizer Command Center
                </span>
                <span className="sticker-pill bg-black text-sunshine text-xs">
                  CTO Live Dashboard
                </span>
              </div>
              <h1 className="font-display font-black text-2xl sm:text-4xl text-ink uppercase tracking-tight">
                {eventConfig?.eventName || 'DG Tech Offsite 2.0'}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-ink/80 mt-1">
                Real-time Fleet Tracking, Attendance Verification & Event Controls
              </p>
            </div>

            {/* Journey Selector & Return Trip Toggle Switch */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Trip Type Selector */}
              <div className="flex bg-white rounded-2xl p-1.5 border-2 border-black shadow-brutal-sm text-xs font-black">
                <button
                  onClick={() => setTripType('DEPARTURE')}
                  className={`px-3 py-1.5 rounded-xl transition-colors ${
                    tripType === 'DEPARTURE'
                      ? 'bg-black text-white'
                      : 'text-ink hover:bg-neutral-100'
                  }`}
                >
                  Departure (10 Oct)
                </button>
                <button
                  onClick={() => setTripType('RETURN')}
                  className={`px-3 py-1.5 rounded-xl transition-colors ${
                    tripType === 'RETURN'
                      ? 'bg-black text-white'
                      : 'text-ink hover:bg-neutral-100'
                  }`}
                >
                  Return (12 Oct)
                </button>
              </div>

              {/* Dynamic Return Trip Toggle Switch per Requirements Section 27 & 28 */}
              <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-2xl border-2 border-black shadow-brutal-sm">
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-ink/60 block">
                    Return Trip Flow
                  </span>
                  <span
                    className={`text-xs font-black uppercase ${
                      eventConfig?.returnTripEnabled ? 'text-mint-dark' : 'text-neutral-500'
                    }`}
                  >
                    {eventConfig?.returnTripEnabled ? '● Enabled' : '○ Disabled'}
                  </span>
                </div>
                <button
                  onClick={handleToggleReturnTrip}
                  disabled={togglingReturn}
                  className={`btn-brutal px-2.5 py-1 text-xs font-black uppercase ${
                    eventConfig?.returnTripEnabled
                      ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                      : 'bg-mint-dark text-white hover:bg-emerald-700'
                  }`}
                >
                  {togglingReturn
                    ? 'Updating...'
                    : eventConfig?.returnTripEnabled
                    ? 'Disable'
                    : 'Enable Return'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* High-Level Metric Cards (Real DB counts, no dummy data per Section 39) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {/* Total Employees */}
          <div className="card-brutal p-4 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">
                Total Employees
              </span>
              <Users className="w-4 h-4 text-electric" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-ink">
              {stats?.totalEmployees || 0}
            </p>
            <span className="text-[10px] font-bold text-neutral-400 mt-1">
              Registered users
            </span>
          </div>

          {/* Present / Attendance Marked */}
          <div className="card-brutal p-4 bg-white flex flex-col justify-between border-mint-dark">
            <div className="flex items-center justify-between text-mint-dark mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">
                Present (Marked)
              </span>
              <CheckCircle className="w-4 h-4 text-mint-dark" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-mint-dark">
              {stats?.presentCount || 0}
            </p>
            <span className="text-[10px] font-bold text-neutral-400 mt-1">
              GPS verified
            </span>
          </div>

          {/* Not Marked */}
          <div className="card-brutal p-4 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">
                Not Marked
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-neutral-700">
              {stats?.notMarkedCount || 0}
            </p>
            <span className="text-[10px] font-bold text-neutral-400 mt-1">
              Pending check-in
            </span>
          </div>

          {/* Currently Tracking */}
          <div className="card-brutal p-4 bg-sunshine-light flex flex-col justify-between">
            <div className="flex items-center justify-between text-ink mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">
                Live Tracking
              </span>
              <Radio className="w-4 h-4 text-coral animate-pulse" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-coral">
              {vehicles.filter((v) => v.trackingStatus === 'ACTIVE').length}
            </p>
            <span className="text-[10px] font-bold text-neutral-600 mt-1">
              Active GPS vehicles
            </span>
          </div>

          {/* Buses Count */}
          <div className="card-brutal p-4 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">
                Buses
              </span>
              <Bus className="w-4 h-4 text-electric" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-ink">
              {stats?.busCount || 2}
            </p>
            <span className="text-[10px] font-bold text-neutral-400 mt-1">
              Bus 1: {stats?.bus1Count || 0} • Bus 2: {stats?.bus2Count || 0}
            </span>
          </div>

          {/* Registered Cars */}
          <div className="card-brutal p-4 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">
                Cars
              </span>
              <Car className="w-4 h-4 text-coral" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-ink">
              {registeredCars.length}
            </p>
            <span className="text-[10px] font-bold text-neutral-400 mt-1">
              Private carpools
            </span>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b-2 border-black pb-3">
          <button
            onClick={() => setActiveTab('MAP')}
            className={`btn-brutal px-4 py-2 text-xs md:text-sm flex items-center gap-1.5 ${
              activeTab === 'MAP' ? 'bg-sunshine text-ink' : 'bg-white text-ink hover:bg-neutral-50'
            }`}
          >
            <MapPin className="w-4 h-4 text-coral" />
            <span>🗺️ Live Fleet Map</span>
          </button>

          <button
            onClick={() => setActiveTab('BUSES')}
            className={`btn-brutal px-4 py-2 text-xs md:text-sm flex items-center gap-1.5 ${
              activeTab === 'BUSES' ? 'bg-sunshine text-ink' : 'bg-white text-ink hover:bg-neutral-50'
            }`}
          >
            <Bus className="w-4 h-4 text-electric" />
            <span>🚌 Bus Admin View</span>
          </button>

          <button
            onClick={() => setActiveTab('CARS')}
            className={`btn-brutal px-4 py-2 text-xs md:text-sm flex items-center gap-1.5 ${
              activeTab === 'CARS' ? 'bg-sunshine text-ink' : 'bg-white text-ink hover:bg-neutral-50'
            }`}
          >
            <Car className="w-4 h-4 text-coral" />
            <span>🚗 Car Admin View</span>
          </button>

          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`btn-brutal px-4 py-2 text-xs md:text-sm flex items-center gap-1.5 ${
              activeTab === 'EMPLOYEES'
                ? 'bg-sunshine text-ink'
                : 'bg-white text-ink hover:bg-neutral-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 All Employees ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`btn-brutal px-4 py-2 text-xs md:text-sm flex items-center gap-1.5 ${
              activeTab === 'CONFIG' ? 'bg-sunshine text-ink' : 'bg-white text-ink hover:bg-neutral-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>⚙️ Event Settings</span>
          </button>
        </div>

        {/* TAB 1: LIVE MAP */}
        {activeTab === 'MAP' && (
          <div className="space-y-4">
            <LiveMap
              vehicles={vehicles}
              tripType={tripType}
              eventConfig={eventConfig}
              height="560px"
            />
          </div>
        )}

        {/* TAB 2: BUS ADMIN VIEW per Requirement Section 24 */}
        {activeTab === 'BUSES' && (
          <div className="card-brutal p-6 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="font-display font-black text-xl text-ink uppercase tracking-tight">
                  Bus Fleet Attendance & Passenger Lists
                </h2>
                <p className="text-xs font-bold text-ink/70">
                  Select a bus tab to view registered employees and attendance status
                </p>
              </div>

              {/* Subtabs for Bus 1 and Bus 2 */}
              <div className="flex bg-surface-soft p-1.5 rounded-2xl border-2 border-black shadow-sm text-xs font-black">
                <button
                  onClick={() => setSelectedBusTab('Bus 1')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    selectedBusTab === 'Bus 1'
                      ? 'bg-electric text-white border-2 border-black shadow-brutal-sm'
                      : 'text-ink hover:bg-neutral-200'
                  }`}
                >
                  Bus 1 ({employees.filter((e) => e.mode === 'BUS' && e.busNumber === 'Bus 1').length})
                </button>
                <button
                  onClick={() => setSelectedBusTab('Bus 2')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    selectedBusTab === 'Bus 2'
                      ? 'bg-electric text-white border-2 border-black shadow-brutal-sm'
                      : 'text-ink hover:bg-neutral-200'
                  }`}
                >
                  Bus 2 ({employees.filter((e) => e.mode === 'BUS' && e.busNumber === 'Bus 2').length})
                </button>
              </div>
            </div>

            {busEmployees.length === 0 ? (
              <EmptyState
                title={`No Employees on ${selectedBusTab} Yet`}
                message={`No employees have selected ${selectedBusTab} for the ${tripType.toLowerCase()} trip.`}
                icon="🚌"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-black bg-surface-soft font-black uppercase tracking-wider text-ink">
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Attendance</th>
                      <th className="p-3">Location Sharing</th>
                      <th className="p-3">Trip Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-medium">
                    {busEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-3 font-bold text-ink flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-sunshine border border-black flex items-center justify-center font-black text-[10px]">
                            {emp.name.charAt(0)}
                          </div>
                          <span>{emp.name}</span>
                        </td>
                        <td className="p-3 text-neutral-600">{emp.email}</td>
                        <td className="p-3">
                          <StatusBadge status={emp.attendanceStatus} />
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-black ${
                              emp.locationSharingStatus === 'Active'
                                ? 'text-coral'
                                : 'text-neutral-500'
                            }`}
                          >
                            {emp.locationSharingStatus}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-ink">{emp.tripStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CAR ADMIN VIEW per Requirement Section 25 */}
        {activeTab === 'CARS' && (
          <div className="card-brutal p-6 bg-white">
            <div className="mb-6">
              <h2 className="font-display font-black text-xl text-ink uppercase tracking-tight">
                Registered Private Cars & Carpools
              </h2>
              <p className="text-xs font-bold text-ink/70">
                Cars traveling towards the offsite with passengers, owner, and live status
              </p>
            </div>

            {registeredCars.length === 0 ? (
              <EmptyState
                title="No Cars Registered Yet"
                message="No employees have registered a private car for this trip."
                icon="🚗"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registeredCars.map((car) => (
                  <div
                    key={car.vehicleId}
                    className="p-5 rounded-2xl border-2 border-black bg-surface-soft shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-coral">
                          Car Registration
                        </span>
                        <h3 className="font-black text-lg text-ink">{car.vehicleNumber}</h3>
                        <p className="text-xs font-bold text-neutral-600">{car.carModel}</p>
                      </div>
                      <StatusBadge status={car.trackingStatus} />
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-neutral-500 font-bold">Owner: </span>
                        <span className="font-black text-ink">{car.ownerName || 'Employee'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-bold">Route: </span>
                        <span className="font-medium text-ink">
                          {car.startLocation || 'Thane'} → {car.route || 'Anchaviyo Resort'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-bold">
                          Passengers ({car.passengers?.length || 1}):{' '}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {car.passengers && car.passengers.length > 0 ? (
                            car.passengers.map((p, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-white border border-neutral-300 font-bold text-ink text-[11px]"
                              >
                                {typeof p === 'string' ? p : p.name}
                              </span>
                            ))
                          ) : (
                            <span className="font-bold text-ink">{car.ownerName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ALL EMPLOYEES TABLE */}
        {activeTab === 'EMPLOYEES' && (
          <div className="card-brutal p-6 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="font-display font-black text-xl text-ink uppercase tracking-tight">
                  Master Employee Roster ({tripType === 'DEPARTURE' ? 'Departure' : 'Return'})
                </h2>
                <p className="text-xs font-bold text-ink/70">
                  Total Employees: {employees.length} • Marked:{' '}
                  {employees.filter((e) => e.attendanceStatus === 'MARKED').length}
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search employees, cars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-sunshine"
                />
              </div>
            </div>

            {filteredEmployees.length === 0 ? (
              <EmptyState
                title="No Employees Found"
                message={
                  employees.length === 0
                    ? 'No employees have registered yet. Register users to view live roster.'
                    : 'No employees matched your search query.'
                }
                icon="👥"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-black bg-surface-soft font-black uppercase tracking-wider text-ink">
                      <th className="p-3">Employee</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Vehicle / Bus</th>
                      <th className="p-3">Attendance</th>
                      <th className="p-3">Location Sharing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-medium">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-3 font-bold text-ink">
                          <p>{emp.name}</p>
                          <p className="text-[11px] font-normal text-neutral-500">{emp.email}</p>
                        </td>
                        <td className="p-3">
                          <span className="badge-stamp bg-white text-ink text-[10px]">
                            {emp.mode}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-ink">
                          {emp.mode === 'CAR' ? emp.vehicleNumber : emp.busNumber || '—'}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={emp.attendanceStatus} />
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-black ${
                              emp.locationSharingStatus === 'Active'
                                ? 'text-coral'
                                : 'text-neutral-500'
                            }`}
                          >
                            {emp.locationSharingStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: EVENT SETTINGS per Section 2 & 27 */}
        {activeTab === 'CONFIG' && (
          <div className="card-brutal p-6 md:p-8 bg-white max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-sunshine border-2 border-black flex items-center justify-center text-2xl shadow-brutal-sm">
                ⚙️
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-coral">
                  Event Management
                </span>
                <h2 className="font-display font-black text-2xl text-ink uppercase tracking-tight">
                  Dynamic Event Settings
                </h2>
              </div>
            </div>

            {configSuccess && (
              <div className="mb-5 p-3.5 bg-emerald-50 border-2 border-mint-dark rounded-xl text-xs font-bold text-mint-dark flex items-center gap-2">
                <span>✓</span>
                <span>{configSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-ink mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  required
                  value={configForm.eventName}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, eventName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border-2 border-black shadow-sm"
                />
              </div>

              {/* Departure Config */}
              <div className="p-4 rounded-2xl bg-surface-soft border-2 border-black">
                <h3 className="font-black text-xs uppercase text-coral mb-3">
                  Departure Details (Outbound)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Departure Date
                    </label>
                    <input
                      type="text"
                      value={configForm.departureDate}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, departureDate: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">
                        Start Point
                      </label>
                      <input
                        type="text"
                        value={configForm.departureStartPoint}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            departureStartPoint: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">
                        Destination
                      </label>
                      <input
                        type="text"
                        value={configForm.departureDestination}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            departureDestination: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-black"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Config */}
              <div className="p-4 rounded-2xl bg-surface-soft border-2 border-black">
                <h3 className="font-black text-xs uppercase text-electric mb-3">
                  Return Details (Inbound)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Return Date
                    </label>
                    <input
                      type="text"
                      value={configForm.returnDate}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, returnDate: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">
                        Start Point
                      </label>
                      <input
                        type="text"
                        value={configForm.returnStartPoint}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            returnStartPoint: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">
                        Destination
                      </label>
                      <input
                        type="text"
                        value={configForm.returnDestination}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            returnDestination: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-black"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking duration */}
              <div>
                <label className="block text-xs font-black uppercase text-ink mb-1">
                  GPS Tracking Auto-Stop Limit (Minutes)
                </label>
                <input
                  type="number"
                  value={configForm.trackingDurationMinutes}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      trackingDurationMinutes: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border-2 border-black shadow-sm"
                />
                <p className="text-[11px] text-ink/60 mt-1">
                  Default is 240 minutes (4 hours) per specification.
                </p>
              </div>

              <button
                type="submit"
                disabled={configLoading}
                className="w-full btn-brutal py-3 bg-sunshine text-ink hover:bg-sunshine-dark font-black text-sm uppercase tracking-wide mt-2"
              >
                {configLoading ? 'Saving Configuration...' : 'Save Event Settings'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboardPage;
