import Joi from "joi";
import RoleModelFactory, { RoleModel, type Role } from "@/app/base/models/RoleModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const getRoleSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class RoleGetUseCase extends BaseUseCase<string, Role | null, string> {

  private roleData?: RoleModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(getRoleSchema, { uuid });

    await RoleModelFactory();
    this.roleData = await RoleModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.roleData) {
      throw new NotFoundException("Role not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(): Promise<Role | null> {
    return await RoleModel.toApi(this.roleData?.toJSON());
  }
}
