"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("base_permissions", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "base_roles", key: "uuid" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      action_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "base_actions", key: "uuid" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
    });

    await queryInterface.addConstraint("base_permissions", {
      fields: ["role_id", "action_id"],
      type: "unique",
      name: "base_permissions_role_action_unique",
    });
    await queryInterface.addIndex("base_permissions", ["action_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("base_permissions");
  },
};
