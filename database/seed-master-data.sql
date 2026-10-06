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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        '866d7069-8c66-40e6-8679-066d25cc817e',
        'base:menu:sass:package',
        'Access for sass package module',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        '842f4488-e999-45ce-83f5-428417bf3850',
        'sass:package:list:list',
        'Access for list package',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        'c448ac6f-1224-402f-8f8a-418e533f5015',
        'sass:package:create:create',
        'Access for create package',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        '58476032-4676-4c70-91b3-257c217cce01',
        'sass:package:view:detail',
        'Access for view detail package',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        'cbc65e68-25b8-4a45-aad3-0069b47865a2',
        'sass:package:view:update',
        'Access for update detail package',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        'b9953eb4-de1e-464b-a4da-8a92322354b4',
        'sass:package:view:delete',
        'Access for delete package',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        '3149bb22-4160-49ad-b4c8-112fdddf24ca',
        'base:menu:sass:invoice',
        'Access for sass invoice module',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        'd32b1286-972f-44e2-9f8b-e01912adb2a2',
        'sass:invoice:list:list',
        'Access for list invoice',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        'ceaec207-f3f2-486b-886a-f71ebfab6e80',
        'sass:invoice:view:detail',
        'Access for view detail invoice',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        '8d4fe6a8-b514-4920-b4a9-7a2e3a6b3988',
        'base:menu:sales:sales',
        'Access for sales module',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        'f3791d6b-896b-402a-831b-29d73eccb533',
        'base:menu:sales:lead',
        'Access for sales lead module',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        '6528d791-9dcb-4186-92f2-eeb855ddfc47',
        'sales:lead:list:list',
        'Access for list lead',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        'd9eede66-bf3c-448d-8e80-f906123f3402',
        'sales:lead:create:create',
        'Access for create lead',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        'b1ee7086-c45c-4638-b522-488c5ec8ff68',
        'sales:lead:view:detail',
        'Access for view detail lead',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        '94c4f433-1e2b-4598-bca1-a0431d44c1be',
        'sales:lead:view:update',
        'Access for update detail lead',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        '29aa354e-4343-4e52-8c44-22b6214ad08a',
        'sales:lead:view:delete',
        'Access for delete lead',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        'bf33f334-9b8b-4b04-bafb-c11f43bd2195',
        'base:menu:sales:lead-status',
        'Access for sales lead status module',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        'd0a51628-eba6-4d65-ad9a-5f24cf911f2e',
        'base:menu:sales:lead-metadata-field',
        'Access for sales lead metadata field module',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        '78e370ab-e0c3-4c92-bdb4-dcc9582bbf56',
        'base:tools:upload:upload',
        'Access for tools file upload',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

