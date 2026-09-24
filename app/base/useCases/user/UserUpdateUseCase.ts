import { createHash } from "crypto";
import Joi from "joi";
import { Op } from "sequelize";
import UserModelFactory, { UserModel, type UpdateUserInput, type User } from "@/app/base/models/UserModel";
import { recordActivityLog, type ActivityActor } from "@/app/base/models/ActivityLogModel";
import RoleModelFactory, { RoleModel } from "@/app/base/models/RoleModel";
import UserRoleModelFactory, { UserRoleModel } from "@/app/base/models/UserRoleModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import DuplicateEntityException from "@/exceptions/DuplicateEntityException";
import NotFoundException from "@/exceptions/NotFoundException";

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).optional(),
  email: Joi.string().trim().email().optional(),
  phone_number: Joi.string().trim().min(6).optional(),
  password: Joi.string().min(6).optional(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
  role_id: Joi.string().uuid({ version: "uuidv4" }).allow(null).optional(),
}).min(1);

export class UserUpdateUseCase extends BaseUseCase<string, User, { uuid: string; input: UpdateUserInput; actor: ActivityActor }> {

  private userData?: UserModel | null;
  private beforeData?: User | null;

  protected async preExec(uuid: string, input: UpdateUserInput, actor?: ActivityActor): Promise<{ uuid: string; input: UpdateUserInput; actor: ActivityActor }> {
    const validatedInput = await this.validate<UpdateUserInput>(updateUserSchema, input);

    await UserModelFactory();
    this.userData = await UserModel.findOne({ where: { uuid, deleted_at: null } });
    if (!this.userData) {
      throw new NotFoundException("User not found")
    }
    this.beforeData = await UserModel.toApi(this.userData?.toJSON());

    return { uuid, input: validatedInput, actor: actor ?? null };
  }

  protected async execute(context: { uuid: string; input: UpdateUserInput; actor: ActivityActor }): Promise<User> {
    const { uuid, input } = context;
    await UserModelFactory();
    const nextData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (typeof input.name === "string" && input.name.trim()) {
      nextData.name = input.name.trim();
    }

    if (typeof input.email === "string" && input.email.trim()) {
      const email = input.email.trim().toLowerCase();
      const emailTaken = await UserModel.findOne({ where: { email, uuid: { [Op.ne]: uuid } } });
      if (emailTaken) {
        throw new DuplicateEntityException("A user with this email already exists.");
      }
      nextData.email = email;
    }

    if (typeof input.phone_number === "string" && input.phone_number.trim()) {
      nextData.phone_number = input.phone_number.trim();
    }

    if (typeof input.password === "string" && input.password.trim()) {
      nextData.password = createHash("sha256").update(input.password).digest("hex");
    }

    if (input.status) {
      nextData.status = input.status;
      if (input.status === "deleted") {
        nextData.deleted_at = new Date();
      } else {
        nextData.deleted_at = null;
      }
    }

    await this.userData?.update(nextData);
    await this.syncRole(uuid, input);

    return await UserModel.toApi(this.userData?.toJSON());
  }

  protected async postExec(
    result: User,
    context?: { uuid: string; input: UpdateUserInput; actor: ActivityActor },
  ): Promise<User> {
    void recordActivityLog({
      actor: context?.actor ?? null,
      operation: "update",
      entity: "user",
      entity_uuid: context?.uuid ?? result.uuid,
      origin: this.beforeData ?? null,
      updated: result,
    });
    return super.postExec(result, context);
  }

  private async syncRole(uuid: string, input: UpdateUserInput): Promise<void> {
    if (!Object.prototype.hasOwnProperty.call(input, "role_id")) {
      return;
    }

    await UserRoleModelFactory();

    if (input.role_id === null || input.role_id === "") {
      await UserRoleModel.destroy({ where: { user_id: uuid } });
      return;
    }

    await RoleModelFactory();
    const role = await RoleModel.findOne({ where: { uuid: input.role_id, deleted_at: null } });
    if (!role) {
      throw new NotFoundException("Role not found.");
    }

    const assignment = await UserRoleModel.findOne({ where: { user_id: uuid } });
    if (assignment) {
      await assignment.update({ role_id: input.role_id, updated_at: new Date() });
    } else {
      await UserRoleModel.create({ user_id: uuid, role_id: input.role_id });
    }
  }
}
