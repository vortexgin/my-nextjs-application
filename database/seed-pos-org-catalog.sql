-- Tenant catalog for POS (app/sales -> views/pos).
--
-- The shared sample catalog (seed-product-sample.sql + seed-warehouse-sample.sql)
-- is entirely organization-less, and every *ListUseCase scopes strictly to the
-- actor's organization — so an org cashier's POS product grid, warehouse picker,
-- and stock badges are empty although the sale path deliberately accepts
-- same-org *or* global rows. This seed gives the sample tenant
-- (46896864-fecd-4a68-a19c-a715530100a9, VortexGin Sample) its own small
-- storefront catalog instead of punching a hole in list scoping.
--
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING, rerun freely.
-- SKUs are ORG-* so they never collide with the global PRD-*/CMP-* catalog.
--
-- Requires seed-product-sample.sql first (reuses the global Piece unit).
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed-pos-org-catalog.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.sass_organization WHERE uuid = '46896864-fecd-4a68-a19c-a715530100a9') THEN
    RAISE EXCEPTION 'seed-master-data.sql must run first (sample organization missing)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.prd_units WHERE uuid = '64d083d9-bea0-453e-8659-33c726bf93fd') THEN
    RAISE EXCEPTION 'seed-product-sample.sql must run first (Piece unit missing)';
  END IF;
END $$;

-- Tenant storefront warehouse --------------------------------------------
INSERT INTO public.wrh_warehouses (uuid, organization_id, code, name, address, status, created_at, updated_at, deleted_at)
VALUES
    ('fd6ee6ff-6c60-42b3-af22-d20ce6b079e7', '46896864-fecd-4a68-a19c-a715530100a9', 'WH-ORG-STORE', 'Org Storefront — Jakarta', 'Jl. Sudirman No. 1, Jakarta Selatan', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Tenant product category -------------------------------------------------
INSERT INTO public.prd_categories (uuid, organization_id, name, description, status, created_at, updated_at, deleted_at)
VALUES
    ('406b0756-8c9e-4b16-9ba7-04ad3e7db37b', '46896864-fecd-4a68-a19c-a715530100a9', 'Store Goods', 'Walk-in retail goods for the POS terminal.', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Tenant products (sku stored UPPER, per ProductCreateUseCase normalization) --
INSERT INTO public.prd_products (uuid, organization_id, sku, name, description, category_id, unit_id, base_price, status, created_at, updated_at, deleted_at)
VALUES
    ('a663264d-1342-4507-bbc7-e28ac0626d8e', '46896864-fecd-4a68-a19c-a715530100a9', 'ORG-001', 'Paper Shopping Bag', 'Kraft paper bag with handles.', '406b0756-8c9e-4b16-9ba7-04ad3e7db37b', '64d083d9-bea0-453e-8659-33c726bf93fd', 5000, 'active', NOW(), NOW(), NULL),
    ('66034bc1-4c9e-49ba-9b23-7e4fe5ad02e1', '46896864-fecd-4a68-a19c-a715530100a9', 'ORG-002', 'Ceramic Mug', 'Glazed ceramic mug, 300ml.', '406b0756-8c9e-4b16-9ba7-04ad3e7db37b', '64d083d9-bea0-453e-8659-33c726bf93fd', 45000, 'active', NOW(), NOW(), NULL),
    ('22b794fa-0ae5-462e-8945-2efbf3e1e80e', '46896864-fecd-4a68-a19c-a715530100a9', 'ORG-003', 'Canvas Tote', 'Heavy canvas tote, natural color.', '406b0756-8c9e-4b16-9ba7-04ad3e7db37b', '64d083d9-bea0-453e-8659-33c726bf93fd', 75000, 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Tenant stock (qty_on_hand == final balance_after below) -----------------
INSERT INTO public.wrh_stocks (uuid, organization_id, warehouse_id, product_id, variant_id, qty_on_hand, qty_reserved, status, created_at, updated_at, deleted_at)
VALUES
    ('7d01c7bd-6362-4d6b-a25f-7d50a1dc2513', '46896864-fecd-4a68-a19c-a715530100a9', 'fd6ee6ff-6c60-42b3-af22-d20ce6b079e7', 'a663264d-1342-4507-bbc7-e28ac0626d8e', NULL, 200, 0, 'active', NOW(), NOW(), NULL),
    ('2974e9ef-ee40-4483-8f3c-2428f1a4ef25', '46896864-fecd-4a68-a19c-a715530100a9', 'fd6ee6ff-6c60-42b3-af22-d20ce6b079e7', '66034bc1-4c9e-49ba-9b23-7e4fe5ad02e1', NULL, 100, 0, 'active', NOW(), NOW(), NULL),
    ('70875875-211a-4b14-8d0a-def86e26b236', '46896864-fecd-4a68-a19c-a715530100a9', 'fd6ee6ff-6c60-42b3-af22-d20ce6b079e7', '22b794fa-0ae5-462e-8945-2efbf3e1e80e', NULL, 100, 0, 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Opening receipt movements (append-only ledger, chronological) -----------
INSERT INTO public.wrh_movements (uuid, organization_id, warehouse_id, product_id, variant_id, type, qty, balance_after, ref_type, ref_id, notes, created_at)
VALUES
    ('b9d63e89-23d9-426f-9aef-3fd93979847d', '46896864-fecd-4a68-a19c-a715530100a9', 'fd6ee6ff-6c60-42b3-af22-d20ce6b079e7', 'a663264d-1342-4507-bbc7-e28ac0626d8e', NULL, 'in', 200, 200, 'goods_receipt', NULL, 'POS tenant opening stock', NOW() - INTERVAL '30 days'),
    ('070961d4-9cd1-4288-acbd-e9f3cfd9c3c3', '46896864-fecd-4a68-a19c-a715530100a9', 'fd6ee6ff-6c60-42b3-af22-d20ce6b079e7', '66034bc1-4c9e-49ba-9b23-7e4fe5ad02e1', NULL, 'in', 100, 100, 'goods_receipt', NULL, 'POS tenant opening stock', NOW() - INTERVAL '30 days'),
    ('c0cdd844-abe1-4d8d-bfb9-a8c6b98623e8', '46896864-fecd-4a68-a19c-a715530100a9', 'fd6ee6ff-6c60-42b3-af22-d20ce6b079e7', '22b794fa-0ae5-462e-8945-2efbf3e1e80e', NULL, 'in', 100, 100, 'goods_receipt', NULL, 'POS tenant opening stock', NOW() - INTERVAL '30 days')
ON CONFLICT DO NOTHING;
