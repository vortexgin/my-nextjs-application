"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("wrh_movements", "warehouse_snapshot", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("wrh_movements", "product_snapshot", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("wrh_movements", "variant_snapshot", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("wrh_movements", "variant_snapshot");
    await queryInterface.removeColumn("wrh_movements", "product_snapshot");
    await queryInterface.removeColumn("wrh_movements", "warehouse_snapshot");
  },
};
