"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex("sales_lead_statuses", ["organization_id", "name"], {
      name: "sales_lead_statuses_org_name_unique",
      unique: true,
      where: { deleted_at: null },
    });
    await queryInterface.addIndex("sales_lead_metadata_fields", ["organization_id", "name"], {
      name: "sales_lead_metadata_fields_org_name_unique",
      unique: true,
      where: { deleted_at: null },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("sales_lead_metadata_fields", "sales_lead_metadata_fields_org_name_unique");
    await queryInterface.removeIndex("sales_lead_statuses", "sales_lead_statuses_org_name_unique");
  },
};
