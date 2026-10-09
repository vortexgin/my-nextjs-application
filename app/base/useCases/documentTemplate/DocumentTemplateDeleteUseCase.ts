import Joi from "joi";
import DocumentTemplateModelFactory, { DocumentTemplateModel, type DocumentTemplate } from "@/app/base/models/DocumentTemplateModel";
import { recordActivityLog, type ActivityActor } from "@/app/base/models/ActivityLogModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";
import { resolveTemplateOrganization } from "@/app/base/useCases/documentTemplate/documentTemplateScope";

type Context = { row: DocumentTemplateModel; actor: ActivityActor; before: DocumentTemplate };
export class DocumentTemplateDeleteUseCase extends BaseUseCase<string, boolean, Context> {
  protected async preExec(uuid: string, actor?: ActivityActor): Promise<Context> {
    await this.validate(Joi.object({ uuid: Joi.string().uuid({ version: "uuidv4" }).required() }), { uuid });
    const organizationId = await resolveTemplateOrganization(actor ?? null);
    await DocumentTemplateModelFactory();
    const row = await DocumentTemplateModel.findOne({ where: { uuid, organization_id: organizationId, deleted_at: null } });
    if (!row) throw new NotFoundException("Document template not found.");
    return { row, actor: actor ?? null, before: DocumentTemplateModel.toApi(row.toJSON()) };
  }
  protected async execute(context: Context): Promise<boolean> {
    await context.row.update({ status: "deleted", deleted_at: new Date(), updated_at: new Date() });
    return true;
  }
  protected async postExec(result: boolean, context?: Context): Promise<boolean> {
    void recordActivityLog({ actor: context?.actor ?? null, operation: "delete", entity: "document_template", entity_uuid: context?.row.uuid ?? "", origin: context?.before as any, updated: null });
    return super.postExec(result, context);
  }
}
