"use strict";

// F-08: PostgreSQL treats NULLs as distinct inside unique indexes, so the
// (organization_id, name) indexes from 20261004-unique-sales-master-names do
// not stop duplicate global (NULL organization) rows under concurrency.
// NULLS NOT DISTINCT (PG 15+) closes the gap. Note the placement: it is an
// index-wide option AFTER the column list — per-column
// `(name NULLS NOT DISTINCT)` is a syntax error.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS sales_lead_statuses_org_name_unique;");
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX sales_lead_statuses_org_name_unique ON sales_lead_statuses (organization_id, name) NULLS NOT DISTINCT WHERE deleted_at IS NULL;",
    );
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS sales_lead_metadata_fields_org_name_unique;");
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX sales_lead_metadata_fields_org_name_unique ON sales_lead_metadata_fields (organization_id, name) NULLS NOT DISTINCT WHERE deleted_at IS NULL;",
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS sales_lead_statuses_org_name_unique;");
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX sales_lead_statuses_org_name_unique ON sales_lead_statuses (organization_id, name) WHERE deleted_at IS NULL;",
    );
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS sales_lead_metadata_fields_org_name_unique;");
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX sales_lead_metadata_fields_org_name_unique ON sales_lead_metadata_fields (organization_id, name) WHERE deleted_at IS NULL;",
    );
  },
};
