const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true,
        department: true, isActive: true, createdAt: true, avatar: true,
        _count: { select: { assignedTasks: true, ownedProjects: true } }
      },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, name: true, role: true,
        department: true, isActive: true, createdAt: true, avatar: true,
        assignedTasks: { take: 10, orderBy: { createdAt: 'desc' }, include: { project: { select: { name: true } } } },
        _count: { select: { assignedTasks: true, ownedProjects: true } }
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users (create user - MD only)
router.post('/', authenticate, authorize('MANAGING_DIRECTOR'), async (req, res) => {
  try {
    const { email, password, name, role, department } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: role || 'EMPLOYEE', department },
      select: { id: true, email: true, name: true, role: true, department: true, isActive: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const canEdit = req.user.role === 'MANAGING_DIRECTOR' || req.user.role === 'HR_MANAGER' || req.user.role === 'TEAM_LEAD' || req.user.id === req.params.id;
    if (!canEdit) return res.status(403).json({ message: 'Access denied' });

    const { name, department, role, isActive, password } = req.body;
    const data = {};
    if (name) data.name = name;
    if (department !== undefined) data.department = department;
    if (role && (req.user.role === 'MANAGING_DIRECTOR' || req.user.role === 'HR_MANAGER' || req.user.role === 'TEAM_LEAD' || req.user.role === 'MANAGER')) data.role = role;
    if (isActive !== undefined && (req.user.role === 'MANAGING_DIRECTOR' || req.user.role === 'HR_MANAGER' || req.user.role === 'TEAM_LEAD' || req.user.role === 'MANAGER')) data.isActive = isActive;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, role: true, department: true, isActive: true, updatedAt: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, authorize('MANAGING_DIRECTOR'), async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
