"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("prd_product_boms", {
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
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "Parent (assembled) product. Managed nested via product API only.",
      },
      variant_id: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
        comment: "Parent variant scope. NULL = applies to all variants of the product.",
      },
      component_product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      component_variant_id: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "Component units consumed per 1 parent unit issued.",
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
      "CREATE UNIQUE INDEX prd_product_boms_scope_unique ON prd_product_boms (organization_id, product_id, variant_id, component_product_id, component_variant_id) NULLS NOT DISTINCT WHERE deleted_at IS NULL;",
    );
    await queryInterface.addIndex("prd_product_boms", ["product_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("prd_product_boms");
  },
};
