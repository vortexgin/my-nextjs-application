import Joi from "joi";
import DocumentTemplateModelFactory, { type DocumentTemplate } from "@/app/base/models/DocumentTemplateModel";
import type { ActivityActor } from "@/app/base/models/ActivityLogModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";
import { resolveTemplateOrganization } from "@/app/base/useCases/documentTemplate/documentTemplateScope";

export class DocumentTemplateGetUseCase extends BaseUseCase<string, DocumentTemplate, { uuid: string; organizationId: string | null }> {
  protected async preExec(uuid: string, actor?: ActivityActor) {
    const value = await this.validate<{ uuid: string }>(Joi.object({ uuid: Joi.string().uuid({ version: "uuidv4" }).required() }), { uuid });
    return { uuid: value.uuid, organizationId: await resolveTemplateOrganization(actor ?? null) };
  }
  protected async execute(context: { uuid: string; organizationId: string | null }): Promise<DocumentTemplate> {
    const Model = await DocumentTemplateModelFactory();
    const row = await Model.findOne({ where: { uuid: context.uuid, organization_id: context.organizationId, deleted_at: null } });
    if (!row) throw new NotFoundException("Document template not found.");
    return Model.toApi(row.toJSON());
  }
}
