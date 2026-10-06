"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("wrh_stocks", {
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
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      variant_id: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
      },
      qty_on_hand: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      qty_reserved: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
      "CREATE UNIQUE INDEX wrh_stocks_scope_unique ON wrh_stocks (organization_id, warehouse_id, product_id, variant_id) NULLS NOT DISTINCT WHERE deleted_at IS NULL;",
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("wrh_stocks");
  },
};
