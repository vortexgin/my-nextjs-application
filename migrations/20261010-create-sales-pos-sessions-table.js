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
    await queryInterface.createTable("sales_pos_sessions", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      opened_by: { type: Sequelize.UUID, allowNull: false },
      opened_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      closed_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      status: {
        type: Sequelize.ENUM("open", "closed", "auto_closed"),
        allowNull: false,
        defaultValue: "open",
      },
      opening_cash: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      closing_cash: { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
      closing_note: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      notes: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });

    // One active session per (organization, cashier). NULLS NOT DISTINCT
    // keeps the NULL-org scope actually conflicting on re-insert.
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX sales_pos_sessions_org_cashier_open_unique
       ON sales_pos_sessions (organization_id, opened_by) NULLS NOT DISTINCT
       WHERE status = 'open' AND deleted_at IS NULL;`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS sales_pos_sessions_org_cashier_open_unique;");
    await queryInterface.dropTable("sales_pos_sessions");
  },
};
