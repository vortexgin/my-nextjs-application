"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sass_package", {
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
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      type: {
        type: Sequelize.ENUM("subscription", "transaction", "quota"),
        allowNull: false,
      },
      duration_days: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      duration_description: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      credit_quota: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      actions: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
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

    await queryInterface.addIndex("sass_package", ["type"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sass_package");
  },
};
