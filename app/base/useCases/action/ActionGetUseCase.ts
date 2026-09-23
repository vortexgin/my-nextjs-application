import Joi from "joi";
import ActionModelFactory, { ActionModel, type Action } from "@/app/base/models/ActionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const getActionSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class ActionGetUseCase extends BaseUseCase<string, Action | null, string> {

  private actionData?: ActionModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(getActionSchema, { uuid });

    await ActionModelFactory();
    this.actionData = await ActionModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.actionData) {
      throw new NotFoundException("Action not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(): Promise<Action | null> {
    return ActionModel.toApi(this.actionData?.toJSON());
  }
}
