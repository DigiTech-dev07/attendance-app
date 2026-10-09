import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbStore from '../services/dbStore.js';

const JWT_SECRET =
  process.env.JWT_SECRET || 'dg_tech_offsite_2026_super_secure_jwt_secret_key_antigravity';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id?.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'employee',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export const authController = {
  // Employee Account Registration
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Full name is required.' });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: 'Valid email is required.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.',
        });
      }

      const existingUser = await dbStore.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = await dbStore.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: 'employee',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
      });

      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: {
          id: newUser.id || newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed due to a server error. Please try again.',
      });
    }
  },

  // Employee Email/Password Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both email and password.',
        });
      }

      const user = await dbStore.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.',
        });
      }

      if (!user.passwordHash) {
        return res.status(400).json({
          success: false,
          message: 'This account was registered using Google Sign-In. Please click "Continue with Google".',
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.',
        });
      }

      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Welcome back!',
        token,
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed due to a server error. Please try again.',
      });
    }
  },

  // Google Sign-In Handler (Supports native Google Identity Services ID Token / Credential)
  async googleAuth(req, res) {
    try {
      let { credential, email, name, googleId, avatar } = req.body;

      // If Google ID token was sent from Google One Tap / Sign-in button, verify or decode it
      if (credential && (!email || !name)) {
        try {
          // Attempt official Google token verification
          const verifyRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
          );
          if (verifyRes.ok) {
            const verifiedData = await verifyRes.json();
            email = verifiedData.email;
            name = verifiedData.name || verifiedData.given_name || email.split('@')[0];
            googleId = verifiedData.sub;
            avatar = verifiedData.picture;
          } else {
            // Fallback decode if external network is unavailable or simulated token
            const parts = credential.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
              email = payload.email;
              name = payload.name || payload.given_name || email.split('@')[0];
              googleId = payload.sub;
              avatar = payload.picture;
            }
          }
        } catch (verifyErr) {
          // Fallback decode
          try {
            const parts = credential.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
              email = payload.email;
              name = payload.name || payload.given_name || email.split('@')[0];
              googleId = payload.sub;
              avatar = payload.picture;
            }
          } catch (decodeErr) {
            console.warn('Failed to decode Google ID token payload:', decodeErr.message);
          }
        }
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Google account email could not be determined. Please try again.',
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (name || cleanEmail.split('@')[0]).trim();
      let user = await dbStore.findUserByEmail(cleanEmail);

      if (user) {
        // Link googleId if not linked yet
        if (!user.googleId && googleId) {
          user.googleId = googleId;
        }
        if (avatar && !user.avatar) {
          user.avatar = avatar;
        }
      } else {
        // Create unique persistent employee account directly from Google identity
        user = await dbStore.createUser({
          name: cleanName,
          email: cleanEmail,
          googleId: googleId || `google_${Date.now()}`,
          avatar:
            avatar ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
          role: 'employee',
        });
      }

      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Authenticated with Google account successfully!',
        token,
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Google Auth error:', error);
      return res.status(500).json({
        success: false,
        message: 'Google authentication failed. Please try again.',
      });
    }
  },

  // Get Auth Config (Provides Google Client ID to frontend)
  getAuthConfig(req, res) {
    return res.status(200).json({
      success: true,
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    });
  },

  // Admin Login (CTO / Event Admin)
  async adminLogin(req, res) {
    try {
      const { email, password } = req.body;

      const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'admin@dgtech.com').toLowerCase().trim();
      const configuredAdminPassword = process.env.ADMIN_PASSWORD || 'DGTech@2026!Admin';

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide administrator email and password.',
        });
      }

      const inputEmail = email.toLowerCase().trim();

      if (inputEmail !== configuredAdminEmail || password !== configuredAdminPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid administrator credentials. Access denied.',
        });
      }

      const adminUser = {
        id: 'admin_root',
        name: 'DG Tech Admin / CTO',
        email: configuredAdminEmail,
        role: 'admin',
      };

      const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        success: true,
        message: 'Administrator access granted.',
        token,
        user: adminUser,
      });
    } catch (error) {
      console.error('Admin login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Admin authentication failed. Please try again.',
      });
    }
  },

  // Get Current Authenticated User & Offsite Status
  async getMe(req, res) {
    try {
      const userId = req.user.id;
      const user = await dbStore.findUserById(userId);

      if (!user && req.user.role !== 'admin') {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const departureRegistration = await dbStore.findTripRegistration(userId, 'DEPARTURE');
      const returnRegistration = await dbStore.findTripRegistration(userId, 'RETURN');
      const departureAttendance = await dbStore.findAttendance(userId, 'DEPARTURE');
      const returnAttendance = await dbStore.findAttendance(userId, 'RETURN');
      const eventConfig = await dbStore.getEventConfig();

      // If user is registered for a vehicle, fetch current vehicle status
      let departureVehicle = null;
      if (departureRegistration?.vehicleId) {
        departureVehicle = await dbStore.findVehicleById(departureRegistration.vehicleId);
      }

      let returnVehicle = null;
      if (returnRegistration?.vehicleId) {
        returnVehicle = await dbStore.findVehicleById(returnRegistration.vehicleId);
      }

      return res.status(200).json({
        success: true,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          avatar: req.user.avatar || '',
        },
        eventConfig,
        departure: {
          registration: departureRegistration,
          attendance: departureAttendance,
          vehicle: departureVehicle,
        },
        returnTrip: {
          registration: returnRegistration,
          attendance: returnAttendance,
          vehicle: returnVehicle,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile.',
      });
    }
  },
};

export default authController;
