import mongoose from 'mongoose';

const tripRegistrationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  tripType: {
    type: String,
    enum: ['DEPARTURE', 'RETURN'],
    default: 'DEPARTURE',
    required: true,
  },
  mode: {
    type: String,
    enum: ['CAR', 'BUS'],
    required: true,
  },
  vehicleId: {
    type: String,
    required: true,
  },
  busNumber: {
    type: String,
    default: null,
  },
  vehicleNumber: {
    type: String,
    default: null,
  },
  carModel: {
    type: String,
    default: null,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
  startLocation: {
    type: String,
    default: '',
  },
  route: {
    type: String,
    default: '',
  },
  passengers: [
    {
      name: { type: String, required: true },
      userId: { type: String, default: null },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const TripRegistrationModel =
  mongoose.models.TripRegistration || mongoose.model('TripRegistration', tripRegistrationSchema);
export default TripRegistrationModel;
