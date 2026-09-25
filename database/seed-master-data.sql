--
-- PostgreSQL database dump
--
-- Dumped from database version 14.13 (Homebrew)
-- Dumped by pg_dump version 14.13 (Homebrew)
SET
    statement_timeout = 0;

SET
    lock_timeout = 0;

SET
    idle_in_transaction_session_timeout = 0;

SET
    client_encoding = 'UTF8';

SET
    standard_conforming_strings = on;

SELECT
    pg_catalog.set_config ('search_path', '', false);

SET
    check_function_bodies = false;

SET
    xmloption = content;

SET
    client_min_messages = warning;

SET
    row_security = off;

--
-- Data for Name: actions; Type: TABLE DATA; Schema: public; Owner: moladin
--
INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '1daaf37a-a26b-40a9-bebd-543b21606b23',
        'base:user:list:list',
        'Access for list user',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'c366e903-ae3e-4005-b03b-9a08412fabc3',
        'base:user:create:create',
        'Access for create user',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '7998fb67-93a3-483f-bf78-426a4af09518',
        'base:user:view:detail',
        'Access for view detail user',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'c667477f-9e20-422b-a6ee-cb0af33aa13e',
        'base:user:view:update',
        'Access for update detail user',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '871c1767-730a-4159-8a14-273b3c4f4fb2',
        'base:user:view:delete',
        'access for delete user',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'c75bc6c0-6805-4a2f-b756-84be92b2303a',
        'base:action:list:list',
        'Access for list action',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'f4f515ee-5885-4004-9726-546b4c4bed1c',
        'base:action:create:create',
        'Access for create action',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '5cb05bf3-b514-4899-9dcf-92f920af913e',
        'base:action:view:detail',
        'Access for view detail action',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '6be80d14-b64e-4922-b067-07e9dda27ad0',
        'base:action:view:update',
        'Access for update detail action',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '03f60930-f9d5-429f-8b44-fd4225d8465c',
        'base:action:view:delete',
        'access for delete action',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '824a78fc-4e69-4f71-a93a-d63705b77647',
        'base:role:list:list',
        'Access for list role',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '975597d1-a6c0-43e4-aed2-a985cb1a9302',
        'base:role:create:create',
        'Access for create role',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '8ec7b014-58e8-4d89-b453-3d102c69e5cc',
        'base:role:view:detail',
        'Access for view detail role',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '67d63ad6-7985-44ae-ac0e-c7b8c10c8450',
        'base:role:view:update',
        'Access for update detail role',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '575a6201-7820-48d2-8219-66b879f47c1c',
        'base:role:view:update-permission',
        'Access for update detail role',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '223a8a8f-2ffa-41eb-ae6e-8d8bf74f97fa',
        'base:role:view:delete',
        'access for delete role',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-23 11:42:37.284771+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'c4f34420-4448-48f4-99c1-f97338872816',
        'base:menu:settings:settings',
        'Access for admin settings',
        'active',
        '2026-09-23 13:46:29.590575+07',
        '2026-09-23 13:46:29.590575+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '983b5065-d03d-4b38-ab0e-170dda618fca',
        'base:menu:settings:action',
        'Access for admin action',
        'active',
        '2026-09-23 13:46:29.590575+07',
        '2026-09-23 13:46:29.590575+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'e20bff7e-eb0a-4b62-981a-d50d4671b934',
        'base:menu:settings:role',
        'Access for admin role',
        'active',
        '2026-09-23 13:46:29.590575+07',
        '2026-09-23 13:46:29.590575+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '416b337e-57d7-49d0-afb6-2a2c6c445239',
        'base:menu:settings:user',
        'Access for admin user',
        'active',
        '2026-09-23 13:46:29.590575+07',
        '2026-09-23 13:46:29.590575+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '69d62397-7ba2-4f61-84f7-9dc1ac5b25b0',
        'base:menu:settings:menus',
        'Access for admin menu',
        'active',
        '2026-09-23 13:52:11.125392+07',
        '2026-09-23 13:52:11.125392+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '3af10f76-23f1-4d80-884c-b4f4c3b842c1',
        'base:menus:list:list',
        'Access for list menu',
        'active',
        '2026-09-23 13:52:11.125392+07',
        '2026-09-23 13:52:11.125392+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '267ccd2b-f73d-40e2-a06b-0ac014ae3eff',
        'base:menus:create:create',
        'Access for create menu',
        'active',
        '2026-09-23 13:52:11.125392+07',
        '2026-09-23 13:52:11.125392+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'ba3a6d04-2a71-4191-a810-c3ca6c24a183',
        'base:menus:view:detail',
        'Access for view detail menu',
        'active',
        '2026-09-23 13:52:11.125392+07',
        '2026-09-23 13:52:11.125392+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'a767c2c4-61d4-4839-b8fd-51a888b034a6',
        'base:menus:view:update',
        'Access for update detail menu',
        'active',
        '2026-09-23 13:52:11.125392+07',
        '2026-09-23 13:52:11.125392+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '88ba01ce-e03f-44c3-a347-7b3313da9dc7',
        'base:menus:view:delete',
        'access for delete menu',
        'active',
        '2026-09-23 13:52:11.125392+07',
        '2026-09-23 13:52:11.125392+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '1b14e76d-16a0-4776-be1f-6c4ab3ae0ebb',
        'base:activity-log:list:list',
        'Access for list activity log',
        'active',
        '2026-09-24 08:30:57.751869+07',
        '2026-09-24 08:30:57.751869+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '4353c89c-3585-457d-81c2-0ef18e84b0c5',
        'base:user:view:update-role',
        'Access for update role user',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-24 08:33:41.628+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'e3a954fd-48e0-4193-91da-f9e132d61a2c',
        'base:user:view:update-organization',
        'Access for update organization user',
        'active',
        '2026-09-23 11:42:37.284771+07',
        '2026-09-24 08:33:41.628+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '5486735d-a6dd-4fdd-9334-d4da79a519c6',
        'sass:organization:list:list',
        'Access for list organization',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '37664c83-8b12-4641-b451-c44222cbe45a',
        'sass:organization:create:create',
        'Access for create organization',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '82a77b69-fd33-4262-a66b-e78028375424',
        'sass:organization:view:detail',
        'Access for view detail organization',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'e9558d36-663c-4a41-b81e-1c1416fd8307',
        'sass:organization:view:update',
        'Access for update detail organization',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '797a4c62-6e6b-4eaa-83bc-a42b515104b6',
        'sass:organization:view:delete',
        'Access for delete organization',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '708ced8f-1c50-4203-bb41-906754119d9c',
        'sass:organization-user:list:list',
        'Access for list organization user',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'fb6ca59f-5e3d-4634-be9f-392e6210683e',
        'sass:organization-user:create:create',
        'Access for create organization user',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '5961a385-ca97-49e7-a30a-eb01a0e17112',
        'sass:organization-user:view:detail',
        'Access for view detail organization user',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '558f5343-f720-4ad9-8e7e-d0896ad7adfb',
        'sass:organization-user:view:update',
        'Access for update detail organization user',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '4447002e-c40b-4096-8742-188cf4fd60ee',
        'sass:organization-user:view:delete',
        'Access for delete organization user',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'e9d2f4d8-433b-480c-84d6-49acb28229bc',
        'base:menu:sass:sass',
        'Access for sass module',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_actions (
        uuid,
        action,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '1d63d439-6888-4f4c-b330-1a3a7643e5bc',
        'base:menu:sass:organization',
        'Access for sass organization module',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: moladin
--
INSERT INTO
    public.base_menus (
        uuid,
        icon,
        parent,
        menu,
        action_id,
        description,
        redirection,
        status,
        created_at,
        updated_at,
        deleted_at,
        weight
    )
VALUES
    (
        'fc89a49c-b4a6-4acc-951a-0860be8fda70',
        '',
        NULL,
        'Settings',
        'c4f34420-4448-48f4-99c1-f97338872816',
        'Access to admin settings',
        '#',
        'active',
        '2026-09-23 13:46:29.728008+07',
        '2026-09-23 13:46:29.728008+07',
        NULL,
        0
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_menus (
        uuid,
        icon,
        parent,
        menu,
        action_id,
        description,
        redirection,
        status,
        created_at,
        updated_at,
        deleted_at,
        weight
    )
VALUES
    (
        'aa7267f9-0605-449b-abf5-96fec71617e3',
        '-',
        'fc89a49c-b4a6-4acc-951a-0860be8fda70',
        'Menu',
        '69d62397-7ba2-4f61-84f7-9dc1ac5b25b0',
        'Access to menu settings',
        '/base/views/menus',
        'active',
        '2026-09-23 13:52:11.136161+07',
        '2026-09-23 21:50:38.672+07',
        NULL,
        2
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_menus (
        uuid,
        icon,
        parent,
        menu,
        action_id,
        description,
        redirection,
        status,
        created_at,
        updated_at,
        deleted_at,
        weight
    )
VALUES
    (
        'e3782d7e-6537-4dde-9534-08695c4c3cbd',
        '-',
        'fc89a49c-b4a6-4acc-951a-0860be8fda70',
        'Role',
        'e20bff7e-eb0a-4b62-981a-d50d4671b934',
        'Access to role settings',
        '/base/views/roles',
        'active',
        '2026-09-23 13:46:29.742243+07',
        '2026-09-23 21:51:07.645+07',
        NULL,
        3
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_menus (
        uuid,
        icon,
        parent,
        menu,
        action_id,
        description,
        redirection,
        status,
        created_at,
        updated_at,
        deleted_at,
        weight
    )
VALUES
    (
        '9a3e33a1-6f86-4415-aab5-cd550a5414d8',
        '-',
        'fc89a49c-b4a6-4acc-951a-0860be8fda70',
        'User',
        '416b337e-57d7-49d0-afb6-2a2c6c445239',
        'Access to user settings',
        '/base/views/users',
        'active',
        '2026-09-23 13:46:29.74309+07',
        '2026-09-23 21:51:16.414+07',
        NULL,
        4
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_menus (
        uuid,
        icon,
        parent,
        menu,
        action_id,
        description,
        redirection,
        status,
        created_at,
        updated_at,
        deleted_at,
        weight
    )
VALUES
    (
        '7c6b9b87-252c-4f18-8950-346c500a2ec9',
        '-',
        'fc89a49c-b4a6-4acc-951a-0860be8fda70',
        'Action',
        '983b5065-d03d-4b38-ab0e-170dda618fca',
        'Access to action settings',
        '/base/views/actions',
        'active',
        '2026-09-23 13:46:29.740618+07',
        '2026-09-23 21:51:26.394+07',
        NULL,
        1
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_menus (
        uuid,
        icon,
        parent,
        menu,
        action_id,
        description,
        redirection,
        status,
        created_at,
        updated_at,
        deleted_at,
        weight
    )
VALUES
    (
        '5f828750-d056-4410-900e-44b4b0e56e22',
        '',
        NULL,
        'SASS',
        'e9d2f4d8-433b-480c-84d6-49acb28229bc',
        'Access to SASS settings',
        '#',
        'active',
        '2026-09-23 13:46:29.728008+07',
        '2026-09-23 13:46:29.728008+07',
        NULL,
        0
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_menus (
        uuid,
        icon,
        parent,
        menu,
        action_id,
        description,
        redirection,
        status,
        created_at,
        updated_at,
        deleted_at,
        weight
    )
VALUES
    (
        '1d63d439-6888-4f4c-b330-1a3a7643e5bc',
        '-',
        '5f828750-d056-4410-900e-44b4b0e56e22',
        'Organization',
        '1d63d439-6888-4f4c-b330-1a3a7643e5bc',
        'Access to organization settings',
        '/sass/views/organizations',
        'active',
        '2026-09-23 13:46:29.728008+07',
        '2026-09-23 13:46:29.728008+07',
        NULL,
        0
    )
ON CONFLICT DO NOTHING;

--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: moladin
--
INSERT INTO
    public.base_roles (
        uuid,
        name,
        slug,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '44beb171-a0e7-4a90-a4b2-d30f5581bda4',
        'Admin',
        'admin',
        'active',
        '2026-09-23 11:42:37.205955+07',
        '2026-09-23 11:42:37.205955+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_roles (
        uuid,
        name,
        slug,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '6542b60b-e678-4bde-be5e-9ddafcc5fe82',
        'Admin Organization',
        'admin-organization',
        'active',
        '2026-09-24 08:18:41.524+07',
        '2026-09-24 08:18:41.524+07',
        NULL
    )
ON CONFLICT DO NOTHING;

--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: moladin
--
INSERT INTO
    public.base_permissions (uuid, role_id, action_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    r.uuid,
    a.uuid,
    NOW(),
    NOW()
FROM
    public.base_roles r
    CROSS JOIN public.base_actions a
WHERE
    r.slug = 'admin'
    AND a.action IN (
        'base:user:list:list',
        'base:user:create:create',
        'base:user:view:detail',
        'base:user:view:update',
        'base:user:view:delete',
        'base:user:view:update-role',
        'base:user:view:update-organization',
        'base:action:list:list',
        'base:action:create:create',
        'base:action:view:detail',
        'base:action:view:update',
        'base:action:view:delete',
        'base:role:list:list',
        'base:role:create:create',
        'base:role:view:detail',
        'base:role:view:update',
        'base:role:view:update-permission',
        'base:role:view:delete',
        'base:menu:settings:settings',
        'base:menu:settings:action',
        'base:menu:settings:role',
        'base:menu:settings:user',
        'base:menu:settings:menus',
        'base:menu:sass:sass',
        'base:menu:sass:organization',
        'base:menus:list:list',
        'base:menus:create:create',
        'base:menus:view:detail',
        'base:menus:view:update',
        'base:menus:view:delete',
        'base:activity-log:list:list',
        'sass:organization:list:list',
        'sass:organization:create:create',
        'sass:organization:view:detail',
        'sass:organization:view:update',
        'sass:organization:view:delete'
    )
ON CONFLICT DO NOTHING;

--
-- Grants for role: admin-organization (sass organization codes)
--
INSERT INTO
    public.base_permissions (uuid, role_id, action_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    r.uuid,
    a.uuid,
    NOW(),
    NOW()
FROM
    public.base_roles r
    CROSS JOIN public.base_actions a
WHERE
    r.slug = 'admin-organization'
    AND a.action IN (
        'base:menu:settings:settings',
        'base:menu:settings:user',
        'base:role:list:list',
        'base:user:list:list',
        'base:user:create:create',
        'base:user:view:detail',
        'base:user:view:update',
        'base:user:view:delete',
        'base:user:view:update-role'
    )
ON CONFLICT DO NOTHING;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: moladin
--
INSERT INTO
    public.base_users (
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
        '11240574-f818-48b3-adb2-291df37d43d4',
        'Admin',
        'admin@vortexgin.com',
        '+10000000001',
        '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
        'active',
        '2026-09-23 11:43:02.324537+07',
        '2026-09-23 20:19:14.829459+07',
        NULL
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_users (
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
        '01694e54-498d-486f-a078-e860c5b3434e',
        'Admin Organization',
        'admin.organization@vortexgin.com',
        '+10000000002',
        '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
        'active',
        '2026-09-23 11:43:02.324537+07',
        '2026-09-23 20:19:14.829459+07',
        NULL
    )
ON CONFLICT DO NOTHING;

--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: moladin
--
INSERT INTO
    public.base_user_roles (uuid, user_id, role_id, created_at, updated_at)
VALUES
    (
        'dc0786bf-609e-4fc2-841f-3a6bf49680a6',
        '11240574-f818-48b3-adb2-291df37d43d4',
        '44beb171-a0e7-4a90-a4b2-d30f5581bda4',
        '2026-09-23 11:43:02.326272+07',
        '2026-09-23 11:43:02.326272+07'
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_user_roles (uuid, user_id, role_id, created_at, updated_at)
VALUES
    (
        'e2e19699-0c6e-46f9-80b8-805000b3434e',
        '01694e54-498d-486f-a078-e860c5b3434e',
        '6542b60b-e678-4bde-be5e-9ddafcc5fe82',
        '2026-09-23 11:43:02.326272+07',
        '2026-09-23 11:43:02.326272+07'
    )
ON CONFLICT DO NOTHING;

--
-- Data for Name: sass_organization; Type: TABLE DATA; Schema: public; Owner: moladin
--
INSERT INTO
    public.sass_organization (
        uuid,
        name,
        address,
        email,
        phone,
        npwp,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '46896864-fecd-4a68-a19c-a715530100a9',
        'VortexGin Sample',
        'Jl. Merdeka No. 1, Jakarta',
        'org@vortexgin.com',
        '+10000000002',
        NULL,
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

--
-- Data for Name: sass_organization_user; Type: TABLE DATA; Schema: public; Owner: moladin
--
INSERT INTO
    public.sass_organization_user (
        uuid,
        organization_id,
        user_id,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '029a0fb4-e00c-4a0f-8299-cf84f63f71dc',
        '46896864-fecd-4a68-a19c-a715530100a9',
        '01694e54-498d-486f-a078-e860c5b3434e',
        'active',
        NOW(),
        NOW(),
        NULL
    )
ON CONFLICT DO NOTHING;

--
-- PostgreSQL database dump complete
--