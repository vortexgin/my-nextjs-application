import Joi from "joi";
import SessionModelFactory, { SessionModel } from "@/app/sso/models/SessionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";

const logoutSchema = Joi.object({
  token: Joi.string().uuid({ version: "uuidv4" }).allow("", null).optional(),
});

export type LogoutInput = {
  token?: string | null;
};

export class LogoutUseCase extends BaseUseCase<LogoutInput, { message: string }, LogoutInput> {
  protected async preExec(input: LogoutInput): Promise<LogoutInput> {
    return this.validate<LogoutInput>(logoutSchema, input ?? {});
  }

  protected async execute(input: LogoutInput): Promise<{ message: string }> {
    if (input.token) {
      await SessionModelFactory();
      await SessionModel.update(
        { status: "deleted", deleted_at: new Date() },
        { where: { uuid: input.token, deleted_at: null } },
      );
    }

    return { message: "Logged out successfully." };
  }
}
