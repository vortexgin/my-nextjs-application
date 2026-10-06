"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("wrh_movements", {
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
      type: {
        type: Sequelize.ENUM("in", "out", "adjust", "transfer_in", "transfer_out"),
        allowNull: false,
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      balance_after: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ref_type: {
        type: Sequelize.STRING(60),
        allowNull: true,
        defaultValue: null,
      },
      ref_id: {
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
    });

    await queryInterface.addIndex("wrh_movements", ["warehouse_id", "created_at"]);
    await queryInterface.addIndex("wrh_movements", ["product_id", "created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("wrh_movements");
  },
};
