import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";

export type Permission = {
  uuid: string;
  role_id: string;
  action_id: string;
  created_at: string;
  updated_at: string;
};

export type CreatePermissionInput = {
  role_id: string;
  action_id: string;
};

export type UpdatePermissionInput = Partial<CreatePermissionInput>;

export type PermissionModelAttributes = Partial<Omit<Permission, "created_at" | "updated_at">> & {
  created_at: Date;
  updated_at: Date;
};

export type PermissionModelCreationAttributes = Partial<PermissionModelAttributes>;

export class PermissionModel extends Model<PermissionModelAttributes, PermissionModelCreationAttributes> {
  declare uuid: string;
  declare role_id: string;
  declare action_id: string;
  declare created_at: Date;
  declare updated_at: Date;

  static toApi(permission: any): Permission {
    return {
      uuid: permission.uuid,
      role_id: permission.role_id,
      action_id: permission.action_id,
      created_at: permission.created_at ? new Date(permission.created_at).toISOString() : new Date().toISOString(),
      updated_at: permission.updated_at ? new Date(permission.updated_at).toISOString() : new Date().toISOString(),
    };
  }
}

let permissionModelPromise: Promise<typeof PermissionModel> | null = null;

export async function getPermissionModel(): Promise<typeof PermissionModel> {
  if ((PermissionModel as any).initialized) {
    return PermissionModel;
  }
  if (!permissionModelPromise) {
    permissionModelPromise = initPermissionModel().catch((error) => {
      permissionModelPromise = null;
      throw error;
    });
  }
  return permissionModelPromise;
}

async function initPermissionModel(): Promise<typeof PermissionModel> {
  const sequelize = await getSequelizeInstance();

  {
    PermissionModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        role_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "base_roles", key: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        action_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "base_actions", key: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
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
      },
      {
        sequelize,
        modelName: "Permission",
        tableName: "base_permissions",
        timestamps: false,
        underscored: true,
      },
    );

    const { getRoleModel } = await import("@/app/base/models/RoleModel");
    const { getActionModel } = await import("@/app/base/models/ActionModel");
    PermissionModel.belongsTo(await getRoleModel(), { foreignKey: "role_id", targetKey: "uuid", as: "role" });
    PermissionModel.belongsTo(await getActionModel(), { foreignKey: "action_id", targetKey: "uuid", as: "action" });

    (PermissionModel as any).initialized = true;
  }
  return PermissionModel;
}

export default async function PermissionModelFactory() {
  return getPermissionModel();
}
