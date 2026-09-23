import Joi from "joi";
import { Op } from "sequelize";
import RoleModelFactory, { RoleModel, type UpdateRoleInput, type Role } from "@/app/base/models/RoleModel";
import { recordActivityLog, sanitizeActivityData, type ActivityActor } from "@/app/base/models/ActivityLogModel";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";
import PermissionModelFactory, { PermissionModel } from "@/app/base/models/PermissionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import DuplicateEntityException from "@/exceptions/DuplicateEntityException";
import NotFoundException from "@/exceptions/NotFoundException";

const updateRoleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-_]+$/).min(2).max(160).optional(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
  action_ids: Joi.array().items(Joi.string().uuid({ version: "uuidv4" })).optional(),
}).min(1);

export class RoleUpdateUseCase extends BaseUseCase<string, Role, { uuid: string; input: UpdateRoleInput; actor: ActivityActor }> {

  private roleData?: RoleModel | null;

  protected async preExec(uuid: string, input: UpdateRoleInput, actor?: ActivityActor): Promise<{ uuid: string; input: UpdateRoleInput; actor: ActivityActor }> {
    const validatedInput = await this.validate<UpdateRoleInput>(updateRoleSchema, input);

    await RoleModelFactory();
    this.roleData = await RoleModel.findOne({ where: { uuid, deleted_at: null } });
    if (!this.roleData) {
      throw new NotFoundException("Role not found")
    }

    return { uuid, input: validatedInput, actor: actor ?? null };
  }

  protected async execute(context: { uuid: string; input: UpdateRoleInput; actor: ActivityActor }): Promise<Role> {
    const { uuid, input } = context;
    await RoleModelFactory();
    const nextData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (typeof input.name === "string" && input.name.trim()) {
      nextData.name = input.name.trim();
    }

    if (typeof input.slug === "string" && input.slug.trim()) {
      const slug = input.slug.trim().toLowerCase();
      const slugTaken = await RoleModel.findOne({ where: { slug, uuid: { [Op.ne]: uuid } } });
      if (slugTaken) {
        throw new DuplicateEntityException("A role with this slug already exists.");
      }
      nextData.slug = slug;
    }

    if (input.status) {
      nextData.status = input.status;
      if (input.status === "deleted") {
        nextData.deleted_at = new Date();
      } else {
        nextData.deleted_at = null;
      }
    }

    await this.roleData?.update(nextData);
    await this.syncPermissions(uuid, input);

    return await RoleModel.toApi(this.roleData?.toJSON());
  }

  protected async postExec(
    result: Role,
    context?: { uuid: string; input: UpdateRoleInput; actor: ActivityActor },
  ): Promise<Role> {
    void recordActivityLog({
      actor: context?.actor ?? null,
      operation: "update",
      entity: "role",
      entity_uuid: context?.uuid ?? result.uuid,
      origin: sanitizeActivityData(context?.input),
      updated: result,
    });
    return super.postExec(result, context);
  }

  private async syncPermissions(uuid: string, input: UpdateRoleInput): Promise<void> {
    if (!Object.prototype.hasOwnProperty.call(input, "action_ids")) {
      return;
    }

    const actionIds = [...new Set(input.action_ids ?? [])];

    await ActionModelFactory();
    if (actionIds.length > 0) {
      const actions = await ActionModel.findAll({
        where: { uuid: { [Op.in]: actionIds }, deleted_at: null },
      });
      if (actions.length !== actionIds.length) {
        throw new NotFoundException("Action not found.");
      }
    }

    await PermissionModelFactory();
    await PermissionModel.destroy({ where: { role_id: uuid } });
    if (actionIds.length > 0) {
      await PermissionModel.bulkCreate(actionIds.map((action_id) => ({ role_id: uuid, action_id })));
    }
  }
}
