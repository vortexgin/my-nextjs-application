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
    await queryInterface.createTable("marketing_events", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      campaign_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      campaign_run_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      message_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      provider_event_id: { type: Sequelize.STRING(200), allowNull: true, defaultValue: null },
      event_type: { type: Sequelize.STRING(60), allowNull: false },
      normalized_email: { type: Sequelize.STRING(160), allowNull: true, defaultValue: null },
      payload_summary: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      ...stamps(Sequelize),
    });

    // Provider event IDs are unique for replay protection.
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX marketing_events_provider_event_unique
       ON marketing_events (provider_event_id) NULLS NOT DISTINCT
       WHERE deleted_at IS NULL AND provider_event_id IS NOT NULL;`,
    );

    await queryInterface.createTable("marketing_tracked_links", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      campaign_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      campaign_run_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      message_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      token_hash: { type: Sequelize.STRING(128), allowNull: false },
      destination_url: { type: Sequelize.STRING(2000), allowNull: false },
      ...stamps(Sequelize),
    });

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX marketing_tracked_links_token_unique
       ON marketing_tracked_links (token_hash) NULLS NOT DISTINCT
       WHERE deleted_at IS NULL;`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS marketing_tracked_links_token_unique;");
    await queryInterface.dropTable("marketing_tracked_links");
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS marketing_events_provider_event_unique;");
    await queryInterface.dropTable("marketing_events");
  },
};
