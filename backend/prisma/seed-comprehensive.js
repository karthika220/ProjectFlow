const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating comprehensive dummy data...');
  
  // Clear existing data
  await prisma.activity.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  
  const hashedPassword = await bcrypt.hash('password', 10);
  
  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@projectflow.io',
        password: hashedPassword,
        name: 'Alex Johnson',
        role: 'MANAGING_DIRECTOR',
        department: 'Executive',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah@projectflow.io',
        password: hashedPassword,
        name: 'Sarah Chen',
        role: 'HR_MANAGER',
        department: 'Human Resources',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike@projectflow.io',
        password: hashedPassword,
        name: 'Mike Rodriguez',
        role: 'TEAM_LEAD',
        department: 'Engineering',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'lisa@projectflow.io',
        password: hashedPassword,
        name: 'Lisa Wang',
        role: 'EMPLOYEE',
        department: 'Design',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'john@projectflow.io',
        password: hashedPassword,
        name: 'John Smith',
        role: 'EMPLOYEE',
        department: 'Engineering',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'emma@projectflow.io',
        password: hashedPassword,
        name: 'Emma Davis',
        role: 'EMPLOYEE',
        department: 'Marketing',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'david@projectflow.io',
        password: hashedPassword,
        name: 'David Kim',
        role: 'EMPLOYEE',
        department: 'Engineering',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'anna@projectflow.io',
        password: hashedPassword,
        name: 'Anna Martinez',
        role: 'EMPLOYEE',
        department: 'QA',
        isActive: true,
      },
    }),
  ]);

  console.log(`👥 Created ${users.length} users`);

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'E-commerce Platform Redesign',
        description: 'Complete overhaul of the online shopping experience',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-04-30'),
        color: '#00A1C7',
        ownerId: users[0].id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Mobile Banking App',
        description: 'Native iOS and Android banking application',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-15'),
        color: '#00FFAA',
        ownerId: users[2].id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'AI Customer Service',
        description: 'Implement AI-powered customer support system',
        status: 'PLANNING',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        color: '#FFD700',
        ownerId: users[0].id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Cloud Migration',
        description: 'Migrate infrastructure to AWS cloud platform',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        color: '#FF6B6B',
        ownerId: users[2].id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Security Audit 2024',
        description: 'Annual security assessment and improvements',
        status: 'COMPLETED',
        startDate: new Date('2023-11-01'),
        endDate: new Date('2024-01-15'),
        color: '#4ECDC4',
        ownerId: users[0].id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Marketing Dashboard',
        description: 'Real-time analytics dashboard for marketing team',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-05-01'),
        color: '#8B5CF6',
        ownerId: users[4].id,
      },
    }),
  ]);

  console.log(`📁 Created ${projects.length} projects`);

  // Create project members
  const projectMembers = [];
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const memberUsers = users.slice(1, 5); // Add members to each project
    
    for (const user of memberUsers) {
      projectMembers.push(
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: user.id,
            roleInProject: Math.random() > 0.5 ? 'LEAD' : 'CONTRIBUTOR',
          },
        })
      );
    }
  }

  // Create milestones
  const milestones = await Promise.all([
    prisma.milestone.create({
      data: {
        name: 'Design Phase Complete',
        targetDate: new Date('2024-02-15'),
        isCompleted: true,
        projectId: projects[0].id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: 'Beta Testing',
        targetDate: new Date('2024-03-20'),
        isCompleted: false,
        projectId: projects[0].id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: 'Production Release',
        targetDate: new Date('2024-04-30'),
        isCompleted: false,
        projectId: projects[0].id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: 'API Integration Complete',
        targetDate: new Date('2024-03-10'),
        isCompleted: false,
        projectId: projects[2].id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: 'Cloud Migration Phase 1',
        targetDate: new Date('2024-02-28'),
        isCompleted: true,
        projectId: projects[3].id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: 'Security Testing Complete',
        targetDate: new Date('2024-03-15'),
        isCompleted: false,
        projectId: projects[3].id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: 'Dashboard MVP',
        targetDate: new Date('2024-03-25'),
        isCompleted: false,
        projectId: projects[5].id,
      },
    }),
  ]);

  console.log(`🎯 Created ${milestones.length} milestones`);

  // Create tasks with varied statuses and dates
  const taskTemplates = [
    { title: 'Setup development environment', priority: 'HIGH', status: 'DONE' },
    { title: 'Create wireframes and mockups', priority: 'MEDIUM', status: 'DONE' },
    { title: 'Implement user authentication', priority: 'HIGH', status: 'DONE' },
    { title: 'Design database schema', priority: 'HIGH', status: 'DONE' },
    { title: 'Build REST API endpoints', priority: 'HIGH', status: 'IN_PROGRESS' },
    { title: 'Create responsive UI components', priority: 'MEDIUM', status: 'IN_PROGRESS' },
    { title: 'Implement payment gateway', priority: 'CRITICAL', status: 'IN_PROGRESS' },
    { title: 'Write unit tests', priority: 'MEDIUM', status: 'TODO' },
    { title: 'Performance optimization', priority: 'HIGH', status: 'TODO' },
    { title: 'Security audit', priority: 'CRITICAL', status: 'TODO' },
    { title: 'Documentation', priority: 'LOW', status: 'TODO' },
    { title: 'User acceptance testing', priority: 'MEDIUM', status: 'TODO' },
  ];

  const tasks = [];
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    
    for (let j = 0; j < taskTemplates.length; j++) {
      const template = taskTemplates[j];
      const assignee = users[Math.floor(Math.random() * (users.length - 1)) + 1]; // Random assignee (not admin)
      const creator = users[Math.floor(Math.random() * users.length)];
      
      // Create varied due dates
      const daysOffset = Math.floor(Math.random() * 60) - 10; // -10 to 50 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysOffset);
      
      // Create varied creation dates
      const createdDaysAgo = Math.floor(Math.random() * 30); // 0 to 30 days ago
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - createdDaysAgo);
      
      const task = await prisma.task.create({
        data: {
          title: `${template.title} - ${project.name}`,
          description: `Detailed task for ${template.title.toLowerCase()} in the ${project.name} project`,
          status: template.status,
          priority: template.priority,
          projectId: project.id,
          assigneeId: assignee.id,
          creatorId: creator.id,
          dueDate: dueDate,
          startDate: createdAt,
          createdAt: createdAt,
          updatedAt: template.status === 'DONE' ? new Date() : createdAt,
        },
      });
      
      tasks.push(task);
    }
  }

  console.log(`✅ Created ${tasks.length} tasks`);

  // Create activities
  const activities = [];
  const activityTemplates = [
    { action: 'CREATED', entity: 'PROJECT', description: 'Created new project' },
    { action: 'UPDATED', entity: 'PROJECT', description: 'Updated project status' },
    { action: 'COMPLETED', entity: 'TASK', description: 'Completed task' },
    { action: 'UPDATED', entity: 'TASK', description: 'Updated task status' },
    { action: 'CREATED', entity: 'TASK', description: 'Created new task' },
    { action: 'COMPLETED', entity: 'MILESTONE', description: 'Completed milestone' },
  ];

  for (let i = 0; i < 25; i++) {
    const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const project = projects[Math.floor(Math.random() * projects.length)];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    
    const daysAgo = Math.floor(Math.random() * 14); // 0 to 14 days ago
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    const activity = await prisma.activity.create({
      data: {
        action: template.action,
        entityType: template.entity,
        entityId: template.entity === 'PROJECT' ? project.id : task.id,
        description: `${template.description}: "${template.entity === 'PROJECT' ? project.name : task.title}"`,
        projectId: project.id,
        userId: user.id,
        createdAt: createdAt,
      },
    });
    
    activities.push(activity);
  }

  console.log(`📝 Created ${activities.length} activities`);

  // Create some timesheets
  const timesheets = [];
  for (let i = 0; i < 20; i++) {
    const user = users[Math.floor(Math.random() * (users.length - 1)) + 1]; // Not admin
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    
    const daysAgo = Math.floor(Math.random() * 7); // 0 to 7 days ago
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const hours = Math.random() * 6 + 1; // 1 to 7 hours
    
    const timesheet = await prisma.timesheet.create({
      data: {
        date: date,
        startTime: '09:00',
        endTime: `${String(9 + Math.floor(hours)).padStart(2, '0')}:00`,
        hours: Math.round(hours * 10) / 10,
        workType: 'BILLABLE',
        notes: `Work on ${task.title}`,
        taskId: task.id,
        userId: user.id,
        isApproved: Math.random() > 0.3,
      },
    });
    
    timesheets.push(timesheet);
  }

  console.log(`⏰ Created ${timesheets.length} timesheets`);

  // Summary statistics
  const totalTasks = await prisma.task.count();
  const completedTasks = await prisma.task.count({ where: { status: 'DONE' } });
  const inProgressTasks = await prisma.task.count({ where: { status: 'IN_PROGRESS' } });
  const todoTasks = await prisma.task.count({ where: { status: 'TODO' } });
  const overdueTasks = await prisma.task.count({
    where: { 
      dueDate: { lt: new Date() }, 
      status: { not: 'DONE' } 
    }
  });

  console.log('\n📊 Database Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Projects: ${projects.length} (${projects.filter(p => p.status === 'IN_PROGRESS').length} active)`);
  console.log(`   Tasks: ${totalTasks} total`);
  console.log(`   - Completed: ${completedTasks} (${Math.round(completedTasks/totalTasks*100)}%)`);
  console.log(`   - In Progress: ${inProgressTasks} (${Math.round(inProgressTasks/totalTasks*100)}%)`);
  console.log(`   - TODO: ${todoTasks} (${Math.round(todoTasks/totalTasks*100)}%)`);
  console.log(`   - Overdue: ${overdueTasks}`);
  console.log(`   Milestones: ${milestones.length}`);
  console.log(`   Activities: ${activities.length}`);
  console.log(`   Timesheets: ${timesheets.length}`);
  
  console.log('\n🎉 Dummy data creation complete!');
  console.log('\n🔐 Login credentials:');
  console.log('   Email: admin@projectflow.io');
  console.log('   Password: password');
}

main()
  .catch((e) => {
    console.error('❌ Error creating dummy data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
