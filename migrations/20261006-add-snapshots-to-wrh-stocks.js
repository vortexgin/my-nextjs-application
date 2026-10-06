"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("wrh_stocks", "warehouse_snapshot", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("wrh_stocks", "product_snapshot", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("wrh_stocks", "variant_snapshot", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("wrh_stocks", "variant_snapshot");
    await queryInterface.removeColumn("wrh_stocks", "product_snapshot");
    await queryInterface.removeColumn("wrh_stocks", "warehouse_snapshot");
  },
};
