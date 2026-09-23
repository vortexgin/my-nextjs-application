import { randomUUID } from "crypto";
import Joi, { Schema } from "joi";
import MenuModelFactory, { MenuModel, type CreateMenuInput, type Menu } from "@/app/base/models/MenuModel";
import { recordActivityLog, sanitizeActivityData, type ActivityActor } from "@/app/base/models/ActivityLogModel";
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

export class MenuCreateUseCase extends BaseUseCase<CreateMenuInput, Menu, { input: CreateMenuInput; actor: ActivityActor }> {
  protected async preExec(input: CreateMenuInput, actor?: ActivityActor): Promise<{ input: CreateMenuInput; actor: ActivityActor }> {
    const validated = await this.validate<CreateMenuInput>(createMenuSchema, input);
    return { input: validated, actor: actor ?? null };
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

  protected async execute(context: { input: CreateMenuInput; actor: ActivityActor }): Promise<Menu> {
    const { input } = context;
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

    const result = await MenuModel.toApi(menu.toJSON());
    return result;
  }

  protected async postExec(
    result: Menu,
    context?: { input: CreateMenuInput; actor: ActivityActor },
  ): Promise<Menu> {
    void recordActivityLog({
      actor: context?.actor ?? null,
      operation: "create",
      entity: "menu",
      entity_uuid: result.uuid,
      origin: sanitizeActivityData(context?.input),
      updated: result,
    });
    return super.postExec(result, context);
  }
}
