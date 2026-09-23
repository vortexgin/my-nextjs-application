import { randomUUID } from "crypto";
import Joi, { Schema } from "joi";
import ActionModelFactory, { ActionModel, type CreateActionInput, type Action } from "@/app/base/models/ActionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import DuplicateEntityException from "@/exceptions/DuplicateEntityException";

const createActionSchema = Joi.object({
  action: Joi.string().trim().lowercase().pattern(/^[a-z0-9._:-]+$/).min(2).max(120).required(),
  description: Joi.string().trim().allow("", null).max(255).optional(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
});

export class ActionCreateUseCase extends BaseUseCase<CreateActionInput, Action, CreateActionInput> {
  protected async preExec(input: CreateActionInput): Promise<CreateActionInput> {
    return this.validate<CreateActionInput>(createActionSchema, input);
  }

  protected async validate<TValidated = CreateActionInput>(schema: Schema, input: CreateActionInput): Promise<TValidated> {
    const validatedInput = await super.validate<TValidated>(schema, input);

    await ActionModelFactory();
    const existingAction = await ActionModel.findOne({ where: { action: input.action } });
    if (existingAction) {
      throw new DuplicateEntityException("An action with this code already exists.");
    }

    return validatedInput;
  }

  protected async execute(input: CreateActionInput): Promise<Action> {
    await ActionModelFactory();
    const action = await ActionModel.create({
      uuid: randomUUID(),
      action: input.action?.trim().toLowerCase(),
      description: input.description?.trim() || null,
      status: input.status ?? "active",
      deleted_at: null,
    });

    return ActionModel.toApi(action.toJSON());
  }
}
