import express from 'express';
import { attendanceController } from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/mark', authMiddleware, attendanceController.markAttendance);
router.get('/status', authMiddleware, attendanceController.getStatus);

export default router;
