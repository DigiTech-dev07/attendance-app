import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// SSE stream for real-time live map updates (publicly streamable or token query)
router.get('/stream', adminController.streamUpdates);

// Authenticated and Admin-authorized endpoints
router.get('/dashboard', authMiddleware, adminMiddleware, adminController.getDashboardStats);
router.get('/employees', authMiddleware, adminMiddleware, adminController.getEmployees);
router.get('/vehicles', authMiddleware, adminMiddleware, adminController.getVehicles);
router.get('/vehicles/:id', authMiddleware, adminMiddleware, adminController.getVehicleById);
router.get('/event', authMiddleware, adminController.getEventConfig);
router.put('/event', authMiddleware, adminMiddleware, adminController.updateEventConfig);
router.post('/return-trip/enable', authMiddleware, adminMiddleware, adminController.enableReturnTrip);
router.post('/return-trip/disable', authMiddleware, adminMiddleware, adminController.disableReturnTrip);

export default router;
