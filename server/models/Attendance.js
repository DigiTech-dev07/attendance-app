import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
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
  vehicleId: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ['CAR', 'BUS'],
    required: true,
  },
  busNumber: {
    type: String,
    default: null,
  },
  carVehicleNumber: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['MARKED', 'NOT_MARKED'],
    default: 'NOT_MARKED',
  },
  locationPermission: {
    type: String,
    enum: ['GRANTED', 'DENIED', 'NOT_REQUESTED'],
    default: 'NOT_REQUESTED',
  },
  locationActiveAtMark: {
    type: Boolean,
    default: false,
  },
  markedAt: {
    type: Date,
    default: null,
  },
  markedLatitude: {
    type: Number,
    default: null,
  },
  markedLongitude: {
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const AttendanceModel =
  mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
export default AttendanceModel;
