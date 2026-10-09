"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("sales_pos_transactions", "tax_pct", {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("sales_pos_transactions", "tax_amount", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("sales_pos_transactions", "card_last_four", {
      type: Sequelize.STRING(4),
      allowNull: true,
      defaultValue: null,
    });

    // Preserve historical sales as untaxed; new records default to 10%.
    await queryInterface.changeColumn("sales_pos_transactions", "tax_pct", {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 10,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("sales_pos_transactions", "card_last_four");
    await queryInterface.removeColumn("sales_pos_transactions", "tax_amount");
    await queryInterface.removeColumn("sales_pos_transactions", "tax_pct");
  },
};
