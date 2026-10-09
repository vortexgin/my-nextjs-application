import DocumentTemplateModelFactory, { DocumentTemplateModel, type DocumentType } from "@/app/base/models/DocumentTemplateModel";
import { UserModel } from "@/app/base/models/UserModel";
import type { ActivityActor } from "@/app/base/models/ActivityLogModel";
import UnprocessableEntityException from "@/exceptions/UnprocessableEntityException";

export async function resolvePdfActor(actor: ActivityActor): Promise<{
  actor: ActivityActor;
  actorUuid: string | null;
  actorName: string;
  organizationId: string | null;
  organizationName: string;
}> {
  const raw = actor as Record<string, unknown> | null;
  const actorUuid = typeof raw?.uuid === "string" ? raw.uuid : null;
  const organization = actorUuid ? await UserModel.resolveOrganization(actorUuid) : null;
  return {
    actor,
    actorUuid,
    actorName: typeof raw?.name === "string" && raw.name ? raw.name : actorUuid ?? "—",
    organizationId: organization?.uuid ?? null,
    organizationName: organization?.name ?? organization?.uuid ?? "—",
  };
}

export async function activePdfTemplate(documentType: DocumentType, organizationId: string | null): Promise<DocumentTemplateModel> {
  await DocumentTemplateModelFactory();
  const row = await DocumentTemplateModel.findOne({ where: { organization_id: organizationId, document_type: documentType, status: "active", deleted_at: null } });
  if (!row) {
    const label = documentType.replaceAll("_", " ");
    throw new UnprocessableEntityException(`No active ${label} PDF template is configured for this organization.`);
  }
  return row;
}

export function generatedParameters(input: { actorName: string; organizationId: string | null; organizationName: string; locale: string; timezone: string; custom: Record<string, string>; now?: Date }) {
  const now = input.now ?? new Date();
  return {
    organization: { id: input.organizationId ?? "—", name: input.organizationName },
    generated: { at: now.toISOString(), by: input.actorName, locale: input.locale, timezone: input.timezone },
    custom: input.custom,
  };
}
