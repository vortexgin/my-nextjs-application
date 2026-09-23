import Joi from "joi";
import RoleModelFactory, { RoleModel } from "@/app/base/models/RoleModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const deleteRoleSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class RoleDeleteUseCase extends BaseUseCase<string, boolean, string> {

  private roleData?: RoleModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(deleteRoleSchema, { uuid });

    await RoleModelFactory();
    this.roleData = await RoleModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.roleData) {
      throw new NotFoundException("Role not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(uuid: string): Promise<boolean> {
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
}
