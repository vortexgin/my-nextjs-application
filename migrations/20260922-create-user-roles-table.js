"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("base_user_roles", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: "base_users", key: "uuid" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "base_roles", key: "uuid" },
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

    await queryInterface.addIndex("base_user_roles", ["role_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("base_user_roles");
  },
};
