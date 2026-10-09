import { randomUUID } from "crypto";
import Joi from "joi";
import { UniqueConstraintError } from "sequelize";
import DocumentTemplateModelFactory, { DocumentTemplateModel, DOCUMENT_TYPES, type CreateDocumentTemplateInput, type DocumentTemplate } from "@/app/base/models/DocumentTemplateModel";
import { recordActivityLog, type ActivityActor } from "@/app/base/models/ActivityLogModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import DuplicateEntityException from "@/exceptions/DuplicateEntityException";
import { normalizeGoogleDocumentId } from "@/libraries/google/GoogleDocumentId";
import { resolveTemplateOrganization } from "@/app/base/useCases/documentTemplate/documentTemplateScope";

const schema = Joi.object({ document_type: Joi.string().valid(...DOCUMENT_TYPES).required(), name: Joi.string().trim().min(2).max(160).required(), google_doc_id: Joi.string().trim().max(500).required(), status: Joi.string().valid("active", "inactive").default("active") }).unknown(false);
type Context = { input: CreateDocumentTemplateInput; actor: ActivityActor; organizationId: string | null };
export class DocumentTemplateCreateUseCase extends BaseUseCase<CreateDocumentTemplateInput, DocumentTemplate, Context> {
  protected async preExec(input: CreateDocumentTemplateInput, actor?: ActivityActor): Promise<Context> {
    const value = await this.validate<CreateDocumentTemplateInput>(schema, input);
    value.google_doc_id = normalizeGoogleDocumentId(value.google_doc_id);
    const organizationId = await resolveTemplateOrganization(actor ?? null);
    await DocumentTemplateModelFactory();
    if (await DocumentTemplateModel.findOne({ where: { organization_id: organizationId, document_type: value.document_type, deleted_at: null } })) throw new DuplicateEntityException("A template for this document type already exists.");
    return { input: value, actor: actor ?? null, organizationId };
  }
  protected async execute(context: Context): Promise<DocumentTemplate> {
    try {
      const row = await DocumentTemplateModel.create({ uuid: randomUUID(), organization_id: context.organizationId, ...context.input, deleted_at: null });
      return DocumentTemplateModel.toApi(row.toJSON());
    } catch (error) {
      if (error instanceof UniqueConstraintError) throw new DuplicateEntityException("A template for this document type already exists.");
      throw error;
    }
  }
  protected async postExec(result: DocumentTemplate, context?: Context): Promise<DocumentTemplate> {
    void recordActivityLog({ actor: context?.actor ?? null, operation: "create", entity: "document_template", entity_uuid: result.uuid, origin: null, updated: result as any });
    return super.postExec(result, context);
  }
}
