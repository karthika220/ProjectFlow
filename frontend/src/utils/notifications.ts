import { useState } from 'react'
import api from '../api/axios'

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: 'TASK_OVERDUE' | 'TIMESHEET_SUBMITTED' | 'MENTION' | 'PROJECT_UPDATE' | 'TASK_ASSIGNED' | 'INFO'
}

// Notification creation utility functions
export const notificationService = {
  // Create a notification for a specific user
  async createNotification(data: NotificationData) {
    try {
      const response = await api.post('/notifications', data)
      return response.data
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  },

  // Task overdue notification
  async createTaskOverdueNotification(userId: string, taskTitle: string, projectName: string) {
    return this.createNotification({
      userId,
      title: 'Task Overdue',
      message: `Your task "${taskTitle}" in project "${projectName}" is overdue.`,
      type: 'TASK_OVERDUE'
    })
  },

  // Timesheet submitted notification (for managers)
  async createTimesheetSubmittedNotification(userId: string, employeeName: string, period: string) {
    return this.createNotification({
      userId,
      title: 'Timesheet Submitted',
      message: `${employeeName} has submitted their timesheet for ${period}.`,
      type: 'TIMESHEET_SUBMITTED'
    })
  },

  // Mention notification
  async createMentionNotification(userId: string, mentionedBy: string, context: string, itemType: string) {
    return this.createNotification({
      userId,
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you in a ${itemType}: "${context}"`,
      type: 'MENTION'
    })
  },

  // Project update notification
  async createProjectUpdateNotification(userId: string, projectName: string, updateType: string) {
    return this.createNotification({
      userId,
      title: 'Project Update',
      message: `Project "${projectName}" has been ${updateType}.`,
      type: 'PROJECT_UPDATE'
    })
  },

  // Task assigned notification
  async createTaskAssignedNotification(userId: string, taskTitle: string, projectName: string) {
    return this.createNotification({
      userId,
      title: 'New Task Assigned',
      message: `You have been assigned to task "${taskTitle}" in project "${projectName}".`,
      type: 'TASK_ASSIGNED'
    })
  },

  // Generic info notification
  async createInfoNotification(userId: string, title: string, message: string) {
    return this.createNotification({
      userId,
      title,
      message,
      type: 'INFO'
    })
  }
}

// Hook for real-time notification updates
export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = async () => {
    try {
      const response = await api.get('/notifications')
      setUnreadCount(response.data.filter((n: any) => !n.isRead).length)
    } catch (error) {
      console.error('Failed to refresh notification count:', error)
    }
  }

  return {
    unreadCount,
    refreshUnreadCount
  }
}
