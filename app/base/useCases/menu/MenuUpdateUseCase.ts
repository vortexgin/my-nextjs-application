import Joi from "joi";
import MenuModelFactory, { MenuModel, type UpdateMenuInput, type Menu } from "@/app/base/models/MenuModel";
import { recordActivityLog, type ActivityActor } from "@/app/base/models/ActivityLogModel";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import BadParameterException from "@/exceptions/BadParameterException";
import NotFoundException from "@/exceptions/NotFoundException";

const updateMenuSchema = Joi.object({
  icon: Joi.string().trim().allow("").max(255).optional(),
  parent: Joi.string().uuid({ version: "uuidv4" }).allow(null).optional(),
  menu: Joi.string().trim().min(2).max(120).optional(),
  action_id: Joi.string().uuid({ version: "uuidv4" }).optional(),
  description: Joi.string().trim().allow("", null).max(255).optional(),
  redirection: Joi.string().trim().uri({ allowRelative: true }).max(500).optional(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
  weight: Joi.number().integer().min(0).optional(),
}).min(1);

export class MenuUpdateUseCase extends BaseUseCase<string, Menu, { uuid: string; input: UpdateMenuInput; actor: ActivityActor }> {

  private menuData?: MenuModel | null;
  private beforeData?: Menu | null;

  protected async preExec(uuid: string, input: UpdateMenuInput, actor?: ActivityActor): Promise<{ uuid: string; input: UpdateMenuInput; actor: ActivityActor }> {
    const validatedInput = await this.validate<UpdateMenuInput>(updateMenuSchema, input);

    await MenuModelFactory();
    this.menuData = await MenuModel.findOne({ where: { uuid, deleted_at: null } });
    if (!this.menuData) {
      throw new NotFoundException("Menu not found")
    }
    this.beforeData = await MenuModel.toApi(this.menuData?.toJSON());

    if (typeof validatedInput.parent === "string" && validatedInput.parent === uuid) {
      throw new BadParameterException("Menu cannot be its own parent.");
    }

    return { uuid, input: validatedInput, actor: actor ?? null };
  }

  protected async execute(context: { uuid: string; input: UpdateMenuInput; actor: ActivityActor }): Promise<Menu> {
    const { input } = context;
    await MenuModelFactory();
    await ActionModelFactory();
    const nextData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (typeof input.icon === "string" && input.icon.trim()) {
      nextData.icon = input.icon.trim();
    }

    if (Object.prototype.hasOwnProperty.call(input, "parent")) {
      if (input.parent) {
        const parent = await MenuModel.findOne({ where: { uuid: input.parent, deleted_at: null } });
        if (!parent) {
          throw new NotFoundException("Parent menu not found.");
        }
        nextData.parent = input.parent;
      } else {
        nextData.parent = null;
      }
    }

    if (typeof input.menu === "string" && input.menu.trim()) {
      nextData.menu = input.menu.trim();
    }

    if (typeof input.action_id === "string" && input.action_id.trim()) {
      const action = await ActionModel.findOne({ where: { uuid: input.action_id, deleted_at: null } });
      if (!action) {
        throw new NotFoundException("Action not found.");
      }
      nextData.action_id = input.action_id;
    }

    if (typeof input.description === "string" || input.description === null) {
      nextData.description = typeof input.description === "string" ? input.description.trim() || null : null;
    }

    if (typeof input.redirection === "string" && input.redirection.trim()) {
      nextData.redirection = input.redirection.trim();
    }

    if (typeof input.weight === "number") {
      nextData.weight = input.weight;
    }

    if (input.status) {
      nextData.status = input.status;
      if (input.status === "deleted") {
        nextData.deleted_at = new Date();
      } else {
        nextData.deleted_at = null;
      }
    }

    await this.menuData?.update(nextData);

    return await MenuModel.toApi(this.menuData?.toJSON());
  }

  protected async postExec(
    result: Menu,
    context?: { uuid: string; input: UpdateMenuInput; actor: ActivityActor },
  ): Promise<Menu> {
    void recordActivityLog({
      actor: context?.actor ?? null,
      operation: "update",
      entity: "menu",
      entity_uuid: context?.uuid ?? result.uuid,
      origin: this.beforeData ?? null,
      updated: result,
    });
    return super.postExec(result, context);
  }
}
