import type { ActivityActor } from "@/app/base/models/ActivityLogModel";
import { DocumentTemplateGetUseCase } from "@/app/base/useCases/documentTemplate/DocumentTemplateGetUseCase";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import { getDriveFile, getDriveTempFolderId, GOOGLE_DOC_MIME } from "@/libraries/google/GoogleDriveClient";
import { getGoogleDocument } from "@/libraries/google/GoogleDocsClient";
import { inspectGoogleDocument, type TemplateValidation } from "@/libraries/google/GoogleDocsTemplateRenderer";

type Context = { uuid: string; actor: ActivityActor };
export class DocumentTemplateValidateUseCase extends BaseUseCase<string, TemplateValidation, Context> {
  protected async preExec(uuid: string, actor?: ActivityActor): Promise<Context> { return { uuid, actor: actor ?? null }; }
  protected async execute(context: Context): Promise<TemplateValidation> {
    const template = await new DocumentTemplateGetUseCase().exec(context.uuid, context.actor);
    try {
      const file = await getDriveFile(template.google_doc_id);
      const errors: string[] = [];
      if (file.mimeType !== GOOGLE_DOC_MIME) errors.push("Configured file is not a Google Docs document.");
      if (file.capabilities?.canCopy === false) errors.push("Service account cannot copy the configured document.");
      if (file.parents?.includes(getDriveTempFolderId())) errors.push("Master template must not be stored in the temporary Drive folder.");
      if (errors.length > 0) return { valid: false, errors, warnings: [], placeholders: [] };
      return inspectGoogleDocument(await getGoogleDocument(template.google_doc_id), template.document_type);
    } catch (error) {
      return { valid: false, errors: [(error as Error).message || "Template validation failed."], warnings: [], placeholders: [] };
    }
  }
}
