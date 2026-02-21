const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      activeProjects,
      completedTasks,
      overdueTasks,
      teamMembers,
      totalProjects
    ] = await Promise.all([
      prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { status: 'DONE' } }),
      prisma.task.count({
        where: { 
          dueDate: { lt: new Date() }, 
          status: { not: 'DONE' } 
        }
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.project.count()
    ]);

    res.json({
      activeProjects,
      completedTasks,
      overdueTasks,
      teamMembers,
      totalProjects
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/task-weekly
router.get('/task-weekly', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { createdAt: { gte: sevenDaysAgo } },
          { status: 'DONE', updatedAt: { gte: sevenDaysAgo } }
        ]
      },
      select: {
        createdAt: true,
        updatedAt: true,
        status: true
      }
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const created = tasks.filter(t => 
        t.createdAt >= dayStart && t.createdAt <= dayEnd
      ).length;
      
      const completed = tasks.filter(t => 
        t.status === 'DONE' && t.updatedAt >= dayStart && t.updatedAt <= dayEnd
      ).length;
      
      result.push({ day: dayName, created, completed });
    }
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/team-utilization
router.get('/team-utilization', async (req, res) => {
  try {
    const [totalTasks, teamMembers] = await Promise.all([
      prisma.task.count({ where: { assigneeId: { not: null } } }),
      prisma.user.count({ where: { isActive: true } })
    ]);
    
    const avgTasksPerMember = teamMembers > 0 ? totalTasks / teamMembers : 0;
    const maxTasksPerMember = 10; // Assume 10 tasks is 100% utilization
    const utilizationPercent = Math.min((avgTasksPerMember / maxTasksPerMember) * 100, 100);
    
    res.json({
      inUse: Math.round(utilizationPercent),
      available: Math.round(100 - utilizationPercent)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/project-health
router.get('/project-health', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          select: {
            status: true
          }
        }
      }
    });
    
    const result = projects.map(project => {
      const tasks = project.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        name: project.name,
        progress
      };
    });
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/my-tasks
router.get('/my-tasks', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: 'DONE' }
      },
      include: {
        project: {
          select: { name: true, color: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
    
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/milestones
router.get('/milestones', async (req, res) => {
  try {
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    
    const milestones = await prisma.milestone.findMany({
      where: {
        targetDate: { gte: new Date(), lte: fourteenDaysFromNow },
        isCompleted: false
      },
      include: {
        project: {
          select: { name: true, color: true }
        }
      },
      orderBy: { targetDate: 'asc' }
    });
    
    res.json(milestones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/activity
router.get('/activity', async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true }
        }
      }
    });
    
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/task-completion
router.get('/task-completion', async (req, res) => {
  try {
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    
    const totalTasks = tasksByStatus.reduce((sum, group) => sum + group._count.id, 0);
    
    const result = tasksByStatus.map(group => ({
      status: group.status,
      count: group._count.id,
      percentage: totalTasks > 0 ? Math.round((group._count.id / totalTasks) * 100) : 0
    }));
    
    res.json({
      totalTasks,
      breakdown: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
