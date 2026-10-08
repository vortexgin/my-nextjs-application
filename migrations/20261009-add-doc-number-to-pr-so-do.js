"use strict";

// Document numbering for PR/SO/DO: {PR|SO|DO}/YYYY/{roman MM}/{5-digit seq}.
// Sequence is per (organization, type, year-month); uniqueness per
// organization is enforced by partial unique indexes below. Existing rows are
// backfilled in created_at order and their sequence rows seeded so future
// creates continue correctly.

function romanMonth(month) {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][month - 1];
}

async function backfill(queryInterface, table, type) {
  const rows = await queryInterface.sequelize.query(
    `SELECT uuid, organization_id, created_at FROM ${table} WHERE deleted_at IS NULL AND doc_number IS NULL ORDER BY created_at ASC, uuid ASC`,
    { type: queryInterface.sequelize.QueryTypes.SELECT },
  );
  const counters = new Map();
  for (const row of rows) {
    const created = new Date(row.created_at);
    const ym = `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, "0")}`;
    const orgKey = row.organization_id ?? "-";
    const key = `${orgKey}|${ym}`;
    const seq = (counters.get(key) ?? 0) + 1;
    counters.set(key, seq);
    const docNumber = `${type}/${created.getUTCFullYear()}/${romanMonth(created.getUTCMonth() + 1)}/${String(seq).padStart(5, "0")}`;
    await queryInterface.sequelize.query(
      `UPDATE ${table} SET doc_number = :docNumber, updated_at = NOW() WHERE uuid = :uuid`,
      { replacements: { docNumber, uuid: row.uuid } },
    );
    await queryInterface.sequelize.query(
      `INSERT INTO sales_doc_sequences (uuid, organization_id, doc_type, year_month, last_number, created_at, updated_at)
       VALUES (gen_random_uuid(), :orgId, :docType, :ym, :seq, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      { replacements: { orgId: row.organization_id, docType: type, ym, seq } },
    );
    // ON CONFLICT DO NOTHING skips when a higher month row raced; keep max.
    await queryInterface.sequelize.query(
      `UPDATE sales_doc_sequences SET last_number = GREATEST(last_number, :seq), updated_at = NOW()
       WHERE organization_id IS NOT DISTINCT FROM :orgId AND doc_type = :docType AND year_month = :ym`,
      { replacements: { orgId: row.organization_id, docType: type, ym, seq } },
    );
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const existingTables = (await queryInterface.sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
      { type: queryInterface.sequelize.QueryTypes.SELECT },
));
    const tableNames = new Set(existingTables.map((row) => row.tablename));
    const existingIndexes = (await queryInterface.sequelize.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname = 'public'",
      { type: queryInterface.sequelize.QueryTypes.SELECT },
));
    const indexNames = new Set(existingIndexes.map((row) => row.indexname));

    if (!tableNames.has("sales_doc_sequences")) {
      await queryInterface.createTable("sales_doc_sequences", {
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
        organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
        doc_type: { type: Sequelize.STRING(10), allowNull: false },
        year_month: { type: Sequelize.CHAR(7), allowNull: false },
        last_number: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });
    }
    // Bare ON CONFLICT DO NOTHING + IS NOT DISTINCT FROM matching keep the
    // generator race-safe including NULL organizations. NULLS NOT DISTINCT
    // makes the NULL-org sequence row actually conflict on re-insert.
    if (!indexNames.has("sales_doc_sequences_org_type_ym_unique")) {
      await queryInterface.sequelize.query(
        "CREATE UNIQUE INDEX sales_doc_sequences_org_type_ym_unique ON sales_doc_sequences (organization_id, doc_type, year_month) NULLS NOT DISTINCT;",
      );
    }

    for (const table of ["sales_purchase_requests", "sales_orders", "sales_delivery_orders"]) {
      const columns = await queryInterface.describeTable(table);
      if (!columns.doc_number) {
        await queryInterface.addColumn(table, "doc_number", {
          type: Sequelize.STRING(40),
          allowNull: true,
          defaultValue: null,
        });
      }
    }
    const docIndexes = [
      ["sales_purchase_requests_org_doc_unique", "sales_purchase_requests"],
      ["sales_orders_org_doc_unique", "sales_orders"],
      ["sales_delivery_orders_org_doc_unique", "sales_delivery_orders"],
    ];
    for (const [indexName, table] of docIndexes) {
      if (!indexNames.has(indexName)) {
        await queryInterface.sequelize.query(
          `CREATE UNIQUE INDEX ${indexName} ON ${table} (organization_id, doc_number) NULLS NOT DISTINCT WHERE deleted_at IS NULL AND doc_number IS NOT NULL;`,
        );
      }
    }

    await backfill(queryInterface, "sales_purchase_requests", "PR");
    await backfill(queryInterface, "sales_orders", "SO");
    await backfill(queryInterface, "sales_delivery_orders", "DO");
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS sales_doc_sequences_org_type_ym_unique;");
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS sales_delivery_orders_org_doc_unique;");
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS sales_orders_org_doc_unique;");
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS sales_purchase_requests_org_doc_unique;");
    for (const table of ["sales_delivery_orders", "sales_orders", "sales_purchase_requests"]) {
      await queryInterface.removeColumn(table, "doc_number");
    }
    await queryInterface.dropTable("sales_doc_sequences");
  },
};
