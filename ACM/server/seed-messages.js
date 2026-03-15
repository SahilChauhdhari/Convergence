/**
 * Seed script: inserts the provided historical chat data into the correct rooms.
 * 
 * Room IDs (from db-info.json):
 *   10 = Creative Design
 *   11 = Campaign Strategy
 *   12 = Analytics & Insights
 *   13 = Product & Platform
 *   14 = Security & Compliance
 *   15 = Operations
 *
 * We'll create persona users for Sara, Dev, Riya, Maya, Leo, Arjun (if not existing),
 * then insert messages with correct sender_id references.
 */

const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');

const ROOM_IDS = {
  creative_design: 10,
  campaign_strategy: 11,
  analytics_insights: 12,
  product_platform: 13,
  security_compliance: 14,
  operations: 15,
};

// Persona users we need – we'll upsert these
const PERSONA_USERS = [
  { username: 'sara.designer',     full_name: 'Sara',             email: 'sara@aether.in',        role_id: 9, department: 'Creative Design' },
  { username: 'arjun.strategist',  full_name: 'Arjun',            email: 'arjun@aether.in',       role_id: 4, department: 'Campaign Strategy' },
  { username: 'dev.engineer',      full_name: 'Dev',              email: 'dev@aether.in',         role_id: 7, department: 'Engineering' },
  { username: 'riya.ai',           full_name: 'Riya',             email: 'riya@aether.in',        role_id: 9, department: 'AI Engineering' },
  { username: 'maya.analyst',      full_name: 'Maya',             email: 'maya@aether.in',        role_id: 9, department: 'Analytics' },
  { username: 'leo.success',       full_name: 'Leo',              email: 'leo@aether.in',         role_id: 9, department: 'Client Success' },
  { username: 'compliance.officer',full_name: 'Compliance Officer', email: 'compliance@aether.in', role_id: 6, department: 'Compliance' },
  { username: 'admin.ops',         full_name: 'Admin',            email: 'admin.ops@aether.in',   role_id: 6, department: 'IT Operations' },
  { username: 'ops.lead',          full_name: 'Ops Lead',         email: 'opslead@aether.in',     role_id: 4, department: 'Operations' },
];

