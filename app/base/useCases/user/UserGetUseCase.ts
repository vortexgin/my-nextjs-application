import Joi from "joi";
import UserModelFactory, { UserModel, type User } from "@/app/base/models/UserModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const getUserSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class UserGetUseCase extends BaseUseCase<string, User | null, string> {

  private userData?: UserModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(getUserSchema, { uuid });

    await UserModelFactory();
    this.userData = await UserModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.userData) {
      throw new NotFoundException("User not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(): Promise<User | null> {
    return await UserModel.toApi(this.userData?.toJSON());
  }
}