--
-- Product module actions (entity CRUD + menu gates)
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
    ('fc5ad967-fcc8-422b-8dc8-c2c901648596', 'base:menu:product:product', 'Access for product module', 'active', NOW (), NOW (), NULL),
    ('a267aa4e-70cd-46cf-af84-721ac2c6853b', 'base:menu:product:products', 'Access for product products module', 'active', NOW (), NOW (), NULL),
    ('84e74b94-6090-454d-87a9-3f4d9da5921e', 'base:menu:product:variants', 'Access for product variants module', 'active', NOW (), NOW (), NULL),
    ('2c09364b-7104-44fb-a928-6db55011e8d8', 'base:menu:product:categories', 'Access for product categories module', 'active', NOW (), NOW (), NULL),
    ('8d76e748-0466-44ba-93b2-a67813259e4a', 'base:menu:product:units', 'Access for product units module', 'active', NOW (), NOW (), NULL),
    ('a68c6060-1d9c-4697-b63f-d450e0ca2e14', 'product:product:list:list', 'Access for list product', 'active', NOW (), NOW (), NULL),
    ('63ab9dd2-c52c-4ade-a505-058ec362fa78', 'product:product:create:create', 'Access for create product', 'active', NOW (), NOW (), NULL),
    ('ace04891-6209-4559-b908-189f5d48f4c2', 'product:product:view:detail', 'Access for view detail product', 'active', NOW (), NOW (), NULL),
    ('fbe4c570-cba5-4002-93d8-d48052ddd224', 'product:product:view:update', 'Access for update detail product', 'active', NOW (), NOW (), NULL),
    ('437dbb19-bc0f-4da6-8b86-dfaea625cb26', 'product:product:view:delete', 'Access for delete product', 'active', NOW (), NOW (), NULL),
    ('63962cd8-7cae-4591-8786-fc4d2e3c652b', 'product:variant:list:list', 'Access for list product variant', 'active', NOW (), NOW (), NULL),
    ('6525a33a-2f3e-4713-910e-ea13665619a2', 'product:variant:create:create', 'Access for create product variant', 'active', NOW (), NOW (), NULL),
    ('a741e331-eb7c-4b6d-b6fb-ccf48e7545a2', 'product:variant:view:detail', 'Access for view detail product variant', 'active', NOW (), NOW (), NULL),
    ('f5261301-ab73-4f7b-a861-9077beb558cf', 'product:variant:view:update', 'Access for update detail product variant', 'active', NOW (), NOW (), NULL),
    ('36721e76-e771-4afd-a650-918fd1672491', 'product:variant:view:delete', 'Access for delete product variant', 'active', NOW (), NOW (), NULL),
    ('94a6c47d-c40f-4dc5-8a95-b1c8cde5a15b', 'product:category:list:list', 'Access for list product category', 'active', NOW (), NOW (), NULL),
    ('e11357df-3eaf-4345-bde9-2ea691fb1202', 'product:category:create:create', 'Access for create product category', 'active', NOW (), NOW (), NULL),
    ('ead93d19-0e10-4753-b229-b8bd2c15789d', 'product:category:view:detail', 'Access for view detail product category', 'active', NOW (), NOW (), NULL),
    ('654da32f-24e1-4816-805e-ed8f017e54c9', 'product:category:view:update', 'Access for update detail product category', 'active', NOW (), NOW (), NULL),
    ('b4888b81-e1cd-4e6b-9844-0f60469ddedf', 'product:category:view:delete', 'Access for delete product category', 'active', NOW (), NOW (), NULL),
    ('a0b37e26-713d-421c-950d-5ceec1713f3c', 'product:unit:list:list', 'Access for list product unit', 'active', NOW (), NOW (), NULL),
    ('6419057f-faa1-4c72-ba23-a1808f7d3ffb', 'product:unit:create:create', 'Access for create product unit', 'active', NOW (), NOW (), NULL),
    ('d793e8f0-58db-4694-a217-3208d0ea3d47', 'product:unit:view:detail', 'Access for view detail product unit', 'active', NOW (), NOW (), NULL),
    ('8e1972b4-cd38-4a80-bf2f-c228b7677460', 'product:unit:view:update', 'Access for update detail product unit', 'active', NOW (), NOW (), NULL),
    ('814c74b5-3743-49f3-962d-e2d2481719ef', 'product:unit:view:delete', 'Access for delete product unit', 'active', NOW (), NOW (), NULL),
    ('dba0d4e2-77b9-421f-813d-e595442e7006', 'product:metadata:list:list', 'Access for list product metadata', 'active', NOW (), NOW (), NULL),
    ('71cfe599-3248-4e7c-965e-2131fc6c868e', 'product:metadata:create:create', 'Access for create product metadata', 'active', NOW (), NOW (), NULL),
    ('02a92741-12c7-49d7-a267-f43cd9333a2b', 'product:metadata:view:detail', 'Access for view detail product metadata', 'active', NOW (), NOW (), NULL),
    ('1d053659-9eb4-4d0e-a132-8ab75d7c8adc', 'product:metadata:view:update', 'Access for update detail product metadata', 'active', NOW (), NOW (), NULL),
    ('aad8e495-2f4c-4a56-a8f7-39ebc65cae0a', 'product:metadata:view:delete', 'Access for delete product metadata', 'active', NOW (), NOW (), NULL),
    ('6a1acb86-ccee-4a81-9a74-a880aa57b36b', 'product:metadata-field:list:list', 'Access for list product metadata field', 'active', NOW (), NOW (), NULL),
    ('039a0883-15a1-4fb2-bad3-3b62981df284', 'product:metadata-field:create:create', 'Access for create product metadata field', 'active', NOW (), NOW (), NULL),
    ('85702d43-8391-4b16-8650-1ed682155fb8', 'product:metadata-field:view:detail', 'Access for view detail product metadata field', 'active', NOW (), NOW (), NULL),
    ('ed8dc012-dd38-419f-b4eb-367e4b059fc8', 'product:metadata-field:view:update', 'Access for update detail product metadata field', 'active', NOW (), NOW (), NULL),
    ('dcfbb12e-999d-415f-9cc6-fbbd65517ed0', 'product:metadata-field:view:delete', 'Access for delete product metadata field', 'active', NOW (), NOW (), NULL)
    ON CONFLICT DO NOTHING;

