"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales_lead_activities", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      leads_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      pic: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      meeting_start: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      meeting_end: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      attachment: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    });

    await queryInterface.addIndex("sales_lead_activities", ["leads_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sales_lead_activities");
  },
};
