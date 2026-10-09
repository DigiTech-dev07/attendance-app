// Server-Sent Events (SSE) Manager for Live Admin Map & Real-time Vehicle Updates

const clients = new Set();

export const sseManager = {
  addClient(res) {
    clients.add(res);
    res.on('close', () => {
      clients.delete(res);
    });
  },

  removeClient(res) {
    clients.delete(res);
  },

  broadcast(eventName, data) {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
      try {
        client.write(payload);
      } catch (err) {
        clients.delete(client);
      }
    }
  },

  broadcastVehicleLocation(vehicle) {
    this.broadcast('vehicle_update', vehicle);
  },

  broadcastAttendanceUpdate(attendance) {
    this.broadcast('attendance_update', attendance);
  },

  broadcastTripStatus(statusData) {
    this.broadcast('trip_status', statusData);
  },

  getClientCount() {
    return clients.size;
  },
};

export default sseManager;
