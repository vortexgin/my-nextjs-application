import Joi from "joi";
import MenuModelFactory, { MenuModel, type Menu } from "@/app/base/models/MenuModel";
import { recordActivityLog, type ActivityActor } from "@/app/base/models/ActivityLogModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const deleteMenuSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class MenuDeleteUseCase extends BaseUseCase<string, boolean, { uuid: string; actor: ActivityActor }> {

  private menuData?: MenuModel | null;
  private beforeData?: Menu | null;

  protected async preExec(uuid: string, actor?: ActivityActor): Promise<{ uuid: string; actor: ActivityActor }> {
    const validatedUuid = await this.validate<{ uuid: string }>(deleteMenuSchema, { uuid });

    await MenuModelFactory();
    this.menuData = await MenuModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.menuData) {
      throw new NotFoundException("Menu not found")
    }
    this.beforeData = await MenuModel.toApi(this.menuData?.toJSON());

    return { uuid: validatedUuid.uuid, actor: actor ?? null };
  }

  protected async execute(context: { uuid: string; actor: ActivityActor }): Promise<boolean> {
    const { uuid } = context;
    await MenuModelFactory();
    const [affectedRows] = await MenuModel.update(
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
        entity: "menu",
        entity_uuid: context?.uuid ?? null,
        origin: this.beforeData ?? null,
        updated: null,
      });
    }
    return super.postExec(result, context);
  }
}
