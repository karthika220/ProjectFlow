const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticate, async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    
    // Validate required fields
    if (!userId || !title || !message) {
      return res.status(400).json({ message: 'userId, title, and message are required' });
    }

    // Users can only create notifications for themselves unless they're managers/directors
    if (userId !== req.user.id && !['MANAGING_DIRECTOR', 'HR_MANAGER', 'TEAM_LEAD'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create notifications for other users' });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'INFO'
      }
    });

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const n = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json(n);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
