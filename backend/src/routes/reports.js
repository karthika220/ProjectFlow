const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports
router.get('/', authenticate, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reports
router.post('/', authenticate, authorize('MANAGING_DIRECTOR', 'HR_MANAGER'), async (req, res) => {
  console.log('POST /api/reports - Request body:', req.body);
  console.log('POST /api/reports - User:', req.user);
  
  try {
    const { title, type, projectId } = req.body;
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Report title is required' });
    }
    
    if (!type) {
      return res.status(400).json({ error: 'Report type is required' });
    }
    
    if (!['PROJECT_SUMMARY', 'TASK_SUMMARY', 'TIMESHEET'].includes(type)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }
    
    let data = {};
    
    if (type === 'PROJECT_SUMMARY') {
      console.log('Generating PROJECT_SUMMARY report...');
      const projects = await prisma.project.findMany({
        include: { _count: { select: { tasks: true, members: true } } },
      });
      data = { projects: projects.map(p => ({ id: p.id, name: p.name, status: p.status, taskCount: p._count.tasks, memberCount: p._count.members })) };
      console.log('PROJECT_SUMMARY data generated:', data);
    } else if (type === 'TASK_SUMMARY') {
      console.log('Generating TASK_SUMMARY report...');
      const tasks = await prisma.task.groupBy({
        by: ['status'],
        _count: { id: true },
      });
      data = { tasksByStatus: tasks };
      console.log('TASK_SUMMARY data generated:', data);
    } else if (type === 'TIMESHEET') {
      console.log('Generating TIMESHEET report...');
      const timesheets = await prisma.timesheet.aggregate({
        _sum: { hours: true },
        _count: { id: true },
      });
      data = { totalHours: timesheets._sum.hours, totalEntries: timesheets._count.id };
      console.log('TIMESHEET data generated:', data);
    }

    const reportData = {
      title: title.trim(),
      type,
      data: JSON.stringify(data),
      projectId: projectId || null,
      createdById: req.user.id
    };
    
    console.log('Creating report with data:', reportData);
    
    const report = await prisma.report.create({
      data: reportData,
      include: { createdBy: { select: { id: true, name: true } } },
    });
    
    console.log('Report created successfully:', report);
    
    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error('Error in POST /api/reports:', err);
    console.error('Error stack:', err.stack);
    
    // Handle specific database errors
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Database constraint violation' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', authenticate, authorize('MANAGING_DIRECTOR', 'HR_MANAGER'), async (req, res) => {
  try {
    await prisma.report.delete({ where: { id: req.params.id } });
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/task-status
router.get('/task-status', async (req, res) => {
  try {
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    
    const result = tasksByStatus.map(group => ({
      status: group.status,
      count: group._count.id
    }));
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/project-status
router.get('/project-status', async (req, res) => {
  try {
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    
    const result = projectsByStatus.map(group => ({
      status: group.status,
      count: group._count.id
    }));
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/project/:id
router.get('/project/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true }
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const [totalTasks, completedTasks, overdueTasks, tasksByStatus] = await Promise.all([
      prisma.task.count({ where: { projectId } }),
      prisma.task.count({ where: { projectId, status: 'DONE' } }),
      prisma.task.count({
        where: { 
          projectId, 
          dueDate: { lt: new Date() }, 
          status: { not: 'DONE' } 
        }
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { id: true },
      })
    ]);
    
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const tasksByStatusFormatted = tasksByStatus.map(group => ({
      status: group.status,
      count: group._count.id
    }));
    
    res.json({
      projectName: project.name,
      totalTasks,
      completedTasks,
      overdueTasks,
      progressPercent,
      tasksByStatus: tasksByStatusFormatted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
