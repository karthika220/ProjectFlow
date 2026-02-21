const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tasks - list all tasks (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { projectId, status, priority, assigneeId, search } = req.query;
    const where = {};

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    if (req.user.role === 'EMPLOYEE') {
      where.assigneeId = req.user.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: true, subtasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, color: true } },
        subtasks: {
          include: {
            assignee: { select: { id: true, name: true } },
          },
        },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        timesheets: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, status, priority, startDate, dueDate, estimatedHours, projectId, assigneeId, parentId, tags } = req.body;

    const task = await prisma.task.create({
      data: {
        title, description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        projectId, assigneeId, parentId,
        creatorId: req.user.id,
        tags: tags || [],
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    await prisma.activity.create({
      data: {
        action: 'CREATED',
        entityType: 'TASK',
        entityId: task.id,
        description: `Task "${title}" was created`,
        projectId,
        userId: req.user.id,
      },
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, status, priority, startDate, dueDate, estimatedHours, assigneeId, tags } = req.body;

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title, description, status, priority, assigneeId,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours !== undefined ? parseFloat(estimatedHours) : undefined,
        tags,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (status && status !== existing.status) {
      await prisma.activity.create({
        data: {
          action: 'UPDATED',
          entityType: 'TASK',
          entityId: task.id,
          description: `Task "${task.title}" status changed to ${status}`,
          projectId: task.projectId,
          userId: req.user.id,
        },
      });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Comments
router.get('/:id/comments', authenticate, async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: req.params.id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await prisma.comment.create({
      data: { content, taskId: req.params.id, userId: req.user.id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/comments/:commentId', authenticate, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId !== req.user.id && !['MANAGING_DIRECTOR', 'HR_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await prisma.comment.delete({ where: { id: req.params.commentId } });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
