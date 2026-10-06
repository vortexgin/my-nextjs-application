"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn("sales_leads", "assignee_snapshot");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("sales_leads", "assignee_snapshot", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
  },
};
