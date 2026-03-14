# Internal Communications Platform - Database Documentation

## Overview
This database powers a hierarchical internal messaging system for a distributed engineering organization with complete corporate hierarchy and role-based access control.

---

## Corporate Hierarchy

### Power Structure (Role Levels: 10-100)

```
Level 100: CEO (Supreme Authority)
    └── Rajesh Sharma
        ├── Complete system control
        ├── All permissions enabled
        └── Can override any decision

Level 90: CTO
    └── Priya Mehta
        ├── Technical leadership
        └── Nearly all permissions (cannot assign CEO role)

Level 80: VP Engineering
    └── Vikram Patel
        ├── Engineering oversight
        └── Strategic room management

Level 70: Engineering Managers
    ├── Anjali Reddy
    └── Arjun Kumar
        ├── Team leadership
        └── Can manage users within teams

Level 60: Senior Admins
    ├── Kavya Nair
    └── Rohan Desai
        ├── System administration
        └── Can create/delete rooms, execute commands

Level 50: Admins (Server/Group Admins)
    ├── Neha Singh
    ├── Aditya Joshi
    └── Pooja Gupta
        ├── Room moderation
        ├── Can kick/mute users
        └── Cannot manage roles

Level 40: Team Leads
    ├── Sanjay Iyer (Backend)
    ├── Meera Krishnan (Frontend)
    └── Karthik Menon (DevOps)
        ├── Can create team rooms
        └── Can invite members

Level 30: Senior Engineers
Level 20: Engineers
Level 10: Interns
```

---

## Database Schema

### Core Tables

#### 1. **users**
Stores all user accounts with role assignments
- `user_id`: Primary key
- `role_id`: Foreign key to roles table (determines permissions)
- `department`: Team/department assignment
- `is_active`: Account status

#### 2. **roles**
Defines hierarchical permission structure
- `role_level`: Numeric hierarchy (higher = more power)
- Permission flags:
  - `can_create_rooms`: Create new discussion rooms
  - `can_delete_rooms`: Delete existing rooms
  - `can_manage_users`: Activate/deactivate users
  - `can_assign_roles`: Change user roles (limited by hierarchy)
  - `can_broadcast`: Send system-wide messages
  - `can_execute_commands`: Run system commands
  - `can_view_all_rooms`: Access any room regardless of membership
  - `can_moderate_content`: Edit/delete others' messages

#### 3. **rooms**
Discussion channels/groups
- Types: `broadcast`, `group`, `department`, `direct`
- Privacy levels: public/private
- Creator tracking for accountability

#### 4. **room_members**
Many-to-many relationship between users and rooms
- Member roles: `owner`, `admin`, `moderator`, `member`
- Granular permissions per room:
  - `can_post`: Send messages
  - `can_invite`: Add new members
  - `can_remove_members`: Kick users from room

#### 5. **messages**
Real-time communication storage
- Message types: `text`, `command`, `system`, `file`
- Threading support via `parent_message_id`
- Soft deletion with `is_deleted` flag

#### 6. **direct_messages**
One-on-one private conversations
- Read receipts
- Separate from room-based messaging

#### 7. **commands**
System command definitions
- Command syntax and descriptions
- `required_role_level`: Minimum role to execute
- Examples: `/broadcast`, `/kick`, `/ban`, `/assign-role`

#### 8. **command_logs**
Audit trail for all command executions
- Tracks who executed what, when, and where
- Execution status (success/failed/unauthorized)

#### 9. **active_connections**
Real-time WebSocket/connection tracking
- Session tokens
- Last heartbeat for connection health
- Enables instant message delivery

#### 10. **audit_logs**
Complete system activity tracking
- All administrative actions
- User and room targeting
- Timestamp-based queries for compliance

---

## Permission Matrix

| Role | Create Rooms | Delete Rooms | Manage Users | Assign Roles | Broadcast | Commands | View All | Moderate |
|------|--------------|--------------|--------------|--------------|-----------|----------|----------|----------|
| CEO | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CTO | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| VP_Engineering | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Engineering_Manager | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ |
| Senior_Admin | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| Admin | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Team_Lead | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Senior_Engineer | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Engineer | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Intern | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## Key Features

### 1. **Hierarchical Control**
- CEO has absolute authority
- Each role level can manage only lower levels
- Admins have power but cannot override CEO/CTO decisions

### 2. **Real-time Communication**
- `active_connections` table tracks WebSocket sessions
- Instant message delivery to connected clients
- Heartbeat monitoring for connection health

### 3. **Room-based Architecture**
- Multiple room types for different use cases
- Granular permissions per room
- Private rooms for sensitive discussions

### 4. **Command System**
- Extensible command framework
- Role-level restrictions
- Full audit logging

### 5. **Audit Trail**
- Every administrative action logged
- Compliance-ready
- Forensic investigation support

---

## Usage Examples

### Check CEO's Power
```sql
SELECT * FROM user_permissions WHERE role_level = 100;
```

### View Admin Hierarchy
```sql
SELECT full_name, role_name, role_level, department
FROM user_permissions
WHERE role_name LIKE '%Admin%' OR role_name LIKE '%Manager%'
ORDER BY role_level DESC;
```

### Find All Rooms a User Can Access
```sql
SELECT r.room_name, rm.member_role, rm.can_post
FROM rooms r
JOIN room_members rm ON r.room_id = rm.room_id
WHERE rm.user_id = 1  -- CEO
ORDER BY r.room_type;
```

### Track Recent Commands
```sql
SELECT u.full_name, c.command_name, cl.parameters, cl.execution_status, cl.executed_at
FROM command_logs cl
JOIN users u ON cl.user_id = u.user_id
JOIN commands c ON cl.command_id = c.command_id
ORDER BY cl.executed_at DESC
LIMIT 20;
```

### Get Active Users in a Room
```sql
SELECT u.full_name, u.department, rm.member_role
FROM room_members rm
JOIN users u ON rm.user_id = u.user_id
WHERE rm.room_id = 2  -- Engineering All-Hands
  AND u.is_active = TRUE
ORDER BY rm.member_role, u.full_name;
```

---

## Security Considerations

1. **Role Enforcement**: Application layer must validate role_level before executing sensitive operations
2. **Audit Logging**: All state changes must be logged to audit_logs
3. **Connection Management**: Stale connections should be cleaned up periodically
4. **Message Encryption**: Consider encrypting message_content for private rooms
5. **Rate Limiting**: Implement per-user message rate limits to prevent spam

---

## Scalability Features

- **Indexed Queries**: All foreign keys and frequently queried columns are indexed
- **Soft Deletes**: Messages use `is_deleted` flag instead of hard deletion
- **Partitioning Ready**: Messages table can be partitioned by created_at
- **Connection Pooling**: active_connections supports multiple sessions per user
- **Caching Layer**: user_permissions view can be cached for performance

---

## Extension Points

1. **File Attachments**: Add `attachments` table linked to messages
2. **Reactions**: Add `message_reactions` for emoji responses
3. **Read Receipts**: Add `message_read_status` for tracking
4. **Voice/Video**: Add `call_sessions` for WebRTC integration
5. **Bots**: Add `bot_users` with special permissions
6. **Webhooks**: Add `webhooks` table for external integrations

---

## Compliance & Governance

- All administrative actions logged with timestamps
- CEO can view all rooms and messages (Level 100 privilege)
- Soft deletion preserves data for forensics
- Audit logs cannot be deleted (enforce at application level)
- Role changes are logged with before/after states

