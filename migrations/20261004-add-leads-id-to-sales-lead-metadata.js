"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("sales_lead_metadata").catch(() => null);
    if (table && !table.leads_id) {
      await queryInterface.addColumn("sales_lead_metadata", "leads_id", {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
      });
      await queryInterface.addIndex("sales_lead_metadata", ["leads_id"]);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex("sales_lead_metadata", ["leads_id"]);
    } catch {}
    try {
      await queryInterface.removeColumn("sales_lead_metadata", "leads_id");
    } catch {}
  },
};
