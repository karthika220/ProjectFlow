const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Check for overdue tasks and create notifications
async function checkOverdueTasks() {
  try {
    console.log('Checking for overdue tasks...');
    
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          lt: new Date()
        },
        status: {
          notIn: ['DONE', 'COMPLETED']
        }
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    });

    console.log(`Found ${overdueTasks.length} overdue tasks`);

    for (const task of overdueTasks) {
      if (task.assignee) {
        // Check if notification already exists for this overdue task today
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: task.assignee.id,
            type: 'TASK_OVERDUE',
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
            },
            message: {
              contains: task.title
            }
          }
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: task.assignee.id,
              title: 'Task Overdue',
              message: `Your task "${task.title}" in project "${task.project.name}" is overdue.`,
              type: 'TASK_OVERDUE',
            }
          });
          
          console.log(`Created overdue notification for ${task.assignee.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
  }
}

// Run the job
checkOverdueTasks()
  .then(() => {
    console.log('Overdue task check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Overdue task check failed:', error);
    process.exit(1);
  });
