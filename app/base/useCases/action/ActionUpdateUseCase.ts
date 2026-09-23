import Joi from "joi";
import { Op } from "sequelize";
import ActionModelFactory, { ActionModel, type UpdateActionInput, type Action } from "@/app/base/models/ActionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import DuplicateEntityException from "@/exceptions/DuplicateEntityException";
import NotFoundException from "@/exceptions/NotFoundException";

const updateActionSchema = Joi.object({
  action: Joi.string().trim().lowercase().pattern(/^[a-z0-9._:-]+$/).min(2).max(120).optional(),
  description: Joi.string().trim().allow("", null).max(255).optional(),
  status: Joi.string().valid("active", "inactive", "deleted").optional(),
}).min(1);

export class ActionUpdateUseCase extends BaseUseCase<string, Action, { uuid: string; input: UpdateActionInput }> {

  private actionData?: ActionModel | null;

  protected async preExec(uuid: string, input: UpdateActionInput): Promise<{ uuid: string; input: UpdateActionInput }> {
    const validatedInput = await this.validate<UpdateActionInput>(updateActionSchema, input);

    await ActionModelFactory();
    this.actionData = await ActionModel.findOne({ where: { uuid, deleted_at: null } });
    if (!this.actionData) {
      throw new NotFoundException("Action not found")
    }

    return { uuid, input: validatedInput };
  }

  protected async execute(context: { uuid: string; input: UpdateActionInput }): Promise<Action> {
    const { uuid, input } = context;
    await ActionModelFactory();
    const nextData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (typeof input.action === "string" && input.action.trim()) {
      const action = input.action.trim().toLowerCase();
      const actionTaken = await ActionModel.findOne({ where: { action, uuid: { [Op.ne]: uuid } } });
      if (actionTaken) {
        throw new DuplicateEntityException("An action with this code already exists.");
      }
      nextData.action = action;
    }

    if (typeof input.description === "string" || input.description === null) {
      nextData.description = typeof input.description === "string" ? input.description.trim() || null : null;
    }

    if (input.status) {
      nextData.status = input.status;
      if (input.status === "deleted") {
        nextData.deleted_at = new Date();
      } else {
        nextData.deleted_at = null;
      }
    }

    await this.actionData?.update(nextData);

    return ActionModel.toApi(this.actionData?.toJSON());
  }
}
