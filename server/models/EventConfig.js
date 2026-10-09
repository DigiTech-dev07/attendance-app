import mongoose from 'mongoose';

const eventConfigSchema = new mongoose.Schema({
  eventName: {
    type: String,
    default: 'DG Tech Offsite 2.0',
    required: true,
  },
  departureDate: {
    type: String,
    default: '10 October 2026',
    required: true,
  },
  departureStartPoint: {
    type: String,
    default: 'G Corp Tech Park',
    required: true,
  },
  departureDestination: {
    type: String,
    default: 'Anchaviyo Resort',
    required: true,
  },
  departureStartCoords: {
    lat: { type: Number, default: 19.2665 },
    lng: { type: Number, default: 72.9775 },
  },
  departureDestCoords: {
    lat: { type: Number, default: 19.6467 },
    lng: { type: Number, default: 73.1384 },
  },
  returnDate: {
    type: String,
    default: '12 October 2026',
    required: true,
  },
  returnStartPoint: {
    type: String,
    default: 'Anchaviyo Resort',
    required: true,
  },
  returnDestination: {
    type: String,
    default: 'G Corp Tech Park',
    required: true,
  },
  returnStartCoords: {
    lat: { type: Number, default: 19.6467 },
    lng: { type: Number, default: 73.1384 },
  },
  returnDestCoords: {
    lat: { type: Number, default: 19.2665 },
    lng: { type: Number, default: 72.9775 },
  },
  busCount: {
    type: Number,
    default: 2,
    min: 1,
  },
  trackingDurationMinutes: {
    type: Number,
    default: 240, // 4 hours
  },
  returnTripEnabled: {
    type: Boolean,
    default: false, // Initially disabled
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const EventConfigModel = mongoose.models.EventConfig || mongoose.model('EventConfig', eventConfigSchema);
export default EventConfigModel;
