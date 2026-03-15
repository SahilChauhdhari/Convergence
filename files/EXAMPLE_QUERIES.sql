-- ====================================================================
-- INTERNAL MESSAGING SYSTEM - USEFUL SQL QUERIES
-- ====================================================================

-- ====================================================================
-- 1. HIERARCHY & PERMISSIONS QUERIES
-- ====================================================================

-- Get complete organizational hierarchy
SELECT 
    r.role_level,
    r.role_name,
    u.full_name,
    u.department,
    u.email,
    CASE 
        WHEN r.can_assign_roles THEN 'Can manage roles'
        WHEN r.can_manage_users THEN 'Can manage users'
        WHEN r.can_create_rooms THEN 'Can create rooms'
        ELSE 'Regular member'
    END as primary_capability
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.is_active = TRUE
ORDER BY r.role_level DESC, u.department, u.full_name;

-- Find who can execute specific commands
SELECT 
    u.full_name,
    r.role_name,
    r.role_level,
    c.command_name,
    c.command_syntax
FROM users u
JOIN roles r ON u.role_id = r.role_id
CROSS JOIN commands c
WHERE r.role_level >= c.required_role_level
  AND c.command_name = '/broadcast'
ORDER BY r.role_level DESC;

-- Show CEO's complete access
SELECT 
    'CEO Total Control' as privilege_category,
    u.full_name as ceo_name,
    COUNT(DISTINCT rm.room_id) as accessible_rooms,
    COUNT(DISTINCT c.command_id) as executable_commands,
    'ALL' as manageable_users
FROM users u
JOIN roles r ON u.role_id = r.role_id
LEFT JOIN room_members rm ON u.user_id = rm.user_id
CROSS JOIN commands c
WHERE r.role_level = 100
GROUP BY u.user_id, u.full_name;

-- ====================================================================
-- 2. ROOM MANAGEMENT QUERIES
-- ====================================================================

-- List all rooms with creator and member count
SELECT 
    r.room_id,
    r.room_name,
    r.room_type,
    CASE WHEN r.is_private THEN 'Private' ELSE 'Public' END as privacy,
    u.full_name as created_by,
    COUNT(DISTINCT rm.user_id) as member_count,
    COUNT(DISTINCT m.message_id) as message_count,
    MAX(m.created_at) as last_activity
FROM rooms r
LEFT JOIN users u ON r.created_by = u.user_id
LEFT JOIN room_members rm ON r.room_id = rm.room_id
LEFT JOIN messages m ON r.room_id = m.room_id AND m.is_deleted = FALSE
WHERE r.is_active = TRUE
GROUP BY r.room_id
ORDER BY member_count DESC, last_activity DESC;

-- Find rooms where specific user is admin
SELECT 
    r.room_name,
    rm.member_role,
    COUNT(DISTINCT rm2.user_id) as total_members
FROM room_members rm
JOIN rooms r ON rm.room_id = r.room_id
JOIN room_members rm2 ON r.room_id = rm2.room_id
WHERE rm.user_id = 6  -- Kavya Nair (Senior Admin)
  AND rm.member_role IN ('owner', 'admin')
GROUP BY r.room_id, r.room_name, rm.member_role;

-- Private rooms accessible only to leadership
SELECT 
    r.room_name,
    r.description,
    GROUP_CONCAT(u.full_name, ', ') as members
FROM rooms r
JOIN room_members rm ON r.room_id = rm.room_id
JOIN users u ON rm.user_id = u.user_id
WHERE r.is_private = TRUE
GROUP BY r.room_id, r.room_name, r.description;

-- ====================================================================
-- 3. MESSAGE & COMMUNICATION QUERIES
-- ====================================================================

-- Recent messages across all rooms
SELECT 
    r.room_name,
    u.full_name as sender,
    m.message_content,
    m.message_type,
    m.created_at
FROM messages m
JOIN rooms r ON m.room_id = r.room_id
JOIN users u ON m.sender_id = u.user_id
WHERE m.is_deleted = FALSE
ORDER BY m.created_at DESC
LIMIT 50;

-- Message count by user (most active members)
SELECT 
    u.full_name,
    u.department,
    r.role_name,
    COUNT(m.message_id) as message_count,
    MIN(m.created_at) as first_message,
    MAX(m.created_at) as last_message
