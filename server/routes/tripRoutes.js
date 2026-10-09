import express from 'express';
import { tripController } from '../controllers/tripController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', authMiddleware, tripController.registerTravel);
router.post('/location/start', authMiddleware, tripController.startLocationSharing);
router.post('/location/update', authMiddleware, tripController.updateLocation);
router.post('/location/stop', authMiddleware, tripController.stopLocationSharing);

export default router;
