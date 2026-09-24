import Joi from "joi";
import ActionModelFactory, { ActionModel, type Action } from "@/app/base/models/ActionModel";
import { recordActivityLog, type ActivityActor } from "@/app/base/models/ActivityLogModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const deleteActionSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class ActionDeleteUseCase extends BaseUseCase<string, boolean, { uuid: string; actor: ActivityActor }> {

  private actionData?: ActionModel | null;
  private beforeData?: Action | null;

  protected async preExec(uuid: string, actor?: ActivityActor): Promise<{ uuid: string; actor: ActivityActor }> {
    const validatedUuid = await this.validate<{ uuid: string }>(deleteActionSchema, { uuid });

    await ActionModelFactory();
    this.actionData = await ActionModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.actionData) {
      throw new NotFoundException("Action not found")
    }
    this.beforeData = ActionModel.toApi(this.actionData?.toJSON());

    return { uuid: validatedUuid.uuid, actor: actor ?? null };
  }

  protected async execute(context: { uuid: string; actor: ActivityActor }): Promise<boolean> {
    const { uuid } = context;
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

  protected async postExec(
    result: boolean,
    context?: { uuid: string; actor: ActivityActor },
  ): Promise<boolean> {
    if (result) {
      void recordActivityLog({
        actor: context?.actor ?? null,
        operation: "delete",
        entity: "action",
        entity_uuid: context?.uuid ?? null,
        origin: this.beforeData ?? null,
        updated: null,
      });
    }
    return super.postExec(result, context);
  }
}