// Messages to seed  (room_key, sender_username, content, is_command, created_at)
const MESSAGES = [
  // ─── Creative Design (room 10) ──────────────────────────────
  { room: 'creative_design', sender: 'sara.designer',    content: "I've finished the initial mood board for the \"Next-Gen\" rebranding.", ts: '2026-03-15 04:05:00' },
  { room: 'creative_design', sender: 'arjun.strategist', content: "Looks sleek, but the typography feels a bit too corporate for the Gen-Z demographic.", ts: '2026-03-15 04:06:00' },
  { room: 'creative_design', sender: 'sara.designer',    content: "I can swap the sans-serif for something more experimental. Let me try a variable font approach.", ts: '2026-03-15 04:07:00' },
  { room: 'creative_design', sender: 'system',           content: '/cmd render_preview --style="experimental-modern"', ts: '2026-03-15 04:07:30', is_command: 1 },
  { room: 'creative_design', sender: 'sara.designer',    content: "Updating the file now. Check the new layout.\n\n📎 branding_v2_experimental.fig", ts: '2026-03-15 04:08:00' },

  // ─── Product & Platform (room 13) ────────────────────────────
  { room: 'product_platform', sender: 'dev.engineer',   content: "The API latency is spiking on the staging server. Anyone pushing changes right now?", ts: '2026-03-15 04:10:00' },
  { room: 'product_platform', sender: 'riya.ai',        content: "I just deployed the new vector embedding model. It might be memory-heavy.", ts: '2026-03-15 04:11:00' },
  { room: 'product_platform', sender: 'dev.engineer',   content: "Checking the resource allocation.", ts: '2026-03-15 04:11:30' },
  { room: 'product_platform', sender: 'system',         content: '/monitor --service="ai-engine" --metrics="ram,cpu"\n\n> ⚠️ Alert: Memory usage at 88%. Threshold exceeded.', ts: '2026-03-15 04:12:00', is_command: 1 },
  { room: 'product_platform', sender: 'dev.engineer',   content: "Scale it up. I'm increasing the pod count to 5.", ts: '2026-03-15 04:12:30' },
  { room: 'product_platform', sender: 'riya.ai',        content: "Confirmed. Latency should stabilize in 30 seconds.", ts: '2026-03-15 04:13:00' },

  // ─── Analytics & Insights (room 12) ──────────────────────────
  { room: 'analytics_insights', sender: 'maya.analyst', content: "The Q1 engagement report is ready. We saw a 14% lift in user retention after the last UI update.", ts: '2026-03-15 04:15:00' },
  { room: 'analytics_insights', sender: 'leo.success',  content: "Which specific feature drove that?", ts: '2026-03-15 04:16:00' },
  { room: 'analytics_insights', sender: 'maya.analyst', content: 'The "Instant Reply" feature. Users are staying in-app 4 minutes longer on average.\n\n📎 q1_retention_deepdive.csv', ts: '2026-03-15 04:17:00' },
  { room: 'analytics_insights', sender: 'leo.success',  content: "Great. I'll present these numbers to the stakeholders this afternoon.", ts: '2026-03-15 04:18:00' },

  // ─── Security & Compliance (room 14) ─────────────────────────
  { room: 'security_compliance', sender: 'compliance.officer', content: 'We need to run a routine audit on the `campaign-strategy` logs.', ts: '2026-03-15 04:20:00' },
  { room: 'security_compliance', sender: 'admin.ops',          content: 'Initiating log export. Only users with `Level-4` clearance can view this file.', ts: '2026-03-15 04:21:00' },
  { room: 'security_compliance', sender: 'system',             content: '/audit_log --target="campaign-strategy" --range="last-24h"\n\n> ✅ Success: Secure link generated. [Access Restricted]', ts: '2026-03-15 04:21:30', is_command: 1 },
  { room: 'security_compliance', sender: 'compliance.officer', content: "Found a message containing a raw API key. Deleting from history now.", ts: '2026-03-15 04:22:00' },
  { room: 'security_compliance', sender: 'system',             content: '/wipe_message --id="msg_9821_ak"\n\n> 🔴 Message Redacted by System Authority.', ts: '2026-03-15 04:22:30', is_command: 1 },

  // ─── Operations (room 15) ─────────────────────────────────────
  { room: 'operations', sender: 'ops.lead',   content: "We have 3 new interns joining the engineering team today.", ts: '2026-03-15 04:25:00' },
  { room: 'operations', sender: 'admin.ops',  content: "I'll provision their accounts. What are their assigned roles?", ts: '2026-03-15 04:26:00' },
  { room: 'operations', sender: 'ops.lead',   content: 'Two `Junior Developers` and one `QA Analyst`.', ts: '2026-03-15 04:27:00' },
  { room: 'operations', sender: 'admin.ops',  content: "Done. They've been auto-added to the General and Product channels.", ts: '2026-03-15 04:27:30' },
  { room: 'operations', sender: 'system',     content: '/invite_batch @intern_1 @intern_2 @intern_3 --role="junior"\n\n> ✅ Accounts Provisioned. Welcome Emails Sent.', ts: '2026-03-15 04:28:00', is_command: 1 },

  // ─── Campaign Strategy (room 11) ─────────────────────────────
  { room: 'campaign_strategy', sender: 'arjun.strategist', content: "We're pivoting the launch date. The client wants to move it up by two days.", ts: '2026-03-15 04:30:00' },
  { room: 'campaign_strategy', sender: 'leo.success',      content: "That's tight. Can we handle the ad spend adjustment that fast?", ts: '2026-03-15 04:31:00' },
  { room: 'campaign_strategy', sender: 'arjun.strategist', content: "Maya, can you run a quick simulation on the budget burn if we front-load it?", ts: '2026-03-15 04:31:30' },
  { room: 'campaign_strategy', sender: 'maya.analyst',     content: "On it.", ts: '2026-03-15 04:32:00' },
  { room: 'campaign_strategy', sender: 'system',           content: '/simulate_burn --budget=50k --duration=48h\n\n> ⚠️ Projection: High risk of saturation. Recommend 20% increase in bidding cap.', ts: '2026-03-15 04:32:30', is_command: 1 },
  { room: 'campaign_strategy', sender: 'arjun.strategist', content: "Let's go with the recommendation. Update the strategy doc.\n\n📎 revised_launch_plan.docx", ts: '2026-03-15 04:33:00' },
];

const FAKE_PASSWORD_HASH = '$2a$10$GstdMPV9vsgasnn0SGhuiOO9oUJlsVKuCg6ATsZcLE5ol.ol9lTua'; // "password"

(async () => {
  const db = await open({ filename: './database.db', driver: sqlite3.Database });

  // 1. Upsert persona users
  const userMap = {}; // username -> user_id

  for (const u of PERSONA_USERS) {
    const existing = await db.get('SELECT user_id FROM users WHERE username = ?', u.username);
    if (existing) {
      userMap[u.username] = existing.user_id;
    } else {
      const result = await db.run(
        `INSERT INTO users (username, full_name, email, password_hash, role_id, department, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        u.username, u.full_name, u.email, FAKE_PASSWORD_HASH, u.role_id, u.department
      );
      userMap[u.username] = result.lastID;
      console.log(`Created user: ${u.username} (id=${result.lastID})`);
    }
  }

  // Use user_id 1 (Rajesh Sharma) for "system" messages to keep a valid FK
  const systemUserId = 1;

  // 2. Insert messages
  let inserted = 0;
  for (const msg of MESSAGES) {
    const roomId = ROOM_IDS[msg.room];
    const senderId = msg.sender === 'system' ? systemUserId : userMap[msg.sender];
    if (!senderId) {
      console.warn(`No user_id found for sender "${msg.sender}", skipping.`);
      continue;
    }
    const isCmd = msg.is_command || 0;
    const msgType = isCmd ? 'command' : 'text';
    await db.run(
      `INSERT INTO messages (room_id, sender_id, message_content, message_type, is_command, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      roomId, senderId, msg.content, msgType, isCmd, msg.ts
    );
    inserted++;
  }

  console.log(`✅ Seeded ${inserted} messages across 6 channels.`);
  process.exit(0);
})().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
