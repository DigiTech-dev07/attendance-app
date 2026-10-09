import dbStore, { generateId } from '../services/dbStore.js';
import sseManager from '../services/sseManager.js';

export const tripController = {
  // Register or Update Travel details (Car or Bus)
  async registerTravel(req, res) {
    try {
      const userId = req.user.id;
      const userName = req.user.name;
      const userEmail = req.user.email;

      const {
        tripType = 'DEPARTURE',
        mode,
        vehicleNumber,
        carModel,
        passengers = [],
        startLocation = '',
        route = '',
        busNumber,
      } = req.body;

      const eventConfig = await dbStore.getEventConfig();

      if (tripType === 'RETURN' && !eventConfig.returnTripEnabled) {
        return res.status(403).json({
          success: false,
          message: 'Return trip registration is currently disabled by the event administrator.',
        });
      }

      if (!mode || !['CAR', 'BUS'].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid travel mode: Car or Bus.',
        });
      }

      let vehicleId = '';

      if (mode === 'CAR') {
        if (!vehicleNumber || !vehicleNumber.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Vehicle registration number is mandatory for car travel (e.g., MH 04 AB 1234).',
          });
        }
        if (!carModel || !carModel.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Car model is mandatory (e.g., Hyundai Creta).',
          });
        }

        const cleanVehicleNumber = vehicleNumber.trim().toUpperCase();
        vehicleId = `CAR_${cleanVehicleNumber.replace(/\s+/g, '_')}`;

        // Ensure owner is included in people in car
        const formattedPassengers = Array.isArray(passengers)
          ? passengers.map((p) => (typeof p === 'string' ? { name: p.trim() } : p))
          : [];

        // Upsert vehicle entity
        await dbStore.createOrUpdateVehicle({
          vehicleId,
          type: 'CAR',
          vehicleNumber: cleanVehicleNumber,
          carModel: carModel.trim(),
          ownerId: userId,
          ownerName: userName,
          passengers: formattedPassengers,
          startLocation: startLocation.trim(),
          route: route.trim(),
          tripType,
          trackingStatus: 'INACTIVE',
        });

        // Save trip registration
        const registration = await dbStore.createOrUpdateTripRegistration({
          userId,
          userName,
          userEmail,
          tripType,
          mode: 'CAR',
          vehicleId,
          vehicleNumber: cleanVehicleNumber,
          carModel: carModel.trim(),
          isOwner: true,
          startLocation: startLocation.trim(),
          route: route.trim(),
          passengers: formattedPassengers,
        });

        return res.status(200).json({
          success: true,
          message: 'Car travel details registered successfully!',
          registration,
          vehicleId,
        });
      }

      if (mode === 'BUS') {
        if (!busNumber || !['Bus 1', 'Bus 2'].includes(busNumber)) {
          return res.status(400).json({
            success: false,
            message: 'Please choose either Bus 1 or Bus 2.',
          });
        }

        vehicleId = busNumber === 'Bus 1' ? 'BUS_1' : 'BUS_2';

        // Check if Bus vehicle exists, otherwise create it
        let busVehicle = await dbStore.findVehicleById(vehicleId);
        let busPassengers = busVehicle?.passengers || [];

        // Add user if not already in bus passenger list
        if (!busPassengers.some((p) => p.userId === userId || p.name === userName)) {
          busPassengers.push({ name: userName, userId });
        }

        await dbStore.createOrUpdateVehicle({
          vehicleId,
          type: 'BUS',
          busNumber,
          passengers: busPassengers,
          startLocation:
            tripType === 'DEPARTURE'
              ? eventConfig.departureStartPoint
              : eventConfig.returnStartPoint,
          route:
            tripType === 'DEPARTURE'
              ? `${eventConfig.departureStartPoint} → ${eventConfig.departureDestination}`
              : `${eventConfig.returnStartPoint} → ${eventConfig.returnDestination}`,
          tripType,
          trackingStatus: busVehicle?.trackingStatus || 'INACTIVE',
        });

        const registration = await dbStore.createOrUpdateTripRegistration({
          userId,
          userName,
          userEmail,
          tripType,
          mode: 'BUS',
          vehicleId,
          busNumber,
          isOwner: false,
          passengers: [{ name: userName, userId }],
        });

        return res.status(200).json({
          success: true,
          message: `${busNumber} travel selected successfully!`,
          registration,
          vehicleId,
        });
      }
    } catch (error) {
      console.error('Trip registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save travel registration. Please try again.',
      });
    }
  },

  // Start Location Sharing Session
  async startLocationSharing(req, res) {
    try {
      const userId = req.user.id;
      const { tripType = 'DEPARTURE', latitude, longitude, accuracy, speed, heading } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Valid GPS latitude and longitude are required to start location sharing.',
        });
      }

      const registration = await dbStore.findTripRegistration(userId, tripType);
      if (!registration) {
        return res.status(400).json({
          success: false,
          message: 'Please complete your travel registration (Car or Bus) before starting tracking.',
        });
      }

      const vehicleId = registration.vehicleId;
      const vehicle = await dbStore.findVehicleById(vehicleId);

      const now = new Date();
      // If tracking hasn't started yet, set start time
      const trackingStartedAt = vehicle?.trackingStartedAt ? vehicle.trackingStartedAt : now;

      // Update vehicle location and mark status ACTIVE
      const updatedVehicle = await dbStore.createOrUpdateVehicle({
        vehicleId,
        currentLatitude: latitude,
        currentLongitude: longitude,
        accuracy: accuracy || null,
        speed: speed || null,
        heading: heading || null,
        trackingStatus: 'ACTIVE',
        trackingStartedAt,
        trackingEndedAt: null,
        lastUpdated: now.toISOString(),
      });

      // Log location point
      await dbStore.addLocationLog({
        vehicleId,
        userId,
        tripType,
        latitude,
        longitude,
        accuracy: accuracy || null,
        speed: speed || null,
        heading: heading || null,
      });

      // Broadcast vehicle update to Admin Live Map via SSE
      sseManager.broadcastVehicleLocation(updatedVehicle);

      return res.status(200).json({
        success: true,
        message: 'Location sharing active.',
        vehicle: updatedVehicle,
        trackingStartedAt,
      });
    } catch (error) {
      console.error('Start location sharing error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to start location sharing.',
      });
    }
  },

  // Update Live Location
  async updateLocation(req, res) {
    try {
      const userId = req.user.id;
      const { tripType = 'DEPARTURE', latitude, longitude, accuracy, speed, heading } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Valid GPS coordinates required.',
        });
      }

      const registration = await dbStore.findTripRegistration(userId, tripType);
      if (!registration) {
        return res.status(400).json({
          success: false,
          message: 'No travel registration found for this trip.',
        });
      }

      const vehicleId = registration.vehicleId;
      const vehicle = await dbStore.findVehicleById(vehicleId);

      const eventConfig = await dbStore.getEventConfig();
      const maxDurationMs = (eventConfig.trackingDurationMinutes || 240) * 60 * 1000;

      // 4-Hour Tracking Expiration check
      if (vehicle?.trackingStartedAt) {
        const elapsedMs = Date.now() - new Date(vehicle.trackingStartedAt).getTime();
        if (elapsedMs >= maxDurationMs) {
          // Tracking expired!
          const expiredVehicle = await dbStore.createOrUpdateVehicle({
            vehicleId,
            trackingStatus: 'EXPIRED',
            trackingEndedAt: new Date().toISOString(),
          });

          sseManager.broadcastVehicleLocation(expiredVehicle);

          return res.status(200).json({
            success: false,
            expired: true,
            trackingStatus: 'EXPIRED',
            message: 'Your 4-hour location-sharing session has ended automatically.',
            vehicle: expiredVehicle,
          });
        }
      }

      // Update vehicle location
      const updatedVehicle = await dbStore.updateVehicleLocation(vehicleId, {
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
      });

      // Log location history
      await dbStore.addLocationLog({
        vehicleId,
        userId,
        tripType,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
      });

      // Broadcast to Admin Live Map
      sseManager.broadcastVehicleLocation(updatedVehicle);

      return res.status(200).json({
        success: true,
        vehicle: updatedVehicle,
      });
    } catch (error) {
      console.error('Update location error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update location.',
      });
    }
  },

  // Stop Trip / Stop Location Sharing
  async stopLocationSharing(req, res) {
    try {
      const userId = req.user.id;
      const { tripType = 'DEPARTURE', reason = 'MANUAL' } = req.body;

      const registration = await dbStore.findTripRegistration(userId, tripType);
      if (!registration) {
        return res.status(400).json({ success: false, message: 'Registration not found.' });
      }

      const vehicleId = registration.vehicleId;
      const newStatus = reason === 'EXPIRED' ? 'EXPIRED' : 'STOPPED';

      const updatedVehicle = await dbStore.createOrUpdateVehicle({
        vehicleId,
        trackingStatus: newStatus,
        trackingEndedAt: new Date().toISOString(),
      });

      sseManager.broadcastVehicleLocation(updatedVehicle);

      return res.status(200).json({
        success: true,
        message:
          reason === 'EXPIRED'
            ? 'Tracking session ended automatically after 4 hours.'
            : 'Trip tracking stopped successfully.',
        vehicle: updatedVehicle,
      });
    } catch (error) {
      console.error('Stop location error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to stop tracking.',
      });
    }
  },
};

export default tripController;
