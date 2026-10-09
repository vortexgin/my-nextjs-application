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
    await queryInterface.createTable("sales_pos_transactions", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      session_id: { type: Sequelize.UUID, allowNull: false },
      customer_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      warehouse_id: { type: Sequelize.UUID, allowNull: false },
      payment_method: {
        type: Sequelize.ENUM("cash", "qris", "transfer", "debit_credit"),
        allowNull: false,
      },
      tendered: { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
      change: { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
      subtotal: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      discount_pct: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      grand_total: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      fulfillment: {
        type: Sequelize.ENUM("system", "paper"),
        allowNull: false,
        defaultValue: "system",
      },
      stock_deducted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      receipt_no: { type: Sequelize.STRING(40), allowNull: true, defaultValue: null },
      receipt_channel: {
        type: Sequelize.ENUM("print", "email"),
        allowNull: true,
        defaultValue: null,
      },
      receipt_sent_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      status: {
        type: Sequelize.ENUM("completed", "voided"),
        allowNull: false,
        defaultValue: "completed",
      },
      void_reason: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });

    await queryInterface.createTable("sales_pos_transaction_items", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      transaction_id: { type: Sequelize.UUID, allowNull: false },
      product_id: { type: Sequelize.UUID, allowNull: false },
      variant_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      qty: { type: Sequelize.INTEGER, allowNull: false },
      unit_price: { type: Sequelize.INTEGER, allowNull: false },
      discount_pct: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      line_total: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      ...stamps(Sequelize),
    });

    // Receipt numbers are unique per organization (audit sequence).
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX sales_pos_transactions_org_receipt_unique
       ON sales_pos_transactions (organization_id, receipt_no) NULLS NOT DISTINCT
       WHERE deleted_at IS NULL AND receipt_no IS NOT NULL;`,
    );

    // Billing-gated POS sales must be packageable through the PackageForm
    // UI (which only lists is_transactions actions).
    await queryInterface.sequelize.query(
      `UPDATE base_actions SET is_transactions = true
       WHERE action = 'sales:pos-transaction:create:create' AND deleted_at IS NULL;`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS sales_pos_transactions_org_receipt_unique;");
    await queryInterface.sequelize.query(
      `UPDATE base_actions SET is_transactions = false
       WHERE action = 'sales:pos-transaction:create:create' AND deleted_at IS NULL;`,
    );
    await queryInterface.dropTable("sales_pos_transaction_items");
    await queryInterface.dropTable("sales_pos_transactions");
  },
};
