import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";

export const DOCUMENT_TYPES = ["purchase_request", "sales_order", "delivery_order", "stock_report"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type DocumentTemplateStatus = "active" | "inactive" | "deleted";

export type DocumentTemplate = {
  uuid: string;
  organization_id: string | null;
  document_type: DocumentType;
  name: string;
  google_doc_id: string;
  status: DocumentTemplateStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateDocumentTemplateInput = {
  document_type: DocumentType;
  name: string;
  google_doc_id: string;
  status?: Exclude<DocumentTemplateStatus, "deleted">;
};

export type UpdateDocumentTemplateInput = Partial<Omit<CreateDocumentTemplateInput, "document_type">>;
export type DocumentTemplateModelAttributes = Partial<Omit<DocumentTemplate, "created_at" | "updated_at" | "deleted_at">> & {
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export class DocumentTemplateModel extends Model<DocumentTemplateModelAttributes, Partial<DocumentTemplateModelAttributes>> {
  declare uuid: string;
  declare organization_id: string | null;
  declare document_type: DocumentType;
  declare name: string;
  declare google_doc_id: string;
  declare status: DocumentTemplateStatus;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  static toApi(row: any): DocumentTemplate {
    return {
      uuid: row.uuid,
      organization_id: row.organization_id ?? null,
      document_type: row.document_type,
      name: row.name,
      google_doc_id: row.google_doc_id,
      status: row.status,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      deleted_at: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
    };
  }
}

let modelPromise: Promise<typeof DocumentTemplateModel> | null = null;

export async function getDocumentTemplateModel(): Promise<typeof DocumentTemplateModel> {
  if ((DocumentTemplateModel as any).initialized) return DocumentTemplateModel;
  if (!modelPromise) {
    modelPromise = (async () => {
      const sequelize = await getSequelizeInstance();
      DocumentTemplateModel.init(
        {
          uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
          organization_id: { type: DataTypes.UUID, allowNull: true, defaultValue: null },
          document_type: { type: DataTypes.ENUM(...DOCUMENT_TYPES), allowNull: false },
          name: { type: DataTypes.STRING(160), allowNull: false },
          google_doc_id: { type: DataTypes.STRING(255), allowNull: false },
          status: { type: DataTypes.ENUM("active", "inactive", "deleted"), allowNull: false, defaultValue: "active" },
          created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
          updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
          deleted_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
        },
        { sequelize, modelName: "DocumentTemplate", tableName: "base_document_templates", timestamps: false, underscored: true },
      );
      (DocumentTemplateModel as any).initialized = true;
      return DocumentTemplateModel;
    })().catch((error) => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

export default async function DocumentTemplateModelFactory() {
  return getDocumentTemplateModel();
}
