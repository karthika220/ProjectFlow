# Universal Notification System

## Overview
A user-based notification system that works for all users regardless of role (no MD/HR separation).

## Features Implemented

### ✅ Frontend Components
- **NotificationsPage** (`/notifications`) - Full notification management interface
- **Layout Integration** - Notification bell with unread count in header
- **Real-time Updates** - Auto-refresh every 30 seconds
- **Relative Timestamps** - "2m ago", "1h ago", "3d ago"
- **Mark as Read** - Individual and bulk actions
- **Status-based Icons** - Different icons for different notification types

### ✅ Backend API
- **GET /api/notifications** - Fetch current user's notifications
- **POST /api/notifications** - Create new notifications (with authorization)
- **PATCH /api/notifications/:id/read** - Mark single notification as read
- **PATCH /api/notifications/read-all** - Mark all notifications as read

### ✅ Notification Types
- `TASK_OVERDUE` - When tasks pass their due date
- `TIMESHEET_SUBMITTED` - When employees submit timesheets (managers only)
- `MENTION` - When users are mentioned in comments (@username)
- `PROJECT_UPDATE` - Project status changes
- `TASK_ASSIGNED` - When tasks are assigned to users
- `INFO` - General information notifications

### ✅ Event Triggers
1. **Task Assignment** - Automatic notification when assigned to task
2. **Task Reassignment** - Notification when task assignment changes
3. **Comment Mentions** - @username detection in task comments
4. **Timesheet Submission** - Notifies all managers/directors/leads
5. **Overdue Tasks** - Background job checks daily

### ✅ User-based Security
- All notifications are filtered by `userId` from authenticated user
- Users can only create notifications for themselves (except managers)
- No role-based access restrictions for viewing notifications

## Usage

### For Users
1. Click notification bell in header to view notifications
2. See unread count badge on bell icon
3. Mark individual notifications as read
4. Use "Mark all as read" for bulk actions
5. Relative timestamps show when notifications were created

### For Developers
```javascript
// Create notification using utility
import { notificationService } from '../utils/notifications'

await notificationService.createTaskAssignedNotification(
  userId, 
  taskTitle, 
  projectName
)

// Create custom notification
await notificationService.createInfoNotification(
  userId,
  "Custom Title",
  "Custom message"
)
```

### For System Admins
Run overdue task check manually:
```bash
cd backend
npm run notifications:check-overdue
```

## Database Schema
```sql
model Notification {
  id        String   @id @default(uuid())
  title     String
  message   String
  type      String   @default("INFO")
  isRead    Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

## Color Mapping
- DONE → Green/Mint (#00FFAA)
- IN_PROGRESS → Blue/Teal (#00A1C7)
- IN_REVIEW → Yellow (#FFD700)
- TODO → Purple (#8B5CF6)
- COMPLETED → Emerald (#10B981)
- PLANNING → Orange (#F59E0B)
- ACTIVE → Emerald (#10B981)
- ON_HOLD → Red (#EF4444)
- ARCHIVED → Gray (#6B7280)
- OVERDUE → Red (#EF4444)

## Technical Details

### Real-time Updates
- Frontend polls `/api/notifications` every 30 seconds
- Layout component updates unread count automatically
- NotificationsPage refreshes after read/unread actions

### Security
- All routes require authentication
- Users can only access their own notifications
- Managers can create notifications for other users (for system events)

### Performance
- Limited to 20 most recent notifications
- Efficient database queries with proper indexing
- Minimal frontend re-renders with React hooks

## Future Enhancements
- WebSocket integration for true real-time updates
- Push notifications for mobile/desktop
- Email notification integration
- Notification preferences per type
- Scheduled notifications (reminders)
