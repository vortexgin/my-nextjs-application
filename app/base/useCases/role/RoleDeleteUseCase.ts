import Joi from "joi";
import RoleModelFactory, { RoleModel } from "@/app/base/models/RoleModel";
import { recordActivityLog, type ActivityActor } from "@/app/base/models/ActivityLogModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const deleteRoleSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class RoleDeleteUseCase extends BaseUseCase<string, boolean, { uuid: string; actor: ActivityActor }> {

  private roleData?: RoleModel | null;

  protected async preExec(uuid: string, actor?: ActivityActor): Promise<{ uuid: string; actor: ActivityActor }> {
    const validatedUuid = await this.validate<{ uuid: string }>(deleteRoleSchema, { uuid });

    await RoleModelFactory();
    this.roleData = await RoleModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.roleData) {
      throw new NotFoundException("Role not found")
    }

    return { uuid: validatedUuid.uuid, actor: actor ?? null };
  }

  protected async execute(context: { uuid: string; actor: ActivityActor }): Promise<boolean> {
    const { uuid } = context;
    await RoleModelFactory();
    const [affectedRows] = await RoleModel.update(
      {
        status: "deleted",
        deleted_at: new Date(),
        updated_at: new Date(),
      },
      {
        where: { uuid, deleted_at: null },
      },
    );

    return affectedRows > 0;
  }

  protected async postExec(
    result: boolean,
    context?: { uuid: string; actor: ActivityActor },
  ): Promise<boolean> {
    if (result) {
      void recordActivityLog({
        actor: context?.actor ?? null,
        operation: "delete",
        entity: "role",
        entity_uuid: context?.uuid ?? null,
        origin: context?.uuid ? { uuid: context.uuid } : null,
        updated: null,
      });
    }
    return super.postExec(result, context);
  }
}
