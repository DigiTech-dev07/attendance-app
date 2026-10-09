import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { isMongooseConnected } from '../config/db.js';
import UserModel from '../models/User.js';
import EventConfigModel from '../models/EventConfig.js';
import VehicleModel from '../models/Vehicle.js';
import TripRegistrationModel from '../models/TripRegistration.js';
import AttendanceModel from '../models/Attendance.js';
import LocationLogModel from '../models/LocationLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = process.env.VERCEL
  ? path.join('/tmp', 'dg_tech_offsite_db.json')
  : path.join(__dirname, '..', 'data', 'db.json');

// Default Event Configuration (Initial values per prompt Section 2 & 41)
const DEFAULT_EVENT_CONFIG = {
  id: 'event_config_1',
  eventName: 'DG Tech Offsite 2.0',
  departureDate: '10 October 2026',
  departureStartPoint: 'G Corp Tech Park',
  departureDestination: 'Anchaviyo Resort',
  departureStartCoords: { lat: 19.2665, lng: 72.9775 },
  departureDestCoords: { lat: 19.6467, lng: 73.1384 },
  returnDate: '12 October 2026',
  returnStartPoint: 'Anchaviyo Resort',
  returnDestination: 'G Corp Tech Park',
  returnStartCoords: { lat: 19.6467, lng: 73.1384 },
  returnDestCoords: { lat: 19.2665, lng: 72.9775 },
  busCount: 2,
  trackingDurationMinutes: 240, // 4 hours
  returnTripEnabled: false, // Initially disabled
  updatedAt: new Date().toISOString(),
};

// In-memory cache for local file store
let localStore = null;

function loadLocalStore() {
  if (localStore) return localStore;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      localStore = JSON.parse(data);
    } else {
      localStore = {
        users: [],
        eventConfig: { ...DEFAULT_EVENT_CONFIG },
        vehicles: [],
        tripRegistrations: [],
        attendances: [],
        locationLogs: [],
      };
      saveLocalStore();
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
    localStore = {
      users: [],
      eventConfig: { ...DEFAULT_EVENT_CONFIG },
      vehicles: [],
      tripRegistrations: [],
      attendances: [],
      locationLogs: [],
    };
  }
  return localStore;
}

