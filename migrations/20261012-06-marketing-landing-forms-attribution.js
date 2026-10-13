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
    await queryInterface.createTable("marketing_landing_pages", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      campaign_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      form_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      name: { type: Sequelize.STRING(160), allowNull: false },
      organization_slug: { type: Sequelize.STRING(120), allowNull: false },
      slug: { type: Sequelize.STRING(120), allowNull: false },
      title: { type: Sequelize.STRING(200), allowNull: false },
      seo_description: { type: Sequelize.STRING(300), allowNull: true, defaultValue: null },
      content: { type: Sequelize.JSONB, allowNull: false, defaultValue: { blocks: [] } },
      status: {
        type: Sequelize.ENUM("draft", "published", "unpublished", "deleted"),
        allowNull: false,
        defaultValue: "draft",
      },
      published_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX marketing_landing_pages_org_slug_unique
       ON marketing_landing_pages (organization_id, organization_slug, slug) NULLS NOT DISTINCT
       WHERE deleted_at IS NULL;`,
    );

    await queryInterface.createTable("marketing_forms", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      name: { type: Sequelize.STRING(160), allowNull: false },
      fields: { type: Sequelize.JSONB, allowNull: false, defaultValue: { fields: [] } },
      consent_text: { type: Sequelize.TEXT, allowNull: false, defaultValue: "" },
      success_message: { type: Sequelize.STRING(500), allowNull: false, defaultValue: "" },
      redirect_url: { type: Sequelize.STRING(2000), allowNull: true, defaultValue: null },
      status: {
        type: Sequelize.ENUM("active", "inactive", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },
      ...stamps(Sequelize),
    });

    await queryInterface.createTable("marketing_form_submissions", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      form_id: { type: Sequelize.UUID, allowNull: false },
      landing_page_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      campaign_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      lead_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      sanitized_data: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      consent_snapshot: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      visitor_id: { type: Sequelize.STRING(120), allowNull: true, defaultValue: null },
      utm_snapshot: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      submitted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable("marketing_attributions", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      visitor_id: { type: Sequelize.STRING(120), allowNull: true, defaultValue: null },
      normalized_email: { type: Sequelize.STRING(160), allowNull: true, defaultValue: null },
      campaign_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      campaign_run_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      landing_page_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      lead_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      customer_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      touch_type: {
        type: Sequelize.ENUM("first", "last"),
        allowNull: false,
      },
      source: { type: Sequelize.STRING(80), allowNull: false, defaultValue: "" },
      medium: { type: Sequelize.STRING(80), allowNull: false, defaultValue: "" },
      campaign_value: { type: Sequelize.STRING(160), allowNull: false, defaultValue: "" },
      touch_event_type: {
        type: Sequelize.ENUM("click", "landing_view", "form_submit"),
        allowNull: false,
      },
      touched_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("marketing_attributions");
    await queryInterface.dropTable("marketing_form_submissions");
    await queryInterface.dropTable("marketing_forms");
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS marketing_landing_pages_org_slug_unique;");
    await queryInterface.dropTable("marketing_landing_pages");
  },
};
