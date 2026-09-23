import { randomUUID } from "crypto";
import Joi, { Schema } from "joi";
import MenuModelFactory, { MenuModel, type CreateMenuInput, type Menu } from "@/app/base/models/MenuModel";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const createMenuSchema = Joi.object({
  icon: Joi.string().trim().allow("").max(255).required(),
  parent: Joi.string().uuid({ version: "uuidv4" }).allow(null).optional(),
  menu: Joi.string().trim().min(2).max(120).required(),
  action_id: Joi.string().uuid({ version: "uuidv4" }).required(),
  description: Joi.string().trim().allow("", null).max(255).optional(),
  redirection: Joi.string().trim().uri({ allowRelative: true }).max(500).required(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
  weight: Joi.number().integer().min(0).optional(),
});

export class MenuCreateUseCase extends BaseUseCase<CreateMenuInput, Menu, CreateMenuInput> {
  protected async preExec(input: CreateMenuInput): Promise<CreateMenuInput> {
    return this.validate<CreateMenuInput>(createMenuSchema, input);
  }

  protected async validate<TValidated = CreateMenuInput>(schema: Schema, input: CreateMenuInput): Promise<TValidated> {
    const validatedInput = await super.validate<TValidated>(schema, input);

    await MenuModelFactory();
    await ActionModelFactory();

    if (input.parent) {
      const parent = await MenuModel.findOne({ where: { uuid: input.parent, deleted_at: null } });
      if (!parent) {
        throw new NotFoundException("Parent menu not found.");
      }
    }

    const action = await ActionModel.findOne({ where: { uuid: input.action_id, deleted_at: null } });
    if (!action) {
      throw new NotFoundException("Action not found.");
    }

    return validatedInput;
  }

  protected async execute(input: CreateMenuInput): Promise<Menu> {
    await MenuModelFactory();
    const menu = await MenuModel.create({
      uuid: randomUUID(),
      icon: input.icon?.trim(),
      parent: input.parent ?? null,
      menu: input.menu?.trim(),
      action_id: input.action_id,
      description: input.description?.trim() || null,
      redirection: input.redirection?.trim(),
      status: input.status ?? "active",
      weight: input.weight ?? 0,
      deleted_at: null,
    });

    return await MenuModel.toApi(menu.toJSON());
  }
}
