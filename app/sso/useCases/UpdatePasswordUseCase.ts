import { createHash } from "crypto";
import Joi from "joi";
import UserModelFactory, { UserModel } from "@/app/base/models/UserModel";
import PasswordResetModelFactory, { PasswordResetModel } from "@/app/sso/models/PasswordResetModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import BadParameterException from "@/exceptions/BadParameterException";
import NotFoundException from "@/exceptions/NotFoundException";

const updatePasswordSchema = Joi.object({
  token: Joi.string().trim().min(1).required(),
  password: Joi.string().min(6).required(),
});

export type UpdatePasswordInput = {
  token: string;
  password: string;
};

export class UpdatePasswordUseCase extends BaseUseCase<UpdatePasswordInput, { message: string }, UpdatePasswordInput> {

  private resetData: PasswordResetModel | null = null;

  protected async preExec(input: UpdatePasswordInput): Promise<UpdatePasswordInput> {
    const validated = await this.validate<UpdatePasswordInput>(updatePasswordSchema, input);

    const PasswordResetModel = await PasswordResetModelFactory();
    const token_hash = createHash("sha256").update(input.token.trim()).digest("hex");
    this.resetData = await PasswordResetModel.findOne({ where: { token_hash, used_at: null } });
    if (!this.resetData || this.resetData.expires_at.getTime() <= Date.now()) {
      throw new BadParameterException("Invalid or expired reset link.");
    }

    return validated;
  }

  protected async execute(input: UpdatePasswordInput): Promise<{ message: string }> {
    await UserModelFactory();
    const user = await UserModel.findOne({ where: { uuid: this.resetData?.user_id, deleted_at: null } });
    if (!user) {
      throw new NotFoundException("User not found.");
    }

    await user.update({
      password: createHash("sha256").update(input.password).digest("hex"),
      updated_at: new Date(),
    });
    await this.resetData?.update({ used_at: new Date() });

    return { message: "Password updated successfully." };
  }
}
