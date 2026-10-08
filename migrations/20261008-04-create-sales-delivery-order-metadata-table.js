"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales_delivery_order_metadata", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      sales_delivery_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "sales_delivery_orders", key: "uuid" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      sales_doc_metadata_field_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "sales_doc_metadata_fields", key: "uuid" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
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

    await queryInterface.addIndex("sales_delivery_order_metadata", ["sales_delivery_order_id"]);
    await queryInterface.addIndex("sales_delivery_order_metadata", ["sales_doc_metadata_field_id"]);
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX sales_delivery_order_metadata_parent_field_unique ON sales_delivery_order_metadata (sales_delivery_order_id, sales_doc_metadata_field_id) NULLS NOT DISTINCT WHERE deleted_at IS NULL;",
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sales_delivery_order_metadata");
  },
};
