import Joi from "joi";
import { Op } from "sequelize";
import MenuModelFactory, { type Menu } from "@/app/base/models/MenuModel";
import { escapeLike } from "@/libraries/String";
import { BaseUseCase } from "@/useCases/BaseUseCase";

export type ListMenusFilter = {
  q?: string;
  menu?: string;
  action_id?: string;
  parent?: string;
};

export type ListMenusInput = {
  filter?: ListMenusFilter;
  sortProperty?: string;
  sortDirection?: string;
  offset?: unknown;
  limit?: unknown;
};

export type ListMenusQuery = {
  q?: string;
  menu?: string;
  action_id?: string;
  parent?: string;
  sortProperty: string;
  sortDirection: "ASC" | "DESC";
  offset: number;
  limit: number;
};

const SORTABLE_COLUMNS: Record<string, string> = {
  uuid: "uuid",
  icon: "icon",
  parent: "parent",
  menu: "menu",
  action_id: "action_id",
  description: "description",
  redirection: "redirection",
  status: "status",
  weight: "weight",
  created_at: "created_at",
  updated_at: "updated_at",
};

const listMenusSchema = Joi.object({
  filter: Joi.object({
    q: Joi.string().trim().allow("").optional(),
    menu: Joi.string().trim().allow("").optional(),
    action_id: Joi.string().uuid({ version: "uuidv4" }).optional(),
    parent: Joi.string().uuid({ version: "uuidv4" }).optional(),
  }).optional(),
  sortProperty: Joi.string()
    .valid(...Object.keys(SORTABLE_COLUMNS))
    .insensitive()
    .default("created_at"),
  sortDirection: Joi.string().valid("asc", "desc").insensitive().default("desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export class MenuListUseCase extends BaseUseCase<ListMenusInput | void, Menu[], ListMenusQuery> {
  protected async preExec(input?: ListMenusInput | void): Promise<ListMenusQuery> {
    const validated = await this.validate<{
      filter?: ListMenusFilter;
      sortProperty: string;
      sortDirection: string;
      offset: number;
      limit: number;
    }>(listMenusSchema, input ?? {});
    const filter = validated.filter ?? {};

    return {
      q: filter.q?.trim() || undefined,
      menu: filter.menu?.trim() || undefined,
      action_id: filter.action_id || undefined,
      parent: filter.parent || undefined,
      sortProperty: SORTABLE_COLUMNS[validated.sortProperty.toLowerCase()] ?? "created_at",
      sortDirection: validated.sortDirection.toUpperCase() as "ASC" | "DESC",
      offset: validated.offset,
      limit: validated.limit,
    };
  }

  protected async execute(context: ListMenusQuery): Promise<Menu[]> {
    const MenuModel = await MenuModelFactory();
    const conditions: Record<string, unknown>[] = [{ deleted_at: null }];

    if (context.action_id) {
      conditions.push({ action_id: context.action_id });
    }

    if (context.parent) {
      conditions.push({ parent: context.parent });
    }

    if (context.menu) {
      conditions.push({ menu: { [Op.iLike]: `%${escapeLike(context.menu)}%` } });
    }

    if (context.q) {
      const pattern = `%${escapeLike(context.q)}%`;
      conditions.push({
        [Op.or]: [
          { menu: { [Op.iLike]: pattern } },
          { description: { [Op.iLike]: pattern } },
          { redirection: { [Op.iLike]: pattern } },
        ],
      });
    }

    const menus = await MenuModel.findAll({
      where: { [Op.and]: conditions },
      order: [[context.sortProperty, context.sortDirection]],
      offset: context.offset,
      limit: context.limit,
    });

    return Promise.all(menus.map((menu) => MenuModel.toApi(menu.toJSON())));
  }
}
