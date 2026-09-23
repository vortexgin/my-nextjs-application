import Joi from "joi";
import MenuModelFactory, { MenuModel, type Menu } from "@/app/base/models/MenuModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";
import NotFoundException from "@/exceptions/NotFoundException";

const getMenuSchema = Joi.object({
  uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export class MenuGetUseCase extends BaseUseCase<string, Menu | null, string> {

  private menuData?: MenuModel | null;

  protected async preExec(uuid: string): Promise<string> {
    const validatedUuid = await this.validate<{ uuid: string }>(getMenuSchema, { uuid });

    await MenuModelFactory();
    this.menuData = await MenuModel.findOne({ where: { uuid: validatedUuid.uuid, deleted_at: null } });
    if (!this.menuData) {
      throw new NotFoundException("Menu not found")
    }

    return validatedUuid.uuid;
  }

  protected async execute(): Promise<Menu | null> {
    return await MenuModel.toApi(this.menuData?.toJSON());
  }
}
