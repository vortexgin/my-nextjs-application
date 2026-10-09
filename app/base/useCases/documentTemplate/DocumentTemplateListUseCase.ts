import Joi from "joi";
import { Op } from "sequelize";
import DocumentTemplateModelFactory, { DOCUMENT_TYPES, type DocumentTemplate } from "@/app/base/models/DocumentTemplateModel";
import type { ActivityActor } from "@/app/base/models/ActivityLogModel";
import { escapeLike } from "@/libraries/String";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import { resolveTemplateOrganization } from "@/app/base/useCases/documentTemplate/documentTemplateScope";

export type ListDocumentTemplatesInput = { filter?: { q?: string; document_type?: string; status?: string }; sortProperty?: string; sortDirection?: string; offset?: unknown; limit?: unknown };
type Query = { q?: string; document_type?: string; status?: string; sortProperty: string; sortDirection: "ASC" | "DESC"; offset: number; limit: number; organizationId: string | null };
const SORT = { name: "name", document_type: "document_type", status: "status", created_at: "created_at", updated_at: "updated_at" } as const;
const schema = Joi.object({
  filter: Joi.object({ q: Joi.string().trim().allow("").optional(), document_type: Joi.string().valid(...DOCUMENT_TYPES).optional(), status: Joi.string().valid("active", "inactive").optional() }).optional(),
  sortProperty: Joi.string().valid(...Object.keys(SORT)).default("name"),
  sortDirection: Joi.string().valid("asc", "desc").insensitive().default("asc"),
  offset: Joi.number().integer().min(0).default(0), limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

export class DocumentTemplateListUseCase extends BaseUseCase<ListDocumentTemplatesInput | void, DocumentTemplate[], Query> {
  protected async preExec(input?: ListDocumentTemplatesInput | void, actor?: ActivityActor): Promise<Query> {
    const value = await this.validate<any>(schema, input ?? {});
    return { q: value.filter?.q?.trim() || undefined, document_type: value.filter?.document_type, status: value.filter?.status, sortProperty: SORT[value.sortProperty as keyof typeof SORT], sortDirection: value.sortDirection.toUpperCase(), offset: value.offset, limit: value.limit, organizationId: await resolveTemplateOrganization(actor ?? null) };
  }
  protected async execute(context: Query): Promise<DocumentTemplate[]> {
    const Model = await DocumentTemplateModelFactory();
    const and: any[] = [{ deleted_at: null }, { organization_id: context.organizationId }];
    if (context.document_type) and.push({ document_type: context.document_type });
    if (context.status) and.push({ status: context.status });
    if (context.q) {
      const pattern = `%${escapeLike(context.q)}%`;
      and.push({ [Op.or]: [{ name: { [Op.iLike]: pattern } }, { google_doc_id: { [Op.iLike]: pattern } }] });
    }
    const rows = await Model.findAll({ where: { [Op.and]: and }, order: [[context.sortProperty, context.sortDirection]], offset: context.offset, limit: context.limit });
    return rows.map((row) => Model.toApi(row.toJSON()));
  }
}
