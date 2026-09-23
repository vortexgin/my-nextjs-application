"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("activity_logs", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      actor: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      operation: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      entity: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      entity_uuid: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
      },
      origin: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      updated: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("activity_logs", ["entity", "created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("activity_logs");
  },
};
