-- Sample data for the sales Customer → PR → SO → DO → Invoice chain
-- (features/20261007-08-sales-customer-pr-so-do.md).
--
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING on every INSERT, rerun freely.
-- All rows are organization-less (organization_id NULL), so the unlinked
-- probe login (admin@vortexgin.com) sees them.
--
-- Requires product + warehouse samples first (PRD-001/PRD-002 + WH-MAIN),
-- and migrations through 20261008-04 applied (customers, PR/SO/DO tables,
-- shared document metadata tables, sass_invoice sales_order link). Aborts
-- loudly when prerequisites are missing.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed-sales-customer-so-sample.sql
--
-- After applying: re-login as admin (permissions snapshot at login) before
-- opening /sales/views/customers, /purchase-requests, /sales-orders,
-- /delivery-orders.
--
-- Chain: Acme Retail → PR (closed) → SO (confirmed, deal prices copied)
--        → DO (packed) → Invoice (running, linked to SO).

-- Guards: abort on missing prerequisites (fail fast, not half-seeded) ------
DO $$
BEGIN
  IF (SELECT count(*) FROM public.prd_products WHERE sku IN ('PRD-001', 'PRD-002')) < 2 THEN
    RAISE EXCEPTION 'seed-product-sample.sql must run first (PRD-001/PRD-002 missing)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.wrh_warehouses WHERE code = 'WH-MAIN') THEN
    RAISE EXCEPTION 'seed-warehouse-sample.sql must run first (WH-MAIN missing)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.base_roles WHERE slug = 'admin') THEN
    RAISE EXCEPTION 'seed-master-data.sql must run first (admin role missing)';
  END IF;
  IF to_regclass('public.sales_doc_metadata_fields') IS NULL
     OR to_regclass('public.sales_purchase_request_metadata') IS NULL
     OR to_regclass('public.sales_order_metadata') IS NULL
     OR to_regclass('public.sales_delivery_order_metadata') IS NULL THEN
    RAISE EXCEPTION 'document metadata migrations through 20261008-04 must run first';
  END IF;
END $$;

