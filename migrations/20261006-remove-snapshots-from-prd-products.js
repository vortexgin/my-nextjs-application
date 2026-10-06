"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn("prd_products", "unit_snapshot");
    await queryInterface.removeColumn("prd_products", "category_snapshot");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("prd_products", "category_snapshot", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("prd_products", "unit_snapshot", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
  },
};
