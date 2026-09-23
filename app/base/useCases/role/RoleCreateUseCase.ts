import { randomUUID } from "crypto";
import Joi, { Schema } from "joi";
import { Op } from "sequelize";
import RoleModelFactory, { RoleModel, type CreateRoleInput, type Role } from "@/app/base/models/RoleModel";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";
import PermissionModelFactory, { PermissionModel } from "@/app/base/models/PermissionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import DuplicateEntityException from "@/exceptions/DuplicateEntityException";
import NotFoundException from "@/exceptions/NotFoundException";

const createRoleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-_]+$/).min(2).max(160).required(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
  action_ids: Joi.array().items(Joi.string().uuid({ version: "uuidv4" })).optional(),
});

export class RoleCreateUseCase extends BaseUseCase<CreateRoleInput, Role, CreateRoleInput> {
  protected async preExec(input: CreateRoleInput): Promise<CreateRoleInput> {
    return this.validate<CreateRoleInput>(createRoleSchema, input);
  }

  protected async validate<TValidated = CreateRoleInput>(schema: Schema, input: CreateRoleInput): Promise<TValidated> {
    const validatedInput = await super.validate<TValidated>(schema, input);

    await RoleModelFactory();
    const existingRole = await RoleModel.findOne({ where: { slug: input.slug } });
    if (existingRole) {
      throw new DuplicateEntityException("A role with this slug already exists.");
    }

    await this.ensureActionsExist(input.action_ids);

    return validatedInput;
  }

  protected async execute(input: CreateRoleInput): Promise<Role> {
    await RoleModelFactory();
    const role = await RoleModel.create({
      uuid: randomUUID(),
      name: input.name?.trim(),
      slug: input.slug?.trim().toLowerCase(),
      status: input.status ?? "active",
      deleted_at: null,
    });

    if (input.action_ids && input.action_ids.length > 0) {
      await PermissionModelFactory();
      await PermissionModel.bulkCreate(
        input.action_ids.map((action_id) => ({ role_id: role.uuid, action_id })),
      );
    }

    return await RoleModel.toApi(role.toJSON());
  }

  private async ensureActionsExist(actionIds?: string[]): Promise<void> {
    if (!actionIds || actionIds.length === 0) {
      return;
    }

    await ActionModelFactory();
    const actions = await ActionModel.findAll({
      where: { uuid: { [Op.in]: actionIds }, deleted_at: null },
    });
    if (actions.length !== new Set(actionIds).size) {
      throw new NotFoundException("Action not found.");
    }
  }
}
