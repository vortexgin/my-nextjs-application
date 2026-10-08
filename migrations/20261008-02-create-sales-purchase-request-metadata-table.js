"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales_purchase_request_metadata", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      purchase_request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "sales_purchase_requests", key: "uuid" },
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

    await queryInterface.addIndex("sales_purchase_request_metadata", ["purchase_request_id"]);
    await queryInterface.addIndex("sales_purchase_request_metadata", ["sales_doc_metadata_field_id"]);
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX sales_purchase_request_metadata_pr_field_unique ON sales_purchase_request_metadata (purchase_request_id, sales_doc_metadata_field_id) NULLS NOT DISTINCT WHERE deleted_at IS NULL;",
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sales_purchase_request_metadata");
  },
};
