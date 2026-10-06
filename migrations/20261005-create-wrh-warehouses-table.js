"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("wrh_warehouses", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
      },
      code: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(255),
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

    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX wrh_warehouses_org_code_unique ON wrh_warehouses (organization_id, code) NULLS NOT DISTINCT WHERE deleted_at IS NULL;",
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("wrh_warehouses");
  },
};
