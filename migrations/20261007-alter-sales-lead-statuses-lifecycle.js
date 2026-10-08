"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("sales_lead_statuses", "weight", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("sales_lead_statuses", "is_final", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Backfill the conventional pipeline by name; anything else keeps weight 0.
    await queryInterface.sequelize.query(
      "UPDATE sales_lead_statuses SET weight = 10 WHERE LOWER(name) = 'contacted' AND deleted_at IS NULL;",
    );
    await queryInterface.sequelize.query(
      "UPDATE sales_lead_statuses SET weight = 20 WHERE LOWER(name) = 'qualified' AND deleted_at IS NULL;",
    );
    await queryInterface.sequelize.query(
      "UPDATE sales_lead_statuses SET weight = 90, is_final = true WHERE LOWER(name) = 'converted' AND deleted_at IS NULL;",
    );
    await queryInterface.sequelize.query(
      "UPDATE sales_lead_statuses SET weight = 100, is_final = true WHERE LOWER(name) = 'lost' AND deleted_at IS NULL;",
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("sales_lead_statuses", "is_final");
    await queryInterface.removeColumn("sales_lead_statuses", "weight");
  },
};
