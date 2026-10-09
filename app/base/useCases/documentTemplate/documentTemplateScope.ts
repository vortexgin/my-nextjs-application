import type { ActivityActor } from "@/app/base/models/ActivityLogModel";
import { UserModel } from "@/app/base/models/UserModel";

export async function resolveTemplateOrganization(actor: ActivityActor): Promise<string | null> {
  const actorUuid = (actor as Record<string, unknown> | null)?.uuid;
  if (typeof actorUuid !== "string") return null;
  return (await UserModel.resolveOrganization(actorUuid))?.uuid ?? null;
}
