import Joi from "joi";
import ActivityLogModelFactory, { type ActivityLog } from "@/app/base/models/ActivityLogModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";

export type ListActivityLogsFilter = {
  entity?: string;
  entity_uuid?: string;
};

export type ListActivityLogsInput = {
  filter?: ListActivityLogsFilter;
  sortProperty?: string;
  sortDirection?: string;
  offset?: unknown;
  limit?: unknown;
};

export type ListActivityLogsQuery = {
  entity?: string;
  entity_uuid?: string;
  sortProperty: string;
  sortDirection: "ASC" | "DESC";
  offset: number;
  limit: number;
};

const SORTABLE_COLUMNS: Record<string, string> = {
  uuid: "uuid",
  operation: "operation",
  entity: "entity",
  created_at: "created_at",
};

const listActivityLogsSchema = Joi.object({
  filter: Joi.object({
    entity: Joi.string().trim().allow("").optional(),
    entity_uuid: Joi.string().uuid({ version: "uuidv4" }).optional(),
  }).optional(),
  sortProperty: Joi.string()
    .valid(...Object.keys(SORTABLE_COLUMNS))
    .insensitive()
    .default("created_at"),
  sortDirection: Joi.string().valid("asc", "desc").insensitive().default("desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

export class ActivityLogListUseCase extends BaseUseCase<
  ListActivityLogsInput | void,
  ActivityLog[],
  ListActivityLogsQuery
> {
  protected async preExec(input?: ListActivityLogsInput | void): Promise<ListActivityLogsQuery> {
    const validated = await this.validate<{
      filter?: ListActivityLogsFilter;
      sortProperty: string;
      sortDirection: string;
      offset: number;
      limit: number;
    }>(listActivityLogsSchema, input ?? {});
    const filter = validated.filter ?? {};

    return {
      entity: filter.entity?.trim() || undefined,
      entity_uuid: filter.entity_uuid || undefined,
      sortProperty: SORTABLE_COLUMNS[validated.sortProperty.toLowerCase()] ?? "created_at",
      sortDirection: validated.sortDirection.toUpperCase() as "ASC" | "DESC",
      offset: validated.offset,
      limit: validated.limit,
    };
  }

  protected async execute(context: ListActivityLogsQuery): Promise<ActivityLog[]> {
    const ActivityLogModel = await ActivityLogModelFactory();
    const conditions: Record<string, unknown>[] = [];

    if (context.entity) {
      conditions.push({ entity: context.entity });
    }

    if (context.entity_uuid) {
      conditions.push({ entity_uuid: context.entity_uuid });
    }

    const logs = await ActivityLogModel.findAll({
      where: conditions.length > 0 ? conditions.reduce((acc, cond) => ({ ...acc, ...cond }), {}) : {},
      order: [[context.sortProperty, context.sortDirection]],
      offset: context.offset,
      limit: context.limit,
    });

    return logs.map((log) => ActivityLogModel.toApi(log.toJSON()));
  }
}
