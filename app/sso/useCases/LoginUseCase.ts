import { createHash, randomUUID } from "crypto";
import Joi from "joi";
import UserModelFactory, { UserModel, type User } from "@/app/base/models/UserModel";
import SessionModelFactory from "@/app/sso/models/SessionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotAuthorizedException from "@/exceptions/NotAuthorizedException";

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional().default(false),
});

export type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type LoginResult = {
  token: string;
  expired_at: string;
  user: User;
};

export const SESSION_TTL_HOURS = 24;

export class LoginUseCase extends BaseUseCase<LoginInput, LoginResult, LoginInput> {

  private userData?: UserModel | null;

  protected async preExec(input: LoginInput): Promise<LoginInput> {
    const validated = await this.validate<LoginInput>(loginSchema, input);

    await UserModelFactory();
    const email = validated.email.trim().toLowerCase();
    this.userData = await UserModel.findOne({ where: { email, deleted_at: null } });
    const hash = createHash("sha256").update(validated.password).digest("hex");

    if (!this.userData || this.userData?.status !== "active" || this.userData?.password !== hash) {
      throw new NotAuthorizedException("Invalid email or password.");
    }

    return validated;
  }

  protected async execute(): Promise<LoginResult> {
    const user = await UserModel.toApi(this.userData?.toJSON());
    const permissions = await UserModel.resolvePermissions(user.uuid);

    const SessionModel = await SessionModelFactory();
    const session = await SessionModel.create({
      uuid: randomUUID(),
      expired_at: new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000),
      user_info: user as unknown as Record<string, unknown>,
      permissions,
    });

    return {
      token: session.uuid,
      expired_at: session.expired_at.toISOString(),
      user,
    };
  }
}
