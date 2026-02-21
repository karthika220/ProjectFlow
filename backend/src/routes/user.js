const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/user/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  console.log('GET /api/user/me - User from JWT:', req.user);
  
  try {
    // Validate that req.user.id exists
    if (!req.user || !req.user.id) {
      console.log('GET /api/user/me - No user ID in request');
      return res.status(401).json({ error: 'Unauthorized - No user ID found' });
    }
    
    console.log('GET /api/user/me - Fetching user with ID:', req.user.id);
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      }
    });

    console.log('GET /api/user/me - User found:', user);

    if (!user) {
      console.log('GET /api/user/me - User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('GET /api/user/me - Returning user data successfully');
    res.json({ success: true, user });
  } catch (err) {
    console.error('GET /api/user/me - Database error:', err);
    console.error('GET /api/user/me - Error stack:', err.stack);
    
    // Handle specific database errors
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// PUT /api/user/me - Update current user profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, phone, department, avatarUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        phone,
        department,
        avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatarUrl: true,
      }
    });

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/user/notifications - Get notification preferences
router.get('/notifications', authenticate, async (req, res) => {
  try {
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: req.user.id }
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: req.user.id,
          emailEnabled: true,
          pushEnabled: true,
          taskReminders: true,
          projectUpdates: true,
        }
      });
    }

    res.json(preferences);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/user/notifications - Update notification preferences
router.put('/notifications', authenticate, async (req, res) => {
  try {
    const { emailEnabled, pushEnabled, taskReminders, projectUpdates } = req.body;

    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: req.user.id },
      update: {
        emailEnabled,
        pushEnabled,
        taskReminders,
        projectUpdates,
      },
      create: {
        userId: req.user.id,
        emailEnabled,
        pushEnabled,
        taskReminders,
        projectUpdates,
      }
    });

    res.json(preferences);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/user/change-password - Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
