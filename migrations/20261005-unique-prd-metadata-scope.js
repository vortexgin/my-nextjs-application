"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX prd_product_metadata_scope_unique ON prd_product_metadata (product_id, variant_id, product_metadata_field_id) NULLS NOT DISTINCT WHERE deleted_at IS NULL;",
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS prd_product_metadata_scope_unique;");
  },
};
