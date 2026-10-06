"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn("wrh_movements", "variant_snapshot");
    await queryInterface.removeColumn("wrh_movements", "product_snapshot");
    await queryInterface.removeColumn("wrh_movements", "warehouse_snapshot");
  },

  async down(queryInterface, Sequelize) {
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
};
