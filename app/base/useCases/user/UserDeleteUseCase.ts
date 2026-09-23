import Joi from "joi";
import UserModelFactory, { UserModel } from "@/app/base/models/UserModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const deleteUserSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class UserDeleteUseCase extends BaseUseCase<string, boolean, string> {

  private userData?: UserModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(deleteUserSchema, { uuid });

    await UserModelFactory();
    this.userData = await UserModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.userData) {
      throw new NotFoundException("User not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(uuid: string): Promise<boolean> {
    await UserModelFactory();
    const [affectedRows] = await UserModel.update(
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
