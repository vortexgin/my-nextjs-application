import { createHash, randomUUID } from "crypto";
import Joi, { Schema } from "joi";
import UserModelFactory, { UserModel, type CreateUserInput, type User } from "@/app/base/models/UserModel";
import RoleModelFactory, { RoleModel } from "@/app/base/models/RoleModel";
import UserRoleModelFactory, { UserRoleModel } from "@/app/base/models/UserRoleModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import DuplicateEntityException from "@/exceptions/DuplicateEntityException";
import NotFoundException from "@/exceptions/NotFoundException";

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  email: Joi.string().trim().email().required(),
  phone_number: Joi.string().trim().min(6).required(),
  password: Joi.string().min(6).required(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
  role_id: Joi.string().uuid({ version: "uuidv4" }).optional(),
});

export class UserCreateUseCase extends BaseUseCase<CreateUserInput, User, CreateUserInput> {
  protected async preExec(input: CreateUserInput): Promise<CreateUserInput> {
    return this.validate<CreateUserInput>(createUserSchema, input);
  }

  protected async validate<TValidated = CreateUserInput>(schema: Schema, input: CreateUserInput): Promise<TValidated> {
    const validatedInput = await super.validate<TValidated>(schema, input);

    await UserModelFactory();
    const existingUser = await UserModel.findOne({ where: { email: input.email } });
    if (existingUser) {
      throw new DuplicateEntityException("A user with this email already exists.");
    }

    if (input.role_id) {
      await RoleModelFactory();
      const role = await RoleModel.findOne({ where: { uuid: input.role_id, deleted_at: null } });
      if (!role) {
        throw new NotFoundException("Role not found.");
      }
    }

    return validatedInput;
  }

  protected async execute(input: CreateUserInput): Promise<User> {
    await UserModelFactory();
    const user = await UserModel.create({
      uuid: randomUUID(),
      name: input.name?.trim(),
      email: input.email?.trim().toLowerCase(),
      phone_number: input.phone_number?.trim(),
      password: createHash("sha256").update(input.password).digest("hex"),
      status: input.status ?? "active",
      deleted_at: null,
    });

    if (input.role_id) {
      await UserRoleModelFactory();
      await UserRoleModel.create({ user_id: user.uuid, role_id: input.role_id });
    }

    return await UserModel.toApi(user.toJSON());
  }
}
