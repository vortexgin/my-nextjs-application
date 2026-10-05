-- Sample data for the product module (app/product).
--
-- Idempotent: every INSERT is ON CONFLICT DO NOTHING, rerun freely.
-- All rows are organization-less (organization_id NULL), so the unlinked
-- probe login (admin@vortexgin.com) sees them; stock/promo modules only
-- reference product_id / variant_id from here.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed-product-sample.sql

-- Units ---------------------------------------------------------------
INSERT INTO public.prd_units (uuid, organization_id, name, symbol, status, created_at, updated_at, deleted_at)
VALUES
    ('64d083d9-bea0-453e-8659-33c726bf93fd', NULL, 'Piece', 'pcs', 'active', NOW(), NOW(), NULL),
    ('b03fd725-1477-4547-98af-25d4445ccb24', NULL, 'Box', 'box', 'active', NOW(), NOW(), NULL),
    ('b261913d-8e96-460a-90ec-68b3db35369e', NULL, 'Kilogram', 'kg', 'active', NOW(), NOW(), NULL),
    ('691f3f87-9744-4931-895b-3bd645c83d4f', NULL, 'Liter', 'L', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Categories ----------------------------------------------------------
INSERT INTO public.prd_categories (uuid, organization_id, name, description, status, created_at, updated_at, deleted_at)
VALUES
    ('5c2f904e-1f9c-4e42-84e4-4de0157d8955', NULL, 'Electronics', 'Gadgets, accessories, and computer peripherals.', 'active', NOW(), NOW(), NULL),
    ('d211a78a-0158-49bb-996a-a1bedebc418b', NULL, 'Apparel', 'Clothing and wearable goods.', 'active', NOW(), NOW(), NULL),
    ('0bc2cd63-b14c-44a0-9d4a-d29836d970da', NULL, 'Food & Beverage', 'Consumable goods and pantry staples.', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Metadata fields -----------------------------------------------------
INSERT INTO public.prd_product_metadata_fields (uuid, organization_id, name, description, status, created_at, updated_at, deleted_at)
VALUES
    ('32b825e7-42a8-4e74-b304-77630084d61e', NULL, 'Color', 'Product colorway, e.g. Jet Black.', 'active', NOW(), NOW(), NULL),
    ('b70d1e0b-92c6-4608-a17c-5c4478ec4edf', NULL, 'Size', 'Size label, e.g. M or 42.', 'active', NOW(), NOW(), NULL),
    ('087c9d7b-0f8e-4f53-9173-900c486d4a05', NULL, 'Material', 'Primary material, e.g. 100% combed cotton.', 'active', NOW(), NOW(), NULL),
    ('f5b3cb79-0351-42dd-9791-7fcb4880a413', NULL, 'Warranty', 'Warranty terms, e.g. 12 months official warranty.', 'active', NOW(), NOW(), NULL),
    ('191edf94-dd4b-4a27-b7db-9c81c71e3e1a', NULL, 'Origin', 'Origin of goods, e.g. Gayo Highlands.', 'active', NOW(), NOW(), NULL),
    ('162e8e31-ceb5-4ed3-9e2d-d0c036134543', NULL, 'Roast Level', 'Coffee roast level, e.g. Medium Dark.', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Products (sku stored UPPER, per ProductCreateUseCase normalization) --
INSERT INTO public.prd_products (uuid, organization_id, sku, name, description, category_id, unit_id, base_price, status, created_at, updated_at, deleted_at)
VALUES
    ('5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 'PRD-001', 'Wireless Mouse', 'Ergonomic 2.4GHz wireless mouse with silent clicks.', '5c2f904e-1f9c-4e42-84e4-4de0157d8955', '64d083d9-bea0-453e-8659-33c726bf93fd', 150000, 'active', NOW(), NOW(), NULL),
    ('9e97c15e-7a7f-4dde-8b55-e693abe29da5', NULL, 'PRD-002', 'Classic Cotton T-Shirt', 'Everyday tee in combed cotton, unisex fit.', 'd211a78a-0158-49bb-996a-a1bedebc418b', '64d083d9-bea0-453e-8659-33c726bf93fd', 99000, 'active', NOW(), NOW(), NULL),
    ('1a53aeb7-3ebc-4045-9a15-86bf4d6fb7c6', NULL, 'PRD-003', 'Arabica Coffee Beans', 'Single-origin arabica beans, roasted weekly.', '0bc2cd63-b14c-44a0-9d4a-d29836d970da', 'b261913d-8e96-460a-90ec-68b3db35369e', 185000, 'active', NOW(), NOW(), NULL),
    ('814772c4-bcfa-434e-b896-01bf033b5160', NULL, 'PRD-004', 'Legacy USB Keyboard', 'Discontinued wired keyboard, kept for status-filter demos.', '5c2f904e-1f9c-4e42-84e4-4de0157d8955', '64d083d9-bea0-453e-8659-33c726bf93fd', 75000, 'inactive', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Variants (organization_id denormalized from parent, immutable) ------
INSERT INTO public.prd_product_variants (uuid, product_id, organization_id, sku, name, price_override, status, created_at, updated_at, deleted_at)
VALUES
    ('11ceaaf8-a901-4764-8640-23ec23f6655b', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', NULL, 'PRD-002-BLK', 'T-Shirt Black M', NULL, 'active', NOW(), NOW(), NULL),
    ('11622370-5920-48d8-8c31-2a5935a79ae1', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', NULL, 'PRD-002-WHT', 'T-Shirt White L', 109000, 'active', NOW(), NOW(), NULL),
    ('d670ef45-5d7b-43e4-94e1-404c456122da', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 'PRD-001-RED', 'Wireless Mouse Crimson Red', 165000, 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Metadata (product scope: variant_id NULL; variant scope: set) ------
INSERT INTO public.prd_product_metadata (uuid, product_id, variant_id, product_metadata_field_id, value, status, created_at, updated_at, deleted_at)
VALUES
    ('9501ff75-8deb-4402-b473-88fa733e177e', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, '32b825e7-42a8-4e74-b304-77630084d61e', 'Jet Black', 'active', NOW(), NOW(), NULL),
    ('68fba009-1d43-44bd-a9ec-ad6945942d68', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', NULL, 'f5b3cb79-0351-42dd-9791-7fcb4880a413', '12 months official warranty', 'active', NOW(), NOW(), NULL),
    ('dc646984-177b-4396-bad1-af62f7fc0670', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', NULL, '087c9d7b-0f8e-4f53-9173-900c486d4a05', '100% combed cotton', 'active', NOW(), NOW(), NULL),
    ('088f428e-5383-4e3f-984e-93dd5698afa8', '1a53aeb7-3ebc-4045-9a15-86bf4d6fb7c6', NULL, '191edf94-dd4b-4a27-b7db-9c81c71e3e1a', 'Gayo Highlands', 'active', NOW(), NOW(), NULL),
    ('caaaeef5-c3b1-4eb0-a5c0-3b6af3283048', '1a53aeb7-3ebc-4045-9a15-86bf4d6fb7c6', NULL, '162e8e31-ceb5-4ed3-9e2d-d0c036134543', 'Medium Dark', 'active', NOW(), NOW(), NULL),
    ('3e65dd36-7c43-4736-992e-ccac64065867', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11ceaaf8-a901-4764-8640-23ec23f6655b', '32b825e7-42a8-4e74-b304-77630084d61e', 'Black', 'active', NOW(), NOW(), NULL),
    ('81813e80-9288-4963-8055-cbcaba64c878', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11ceaaf8-a901-4764-8640-23ec23f6655b', 'b70d1e0b-92c6-4608-a17c-5c4478ec4edf', 'M', 'active', NOW(), NOW(), NULL),
    ('e31424be-c17c-47f1-b043-4784715646ef', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11622370-5920-48d8-8c31-2a5935a79ae1', '32b825e7-42a8-4e74-b304-77630084d61e', 'White', 'active', NOW(), NOW(), NULL),
    ('04cdacdb-0274-4481-bdb0-7ac06d04c115', '9e97c15e-7a7f-4dde-8b55-e693abe29da5', '11622370-5920-48d8-8c31-2a5935a79ae1', 'b70d1e0b-92c6-4608-a17c-5c4478ec4edf', 'L', 'active', NOW(), NOW(), NULL),
    ('e8bd6691-2297-41c0-8a8b-d3e4a9e187a8', '5d6a7ff9-d4b9-4e0e-a70c-d3b1ebc0f117', 'd670ef45-5d7b-43e4-94e1-404c456122da', '32b825e7-42a8-4e74-b304-77630084d61e', 'Crimson Red', 'active', NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;
