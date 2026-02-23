const nodemailer = require('nodemailer');

// SMTP Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mahanisha143521@gmail.com',
    pass: 'hycd ague tjab ypfd'
  }
});

// Temporary static receiver
const STATIC_RECEIVER = 'karthikaammasi2003@gmail.com';

/**
 * Send task notification email
 * @param {Object} options - Email options
 * @param {string} options.taskTitle - Task title
 * @param {string} options.assignerName - Assigner name
 * @param {string} options.ownerName - Owner name
 * @param {string} options.action - Action (Created / Updated)
 * @param {string} options.taskId - Task ID for reference
 */
const sendTaskNotificationEmail = async (options) => {
  try {
    const { taskTitle, assignerName, ownerName, action, taskId } = options;

    const mailOptions = {
      from: 'mahanisha143521@gmail.com',
      to: STATIC_RECEIVER,
      subject: `Task Notification: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #09090B; padding: 20px; border-radius: 8px; color: white;">
            <h1 style="margin: 0; color: #00FFAA; font-size: 24px;">Task ${action}</h1>
            <p style="margin: 10px 0; color: #ccc;">A task has been ${action.toLowerCase()} in ProjectFlow</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #333;">Task Details</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Task Title:</strong>
              <span style="color: #333; margin-left: 10px;">${taskTitle}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Assigner:</strong>
              <span style="color: #333; margin-left: 10px;">${assignerName}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Owner:</strong>
              <span style="color: #333; margin-left: 10px;">${ownerName}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Action:</strong>
              <span style="color: #00FFAA; margin-left: 10px; font-weight: bold;">${action}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Task ID:</strong>
              <span style="color: #999; margin-left: 10px; font-size: 12px;">${taskId}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated notification from ProjectFlow Task Management System.</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Task notification email sent for ${action}: ${taskTitle}`);
  } catch (error) {
    console.error('Failed to send task notification email:', error);
  }
};

/**
 * Send delayed task notification email
 * @param {Object} options - Email options
 * @param {string} options.taskTitle - Task title
 * @param {string} options.ownerName - Owner name
 * @param {string} options.assignerName - Assigner name
 * @param {string} options.projectName - Project name
 * @param {string} options.dueDate - Due date
 * @param {number} options.daysDelayed - Number of days delayed
 * @param {string} options.taskId - Task ID for reference
 */
const sendDelayedTaskEmail = async (options) => {
  try {
    const { taskTitle, ownerName, assignerName, projectName, dueDate, daysDelayed, taskId } = options;

    const mailOptions = {
      from: 'mahanisha143521@gmail.com',
      to: STATIC_RECEIVER,
      subject: `Task Delayed: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #09090B; padding: 20px; border-radius: 8px; color: white;">
            <h1 style="margin: 0; color: #ff4444; font-size: 24px;">⚠️ Task Delayed</h1>
            <p style="margin: 10px 0; color: #ccc;">A task is overdue and has been marked as delayed</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #333;">Delayed Task Details</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Task Title:</strong>
              <span style="color: #333; margin-left: 10px;">${taskTitle}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Project:</strong>
              <span style="color: #333; margin-left: 10px;">${projectName || 'No Project'}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Owner:</strong>
              <span style="color: #333; margin-left: 10px;">${ownerName}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Assigner:</strong>
              <span style="color: #333; margin-left: 10px;">${assignerName}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Due Date:</strong>
              <span style="color: #ff4444; margin-left: 10px; font-weight: bold;">${dueDate}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Days Delayed:</strong>
              <span style="color: #ff4444; margin-left: 10px; font-weight: bold;">${daysDelayed} days</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #666;">Task ID:</strong>
              <span style="color: #999; margin-left: 10px; font-size: 12px;">${taskId}</span>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ff4444;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Action Required:</strong> This task is overdue and requires immediate attention.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated notification from ProjectFlow Task Management System.</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Delayed task email sent: ${taskTitle} (${daysDelayed} days overdue)`);
  } catch (error) {
    console.error('Failed to send delayed task email:', error);
  }
};

module.exports = {
  sendTaskNotificationEmail,
  sendDelayedTaskEmail,
  STATIC_RECEIVER
};
