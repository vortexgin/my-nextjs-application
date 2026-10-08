"use strict";

/**
 * Backfills the missing final lead statuses.
 *
 * The lifecycle migration (20261007-alter-sales-lead-statuses-lifecycle)
 * only UPDATEs rows that already exist by name, so organizations seeded
 * before `converted`/`lost` existed ship with zero `is_final` rows: lead
 * conversion keeps the current status name and the board's final-drop
 * popup is unreachable.
 *
 * This migration is idempotent and organization-scoped: for every
 * `organization_id` scope present in the table (including global NULL),
 * it inserts a missing `Converted` (weight 90, final) and `Lost`
 * (weight 100, final), then normalizes weights/flags on conventional
 * names. Re-running it (or re-running seeds) changes nothing.
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    // Normalize conventional rows wherever they already exist.
    await sequelize.query(
      "UPDATE sales_lead_statuses SET weight = 0 WHERE LOWER(name) IN ('new', 'new contact') AND deleted_at IS NULL;",
    );
    await sequelize.query(
      "UPDATE sales_lead_statuses SET weight = 10 WHERE LOWER(name) = 'contacted' AND deleted_at IS NULL;",
    );
    await sequelize.query(
      "UPDATE sales_lead_statuses SET weight = 20 WHERE LOWER(name) = 'qualified' AND deleted_at IS NULL;",
    );
    await sequelize.query(
      "UPDATE sales_lead_statuses SET weight = 90, is_final = true WHERE LOWER(name) = 'converted' AND deleted_at IS NULL;",
    );
    await sequelize.query(
      "UPDATE sales_lead_statuses SET weight = 100, is_final = true WHERE LOWER(name) = 'lost' AND deleted_at IS NULL;",
    );

    const [scopes] = await sequelize.query(
      "SELECT DISTINCT organization_id FROM sales_lead_statuses;",
    );

    // An empty table (fresh DB before seeds) still needs the global pair.
    const targets =
      scopes.length > 0 ? scopes.map((row) => row.organization_id ?? null) : [null];

    for (const organizationId of targets) {
      const [converted] = await sequelize.query(
        `SELECT 1 FROM sales_lead_statuses
          WHERE LOWER(name) = 'converted'
            AND organization_id IS NOT DISTINCT FROM :organizationId
            AND deleted_at IS NULL
          LIMIT 1;`,
        { replacements: { organizationId } },
      );
      if (converted.length === 0) {
        await sequelize.query(
          `INSERT INTO sales_lead_statuses
            (uuid, organization_id, name, description, weight, is_final, status, created_at, updated_at, deleted_at)
          VALUES
            (gen_random_uuid(), :organizationId, 'Converted', 'Lead won and converted to customer', 90, true, 'active', NOW(), NOW(), NULL);`,
          { replacements: { organizationId } },
        );
      }

      const [lost] = await sequelize.query(
        `SELECT 1 FROM sales_lead_statuses
          WHERE LOWER(name) = 'lost'
            AND organization_id IS NOT DISTINCT FROM :organizationId
            AND deleted_at IS NULL
          LIMIT 1;`,
        { replacements: { organizationId } },
      );
      if (lost.length === 0) {
        await sequelize.query(
          `INSERT INTO sales_lead_statuses
            (uuid, organization_id, name, description, weight, is_final, status, created_at, updated_at, deleted_at)
          VALUES
            (gen_random_uuid(), :organizationId, 'Lost', 'Lead lost or disqualified', 100, true, 'active', NOW(), NOW(), NULL);`,
          { replacements: { organizationId } },
        );
      }
    }
  },

  async down() {
    // Data backfill: removing auto-created final stages would strand leads
    // referencing them by name, so down is intentionally a no-op.
  },
};
