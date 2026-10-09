import dbStore from '../services/dbStore.js';
import sseManager from '../services/sseManager.js';

export const attendanceController = {
  // Mark Attendance (Strictly Gated by Active GPS Location Sharing)
  async markAttendance(req, res) {
    try {
      const userId = req.user.id;
      const userName = req.user.name;
      const userEmail = req.user.email;
      const { tripType = 'DEPARTURE', latitude, longitude } = req.body;

      // 1. Check Event Config
      const eventConfig = await dbStore.getEventConfig();
      if (tripType === 'RETURN' && !eventConfig.returnTripEnabled) {
        return res.status(403).json({
          success: false,
          message: 'Return trip attendance is not yet enabled by the administrator.',
        });
      }

      // 2. Check Travel Registration
      const registration = await dbStore.findTripRegistration(userId, tripType);
      if (!registration) {
        return res.status(400).json({
          success: false,
          message: 'Please complete your travel registration (Car or Bus) before marking attendance.',
        });
      }

      // 3. Check Vehicle and Active Location Sharing (STRICT GATEKEEPER)
      const vehicle = await dbStore.findVehicleById(registration.vehicleId);

      // Verify that vehicle tracking is currently ACTIVE and has verified GPS coordinates
      const hasActiveTracking =
        vehicle &&
        vehicle.trackingStatus === 'ACTIVE' &&
        ((vehicle.currentLatitude !== null && vehicle.currentLongitude !== null) ||
          (latitude !== undefined && longitude !== undefined));

      if (!hasActiveTracking) {
        return res.status(400).json({
          success: false,
          message:
            'Attendance: Disabled. Reason: Location sharing is required to mark attendance. Please click "Share Location" and grant GPS permission first.',
        });
      }

      const markedLat = latitude !== undefined ? latitude : vehicle.currentLatitude;
      const markedLng = longitude !== undefined ? longitude : vehicle.currentLongitude;

      // 4. Record Attendance
      const attendance = await dbStore.markAttendance({
        userId,
        userName,
        userEmail,
        tripType,
        vehicleId: registration.vehicleId,
        mode: registration.mode,
        busNumber: registration.busNumber || null,
        carVehicleNumber: registration.vehicleNumber || null,
        status: 'MARKED',
        locationPermission: 'GRANTED',
        locationActiveAtMark: true,
        markedLatitude: markedLat,
        markedLongitude: markedLng,
      });

      // 5. Broadcast to Admin
      sseManager.broadcastAttendanceUpdate({
        attendance,
        vehicleId: registration.vehicleId,
      });

      return res.status(200).json({
        success: true,
        message: 'Attendance marked successfully!',
        attendance,
        tripDetails: {
          vehicle: registration.mode === 'CAR' ? `Car - ${registration.vehicleNumber}` : registration.busNumber,
          route: registration.route || `${eventConfig.departureStartPoint} → ${eventConfig.departureDestination}`,
          status: 'Ready to Go',
          locationSharing: 'Active',
        },
      });
    } catch (error) {
      console.error('Mark attendance error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark attendance. Please try again.',
      });
    }
  },

  // Get current attendance status for user
  async getStatus(req, res) {
    try {
      const userId = req.user.id;
      const departure = await dbStore.findAttendance(userId, 'DEPARTURE');
      const returnTrip = await dbStore.findAttendance(userId, 'RETURN');

      return res.status(200).json({
        success: true,
        departure: departure || { status: 'NOT_MARKED', locationPermission: 'NOT_REQUESTED' },
        returnTrip: returnTrip || { status: 'NOT_MARKED', locationPermission: 'NOT_REQUESTED' },
      });
    } catch (error) {
      console.error('Attendance status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance status.',
      });
    }
  },
};

export default attendanceController;
