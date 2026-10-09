import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Car, Bus, MapPin, Filter, Navigation } from 'lucide-react';
import EmptyState from './EmptyState';

// Route Waypoints between G Corp Tech Park (Thane) and Anchaviyo Resort (Wada)
const DEPARTURE_ROUTE_WAYPOINTS = [
  [19.2665, 72.9775], // G Corp Tech Park, Kasarvadavali, Thane West
  [19.2842, 72.9836], // Ghodbunder Rd Junction
  [19.2965, 73.0180], // Majiwada Flyover
  [19.3180, 73.0640], // Bhiwandi Bypass
  [19.3800, 73.0950], // NH 848 Highway
  [19.4600, 73.1150], // Kudus Bypass
  [19.5600, 73.1250], // Wada Main Road
  [19.6467, 73.1384], // Anchaviyo Resort, Wada
];

// Custom Leaflet DivIcons matching Gen-Z Neo-brutalist styling
function createVehicleIcon(vehicle) {
  const isBus = vehicle.type === 'BUS';
  const isActive = vehicle.trackingStatus === 'ACTIVE';
  const label = isBus ? (vehicle.busNumber || 'Bus') : (vehicle.vehicleNumber || 'Car');
  const bgColor = isBus ? '#3B82F6' : '#FF4D30'; // Electric blue for Bus, Coral for Car

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${
          isActive
            ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: ${bgColor}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
        }
        <div style="
          background-color: ${bgColor};
          color: #FFFFFF;
          border: 2.5px solid #000000;
          box-shadow: 3px 3px 0px #000000;
          border-radius: 9999px;
          padding: 4px 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.02em;
          white-space: nowrap;
          transform: translate(-50%, -50%);
        ">
          <span style="font-size: 14px;">${isBus ? '🚌' : '🚗'}</span>
          <span>${label}</span>
          ${
            isActive
              ? `<span style="width: 8px; height: 8px; border-radius: 9999px; background-color: #10B981; border: 1.5px solid #000;"></span>`
              : ''
          }
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [0, 0],
  });
}

function createPointIcon(label, emoji, bgColor = '#FEE135') {
  return L.divIcon({
    className: 'custom-point-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        color: #111827;
        border: 2.5px solid #000000;
        box-shadow: 3px 3px 0px #000000;
        border-radius: 12px;
        padding: 4px 8px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 900;
        font-size: 11px;
        white-space: nowrap;
        transform: translate(-50%, -100%);
      ">
        <span>${emoji}</span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [0, 0],
  });
}