function saveLocalStore() {
  if (!localStore) return;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// Generate unique ID
export function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

export const dbStore = {
  // ---------------- EVENT CONFIG ----------------
  async getEventConfig() {
    if (isMongooseConnected()) {
      let config = await EventConfigModel.findOne().lean();
      if (!config) {
        config = await EventConfigModel.create(DEFAULT_EVENT_CONFIG);
        config = config.toObject();
      }
      return config;
    }
    const store = loadLocalStore();
    if (!store.eventConfig) {
      store.eventConfig = { ...DEFAULT_EVENT_CONFIG };
      saveLocalStore();
    }
    return store.eventConfig;
  },

  async updateEventConfig(updates) {
    if (isMongooseConnected()) {
      let config = await EventConfigModel.findOneAndUpdate(
        {},
        { ...updates, updatedAt: new Date() },
        { new: true, upsert: true }
      ).lean();
      return config;
    }
    const store = loadLocalStore();
    store.eventConfig = {
      ...store.eventConfig,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveLocalStore();
    return store.eventConfig;
  },

  // ---------------- USERS ----------------
  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    if (isMongooseConnected()) {
      return await UserModel.findOne({ email: cleanEmail }).lean();
    }
    const store = loadLocalStore();
    return store.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  async findUserById(id) {
    if (!id) return null;
    if (isMongooseConnected()) {
      return await UserModel.findById(id).lean();
    }
    const store = loadLocalStore();
    return store.users.find((u) => u.id === id || u._id === id) || null;
  },

  async findUserByGoogleId(googleId) {
    if (!googleId) return null;
    if (isMongooseConnected()) {
      return await UserModel.findOne({ googleId }).lean();
    }
    const store = loadLocalStore();
    return store.users.find((u) => u.googleId === googleId) || null;
  },

  async createUser(userData) {
    const cleanEmail = userData.email.toLowerCase().trim();
    if (isMongooseConnected()) {
      const created = await UserModel.create({
        ...userData,
        email: cleanEmail,
      });
      return created.toObject();
    }
    const store = loadLocalStore();
    const newUser = {
      id: generateId('usr'),
      ...userData,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    saveLocalStore();
    return newUser;
  },

  async getAllUsers() {
    if (isMongooseConnected()) {
      return await UserModel.find().sort({ createdAt: -1 }).lean();
    }
    const store = loadLocalStore();
    return store.users;
  },

  async countUsers(role = 'employee') {
    if (isMongooseConnected()) {
      return await UserModel.countDocuments({ role });
    }
    const store = loadLocalStore();
    return store.users.filter((u) => u.role === role).length;
  },

  // ---------------- VEHICLES ----------------
  async findVehicleById(vehicleId) {
    if (isMongooseConnected()) {
      return await VehicleModel.findOne({ vehicleId }).lean();
    }
    const store = loadLocalStore();
    return store.vehicles.find((v) => v.vehicleId === vehicleId) || null;
  },

  async findVehicles(query = {}) {
    if (isMongooseConnected()) {
      return await VehicleModel.find(query).lean();
    }
    const store = loadLocalStore();
    return store.vehicles.filter((v) => {
      for (const [key, val] of Object.entries(query)) {
        if (v[key] !== val) return false;
      }
      return true;
    });
  },

  async createOrUpdateVehicle(vehicleData) {
    const { vehicleId } = vehicleData;
    if (isMongooseConnected()) {
      return await VehicleModel.findOneAndUpdate(
        { vehicleId },
        { ...vehicleData, updatedAt: new Date() },
        { new: true, upsert: true }
      ).lean();
    }
    const store = loadLocalStore();
    const idx = store.vehicles.findIndex((v) => v.vehicleId === vehicleId);
    if (idx >= 0) {
      store.vehicles[idx] = {
        ...store.vehicles[idx],
        ...vehicleData,
        updatedAt: new Date().toISOString(),
      };
      saveLocalStore();
      return store.vehicles[idx];
    } else {
      const newVehicle = {
        id: generateId('veh'),
        ...vehicleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.vehicles.push(newVehicle);
      saveLocalStore();
      return newVehicle;
    }
  },

  async updateVehicleLocation(vehicleId, locationData) {
    const updates = {
      currentLatitude: locationData.latitude,
      currentLongitude: locationData.longitude,
      accuracy: locationData.accuracy || null,
      speed: locationData.speed || null,
      heading: locationData.heading || null,
      trackingStatus: 'ACTIVE',
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongooseConnected()) {
      return await VehicleModel.findOneAndUpdate(
        { vehicleId },
        { $set: updates },
        { new: true }
      ).lean();
    }
    const store = loadLocalStore();
    const v = store.vehicles.find((item) => item.vehicleId === vehicleId);
    if (v) {
      Object.assign(v, updates);
      saveLocalStore();
      return v;
    }
    return null;
  },

  // ---------------- TRIP REGISTRATIONS ----------------
  async findTripRegistration(userId, tripType = 'DEPARTURE') {
    if (isMongooseConnected()) {
      return await TripRegistrationModel.findOne({ userId, tripType }).lean();
    }
    const store = loadLocalStore();
    return store.tripRegistrations.find(
      (r) => r.userId === userId && r.tripType === tripType
    ) || null;
  },

  async createOrUpdateTripRegistration(regData) {
    const { userId, tripType } = regData;
    if (isMongooseConnected()) {
      return await TripRegistrationModel.findOneAndUpdate(
        { userId, tripType },
        { ...regData, updatedAt: new Date() },
        { new: true, upsert: true }
      ).lean();
    }
    const store = loadLocalStore();
    const idx = store.tripRegistrations.findIndex(
      (r) => r.userId === userId && r.tripType === tripType
    );
    if (idx >= 0) {
      store.tripRegistrations[idx] = {
        ...store.tripRegistrations[idx],
        ...regData,
        updatedAt: new Date().toISOString(),
      };
      saveLocalStore();
      return store.tripRegistrations[idx];
    } else {
      const newReg = {
        id: generateId('reg'),
        ...regData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.tripRegistrations.push(newReg);
      saveLocalStore();
      return newReg;
    }
  },

  async getAllTripRegistrations(tripType = 'DEPARTURE') {
    if (isMongooseConnected()) {
      return await TripRegistrationModel.find({ tripType }).lean();
    }
    const store = loadLocalStore();
    return store.tripRegistrations.filter((r) => r.tripType === tripType);
  },

  // ---------------- ATTENDANCE ----------------
  async findAttendance(userId, tripType = 'DEPARTURE') {
    if (isMongooseConnected()) {
      return await AttendanceModel.findOne({ userId, tripType }).lean();
    }
    const store = loadLocalStore();
    return store.attendances.find(
      (a) => a.userId === userId && a.tripType === tripType
    ) || null;
  },

  async markAttendance(attendanceData) {
    const { userId, tripType } = attendanceData;
    if (isMongooseConnected()) {
      return await AttendanceModel.findOneAndUpdate(
        { userId, tripType },
        { ...attendanceData, markedAt: new Date() },
        { new: true, upsert: true }
      ).lean();
    }
    const store = loadLocalStore();
    const idx = store.attendances.findIndex(
      (a) => a.userId === userId && a.tripType === tripType
    );
    const markedRecord = {
      id: generateId('att'),
      ...attendanceData,
      status: 'MARKED',
      markedAt: new Date().toISOString(),
    };
    if (idx >= 0) {
      store.attendances[idx] = markedRecord;
    } else {
      store.attendances.push(markedRecord);
    }
    saveLocalStore();
    return markedRecord;
  },

  async getAllAttendance(tripType = 'DEPARTURE') {
    if (isMongooseConnected()) {
      return await AttendanceModel.find({ tripType }).lean();
    }
    const store = loadLocalStore();
    return store.attendances.filter((a) => a.tripType === tripType);
  },

  async countAttendance(tripType = 'DEPARTURE', status = 'MARKED') {
    if (isMongooseConnected()) {
      return await AttendanceModel.countDocuments({ tripType, status });
    }
    const store = loadLocalStore();
    return store.attendances.filter(
      (a) => a.tripType === tripType && a.status === status
    ).length;
  },

  // ---------------- LOCATION LOGS ----------------
  async addLocationLog(logData) {
    if (isMongooseConnected()) {
      return await LocationLogModel.create({
        ...logData,
        timestamp: new Date(),
      });
    }
    const store = loadLocalStore();
    const newLog = {
      id: generateId('loc'),
      ...logData,
      timestamp: new Date().toISOString(),
    };
    store.locationLogs.push(newLog);
    // Keep last 1000 logs to prevent bloat
    if (store.locationLogs.length > 1000) {
      store.locationLogs = store.locationLogs.slice(-1000);
    }
    saveLocalStore();
    return newLog;
  },

  async getRecentLocationLogs(vehicleId, limit = 20) {
    if (isMongooseConnected()) {
      return await LocationLogModel.find({ vehicleId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    }
    const store = loadLocalStore();
    return store.locationLogs
      .filter((l) => l.vehicleId === vehicleId)
      .slice(-limit)
      .reverse();
  },
};

export default dbStore;
