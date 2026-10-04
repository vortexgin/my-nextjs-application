import Joi from "joi";
import { Op } from "sequelize";
import ActivityLogModelFactory, { type ActivityLog } from "@/app/base/models/ActivityLogModel";
import { BaseUseCase } from "@/useCases/BaseUseCase";

export type ListActivityLogsFilter = {
  entity?: string;
  entities?: string;
  entity_uuid?: string;
  entity_uuids?: string;
};

export type ListActivityLogsInput = {
  filter?: ListActivityLogsFilter;
  sortProperty?: string;
  sortDirection?: string;
  offset?: unknown;
  limit?: unknown;
};

export type ListActivityLogsQuery = {
  entities?: string[];
  entity_uuids?: string[];
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

function splitList(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? [...new Set(parts)] : undefined;
}

const listActivityLogsSchema = Joi.object({
  filter: Joi.object({
    entity: Joi.string().trim().allow("").optional(),
    entities: Joi.string().trim().allow("").optional(),
    entity_uuid: Joi.string().trim().allow("").optional(),
    entity_uuids: Joi.string().trim().allow("").optional(),
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

    // Backward compatible: `filter[entity]` / `filter[entity_uuid]` accept
    // single values OR comma-separated lists. Plural aliases supported too.
    const rawEntities = [filter.entity, filter.entities].filter(Boolean).join(",");
    const rawUuids = [filter.entity_uuid, filter.entity_uuids].filter(Boolean).join(",");

    return {
      entities: splitList(rawEntities),
      entity_uuids: splitList(rawUuids),
      sortProperty: SORTABLE_COLUMNS[validated.sortProperty.toLowerCase()] ?? "created_at",
      sortDirection: validated.sortDirection.toUpperCase() as "ASC" | "DESC",
      offset: validated.offset,
      limit: validated.limit,
    };
  }

  protected async execute(context: ListActivityLogsQuery): Promise<ActivityLog[]> {
    const ActivityLogModel = await ActivityLogModelFactory();
    const conditions: Record<string, unknown> = {};

    if (context.entities && context.entities.length > 0) {
      conditions.entity = context.entities.length === 1 ? context.entities[0] : { [Op.in]: context.entities };
    }

    if (context.entity_uuids && context.entity_uuids.length > 0) {
      conditions.entity_uuid =
        context.entity_uuids.length === 1 ? context.entity_uuids[0] : { [Op.in]: context.entity_uuids };
    }

    const logs = await ActivityLogModel.findAll({
      where: conditions,
      order: [[context.sortProperty, context.sortDirection]],
      offset: context.offset,
      limit: context.limit,
    });

    return logs.map((log) => ActivityLogModel.toApi(log.toJSON()));
  }
}
