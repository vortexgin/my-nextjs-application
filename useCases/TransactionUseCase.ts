import { UserModel } from "@/app/base/models/UserModel";
import {
  recordActivityLog,
  type ActivityActor,
  type ActivityOperation,
} from "@/app/base/models/ActivityLogModel";

/**
 * Baseline for transaction-gated use cases (billing + activity log).
 * Extracted from UserCreateUseCase so future sass-module use cases
 * reuse the same flow instead of copying it.
 *
 * Pattern:
 *   preExec:  const billing = await checkTransaction(actor, "<domain>:<entity>:<action>:<scope>");
 *             return { input: validated, actor: actor ?? null, ...billing };
 *   postExec: await settleTransaction({
 *               actor: context?.actor ?? null,
 *               operation: "create", // or "update" | "delete"
 *               entity: "<entity>",
 *               entity_uuid: result.uuid,
 *               origin: beforeData ?? null,
 *               updated: result,
 *               billing: context ?? null,
 *             });
 *
 * Context shape for subclasses:
 *   type XxxContext = { input: XxxInput; actor: ActivityActor } & TransactionBilling;
 */
export type TransactionBilling = {
  isTransaction: boolean;
  credit: number | null;
  /** Running invoice instance (sass module), null when billing is absent/open. */
  invoice: any | null;
};

export type SettleTransactionInput = {
  actor?: ActivityActor;
  operation: ActivityOperation;
  entity: string;
  entity_uuid?: string | null;
  origin?: Record<string, unknown> | null;
  updated?: Record<string, unknown> | null;
  billing?: TransactionBilling | null;
};

/**
 * preExec step: billing gate. Resolves the actor's running invoice and
 * the matched package-action credit. Throws ForbiddenException on
 * denial; returns open billing ({ isTransaction: false, ...null })
 * when the sass billing module is absent.
 */
export async function checkTransaction(
  actor: unknown,
  actionString: string,
): Promise<TransactionBilling> {
  return UserModel.checkActiveInvoiceAndPackage(actor, actionString);
}

/**
 * postExec step: consumes one credit on the running invoice for
 * quota/transaction packages (atomic increment, never throws), then
 * records the activity log with the credit payload (fire-and-forget,
 * same convention as other use cases).
 */
export async function settleTransaction(input: SettleTransactionInput): Promise<void> {
  const billing = input.billing ?? { isTransaction: false, credit: null, invoice: null };
  const invoice = billing.invoice ?? null;
  const credit = billing.credit ?? null;
  const packageType = invoice?.package?.type ?? null;

  if (
    invoice &&
    typeof credit === "number" &&
    (packageType === "quota" || packageType === "transaction")
  ) {
    try {
      await invoice.increment("credit_usage", { by: credit });
    } catch (error) {
      console.error("Failed to update invoice credit usage.", error);
    }
  }

  void recordActivityLog({
    actor: input.actor ?? null,
    operation: input.operation,
    entity: input.entity,
    entity_uuid: input.entity_uuid ?? null,
    origin: input.origin ?? null,
    updated: input.updated ?? null,
    credit,
    is_transaction: billing.isTransaction ?? false,
  });
}
