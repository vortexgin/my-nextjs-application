import type { DocumentType } from "@/app/base/models/DocumentTemplateModel";

export type TemplateContract = {
  requiredScalars: string[];
  optionalScalars: string[];
  collections: Record<string, string[]>;
};

const common = [
  "document.uuid", "document.number", "document.type", "document.status", "document.created_at", "document.created_date",
  "organization.id", "organization.name", "generated.at", "generated.by", "generated.locale", "generated.timezone", "notes",
];
const customer = ["customer.id", "customer.name"];
const warehouse = ["warehouse.id", "warehouse.code", "warehouse.name"];
const totals = ["totals.subtotal", "totals.discount_pct", "totals.grand_total"];
const pricedItems = ["no", "product_id", "product_sku", "product_name", "variant_id", "variant_sku", "variant_name", "qty", "unit_price", "discount_pct", "line_total", "notes"];
const deliveryItems = ["no", "product_id", "product_sku", "product_name", "variant_id", "variant_sku", "variant_name", "qty"];
const metadata = ["no", "name", "value"];

export const TEMPLATE_CONTRACTS: Record<DocumentType, TemplateContract> = {
  purchase_request: {
    requiredScalars: ["document.number", "document.status"],
    optionalScalars: [...common, ...customer, ...warehouse, ...totals],
    collections: { items: pricedItems, metadata },
  },
  sales_order: {
    requiredScalars: ["document.number", "document.status"],
    optionalScalars: [...common, ...customer, ...warehouse, ...totals, "purchase_request.id", "purchase_request.number", "purchase_request.status"],
    collections: { items: pricedItems, metadata },
  },
  delivery_order: {
    requiredScalars: ["document.number", "document.status"],
    optionalScalars: [...common, ...customer, ...warehouse, "document.fulfillment", "document.stock_deducted", "sales_order.id", "sales_order.number", "sales_order.status"],
    collections: { items: deliveryItems, metadata },
  },
  stock_report: {
    requiredScalars: ["report.title", "report.total_rows"],
    optionalScalars: [
      "report.title", "report.generated_at", "report.generated_by", "report.total_rows",
      "organization.id", "organization.name", "generated.at", "generated.by", "generated.locale", "generated.timezone",
      "filters.query", "filters.warehouse", "filters.product", "filters.variant", "filters.low_only",
    ],
    collections: {
      stocks: ["no", "warehouse_id", "warehouse_code", "warehouse_name", "product_id", "product_sku", "product_name", "variant_id", "variant_sku", "variant_name", "qty_on_hand", "qty_reserved", "qty_available", "status", "updated_at"],
    },
  },
};

export function allowedTemplatePlaceholder(documentType: DocumentType, name: string): boolean {
  if (/^custom\.[a-z][a-z0-9_]{0,49}$/.test(name)) return true;
  const contract = TEMPLATE_CONTRACTS[documentType];
  if (contract.requiredScalars.includes(name) || contract.optionalScalars.includes(name)) return true;
  return Object.entries(contract.collections).some(([collection, fields]) =>
    name === `#${collection}` || name === `/${collection}` || fields.includes(name.slice(collection.length + 1)) && name.startsWith(`${collection}.`),
  );
}
