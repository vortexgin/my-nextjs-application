import Joi from "joi";
import { Op } from "sequelize";
import RoleModelFactory, { type Role } from "@/app/base/models/RoleModel";
import { escapeLike } from "@/libraries/String";
import { BaseUseCase } from "@/useCases/BaseUseCase";

export type ListRolesFilter = {
  q?: string;
  name?: string;
  slug?: string;
};

export type ListRolesInput = {
  filter?: ListRolesFilter;
  sortProperty?: string;
  sortDirection?: string;
  offset?: unknown;
  limit?: unknown;
};

export type ListRolesQuery = {
  q?: string;
  name?: string;
  slug?: string;
  sortProperty: string;
  sortDirection: "ASC" | "DESC";
  offset: number;
  limit: number;
};

const SORTABLE_COLUMNS: Record<string, string> = {
  uuid: "uuid",
  name: "name",
  slug: "slug",
  status: "status",
  created_at: "created_at",
  updated_at: "updated_at",
};

const listRolesSchema = Joi.object({
  filter: Joi.object({
    q: Joi.string().trim().allow("").optional(),
    name: Joi.string().trim().allow("").optional(),
    slug: Joi.string().trim().allow("").optional(),
  }).optional(),
  sortProperty: Joi.string()
    .valid(...Object.keys(SORTABLE_COLUMNS))
    .insensitive()
    .default("created_at"),
  sortDirection: Joi.string().valid("asc", "desc").insensitive().default("desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export class RoleListUseCase extends BaseUseCase<ListRolesInput | void, Role[], ListRolesQuery> {
  protected async preExec(input?: ListRolesInput | void): Promise<ListRolesQuery> {
    const validated = await this.validate<{
      filter?: ListRolesFilter;
      sortProperty: string;
      sortDirection: string;
      offset: number;
      limit: number;
    }>(listRolesSchema, input ?? {});
    const filter = validated.filter ?? {};

    return {
      q: filter.q?.trim() || undefined,
      name: filter.name?.trim() || undefined,
      slug: filter.slug?.trim().toLowerCase() || undefined,
      sortProperty: SORTABLE_COLUMNS[validated.sortProperty.toLowerCase()] ?? "created_at",
      sortDirection: validated.sortDirection.toUpperCase() as "ASC" | "DESC",
      offset: validated.offset,
      limit: validated.limit,
    };
  }

  protected async execute(context: ListRolesQuery): Promise<Role[]> {
    const RoleModel = await RoleModelFactory();
    const conditions: Record<string, unknown>[] = [{ deleted_at: null }];

    if (context.slug) {
      conditions.push({ slug: context.slug });
    }

    if (context.name) {
      conditions.push({ name: { [Op.iLike]: `%${escapeLike(context.name)}%` } });
    }

    if (context.q) {
      const pattern = `%${escapeLike(context.q)}%`;
      conditions.push({
        [Op.or]: [{ name: { [Op.iLike]: pattern } }, { slug: { [Op.iLike]: pattern } }],
      });
    }

    const roles = await RoleModel.findAll({
      where: { [Op.and]: conditions },
      order: [[context.sortProperty, context.sortDirection]],
      offset: context.offset,
      limit: context.limit,
    });

    return Promise.all(roles.map((role) => RoleModel.toApi(role.toJSON())));
  }
}
