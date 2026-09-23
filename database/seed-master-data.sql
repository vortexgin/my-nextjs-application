-- Master data seed: role Admin, RBAC actions, sample admin user + links.
-- Idempotent: safe to re-run (conflicts skipped).
-- Sample login: admin@vortexgin.com / admin123

-- Master role
INSERT INTO roles (name, slug, status)
VALUES ('Admin', 'admin', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Master actions (code, description)
INSERT INTO actions (action, description, status) VALUES
  ('base:user:list:list', 'Access for list user', 'active'),
  ('base:user:create:create', 'Access for create user', 'active'),
  ('base:user:view:detail', 'Access for view detail user', 'active'),
  ('base:user:view:update', 'Access for update detail user', 'active'),
  ('base:user:view:update-role', 'Access for update role user', 'active'),
  ('base:user:view:delete', 'access for delete user', 'active'),
  ('base:action:list:list', 'Access for list action', 'active'),
  ('base:action:create:create', 'Access for create action', 'active'),
  ('base:action:view:detail', 'Access for view detail action', 'active'),
  ('base:action:view:update', 'Access for update detail action', 'active'),
  ('base:action:view:delete', 'access for delete action', 'active'),
  ('base:role:list:list', 'Access for list role', 'active'),
  ('base:role:create:create', 'Access for create role', 'active'),
  ('base:role:view:detail', 'Access for view detail role', 'active'),
  ('base:role:view:update', 'Access for update detail role', 'active'),
  ('base:role:view:update-permission', 'Access for update detail role', 'active'),
  ('base:role:view:delete', 'access for delete role', 'active')
ON CONFLICT (action) DO NOTHING;

-- Sample admin user (password: admin123, sha256). users table has no DB defaults, supply explicitly.
INSERT INTO users (uuid, name, email, phone_number, password, status, created_at, updated_at, deleted_at)
VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@vortexgin.com',
  '+10000000001',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'active',
  NOW(),
  NOW(),
  NULL
)
ON CONFLICT (email) DO NOTHING;

-- Sample user -> role link (1 user = 1 role)
INSERT INTO user_roles (user_id, role_id)
SELECT u.uuid, r.uuid FROM users u, roles r
WHERE u.email = 'admin@vortexgin.com' AND r.slug = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Admin gets every action
INSERT INTO permissions (role_id, action_id)
SELECT r.uuid, a.uuid FROM roles r CROSS JOIN actions a
WHERE r.slug = 'admin'
ON CONFLICT (role_id, action_id) DO NOTHING;
