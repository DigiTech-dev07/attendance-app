import dbStore from '../services/dbStore.js';
import sseManager from '../services/sseManager.js';

export const adminController = {
  // High-level Dashboard Statistics from Real DB
  async getDashboardStats(req, res) {
    try {
      const tripType = req.query.tripType || 'DEPARTURE';
      const eventConfig = await dbStore.getEventConfig();

      const users = await dbStore.getAllUsers();
      const employees = users.filter((u) => u.role === 'employee');
      const totalEmployees = employees.length;

      const attendances = await dbStore.getAllAttendance(tripType);
      const markedAttendances = attendances.filter((a) => a.status === 'MARKED');
      const presentCount = markedAttendances.length;
      const notMarkedCount = Math.max(0, totalEmployees - presentCount);

      const vehicles = await dbStore.findVehicles({ tripType });
      const carVehicles = vehicles.filter((v) => v.type === 'CAR');
      const busVehicles = vehicles.filter((v) => v.type === 'BUS');

      const activeVehicles = vehicles.filter((v) => v.trackingStatus === 'ACTIVE');
      const currentlyTrackingCount = activeVehicles.length;

      // Bus 1 and Bus 2 passenger counts
      const registrations = await dbStore.getAllTripRegistrations(tripType);
      const bus1Registrations = registrations.filter((r) => r.busNumber === 'Bus 1');
      const bus2Registrations = registrations.filter((r) => r.busNumber === 'Bus 2');

      return res.status(200).json({
        success: true,
        stats: {
          totalEmployees,
          presentCount,
          notMarkedCount,
          busCount: eventConfig.busCount || 2,
          carCount: carVehicles.length,
          currentlyTrackingCount,
          bus1Count: bus1Registrations.length,
          bus2Count: bus2Registrations.length,
          returnTripEnabled: eventConfig.returnTripEnabled,
          eventName: eventConfig.eventName,
          tripType,
        },
      });
    } catch (error) {
      console.error('Admin dashboard stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to load dashboard metrics.',
      });
    }
  },

  // Get All Employees with Travel & Attendance info
  async getEmployees(req, res) {
    try {
      const tripType = req.query.tripType || 'DEPARTURE';
      const users = await dbStore.getAllUsers();
      const employees = users.filter((u) => u.role === 'employee');

      const registrations = await dbStore.getAllTripRegistrations(tripType);
      const attendances = await dbStore.getAllAttendance(tripType);
      const vehicles = await dbStore.findVehicles({ tripType });

      const employeeList = employees.map((emp) => {
        const empId = emp.id || emp._id.toString();
        const reg = registrations.find((r) => r.userId === empId);
        const att = attendances.find((a) => a.userId === empId);
        const veh = reg?.vehicleId ? vehicles.find((v) => v.vehicleId === reg.vehicleId) : null;

        return {
          id: empId,
          name: emp.name,
          email: emp.email,
          avatar: emp.avatar,
          registered: !!reg,
          mode: reg?.mode || 'Not Selected',
          busNumber: reg?.busNumber || null,
          vehicleNumber: reg?.vehicleNumber || null,
          carModel: reg?.carModel || null,
          startLocation: reg?.startLocation || '',
          route: reg?.route || '',
          attendanceStatus: att?.status || 'NOT_MARKED',
          locationSharingStatus: veh?.trackingStatus === 'ACTIVE' ? 'Active' : 'Inactive',
          tripStatus: veh?.trackingStatus || 'NOT_STARTED',
          lastLocationUpdate: veh?.lastUpdated || null,
          markedAt: att?.markedAt || null,
        };
      });

      return res.status(200).json({
        success: true,
        employees: employeeList,
      });
    } catch (error) {
      console.error('Admin employees error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee list.',
      });
    }
  },

  // Get All Vehicles (Aggregated - Privacy Protected: No individual employee dots)
  async getVehicles(req, res) {
    try {
      const tripType = req.query.tripType || 'DEPARTURE';
      const vehicles = await dbStore.findVehicles({ tripType });
      const attendances = await dbStore.getAllAttendance(tripType);
      const registrations = await dbStore.getAllTripRegistrations(tripType);

      // Enhance vehicles with passenger counts and attendance ratio
      const aggregatedVehicles = vehicles.map((v) => {
        const vehicleRegs = registrations.filter((r) => r.vehicleId === v.vehicleId);
        const vehicleAtts = attendances.filter(
          (a) => a.vehicleId === v.vehicleId && a.status === 'MARKED'
        );

        return {
          ...v,
          totalAssignedPassengers: vehicleRegs.length,
          markedAttendanceCount: vehicleAtts.length,
        };
      });

      return res.status(200).json({
        success: true,
        vehicles: aggregatedVehicles,
      });
    } catch (error) {
      console.error('Admin vehicles error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicles.',
      });
    }
  },

  // Get Vehicle Details by ID
  async getVehicleById(req, res) {
    try {
      const { id } = req.params;
      const tripType = req.query.tripType || 'DEPARTURE';
      const vehicle = await dbStore.findVehicleById(id);

      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found.' });
      }

      const registrations = await dbStore.getAllTripRegistrations(tripType);
      const vehicleRegs = registrations.filter((r) => r.vehicleId === id);

      const attendances = await dbStore.getAllAttendance(tripType);
      const vehicleAtts = attendances.filter((a) => a.vehicleId === id);

      const locationLogs = await dbStore.getRecentLocationLogs(id, 30);

      return res.status(200).json({
        success: true,
        vehicle: {
          ...vehicle,
          passengersList: vehicleRegs.map((r) => {
            const att = vehicleAtts.find((a) => a.userId === r.userId);
            return {
              userId: r.userId,
              name: r.userName,
              email: r.userEmail,
              attendanceStatus: att?.status || 'NOT_MARKED',
              markedAt: att?.markedAt || null,
            };
          }),
          totalAssigned: vehicleRegs.length,
          totalMarked: vehicleAtts.filter((a) => a.status === 'MARKED').length,
          recentLocations: locationLogs,
        },
      });
    } catch (error) {
      console.error('Get vehicle by ID error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicle details.',
      });
    }
  },

  // Event Configuration
  async getEventConfig(req, res) {
    try {
      const config = await dbStore.getEventConfig();
      return res.status(200).json({ success: true, eventConfig: config });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get event config.' });
    }
  },

  async updateEventConfig(req, res) {
    try {
      const updates = req.body;
      const updatedConfig = await dbStore.updateEventConfig(updates);
      return res.status(200).json({
        success: true,
        message: 'Event configuration updated successfully.',
        eventConfig: updatedConfig,
      });
    } catch (error) {
      console.error('Update event config error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update event config.' });
    }
  },

  // Return Trip Controls
  async enableReturnTrip(req, res) {
    try {
      const updatedConfig = await dbStore.updateEventConfig({ returnTripEnabled: true });
      sseManager.broadcast('return_trip_status', { returnTripEnabled: true });
      return res.status(200).json({
        success: true,
        message: 'Return Trip functionality is now ENABLED for all employees.',
        returnTripEnabled: true,
        eventConfig: updatedConfig,
      });
    } catch (error) {
      console.error('Enable return trip error:', error);
      return res.status(500).json({ success: false, message: 'Failed to enable return trip.' });
    }
  },

  async disableReturnTrip(req, res) {
    try {
      const updatedConfig = await dbStore.updateEventConfig({ returnTripEnabled: false });
      sseManager.broadcast('return_trip_status', { returnTripEnabled: false });
      return res.status(200).json({
        success: true,
        message: 'Return Trip functionality is now DISABLED.',
        returnTripEnabled: false,
        eventConfig: updatedConfig,
      });
    } catch (error) {
      console.error('Disable return trip error:', error);
      return res.status(500).json({ success: false, message: 'Failed to disable return trip.' });
    }
  },

  // Server-Sent Events (SSE) Stream for Live Real-time Map Updates
  streamUpdates(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

    sseManager.addClient(res);

    // Heartbeat every 20 seconds to keep connection alive
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (err) {
        clearInterval(heartbeatTimer);
        sseManager.removeClient(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeatTimer);
      sseManager.removeClient(res);
    });
  },
};

export default adminController;
