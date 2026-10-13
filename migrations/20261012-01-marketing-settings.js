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
    await queryInterface.addColumn("sass_organization", "timezone", {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: "Asia/Jakarta",
    });

    await queryInterface.createTable("marketing_settings", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      sender_name: { type: Sequelize.STRING(160), allowNull: false },
      sender_email: { type: Sequelize.STRING(160), allowNull: false },
      reply_to_email: { type: Sequelize.STRING(160), allowNull: true, defaultValue: null },
      default_utm_source: { type: Sequelize.STRING(80), allowNull: false, defaultValue: "email" },
      default_utm_medium: { type: Sequelize.STRING(80), allowNull: false, defaultValue: "marketing" },
      default_consent_text: { type: Sequelize.TEXT, allowNull: false, defaultValue: "" },
      status: {
        type: Sequelize.ENUM("active", "inactive", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },
      ...stamps(Sequelize),
    });

    // One non-deleted settings row per organization (NULLS NOT DISTINCT
    // keeps the global scope actually conflicting on re-insert).
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX marketing_settings_org_unique
       ON marketing_settings (organization_id) NULLS NOT DISTINCT
       WHERE deleted_at IS NULL;`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS marketing_settings_org_unique;");
    await queryInterface.dropTable("marketing_settings");
    await queryInterface.removeColumn("sass_organization", "timezone");
  },
};
