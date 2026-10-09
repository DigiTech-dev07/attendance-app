import mongoose from 'mongoose';

const locationLogSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
  },
  tripType: {
    type: String,
    enum: ['DEPARTURE', 'RETURN'],
    default: 'DEPARTURE',
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
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
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const LocationLogModel =
  mongoose.models.LocationLog || mongoose.model('LocationLog', locationLogSchema);
export default LocationLogModel;
