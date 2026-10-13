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
    await queryInterface.createTable("marketing_campaign_runs", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      campaign_id: { type: Sequelize.UUID, allowNull: false },
      status: {
        type: Sequelize.ENUM("preparing", "queued", "running", "paused", "completed", "cancelled", "billing_exhausted", "failed"),
        allowNull: false,
        defaultValue: "preparing",
      },
      organization_timezone: { type: Sequelize.STRING(100), allowNull: false, defaultValue: "Asia/Jakarta" },
      sender_snapshot: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      template_snapshot: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      utm_snapshot: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      segment_rules_snapshot: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      audience_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      eligible_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      excluded_counts: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      campaign_billed_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      initiated_by: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      started_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      completed_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });

    await queryInterface.createTable("marketing_campaign_members", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      campaign_run_id: { type: Sequelize.UUID, allowNull: false },
      normalized_email: { type: Sequelize.STRING(160), allowNull: false },
      contact_type: {
        type: Sequelize.ENUM("lead", "customer"),
        allowNull: false,
      },
      lead_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      customer_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      name_snapshot: { type: Sequelize.STRING(160), allowNull: false, defaultValue: "" },
      email_snapshot: { type: Sequelize.STRING(160), allowNull: false, defaultValue: "" },
      company_snapshot: { type: Sequelize.STRING(160), allowNull: true, defaultValue: null },
      consent_snapshot: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      status: {
        type: Sequelize.ENUM("eligible", "excluded", "queued", "accepted", "delivered", "failed", "cancelled"),
        allowNull: false,
        defaultValue: "eligible",
      },
      exclusion_reason: { type: Sequelize.STRING(160), allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });

    // One member row per normalized email per run (deduplicated audience).
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX marketing_campaign_members_run_email_unique
       ON marketing_campaign_members (campaign_run_id, normalized_email) NULLS NOT DISTINCT
       WHERE deleted_at IS NULL;`,
    );

    await queryInterface.createTable("marketing_messages", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      campaign_run_id: { type: Sequelize.UUID, allowNull: false },
      campaign_member_id: { type: Sequelize.UUID, allowNull: false },
      provider: { type: Sequelize.STRING(40), allowNull: false, defaultValue: "mailgun" },
      provider_message_id: { type: Sequelize.STRING(160), allowNull: true, defaultValue: null },
      idempotency_key: { type: Sequelize.STRING(160), allowNull: false },
      status: {
        type: Sequelize.ENUM("queued", "processing", "accepted", "delivered", "soft_bounced", "hard_bounced", "complained", "failed", "cancelled"),
        allowNull: false,
        defaultValue: "queued",
      },
      attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      next_attempt_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      accepted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      delivered_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      recipient_billed_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      last_error_code: { type: Sequelize.STRING(80), allowNull: true, defaultValue: null },
      last_error_summary: { type: Sequelize.STRING(500), allowNull: true, defaultValue: null },
      processing_started_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX marketing_messages_idempotency_unique
       ON marketing_messages (idempotency_key) NULLS NOT DISTINCT
       WHERE deleted_at IS NULL;`,
    );

    await queryInterface.createTable("marketing_message_attempts", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      message_id: { type: Sequelize.UUID, allowNull: false },
      attempt_no: { type: Sequelize.INTEGER, allowNull: false },
      outcome: {
        type: Sequelize.ENUM("accepted", "transient_failure", "permanent_failure", "billing_blocked"),
        allowNull: false,
      },
      provider_message_id: { type: Sequelize.STRING(160), allowNull: true, defaultValue: null },
      error_code: { type: Sequelize.STRING(80), allowNull: true, defaultValue: null },
      error_summary: { type: Sequelize.STRING(500), allowNull: true, defaultValue: null },
      attempted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS marketing_messages_idempotency_unique;");
    await queryInterface.dropTable("marketing_message_attempts");
    await queryInterface.dropTable("marketing_messages");
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS marketing_campaign_members_run_email_unique;");
    await queryInterface.dropTable("marketing_campaign_members");
    await queryInterface.dropTable("marketing_campaign_runs");
  },
};
