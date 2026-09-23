"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("menus", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      icon: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      parent: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
        references: { model: "menus", key: "uuid" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      menu: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      action_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "actions", key: "uuid" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      redirection: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },
      weight: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex("menus", ["action_id"]);
    await queryInterface.addIndex("menus", ["parent"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("menus");
  },
};