// Controller to auto-fit bounds
function MapBoundsController({ vehicles, routePoints }) {
  const map = useMap();

  useEffect(() => {
    const points = [];
    routePoints.forEach((p) => points.push(p));

    vehicles.forEach((v) => {
      if (v.currentLatitude && v.currentLongitude) {
        points.push([v.currentLatitude, v.currentLongitude]);
      }
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [vehicles, routePoints, map]);

  return null;
}

export function LiveMap({
  vehicles = [],
  tripType = 'DEPARTURE',
  eventConfig,
  height = '500px',
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'BUSES' | 'CARS'
  const [busFilter, setBusFilter] = useState('ALL'); // 'ALL' | 'Bus 1' | 'Bus 2'

  const startPoint =
    tripType === 'DEPARTURE'
      ? { name: eventConfig?.departureStartPoint || 'G Corp Tech Park', coords: [19.2665, 72.9775] }
      : { name: eventConfig?.returnStartPoint || 'Anchaviyo Resort', coords: [19.6467, 73.1384] };

  const destPoint =
    tripType === 'DEPARTURE'
      ? { name: eventConfig?.departureDestination || 'Anchaviyo Resort', coords: [19.6467, 73.1384] }
      : { name: eventConfig?.returnDestination || 'G Corp Tech Park', coords: [19.2665, 72.9775] };

  const routePolyline = useMemo(() => {
    return tripType === 'DEPARTURE'
      ? DEPARTURE_ROUTE_WAYPOINTS
      : [...DEPARTURE_ROUTE_WAYPOINTS].reverse();
  }, [tripType]);

  // Filter vehicles per requirement Section 23
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (!v.currentLatitude || !v.currentLongitude) return false;

      if (filterType === 'BUSES') {
        if (v.type !== 'BUS') return false;
        if (busFilter !== 'ALL' && v.busNumber !== busFilter) return false;
      } else if (filterType === 'CARS') {
        if (v.type !== 'CAR') return false;
      } else {
        // ALL
        if (busFilter !== 'ALL' && v.type === 'BUS' && v.busNumber !== busFilter) {
          return false;
        }
      }
      return true;
    });
  }, [vehicles, filterType, busFilter]);

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-3 border-black shadow-brutal-lg bg-white">
      {/* Interactive Map Filter Bar */}
      <div className="p-3 md:p-4 bg-sunshine border-b-2 border-black flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center font-black shadow-brutal-sm text-sm">
            🗺️
          </div>
          <div>
            <h4 className="font-black text-sm md:text-base text-ink uppercase tracking-tight">
              Live Fleet Map ({tripType === 'DEPARTURE' ? 'Departure Journey' : 'Return Journey'})
            </h4>
            <p className="text-[11px] font-bold text-ink/70">
              Showing Vehicles Only • Individual Employee Privacy Protected
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
          <div className="flex items-center bg-white rounded-xl p-1 border-2 border-black shadow-brutal-sm">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterType === 'ALL' ? 'bg-black text-white' : 'text-ink hover:bg-neutral-100'
              }`}
            >
              All Vehicles ({vehicles.filter((v) => v.currentLatitude).length})
            </button>
            <button
              onClick={() => setFilterType('BUSES')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                filterType === 'BUSES' ? 'bg-electric text-white' : 'text-ink hover:bg-neutral-100'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              Buses Only
            </button>
            <button
              onClick={() => setFilterType('CARS')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                filterType === 'CARS' ? 'bg-coral text-white' : 'text-ink hover:bg-neutral-100'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Cars Only
            </button>
          </div>

          {/* Subfilter for Buses */}
          {(filterType === 'BUSES' || filterType === 'ALL') && (
            <div className="flex items-center bg-white rounded-xl p-1 border-2 border-black shadow-brutal-sm">
              <span className="text-[10px] text-ink/60 uppercase px-1.5 font-bold">Bus:</span>
              <button
                onClick={() => setBusFilter('ALL')}
                className={`px-2 py-0.5 rounded-md ${
                  busFilter === 'ALL' ? 'bg-sunshine text-ink border border-black' : 'text-ink'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setBusFilter('Bus 1')}
                className={`px-2 py-0.5 rounded-md ${
                  busFilter === 'Bus 1' ? 'bg-sunshine text-ink border border-black' : 'text-ink'
                }`}
              >
                Bus 1
              </button>
              <button
                onClick={() => setBusFilter('Bus 2')}
                className={`px-2 py-0.5 rounded-md ${
                  busFilter === 'Bus 2' ? 'bg-sunshine text-ink border border-black' : 'text-ink'
                }`}
              >
                Bus 2
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div style={{ height }} className="relative w-full z-0">
        <MapContainer
          center={[19.45, 73.05]}
          zoom={10}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* OpenStreetMap Tile Layer with Proper Attribution */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Planned Highway Route Polyline */}
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: '#3B82F6',
              weight: 5,
              opacity: 0.85,
              dashArray: '8, 8',
            }}
          />

          {/* Departure Start Point Marker */}
          <Marker
            position={startPoint.coords}
            icon={createPointIcon(startPoint.name, '🚩', '#FEE135')}
          >
            <Popup>
              <div className="p-1 font-sans">
                <span className="font-black text-xs uppercase text-coral">Starting Point</span>
                <p className="font-bold text-sm text-ink">{startPoint.name}</p>
              </div>
            </Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker
            position={destPoint.coords}
            icon={createPointIcon(destPoint.name, '🏁', '#10B981')}
          >
            <Popup>
              <div className="p-1 font-sans">
                <span className="font-black text-xs uppercase text-mint-dark">Destination</span>
                <p className="font-bold text-sm text-ink">{destPoint.name}</p>
              </div>
            </Popup>
          </Marker>

          {/* Dynamic Tracked Vehicle Markers */}
          {filteredVehicles.map((vehicle) => {
            const isBus = vehicle.type === 'BUS';
            const icon = createVehicleIcon(vehicle);

            return (
              <Marker
                key={vehicle.vehicleId}
                position={[vehicle.currentLatitude, vehicle.currentLongitude]}
                icon={icon}
              >
                <Popup>
                  <div className="font-sans p-1 min-w-[200px]">
                    <div className="flex items-center justify-between gap-2 border-b border-neutral-200 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{isBus ? '🚌' : '🚗'}</span>
                        <h5 className="font-black text-sm text-ink">
                          {isBus ? vehicle.busNumber : vehicle.vehicleNumber}
                        </h5>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          vehicle.trackingStatus === 'ACTIVE'
                            ? 'bg-mint-light text-mint-dark'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {vehicle.trackingStatus}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {!isBus && (
                        <>
                          <div>
                            <span className="text-neutral-500 font-medium">Model: </span>
                            <span className="font-bold text-ink">{vehicle.carModel}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 font-medium">Owner: </span>
                            <span className="font-bold text-ink">{vehicle.ownerName || 'Employee'}</span>
                          </div>
                        </>
                      )}

                      <div>
                        <span className="text-neutral-500 font-medium">Route: </span>
                        <span className="font-bold text-ink">
                          {startPoint.name} → {destPoint.name}
                        </span>
                      </div>

                      <div>
                        <span className="text-neutral-500 font-medium">
                          {isBus ? 'Assigned Employees:' : 'Passengers:'}{' '}
                        </span>
                        <span className="font-bold text-ink">
                          {vehicle.totalAssignedPassengers || vehicle.passengers?.length || 0}
                        </span>
                      </div>

                      <div>
                        <span className="text-neutral-500 font-medium">Attendance: </span>
                        <span className="font-bold text-mint-dark">
                          {vehicle.markedAttendanceCount || 0} /{' '}
                          {vehicle.totalAssignedPassengers || vehicle.passengers?.length || 0}
                        </span>
                      </div>

                      <div className="pt-1 text-[10px] text-neutral-500 border-t border-neutral-100">
                        Last Updated: <span className="font-bold text-ink">{formatTime(vehicle.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <MapBoundsController
            vehicles={filteredVehicles}
            routePoints={[startPoint.coords, destPoint.coords]}
          />
        </MapContainer>

        {/* Empty Overlay if no vehicles have shared location yet */}
        {filteredVehicles.length === 0 && (
          <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm border-2 border-black rounded-xl p-3 shadow-brutal-sm max-w-xs text-xs">
            <div className="flex items-center gap-2 font-black text-ink mb-1">
              <span>📍</span>
              <span>No Active Vehicles on Map</span>
            </div>
            <p className="text-ink/70">
              Vehicles will automatically appear here once employees grant GPS permission and click "Share Location".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveMap;