--
-- Product module menus
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
        '8593ca53-80cd-418e-a615-87ba04e56ab7',
        '',
        NULL,
        'Product',
        'fc5ad967-fcc8-422b-8dc8-c2c901648596',
        'Access to product settings',
        '#',
        'active',
        NOW (),
        NOW (),
        NULL,
        0
    ),
    (
        'd03a54cb-be59-485f-8189-cc2fcc492e0b',
        '-',
        '8593ca53-80cd-418e-a615-87ba04e56ab7',
        'Products',
        'a267aa4e-70cd-46cf-af84-721ac2c6853b',
        'Access to products settings',
        '/product/views/products',
        'active',
        NOW (),
        NOW (),
        NULL,
        0
    ),
    (
        '39838bc4-a73a-406f-a6fa-ea4fbd3e648e',
        '-',
        '8593ca53-80cd-418e-a615-87ba04e56ab7',
        'Variants',
        '84e74b94-6090-454d-87a9-3f4d9da5921e',
        'Access to variants settings',
        '/product/views/product-variants',
        'active',
        NOW (),
        NOW (),
        NULL,
        1
    ),
    (
        'd340758d-2d56-47a6-a355-a5ef386ad5b4',
        '-',
        '8593ca53-80cd-418e-a615-87ba04e56ab7',
        'Categories',
        '2c09364b-7104-44fb-a928-6db55011e8d8',
        'Access to categories settings',
        '/product/views/product-categories',
        'active',
        NOW (),
        NOW (),
        NULL,
        2
    ),
    (
        '642b5f83-751b-450b-b514-567863b75eb4',
        '-',
        '8593ca53-80cd-418e-a615-87ba04e56ab7',
        'Units',
        '8d76e748-0466-44ba-93b2-a67813259e4a',
        'Access to units settings',
        '/product/views/product-units',
        'active',
        NOW (),
        NOW (),
        NULL,
        3
    ) ON CONFLICT DO NOTHING;

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
        '335117e7-4c7e-4fea-ad4c-9a86ad16e50a',
        'sales:lead-status:list:list',
        'Access for list lead status',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'e66836ab-3115-416e-a687-05fc36b3c930',
        'sales:lead-status:create:create',
        'Access for create lead status',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '1495dd74-c8c8-4972-9aff-945f72416d72',
        'sales:lead-status:view:detail',
        'Access for view detail lead status',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'f5032dd0-fc65-47b8-a23f-b9ef1ec766a7',
        'sales:lead-status:view:update',
        'Access for update detail lead status',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'b50a618c-425d-4664-9123-3a40238d9ef2',
        'sales:lead-status:view:delete',
        'Access for delete lead status',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '35ea5274-cc0f-4e83-bcbc-a07479bdf61f',
        'sales:lead-metadata-field:list:list',
        'Access for list lead metadata field',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '32e15a24-3833-40f5-bfdd-a1aae48efe07',
        'sales:lead-metadata-field:create:create',
        'Access for create lead metadata field',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'a17136ec-5cfe-4142-ba96-d0453531ebe9',
        'sales:lead-metadata-field:view:detail',
        'Access for view detail lead metadata field',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '46c2a5f7-1d9f-4534-a0d0-fcafa0fc9528',
        'sales:lead-metadata-field:view:update',
        'Access for update detail lead metadata field',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'e078c91d-744e-48f9-8ab3-1bce3b17d139',
        'sales:lead-metadata-field:view:delete',
        'Access for delete lead metadata field',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '5b66d18b-46a7-424d-8abb-f2d6151a8039',
        'sales:lead-metadata:list:list',
        'Access for list lead metadata',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '69fe51c9-cb2e-4baa-bdd4-642791457b05',
        'sales:lead-metadata:create:create',
        'Access for create lead metadata',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'f26dc56e-6ab2-42ac-9103-a75001686d1e',
        'sales:lead-metadata:view:detail',
        'Access for view detail lead metadata',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '5d04371e-5c92-48a5-92b1-f2a541077fbe',
        'sales:lead-metadata:view:update',
        'Access for update detail lead metadata',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '342b837b-199d-44c6-a3e6-3bf19ec30ccf',
        'sales:lead-metadata:view:delete',
        'Access for delete lead metadata',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'a79657d7-7c8f-438a-9705-c91ba07cefd1',
        'sales:lead-activity:list:list',
        'Access for list lead activity',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'f4c91d3c-0d86-4bc5-bbb9-54c756c22973',
        'sales:lead-activity:create:create',
        'Access for create lead activity',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'cd65f93c-ea59-409f-863b-7aa4dfd020d2',
        'sales:lead-activity:view:detail',
        'Access for view detail lead activity',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '5eb402f2-9acb-4d19-9759-7241e1bf2f81',
        'sales:lead-activity:view:update',
        'Access for update detail lead activity',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'd1b8fc73-50fb-4614-9b0f-e4426584999b',
        'sales:lead-activity:view:delete',
        'Access for delete lead activity',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
        '33740e19-ef64-4c13-8707-0052e866bd23',
        '',
        NULL,
        'Sales',
        '8d4fe6a8-b514-4920-b4a9-7a2e3a6b3988',
        'Access to sales settings',
        '#',
        'active',
        NOW (),
        NOW (),
        NULL,
        0
    ) ON CONFLICT DO NOTHING;

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
        '3db9de59-92b2-49b1-8e43-4fa127a281ae',
        '-',
        '33740e19-ef64-4c13-8707-0052e866bd23',
        'Lead',
        'f3791d6b-896b-402a-831b-29d73eccb533',
        'Access to lead settings',
        '/sales/views/leads',
        'active',
        NOW (),
        NOW (),
        NULL,
        0
    ) ON CONFLICT DO NOTHING;

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
        '03ed457a-eb34-418a-9a32-67a0770127fe',
        '-',
        '33740e19-ef64-4c13-8707-0052e866bd23',
        'Lead Status',
        'bf33f334-9b8b-4b04-bafb-c11f43bd2195',
        'Access to lead status settings',
        '/sales/views/lead-statuses',
        'active',
        NOW (),
        NOW (),
        NULL,
        1
    ) ON CONFLICT DO NOTHING;

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
        'e29e0207-4975-4ba9-ba3a-a2fcf616b8f7',
        '-',
        '33740e19-ef64-4c13-8707-0052e866bd23',
        'Metadata Field',
        'd0a51628-eba6-4d65-ad9a-5f24cf911f2e',
        'Access to metadata field settings',
        '/sales/views/lead-metadata-fields',
        'active',
        NOW (),
        NOW (),
        NULL,
        2
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: moladin
--
INSERT INTO
    public.base_permissions (uuid, role_id, action_id, created_at, updated_at)