FROM users u
LEFT JOIN messages m ON u.user_id = m.sender_id AND m.is_deleted = FALSE
LEFT JOIN roles r ON u.role_id = r.role_id
GROUP BY u.user_id
ORDER BY message_count DESC;

-- Messages in specific room with threading
SELECT 
    m.message_id,
    u.full_name as sender,
    m.message_content,
    CASE WHEN m.parent_message_id IS NOT NULL THEN 'Reply' ELSE 'Original' END as message_type,
    m.created_at
FROM messages m
JOIN users u ON m.sender_id = u.user_id
WHERE m.room_id = 2  -- Engineering All-Hands
  AND m.is_deleted = FALSE
ORDER BY COALESCE(m.parent_message_id, m.message_id), m.created_at;

-- Direct message conversations
SELECT 
    CASE 
        WHEN dm.sender_id < dm.receiver_id 
        THEN dm.sender_id || '-' || dm.receiver_id
        ELSE dm.receiver_id || '-' || dm.sender_id
    END as conversation_id,
    u1.full_name as person_1,
    u2.full_name as person_2,
    COUNT(*) as message_count,
    MAX(dm.created_at) as last_message
FROM direct_messages dm
JOIN users u1 ON dm.sender_id = u1.user_id
JOIN users u2 ON dm.receiver_id = u2.user_id
WHERE dm.is_deleted = FALSE
GROUP BY conversation_id, person_1, person_2
ORDER BY last_message DESC;

-- ====================================================================
-- 4. USER ACTIVITY & MONITORING
-- ====================================================================

-- Currently active users (connected)
SELECT 
    u.full_name,
    u.department,
    r.role_name,
    ac.connected_at,
    ac.last_heartbeat,
    CAST((julianday('now') - julianday(ac.last_heartbeat)) * 24 * 60 AS INTEGER) as minutes_since_heartbeat
FROM active_connections ac
JOIN users u ON ac.user_id = u.user_id
JOIN roles r ON u.role_id = r.role_id
WHERE ac.is_active = TRUE
ORDER BY ac.last_heartbeat DESC;

-- Inactive users (no recent activity)
SELECT 
    u.full_name,
    u.department,
    r.role_name,
    u.last_seen,
    CAST((julianday('now') - julianday(u.last_seen)) AS INTEGER) as days_inactive
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.is_active = TRUE
  AND (u.last_seen IS NULL OR u.last_seen < datetime('now', '-7 days'))
ORDER BY u.last_seen ASC NULLS FIRST;

-- User's room memberships
SELECT 
    u.full_name,
    r.room_name,
    rm.member_role,
    CASE WHEN rm.can_post THEN 'Yes' ELSE 'No' END as can_post,
    CASE WHEN rm.can_invite THEN 'Yes' ELSE 'No' END as can_invite
FROM room_members rm
JOIN users u ON rm.user_id = u.user_id
JOIN rooms r ON rm.room_id = r.room_id
WHERE u.username = 'neha.singh'  -- Admin
ORDER BY r.room_name;

-- ====================================================================
-- 5. ADMIN & COMPLIANCE QUERIES
-- ====================================================================

-- Audit trail for administrative actions
SELECT 
    al.performed_at,
    u.full_name as performed_by,
    al.action_type,
    al.action_details,
    u2.full_name as target_user,
    r.room_name as target_room
FROM audit_logs al
JOIN users u ON al.user_id = u.user_id
LEFT JOIN users u2 ON al.target_user_id = u2.user_id
LEFT JOIN rooms r ON al.target_room_id = r.room_id
ORDER BY al.performed_at DESC
LIMIT 100;

-- Command execution history
SELECT 
    cl.executed_at,
    u.full_name as executed_by,
    c.command_name,
    cl.parameters,
    cl.execution_status,
    r.room_name as executed_in
FROM command_logs cl
JOIN users u ON cl.user_id = u.user_id
JOIN commands c ON cl.command_id = c.command_id
LEFT JOIN rooms r ON cl.room_id = r.room_id
ORDER BY cl.executed_at DESC;

-- Failed command attempts (security monitoring)
SELECT 
    cl.executed_at,
    u.full_name,
    ro.role_name,
    ro.role_level,
    c.command_name,
    c.required_role_level,
    cl.execution_status
FROM command_logs cl
JOIN users u ON cl.user_id = u.user_id
JOIN roles ro ON u.role_id = ro.role_id
JOIN commands c ON cl.command_id = c.command_id
WHERE cl.execution_status = 'unauthorized'
ORDER BY cl.executed_at DESC;

