import Joi from "joi";
import { Op } from "sequelize";
import UserModelFactory, { type User } from "@/app/base/models/UserModel";
import { escapeLike } from "@/libraries/String";
import { BaseUseCase } from "@/useCases/BaseUseCase";

export type ListUsersFilter = {
  q?: string;
  name?: string;
  email?: string;
  phone?: string;
};

export type ListUsersInput = {
  filter?: ListUsersFilter;
  sortProperty?: string;
  sortDirection?: string;
  offset?: unknown;
  limit?: unknown;
};

export type ListUsersQuery = {
  q?: string;
  name?: string;
  email?: string;
  phone?: string;
  sortProperty: string;
  sortDirection: "ASC" | "DESC";
  offset: number;
  limit: number;
};

const SORTABLE_COLUMNS: Record<string, string> = {
  uuid: "uuid",
  name: "name",
  email: "email",
  phone: "phone_number",
  phone_number: "phone_number",
  status: "status",
  created_at: "created_at",
  updated_at: "updated_at",
};

const listUsersSchema = Joi.object({
  filter: Joi.object({
    q: Joi.string().trim().allow("").optional(),
    name: Joi.string().trim().allow("").optional(),
    email: Joi.string().trim().allow("").optional(),
    phone: Joi.string().trim().allow("").optional(),
  }).optional(),
  sortProperty: Joi.string()
    .valid(...Object.keys(SORTABLE_COLUMNS))
    .insensitive()
    .default("created_at"),
  sortDirection: Joi.string().valid("asc", "desc").insensitive().default("desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export class UserListUseCase extends BaseUseCase<ListUsersInput | void, User[], ListUsersQuery> {
  protected async preExec(input?: ListUsersInput | void): Promise<ListUsersQuery> {
    const validated = await this.validate<{
      filter?: ListUsersFilter;
      sortProperty: string;
      sortDirection: string;
      offset: number;
      limit: number;
    }>(listUsersSchema, input ?? {});
    const filter = validated.filter ?? {};

    return {
      q: filter.q?.trim() || undefined,
      name: filter.name?.trim() || undefined,
      email: filter.email?.trim().toLowerCase() || undefined,
      phone: filter.phone?.trim() || undefined,
      sortProperty: SORTABLE_COLUMNS[validated.sortProperty.toLowerCase()] ?? "created_at",
      sortDirection: validated.sortDirection.toUpperCase() as "ASC" | "DESC",
      offset: validated.offset,
      limit: validated.limit,
    };
  }

  protected async execute(context: ListUsersQuery): Promise<User[]> {
    const UserModel = await UserModelFactory();
    const conditions: Record<string, unknown>[] = [{ deleted_at: null }];

    if (context.email) {
      conditions.push({ email: context.email });
    }

    if (context.phone) {
      conditions.push({ phone_number: context.phone });
    }

    if (context.name) {
      conditions.push({ name: { [Op.iLike]: `%${escapeLike(context.name)}%` } });
    }

    if (context.q) {
      const pattern = `%${escapeLike(context.q)}%`;
      conditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: pattern } },
          { email: { [Op.iLike]: pattern } },
          { phone_number: { [Op.iLike]: pattern } },
        ],
      });
    }

    const users = await UserModel.findAll({
      where: { [Op.and]: conditions },
      order: [[context.sortProperty, context.sortDirection]],
      offset: context.offset,
      limit: context.limit,
    });

    return Promise.all(users.map((user) => UserModel.toApi(user.toJSON())));
  }
}
