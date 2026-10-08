"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales_doc_metadata_fields", {
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
      name: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      description: {
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

    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX sales_doc_metadata_fields_org_name_unique ON sales_doc_metadata_fields (organization_id, name) NULLS NOT DISTINCT WHERE deleted_at IS NULL;",
    );
    await queryInterface.addIndex("sales_doc_metadata_fields", ["organization_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sales_doc_metadata_fields");
  },
};
