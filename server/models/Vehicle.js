import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['BUS', 'CAR'],
    required: true,
  },
  busNumber: {
    type: String,
    default: null,
  },
  vehicleNumber: {
    type: String,
    default: null,
    trim: true,
  },
  carModel: {
    type: String,
    default: null,
    trim: true,
  },
  ownerId: {
    type: String,
    default: null,
  },
  ownerName: {
    type: String,
    default: null,
  },
  passengers: [
    {
      name: { type: String, required: true },
      userId: { type: String, default: null },
    },
  ],
  startLocation: {
    type: String,
    default: '',
  },
  route: {
    type: String,
    default: '',
  },
  currentLatitude: {
    type: Number,
    default: null,
  },
  currentLongitude: {
    type: Number,
    default: null,
  },
  accuracy: {
    type: Number,
    default: null,
  },
  speed: {
    type: Number,
    default: null,
  },
  heading: {
    type: Number,
    default: null,
  },
  trackingStatus: {
    type: String,
    enum: ['INACTIVE', 'ACTIVE', 'STOPPED', 'EXPIRED'],
    default: 'INACTIVE',
  },
  trackingStartedAt: {
    type: Date,
    default: null,
  },
  trackingEndedAt: {
    type: Date,
    default: null,
  },
  lastUpdated: {
    type: Date,
    default: null,
  },
  tripType: {
    type: String,
    enum: ['DEPARTURE', 'RETURN'],
    default: 'DEPARTURE',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const VehicleModel = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
export default VehicleModel;