SELECT
    gen_random_uuid (),
    r.uuid,
    a.uuid,
    NOW (),
    NOW ()
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
        'base:menu:sass:package',
        'base:menu:sass:invoice',
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
        'sass:organization:view:delete',
        'sass:package:list:list',
        'sass:package:create:create',
        'sass:package:view:detail',
        'sass:package:view:update',
        'sass:package:view:delete',
        'sass:invoice:list:list',
        'sass:invoice:view:detail',
        'base:menu:sales:sales',
        'base:menu:sales:lead',
        'sales:lead:list:list',
        'sales:lead:create:create',
        'sales:lead:view:detail',
        'sales:lead:view:update',
        'sales:lead:view:delete',
        'sales:lead-status:list:list',
        'sales:lead-status:create:create',
        'sales:lead-status:view:detail',
        'sales:lead-status:view:update',
        'sales:lead-status:view:delete',
        'sales:lead-metadata-field:list:list',
        'sales:lead-metadata-field:create:create',
        'sales:lead-metadata-field:view:detail',
        'sales:lead-metadata-field:view:update',
        'sales:lead-metadata-field:view:delete',
        'sales:lead-metadata:list:list',
        'sales:lead-metadata:create:create',
        'sales:lead-metadata:view:detail',
        'sales:lead-metadata:view:update',
        'sales:lead-metadata:view:delete',
        'sales:lead-activity:list:list',
        'sales:lead-activity:create:create',
        'sales:lead-activity:view:detail',
        'sales:lead-activity:view:update',
        'sales:lead-activity:view:delete',
        'base:menu:sales:lead-status',
        'base:menu:sales:lead-metadata-field',
        'base:tools:upload:upload',
        'base:menu:product:product',
        'base:menu:product:products',
        'base:menu:product:variants',
        'base:menu:product:categories',
        'base:menu:product:units',
        'product:product:list:list',
        'product:product:create:create',
        'product:product:view:detail',
        'product:product:view:update',
        'product:product:view:delete',
        'product:variant:list:list',
        'product:variant:create:create',
        'product:variant:view:detail',
        'product:variant:view:update',
        'product:variant:view:delete',
        'product:category:list:list',
        'product:category:create:create',
        'product:category:view:detail',
        'product:category:view:update',
        'product:category:view:delete',
        'product:unit:list:list',
        'product:unit:create:create',
        'product:unit:view:detail',
        'product:unit:view:update',
        'product:unit:view:delete',
        'product:metadata:list:list',
        'product:metadata:create:create',
        'product:metadata:view:detail',
        'product:metadata:view:update',
        'product:metadata:view:delete',
        'product:metadata-field:list:list',
        'product:metadata-field:create:create',
        'product:metadata-field:view:detail',
        'product:metadata-field:view:update',
        'product:metadata-field:view:delete',
        'base:menu:warehouse:warehouse',
        'base:menu:warehouse:warehouses',
        'base:menu:warehouse:stocks',
        'base:menu:warehouse:movements',
        'warehouse:warehouse:list:list',
        'warehouse:warehouse:create:create',
        'warehouse:warehouse:view:detail',
        'warehouse:warehouse:view:update',
        'warehouse:warehouse:view:delete',
        'warehouse:stock:list:list',
        'warehouse:stock:view:detail',
        'warehouse:movement:list:list',
        'warehouse:movement:create:create',
        'warehouse:movement:view:detail'
    ) ON CONFLICT DO NOTHING;

