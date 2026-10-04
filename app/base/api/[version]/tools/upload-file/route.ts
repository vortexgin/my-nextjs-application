import Joi from "joi";
import { NextRequest } from "next/server";
import { connectDatabase } from "@/database/sequelize";
import { withAuthorization } from "@/libraries/AuthorizedRoute";
import { fail, getErrorStatus, ok } from "@/libraries/Http";
import { getCosConfig, sanitizeFilename, uploadToCos } from "@/libraries/cos";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import BadParameterException from "@/exceptions/BadParameterException";

export const runtime = "nodejs";

const uploadFileSchema = Joi.object({
  filename: Joi.string().trim().min(1).max(255).required(),
  content_type: Joi.string().trim().max(255).optional(),
  data: Joi.string().required(),
});

class UploadFileUseCase extends BaseUseCase<Record<string, unknown>, unknown, { buffer: Buffer; filename: string; contentType: string }> {
  protected async preExec(input: Record<string, unknown>): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const validated = await this.validate<{ filename: string; content_type?: string; data: string }>(uploadFileSchema, input);

    const filename = sanitizeFilename(validated.filename);
    if (!filename) {
      throw new BadParameterException("Invalid filename.");
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(validated.data, "base64");
    } catch {
      throw new BadParameterException("Field data must be valid base64.");
    }

    const config = getCosConfig();
    if (buffer.length === 0) {
      throw new BadParameterException("Empty file.");
    }
    if (buffer.length > config.maxFileBytes) {
      throw new BadParameterException(`File exceeds the ${config.maxFileBytes} byte limit.`);
    }

    return { buffer, filename, contentType: validated.content_type?.trim() || "application/octet-stream" };
  }

  protected async execute(context: { buffer: Buffer; filename: string; contentType: string }): Promise<unknown> {
    return uploadToCos(context.buffer, context.filename, context.contentType);
  }
}

async function handlePost(request: NextRequest) {
  try {
    await connectDatabase();
    const payload = (await request.json()) as Record<string, unknown>;

    const result = await new UploadFileUseCase().exec(payload);
    return ok(result, 201);
  } catch (error: any) {
    return fail(error.message ?? "Failed to upload file.", getErrorStatus(error, 500));
  }
}

export const POST = withAuthorization(handlePost, ["base:tools:upload:upload"]);
