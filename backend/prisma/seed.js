const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin/Managing Director
  const hashedPassword = await bcrypt.hash('password', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@projectflow.io' },
    update: {},
    create: {
      email: 'admin@projectflow.io',
      password: hashedPassword,
      name: 'Admin Director',
      role: 'MANAGING_DIRECTOR',
      department: 'Executive',
    },
  });

  const hrManager = await prisma.user.upsert({
    where: { email: 'hr@projectflow.io' },
    update: {},
    create: {
      email: 'hr@projectflow.io',
      password: hashedPassword,
      name: 'Sarah HR',
      role: 'HR_MANAGER',
      department: 'Human Resources',
    },
  });

  const teamLead = await prisma.user.upsert({
    where: { email: 'lead@projectflow.io' },
    update: {},
    create: {
      email: 'lead@projectflow.io',
      password: hashedPassword,
      name: 'Mike Lead',
      role: 'TEAM_LEAD',
      department: 'Engineering',
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@projectflow.io' },
    update: {},
    create: {
      email: 'employee@projectflow.io',
      password: hashedPassword,
      name: 'Jane Employee',
      role: 'EMPLOYEE',
      department: 'Engineering',
    },
  });

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design.',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      budget: 50000,
      color: '#00A1C7',
      tags: ['design', 'frontend', 'priority'],
      ownerId: admin.id,
    },
  });

  // Add project members
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: teamLead.id } },
    update: {},
    create: { projectId: project.id, userId: teamLead.id, roleInProject: 'LEAD' },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: employee.id } },
    update: {},
    create: { projectId: project.id, userId: employee.id, roleInProject: 'CONTRIBUTOR' },
  });

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Design Homepage Mockup',
      description: 'Create wireframes and high-fidelity mockups for the homepage.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2024-06-30'),
      estimatedHours: 20,
      projectId: project.id,
      assigneeId: employee.id,
      creatorId: teamLead.id,
      tags: ['design', 'ui'],
    },
  });

  await prisma.task.create({
    data: {
      title: 'Setup Development Environment',
      description: 'Configure dev environment with all required tools and dependencies.',
      status: 'DONE',
      priority: 'MEDIUM',
      dueDate: new Date('2024-05-15'),
      estimatedHours: 8,
      projectId: project.id,
      assigneeId: employee.id,
      creatorId: teamLead.id,
      tags: ['setup'],
    },
  });

  await prisma.task.create({
    data: {
      title: 'Implement Authentication System',
      description: 'Build login, registration, and JWT-based auth.',
      status: 'TODO',
      priority: 'CRITICAL',
      dueDate: new Date('2024-07-15'),
      estimatedHours: 40,
      projectId: project.id,
      assigneeId: employee.id,
      creatorId: teamLead.id,
      tags: ['backend', 'security'],
    },
  });

  // Create milestone
  await prisma.milestone.create({
    data: {
      name: 'Phase 1 Launch',
      targetDate: new Date('2024-06-30'),
      projectId: project.id,
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      title: 'Welcome to ProjectFlow!',
      message: 'Your account has been set up. Start exploring projects.',
      type: 'INFO',
      userId: admin.id,
    },
  });

  console.log('Seed completed!');
  console.log('Accounts:');
  console.log('  admin@projectflow.io / password (Managing Director)');
  console.log('  hr@projectflow.io / password (HR Manager)');
  console.log('  lead@projectflow.io / password (Team Lead)');
  console.log('  employee@projectflow.io / password (Employee)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
