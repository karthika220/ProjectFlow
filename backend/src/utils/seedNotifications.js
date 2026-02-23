const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Demo notifications for testing
const demoNotifications = [
  {
    title: 'Task Overdue',
    message: 'Your task "Update project documentation" in project "Website Redesign" is overdue.',
    type: 'TASK_OVERDUE',
  },
  {
    title: 'New Task Assigned',
    message: 'You have been assigned to task "Fix login bug" in project "Mobile App".',
    type: 'TASK_ASSIGNED',
  },
  {
    title: 'Timesheet Submitted',
    message: 'John Doe has submitted their timesheet for 2/15/2026.',
    type: 'TIMESHEET_SUBMITTED',
  },
  {
    title: 'You were mentioned',
    message: 'Sarah Smith mentioned you in a comment: "Can you review this when you get a chance? @john"',
    type: 'MENTION',
  },
  {
    title: 'Project Update',
    message: 'Project "Q4 Marketing Campaign" has been completed.',
    type: 'PROJECT_UPDATE',
  },
  {
    title: 'Task Assignment Updated',
    message: 'You have been assigned to task "Database optimization" in project "Backend Refactor".',
    type: 'TASK_ASSIGNED',
  },
  {
    title: 'You were mentioned',
    message: 'Mike Johnson mentioned you in a comment: "@john Great work on the presentation!"',
    type: 'MENTION',
  },
  {
    title: 'Task Overdue',
    message: 'Your task "Review pull requests" in project "Open Source" is overdue.',
    type: 'TASK_OVERDUE',
  },
  {
    title: 'Timesheet Submitted',
    message: 'Emily Chen has submitted their timesheet for 2/14/2026.',
    type: 'TIMESHEET_SUBMITTED',
  },
  {
    title: 'Project Update',
    message: 'Project "API Development" status changed to IN_PROGRESS.',
    type: 'PROJECT_UPDATE',
  }
];

async function seedDemoNotifications() {
  try {
    console.log('Seeding demo notifications...');

    // Get all users to distribute notifications
    const users = await prisma.user.findMany({
      select: { id: true, name: true }
    });

    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      return;
    }

    console.log(`Found ${users.length} users`);

    // Create notifications for each user
    for (const user of users) {
      console.log(`Creating notifications for ${user.name}...`);
      
      // Mix of read and unread notifications
      const notifications = demoNotifications.map((notif, index) => ({
        ...notif,
        userId: user.id,
        isRead: Math.random() > 0.6, // 40% unread, 60% read
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time within last 7 days
      }));

      // Create notifications one by one to avoid duplicates
      for (const notif of notifications) {
        try {
          await prisma.notification.create({
            data: notif
          });
        } catch (error) {
          // Ignore duplicate errors
          if (!error.message.includes('Unique constraint')) {
            throw error;
          }
        }
      }

      console.log(`Created demo notifications for ${user.name}`);
    }

    console.log('Demo notifications seeded successfully!');
  } catch (error) {
    console.error('Error seeding demo notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoNotifications();