--
-- Grants for role: admin-organization (sass organization codes)
--
INSERT INTO
    public.base_permissions (uuid, role_id, action_id, created_at, updated_at)
SELECT
    gen_random_uuid (),
    r.uuid,
    a.uuid,
    NOW (),
    NOW ()
FROM
    public.base_roles r
    CROSS JOIN public.base_actions a
WHERE
    r.slug = 'admin-organization'
    AND a.action IN (
        'base:menu:settings:settings',
        'base:menu:settings:user',
        'base:menu:settings:invoice',
        'base:role:list:list',
        'base:user:list:list',
        'base:user:create:create',
        'base:user:view:detail',
        'base:user:view:update',
        'base:user:view:delete',
        'base:user:view:update-role',
        'sass:invoice:list:list',
        'sass:invoice:view:detail'
    ) ON CONFLICT DO NOTHING;

--
-- Grants for role: admin-organization (sass invoice codes)
--
INSERT INTO
    public.base_permissions (uuid, role_id, action_id, created_at, updated_at)
SELECT
    gen_random_uuid (),
    r.uuid,
    a.uuid,
    NOW (),
    NOW ()
FROM
    public.base_roles r
    CROSS JOIN public.base_actions a
WHERE
    r.slug = 'admin-organization'
    AND a.action IN (
        'sass:invoice:list:list',
        'sass:invoice:view:detail'
    ) ON CONFLICT DO NOTHING;

--
-- Grants for role: admin-organization (sales lead codes)
--
INSERT INTO
    public.base_permissions (uuid, role_id, action_id, created_at, updated_at)
SELECT
    gen_random_uuid (),
    r.uuid,
    a.uuid,
    NOW (),
    NOW ()
FROM
    public.base_roles r
    CROSS JOIN public.base_actions a
