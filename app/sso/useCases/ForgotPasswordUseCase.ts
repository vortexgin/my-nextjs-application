import { createHash, randomBytes } from "crypto";
import Joi from "joi";
import UserModelFactory, { UserModel } from "@/app/base/models/UserModel";
import PasswordResetModelFactory from "@/app/sso/models/PasswordResetModel";
import { sendPasswordResetEmail } from "@/libraries/mail";
import { appBaseUrl } from "@/libraries/Http";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

export const RESET_LINK_TTL_MINUTES = 60;

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
});

export type ForgotPasswordInput = {
  email: string;
};

export class ForgotPasswordUseCase extends BaseUseCase<ForgotPasswordInput, { message: string }, ForgotPasswordInput> {

  private userData?: UserModel | null;

  protected async preExec(input: ForgotPasswordInput): Promise<ForgotPasswordInput> {
    const validated = await this.validate<ForgotPasswordInput>(forgotPasswordSchema, input);

    await UserModelFactory();
    this.userData = await UserModel.findOne({ where: { email: validated.email.trim().toLowerCase(), deleted_at: null } });
    if (!this.userData || this.userData?.status !== "active") {
      throw new NotFoundException("User not found.")
    }

    return validated;
  }

  protected async execute(input: ForgotPasswordInput): Promise<{ message: string }> {
    const message = "If an account exists for this email, a reset link has been sent.";

    const PasswordResetModel = await PasswordResetModelFactory();
    await PasswordResetModel.destroy({ where: { user_id: this.userData?.uuid, used_at: null } });

    const rawToken = randomBytes(32).toString("hex");
    const token_hash = createHash("sha256").update(rawToken).digest("hex");
    const expires_at = new Date(Date.now() + RESET_LINK_TTL_MINUTES * 60 * 1000);

    await PasswordResetModel.create({
      user_id: this.userData?.uuid,
      email: input.email.trim().toLowerCase(),
      token_hash,
      expires_at,
      used_at: null,
    });

    await sendPasswordResetEmail(input.email.trim().toLowerCase(), `${appBaseUrl()}/sso/update-password?token=${rawToken}`);

    return { message };
  }
}
