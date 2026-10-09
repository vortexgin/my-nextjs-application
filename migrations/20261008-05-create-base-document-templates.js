"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("base_document_templates", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      document_type: {
        type: Sequelize.ENUM("purchase_request", "sales_order", "delivery_order", "stock_report"),
        allowNull: false,
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      google_doc_id: { type: Sequelize.STRING(255), allowNull: false },
      status: {
        type: Sequelize.ENUM("active", "inactive", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
    });
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX base_document_templates_org_type_unique ON base_document_templates (organization_id, document_type) NULLS NOT DISTINCT WHERE deleted_at IS NULL;",
    );
    await queryInterface.addIndex("base_document_templates", ["organization_id"]);
    await queryInterface.addIndex("base_document_templates", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("base_document_templates");
  },
};
