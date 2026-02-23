const { sendTaskNotificationEmail, sendDelayedTaskEmail } = require('./src/utils/emailService');

async function testEmails() {
  console.log('Testing email notifications...');
  
  try {
    // Test task creation email
    await sendTaskNotificationEmail({
      taskTitle: 'Test Task for Email',
      assignerName: 'Test Assigner',
      ownerName: 'Test Owner',
      action: 'Created',
      taskId: 'test-123'
    });
    
    console.log('Task creation email sent successfully');
    
    // Test delayed task email with all fields
    await sendDelayedTaskEmail({
      taskTitle: 'Delayed Test Task',
      ownerName: 'Test Owner',
      assignerName: 'Test Assigner',
      projectName: 'Test Project',
      dueDate: '2025-02-18',
      daysDelayed: 3,
      taskId: 'delayed-456'
    });
    
    console.log('Delayed task email sent successfully');
    
  } catch (error) {
    console.error('Email test failed:', error);
  }
}

testEmails();
