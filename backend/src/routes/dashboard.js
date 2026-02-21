const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    console.log('Dashboard stats - User:', { id: req.user.id, role: req.user.role, name: req.user.name });
    
    // Build user-specific filters
    const projectFilter = {};
    const taskFilter = {};
    
    // Apply user role filters (same as projects and tasks endpoints)
    if (req.user.role === 'EMPLOYEE' || req.user.role === 'TEAM_LEAD') {
      projectFilter.OR = [
        { ownerId: req.user.id },
        { members: { some: { userId: req.user.id } } },
      ];
      taskFilter.assigneeId = req.user.id;
    }
    
    const [
      activeProjects,
      completedTasks,
      overdueTasks,
      teamMembers,
      totalProjects
    ] = await Promise.all([
      prisma.project.count({ 
        where: { ...projectFilter, status: 'IN_PROGRESS' } 
      }),
      prisma.task.count({ 
        where: { ...taskFilter, status: 'DONE' } 
      }),
      prisma.task.count({
        where: { 
          ...taskFilter,
          dueDate: { lt: new Date() }, 
          status: { not: 'DONE' } 
        }
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.project.count({ where: projectFilter })
    ]);

    console.log('Dashboard stats result:', { activeProjects, completedTasks, overdueTasks, teamMembers, totalProjects });
    
    res.json({
      activeProjects,
      completedTasks,
      overdueTasks,
      teamMembers,
      totalProjects
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/task-weekly
router.get('/task-weekly', authenticate, async (req, res) => {
  try {
    console.log('Dashboard task-weekly - User:', { id: req.user.id, role: req.user.role });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Apply user role filters (same as tasks endpoint)
    const taskFilter = {};
    if (req.user.role === 'EMPLOYEE') {
      taskFilter.assigneeId = req.user.id;
    }
    
    const tasks = await prisma.task.findMany({
      where: {
        ...taskFilter,
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
    
    console.log('Dashboard task-weekly result:', result.length, 'days');
    res.json(result);
  } catch (err) {
    console.error('Dashboard task-weekly error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/team-utilization
router.get('/team-utilization', authenticate, async (req, res) => {
  try {
    console.log('Dashboard team-utilization - User:', { id: req.user.id, role: req.user.role });
    
    // Apply user role filters (same as tasks endpoint)
    const taskFilter = {};
    if (req.user.role === 'EMPLOYEE') {
      taskFilter.assigneeId = req.user.id;
    }
    
    const [totalTasks, teamMembers] = await Promise.all([
      prisma.task.count({ 
        where: { ...taskFilter, assigneeId: { not: null } } 
      }),
      prisma.user.count({ where: { isActive: true } })
    ]);
    
    const avgTasksPerMember = teamMembers > 0 ? totalTasks / teamMembers : 0;
    const maxTasksPerMember = 10; // Assume 10 tasks is 100% utilization
    const utilizationPercent = Math.min((avgTasksPerMember / maxTasksPerMember) * 100, 100);
    
    console.log('Dashboard team-utilization result:', { inUse: Math.round(utilizationPercent), available: Math.round(100 - utilizationPercent) });
    
    res.json({
      inUse: Math.round(utilizationPercent),
      available: Math.round(100 - utilizationPercent)
    });
  } catch (err) {
    console.error('Dashboard team-utilization error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/project-health
router.get('/project-health', authenticate, async (req, res) => {
  try {
    console.log('Dashboard project-health - User:', { id: req.user.id, role: req.user.role });
    
    // Apply user role filters (same as projects endpoint)
    const projectFilter = {};
    if (req.user.role === 'EMPLOYEE' || req.user.role === 'TEAM_LEAD') {
      projectFilter.OR = [
        { ownerId: req.user.id },
        { members: { some: { userId: req.user.id } } },
      ];
    }
    
    const projects = await prisma.project.findMany({
      where: projectFilter,
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
    
    console.log('Dashboard project-health result:', result.length, 'projects');
    res.json(result);
  } catch (err) {
    console.error('Dashboard project-health error:', err);
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
router.get('/milestones', authenticate, async (req, res) => {
  try {
    console.log('Dashboard milestones - User:', { id: req.user.id, role: req.user.role });
    
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    
    // Apply user role filters (same as projects endpoint)
    const projectFilter = {};
    if (req.user.role === 'EMPLOYEE' || req.user.role === 'TEAM_LEAD') {
      projectFilter.OR = [
        { ownerId: req.user.id },
        { members: { some: { userId: req.user.id } } },
      ];
    }
    
    const milestones = await prisma.milestone.findMany({
      where: {
        targetDate: { gte: new Date(), lte: fourteenDaysFromNow },
        isCompleted: false,
        project: projectFilter
      },
      include: {
        project: {
          select: { name: true, color: true }
        }
      },
      orderBy: { targetDate: 'asc' }
    });
    
    console.log('Dashboard milestones result:', milestones.length, 'milestones');
    res.json(milestones);
  } catch (err) {
    console.error('Dashboard milestones error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/activity
router.get('/activity', authenticate, async (req, res) => {
  try {
    console.log('Dashboard activity - User:', { id: req.user.id, role: req.user.role });
    
    // Apply user role filters (same as projects endpoint)
    const projectFilter = {};
    if (req.user.role === 'EMPLOYEE' || req.user.role === 'TEAM_LEAD') {
      projectFilter.OR = [
        { ownerId: req.user.id },
        { members: { some: { userId: req.user.id } } },
      ];
    }
    
    const activities = await prisma.activity.findMany({
      where: {
        project: projectFilter
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true }
        }
      }
    });
    
    console.log('Dashboard activity result:', activities.length, 'activities');
    res.json(activities);
  } catch (err) {
    console.error('Dashboard activity error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/task-completion
router.get('/task-completion', authenticate, async (req, res) => {
  try {
    console.log('Dashboard task-completion - User:', { id: req.user.id, role: req.user.role });
    
    // Apply user role filters (same as tasks endpoint)
    const taskFilter = {};
    if (req.user.role === 'EMPLOYEE') {
      taskFilter.assigneeId = req.user.id;
    }
    
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: taskFilter,
      _count: { id: true },
    });
    
    const totalTasks = tasksByStatus.reduce((sum, group) => sum + group._count.id, 0);
    
    const result = tasksByStatus.map(group => ({
      status: group.status,
      count: group._count.id,
      percentage: totalTasks > 0 ? Math.round((group._count.id / totalTasks) * 100) : 0
    }));
    
    console.log('Dashboard task-completion result:', { totalTasks, breakdown: result });
    res.json({
      totalTasks,
      breakdown: result
    });
  } catch (err) {
    console.error('Dashboard task-completion error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
