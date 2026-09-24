-- Master data seed: role Admin, RBAC actions, sample admin user + links.
-- Idempotent: safe to re-run (conflicts skipped).
-- Sample login: admin@vortexgin.com / admin123
-- Master role
INSERT INTO
  roles (name, slug, status)
VALUES
  ('Admin', 'admin', 'active') ON CONFLICT (slug) DO NOTHING;

-- Master actions (code, description)
INSERT INTO
  actions (action, description, status)
VALUES
  (
    'base:menu:settings:settings',
    'Access for admin settings',
    'active'
  ),
  (
    'base:menu:settings:action',
    'Access for admin action',
    'active'
  ),
  (
    'base:action:list:list',
    'Access for list action',
    'active'
  ),
  (
    'base:action:create:create',
    'Access for create action',
    'active'
  ),
  (
    'base:action:view:detail',
    'Access for view detail action',
    'active'
  ),
  (
    'base:action:view:update',
    'Access for update detail action',
    'active'
  ),
  (
    'base:action:view:delete',
    'access for delete action',
    'active'
  ),
  (
    'base:menu:settings:user',
    'Access for admin user',
    'active'
  ),
  (
    'base:user:list:list',
    'Access for list user',
    'active'
  ),
  (
    'base:user:create:create',
    'Access for create user',
    'active'
  ),
  (
    'base:user:view:detail',
    'Access for view detail user',
    'active'
  ),
  (
    'base:user:view:update',
    'Access for update detail user',
    'active'
  ),
  (
    'base:user:view:update-role',
    'Access for update role user',
    'active'
  ),
  (
    'base:user:view:delete',
    'access for delete user',
    'active'
  ),
  (
    'base:menu:settings:menus',
    'Access for admin menu',
    'active'
  ),
  (
    'base:menus:list:list',
    'Access for list menu',
    'active'
  ),
  (
    'base:menus:create:create',
    'Access for create menu',
    'active'
  ),
  (
    'base:menus:view:detail',
    'Access for view detail menu',
    'active'
  ),
  (
    'base:menus:view:update',
    'Access for update detail menu',
    'active'
  ),
  (
    'base:menus:view:delete',
    'access for delete menu',
    'active'
  ),
  (
    'base:menu:settings:role',
    'Access for admin role',
    'active'
  ),
  (
    'base:role:list:list',
    'Access for list role',
    'active'
  ),
  (
    'base:role:create:create',
    'Access for create role',
    'active'
  ),
  (
    'base:role:view:detail',
    'Access for view detail role',
    'active'
  ),
  (
    'base:role:view:update',
    'Access for update detail role',
    'active'
  ),
  (
    'base:role:view:update-permission',
    'Access for update detail role',
    'active'
  ),
  (
    'base:role:view:delete',
    'access for delete role',
    'active'
  ),
  (
    'base:activity-log:list:list',
    'Access for list activity log',
    'active'
  ) ON CONFLICT (action) DO NOTHING;

-- Sample admin user (password: admin123, sha256). users table has no DB defaults, supply explicitly.
INSERT INTO
  users (
    uuid,
    name,
    email,
    phone_number,
    password,
    status,
    created_at,
    updated_at,
    deleted_at
  )
VALUES
  (
    gen_random_uuid (),
    'Admin',
    'admin@vortexgin.com',
    '+10000000001',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    'active',
    NOW (),
    NOW (),
    NULL
  ) ON CONFLICT (email) DO NOTHING;

-- Sample user -> role link (1 user = 1 role)
INSERT INTO
  user_roles (user_id, role_id)
SELECT
  u.uuid,
  r.uuid
FROM
  users u,
  roles r
WHERE
  u.email = 'admin@vortexgin.com'
  AND r.slug = 'admin' ON CONFLICT (user_id) DO NOTHING;

-- Admin gets every live action (soft-deleted excluded)
INSERT INTO
  permissions (role_id, action_id)
SELECT
  r.uuid,
  a.uuid
FROM
  roles r
  CROSS JOIN actions a
WHERE
  r.slug = 'admin'
  AND a.deleted_at IS NULL ON CONFLICT (role_id, action_id) DO NOTHING;

-- Menu display order
UPDATE menus SET weight = CASE menu
  WHEN 'Settings' THEN 0
  WHEN 'Action' THEN 1
  WHEN 'Role' THEN 2
  WHEN 'User' THEN 3
  WHEN 'Menu' THEN 4
  ELSE weight
END WHERE menu IN ('Settings', 'Action', 'Role', 'User', 'Menu');

-- Master menus: Settings tree (idempotent via NOT EXISTS guards)
INSERT INTO
  menus (
    icon,
    parent,
    menu,
    action_id,
    description,
    redirection,
    status
  )
SELECT
  '',
  NULL,
  'Settings',
  a.uuid,
  'Access to admin settings',
  '#',
  'active'
FROM
  actions a
WHERE
  a.action = 'base:menu:settings:settings'
  AND NOT EXISTS (
    SELECT
      1
    FROM
      menus m
    WHERE
      m.menu = 'Settings'
      AND m.parent IS NULL
  );

INSERT INTO
  menus (
    icon,
    parent,
    menu,
    action_id,
    description,
    redirection,
    status
  )
SELECT
  '',
  p.uuid,
  'Action',
  a.uuid,
  'Access to action settings',
  '/base/views/actions',
  'active'
FROM
  menus p,
  actions a
WHERE
  p.menu = 'Settings'
  AND p.parent IS NULL
  AND a.action = 'base:menu:settings:action'
  AND NOT EXISTS (
    SELECT
      1
    FROM
      menus m
    WHERE
      m.menu = 'Action'
  );

INSERT INTO
  menus (
    icon,
    parent,
    menu,
    action_id,
    description,
    redirection,
    status
  )
SELECT
  '',
  p.uuid,
  'Menu',
  a.uuid,
  'Access to menu settings',
  '/base/views/menus',
  'active'
FROM
  menus p,
  actions a
WHERE
  p.menu = 'Settings'
  AND p.parent IS NULL
  AND a.action = 'base:menu:settings:menus'
  AND NOT EXISTS (
    SELECT
      1
    FROM
      menus m
    WHERE
      m.menu = 'Menu'
  );

INSERT INTO
  menus (
    icon,
    parent,
    menu,
    action_id,
    description,
    redirection,
    status
  )
SELECT
  '',
  p.uuid,
  'Role',
  a.uuid,
  'Access to role settings',
  '/base/views/roles',
  'active'
FROM
  menus p,
  actions a
WHERE
  p.menu = 'Settings'
  AND p.parent IS NULL
  AND a.action = 'base:menu:settings:role'
  AND NOT EXISTS (
    SELECT
      1
    FROM
      menus m
    WHERE
      m.menu = 'Role'
  );

INSERT INTO
  menus (
    icon,
    parent,
    menu,
    action_id,
    description,
    redirection,
    status
  )
SELECT
  '',
  p.uuid,
  'User',
  a.uuid,
  'Access to user settings',
  '/base/views/users',
  'active'
FROM
  menus p,
  actions a
WHERE
  p.menu = 'Settings'
  AND p.parent IS NULL
  AND a.action = 'base:menu:settings:user'
  AND NOT EXISTS (
    SELECT
      1
    FROM
      menus m
    WHERE
      m.menu = 'User'
  );