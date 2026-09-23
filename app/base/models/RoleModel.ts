import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";
import PermissionModelFactory, { PermissionModel } from "@/app/base/models/PermissionModel";

export type RoleStatus = "active" | "inactive" | "deleted";

export type Role = {
  uuid: string;
  name: string;
  slug: string;
  status: RoleStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  permissions: string[];
};

export type CreateRoleInput = {
  name: string;
  slug: string;
  status?: RoleStatus;
  action_ids?: string[];
};

export type UpdateRoleInput = Partial<CreateRoleInput>;

type GrantWithAction = PermissionModel & { action?: ActionModel | null };

export type RoleModelAttributes = Partial<Omit<Role, "created_at" | "updated_at" | "deleted_at" | "permissions">> & {
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type RoleModelCreationAttributes = Partial<RoleModelAttributes>;

export class RoleModel extends Model<RoleModelAttributes, RoleModelCreationAttributes> {
  declare uuid: string;
  declare name: string;
  declare slug: string;
  declare status: "active" | "inactive" | "deleted";
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  static async toApi(role: any): Promise<Role> {
    return {
      uuid: role.uuid,
      name: role.name,
      slug: role.slug,
      status: role.status,
      created_at: role.created_at ? new Date(role.created_at).toISOString() : new Date().toISOString(),
      updated_at: role.updated_at ? new Date(role.updated_at).toISOString() : new Date().toISOString(),
      deleted_at: role.deleted_at ? new Date(role.deleted_at).toISOString() : null,
      permissions: await RoleModel.resolvePermissions(role?.uuid),
    };
  }

  static async resolvePermissions(roleUuid: string | undefined): Promise<string[]> {
    if (!roleUuid) {
      return [];
    }

    await PermissionModelFactory();
    await ActionModelFactory();

    const grants = (await PermissionModel.findAll({
      where: { role_id: roleUuid },
      include: [
        {
          model: ActionModel,
          as: "action",
          where: { status: "active", deleted_at: null },
          attributes: ["action"],
        },
      ],
      order: [[{ model: ActionModel, as: "action" }, "action", "ASC"]],
    })) as GrantWithAction[];

    return grants
      .map((grant) => grant.action?.action)
      .filter((action): action is string => typeof action === "string");
  }
}

export async function getRoleModel(): Promise<typeof RoleModel> {
  const sequelize = await getSequelizeInstance();

  if (!(RoleModel as any).initialized) {
    RoleModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(160),
          allowNull: false,
          unique: true,
        },
        status: {
          type: DataTypes.ENUM("active", "inactive", "deleted"),
          allowNull: false,
          defaultValue: "active",
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
      },
      {
        sequelize,
        modelName: "Role",
        tableName: "roles",
        timestamps: false,
        underscored: true,
      },
    );

    (RoleModel as any).initialized = true;
  }

  return RoleModel;
}

export default async function RoleModelFactory() {
  return getRoleModel();
}
