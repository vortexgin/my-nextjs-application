"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sso_password_resets", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "base_users", key: "uuid" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      email: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      token_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("sso_password_resets", ["user_id"]);
    await queryInterface.addIndex("sso_password_resets", ["expires_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sso_password_resets");
  },
};
