"use strict";

function stamps(Sequelize) {
  return {
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    deleted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
  };
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("marketing_contact_preferences", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      normalized_email: { type: Sequelize.STRING(160), allowNull: false },
      status: {
        type: Sequelize.ENUM("opted_in", "opted_out", "suppressed"),
        allowNull: false,
        defaultValue: "opted_in",
      },
      consent_source: {
        type: Sequelize.ENUM("form", "import", "manual", "system"),
        allowNull: false,
        defaultValue: "manual",
      },
      consent_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      consent_evidence: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      unsubscribed_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      suppression_reason: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      last_import_batch_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      created_by: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      updated_by: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX marketing_contact_preferences_org_email_unique
       ON marketing_contact_preferences (organization_id, normalized_email) NULLS NOT DISTINCT
       WHERE deleted_at IS NULL;`,
    );

    await queryInterface.createTable("marketing_consent_import_batches", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      imported_by: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      source: { type: Sequelize.STRING(160), allowNull: false, defaultValue: "" },
      row_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      updated_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      skipped_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM("completed", "failed"),
        allowNull: false,
        defaultValue: "completed",
      },
      ...stamps(Sequelize),
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS marketing_contact_preferences_org_email_unique;");
    await queryInterface.dropTable("marketing_consent_import_batches");
    await queryInterface.dropTable("marketing_contact_preferences");
  },
};
