import Joi from "joi";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const deleteActionSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class ActionDeleteUseCase extends BaseUseCase<string, boolean, string> {

  private actionData?: ActionModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(deleteActionSchema, { uuid });

    await ActionModelFactory();
    this.actionData = await ActionModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.actionData) {
      throw new NotFoundException("Action not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(uuid: string): Promise<boolean> {
    await ActionModelFactory();
    const [affectedRows] = await ActionModel.update(
      {
        status: "deleted",
        deleted_at: new Date(),
        updated_at: new Date(),
      },
      {
        where: { uuid, deleted_at: null },
      },
    );

    return affectedRows > 0;
  }
}
