const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/projects
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    // Employees only see projects they're members of or own
    if (req.user.role === 'EMPLOYEE' || req.user.role === 'TEAM_LEAD') {
      where.OR = [
        { ownerId: req.user.id },
        { members: { some: { userId: req.user.id } } },
      ];
    }

    if (status) where.status = status;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        tasks: {
          select: { 
            id: true, 
            status: true 
          }
        },
        _count: { select: { tasks: true, milestones: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate progress for each project
    const projectsWithProgress = projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Remove tasks from response to avoid sending unnecessary data
      const { tasks, ...projectWithoutTasks } = project;
      
      return {
        ...projectWithoutTasks,
        progress
      };
    });

    res.json(projectsWithProgress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } },
        },
        milestones: { orderBy: { targetDate: 'asc' } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
            creator: { select: { id: true, name: true } },
            _count: { select: { comments: true, subtasks: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Calculate progress for the project
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.status === 'DONE').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Add progress to project object
    const projectWithProgress = {
      ...project,
      progress
    };

    res.json(projectWithProgress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects
router.post('/', authenticate, authorize('MANAGING_DIRECTOR', 'HR_MANAGER', 'TEAM_LEAD'), async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, budget, color, tags, memberIds } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'PLANNING',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: budget ? parseFloat(budget) : null,
        color: color || '#00A1C7',
        tags: tags || [],
        ownerId: req.user.id,
        members: memberIds ? {
          create: memberIds.map(userId => ({ userId, roleInProject: 'CONTRIBUTOR' }))
        } : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'CREATED',
        entityType: 'PROJECT',
        entityId: project.id,
        description: `Project "${name}" was created`,
        projectId: project.id,
        userId: req.user.id,
      },
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, budget, color, tags } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name, description, status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        budget: budget !== undefined ? parseFloat(budget) : undefined,
        color, tags,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, authorize('MANAGING_DIRECTOR', 'HR_MANAGER', 'TEAM_LEAD'), async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/:id/members
router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const { userId, roleInProject } = req.body;
    const member = await prisma.projectMember.create({
      data: { projectId: req.params.id, userId, roleInProject: roleInProject || 'CONTRIBUTOR' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id/activities
router.get('/:id/activities', authenticate, async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: { projectId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Milestones
router.get('/:id/milestones', authenticate, async (req, res) => {
  try {
    const milestones = await prisma.milestone.findMany({
      where: { projectId: req.params.id },
      orderBy: { targetDate: 'asc' },
    });
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/milestones', authenticate, async (req, res) => {
  try {
    const { name, targetDate } = req.body;
    const milestone = await prisma.milestone.create({
      data: { name, targetDate: new Date(targetDate), projectId: req.params.id },
    });
    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/milestones/:milestoneId', authenticate, async (req, res) => {
  try {
    const { isCompleted } = req.body;
    const milestone = await prisma.milestone.update({
      where: { id: req.params.milestoneId },
      data: { isCompleted },
    });
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;