-- Menu actions for the new sales pages --------------------------------------
-- (entity actions + admin entity grants already ship in seed-master-data.sql;
-- only the four sidebar menu codes are missing here)
INSERT INTO public.base_actions (uuid, action, description, status, created_at, updated_at, deleted_at)
VALUES
    ('a0b1c2d3-e4f5-4a6b-8c7d-e9f0a1b2c3d4', 'base:menu:sales:customer', 'Access to customer menu', 'active', NOW(), NOW(), NULL),
    ('b1c2d3e4-f5a6-4b7c-8d9e-f0a1b2c3d4e5', 'base:menu:sales:purchase-request', 'Access to purchase request menu', 'active', NOW(), NOW(), NULL),
    ('c2d3e4f5-a6b7-4c8d-9e0f-a1b2c3d4e5f6', 'base:menu:sales:sales-order', 'Access to sales order menu', 'active', NOW(), NOW(), NULL),
    ('d3e4f5a6-b7c8-4d9e-8f1a-b2c3d4e5f6a7', 'base:menu:sales:delivery-order', 'Access to delivery order menu', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Sidebar menus under Sales (parent uuid from seed-master-data.sql) ---------
INSERT INTO public.base_menus (uuid, icon, parent, menu, action_id, description, redirection, status, created_at, updated_at, deleted_at, weight)
VALUES
    ('e4f5a6b7-c8d9-4e0f-a1b2-c3d4e5f6a7b8', '', '33740e19-ef64-4c13-8707-0052e866bd23', 'Customers',
     (SELECT uuid FROM public.base_actions WHERE action = 'base:menu:sales:customer'),
     'Access to customers', '/sales/views/customers', 'active', NOW(), NOW(), NULL, 3),
    ('f5a6b7c8-d9e0-4f1a-b2c3-d4e5f6a7b8c9', '', '33740e19-ef64-4c13-8707-0052e866bd23', 'Purchase Requests',
     (SELECT uuid FROM public.base_actions WHERE action = 'base:menu:sales:purchase-request'),
     'Access to purchase requests', '/sales/views/purchase-requests', 'active', NOW(), NOW(), NULL, 4),
    ('a6b7c8d9-e0f1-4a2b-a3d4-e5f6a7b8c9d0', '', '33740e19-ef64-4c13-8707-0052e866bd23', 'Sales Orders',
     (SELECT uuid FROM public.base_actions WHERE action = 'base:menu:sales:sales-order'),
     'Access to sales orders', '/sales/views/sales-orders', 'active', NOW(), NOW(), NULL, 5),
    ('b7c8d9e0-f1a2-4b3c-a4e5-f6a7b8c9d0e1', '', '33740e19-ef64-4c13-8707-0052e866bd23', 'Delivery Orders',
     (SELECT uuid FROM public.base_actions WHERE action = 'base:menu:sales:delivery-order'),
     'Access to delivery orders', '/sales/views/delivery-orders', 'active', NOW(), NOW(), NULL, 6)
ON CONFLICT DO NOTHING;

-- Admin grants for the new menu codes ----------------------------------------
-- (unique (role_id, action_id) makes this a safe no-op on rerun)
INSERT INTO public.base_permissions (uuid, role_id, action_id, created_at, updated_at)
SELECT gen_random_uuid(), r.uuid, a.uuid, NOW(), NOW()
FROM public.base_roles r CROSS JOIN public.base_actions a
WHERE r.slug = 'admin'
  AND a.action IN (
    'base:menu:sales:customer',
    'base:menu:sales:purchase-request',
    'base:menu:sales:sales-order',
    'base:menu:sales:delivery-order'
  )
ON CONFLICT DO NOTHING;

-- Customers -------------------------------------------------------------------
INSERT INTO public.sales_customers (uuid, organization_id, lead_id, name, email, phone, company_name, notes, status, created_at, updated_at, deleted_at)
VALUES
    ('c5b2a1f0-7e3d-4a1b-9c4e-2f6a8b0d1e51', NULL, NULL, 'Acme Retail', 'acme.retail@example.com', '+62215550101', 'Acme Retail Ltd', 'Sample customer for the PR/SO/DO chain.', 'active', NOW(), NOW(), NULL),
    ('d6c3b2a1-8f4e-4b2c-ad5f-3a7b9c1e2f62', NULL, NULL, 'Budi Santoso', 'budi.mart@example.com', '+62215550102', 'Budi Mart', 'Second sample customer.', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Customer metadata (one field + value, exercises the join) -------------------
INSERT INTO public.sales_customer_metadata_fields (uuid, organization_id, name, description, status, created_at, updated_at, deleted_at)
VALUES
    ('e7d4c3b2-9a5f-4c3d-be6a-4b8c0d2f3a73', NULL, 'VIP Tier', 'Customer loyalty tier, e.g. Gold.', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.sales_customer_metadata (uuid, customer_id, customer_metadata_field_id, value, status, created_at, updated_at, deleted_at)
VALUES
    ('f8e5d4c3-0b6a-4d4e-af7b-5c9d1e3a4b84', 'c5b2a1f0-7e3d-4a1b-9c4e-2f6a8b0d1e51', 'e7d4c3b2-9a5f-4c3d-be6a-4b8c0d2f3a73', 'Gold', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Shared PR/SO/DO metadata field catalog --------------------------------------
-- These fields are organization-less so the sample documents can share them.
-- Name-based references below also make the seed safe when a field with the
-- same unique (organization, name) key already exists under another UUID.
INSERT INTO public.sales_doc_metadata_fields (uuid, organization_id, name, description, status, created_at, updated_at, deleted_at)
VALUES
    ('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', NULL, 'Customer Reference', 'Customer request or purchase-order reference carried across sales documents.', 'active', NOW(), NOW(), NULL),
    ('1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e', NULL, 'Payment Terms', 'Commercial payment terms agreed for the document.', 'active', NOW(), NOW(), NULL),
    ('2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f', NULL, 'Delivery Instructions', 'Handling and receiving instructions for delivery.', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Purchase request (approved → closed by SO-1) ----------------------------------
-- Math: 2×150000 = 300000; 5×99000×0.9 = 445500; subtotal 745500;
-- grand = round(745500×0.95) = 708225.
INSERT INTO public.sales_purchase_requests (uuid, organization_id, customer_id, warehouse_id, status, subtotal, discount_pct, grand_total, notes, created_at, updated_at, deleted_at)
VALUES
    ('a11ce001-4b2c-4d3e-8f5a-6b7c8d9e0f11', NULL, 'c5b2a1f0-7e3d-4a1b-9c4e-2f6a8b0d1e51',
     (SELECT uuid FROM public.wrh_warehouses WHERE code = 'WH-MAIN'),
     'closed', 745500, 5, 708225, 'Approved, then closed by the sample sales order (deal prices copied).', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.sales_purchase_request_items (uuid, purchase_request_id, product_id, variant_id, qty, unit_price, discount_pct, line_total, notes, created_at, updated_at, deleted_at)
VALUES
    ('b22de002-5c3d-4e5f-9a6b-7c8d9e0f1112', 'a11ce001-4b2c-4d3e-8f5a-6b7c8d9e0f11',
     (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-001'), NULL, 2, 150000, 0, 300000, NULL, NOW(), NOW(), NULL),
    ('b33df003-6d4e-4f5a-8b7c-8d9e0f112233', 'a11ce001-4b2c-4d3e-8f5a-6b7c8d9e0f11',
     (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-002'),
     (SELECT uuid FROM public.prd_product_variants WHERE sku = 'PRD-002-BLK'), 5, 99000, 10, 445500, 'Black M deal price.', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Sales order (confirmed, deal prices copied from PR) ---------------------------
INSERT INTO public.sales_orders (uuid, organization_id, customer_id, purchase_request_id, warehouse_id, status, subtotal, discount_pct, grand_total, notes, created_at, updated_at, deleted_at)
VALUES
    ('c44ea004-7e5f-4a5b-8c8d-9e0f11223444', NULL, 'c5b2a1f0-7e3d-4a1b-9c4e-2f6a8b0d1e51', 'a11ce001-4b2c-4d3e-8f5a-6b7c8d9e0f11',
     (SELECT uuid FROM public.wrh_warehouses WHERE code = 'WH-MAIN'),
     'confirmed', 745500, 5, 708225, 'Deal prices copied from the sample purchase request.', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.sales_order_items (uuid, sales_order_id, product_id, variant_id, qty, unit_price, discount_pct, line_total, notes, created_at, updated_at, deleted_at)
VALUES
    ('d44eb005-8f5a-4b5c-8d9e-0f1122344455', 'c44ea004-7e5f-4a5b-8c8d-9e0f11223444',
     (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-001'), NULL, 2, 150000, 0, 300000, NULL, NOW(), NOW(), NULL),
    ('d55ec006-9a5b-4c5d-8e0f-112234445566', 'c44ea004-7e5f-4a5b-8c8d-9e0f11223444',
     (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-002'),
     (SELECT uuid FROM public.prd_product_variants WHERE sku = 'PRD-002-BLK'), 5, 99000, 10, 445500, 'Black M deal price.', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Delivery order (packed, not yet shipped — ship via UI, system or paper) --------
INSERT INTO public.sales_delivery_orders (uuid, organization_id, sales_order_id, warehouse_id, status, fulfillment, stock_deducted, notes, created_at, updated_at, deleted_at)
VALUES
    ('e66fb007-0b6c-4d5e-8f1a-122334455667', NULL, 'c44ea004-7e5f-4a5b-8c8d-9e0f11223444',
     (SELECT uuid FROM public.wrh_warehouses WHERE code = 'WH-MAIN'),
     'packed', NULL, false, 'Sample packed DO — ship via UI (system posts movements, paper does not deduct).', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.sales_delivery_order_items (uuid, delivery_order_id, product_id, variant_id, qty, created_at, updated_at, deleted_at)
VALUES
    ('f77ac008-1c7d-4e5f-8a2b-233445566778', 'e66fb007-0b6c-4d5e-8f1a-122334455667',
     (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-001'), NULL, 2, NOW(), NOW(), NULL),
    ('a88bd009-2d8e-4f5a-8b3c-334455667788', 'e66fb007-0b6c-4d5e-8f1a-122334455667',
     (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-002'),
     (SELECT uuid FROM public.prd_product_variants WHERE sku = 'PRD-002-BLK'), 5, NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Document metadata values ----------------------------------------------------
-- PR and SO demonstrate reuse of shared fields; DO resolves its customer
-- reference through the same catalog and adds delivery-specific instructions.
INSERT INTO public.sales_purchase_request_metadata (uuid, purchase_request_id, sales_doc_metadata_field_id, value, status, created_at, updated_at, deleted_at)
VALUES
    ('3d4e5f6a-7b8c-4d9e-8f0a-1b2c3d4e5f60', 'a11ce001-4b2c-4d3e-8f5a-6b7c8d9e0f11',
     (SELECT uuid FROM public.sales_doc_metadata_fields WHERE organization_id IS NULL AND name = 'Customer Reference' AND deleted_at IS NULL),
     'ACME-REQ-2026-001', 'active', NOW(), NOW(), NULL),
    ('4e5f6a7b-8c9d-4e0f-8a1b-2c3d4e5f6071', 'a11ce001-4b2c-4d3e-8f5a-6b7c8d9e0f11',
     (SELECT uuid FROM public.sales_doc_metadata_fields WHERE organization_id IS NULL AND name = 'Payment Terms' AND deleted_at IS NULL),
     'Net 30', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.sales_order_metadata (uuid, sales_order_id, sales_doc_metadata_field_id, value, status, created_at, updated_at, deleted_at)
VALUES
    ('5f6a7b8c-9d0e-4f1a-8b2c-3d4e5f607182', 'c44ea004-7e5f-4a5b-8c8d-9e0f11223444',
     (SELECT uuid FROM public.sales_doc_metadata_fields WHERE organization_id IS NULL AND name = 'Customer Reference' AND deleted_at IS NULL),
     'ACME-PO-2026-001', 'active', NOW(), NOW(), NULL),
    ('6a7b8c9d-0e1f-4a2b-8c3d-4e5f60718293', 'c44ea004-7e5f-4a5b-8c8d-9e0f11223444',
     (SELECT uuid FROM public.sales_doc_metadata_fields WHERE organization_id IS NULL AND name = 'Payment Terms' AND deleted_at IS NULL),
     'Net 30', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.sales_delivery_order_metadata (uuid, sales_delivery_order_id, sales_doc_metadata_field_id, value, status, created_at, updated_at, deleted_at)
VALUES
    ('7b8c9d0e-1f2a-4b3c-8d4e-5f60718293a4', 'e66fb007-0b6c-4d5e-8f1a-122334455667',
     (SELECT uuid FROM public.sales_doc_metadata_fields WHERE organization_id IS NULL AND name = 'Customer Reference' AND deleted_at IS NULL),
     'ACME-PO-2026-001', 'active', NOW(), NOW(), NULL),
    ('8c9d0e1f-2a3b-4c4d-8e5f-60718293a4b5', 'e66fb007-0b6c-4d5e-8f1a-122334455667',
     (SELECT uuid FROM public.sales_doc_metadata_fields WHERE organization_id IS NULL AND name = 'Delivery Instructions' AND deleted_at IS NULL),
     'Deliver to receiving dock B; call 30 minutes before arrival.', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Invoice linked to the sales order (snapshot, no FK) ---------------------------
-- Organization/package snapshots copy the live sample rows at write time.
INSERT INTO public.sass_invoice (uuid, organization, package, sales_order_id, sales_order_number, start_date, end_date, credit_limit, credit_usage, status, created_at, updated_at, deleted_at)
VALUES
    ('b99ce010-3e9f-4a5b-8c4d-445566778899',
     (SELECT jsonb_build_object('id', uuid, 'name', name, 'npwp', npwp) FROM public.sass_organization WHERE name = 'VortexGin Sample'),
     (SELECT jsonb_build_object('id', uuid, 'name', name, 'description', description, 'type', type) FROM public.sass_package WHERE name = 'Basic Subscription'),
     'c44ea004-7e5f-4a5b-8c8d-9e0f11223444', 'SO-C44EA004', CURRENT_DATE, NULL, NULL, 1, 'running', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;
