import Joi from "joi";
import DocumentTemplateModelFactory, { DocumentTemplateModel, type DocumentTemplate, type UpdateDocumentTemplateInput } from "@/app/base/models/DocumentTemplateModel";
import { recordActivityLog, type ActivityActor } from "@/app/base/models/ActivityLogModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";
import { normalizeGoogleDocumentId } from "@/libraries/google/GoogleDocumentId";
import { resolveTemplateOrganization } from "@/app/base/useCases/documentTemplate/documentTemplateScope";

const schema = Joi.object({ name: Joi.string().trim().min(2).max(160).optional(), google_doc_id: Joi.string().trim().max(500).optional(), status: Joi.string().valid("active", "inactive").optional() }).unknown(false).min(1);
type Context = { row: DocumentTemplateModel; input: UpdateDocumentTemplateInput; actor: ActivityActor; before: DocumentTemplate };
export class DocumentTemplateUpdateUseCase extends BaseUseCase<string, DocumentTemplate, Context> {
  protected async preExec(uuid: string, input: UpdateDocumentTemplateInput, actor?: ActivityActor): Promise<Context> {
    await this.validate(Joi.object({ uuid: Joi.string().uuid({ version: "uuidv4" }).required() }), { uuid });
    const validated = await this.validate<UpdateDocumentTemplateInput>(schema, input);
    if (validated.google_doc_id) validated.google_doc_id = normalizeGoogleDocumentId(validated.google_doc_id);
    const organizationId = await resolveTemplateOrganization(actor ?? null);
    await DocumentTemplateModelFactory();
    const row = await DocumentTemplateModel.findOne({ where: { uuid, organization_id: organizationId, deleted_at: null } });
    if (!row) throw new NotFoundException("Document template not found.");
    return { row, input: validated, actor: actor ?? null, before: DocumentTemplateModel.toApi(row.toJSON()) };
  }
  protected async execute(context: Context): Promise<DocumentTemplate> {
    await context.row.update({ ...context.input, updated_at: new Date() });
    return DocumentTemplateModel.toApi(context.row.toJSON());
  }
  protected async postExec(result: DocumentTemplate, context?: Context): Promise<DocumentTemplate> {
    void recordActivityLog({ actor: context?.actor ?? null, operation: "update", entity: "document_template", entity_uuid: result.uuid, origin: context?.before as any, updated: result as any });
    return super.postExec(result, context);
  }
}
