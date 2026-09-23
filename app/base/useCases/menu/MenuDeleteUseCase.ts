import Joi from "joi";
import MenuModelFactory, { MenuModel } from "@/app/base/models/MenuModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const deleteMenuSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class MenuDeleteUseCase extends BaseUseCase<string, boolean, string> {

  private menuData?: MenuModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(deleteMenuSchema, { uuid });

    await MenuModelFactory();
    this.menuData = await MenuModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.menuData) {
      throw new NotFoundException("Menu not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(uuid: string): Promise<boolean> {
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
}