WHERE
    r.slug = 'admin-organization'
    AND a.action IN (
        'base:menu:sales:sales',
        'base:menu:sales:lead',
        'sales:lead:list:list',
        'sales:lead:create:create',
        'sales:lead:view:detail',
        'sales:lead:view:update',
        'sales:lead:view:delete',
        'sales:lead-status:list:list',
        'sales:lead-status:create:create',
        'sales:lead-status:view:detail',
        'sales:lead-status:view:update',
        'sales:lead-status:view:delete',
        'sales:lead-metadata-field:list:list',
        'sales:lead-metadata-field:create:create',
        'sales:lead-metadata-field:view:detail',
        'sales:lead-metadata-field:view:update',
        'sales:lead-metadata-field:view:delete',
        'sales:lead-metadata:list:list',
        'sales:lead-metadata:create:create',
        'sales:lead-metadata:view:detail',
        'sales:lead-metadata:view:update',
        'sales:lead-metadata:view:delete',
        'sales:lead-activity:list:list',
        'sales:lead-activity:create:create',
        'sales:lead-activity:view:detail',
        'sales:lead-activity:view:update',
        'sales:lead-activity:view:delete',
        'base:menu:sales:lead-status',
        'base:menu:sales:lead-metadata-field',
        'base:tools:upload:upload',
        'base:menu:product:product',
        'base:menu:product:products',
        'base:menu:product:variants',
        'base:menu:product:categories',
        'base:menu:product:units',
        'product:product:list:list',
        'product:product:create:create',
        'product:product:view:detail',
        'product:product:view:update',
        'product:product:view:delete',
        'product:variant:list:list',
        'product:variant:create:create',
        'product:variant:view:detail',
        'product:variant:view:update',
        'product:variant:view:delete',
        'product:category:list:list',
        'product:category:create:create',
        'product:category:view:detail',
        'product:category:view:update',
        'product:category:view:delete',
        'product:unit:list:list',
        'product:unit:create:create',
        'product:unit:view:detail',
        'product:unit:view:update',
        'product:unit:view:delete',
        'product:metadata:list:list',
        'product:metadata:create:create',
        'product:metadata:view:detail',
        'product:metadata:view:update',
        'product:metadata:view:delete',
        'product:metadata-field:list:list',
        'product:metadata-field:create:create',
        'product:metadata-field:view:detail',
        'product:metadata-field:view:update',
        'product:metadata-field:view:delete',
        'base:menu:warehouse:warehouse',
        'base:menu:warehouse:warehouses',
        'base:menu:warehouse:stocks',
        'base:menu:warehouse:movements',
        'warehouse:warehouse:list:list',
        'warehouse:warehouse:create:create',
        'warehouse:warehouse:view:detail',
        'warehouse:warehouse:view:update',
        'warehouse:warehouse:view:delete',
        'warehouse:stock:list:list',
        'warehouse:stock:view:detail',
        'warehouse:movement:list:list',
        'warehouse:movement:create:create',
        'warehouse:movement:view:detail'
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    public.base_user_roles (uuid, user_id, role_id, created_at, updated_at)
VALUES
    (
        'e2e19699-0c6e-46f9-80b8-805000b3434e',
        '01694e54-498d-486f-a078-e860c5b3434e',
        '6542b60b-e678-4bde-be5e-9ddafcc5fe82',
        '2026-09-23 11:43:02.326272+07',
        '2026-09-23 11:43:02.326272+07'
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

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
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

--
-- Data for Name: sass_package; Type: TABLE DATA; Schema: public; Owner: moladin
--
INSERT INTO
    public.sass_package (
        uuid,
        name,
        description,
        type,
        duration_days,
        duration_description,
        actions,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'c9df0d8d-7d56-4cb5-b708-0963ec18aa6d',
        'Basic Subscription',
        'Monthly subscription sample package',
        'subscription',
        30,
        '30 days access',
        '[{"action_id": "c366e903-ae3e-4005-b03b-9a08412fabc3"}]',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    public.sass_package (
        uuid,
        name,
        description,
        type,
        duration_days,
        duration_description,
        actions,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        'a33b527e-dbcb-4d78-9b75-077a0c4497c5',
        'Pay Per Use',
        'Transaction sample package',
        'transaction',
        NULL,
        'Pay per transaction, no expiry',
        '[{"action_id": "c366e903-ae3e-4005-b03b-9a08412fabc3", "credit": 1000}]',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    public.sass_package (
        uuid,
        name,
        description,
        type,
        duration_days,
        duration_description,
        credit_quota,
        actions,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '8d0072e1-1463-4033-9533-06ed31fb7b31',
        'Quota Sample',
        'Quota sample package',
        'quota',
        NULL,
        NULL,
        1000,
        '[{"action_id": "c366e903-ae3e-4005-b03b-9a08412fabc3", "credit": 1000}]',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

--
-- Sample data for sales lead statuses
--
INSERT INTO
    public.sales_lead_statuses (
        uuid,
        organization_id,
        name,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '422a0629-e670-4051-af2c-7eac487b0436',
        '46896864-fecd-4a68-a19c-a715530100a9',
        'New Contact',
        'Fresh inbound lead, not yet contacted',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'dd001a52-401a-463b-acd0-34a3741b15d1',
        '46896864-fecd-4a68-a19c-a715530100a9',
        'Contacted',
        'First outreach done, awaiting response',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '36095ad6-d704-4f9e-a7e8-03e749a83efb',
        '46896864-fecd-4a68-a19c-a715530100a9',
        'Qualified',
        'Budget and need confirmed',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'd9904c42-be30-4aae-9e72-d4e699bf33ee',
        NULL,
        'Proposal Sent',
        'Proposal delivered, pending decision',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '09180e2c-381a-47c2-bd31-6499f584569f',
        NULL,
        'Converted',
        'Lead won and converted to customer',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

--
-- Sample data for sales lead metadata fields
--
INSERT INTO
    public.sales_lead_metadata_fields (
        uuid,
        organization_id,
        name,
        description,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '59309034-640b-4ce9-9b79-45291d57bfea',
        '46896864-fecd-4a68-a19c-a715530100a9',
        'Budget Range',
        'Prospect declared budget bracket',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '836c6d8d-179f-46c3-8a0d-d58d9b7e8d1d',
        '46896864-fecd-4a68-a19c-a715530100a9',
        'Decision Maker',
        'Person holding purchase authority',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'df4fc6a3-3f1d-4abe-a627-c3d07d6c6160',
        NULL,
        'Timeline',
        'Expected decision timeframe',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'bee5f818-c5f5-456b-93b8-3949c1429cc8',
        NULL,
        'Competitor',
        'Incumbent or competing vendor',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

--
-- Sample data for sales leads
--
INSERT INTO
    public.sales_leads (
        uuid,
        name,
        email,
        phone_number,
        company,
        source,
        status,
        value,
        assigned_to,
        organization_id,
        notes,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '45ba7315-830f-42e5-a54f-592f9154d0b1',
        'Andi Pratama',
        'andi.pratama@example.com',
        '+6281234567890',
        'PT Maju Jaya',
        'website',
        'new',
        15000000,
        '11240574-f818-48b3-adb2-291df37d43d4',
        '46896864-fecd-4a68-a19c-a715530100a9',
        'Inbound from website form.',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '3cab3d41-e8b6-4ac7-b8ba-9bb633da2d5a',
        'Siti Rahayu',
        'siti.rahayu@example.com',
        '+6289876543210',
        'CV Berkah Abadi',
        'referral',
        'contacted',
        25000000,
        '11240574-f818-48b3-adb2-291df37d43d4',
        '46896864-fecd-4a68-a19c-a715530100a9',
        'Referred by existing customer.',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '9ce477f1-9088-4725-bb2a-93ed6d765285',
        'Budi Santoso',
        'budi.santoso@example.com',
        '+6276543210987',
        'PT Sinar Terang',
        'ads',
        'qualified',
        50000000,
        NULL,
        NULL,
        'Unassigned inbound lead from ads campaign.',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '8741717b-c478-4771-be12-fcb4dab002c1',
        'Dewi Lestari',
        'dewi.lestari@example.com',
        '+6281122334455',
        NULL,
        'event',
        'new',
        NULL,
        NULL,
        '46896864-fecd-4a68-a19c-a715530100a9',
        'Met at Jakarta expo booth.',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '6d185b77-bffc-4c72-ae48-054a7054469c',
        'John Miller',
        'john.miller@example.com',
        '+15550123456',
        'Acme Corp',
        'cold_call',
        'converted',
        120000000,
        '11240574-f818-48b3-adb2-291df37d43d4',
        '46896864-fecd-4a68-a19c-a715530100a9',
        'Enterprise deal closed after 3 calls.',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

--
-- Sample data for sales lead metadata
--
INSERT INTO
    public.sales_lead_metadata (
        uuid,
        lead_metadata_field_id,
        value,
        status,
        created_at,
        updated_at,
        deleted_at
    )
VALUES
    (
        '238ee5fe-785a-45e9-bc4c-f32edcd385b3',
        '59309034-640b-4ce9-9b79-45291d57bfea',
        '10-25jt',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '5af84b3f-47a6-4903-8fe0-cce3ad067c5e',
        'df4fc6a3-3f1d-4abe-a627-c3d07d6c6160',
        'Q4 2026',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '4a3fa020-54ed-4d08-b5e2-f2c8f3aa08fa',
        '59309034-640b-4ce9-9b79-45291d57bfea',
        '25-50jt',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'a9defba5-e8ef-4df1-8c7a-b4e3b002b744',
        '836c6d8d-179f-46c3-8a0d-d58d9b7e8d1d',
        'Ibu Siti (owner)',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '71bee402-0f9b-46fb-b644-12f71e25ec03',
        'bee5f818-c5f5-456b-93b8-3949c1429cc8',
        'Vendor X',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        'f1b71a90-948c-496e-b177-79508d73396c',
        '59309034-640b-4ce9-9b79-45291d57bfea',
        '>100jt',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '5f053446-856c-4e17-a70f-7244bd81b480',
        'df4fc6a3-3f1d-4abe-a627-c3d07d6c6160',
        'ASAP',
        'active',
        NOW (),
        NOW (),
        NULL
    ),
    (
        '1452afda-cf97-4e6c-8c5f-8e431b4142e9',
        'df4fc6a3-3f1d-4abe-a627-c3d07d6c6160',
        'Next month',
        'active',
        NOW (),
        NOW (),
        NULL
    ) ON CONFLICT DO NOTHING;

--
-- PostgreSQL database dump complete
--

--
-- Warehouse module actions
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
    ('bf8300f4-6568-4ab1-9fba-55865fcf80b2', 'base:menu:warehouse:warehouse', 'Access for warehouse module', 'active', NOW (), NOW (), NULL),
    ('4a9b81ef-a1c4-4834-99a6-e067b7ace04d', 'base:menu:warehouse:warehouses', 'Access for warehouse warehouses module', 'active', NOW (), NOW (), NULL),
    ('f3c6d64c-1b57-48db-8c6d-7a3d2534a609', 'base:menu:warehouse:stocks', 'Access for warehouse stocks module', 'active', NOW (), NOW (), NULL),
    ('31d2d0f8-3c9d-4c7b-b661-d4886dee8e68', 'base:menu:warehouse:movements', 'Access for warehouse movements module', 'active', NOW (), NOW (), NULL),
    ('ff2b1c1e-c759-422a-8a66-802e33c7bfbd', 'warehouse:warehouse:list:list', 'Access for list warehouse', 'active', NOW (), NOW (), NULL),
    ('3bc11371-b566-46a9-8008-71633be6f123', 'warehouse:warehouse:create:create', 'Access for create warehouse', 'active', NOW (), NOW (), NULL),
    ('1983e8f5-6e43-4bcd-a9cb-b41bcca85abf', 'warehouse:warehouse:view:detail', 'Access for view detail warehouse', 'active', NOW (), NOW (), NULL),
    ('e586370b-5c76-4747-9c54-4af8d152096e', 'warehouse:warehouse:view:update', 'Access for update detail warehouse', 'active', NOW (), NOW (), NULL),
    ('9b45b929-7a8e-41b4-b1fc-7806d9f5f5f4', 'warehouse:warehouse:view:delete', 'Access for delete warehouse', 'active', NOW (), NOW (), NULL),
    ('7891e642-4506-4a18-b87e-ee243baab7bf', 'warehouse:stock:list:list', 'Access for list stock', 'active', NOW (), NOW (), NULL),
    ('3522c863-6a8f-4d0c-a737-417f5460612d', 'warehouse:stock:view:detail', 'Access for view detail stock', 'active', NOW (), NOW (), NULL),
    ('67872bbe-db82-4018-8003-7c692eff2590', 'warehouse:movement:list:list', 'Access for list movement', 'active', NOW (), NOW (), NULL),
    ('0598b062-4ce1-4798-8149-4dc76bcaffa7', 'warehouse:movement:create:create', 'Access for create movement', 'active', NOW (), NOW (), NULL),
    ('59a9ab70-44c2-492c-b4ca-4e153e011dd3', 'warehouse:movement:view:detail', 'Access for view detail movement', 'active', NOW (), NOW (), NULL)
    ON CONFLICT DO NOTHING;

--
-- Warehouse module menus
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
        '92c367da-7e4d-450a-a145-4b7808ce34d0',
        '',
        NULL,
        'Warehouse',
        'bf8300f4-6568-4ab1-9fba-55865fcf80b2',
        'Access to warehouse settings',
        '#',
        'active',
        NOW (),
        NOW (),
        NULL,
        0
    ),
    (
        'e6243acc-cc98-428a-8e7a-29fe70e75df6',
        '-',
        '92c367da-7e4d-450a-a145-4b7808ce34d0',
        'Warehouses',
        '4a9b81ef-a1c4-4834-99a6-e067b7ace04d',
        'Access to warehouses settings',
        '/warehouse/views/warehouses',
        'active',
        NOW (),
        NOW (),
        NULL,
        0
    ),
    (
        'ea0f3fbc-bd3d-468d-89fa-da9d688317cf',
        '-',
        '92c367da-7e4d-450a-a145-4b7808ce34d0',
        'Stocks',
        'f3c6d64c-1b57-48db-8c6d-7a3d2534a609',
        'Access to stocks settings',
        '/warehouse/views/stocks',
        'active',
        NOW (),
        NOW (),
        NULL,
        1
    ),
    (
        '81fb7d80-b88a-4630-943e-b99bfd7d8c61',
        '-',
        '92c367da-7e4d-450a-a145-4b7808ce34d0',
        'Movements',
        '31d2d0f8-3c9d-4c7b-b661-d4886dee8e68',
        'Access to movements settings',
        '/warehouse/views/movements',
        'active',
        NOW (),
        NOW (),
        NULL,
        2
    ) ON CONFLICT DO NOTHING;