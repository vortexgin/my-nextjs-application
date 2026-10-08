"use strict";

/**
 * Flags the billing-gated sales actions as packageable transactions so
 * they can be attached to a quota/transaction package through the
 * PackageForm UI (which only lists `is_transactions` actions). The
 * server already accepts any action id in a package; without these
 * flags SO-create and DO-ship billing can only be wired via SQL/API.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE base_actions
        SET is_transactions = true
        WHERE action IN (
          'sales:sales-order:create:create',
          'sales:delivery-order:view:ship',
          'base:user:create:create'
        )
        AND deleted_at IS NULL;`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE base_actions
        SET is_transactions = false
        WHERE action IN (
          'sales:sales-order:create:create',
          'sales:delivery-order:view:ship'
        )
        AND deleted_at IS NULL;`,
    );
  },
};
