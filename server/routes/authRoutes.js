import express from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/admin/login', authController.adminLogin);
router.get('/config', authController.getAuthConfig);
router.get('/me', authMiddleware, authController.getMe);

export default router;
