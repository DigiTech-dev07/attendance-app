import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Car, Users, Plus, Trash2, Edit2, Check, ArrowLeft, MapPin, Compass } from 'lucide-react';

export function CarRegistrationPage() {
  const { user, userProfile, refreshUser } = useAuth();
  const { eventConfig } = useEvent();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripType = searchParams.get('type') === 'return' ? 'RETURN' : 'DEPARTURE';

  // Load existing registration if available
  const existingReg =
    tripType === 'RETURN'
      ? userProfile?.returnTrip?.registration
      : userProfile?.departure?.registration;

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [startLocation, setStartLocation] = useState('Thane');
  const [route, setRoute] = useState('Thane → Western Express Highway → Anchaviyo Resort');
  const [passengers, setPassengers] = useState([]);
  const [newPassengerName, setNewPassengerName] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (existingReg && existingReg.mode === 'CAR') {
      setVehicleNumber(existingReg.vehicleNumber || '');
      setCarModel(existingReg.carModel || '');
      setStartLocation(existingReg.startLocation || 'Thane');
      setRoute(existingReg.route || '');
      if (existingReg.passengers && existingReg.passengers.length > 0) {
        setPassengers(existingReg.passengers.map((p) => (typeof p === 'string' ? p : p.name)));
      } else {
        setPassengers([user?.name || 'Owner']);
      }
    } else {
      // Default initial passenger: the logged-in owner
      if (user?.name) {
        setPassengers([user.name]);
      }
    }
  }, [existingReg, user]);

  const handleAddPassenger = (e) => {
    e.preventDefault();
    if (!newPassengerName.trim()) return;
    setPassengers([...passengers, newPassengerName.trim()]);
    setNewPassengerName('');
  };

  const handleRemovePassenger = (index) => {
    if (index === 0 && passengers[0] === user?.name) {
      // Cannot remove primary owner
      setError('The primary employee / car owner cannot be removed from passengers.');
      return;
    }
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handleStartEditPassenger = (index) => {
    setEditingIndex(index);
    setEditingName(passengers[index]);
  };

  const handleSaveEditPassenger = (index) => {
    if (!editingName.trim()) return;
    const updated = [...passengers];
    updated[index] = editingName.trim();
    setPassengers(updated);
    setEditingIndex(null);
    setEditingName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Strict Validations per Requirement 7 & 42
    if (!vehicleNumber.trim()) {
      setError('Vehicle Registration Number is mandatory (e.g. MH 04 AB 1234).');
      return;
    }
    if (!carModel.trim()) {
      setError('Car Model is mandatory (e.g. Hyundai Creta).');
      return;
    }

    setLoading(true);

    try {
      const res = await api.trip.register({
        tripType,
        mode: 'CAR',
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        carModel: carModel.trim(),
        startLocation: startLocation.trim(),
        route: route.trim(),
        passengers: passengers.map((name) => ({ name })),
      });

      if (res.success) {
        setSuccessMsg('Car registration saved successfully!');
        await refreshUser();
        setTimeout(() => {
          navigate(tripType === 'RETURN' ? '/trip/return' : '/trip/departure');
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to save car registration.');
    } finally {
      setLoading(false);
    }
  };

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

        <div className="card-brutal p-6 md:p-8 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-coral border-2 border-black flex items-center justify-center text-2xl shadow-brutal-sm">
              🚗
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-coral">
                {tripType === 'RETURN' ? 'Return Trip' : 'Departure Trip'} Registration
              </span>
              <h1 className="font-display font-black text-2xl text-ink uppercase tracking-tight">
                Car Travel Information
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
            {/* Primary Employee / Car Owner Banner per Requirement 7 */}
            <div className="p-4 rounded-2xl bg-sunshine-light border-2 border-black shadow-sm">
              <span className="text-[10px] font-black uppercase text-ink/60 tracking-wider">
                Car Owner / Primary Employee
              </span>
              <div className="flex items-center gap-3 mt-1">
                {user?.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-black"
                  />
                )}
                <div>
                  <h4 className="font-black text-sm text-ink">{user?.name}</h4>
                  <p className="text-xs text-ink/70">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Mandatory Vehicle Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-ink mb-1.5">
                  Vehicle Number <span className="text-coral">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH 04 AB 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-sm font-black rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-coral uppercase shadow-sm"
                />
                <p className="text-[11px] text-ink/60 mt-1">Vehicle plate number</p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-ink mb-1.5">
                  Car Model <span className="text-coral">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyundai Creta"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-coral shadow-sm"
                />
                <p className="text-[11px] text-ink/60 mt-1">Make & model of the car</p>
              </div>
            </div>

            {/* People in the Car (Passengers) per Requirement 8 */}
            <div className="p-4 rounded-2xl border-2 border-black bg-surface-soft">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-coral" />
                  <h3 className="font-black text-sm text-ink uppercase tracking-tight">
                    People in the Car
                  </h3>
                </div>
                <span className="badge-stamp bg-white text-ink text-xs">
                  Count: {passengers.length}
                </span>
              </div>

              {/* Dynamic Passenger List */}
              <div className="space-y-2 mb-4">
                {passengers.map((passenger, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border-2 border-black/80 shadow-sm text-xs"
                  >
                    {editingIndex === index ? (
                      <div className="flex-1 flex items-center gap-2 mr-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-2 py-1 rounded border border-black text-xs font-bold"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditPassenger(index)}
                          className="p-1 rounded bg-mint-light text-mint-dark border border-black"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-sunshine border border-black flex items-center justify-center font-black text-[10px]">
                          {index + 1}
                        </span>
                        <span className="font-bold text-ink">{passenger}</span>
                        {index === 0 && passenger === user?.name && (
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-coral text-white rounded">
                            Owner
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      {editingIndex !== index && (
                        <button
                          type="button"
                          onClick={() => handleStartEditPassenger(index)}
                          title="Edit Name"
                          className="p-1 text-ink/60 hover:text-ink"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePassenger(index)}
                        title="Remove Passenger"
                        className="p-1 text-ink/60 hover:text-coral"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Passenger Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter passenger name..."
                  value={newPassengerName}
                  onChange={(e) => setNewPassengerName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border-2 border-black bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPassenger}
                  className="btn-brutal px-3.5 py-2 bg-sunshine text-ink text-xs font-black flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Passenger
                </button>
              </div>
            </div>

            {/* Starting Location & Route per Requirement 9 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-ink mb-1.5">
                  Starting Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thane West / G Corp Tech Park"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-coral shadow-sm"
                  />
                </div>
                <p className="text-[11px] text-ink/60 mt-1">
                  Location from which your car will begin the trip
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-ink mb-1.5">
                  Travel Route
                </label>
                <div className="relative">
                  <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thane → Western Express Highway → Mumbai → Anchaviyo Resort"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-coral shadow-sm"
                  />
                </div>
                <p className="text-[11px] text-ink/60 mt-1">Expected highway route to the destination</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-brutal py-3.5 bg-coral text-white hover:bg-coral-hover font-black text-sm uppercase tracking-wide shadow-brutal"
            >
              {loading ? 'Saving Car Registration...' : 'Confirm & Save Car Travel Details'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CarRegistrationPage;
