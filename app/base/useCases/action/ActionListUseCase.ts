import Joi from "joi";
import { Op } from "sequelize";
import ActionModelFactory, { type Action } from "@/app/base/models/ActionModel";
import { escapeLike } from "@/libraries/String";
import { BaseUseCase } from "@/useCases/BaseUseCase";

export type ListActionsFilter = {
  q?: string;
  action?: string;
};

export type ListActionsInput = {
  filter?: ListActionsFilter;
  sortProperty?: string;
  sortDirection?: string;
  offset?: unknown;
  limit?: unknown;
};

export type ListActionsQuery = {
  q?: string;
  action?: string;
  sortProperty: string;
  sortDirection: "ASC" | "DESC";
  offset: number;
  limit: number;
};

const SORTABLE_COLUMNS: Record<string, string> = {
  uuid: "uuid",
  action: "action",
  description: "description",
  status: "status",
  created_at: "created_at",
  updated_at: "updated_at",
};

const listActionsSchema = Joi.object({
  filter: Joi.object({
    q: Joi.string().trim().allow("").optional(),
    action: Joi.string().trim().allow("").optional(),
  }).optional(),
  sortProperty: Joi.string()
    .valid(...Object.keys(SORTABLE_COLUMNS))
    .insensitive()
    .default("created_at"),
  sortDirection: Joi.string().valid("asc", "desc").insensitive().default("desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export class ActionListUseCase extends BaseUseCase<ListActionsInput | void, Action[], ListActionsQuery> {
  protected async preExec(input?: ListActionsInput | void): Promise<ListActionsQuery> {
    const validated = await this.validate<{
      filter?: ListActionsFilter;
      sortProperty: string;
      sortDirection: string;
      offset: number;
      limit: number;
    }>(listActionsSchema, input ?? {});
    const filter = validated.filter ?? {};

    return {
      q: filter.q?.trim() || undefined,
      action: filter.action?.trim().toLowerCase() || undefined,
      sortProperty: SORTABLE_COLUMNS[validated.sortProperty.toLowerCase()] ?? "created_at",
      sortDirection: validated.sortDirection.toUpperCase() as "ASC" | "DESC",
      offset: validated.offset,
      limit: validated.limit,
    };
  }

  protected async execute(context: ListActionsQuery): Promise<Action[]> {
    const ActionModel = await ActionModelFactory();
    const conditions: Record<string, unknown>[] = [{ deleted_at: null }];

    if (context.action) {
      conditions.push({ action: context.action });
    }

    if (context.q) {
      const pattern = `%${escapeLike(context.q)}%`;
      conditions.push({
        [Op.or]: [{ action: { [Op.iLike]: pattern } }, { description: { [Op.iLike]: pattern } }],
      });
    }

    const actions = await ActionModel.findAll({
      where: { [Op.and]: conditions },
      order: [[context.sortProperty, context.sortDirection]],
      offset: context.offset,
      limit: context.limit,
    });

    return actions.map((action) => ActionModel.toApi(action.toJSON()));
  }
}
