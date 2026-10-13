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
    await queryInterface.createTable("marketing_segments", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      name: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      contact_scope: {
        type: Sequelize.ENUM("leads", "customers", "both"),
        allowNull: false,
        defaultValue: "both",
      },
      rules: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      status: {
        type: Sequelize.ENUM("active", "inactive", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },
      ...stamps(Sequelize),
    });

    await queryInterface.createTable("marketing_templates", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      name: { type: Sequelize.STRING(160), allowNull: false },
      subject: { type: Sequelize.STRING(255), allowNull: false },
      preview_text: { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
      html_body: { type: Sequelize.TEXT, allowNull: false },
      text_body: { type: Sequelize.TEXT, allowNull: false },
      status: {
        type: Sequelize.ENUM("active", "inactive", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },
      ...stamps(Sequelize),
    });

    await queryInterface.createTable("marketing_campaigns", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      name: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      objective: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      template_id: { type: Sequelize.UUID, allowNull: false },
      segment_id: { type: Sequelize.UUID, allowNull: false },
      owner_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      status: {
        type: Sequelize.ENUM("draft", "scheduled", "running", "paused", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      scheduled_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      budget: { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
      utm_source: { type: Sequelize.STRING(80), allowNull: false, defaultValue: "email" },
      utm_medium: { type: Sequelize.STRING(80), allowNull: false, defaultValue: "marketing" },
      utm_campaign: { type: Sequelize.STRING(160), allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("marketing_campaigns");
    await queryInterface.dropTable("marketing_templates");
    await queryInterface.dropTable("marketing_segments");
  },
};
