const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create admin user
  const hashedPassword = await bcrypt.hash('password', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@projectflow.io' },
    update: {},
    create: {
      email: 'admin@projectflow.io',
      password: hashedPassword,
      name: 'Admin User',
      role: 'MANAGING_DIRECTOR',
      department: 'Management',
      isActive: true,
    },
  });

  // Create additional users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@projectflow.io' },
      update: {},
      create: {
        email: 'john@projectflow.io',
        password: hashedPassword,
        name: 'John Developer',
        role: 'TEAM_LEAD',
        department: 'Engineering',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah@projectflow.io' },
      update: {},
      create: {
        email: 'sarah@projectflow.io',
        password: hashedPassword,
        name: 'Sarah Designer',
        role: 'EMPLOYEE',
        department: 'Design',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike@projectflow.io' },
      update: {},
      create: {
        email: 'mike@projectflow.io',
        password: hashedPassword,
        name: 'Mike Tester',
        role: 'EMPLOYEE',
        department: 'QA',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'lisa@projectflow.io' },
      update: {},
      create: {
        email: 'lisa@projectflow.io',
        password: hashedPassword,
        name: 'Lisa Manager',
        role: 'HR_MANAGER',
        department: 'HR',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'alex@projectflow.io' },
      update: {},
      create: {
        email: 'alex@projectflow.io',
        password: hashedPassword,
        name: 'Alex Developer',
        role: 'EMPLOYEE',
        department: 'Engineering',
        isActive: true,
      },
    }),
  ]);

  console.log('Created users:', users.length + 1);

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        color: '#00A1C7',
        ownerId: admin.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Mobile App Development',
        description: 'Native mobile app for iOS and Android',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-06-30'),
        color: '#00FFAA',
        ownerId: users[0].id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'API Integration',
        description: 'Third-party API integration project',
        status: 'PLANNING',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-04-30'),
        color: '#FFD700',
        ownerId: users[0].id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Database Migration',
        description: 'Migrate legacy database to new system',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-28'),
        color: '#FF6B6B',
        ownerId: users[0].id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Security Audit',
        description: 'Comprehensive security audit and improvements',
        status: 'COMPLETED',
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-01-15'),
        color: '#4ECDC4',
        ownerId: admin.id,
      },
    }),
  ]);

  console.log('Created projects:', projects.length);

  // Create tasks with varied statuses and dates
  const tasks = [];
  const taskStatuses = ['DONE', 'IN_PROGRESS', 'TODO', 'TODO', 'DONE', 'IN_PROGRESS', 'TODO', 'DONE'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const projectTasks = [
      {
        title: `Setup ${project.name} infrastructure`,
        description: 'Initial setup and configuration',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project.id,
        creatorId: admin.id,
        assigneeId: users[0].id,
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-15'),
      },
      {
        title: `Design ${project.name} mockups`,
        description: 'Create initial design mockups',
        status: 'DONE',
        priority: 'MEDIUM',
        projectId: project.id,
        creatorId: admin.id,
        assigneeId: users[1].id,
        startDate: new Date('2024-01-10'),
        dueDate: new Date('2024-01-25'),
      },
      {
        title: `Implement ${project.name} core features`,
        description: 'Develop main functionality',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project.id,
        creatorId: users[0].id,
        assigneeId: users[0].id,
        startDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-15'),
      },
      {
        title: `Test ${project.name} functionality`,
        description: 'QA testing and bug fixes',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project.id,
        creatorId: users[0].id,
        assigneeId: users[2].id,
        startDate: new Date('2024-02-10'),
        dueDate: new Date('2024-02-28'),
      },
      {
        title: `Deploy ${project.name}`,
        description: 'Production deployment',
        status: 'TODO',
        priority: 'CRITICAL',
        projectId: project.id,
        creatorId: admin.id,
        assigneeId: users[0].id,
        startDate: new Date('2024-03-01'),
        dueDate: new Date('2024-03-15'),
      },
      {
        title: `Documentation for ${project.name}`,
        description: 'Create technical documentation',
        status: 'DONE',
        priority: 'LOW',
        projectId: project.id,
        creatorId: users[3].id,
        assigneeId: users[4].id,
        startDate: new Date('2024-01-05'),
        dueDate: new Date('2024-01-20'),
      },
      {
        title: `Code review for ${project.name}`,
        description: 'Peer review and code quality checks',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        projectId: project.id,
        creatorId: users[0].id,
        assigneeId: users[1].id,
        startDate: new Date('2024-02-01'),
        dueDate: new Date('2024-02-10'),
      },
      {
        title: `Performance optimization for ${project.name}`,
        description: 'Optimize performance and bottlenecks',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project.id,
        creatorId: admin.id,
        assigneeId: users[4].id,
        startDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-01'),
      },
    ];
    
    for (const taskData of projectTasks) {
      const task = await prisma.task.create({ data: taskData });
      tasks.push(task);
    }
  }

  console.log('Created tasks:', tasks.length);

  // Create milestones
  const milestones = await Promise.all([
    prisma.milestone.create({
      data: {
        name: 'Phase 1 Complete',
        targetDate: new Date('2024-02-15'),
        isCompleted: true,
        projectId: projects[0].id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: 'Beta Release',
        targetDate: new Date('2024-03-01'),
        isCompleted: false,
        projectId: projects[0].id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: 'Final Release',
        targetDate: new Date('2024-03-31'),
        isCompleted: false,
        projectId: projects[0].id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: 'API Integration Complete',
        targetDate: new Date('2024-03-15'),
        isCompleted: false,
        projectId: projects[2].id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: 'Database Migration Complete',
        targetDate: new Date('2024-02-20'),
        isCompleted: false,
        projectId: projects[3].id,
      },
    }),
  ]);

  console.log('Created milestones:', milestones.length);

  // Create activities with varied dates
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        action: 'CREATED',
        entityType: 'PROJECT',
        entityId: projects[0].id,
        description: 'Created project "Website Redesign"',
        projectId: projects[0].id,
        userId: admin.id,
      },
    }),
    prisma.activity.create({
      data: {
        action: 'COMPLETED',
        entityType: 'TASK',
        entityId: tasks[0].id,
        description: 'Completed task "Setup Website Redesign infrastructure"',
        projectId: projects[0].id,
        userId: users[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        action: 'UPDATED',
        entityType: 'TASK',
        entityId: tasks[2].id,
        description: 'Updated task "Implement Website Redesign core features" to IN_PROGRESS',
        projectId: projects[0].id,
        userId: users[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        action: 'CREATED',
        entityType: 'TASK',
        entityId: tasks[5].id,
        description: 'Created task "Documentation for Website Redesign"',
        projectId: projects[0].id,
        userId: users[3].id,
      },
    }),
    prisma.activity.create({
      data: {
        action: 'COMPLETED',
        entityType: 'MILESTONE',
        entityId: milestones[0].id,
        description: 'Completed milestone "Phase 1 Complete"',
        projectId: projects[0].id,
        userId: admin.id,
      },
    }),
    prisma.activity.create({
      data: {
        action: 'UPDATED',
        entityType: 'PROJECT',
        entityId: projects[4].id,
        description: 'Marked project "Security Audit" as COMPLETED',
        projectId: projects[4].id,
        userId: admin.id,
      },
    }),
  ]);

  console.log('Created activities:', activities.length);
  
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