-- ====================================================================
-- 6. REPORTING & ANALYTICS
-- ====================================================================

-- Department communication statistics
SELECT 
    u.department,
    COUNT(DISTINCT u.user_id) as team_size,
    COUNT(DISTINCT m.message_id) as messages_sent,
    COUNT(DISTINCT rm.room_id) as rooms_participating,
    ROUND(CAST(COUNT(DISTINCT m.message_id) AS FLOAT) / COUNT(DISTINCT u.user_id), 2) as avg_messages_per_person
FROM users u
LEFT JOIN messages m ON u.user_id = m.sender_id AND m.is_deleted = FALSE
LEFT JOIN room_members rm ON u.user_id = rm.user_id
WHERE u.is_active = TRUE
GROUP BY u.department
ORDER BY messages_sent DESC;

-- Daily message volume
SELECT 
    DATE(m.created_at) as message_date,
    COUNT(*) as message_count,
    COUNT(DISTINCT m.sender_id) as unique_senders,
    COUNT(DISTINCT m.room_id) as active_rooms
FROM messages m
WHERE m.is_deleted = FALSE
  AND m.created_at >= datetime('now', '-30 days')
GROUP BY DATE(m.created_at)
ORDER BY message_date DESC;

-- Room engagement ranking
SELECT 
    r.room_name,
    r.room_type,
    COUNT(DISTINCT rm.user_id) as members,
    COUNT(DISTINCT m.sender_id) as active_members,
    COUNT(m.message_id) as total_messages,
    ROUND(CAST(COUNT(DISTINCT m.sender_id) AS FLOAT) / COUNT(DISTINCT rm.user_id) * 100, 1) as engagement_percentage
FROM rooms r
LEFT JOIN room_members rm ON r.room_id = rm.room_id
LEFT JOIN messages m ON r.room_id = m.room_id AND m.is_deleted = FALSE
WHERE r.is_active = TRUE
GROUP BY r.room_id
HAVING members > 0
ORDER BY engagement_percentage DESC;

-- ====================================================================
-- 7. PERMISSION VALIDATION QUERIES
-- ====================================================================

-- Check if user can execute specific command
SELECT 
    u.full_name,
    r.role_name,
    r.role_level,
    c.command_name,
    c.required_role_level,
    CASE 
        WHEN r.role_level >= c.required_role_level THEN 'AUTHORIZED'
        ELSE 'DENIED'
    END as permission_status
FROM users u
JOIN roles r ON u.role_id = r.role_id
CROSS JOIN commands c
WHERE u.username = 'neha.singh'
  AND c.command_name = '/kick'
LIMIT 1;

-- List all users who can manage a specific user
SELECT 
    manager.full_name as can_manage,
    manager_role.role_name as manager_role,
    manager_role.role_level,
    target.full_name as target_user,
    target_role.role_name as target_role,
    target_role.role_level as target_level
FROM users manager
JOIN roles manager_role ON manager.role_id = manager_role.role_id
CROSS JOIN users target
JOIN roles target_role ON target.role_id = target_role.role_id
WHERE manager_role.can_manage_users = TRUE
  AND manager_role.role_level > target_role.role_level
  AND target.username = 'amit.shah'  -- Engineer
ORDER BY manager_role.role_level DESC;

-- ====================================================================
-- 8. DIAGNOSTIC QUERIES
-- ====================================================================

-- System health check
SELECT 
    'Total Users' as metric, COUNT(*) as value FROM users WHERE is_active = TRUE
UNION ALL
SELECT 'Active Rooms', COUNT(*) FROM rooms WHERE is_active = TRUE
UNION ALL
SELECT 'Total Messages', COUNT(*) FROM messages WHERE is_deleted = FALSE
UNION ALL
SELECT 'Active Connections', COUNT(*) FROM active_connections WHERE is_active = TRUE
UNION ALL
SELECT 'Commands Available', COUNT(*) FROM commands WHERE is_active = TRUE;

-- Orphaned records check
SELECT 'Room members without rooms' as issue, COUNT(*) as count
FROM room_members rm
LEFT JOIN rooms r ON rm.room_id = r.room_id
WHERE r.room_id IS NULL

UNION ALL

SELECT 'Messages in deleted rooms', COUNT(*)
FROM messages m
LEFT JOIN rooms r ON m.room_id = r.room_id
WHERE r.is_active = FALSE OR r.room_id IS NULL;

