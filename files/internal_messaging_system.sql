-- Internal Communications Platform Database Schema
-- Corporate Hierarchy with Indian Names

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    department VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- ============================================
-- ROLES TABLE (Hierarchical Structure)
-- ============================================
CREATE TABLE roles (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_level INTEGER NOT NULL, -- Higher number = more authority
    description TEXT,
    can_create_rooms BOOLEAN DEFAULT FALSE,
    can_delete_rooms BOOLEAN DEFAULT FALSE,
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_assign_roles BOOLEAN DEFAULT FALSE,
    can_broadcast BOOLEAN DEFAULT FALSE,
    can_execute_commands BOOLEAN DEFAULT FALSE,
    can_view_all_rooms BOOLEAN DEFAULT FALSE,
    can_moderate_content BOOLEAN DEFAULT FALSE
);

-- ============================================
-- ROOMS/CHANNELS TABLE
-- ============================================
CREATE TABLE rooms (
    room_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(20) DEFAULT 'group', -- 'group', 'direct', 'department', 'broadcast'
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_private BOOLEAN DEFAULT FALSE,
    max_members INTEGER DEFAULT NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ============================================
-- ROOM MEMBERS TABLE
-- ============================================
CREATE TABLE room_members (
    member_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    member_role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'moderator', 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    can_post BOOLEAN DEFAULT TRUE,
    can_invite BOOLEAN DEFAULT FALSE,
    can_remove_members BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(room_id, user_id)
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'command', 'system', 'file'
    is_command BOOLEAN DEFAULT FALSE,
    parent_message_id INTEGER DEFAULT NULL, -- For threading/replies
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (parent_message_id) REFERENCES messages(message_id)
);

-- ============================================
-- DIRECT MESSAGES TABLE
-- ============================================
CREATE TABLE direct_messages (
    dm_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
);

-- ============================================
-- COMMANDS TABLE
-- ============================================
CREATE TABLE commands (
    command_id INTEGER PRIMARY KEY AUTOINCREMENT,
    command_name VARCHAR(50) UNIQUE NOT NULL,
    command_syntax VARCHAR(200) NOT NULL,
    description TEXT,
    required_role_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- COMMAND LOGS TABLE
-- ============================================
CREATE TABLE command_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    command_id INTEGER NOT NULL,
    room_id INTEGER,
    parameters TEXT,
    execution_status VARCHAR(20), -- 'success', 'failed', 'unauthorized'
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (command_id) REFERENCES commands(command_id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

-- ============================================
-- ACTIVE CONNECTIONS TABLE (WebSocket/Real-time)
-- ============================================
CREATE TABLE active_connections (
    connection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE audit_logs (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type VARCHAR(50) NOT NULL, -- 'create_room', 'delete_user', 'assign_role', etc.
    action_details TEXT,
    target_user_id INTEGER,
    target_room_id INTEGER,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================
-- INSERT ROLES (Hierarchical Structure)
-- ============================================
INSERT INTO roles (role_name, role_level, description, can_create_rooms, can_delete_rooms, can_manage_users, can_assign_roles, can_broadcast, can_execute_commands, can_view_all_rooms, can_moderate_content) VALUES
('CEO', 100, 'Chief Executive Officer - Supreme authority over entire system', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('CTO', 90, 'Chief Technology Officer - Technical leadership', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('VP_Engineering', 80, 'Vice President Engineering', TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE),
('Engineering_Manager', 70, 'Engineering Manager - Team leadership', TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, TRUE),
('Senior_Admin', 60, 'Senior System Administrator', TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, TRUE),
('Admin', 50, 'System Administrator - Can manage rooms and moderate', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE, TRUE),
('Team_Lead', 40, 'Team Lead - Can create team rooms', TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE),
('Senior_Engineer', 30, 'Senior Engineer - Trusted member', TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
('Engineer', 20, 'Engineer - Standard member', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
('Intern', 10, 'Intern - Limited access', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

-- ============================================
-- INSERT USERS (Indian Names with Corporate Hierarchy)
-- ============================================

-- CEO (Supreme Authority)
INSERT INTO users (username, full_name, email, password_hash, role_id, department) VALUES
('rajesh.sharma', 'Rajesh Sharma', 'rajesh.sharma@company.in', 'hash_ceo_001', 1, 'Executive');

-- CTO
INSERT INTO users (username, full_name, email, password_hash, role_id, department) VALUES
('priya.mehta', 'Priya Mehta', 'priya.mehta@company.in', 'hash_cto_001', 2, 'Technology');

-- VP Engineering
INSERT INTO users (username, full_name, email, password_hash, role_id, department) VALUES
('vikram.patel', 'Vikram Patel', 'vikram.patel@company.in', 'hash_vp_001', 3, 'Engineering');

-- Engineering Managers
INSERT INTO users (username, full_name, email, password_hash, role_id, department) VALUES
('anjali.reddy', 'Anjali Reddy', 'anjali.reddy@company.in', 'hash_mgr_001', 4, 'Engineering'),
('arjun.kumar', 'Arjun Kumar', 'arjun.kumar@company.in', 'hash_mgr_002', 4, 'Engineering');

-- Senior Admins
INSERT INTO users (username, full_name, email, password_hash, role_id, department) VALUES
('kavya.nair', 'Kavya Nair', 'kavya.nair@company.in', 'hash_sadmin_001', 5, 'IT Operations'),
('rohan.desai', 'Rohan Desai', 'rohan.desai@company.in', 'hash_sadmin_002', 5, 'IT Operations');

-- Admins (Server/Group Admins)
INSERT INTO users (username, full_name, email, password_hash, role_id, department) VALUES
('neha.singh', 'Neha Singh', 'neha.singh@company.in', 'hash_admin_001', 6, 'IT Operations'),
('aditya.joshi', 'Aditya Joshi', 'aditya.joshi@company.in', 'hash_admin_002', 6, 'IT Operations'),
('pooja.gupta', 'Pooja Gupta', 'pooja.gupta@company.in', 'hash_admin_003', 6, 'IT Operations');

-- Team Leads
INSERT INTO users (username, full_name, email, password_hash, role_id, department) VALUES
('sanjay.iyer', 'Sanjay Iyer', 'sanjay.iyer@company.in', 'hash_lead_001', 7, 'Backend Team'),
('meera.krishnan', 'Meera Krishnan', 'meera.krishnan@company.in', 'hash_lead_002', 7, 'Frontend Team'),
('karthik.menon', 'Karthik Menon', 'karthik.menon@company.in', 'hash_lead_003', 7, 'DevOps Team');

-- Senior Engineers
INSERT INTO users (username, full_name, email, password_hash, role_id, department) VALUES
('deepak.verma', 'Deepak Verma', 'deepak.verma@company.in', 'hash_sr_001', 8, 'Backend Team'),
('swati.bhatt', 'Swati Bhatt', 'swati.bhatt@company.in', 'hash_sr_002', 8, 'Frontend Team'),
('rahul.chopra', 'Rahul Chopra', 'rahul.chopra@company.in', 'hash_sr_003', 8, 'DevOps Team');

-- Engineers
INSERT INTO users (username, full_name, email, password_hash, role_id, department) VALUES
('amit.shah', 'Amit Shah', 'amit.shah@company.in', 'hash_eng_001', 9, 'Backend Team'),
('shreya.mishra', 'Shreya Mishra', 'shreya.mishra@company.in', 'hash_eng_002', 9, 'Frontend Team'),
('varun.agarwal', 'Varun Agarwal', 'varun.agarwal@company.in', 'hash_eng_003', 9, 'Backend Team'),
('tanvi.rao', 'Tanvi Rao', 'tanvi.rao@company.in', 'hash_eng_004', 9, 'Frontend Team'),
('nikhil.pandey', 'Nikhil Pandey', 'nikhil.pandey@company.in', 'hash_eng_005', 9, 'DevOps Team');

-- Interns
INSERT INTO users (username, full_name, email, password_hash, role_id, department) VALUES
('isha.bansal', 'Isha Bansal', 'isha.bansal@company.in', 'hash_int_001', 10, 'Backend Team'),
('aarav.malhotra', 'Aarav Malhotra', 'aarav.malhotra@company.in', 'hash_int_002', 10, 'Frontend Team'),
('diya.kapoor', 'Diya Kapoor', 'diya.kapoor@company.in', 'hash_int_003', 10, 'DevOps Team');

-- ============================================
-- INSERT ROOMS
-- ============================================
INSERT INTO rooms (room_name, room_type, description, created_by, is_private) VALUES
('General Announcements', 'broadcast', 'Company-wide announcements from leadership', 1, FALSE),
('Engineering All-Hands', 'group', 'Engineering department discussions', 3, FALSE),
('Backend Team', 'department', 'Backend engineering team communication', 10, FALSE),
('Frontend Team', 'department', 'Frontend engineering team communication', 11, FALSE),
('DevOps Team', 'department', 'DevOps and infrastructure team', 12, FALSE),
('Leadership Circle', 'group', 'Executive leadership private discussions', 1, TRUE),
('Admin Operations', 'group', 'System administrators coordination', 6, TRUE),
('Water Cooler', 'group', 'Casual conversations and team bonding', 1, FALSE),
('Incident Response', 'group', 'Critical incident management', 2, TRUE);

-- ============================================
-- INSERT ROOM MEMBERS
-- ============================================

-- General Announcements (Everyone can view, only leadership can post)
INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite) VALUES
(1, 1, 'owner', TRUE, TRUE), -- CEO
(1, 2, 'admin', TRUE, TRUE), -- CTO
(1, 3, 'admin', TRUE, TRUE); -- VP Engineering
-- Add all other users as members (can't post)
INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite)
SELECT 1, user_id, 'member', FALSE, FALSE FROM users WHERE role_id >= 4;

-- Engineering All-Hands
INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite)
SELECT 2, user_id, 
    CASE 
        WHEN role_id <= 3 THEN 'admin'
        WHEN role_id <= 5 THEN 'moderator'
        ELSE 'member'
    END,
    TRUE, 
    CASE WHEN role_id <= 5 THEN TRUE ELSE FALSE END
FROM users WHERE department IN ('Executive', 'Technology', 'Engineering', 'IT Operations', 'Backend Team', 'Frontend Team', 'DevOps Team');

-- Backend Team
INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite)
SELECT 3, user_id,
    CASE
        WHEN username = 'sanjay.iyer' THEN 'owner'
        WHEN role_id <= 5 THEN 'admin'
        ELSE 'member'
    END,
    TRUE, TRUE
FROM users WHERE department = 'Backend Team' OR role_id <= 3;

-- Frontend Team
INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite)
SELECT 4, user_id,
    CASE
        WHEN username = 'meera.krishnan' THEN 'owner'
        WHEN role_id <= 5 THEN 'admin'
        ELSE 'member'
    END,
    TRUE, TRUE
FROM users WHERE department = 'Frontend Team' OR role_id <= 3;

-- DevOps Team
INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite)
SELECT 5, user_id,
    CASE
        WHEN username = 'karthik.menon' THEN 'owner'
        WHEN role_id <= 5 THEN 'admin'
        ELSE 'member'
    END,
    TRUE, TRUE
FROM users WHERE department = 'DevOps Team' OR role_id <= 3;

-- Leadership Circle (Executives only)
INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite)
SELECT 6, user_id, 
    CASE WHEN role_id = 1 THEN 'owner' ELSE 'member' END,
    TRUE, FALSE
FROM users WHERE role_id <= 3;

-- Admin Operations
INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite)
SELECT 7, user_id,
    CASE WHEN role_id <= 5 THEN 'admin' ELSE 'member' END,
    TRUE, TRUE
FROM users WHERE role_id <= 6;

-- Water Cooler (Everyone)
INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite)
SELECT 8, user_id, 'member', TRUE, FALSE FROM users;

-- Incident Response
INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite)
SELECT 9, user_id,
    CASE 
        WHEN role_id = 1 THEN 'owner'
        WHEN role_id <= 5 THEN 'admin'
        ELSE 'member'
    END,
    TRUE, TRUE
FROM users WHERE role_id <= 7;

-- ============================================
-- INSERT COMMANDS
-- ============================================
INSERT INTO commands (command_name, command_syntax, description, required_role_level) VALUES
('/broadcast', '/broadcast [message]', 'Send message to all active users', 100),
('/create-room', '/create-room [name] [type]', 'Create a new discussion room', 40),
('/delete-room', '/delete-room [room_id]', 'Delete an existing room', 100),
('/assign-role', '/assign-role [user_id] [role_id]', 'Assign role to user', 100),
('/kick', '/kick [user_id] [room_id]', 'Remove user from room', 50),
('/mute', '/mute [user_id] [duration]', 'Mute user temporarily', 50),
('/ban', '/ban [user_id]', 'Ban user from system', 90),
('/promote', '/promote [user_id]', 'Promote user in room', 60),
('/invite', '/invite [user_id] [room_id]', 'Invite user to room', 40),
('/status', '/status [message]', 'Set status message', 10),
('/help', '/help', 'Display available commands', 10),
('/audit', '/audit [user_id] [days]', 'View audit logs', 80),
('/announce', '/announce [room_id] [message]', 'Make announcement in room', 70);

-- ============================================
-- SAMPLE MESSAGES
-- ============================================
INSERT INTO messages (room_id, sender_id, message_content, message_type) VALUES
(1, 1, 'Welcome to our internal communications platform. This is your CEO, Rajesh Sharma. All company announcements will be posted here.', 'system'),
(2, 3, 'Good morning team! Let''s make this a productive week. Remember our sprint planning at 10 AM.', 'text'),
(3, 10, 'Backend team sync at 2 PM today. Please update your tickets before the meeting.', 'text'),
(8, 15, 'Happy Friday everyone! Any weekend plans?', 'text'),
(7, 6, 'Server maintenance scheduled for Saturday 2-4 AM IST. All services will be down briefly.', 'text');

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_messages_room ON messages(room_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);
CREATE INDEX idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX idx_connections_user ON active_connections(user_id);
CREATE INDEX idx_connections_active ON active_connections(is_active);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_performed ON audit_logs(performed_at);

-- ============================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ============================================

-- View: User Permissions Summary
CREATE VIEW user_permissions AS
SELECT 
    u.user_id,
    u.username,
    u.full_name,
    u.department,
    r.role_name,
    r.role_level,
    r.can_create_rooms,
    r.can_delete_rooms,
    r.can_manage_users,
    r.can_assign_roles,
    r.can_broadcast,
    r.can_execute_commands,
    r.can_view_all_rooms,
    r.can_moderate_content
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.is_active = TRUE;

-- View: Room Activity Summary
CREATE VIEW room_activity AS
SELECT 
    r.room_id,
    r.room_name,
    r.room_type,
    COUNT(DISTINCT rm.user_id) as member_count,
    COUNT(m.message_id) as message_count,
    MAX(m.created_at) as last_activity
FROM rooms r
LEFT JOIN room_members rm ON r.room_id = rm.room_id
LEFT JOIN messages m ON r.room_id = m.room_id AND m.is_deleted = FALSE
WHERE r.is_active = TRUE
GROUP BY r.room_id, r.room_name, r.room_type;

-- View: Hierarchical Organization Chart
CREATE VIEW org_hierarchy AS
SELECT 
    u.user_id,
    u.full_name,
    u.department,
    r.role_name,
    r.role_level,
    CASE 
        WHEN r.role_level = 100 THEN NULL
        ELSE (SELECT user_id FROM users WHERE role_id = (
            SELECT role_id FROM roles WHERE role_level > r.role_level ORDER BY role_level ASC LIMIT 1
        ) AND department = u.department LIMIT 1)
    END as reports_to
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.is_active = TRUE
ORDER BY r.role_level DESC, u.department, u.full_name;

