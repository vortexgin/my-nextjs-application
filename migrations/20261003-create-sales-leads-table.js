"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales_leads", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(160),
        allowNull: false,
        unique: true,
      },
      phone_number: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      company: {
        type: Sequelize.STRING(160),
        allowNull: true,
        defaultValue: null,
      },
      source: {
        type: Sequelize.ENUM("website", "referral", "ads", "cold_call", "event", "other"),
        allowNull: false,
        defaultValue: "website",
      },
      status: {
        type: Sequelize.STRING(60),
        allowNull: false,
        defaultValue: "new",
      },
      value: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
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

    await queryInterface.addIndex("sales_leads", ["organization_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sales_leads");
  },
};
