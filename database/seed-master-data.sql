--
-- PostgreSQL database dump
--

-- Dumped from database version 14.13 (Homebrew)
-- Dumped by pg_dump version 14.13 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: actions; Type: TABLE DATA; Schema: public; Owner: moladin
--

INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('1daaf37a-a26b-40a9-bebd-543b21606b23', 'base:user:list:list', 'Access for list user', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('c366e903-ae3e-4005-b03b-9a08412fabc3', 'base:user:create:create', 'Access for create user', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('7998fb67-93a3-483f-bf78-426a4af09518', 'base:user:view:detail', 'Access for view detail user', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('c667477f-9e20-422b-a6ee-cb0af33aa13e', 'base:user:view:update', 'Access for update detail user', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('871c1767-730a-4159-8a14-273b3c4f4fb2', 'base:user:view:delete', 'access for delete user', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('c75bc6c0-6805-4a2f-b756-84be92b2303a', 'base:action:list:list', 'Access for list action', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('f4f515ee-5885-4004-9726-546b4c4bed1c', 'base:action:create:create', 'Access for create action', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('5cb05bf3-b514-4899-9dcf-92f920af913e', 'base:action:view:detail', 'Access for view detail action', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('6be80d14-b64e-4922-b067-07e9dda27ad0', 'base:action:view:update', 'Access for update detail action', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('03f60930-f9d5-429f-8b44-fd4225d8465c', 'base:action:view:delete', 'access for delete action', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('824a78fc-4e69-4f71-a93a-d63705b77647', 'base:role:list:list', 'Access for list role', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('975597d1-a6c0-43e4-aed2-a985cb1a9302', 'base:role:create:create', 'Access for create role', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('8ec7b014-58e8-4d89-b453-3d102c69e5cc', 'base:role:view:detail', 'Access for view detail role', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('67d63ad6-7985-44ae-ac0e-c7b8c10c8450', 'base:role:view:update', 'Access for update detail role', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('575a6201-7820-48d2-8219-66b879f47c1c', 'base:role:view:update-permission', 'Access for update detail role', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('223a8a8f-2ffa-41eb-ae6e-8d8bf74f97fa', 'base:role:view:delete', 'access for delete role', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-23 11:42:37.284771+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('c4f34420-4448-48f4-99c1-f97338872816', 'base:menu:settings:settings', 'Access for admin settings', 'active', '2026-09-23 13:46:29.590575+07', '2026-09-23 13:46:29.590575+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('983b5065-d03d-4b38-ab0e-170dda618fca', 'base:menu:settings:action', 'Access for admin action', 'active', '2026-09-23 13:46:29.590575+07', '2026-09-23 13:46:29.590575+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('e20bff7e-eb0a-4b62-981a-d50d4671b934', 'base:menu:settings:role', 'Access for admin role', 'active', '2026-09-23 13:46:29.590575+07', '2026-09-23 13:46:29.590575+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('416b337e-57d7-49d0-afb6-2a2c6c445239', 'base:menu:settings:user', 'Access for admin user', 'active', '2026-09-23 13:46:29.590575+07', '2026-09-23 13:46:29.590575+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('69d62397-7ba2-4f61-84f7-9dc1ac5b25b0', 'base:menu:settings:menus', 'Access for admin menu', 'active', '2026-09-23 13:52:11.125392+07', '2026-09-23 13:52:11.125392+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('3af10f76-23f1-4d80-884c-b4f4c3b842c1', 'base:menus:list:list', 'Access for list menu', 'active', '2026-09-23 13:52:11.125392+07', '2026-09-23 13:52:11.125392+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('267ccd2b-f73d-40e2-a06b-0ac014ae3eff', 'base:menus:create:create', 'Access for create menu', 'active', '2026-09-23 13:52:11.125392+07', '2026-09-23 13:52:11.125392+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('ba3a6d04-2a71-4191-a810-c3ca6c24a183', 'base:menus:view:detail', 'Access for view detail menu', 'active', '2026-09-23 13:52:11.125392+07', '2026-09-23 13:52:11.125392+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('a767c2c4-61d4-4839-b8fd-51a888b034a6', 'base:menus:view:update', 'Access for update detail menu', 'active', '2026-09-23 13:52:11.125392+07', '2026-09-23 13:52:11.125392+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('88ba01ce-e03f-44c3-a347-7b3313da9dc7', 'base:menus:view:delete', 'access for delete menu', 'active', '2026-09-23 13:52:11.125392+07', '2026-09-23 13:52:11.125392+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('54c03822-7ebd-4a02-ab93-261be80bdb86', 'test.action-1790146786', 'updated desc', 'deleted', '2026-09-23 13:59:46.808+07', '2026-09-23 14:00:07.1+07', '2026-09-23 14:00:07.1+07') ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('3ddfcd7f-90f5-4090-be2c-e899b9508f26', 'full.action-1790155691', 'd2', 'deleted', '2026-09-23 16:28:12.617+07', '2026-09-23 16:28:25.234+07', '2026-09-23 16:28:25.234+07') ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('1f6b6e75-3990-4ee4-93b0-d640dcf807ce', 'tmp.verify-1790173333526', 'updated via encrypted exchange', 'deleted', '2026-09-23 21:22:14.162+07', '2026-09-23 21:22:15.043+07', '2026-09-23 21:22:15.043+07') ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('1b14e76d-16a0-4776-be1f-6c4ab3ae0ebb', 'base:activity-log:list:list', 'Access for list activity log', 'active', '2026-09-24 08:30:57.751869+07', '2026-09-24 08:30:57.751869+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.actions (uuid, action, description, status, created_at, updated_at, deleted_at) VALUES ('4353c89c-3585-457d-81c2-0ef18e84b0c5', 'base:user:view:update-role', 'Access for update role user', 'active', '2026-09-23 11:42:37.284771+07', '2026-09-24 08:33:41.628+07', NULL) ON CONFLICT DO NOTHING;


--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: moladin
--

INSERT INTO public.menus (uuid, icon, parent, menu, action_id, description, redirection, status, created_at, updated_at, deleted_at, weight) VALUES ('e6bb41fa-1062-4461-ab13-df7b6c921ff2', 'home', NULL, 'Test Menu 1790146797', '54c03822-7ebd-4a02-ab93-261be80bdb86', 'updated menu', '/test-1790146797', 'deleted', '2026-09-23 13:59:58.405+07', '2026-09-23 14:00:07.042+07', '2026-09-23 14:00:07.042+07', 0) ON CONFLICT DO NOTHING;
INSERT INTO public.menus (uuid, icon, parent, menu, action_id, description, redirection, status, created_at, updated_at, deleted_at, weight) VALUES ('7f0b3de6-95fe-4256-b69c-b9fa37f06c33', 'i', NULL, 'Full Menu', '3ddfcd7f-90f5-4090-be2c-e899b9508f26', 'm2', '/full', 'deleted', '2026-09-23 16:28:19.994+07', '2026-09-23 16:28:25.193+07', '2026-09-23 16:28:25.193+07', 0) ON CONFLICT DO NOTHING;
INSERT INTO public.menus (uuid, icon, parent, menu, action_id, description, redirection, status, created_at, updated_at, deleted_at, weight) VALUES ('fc89a49c-b4a6-4acc-951a-0860be8fda70', '', NULL, 'Settings', 'c4f34420-4448-48f4-99c1-f97338872816', 'Access to admin settings', '#', 'active', '2026-09-23 13:46:29.728008+07', '2026-09-23 13:46:29.728008+07', NULL, 0) ON CONFLICT DO NOTHING;
INSERT INTO public.menus (uuid, icon, parent, menu, action_id, description, redirection, status, created_at, updated_at, deleted_at, weight) VALUES ('aa7267f9-0605-449b-abf5-96fec71617e3', '-', 'fc89a49c-b4a6-4acc-951a-0860be8fda70', 'Menu', '69d62397-7ba2-4f61-84f7-9dc1ac5b25b0', 'Access to menu settings', '/base/views/menus', 'active', '2026-09-23 13:52:11.136161+07', '2026-09-23 21:50:38.672+07', NULL, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.menus (uuid, icon, parent, menu, action_id, description, redirection, status, created_at, updated_at, deleted_at, weight) VALUES ('e3782d7e-6537-4dde-9534-08695c4c3cbd', '-', 'fc89a49c-b4a6-4acc-951a-0860be8fda70', 'Role', 'e20bff7e-eb0a-4b62-981a-d50d4671b934', 'Access to role settings', '/base/views/roles', 'active', '2026-09-23 13:46:29.742243+07', '2026-09-23 21:51:07.645+07', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.menus (uuid, icon, parent, menu, action_id, description, redirection, status, created_at, updated_at, deleted_at, weight) VALUES ('9a3e33a1-6f86-4415-aab5-cd550a5414d8', '-', 'fc89a49c-b4a6-4acc-951a-0860be8fda70', 'User', '416b337e-57d7-49d0-afb6-2a2c6c445239', 'Access to user settings', '/base/views/users', 'active', '2026-09-23 13:46:29.74309+07', '2026-09-23 21:51:16.414+07', NULL, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.menus (uuid, icon, parent, menu, action_id, description, redirection, status, created_at, updated_at, deleted_at, weight) VALUES ('7c6b9b87-252c-4f18-8950-346c500a2ec9', '-', 'fc89a49c-b4a6-4acc-951a-0860be8fda70', 'Action', '983b5065-d03d-4b38-ab0e-170dda618fca', 'Access to action settings', '/base/views/actions', 'active', '2026-09-23 13:46:29.740618+07', '2026-09-23 21:51:26.394+07', NULL, 1) ON CONFLICT DO NOTHING;


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: moladin
--

INSERT INTO public.roles (uuid, name, slug, status, created_at, updated_at, deleted_at) VALUES ('44beb171-a0e7-4a90-a4b2-d30f5581bda4', 'Admin', 'admin', 'active', '2026-09-23 11:42:37.205955+07', '2026-09-23 11:42:37.205955+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.roles (uuid, name, slug, status, created_at, updated_at, deleted_at) VALUES ('cc61b2bb-8f20-4e3f-9ab8-604481adda6a', 'Renamed Role', 'test-role-1790146786', 'deleted', '2026-09-23 13:59:48.21+07', '2026-09-23 14:00:07.072+07', '2026-09-23 14:00:07.072+07') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (uuid, name, slug, status, created_at, updated_at, deleted_at) VALUES ('399a52f9-4643-4012-83c0-d76ebf717934', 'Full Role 2', 'full-role-1790155641', 'deleted', '2026-09-23 16:28:18.682+07', '2026-09-23 16:28:25.21+07', '2026-09-23 16:28:25.21+07') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (uuid, name, slug, status, created_at, updated_at, deleted_at) VALUES ('6542b60b-e678-4bde-be5e-9ddafcc5fe82', 'Admin Organization', 'admin-organization', 'active', '2026-09-24 08:18:41.524+07', '2026-09-24 08:18:41.524+07', NULL) ON CONFLICT DO NOTHING;


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: moladin
--

INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('11dac1a3-fbfb-4394-9858-55ef31dda0d5', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '1daaf37a-a26b-40a9-bebd-543b21606b23', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('8f365885-0c63-4f88-91e6-7a32708becb3', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', 'c366e903-ae3e-4005-b03b-9a08412fabc3', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('f7c12da9-3f32-4dd9-9cd4-eb1eb1a7eb6a', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '7998fb67-93a3-483f-bf78-426a4af09518', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('fc76ef9e-1ba0-4fff-bec2-517955d3ae53', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', 'c667477f-9e20-422b-a6ee-cb0af33aa13e', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('4dd4136d-05fd-42e8-bba0-8b9da73b6a85', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '4353c89c-3585-457d-81c2-0ef18e84b0c5', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('b733516c-0cf3-4663-977d-4d064d8d7700', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '871c1767-730a-4159-8a14-273b3c4f4fb2', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('ea4fbc6e-aebf-4486-9135-979399d40973', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', 'c75bc6c0-6805-4a2f-b756-84be92b2303a', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('e7a84cd7-61df-4992-a021-ab29177dcda8', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', 'f4f515ee-5885-4004-9726-546b4c4bed1c', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('51cb7246-c122-4c4e-a5e8-c8bc06d527c1', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '5cb05bf3-b514-4899-9dcf-92f920af913e', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('49deee51-b382-460d-bbda-ac2073714be3', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '6be80d14-b64e-4922-b067-07e9dda27ad0', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('bbd779b5-b302-4c7d-b81d-a74a54a4d7d5', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '03f60930-f9d5-429f-8b44-fd4225d8465c', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('5351cc19-91f1-4cff-a847-47d4f9a355af', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '824a78fc-4e69-4f71-a93a-d63705b77647', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('86dcd84c-f6db-4dcd-be1a-711d360a2304', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '975597d1-a6c0-43e4-aed2-a985cb1a9302', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('3036a347-d1a9-429a-9a54-0ab79e286bac', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '8ec7b014-58e8-4d89-b453-3d102c69e5cc', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('9d71f60a-7f58-4cc6-8960-cfe93c683193', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '67d63ad6-7985-44ae-ac0e-c7b8c10c8450', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('2ff36e10-4645-44f2-9906-df967b96d4e6', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '575a6201-7820-48d2-8219-66b879f47c1c', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('06491c8b-2bdf-4c11-98a1-2aad08226e37', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '223a8a8f-2ffa-41eb-ae6e-8d8bf74f97fa', '2026-09-23 11:42:37.387724+07', '2026-09-23 11:42:37.387724+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('e0d69795-5e0f-4500-a4a9-39b7ac8699dd', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', 'c4f34420-4448-48f4-99c1-f97338872816', '2026-09-23 13:46:29.714255+07', '2026-09-23 13:46:29.714255+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('394b6d89-f0f4-4ca5-b455-294a38951f57', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '983b5065-d03d-4b38-ab0e-170dda618fca', '2026-09-23 13:46:29.714255+07', '2026-09-23 13:46:29.714255+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('435f62a0-dbd2-4479-9d1c-d66c0cb697d4', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', 'e20bff7e-eb0a-4b62-981a-d50d4671b934', '2026-09-23 13:46:29.714255+07', '2026-09-23 13:46:29.714255+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('eff50714-a0c1-46e6-a598-c7dbd2fb867e', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '416b337e-57d7-49d0-afb6-2a2c6c445239', '2026-09-23 13:46:29.714255+07', '2026-09-23 13:46:29.714255+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('a7ccbbb2-e577-4d0f-a158-c6cd88d7a83d', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '69d62397-7ba2-4f61-84f7-9dc1ac5b25b0', '2026-09-23 13:52:11.130139+07', '2026-09-23 13:52:11.130139+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('5ebb684e-3dce-415e-8290-97bbd51d47f0', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '3af10f76-23f1-4d80-884c-b4f4c3b842c1', '2026-09-23 13:52:11.130139+07', '2026-09-23 13:52:11.130139+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('c56c7e90-04da-485c-892b-0f5abfbda291', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '267ccd2b-f73d-40e2-a06b-0ac014ae3eff', '2026-09-23 13:52:11.130139+07', '2026-09-23 13:52:11.130139+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('744af5a7-db64-4419-ae22-485394a2477a', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', 'ba3a6d04-2a71-4191-a810-c3ca6c24a183', '2026-09-23 13:52:11.130139+07', '2026-09-23 13:52:11.130139+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('fe3ce011-1bf4-4e21-9d33-1563a9bc5efe', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', 'a767c2c4-61d4-4839-b8fd-51a888b034a6', '2026-09-23 13:52:11.130139+07', '2026-09-23 13:52:11.130139+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('49b808f7-c426-4ad4-9503-8d36f3c5dccd', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '88ba01ce-e03f-44c3-a347-7b3313da9dc7', '2026-09-23 13:52:11.130139+07', '2026-09-23 13:52:11.130139+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('aa385b7a-747a-4284-826d-0c560d3cc05c', 'cc61b2bb-8f20-4e3f-9ab8-604481adda6a', '54c03822-7ebd-4a02-ab93-261be80bdb86', '2026-09-23 13:59:48.214+07', '2026-09-23 13:59:48.214+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('784df2af-5ce9-416e-98f9-f0b5567c4577', '399a52f9-4643-4012-83c0-d76ebf717934', '3ddfcd7f-90f5-4090-be2c-e899b9508f26', '2026-09-23 16:28:18.686+07', '2026-09-23 16:28:18.686+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('9cb98148-420b-4dbc-abee-342f060ce4ac', '6542b60b-e678-4bde-be5e-9ddafcc5fe82', 'c366e903-ae3e-4005-b03b-9a08412fabc3', '2026-09-24 08:18:41.534+07', '2026-09-24 08:18:41.534+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('972be186-0c86-420b-914b-80c9045d0bfd', '6542b60b-e678-4bde-be5e-9ddafcc5fe82', '1daaf37a-a26b-40a9-bebd-543b21606b23', '2026-09-24 08:18:41.534+07', '2026-09-24 08:18:41.534+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('5cb44e7a-98dc-48be-9da7-d10900e06790', '6542b60b-e678-4bde-be5e-9ddafcc5fe82', '871c1767-730a-4159-8a14-273b3c4f4fb2', '2026-09-24 08:18:41.534+07', '2026-09-24 08:18:41.534+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('c911a0cc-e070-4524-aa21-a9a2c87f7f98', '6542b60b-e678-4bde-be5e-9ddafcc5fe82', '7998fb67-93a3-483f-bf78-426a4af09518', '2026-09-24 08:18:41.54+07', '2026-09-24 08:18:41.54+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('c8e1bcb4-6e1f-4185-8d89-ad8232bf3d8d', '6542b60b-e678-4bde-be5e-9ddafcc5fe82', 'c667477f-9e20-422b-a6ee-cb0af33aa13e', '2026-09-24 08:18:41.54+07', '2026-09-24 08:18:41.54+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('26436eee-d6ce-4d9e-abc8-e7b0199021d7', '6542b60b-e678-4bde-be5e-9ddafcc5fe82', '4353c89c-3585-457d-81c2-0ef18e84b0c5', '2026-09-24 08:18:41.54+07', '2026-09-24 08:18:41.54+07') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (uuid, role_id, action_id, created_at, updated_at) VALUES ('2b5d608f-56be-4bab-a7a9-ad939e4efbf1', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '1b14e76d-16a0-4776-be1f-6c4ab3ae0ebb', '2026-09-24 08:30:57.75947+07', '2026-09-24 08:30:57.75947+07') ON CONFLICT DO NOTHING;


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: moladin
--

INSERT INTO public.users (uuid, name, email, phone_number, password, status, created_at, updated_at, deleted_at) VALUES ('1366f6a1-c8a9-4fae-b4a1-00323d784119', 'Full Renamed', 'full-1790155691@example.com', '123456', 'fcf730b6d95236ecd3c9fc2d92d7b6b2bb061514961aec041d6c7a7192f592e4', 'deleted', '2026-09-23 16:28:11.204+07', '2026-09-23 16:28:25.266+07', '2026-09-23 16:28:25.266+07') ON CONFLICT DO NOTHING;
INSERT INTO public.users (uuid, name, email, phone_number, password, status, created_at, updated_at, deleted_at) VALUES ('11240574-f818-48b3-adb2-291df37d43d4', 'Admin Kiyep', 'admin@vortexgin.com', '+10000000001', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'active', '2026-09-23 11:43:02.324537+07', '2026-09-23 20:19:14.829459+07', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users (uuid, name, email, phone_number, password, status, created_at, updated_at, deleted_at) VALUES ('1845a801-77cb-494f-a29c-44691b8965d5', 'Base Updated', 'base-1790146777@example.com', '123456', 'fcf730b6d95236ecd3c9fc2d92d7b6b2bb061514961aec041d6c7a7192f592e4', 'deleted', '2026-09-23 13:59:39.658+07', '2026-09-23 14:00:07.134+07', '2026-09-23 14:00:07.134+07') ON CONFLICT DO NOTHING;


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: moladin
--

INSERT INTO public.user_roles (uuid, user_id, role_id, created_at, updated_at) VALUES ('dc0786bf-609e-4fc2-841f-3a6bf49680a6', '11240574-f818-48b3-adb2-291df37d43d4', '44beb171-a0e7-4a90-a4b2-d30f5581bda4', '2026-09-23 11:43:02.326272+07', '2026-09-23 11:43:02.326272+07') ON CONFLICT DO NOTHING;


--
-- PostgreSQL database dump complete
--

