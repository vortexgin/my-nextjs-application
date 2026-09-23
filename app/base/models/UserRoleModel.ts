import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";

export type UserRole = {
  uuid: string;
  user_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
};

export type CreateUserRoleInput = {
  user_id: string;
  role_id: string;
};

export type UpdateUserRoleInput = Partial<CreateUserRoleInput>;

export type UserRoleModelAttributes = Partial<Omit<UserRole, "created_at" | "updated_at">> & {
  created_at: Date;
  updated_at: Date;
};

export type UserRoleModelCreationAttributes = Partial<UserRoleModelAttributes>;

export class UserRoleModel extends Model<UserRoleModelAttributes, UserRoleModelCreationAttributes> {
  declare uuid: string;
  declare user_id: string;
  declare role_id: string;
  declare created_at: Date;
  declare updated_at: Date;

  static toApi(userRole: any): UserRole {
    return {
      uuid: userRole.uuid,
      user_id: userRole.user_id,
      role_id: userRole.role_id,
      created_at: userRole.created_at ? new Date(userRole.created_at).toISOString() : new Date().toISOString(),
      updated_at: userRole.updated_at ? new Date(userRole.updated_at).toISOString() : new Date().toISOString(),
    };
  }
}

export async function getUserRoleModel(): Promise<typeof UserRoleModel> {
  const sequelize = await getSequelizeInstance();

  if (!(UserRoleModel as any).initialized) {
    UserRoleModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          references: { model: "users", key: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        role_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "roles", key: "uuid" },
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
        modelName: "UserRole",
        tableName: "user_roles",
        timestamps: false,
        underscored: true,
      },
    );

    const { getUserModel } = await import("@/app/base/models/UserModel");
    const { getRoleModel } = await import("@/app/base/models/RoleModel");
    UserRoleModel.belongsTo(await getUserModel(), { foreignKey: "user_id", targetKey: "uuid", as: "user" });
    UserRoleModel.belongsTo(await getRoleModel(), { foreignKey: "role_id", targetKey: "uuid", as: "role" });

    (UserRoleModel as any).initialized = true;
  }

  return UserRoleModel;
}

export default async function UserRoleModelFactory() {
  return getUserRoleModel();
}
