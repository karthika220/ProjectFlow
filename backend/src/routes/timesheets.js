const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/timesheets
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, taskId, startDate, endDate } = req.query;
    const where = {};

    if (req.user.role === 'EMPLOYEE') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (taskId) where.taskId = taskId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(timesheets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/timesheets
router.post('/', authenticate, async (req, res) => {
  try {
    const { date, startTime, endTime, hours, workType, notes, taskId } = req.body;

    // Validate operating hours
    const startHour = parseInt(startTime.split(':')[0]);
    const isOutsideHours = startHour < 9 || startHour >= 19;

    const timesheet = await prisma.timesheet.create({
      data: {
        date: new Date(date),
        startTime, endTime,
        hours: parseFloat(hours),
        workType: workType || 'BILLABLE',
        notes,
        taskId,
        userId: req.user.id,
        isApproved: isOutsideHours ? false : null,
      },
      include: {
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    });

    // Notify managers about timesheet submission
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ['MANAGING_DIRECTOR', 'HR_MANAGER', 'TEAM_LEAD'] }
      }
    });

    for (const manager of managers) {
      if (manager.id !== req.user.id) {
        await prisma.notification.create({
          data: {
            userId: manager.id,
            title: 'Timesheet Submitted',
            message: `${req.user.name} has submitted their timesheet for ${new Date(date).toLocaleDateString()}.`,
            type: 'TIMESHEET_SUBMITTED',
          },
        });
      }
    }

    res.status(201).json(timesheet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/timesheets/:id/approve
router.patch('/:id/approve', authenticate, authorize('MANAGING_DIRECTOR', 'HR_MANAGER', 'TEAM_LEAD'), async (req, res) => {
  try {
    const { isApproved } = req.body;
    const timesheet = await prisma.timesheet.update({
      where: { id: req.params.id },
      data: { isApproved },
    });
    res.json(timesheet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/timesheets/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const timesheet = await prisma.timesheet.findUnique({ where: { id: req.params.id } });
    if (!timesheet) return res.status(404).json({ message: 'Not found' });
    if (timesheet.userId !== req.user.id && !['MANAGING_DIRECTOR', 'HR_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await prisma.timesheet.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
