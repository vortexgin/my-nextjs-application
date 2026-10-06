-- Sample data for the warehouse module (app/warehouse) and product BoM
-- (app/product -> prd_product_boms).
--
-- Idempotent: fixed uuid5 UUIDs + ON CONFLICT DO NOTHING on every INSERT, so
-- rerunning is a no-op even after rows have been soft-deleted (the primary key
-- still collides).
--
-- Requires database/seed-product-sample.sql to have been applied first: PRD-001
-- .. PRD-004 and their variants are referenced by SKU subquery, and the seed
-- aborts loudly if they are missing.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed-warehouse-sample.sql
--
-- Everything is organization-less (organization_id NULL) so the unlinked probe
-- login (admin@vortexgin.com) sees it. To scope it to one tenant, replace the
-- NULL organization_id arguments with the tenant's uuid.
--
-- Ledger integrity (asserted by the generator, re-checkable with the queries at
-- the bottom of this file):
--   * balance_after is the running balance per (warehouse, product, variant):
--     in/transfer_in add, out/transfer_out subtract, adjust SETS the absolute
--     counted quantity.
--   * wrh_stocks.qty_on_hand equals the final balance_after of its chain.
--   * every `out` of a product that has a BoM also has component `out` legs
--     carrying ref_type='bom' and ref_id=<parent movement uuid>, matching
--     resolveBomComponents() in insertMovementRow.ts.
--
-- LIMITATION: prd_product_boms.qty is INTEGER (Joi.integer().min(1)), and
-- wrh_movements.qty is INTEGER too, so BoM components are always whole units per
-- parent unit. Fractional recipes ("0.18 kg of fabric per shirt") are NOT
-- representable. The components below are therefore discrete pieces.

-- Guard: abort if the product seed is missing (fail fast, not half-seeded) --
DO $$
BEGIN
  IF (SELECT count(*) FROM public.prd_products WHERE sku LIKE 'PRD-%') < 4 THEN
    RAISE EXCEPTION 'seed-product-sample.sql must run first (fewer than 4 PRD-* products)';
  END IF;
END $$;

