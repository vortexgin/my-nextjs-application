"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("sass_invoice", "sales_order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("sass_invoice", "sales_order_number", {
      type: Sequelize.STRING(60),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("sass_invoice", "sales_order_number");
    await queryInterface.removeColumn("sass_invoice", "sales_order_id");
  },
};