-- Raw-material category (components only) ----------------------------------
INSERT INTO public.prd_categories (uuid, organization_id, name, description, status, created_at, updated_at, deleted_at)
VALUES
    ('70281ec9-b3f2-47d5-b039-ad30442cb2c2', NULL, 'Raw Materials', 'Component parts and consumables consumed by a bill of materials.', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Component products (BoM leaves) ------------------------------------------
-- sku stored UPPER, per ProductCreateUseCase normalization
INSERT INTO public.prd_products (uuid, organization_id, sku, name, description, category_id, unit_id, base_price, status, created_at, updated_at, deleted_at)
VALUES
    ('416e79fb-ab49-42bb-9149-e006f62c32f5', NULL, 'CMP-PCB', 'Main PCB Board', 'Rev-C main board, USB + 2.4GHz radio.', '70281ec9-b3f2-47d5-b039-ad30442cb2c2', '64d083d9-bea0-453e-8659-33c726bf93fd', 42000, 'active', NOW(), NOW(), NULL),
    ('55407403-aae3-4c7a-97f5-bbd69591510f', NULL, 'CMP-CELL', 'AA Alkaline Cell', 'Single alkaline cell, 1500mAh.', '70281ec9-b3f2-47d5-b039-ad30442cb2c2', '64d083d9-bea0-453e-8659-33c726bf93fd', 6500, 'active', NOW(), NOW(), NULL),
    ('ddd8da60-6c84-4b8f-8112-bb0481215963', NULL, 'CMP-CELL-OLD', 'AA Alkaline Cell (Legacy)', 'Discontinued 1200mAh cell, kept for BOM history.', '70281ec9-b3f2-47d5-b039-ad30442cb2c2', '64d083d9-bea0-453e-8659-33c726bf93fd', 3000, 'active', NOW(), NOW(), NULL),
    ('2f15be36-a3f8-47c5-9d3a-35502a0bc7f9', NULL, 'CMP-SHELL', 'ABS Shell (Charcoal)', 'Injection-moulded charcoal upper shell.', '70281ec9-b3f2-47d5-b039-ad30442cb2c2', '64d083d9-bea0-453e-8659-33c726bf93fd', 18000, 'active', NOW(), NOW(), NULL),
    ('921bf7a9-85ec-44d4-891e-601530e3b060', NULL, 'CMP-SHELL-RED', 'ABS Shell (Crimson)', 'Injection-moulded crimson upper shell.', '70281ec9-b3f2-47d5-b039-ad30442cb2c2', '64d083d9-bea0-453e-8659-33c726bf93fd', 18000, 'active', NOW(), NOW(), NULL),
    ('d9222b29-47bf-46ed-b970-584c5a670aad', NULL, 'CMP-FABRIC', 'Cotton Fabric Piece', 'Combed cotton, pre-cut 0.5m panel.', '70281ec9-b3f2-47d5-b039-ad30442cb2c2', '64d083d9-bea0-453e-8659-33c726bf93fd', 9500, 'active', NOW(), NOW(), NULL),
    ('07b646a7-df45-406d-9802-c9afe6c56435', NULL, 'CMP-LABEL', 'Care Label (Unbranded)', 'Woven care + origin label.', '70281ec9-b3f2-47d5-b039-ad30442cb2c2', '64d083d9-bea0-453e-8659-33c726bf93fd', 900, 'active', NOW(), NOW(), NULL),
    ('125f54c5-18c5-4818-8d10-54b60951600c', NULL, 'CMP-LABEL-BLK', 'Care Label (Jet Black)', 'Woven care label, black ink.', '70281ec9-b3f2-47d5-b039-ad30442cb2c2', '64d083d9-bea0-453e-8659-33c726bf93fd', 900, 'active', NOW(), NOW(), NULL),
    ('11f8c772-0a59-4c22-a35e-ce2bc9aee8be', NULL, 'CMP-HANG', 'Paper Hang Tag', 'Printed hang tag with barcode.', '70281ec9-b3f2-47d5-b039-ad30442cb2c2', '64d083d9-bea0-453e-8659-33c726bf93fd', 1200, 'active', NOW(), NOW(), NULL),
    ('dff699c5-2e01-4562-8896-c7597521b195', NULL, 'CMP-BAG', 'Vacuum Coffee Bag', 'One-way degassing valve bag, 250g.', '70281ec9-b3f2-47d5-b039-ad30442cb2c2', '64d083d9-bea0-453e-8659-33c726bf93fd', 2100, 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Warehouses -----------------------------------------------------------------
INSERT INTO public.wrh_warehouses (uuid, organization_id, code, name, address, status, created_at, updated_at, deleted_at)
VALUES
    ('49b2333b-c251-4eed-8e45-20b87ed92dc8', NULL, 'WH-MAIN', 'Main Warehouse — Jakarta', 'Jl. Industri No. 12, Jakarta Timur', 'active', NOW(), NOW(), NULL),
    ('7086ce42-7d17-4b87-8e86-de327aad95be', NULL, 'WH-RETAIL', 'Retail Outlet — Bandung', 'Jl. Asia Afrika No. 88, Bandung', 'active', NOW(), NOW(), NULL),
    ('f2e1f6a5-e538-47d6-8ca0-08fd498ef28a', NULL, 'WH-QUAR', 'Quarantine Bay — Surabaya', 'Jl. Rembang No. 5, Surabaya (damaged goods)', 'active', NOW(), NOW(), NULL),
    ('76cdcc4f-7fe4-437d-82af-8942a7227bb6', NULL, 'WH-OLD', 'Old Depot (Closed)', 'Jl.mikro Letjen No. 3, closed 2024-12-31', 'inactive', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Bills of material ----------------------------------------------------------
-- A variant-specific set REPLACES the generic set wholesale (never both), so
-- each variant block below is a complete build, not a patch.
-- The status='inactive' row must never explode into component legs.
INSERT INTO public.prd_product_boms (uuid, organization_id, product_id, variant_id, component_product_id, component_variant_id, qty, status, created_at, updated_at, deleted_at)
VALUES
    ('07b597f2-6b68-44c1-b879-ea85f85f714a', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-001'), NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-PCB'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('2d0572eb-f404-4294-a571-3cb55862b7f2', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-001'), NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-CELL'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('f0242a20-c206-478b-8df3-59abd4123bd2', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-001'), NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-SHELL'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('6caeeaba-61cf-4a06-be11-781fbd9b846e', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-001'), (SELECT uuid FROM public.prd_product_variants WHERE sku = 'PRD-001-RED'), (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-PCB'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('66025b1b-610f-497a-847b-a6d5b737d554', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-001'), (SELECT uuid FROM public.prd_product_variants WHERE sku = 'PRD-001-RED'), (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-CELL'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('cb22b8f1-04a3-4550-b7a9-6408067a7cbb', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-001'), (SELECT uuid FROM public.prd_product_variants WHERE sku = 'PRD-001-RED'), (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-SHELL-RED'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('4dadbcbd-f32e-4f2d-aacf-c3974d007ed5', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-002'), NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-FABRIC'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('a98a93fa-4ebb-49cf-81ea-a5c99353787a', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-002'), NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-LABEL'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('fe4da313-df2c-4c85-888c-f944edb5e4ab', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-002'), NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-HANG'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('fcdfd22d-7d26-4fc0-a056-45b3b38f262a', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-002'), (SELECT uuid FROM public.prd_product_variants WHERE sku = 'PRD-002-BLK'), (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-FABRIC'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('a5c49135-5ffb-4282-ae8a-630ac8c87988', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-002'), (SELECT uuid FROM public.prd_product_variants WHERE sku = 'PRD-002-BLK'), (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-LABEL-BLK'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('75461cf8-d7d8-4794-b09a-cb424249fd9b', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-002'), (SELECT uuid FROM public.prd_product_variants WHERE sku = 'PRD-002-BLK'), (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-HANG'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('fb59b365-470c-4336-910d-a43b3c498d1f', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-003'), NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-BAG'), NULL, 1, 'active', NOW(), NOW(), NULL),
    ('01c9a659-d1f4-4e22-b49e-143c4ad07869', NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'PRD-001'), NULL, (SELECT uuid FROM public.prd_products WHERE sku = 'CMP-CELL-OLD'), NULL, 1, 'inactive', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Stocks (qty_on_hand == final balance_after below) --------------------------
-- CMP-* leaves are held as stock so BoM component `out` legs can draw on them.
-- WH-RETAIL / PRD-001 carries a synthetic qty_reserved=2 purely so the LOW
-- badge and filter[low_only] have a sample to render (no reservation table in V1).
INSERT INTO public.wrh_stocks (uuid, organization_id, warehouse_id, product_id, variant_id, qty_on_hand, qty_reserved, status, created_at, updated_at, deleted_at)
VALUES
    ('494192f6-1712-45bc-a437-a53883987dd8', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '07b646a7-df45-406d-9802-c9afe6c56435', NULL, 488, 0, 'active', NOW(), NOW(), NULL),
    ('81342bf1-822c-412b-9e07-5fde1591d9bc', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '11f8c772-0a59-4c22-a35e-ce2bc9aee8be', NULL, 484, 0, 'active', NOW(), NOW(), NULL),
    ('2dfff397-ce9f-4617-a054-7725c0c3c328', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '125f54c5-18c5-4818-8d10-54b60951600c', NULL, 116, 0, 'active', NOW(), NOW(), NULL),
    ('1835d50b-ae95-4c25-b46a-fb423419a5e5', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '1a53aeb7-3ebc-4045-9a15-86bf4d6fb7c6', NULL, 45, 0, 'active', NOW(), NOW(), NULL),
    ('9b034911-ad0a-4dae-88af-c4c5f2d5c86f', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '2f15be36-a3f8-47c5-9d3a-35502a0bc7f9', NULL, 440, 0, 'active', NOW(), NOW(), NULL),
    ('3a575ec1-fec7-403c-8148-40a634df3fb1', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '416e79fb-ab49-42bb-9149-e006f62c32f5', NULL, 405, 0, 'active', NOW(), NOW(), NULL),
    ('c0be643f-ac5a-4455-ae69-f88c44e980a8', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '55407403-aae3-4c7a-97f5-bbd69591510f', NULL, 535, 0, 'active', NOW(), NOW(), NULL),
    ('78104dd4-7c4b-4a6d-b8fb-82298bfdd015', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 94, 0, 'active', NOW(), NOW(), NULL),
    ('45138b07-7324-43f2-92c0-6cfab093af49', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', 'd670ef45-5d7b-43e4-94e1-404c456122da', 35, 0, 'active', NOW(), NOW(), NULL),
    ('afdd99bc-4ec1-431b-8a5b-bebb7fb92c01', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '814772c4-bcfa-434e-b896-01bf033b5160', NULL, 13, 0, 'active', NOW(), NOW(), NULL),
    ('41f82fea-b76f-4de6-9aaa-e47695b7521a', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '921bf7a9-85ec-44d4-891e-601530e3b060', NULL, 85, 0, 'active', NOW(), NOW(), NULL),
    ('631227fb-934f-4be1-856c-03cc061d0023', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', NULL, 68, 0, 'active', NOW(), NOW(), NULL),
    ('0c958426-9bbd-4ac5-a228-1e69844e2d56', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11622370-5920-48d8-8c31-2a5935a79ae1', 27, 0, 'active', NOW(), NOW(), NULL),
    ('f97eff91-9b00-47a8-8660-a6a0763dff85', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11ceaaf8-a901-4764-8640-23ec23f6655b', 31, 0, 'active', NOW(), NOW(), NULL),
    ('379376e4-fd7f-4d5c-9b1a-f5054f280483', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'd9222b29-47bf-46ed-b970-584c5a670aad', NULL, 390, 0, 'active', NOW(), NOW(), NULL),
    ('86cdc84d-9b78-478a-be5f-d9f0a9a2b091', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'ddd8da60-6c84-4b8f-8112-bb0481215963', NULL, 60, 0, 'active', NOW(), NOW(), NULL),
    ('358bf7c5-fb38-4c04-a769-619d2a35346b', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'dff699c5-2e01-4562-8896-c7597521b195', NULL, 185, 0, 'active', NOW(), NOW(), NULL),
    ('67f158fb-a4a9-4b5a-8949-62f450e112d3', NULL, 'f2e1f6a5-e538-47d6-8ca0-08fd498ef28a', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11622370-5920-48d8-8c31-2a5935a79ae1', 3, 0, 'active', NOW(), NOW(), NULL),
    ('904babef-bfaa-4d5f-b31f-57c7a0211766', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '2f15be36-a3f8-47c5-9d3a-35502a0bc7f9', NULL, 55, 0, 'active', NOW(), NOW(), NULL),
    ('759ac651-4604-4403-90ec-a7f5a3e22e6b', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '416e79fb-ab49-42bb-9149-e006f62c32f5', NULL, 55, 0, 'active', NOW(), NOW(), NULL),
    ('bcd675ca-4f5e-41ca-9280-00a2e62b1a51', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '55407403-aae3-4c7a-97f5-bbd69591510f', NULL, 75, 0, 'active', NOW(), NOW(), NULL),
    ('2b85df50-4916-4b56-9513-8ca7a84f1b1a', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 11, 11, 'active', NOW(), NOW(), NULL),
    ('cccdb93c-43b2-4792-9724-04dc3490f40a', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '921bf7a9-85ec-44d4-891e-601530e3b060', NULL, 20, 0, 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Movements (append-only ledger, chronological) ------------------------------
-- %d rows: opening receipts, sale `out`s with their BoM component legs,
-- one main->retail transfer pair, one retail->main transfer pair, absolute
-- stocktake/damage `adjust`s, and a quarantine intake + write-off.
INSERT INTO public.wrh_movements (uuid, organization_id, warehouse_id, product_id, variant_id, type, qty, balance_after, ref_type, ref_id, notes, created_at)
VALUES
    ('23b44f95-5673-4f76-8a87-58d849517898', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '416e79fb-ab49-42bb-9149-e006f62c32f5', NULL, 'in', 300, 300, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '60 days'),
    ('fb3c4a0b-9759-440d-9097-c24441998623', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '55407403-aae3-4c7a-97f5-bbd69591510f', NULL, 'in', 400, 400, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '60 days'),
    ('c50908d7-3793-49bb-8ba8-6365666dece4', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'ddd8da60-6c84-4b8f-8112-bb0481215963', NULL, 'in', 60, 60, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '60 days'),
    ('4a22ca9c-52eb-4c6e-8a29-3ffade0da602', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '2f15be36-a3f8-47c5-9d3a-35502a0bc7f9', NULL, 'in', 350, 350, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '60 days'),
    ('2280e9a1-3b9b-4f29-8856-78615776e88c', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '921bf7a9-85ec-44d4-891e-601530e3b060', NULL, 'in', 90, 90, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '60 days'),
    ('68c932a6-00e9-408a-9151-f8773a497b47', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'd9222b29-47bf-46ed-b970-584c5a670aad', NULL, 'in', 260, 260, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '60 days'),
    ('ebd062e5-00cd-46e8-85ed-d0bd8c153f7b', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '07b646a7-df45-406d-9802-c9afe6c56435', NULL, 'in', 500, 500, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '60 days'),
    ('ea7feb9a-8a9a-4faa-b2b1-13c503f28964', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '125f54c5-18c5-4818-8d10-54b60951600c', NULL, 'in', 120, 120, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '60 days'),
    ('c2282d2d-e0c8-4151-9ea8-a87431263c76', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '11f8c772-0a59-4c22-a35e-ce2bc9aee8be', NULL, 'in', 500, 500, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '60 days'),
    ('f1f15545-40c0-4cb0-a786-f91995042ee1', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'dff699c5-2e01-4562-8896-c7597521b195', NULL, 'in', 200, 200, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '60 days'),
    ('711de938-2fdc-41b6-a558-b78e3c592f2f', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 'in', 120, 120, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '55 days'),
    ('79143995-9944-43ed-9b7f-0514e1e41377', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', 'd670ef45-5d7b-43e4-94e1-404c456122da', 'in', 40, 40, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '55 days'),
    ('c2d8cd0e-99e3-4d37-8210-0610ae5c2f9b', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', NULL, 'in', 80, 80, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '55 days'),
    ('d8c16a4a-4364-485b-aad3-08b910c6de8e', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11ceaaf8-a901-4764-8640-23ec23f6655b', 'in', 35, 35, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '55 days'),
    ('17282462-b8de-408c-acaf-45d3d3ccbe23', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11622370-5920-48d8-8c31-2a5935a79ae1', 'in', 30, 30, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '55 days'),
    ('a1448925-4baf-4a26-8c15-e9f0824906b2', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '1a53aeb7-3ebc-4045-9a15-86bf4d6fb7c6', NULL, 'in', 60, 60, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '55 days'),
    ('26b90cb9-ffc1-4648-afd5-f6aa561a993c', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '814772c4-bcfa-434e-b896-01bf033b5160', NULL, 'in', 15, 15, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '55 days'),
    ('c6f7982e-e1db-42f1-bb65-2abe86fa40b3', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '416e79fb-ab49-42bb-9149-e006f62c32f5', NULL, 'in', 60, 60, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '50 days'),
    ('1fb86b1e-ab5c-4567-9e25-c2e70b1f99e0', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '55407403-aae3-4c7a-97f5-bbd69591510f', NULL, 'in', 80, 80, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '50 days'),
    ('659cd23b-7544-4ef2-aadb-155fc8f730b0', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '2f15be36-a3f8-47c5-9d3a-35502a0bc7f9', NULL, 'in', 60, 60, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '50 days'),
    ('07ddbc5f-b502-472f-a0a6-fb49563300cd', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '921bf7a9-85ec-44d4-891e-601530e3b060', NULL, 'in', 20, 20, 'goods_receipt', NULL, 'Opening stock, goods receipt', NOW() - INTERVAL '50 days'),
    ('d5ac33b3-77aa-43a2-9975-d2c589a0ce64', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 'out', 10, 110, 'sale', NULL, NULL, NOW() - INTERVAL '40 days'),
    ('4de50a01-06e9-40e6-8894-98771d0b8559', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '416e79fb-ab49-42bb-9149-e006f62c32f5', NULL, 'out', 10, 290, 'bom', 'd5ac33b3-77aa-43a2-9975-d2c589a0ce64', NULL, NOW() - INTERVAL '40 days'),
    ('e6e4c661-f3d2-4711-b9a5-215776b46a84', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '55407403-aae3-4c7a-97f5-bbd69591510f', NULL, 'out', 10, 390, 'bom', 'd5ac33b3-77aa-43a2-9975-d2c589a0ce64', NULL, NOW() - INTERVAL '40 days'),
    ('940a352a-c6d3-446f-9d2c-6e35a2ebcfd6', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '2f15be36-a3f8-47c5-9d3a-35502a0bc7f9', NULL, 'out', 10, 340, 'bom', 'd5ac33b3-77aa-43a2-9975-d2c589a0ce64', NULL, NOW() - INTERVAL '40 days'),
    ('064eba89-0110-4861-80f0-4a4ecb6dfced', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', 'd670ef45-5d7b-43e4-94e1-404c456122da', 'out', 5, 35, 'sale', NULL, NULL, NOW() - INTERVAL '38 days'),
    ('034d2ee4-d9de-4552-928e-cf6fcee578ba', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '416e79fb-ab49-42bb-9149-e006f62c32f5', NULL, 'out', 5, 285, 'bom', '064eba89-0110-4861-80f0-4a4ecb6dfced', NULL, NOW() - INTERVAL '38 days'),
    ('f924dcdb-9571-475e-a4ac-6d1366bd2cc5', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '55407403-aae3-4c7a-97f5-bbd69591510f', NULL, 'out', 5, 385, 'bom', '064eba89-0110-4861-80f0-4a4ecb6dfced', NULL, NOW() - INTERVAL '38 days'),
    ('f7959b8a-0168-4481-8193-1a3fc2400dec', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '921bf7a9-85ec-44d4-891e-601530e3b060', NULL, 'out', 5, 85, 'bom', '064eba89-0110-4861-80f0-4a4ecb6dfced', NULL, NOW() - INTERVAL '38 days'),
    ('45ea5a55-d98a-4ac4-9b76-56a6b629c801', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', NULL, 'out', 12, 68, 'sale', NULL, NULL, NOW() - INTERVAL '36 days'),
    ('b6337e22-9ecd-453d-8738-59ebb7fdb768', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'd9222b29-47bf-46ed-b970-584c5a670aad', NULL, 'out', 12, 248, 'bom', '45ea5a55-d98a-4ac4-9b76-56a6b629c801', NULL, NOW() - INTERVAL '36 days'),
    ('5c40cb4e-f1e0-446f-b31e-360b56ac96d2', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '07b646a7-df45-406d-9802-c9afe6c56435', NULL, 'out', 12, 488, 'bom', '45ea5a55-d98a-4ac4-9b76-56a6b629c801', NULL, NOW() - INTERVAL '36 days'),
    ('88d2c25b-e8ad-46c1-a521-e8aba07751e9', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '11f8c772-0a59-4c22-a35e-ce2bc9aee8be', NULL, 'out', 12, 488, 'bom', '45ea5a55-d98a-4ac4-9b76-56a6b629c801', NULL, NOW() - INTERVAL '36 days'),
    ('71606c00-280b-4c47-b42c-3f98d42d5767', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11ceaaf8-a901-4764-8640-23ec23f6655b', 'out', 4, 31, 'sale', NULL, NULL, NOW() - INTERVAL '34 days'),
    ('0214bbdb-a897-438e-93de-cdaa783ba4e2', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'd9222b29-47bf-46ed-b970-584c5a670aad', NULL, 'out', 4, 244, 'bom', '71606c00-280b-4c47-b42c-3f98d42d5767', NULL, NOW() - INTERVAL '34 days'),
    ('2a6f9e09-4b9b-486e-94e0-894c30b1883d', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '125f54c5-18c5-4818-8d10-54b60951600c', NULL, 'out', 4, 116, 'bom', '71606c00-280b-4c47-b42c-3f98d42d5767', NULL, NOW() - INTERVAL '34 days'),
    ('e9c50ea8-1a53-4b0d-8478-08a6f5f44807', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '11f8c772-0a59-4c22-a35e-ce2bc9aee8be', NULL, 'out', 4, 484, 'bom', '71606c00-280b-4c47-b42c-3f98d42d5767', NULL, NOW() - INTERVAL '34 days'),
    ('200a6641-616d-4f0e-a093-adbf38b8e135', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '1a53aeb7-3ebc-4045-9a15-86bf4d6fb7c6', NULL, 'out', 15, 45, 'sale', NULL, NULL, NOW() - INTERVAL '32 days'),
    ('8c0482f4-585a-41b7-8f82-7b1ed8aaa2e1', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'dff699c5-2e01-4562-8896-c7597521b195', NULL, 'out', 15, 185, 'bom', '200a6641-616d-4f0e-a093-adbf38b8e135', NULL, NOW() - INTERVAL '32 days'),
    ('94314356-33d9-4c09-aae7-b475fbbacc31', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '814772c4-bcfa-434e-b896-01bf033b5160', NULL, 'out', 2, 13, 'sale', NULL, NULL, NOW() - INTERVAL '30 days'),
    ('ccad3dd8-ae29-4b9f-8e2d-5786fa88b3a1', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 'transfer_out', 20, 90, NULL, 'ab3ed1dc-9a0e-4684-9315-0abbcd7fda61', 'Rebalance to Bandung outlet', NOW() - INTERVAL '28 days'),
    ('6b28967e-77e3-4378-b1b5-fbf1765b15b5', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 'transfer_in', 20, 20, NULL, 'ab3ed1dc-9a0e-4684-9315-0abbcd7fda61', 'Rebalance to Bandung outlet', NOW() - INTERVAL '28 days'),
    ('77fa441e-cc18-4a44-9b15-7b4dc434b907', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 'out', 5, 15, 'sale', NULL, NULL, NOW() - INTERVAL '25 days'),
    ('27d172a3-83b0-4a65-8479-d6d447033228', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '416e79fb-ab49-42bb-9149-e006f62c32f5', NULL, 'out', 5, 55, 'bom', '77fa441e-cc18-4a44-9b15-7b4dc434b907', NULL, NOW() - INTERVAL '25 days'),
    ('128dffa4-26df-4cc4-bac9-4702ec8f8988', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '55407403-aae3-4c7a-97f5-bbd69591510f', NULL, 'out', 5, 75, 'bom', '77fa441e-cc18-4a44-9b15-7b4dc434b907', NULL, NOW() - INTERVAL '25 days'),
    ('05f0a9a6-fc1e-4d89-a7ad-a86888446c51', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '2f15be36-a3f8-47c5-9d3a-35502a0bc7f9', NULL, 'out', 5, 55, 'bom', '77fa441e-cc18-4a44-9b15-7b4dc434b907', NULL, NOW() - INTERVAL '25 days'),
    ('05bb476f-a1d6-45ba-9b02-a98cdc32c0e5', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'd9222b29-47bf-46ed-b970-584c5a670aad', NULL, 'adjust', 240, 240, 'stocktake', NULL, 'Quarterly stocktake — 2 panels water damaged', NOW() - INTERVAL '22 days'),
    ('ff20eca6-b9f6-48a4-8aa2-937bb50ec6a2', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11622370-5920-48d8-8c31-2a5935a79ae1', 'adjust', 27, 27, 'stocktake', NULL, 'Quarterly stocktake — 3 units shrink-tagged', NOW() - INTERVAL '22 days'),
    ('3f89165b-24ed-449a-aa45-5ee4925e156c', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '416e79fb-ab49-42bb-9149-e006f62c32f5', NULL, 'in', 120, 405, 'goods_receipt', NULL, 'Supplier restock, PO-2024/0918', NOW() - INTERVAL '18 days'),
    ('8d8b49e0-c365-43bf-8e8e-5d91051672e9', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '55407403-aae3-4c7a-97f5-bbd69591510f', NULL, 'in', 150, 535, 'goods_receipt', NULL, 'Supplier restock, PO-2024/0918', NOW() - INTERVAL '18 days'),
    ('b33d09a9-7bd8-416f-825e-af86ae721417', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '2f15be36-a3f8-47c5-9d3a-35502a0bc7f9', NULL, 'in', 100, 440, 'goods_receipt', NULL, 'Supplier restock, PO-2024/0918', NOW() - INTERVAL '18 days'),
    ('f428fd26-125f-4446-89ca-d19483424290', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', 'd9222b29-47bf-46ed-b970-584c5a670aad', NULL, 'in', 150, 390, 'goods_receipt', NULL, 'Supplier restock, PO-2024/0918', NOW() - INTERVAL '18 days'),
    ('f8a616a5-1758-461b-933d-679042aaae74', NULL, 'f2e1f6a5-e538-47d6-8ca0-08fd498ef28a', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11622370-5920-48d8-8c31-2a5935a79ae1', 'in', 8, 8, 'return', NULL, 'Customer return awaiting inspection', NOW() - INTERVAL '12 days'),
    ('af50f33b-bff5-40e2-984e-b3cf56c1f075', NULL, 'f2e1f6a5-e538-47d6-8ca0-08fd498ef28a', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11622370-5920-48d8-8c31-2a5935a79ae1', 'adjust', 3, 3, 'damage', NULL, 'Water damage in transit — written off', NOW() - INTERVAL '11 days'),
    ('837bc8ed-fce1-4e8d-b553-c9bc3335362f', NULL, '7086ce42-7d17-4b87-8e86-de327aad95be', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 'transfer_out', 4, 11, NULL, '8b664209-a527-4cf6-94a1-6540d74f6e03', 'Unsold stock returned to main', NOW() - INTERVAL '8 days'),
    ('37559b6d-a32c-4941-8a8a-a67fa633c45a', NULL, '49b2333b-c251-4eed-8e45-20b87ed92dc8', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 'transfer_in', 4, 94, NULL, '8b664209-a527-4cf6-94a1-6540d74f6e03', 'Unsold stock returned to main', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- Verification queries (run after seeding; all four must return 0 rows) ------
--
-- 1. Stock disagrees with the end of its own movement chain:
-- SELECT s.uuid, s.qty_on_hand, last.balance_after
--   FROM wrh_stocks s
--   LEFT JOIN LATERAL (
--     SELECT balance_after FROM wrh_movements m
--      WHERE m.warehouse_id = s.warehouse_id AND m.product_id = s.product_id
--        AND m.variant_id IS NOT DISTINCT FROM s.variant_id
--      ORDER BY m.created_at DESC, m.uuid DESC LIMIT 1
--   ) last ON true
--  WHERE s.deleted_at IS NULL AND s.qty_on_hand <> last.balance_after;
--
-- 2. A movement chain dips below zero at any point:
-- SELECT warehouse_id, product_id, variant_id, created_at, qty, balance_after
--   FROM (SELECT m.*, SUM(CASE WHEN type IN ('in','transfer_in') THEN qty
--                               WHEN type IN ('out','transfer_out') THEN -qty
--                               ELSE 0 END) OVER (
--           PARTITION BY warehouse_id, product_id, variant_id
--           ORDER BY created_at, uuid ROWS UNBOUNDED PRECEDING) AS running
--           FROM wrh_movements m) t
--  WHERE running < 0;
--
-- 3. An `out` with a live BoM that produced no component legs:
-- SELECT DISTINCT m.uuid FROM wrh_movements m
--   JOIN prd_product_boms b ON b.product_id = m.product_id AND b.deleted_at IS NULL
--  WHERE m.type = 'out' AND m.ref_type IS DISTINCT FROM 'bom'
--    AND NOT EXISTS (SELECT 1 FROM wrh_movements c
--                     WHERE c.ref_id = m.uuid AND c.ref_type = 'bom');
--
-- 4. BoM component legs without a matching parent `out`:
-- SELECT c.uuid FROM wrh_movements c
--  WHERE c.ref_type = 'bom'
--    AND NOT EXISTS (SELECT 1 FROM wrh_movements p WHERE p.uuid = c.ref_id);
--